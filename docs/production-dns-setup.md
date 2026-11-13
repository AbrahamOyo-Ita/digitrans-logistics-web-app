# Production domain and mail DNS

## Current connection status

- `www.digitransdelivery.com` has been added to the existing Vercel project `digitrans-logistics-web-app`.
- Vercel currently reports the domain as misconfigured. Its detected nameservers are `ns1.cloudoon.com`, `ns2.cloudoon.net`, and `ns3.cloudoon.org`; DNS is external and must be managed at TruHost.
- The production API is expected at `https://api.digitransdelivery.com`; it must be reachable over HTTPS before the frontend can authenticate or load public content.
- No TruHost or Resend connector is available in this session. The records below are documented from the values supplied by the domain owner; they have **not** been added to DNS or verified with Resend.

## Add these records at TruHost

In the DNS zone for `digitransdelivery.com`, add the following records. Use the host/name field as shown (without appending the domain if the TruHost panel appends it automatically), and leave TTL on **Auto**. Check for conflicting existing records before saving; a CNAME cannot coexist with other record types at the same hostname.

| Purpose | Type | Host / name | Value / target | TTL |
| --- | --- | --- | --- | --- |
| Vercel website | CNAME | `www` | `80e400230f801f7e.vercel-dns-017.com.` | Auto |
| Resend DKIM | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCu8zQ6uDalISbVavkpfQseq1gFC988dUO+tpbzXmWeMkrRbyHvf4NYDo/+rgxSP+E18u9oOzlL3+f6R2xhxemeGJfU0FYBras4nClq+asQykL8WKUzsEV+KBgpTo2T6S1bxavba7mdfBM8cJQic78BNh47jB3q1ZYd9j4Kj9LnzQIDAQAB` | Auto |
| Resend sending | CNAME | `rsend` | `rsend-euw1.forge.rmta.net.` | Auto |
| Resend sending | CNAME | `send` | `send.forge.rmta.net.` | Auto |
| DMARC | TXT | `_dmarc` | `v=DMARC1; p=none;` | Auto |

The Vercel DNS check also listed `cname.vercel-dns.com.` as a fallback CNAME target; prefer the project-specific target in the table above. Do not add an apex/root-domain record for `digitransdelivery.com` unless its owner explicitly requests it; only `www.digitransdelivery.com` was attached to Vercel.

## Verification steps

1. Save the records in TruHost, then wait for DNS propagation.
2. Recheck `www.digitransdelivery.com` in Vercel Domain settings until the domain reports configured. Vercel can serve the attached domain only after DNS points to it **and** a successful deployment exists.
3. Enter the same DKIM/CNAME/DMARC records in the Resend domain setup if its status has not updated automatically; confirm the domain is verified before enabling production email.
4. Resend's instructions included an “Enable receiving” heading but no inbound MX/receiving record values. Do not invent those records. The current app sends transactional email; it does not implement inbound email handling. If inbound mail is required, obtain the exact MX records from Resend and decide which mailbox/service will receive it.
5. Keep `p=none` while monitoring DMARC. Do not change to `quarantine` or `reject` until legitimate senders are inventoried and SPF/DKIM alignment is verified.

## Still required before production deployment

- Select a Node host and deploy the long-running Express API. Prefer `https://api.digitransdelivery.com` so it shares the same site with `https://www.digitransdelivery.com`; this is a suggested hostname, **not** an existing API service.
- After the API is reachable, set Vercel's `VITE_API_BASE_URL=https://api.digitransdelivery.com` and set the Node service's `APP_URL=https://digitransdelivery.com` and `CLIENT_ORIGINS=https://digitransdelivery.com,https://www.digitransdelivery.com`. Configure `SESSION_COOKIE_SAME_SITE` consistently with the final host topology.
- Add the API subdomain DNS target specified by the chosen Node host. It is not included above because no API provider/target was supplied.
- Do not switch production traffic until the API, database migrations/seed, Auth redirect settings, Resend verification, and end-to-end smoke tests are complete.
