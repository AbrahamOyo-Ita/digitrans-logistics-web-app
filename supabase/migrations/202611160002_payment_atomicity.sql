-- Atomic, retry-safe Paystack settlement entrypoints.
-- Invoke only after validating the Paystack signature (webhook) or verifying the transaction with Paystack's API.

CREATE TABLE public.payment_provider_events (
  provider text NOT NULL CHECK (provider = 'paystack'),
  event_id text NOT NULL CHECK (length(event_id) BETWEEN 1 AND 200),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  payment_id text REFERENCES public.payments(id),
  outcome jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  PRIMARY KEY (provider, event_id)
);
ALTER TABLE public.payment_provider_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_provider_events FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_verified_paystack_payment(
  p_payment_id text,
  p_provider_reference text,
  p_amount_kobo bigint,
  p_currency text,
  p_provider_event_id text,
  p_payload_sha256 text,
  p_actor_id uuid DEFAULT NULL,
  p_actor_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_event public.payment_provider_events%ROWTYPE;
  v_application public.investment_applications%ROWTYPE;
  v_opportunity public.opportunities%ROWTYPE;
  v_waybill public.waybills%ROWTYPE;
  v_event_id text;
  v_investment_id text;
  v_result jsonb;
  v_capacity_review boolean := false;
  v_start_date date := CURRENT_DATE;
  v_maturity_date date;
  v_subscribed bigint;
BEGIN
  IF p_payment_id IS NULL OR length(p_payment_id) = 0
     OR p_provider_reference IS NULL OR length(p_provider_reference) NOT BETWEEN 1 AND 200
     OR p_payload_sha256 IS NULL OR p_payload_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid payment event.' USING ERRCODE = '22023';
  END IF;
  IF upper(COALESCE(p_currency, '')) <> 'NGN' OR p_amount_kobo IS NULL OR p_amount_kobo < 0 THEN
    RAISE EXCEPTION 'Payment currency or amount is invalid.' USING ERRCODE = '22023';
  END IF;

  v_event_id := COALESCE(NULLIF(p_provider_event_id, ''), p_provider_reference || ':charge.success');
  IF length(v_event_id) > 200 THEN
    RAISE EXCEPTION 'Provider event ID is invalid.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.payment_provider_events(provider,event_id,payload_sha256)
    VALUES ('paystack',v_event_id,p_payload_sha256)
    ON CONFLICT (provider,event_id) DO NOTHING;
  SELECT * INTO v_event
    FROM public.payment_provider_events
    WHERE provider='paystack' AND event_id=v_event_id
    FOR UPDATE;
  IF v_event.payload_sha256 <> p_payload_sha256 THEN
    RAISE EXCEPTION 'Provider event ID was reused with a different payload.' USING ERRCODE = '22000';
  END IF;
  IF v_event.payment_id IS NOT NULL AND v_event.payment_id <> p_payment_id THEN
    RAISE EXCEPTION 'Provider event is already linked to another payment.' USING ERRCODE = '22000';
  END IF;
  IF v_event.processed_at IS NOT NULL THEN
    RETURN COALESCE(v_event.outcome,'{}'::jsonb) || jsonb_build_object('duplicate',true);
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id=p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment was not found.' USING ERRCODE = 'P0002';
  END IF;
  IF v_payment.provider <> 'paystack' THEN
    RAISE EXCEPTION 'Payment provider does not match.' USING ERRCODE = '22023';
  END IF;
  IF p_provider_reference <> COALESCE(NULLIF(v_payment.provider_ref,''),v_payment.reference) THEN
    RAISE EXCEPTION 'Provider reference does not match the payment.' USING ERRCODE = '22023';
  END IF;
  IF p_amount_kobo <> v_payment.amount * 100 THEN
    RAISE EXCEPTION 'Provider amount does not match the expected payment.' USING ERRCODE = '22023';
  END IF;
  IF v_payment.status IN ('successful','under_review') THEN
    v_result := jsonb_build_object(
      'duplicate',true,
      'paymentId',v_payment.id,
      'underReview',v_payment.status='under_review',
      'status',v_payment.status
    );
    UPDATE public.payment_provider_events
      SET payment_id=v_payment.id,outcome=v_result,processed_at=now()
      WHERE provider='paystack' AND event_id=v_event_id;
    RETURN v_result;
  END IF;
  IF v_payment.status NOT IN ('pending','initiated') THEN
    RAISE EXCEPTION 'Payment cannot be completed from its current state.' USING ERRCODE = '55000';
  END IF;

  UPDATE public.payments
    SET status='successful',provider_ref=COALESCE(NULLIF(p_provider_reference,''),provider_ref),updated_at=now()
    WHERE id=v_payment.id;

  IF v_payment.delivery_id IS NOT NULL THEN
    UPDATE public.deliveries SET payment_status='successful',updated_at=now() WHERE id=v_payment.delivery_id;
  END IF;

  IF v_payment.waybill_id IS NOT NULL THEN
    SELECT * INTO v_waybill FROM public.waybills WHERE id=v_payment.waybill_id FOR UPDATE;
    IF FOUND THEN
      IF v_waybill.status IN ('awaiting_payment','parcel_received') THEN
        UPDATE public.waybills SET payment_status='successful',status='paid',updated_at=now() WHERE id=v_waybill.id;
        INSERT INTO public.waybill_tracking_events(id,waybill_id,status,location,notes)
          VALUES (gen_random_uuid()::text,v_waybill.id,'paid',v_waybill.destination_city,'Payment verified by provider');
      ELSE
        UPDATE public.waybills SET payment_status='successful',updated_at=now() WHERE id=v_waybill.id;
      END IF;
    END IF;
  END IF;

  IF v_payment.market_run_id IS NOT NULL THEN
    UPDATE public.market_runs
      SET status='agent_assigned',updated_at=now()
      WHERE id=v_payment.market_run_id AND status='approved' AND agent_id IS NOT NULL;
  END IF;

  IF v_payment.investment_application_id IS NOT NULL THEN
    SELECT * INTO v_application
      FROM public.investment_applications
      WHERE id=v_payment.investment_application_id
      FOR UPDATE;
    IF NOT FOUND OR v_application.status <> 'approved' THEN
      RAISE EXCEPTION 'Investment application is not approved for funding.' USING ERRCODE = '55000';
    END IF;
    SELECT * INTO v_opportunity
      FROM public.opportunities
      WHERE id=v_application.opportunity_id
      FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Investment opportunity was not found.' USING ERRCODE = 'P0002';
    END IF;

    v_subscribed := COALESCE(v_opportunity.subscribed,0);
    IF v_opportunity.capacity IS NOT NULL AND v_opportunity.capacity <> 0
       AND v_subscribed + v_application.amount > v_opportunity.capacity THEN
      v_capacity_review := true;
      UPDATE public.payments SET status='under_review' WHERE id=v_payment.id;
      UPDATE public.investment_applications SET status='under_review' WHERE id=v_application.id;
      INSERT INTO public.financial_ledger(id,reference,type,amount,related_id,related_type,description)
        VALUES (gen_random_uuid()::text,'LED-PAY-'||v_payment.reference,'investment_funding_review',v_payment.amount,
          v_payment.id,'payment','Verified funds pending capacity review');
      INSERT INTO public.notifications(id,user_id,title,message,type,related_id)
        VALUES (gen_random_uuid()::text,v_application.investor_id,'Investment payment review',
          'Your payment for '||v_application.reference||' was received, but capacity requires an operations review.',
          'investment',v_application.id);
    ELSE
      v_investment_id := gen_random_uuid()::text;
      v_maturity_date := (v_start_date + make_interval(months => COALESCE(NULLIF(v_opportunity.duration_months,0),6)))::date;
      INSERT INTO public.investments(id,application_id,investor_id,opportunity_id,principal,start_date,maturity_date,status)
        VALUES (v_investment_id,v_application.id,v_application.investor_id,v_application.opportunity_id,
          v_application.amount,v_start_date::text,v_maturity_date::text,'active');
      INSERT INTO public.investment_earnings(id,investment_id,projected_amount,actual_amount,type,reference)
        VALUES (gen_random_uuid()::text,v_investment_id,
          round(v_application.amount * COALESCE(v_opportunity.projected_return_pct,0) / 100.0)::bigint,
          0,'projected','PROJ-'||v_application.reference);
      UPDATE public.investment_applications SET status='funded' WHERE id=v_application.id;
      UPDATE public.opportunities
        SET subscribed=COALESCE(subscribed,0)+v_application.amount
        WHERE id=v_opportunity.id
        RETURNING subscribed INTO v_subscribed;
      IF v_opportunity.capacity IS NOT NULL AND v_opportunity.capacity <> 0
         AND v_subscribed >= v_opportunity.capacity THEN
        UPDATE public.opportunities SET status='fully_subscribed'
          WHERE id=v_opportunity.id AND status='published';
      END IF;
      INSERT INTO public.financial_ledger(id,reference,type,amount,related_id,related_type,description)
        VALUES (gen_random_uuid()::text,'LED-'||v_payment.reference,'investment_funding',v_application.amount,
          v_investment_id,'investment','Verified investment funding '||v_payment.reference);
      INSERT INTO public.notifications(id,user_id,title,message,type,related_id)
        VALUES (gen_random_uuid()::text,v_application.investor_id,'Investment funded',
          'Investment '||v_application.reference||' is active. Projected earnings are estimates, not guaranteed returns.',
          'investment',v_investment_id);
    END IF;
  END IF;

  IF NOT v_capacity_review THEN
    INSERT INTO public.financial_ledger(id,reference,type,amount,related_id,related_type,description)
      VALUES (gen_random_uuid()::text,'LED-PAY-'||v_payment.reference,'customer_payment',v_payment.amount,
        v_payment.id,'payment','Provider-verified payment '||v_payment.reference);
  END IF;
  IF v_payment.user_id IS NOT NULL THEN
    INSERT INTO public.notifications(id,user_id,title,message,type,related_id)
      VALUES (gen_random_uuid()::text,v_payment.user_id,
        CASE WHEN v_capacity_review THEN 'Payment received — review in progress' ELSE 'Payment confirmed' END,
        CASE WHEN v_capacity_review
          THEN 'Payment reference '||v_payment.reference||' was received and requires review.'
          ELSE 'Payment reference '||v_payment.reference||' was verified.' END,
        'payment',v_payment.id);
  END IF;

  v_result := jsonb_build_object(
    'duplicate',false,
    'paymentId',v_payment.id,
    'underReview',v_capacity_review,
    'status',CASE WHEN v_capacity_review THEN 'under_review' ELSE 'successful' END
  );
  INSERT INTO public.audit_logs(id,actor_id,actor_role,action,record_type,record_id,prev_value,new_value,reason)
    VALUES (gen_random_uuid()::text,p_actor_id,p_actor_role,'payment.verified','payment',v_payment.id,
      jsonb_build_object('status',v_payment.status)::text,
      jsonb_build_object('status',CASE WHEN v_capacity_review THEN 'under_review' ELSE 'successful' END,
        'provider','paystack')::text,
      CASE WHEN v_capacity_review THEN 'Capacity review required' ELSE 'Verified against payment provider' END);
  UPDATE public.payment_provider_events
    SET payment_id=v_payment.id,outcome=v_result,processed_at=now()
    WHERE provider='paystack' AND event_id=v_event_id;
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_failed_paystack_payment(
  p_payment_id text,
  p_provider_reference text,
  p_amount_kobo bigint,
  p_currency text,
  p_provider_event_id text,
  p_payload_sha256 text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_event public.payment_provider_events%ROWTYPE;
  v_event_id text;
  v_result jsonb;
  v_changed boolean := false;
BEGIN
  IF p_payment_id IS NULL OR length(p_payment_id)=0
     OR p_provider_reference IS NULL OR length(p_provider_reference) NOT BETWEEN 1 AND 200
     OR p_payload_sha256 IS NULL OR p_payload_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid payment event.' USING ERRCODE = '22023';
  END IF;
  v_event_id := COALESCE(NULLIF(p_provider_event_id,''),p_provider_reference||':charge.failed');
  IF length(v_event_id)>200 THEN
    RAISE EXCEPTION 'Provider event ID is invalid.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.payment_provider_events(provider,event_id,payload_sha256)
    VALUES ('paystack',v_event_id,p_payload_sha256)
    ON CONFLICT (provider,event_id) DO NOTHING;
  SELECT * INTO v_event FROM public.payment_provider_events
    WHERE provider='paystack' AND event_id=v_event_id FOR UPDATE;
  IF v_event.payload_sha256<>p_payload_sha256 THEN
    RAISE EXCEPTION 'Provider event ID was reused with a different payload.' USING ERRCODE = '22000';
  END IF;
  IF v_event.payment_id IS NOT NULL AND v_event.payment_id<>p_payment_id THEN
    RAISE EXCEPTION 'Provider event is already linked to another payment.' USING ERRCODE = '22000';
  END IF;
  IF v_event.processed_at IS NOT NULL THEN
    RETURN COALESCE(v_event.outcome,'{}'::jsonb)||jsonb_build_object('duplicate',true);
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id=p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment was not found.' USING ERRCODE = 'P0002'; END IF;
  IF v_payment.provider<>'paystack' THEN RAISE EXCEPTION 'Payment provider does not match.' USING ERRCODE = '22023'; END IF;
  IF p_provider_reference<>COALESCE(NULLIF(v_payment.provider_ref,''),v_payment.reference) THEN
    RAISE EXCEPTION 'Provider reference does not match the payment.' USING ERRCODE = '22023';
  END IF;
  IF p_currency IS NOT NULL AND upper(p_currency)<>'NGN' THEN
    RAISE EXCEPTION 'Payment currency does not match.' USING ERRCODE = '22023';
  END IF;
  IF p_amount_kobo IS NOT NULL AND p_amount_kobo<>0 AND p_amount_kobo<>v_payment.amount*100 THEN
    RAISE EXCEPTION 'Provider amount does not match the expected payment.' USING ERRCODE = '22023';
  END IF;

  IF v_payment.status IN ('pending','initiated') THEN
    UPDATE public.payments
      SET status='failed',provider_ref=COALESCE(NULLIF(p_provider_reference,''),provider_ref),updated_at=now()
      WHERE id=v_payment.id;
    IF v_payment.delivery_id IS NOT NULL THEN
      UPDATE public.deliveries SET payment_status='failed',updated_at=now()
        WHERE id=v_payment.delivery_id AND payment_status<>'successful';
    END IF;
    IF v_payment.waybill_id IS NOT NULL THEN
      UPDATE public.waybills SET payment_status='failed',updated_at=now()
        WHERE id=v_payment.waybill_id AND payment_status<>'successful';
    END IF;
    IF v_payment.user_id IS NOT NULL THEN
      INSERT INTO public.notifications(id,user_id,title,message,type,related_id)
        VALUES (gen_random_uuid()::text,v_payment.user_id,'Payment not completed',
          'Payment '||v_payment.reference||' was not completed. You may retry from your DigiTrans workspace.',
          'payment',v_payment.id);
    END IF;
    v_changed := true;
  END IF;
  v_result := jsonb_build_object('duplicate',NOT v_changed,'paymentId',v_payment.id,
    'status',CASE WHEN v_changed THEN 'failed' ELSE v_payment.status END);
  UPDATE public.payment_provider_events
    SET payment_id=v_payment.id,outcome=v_result,processed_at=now()
    WHERE provider='paystack' AND event_id=v_event_id;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_verified_paystack_payment(text,text,bigint,text,text,text,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verified_paystack_payment(text,text,bigint,text,text,text,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.apply_failed_paystack_payment(text,text,bigint,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_failed_paystack_payment(text,text,bigint,text,text,text) TO service_role;
