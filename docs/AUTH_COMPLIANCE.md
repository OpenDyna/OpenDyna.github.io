# Authentication Compliance Checklist

This is an engineering checklist based on the LinkedIn API Terms reviewed on
June 14, 2026. It is not legal advice. LinkedIn incorporates other policies and
may update its terms, so review the current developer portal requirements
before launch and periodically afterward.

## Implemented in the repository

- The login page identifies LinkedIn sign-in and does not obscure the consent
  flow.
- The login page discloses the LinkedIn-derived data requested, its purpose,
  Supabase processing, withdrawal, and deletion before authentication.
- The user must take an affirmative consent action before sign-in.
- Public Privacy Policy and User Agreement pages are linked before sign-in.
- The site requests only basic OIDC identity data and does not request
  connections, posts, employment history, or LinkedIn passwords.
- The LinkedIn client secret and Supabase service-role key remain server-side.
- The account page provides a self-service deletion control.
- The deletion Edge Function validates the authenticated caller and can delete
  only that caller's Supabase Auth account.
- The site does not use LinkedIn data for advertising, resale, surveillance,
  discrimination, eligibility decisions, or automated posting.

## Launch blockers

- Deploy and test the `delete-account` Supabase Edge Function.
- Confirm `privacy@opendyna.com` and `support@opendyna.com` reliably forward,
  are monitored, and can send replies from the corresponding OpenDyna address.
- Confirm the LinkedIn application name, description, logo, company/Page
  association, and URLs are accurate and current.
- Confirm LinkedIn has granted the **Sign In with LinkedIn using OpenID
  Connect** product.
- Confirm the Privacy Policy URL in LinkedIn is
  `https://www.opendyna.com/pages/privacy.html`.
- Test consent, sign-in, session restoration, sign-out, deletion, and failed
  deletion in production.
- Do not link the login page from `index.html` until these items pass.

## Data inventory and retention

The current authentication flow may process:

- LinkedIn subject/account identifier.
- Name.
- Email address.
- Profile image URL or metadata if LinkedIn returns it.
- OAuth and Supabase session tokens.
- Supabase authentication timestamps and operational logs.
- OpenDyna consent policy version and acceptance timestamp.

Do not copy LinkedIn profile metadata into application tables unless a feature
requires it and the Privacy Policy and consent disclosure are updated first.
Keep account data only while the account exists, except where applicable law
requires retention.

For every future user-owned table:

1. Document each field and why it is needed.
2. Enable Row Level Security.
3. Restrict access using `auth.uid()`.
4. Define and test account-deletion behavior.
5. Prefer a foreign key to `auth.users(id)` with `on delete cascade` for data
   that must be removed with the account.
6. Verify that storage objects and external systems are also deleted.

## Deletion operations

- Treat any deletion failure as an operational issue requiring prompt action.
- Check Supabase function logs when a user reports a failure.
- If automatic deletion fails, verify the requester's identity privately and
  delete the user through **Authentication > Users**.
- Delete related application rows and storage objects not covered by cascade.
- Do not ask users to submit tokens, passwords, or identity data in a public
  GitHub issue.
- If LinkedIn access ends or OpenDyna stops using the integration, delete
  retained LinkedIn-derived content as required by the applicable terms.

## Security operations

- Keep the LinkedIn client secret only in Supabase provider settings.
- Keep service-role and Supabase secret keys only in server-side secret
  storage.
- Review Supabase Auth and Edge Function logs for abuse and failures.
- Rotate credentials after suspected exposure.
- Maintain a written incident record containing discovery time, affected
  systems/data, containment, remediation, and notifications.
- The reviewed LinkedIn terms require reporting qualifying incidents affecting
  LinkedIn content or members to LinkedIn within 24 hours of discovery.
- Do not make public statements about an incident involving LinkedIn APIs or
  content without checking LinkedIn's current notification requirements.

## Periodic review

Review at least quarterly and whenever authentication behavior changes:

- Current LinkedIn API terms, developer documentation, and branding rules.
- Current Privacy Policy and User Agreement accuracy.
- Data fields and OIDC scopes actually received.
- Supabase RLS policies and deletion cascades.
- Edge Function dependencies and logs.
- LinkedIn and Supabase credentials, authorized URLs, and team access.
