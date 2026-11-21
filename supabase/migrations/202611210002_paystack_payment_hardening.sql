-- Paystack payment hardening.
-- A payable record may have many failed attempts, but only one live or
-- provider-confirmed attempt at a time. These indexes close the race between
-- concurrent checkout requests without weakening the payment RPC guarantees.

CREATE INDEX IF NOT EXISTS payments_provider_ref_idx
  ON public.payments(provider, provider_ref)
  WHERE provider_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_active_delivery_uq
  ON public.payments(delivery_id)
  WHERE delivery_id IS NOT NULL
    AND status IN ('pending','initiated','successful','under_review');

CREATE UNIQUE INDEX IF NOT EXISTS payments_active_waybill_uq
  ON public.payments(waybill_id)
  WHERE waybill_id IS NOT NULL
    AND status IN ('pending','initiated','successful','under_review');

CREATE UNIQUE INDEX IF NOT EXISTS payments_active_market_run_uq
  ON public.payments(market_run_id)
  WHERE market_run_id IS NOT NULL
    AND status IN ('pending','initiated','successful','under_review');

CREATE UNIQUE INDEX IF NOT EXISTS payments_active_investment_application_uq
  ON public.payments(investment_application_id)
  WHERE investment_application_id IS NOT NULL
    AND status IN ('pending','initiated','successful','under_review');
