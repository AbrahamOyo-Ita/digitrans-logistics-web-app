-- Durable, transactionally enqueued customer and rider lifecycle emails.
-- The outbox stores event facts only; recipient addresses are resolved at send time.

CREATE TABLE public.transactional_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'delivery_order_placed','delivery_status','rider_assignment','payment_confirmed','payment_review','market_run_status','waybill_status'
  )),
  entity_type text NOT NULL CHECK (entity_type IN ('delivery','delivery_assignment','payment','market_run','waybill')),
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','skipped')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX transactional_email_outbox_ready_idx
  ON public.transactional_email_outbox (available_at,created_at)
  WHERE status IN ('pending','processing');
CREATE INDEX transactional_email_outbox_entity_idx
  ON public.transactional_email_outbox (entity_type,entity_id,created_at DESC);
CREATE UNIQUE INDEX transactional_email_outbox_payment_event_uq
  ON public.transactional_email_outbox (entity_id,event_type)
  WHERE entity_type='payment';
ALTER TABLE public.transactional_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.transactional_email_outbox FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.transactional_email_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_delivery_transactional_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_recipient uuid;
BEGIN
  v_recipient := COALESCE(NEW.customer_id,NEW.vendor_id);
  IF v_recipient IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.transactional_email_outbox(recipient_user_id,event_type,entity_type,entity_id,payload)
    VALUES (v_recipient,'delivery_order_placed','delivery',NEW.id,
      jsonb_build_object(
        'reference',NEW.reference,'status',NEW.status,'fee',NEW.fee,
        'timing',NEW.timing,'scheduledAt',NEW.scheduled_at
      ));
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'assigned' THEN
    -- Assignment notices are queued by the assignment trigger below so reassignment
    -- sends one customer update even when the delivery was already marked assigned.
    INSERT INTO public.transactional_email_outbox(recipient_user_id,event_type,entity_type,entity_id,payload)
    VALUES (v_recipient,'delivery_status','delivery',NEW.id,
      jsonb_build_object(
        'reference',NEW.reference,'previousStatus',OLD.status,'status',NEW.status,
        'fee',NEW.fee,'timing',NEW.timing,'scheduledAt',NEW.scheduled_at
      ));
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.enqueue_delivery_transactional_email() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER deliveries_transactional_email
  AFTER INSERT OR UPDATE OF status ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_delivery_transactional_email();

CREATE OR REPLACE FUNCTION public.enqueue_rider_assignment_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status <> 'assigned' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.transactional_email_outbox(recipient_user_id,event_type,entity_type,entity_id,payload)
  SELECT NEW.rider_id,'rider_assignment','delivery_assignment',NEW.id,
    jsonb_build_object('reference',d.reference,'assignmentReference',NEW.reference)
  FROM public.deliveries AS d
  WHERE d.id=NEW.delivery_id;
  INSERT INTO public.transactional_email_outbox(recipient_user_id,event_type,entity_type,entity_id,payload)
  SELECT COALESCE(d.customer_id,d.vendor_id),'delivery_status','delivery',d.id,
    jsonb_build_object(
      'reference',d.reference,'previousStatus',d.status,'status','assigned',
      'fee',d.fee,'timing',d.timing,'scheduledAt',d.scheduled_at
    )
  FROM public.deliveries AS d
  WHERE d.id=NEW.delivery_id AND COALESCE(d.customer_id,d.vendor_id) IS NOT NULL;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.enqueue_rider_assignment_email() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER delivery_assignments_transactional_email
  AFTER INSERT ON public.delivery_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_rider_assignment_email();

CREATE OR REPLACE FUNCTION public.enqueue_payment_transactional_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_event_type text;
  v_final_status text;
  v_recipient uuid;
  v_service_type text;
  v_service_reference text;
BEGIN
  -- The investment settlement RPC can pass through successful before entering review.
  -- Defer notification until commit and read the final row state, not an intermediate value.
  SELECT p.status INTO v_final_status FROM public.payments AS p WHERE p.id=NEW.id;
  IF v_final_status NOT IN ('successful','under_review') THEN
    RETURN NEW;
  END IF;

  v_event_type := CASE WHEN v_final_status='under_review' THEN 'payment_review' ELSE 'payment_confirmed' END;
  v_service_type := CASE
    WHEN NEW.delivery_id IS NOT NULL THEN 'delivery'
    WHEN NEW.waybill_id IS NOT NULL THEN 'waybill'
    WHEN NEW.market_run_id IS NOT NULL THEN 'market_run'
    WHEN NEW.investment_application_id IS NOT NULL OR NEW.investment_id IS NOT NULL THEN 'investment'
    ELSE 'payment'
  END;
  v_service_reference := COALESCE(
    (SELECT d.reference FROM public.deliveries AS d WHERE d.id=NEW.delivery_id),
    (SELECT COALESCE(w.waybill_number,w.reference) FROM public.waybills AS w WHERE w.id=NEW.waybill_id),
    (SELECT m.reference FROM public.market_runs AS m WHERE m.id=NEW.market_run_id),
    (SELECT a.reference FROM public.investment_applications AS a WHERE a.id=NEW.investment_application_id),
    (SELECT a.reference FROM public.investments AS i JOIN public.investment_applications AS a ON a.id=i.application_id WHERE i.id=NEW.investment_id)
  );
  v_recipient := COALESCE(
    NEW.user_id,
    (SELECT d.customer_id FROM public.deliveries AS d WHERE d.id=NEW.delivery_id),
    (SELECT w.customer_id FROM public.waybills AS w WHERE w.id=NEW.waybill_id),
    (SELECT m.customer_id FROM public.market_runs AS m WHERE m.id=NEW.market_run_id),
    (SELECT a.investor_id FROM public.investment_applications AS a WHERE a.id=NEW.investment_application_id),
    (SELECT i.investor_id FROM public.investments AS i WHERE i.id=NEW.investment_id)
  );
  IF v_recipient IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.transactional_email_outbox(recipient_user_id,event_type,entity_type,entity_id,payload)
  VALUES (v_recipient,v_event_type,'payment',NEW.id,
    jsonb_build_object(
      'paymentReference',NEW.reference,'amount',NEW.amount,'serviceType',v_service_type,
      'serviceReference',v_service_reference,'status',v_final_status
    ))
  ON CONFLICT (entity_id,event_type) WHERE entity_type='payment' DO NOTHING;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.enqueue_payment_transactional_email() FROM PUBLIC,anon,authenticated;
CREATE CONSTRAINT TRIGGER payments_transactional_email
  AFTER INSERT OR UPDATE OF status ON public.payments
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_payment_transactional_email();

CREATE OR REPLACE FUNCTION public.enqueue_market_run_transactional_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.transactional_email_outbox(recipient_user_id,event_type,entity_type,entity_id,payload)
  VALUES (NEW.customer_id,'market_run_status','market_run',NEW.id,
    jsonb_build_object(
      'reference',NEW.reference,'previousStatus',CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,
      'status',NEW.status,'finalTotal',NEW.final_total,'serviceFee',NEW.service_fee
    ));
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.enqueue_market_run_transactional_email() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER market_runs_transactional_email
  AFTER INSERT OR UPDATE OF status ON public.market_runs
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_market_run_transactional_email();

CREATE OR REPLACE FUNCTION public.enqueue_waybill_transactional_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  -- Payment confirmation is emitted from the payment row so a paid milestone does not send twice.
  IF NEW.status='paid' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.transactional_email_outbox(recipient_user_id,event_type,entity_type,entity_id,payload)
  VALUES (NEW.customer_id,'waybill_status','waybill',NEW.id,
    jsonb_build_object(
      'reference',NEW.reference,'waybillNumber',NEW.waybill_number,'origin',NEW.origin,
      'destinationCity',NEW.destination_city,'previousStatus',CASE WHEN TG_OP='UPDATE' THEN OLD.status ELSE NULL END,
      'status',NEW.status,'fee',NEW.fee
    ));
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.enqueue_waybill_transactional_email() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER waybills_transactional_email
  AFTER INSERT OR UPDATE OF status ON public.waybills
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_waybill_transactional_email();
