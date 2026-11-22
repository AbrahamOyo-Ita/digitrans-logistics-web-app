-- Invited administrators only provide an email, name and role. Keep phone optional for those accounts.
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- Admin invitations are server-only; only a token digest is stored, never a usable link.
CREATE TABLE public.admin_invitations (
  id uuid PRIMARY KEY,
  email text NOT NULL CHECK (email = lower(email)),
  full_name text NOT NULL,
  role text NOT NULL REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  invited_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivery_failed','accepted','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  CHECK (role IN ('ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager','super_admin'))
);
CREATE UNIQUE INDEX admin_invitations_one_open_per_email
  ON public.admin_invitations (email)
  WHERE status IN ('pending','delivery_failed');
CREATE INDEX admin_invitations_auth_user_id_idx ON public.admin_invitations(auth_user_id);
CREATE INDEX admin_invitations_invited_by_idx ON public.admin_invitations(invited_by,created_at DESC);

CREATE TABLE public.admin_invitation_tokens (
  id uuid PRIMARY KEY,
  invitation_id uuid NOT NULL REFERENCES public.admin_invitations(id) ON DELETE CASCADE,
  token_digest text NOT NULL UNIQUE CHECK (token_digest ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX admin_invitation_tokens_invite_idx ON public.admin_invitation_tokens(invitation_id,expires_at DESC);
CREATE UNIQUE INDEX admin_invitation_tokens_one_open_per_invite
  ON public.admin_invitation_tokens(invitation_id)
  WHERE used_at IS NULL AND revoked_at IS NULL;

-- Extend historical audit rows without rewriting them. New events are hash-chained.
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_email text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS request_id text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS chain_sequence bigint;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS previous_hash text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entry_hash text;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_chain_fields_consistent CHECK (
  (chain_sequence IS NULL AND previous_hash IS NULL AND entry_hash IS NULL)
  OR (chain_sequence IS NOT NULL AND previous_hash IS NOT NULL AND entry_hash IS NOT NULL
      AND previous_hash ~ '^[0-9a-f]{64}$' AND entry_hash ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX audit_logs_chain_sequence_unique ON public.audit_logs(chain_sequence) WHERE chain_sequence IS NOT NULL;
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs(created_at DESC,id DESC);
CREATE INDEX audit_logs_action_created_at_idx ON public.audit_logs(action,created_at DESC);
CREATE INDEX audit_logs_record_idx ON public.audit_logs(record_type,record_id,created_at DESC);
CREATE INDEX audit_logs_request_id_idx ON public.audit_logs(request_id) WHERE request_id IS NOT NULL;

CREATE TABLE public.audit_chain_heads (
  id smallint PRIMARY KEY CHECK (id = 1),
  last_sequence bigint NOT NULL DEFAULT 0,
  last_hash text NOT NULL DEFAULT repeat('0',64) CHECK (last_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.audit_chain_heads(id,last_sequence,last_hash)
VALUES (1,0,repeat('0',64))
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reject_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries are append-only.' USING ERRCODE = '55000';
END;
$$;
CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.reject_audit_log_mutation();
CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON public.audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION public.reject_audit_log_mutation();

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_chain_heads ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.admin_invitations,public.admin_invitation_tokens,public.audit_chain_heads FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.admin_invitations,public.admin_invitation_tokens,public.audit_chain_heads TO service_role;
GRANT SELECT,INSERT ON TABLE public.audit_logs TO service_role;
REVOKE ALL PRIVILEGES ON TABLE public.audit_logs FROM anon,authenticated,service_role;
GRANT SELECT,INSERT ON TABLE public.audit_logs TO service_role;
