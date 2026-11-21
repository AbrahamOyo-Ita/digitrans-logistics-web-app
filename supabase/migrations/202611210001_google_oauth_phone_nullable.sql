-- Google-authenticated accounts may not have a phone number at first sign-in.
-- The application can collect a phone number later during profile completion.
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
