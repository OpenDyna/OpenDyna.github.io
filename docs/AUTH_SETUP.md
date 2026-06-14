# OpenDyna Authentication Setup

The repository contains a static LinkedIn sign-in flow at:

- `pages/login.html`
- `pages/app.html`

The pages remain unlinked from the home page until the external services are
configured and the complete flow has been tested.

## 1. Create a Supabase project

1. Create or open a project in the Supabase dashboard.
2. Open **Project Settings > API Keys**.
3. Copy the project URL and the browser-safe publishable key.
4. Edit `js/supabase-config.js`:

```js
window.OPENDYNA_AUTH_CONFIG = Object.freeze({
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabasePublishableKey: "sb_publishable_YOUR_KEY"
});
```

The publishable key is expected to be visible in the browser. Never put a
Supabase secret key, service-role key, or LinkedIn client secret in this file.

## 2. Configure Supabase redirect URLs

Open **Authentication > URL Configuration** in Supabase.

Set the Site URL to:

```text
https://www.opendyna.com/
```

Add these Redirect URLs:

```text
https://www.opendyna.com/pages/app.html
http://localhost:8000/pages/app.html
```

Use exact production URLs. Add another localhost port only if the local server
uses a different port.

## 3. Create the LinkedIn application

1. Create an app in the LinkedIn Developer Portal.
2. Associate the app with a LinkedIn Page as required by LinkedIn.
3. Set the public Privacy Policy URL to:

```text
https://www.opendyna.com/pages/privacy.html
```

4. Use an accurate description explaining that OpenDyna provides professional
   engineering and analysis tools and uses LinkedIn only for account
   authentication.
5. Request the **Sign In with LinkedIn using OpenID Connect** product.
6. In Supabase, open **Authentication > Sign In / Providers > LinkedIn
   (OIDC)** and copy the callback URL. It has this form:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

7. Add that Supabase callback URL to the LinkedIn app's authorized redirect
   URLs.
8. Copy the LinkedIn Client ID and Client Secret into the LinkedIn (OIDC)
   provider settings in Supabase, enable the provider, and save.

The LinkedIn client secret belongs only in the Supabase dashboard.

## 4. Deploy account deletion

Deleting a Supabase Auth user requires a service-role credential and cannot be
done safely by GitHub Pages. The repository includes
`supabase/functions/delete-account/index.ts`, which runs inside Supabase and
deletes only the authenticated caller.

Install or invoke the Supabase CLI, then authenticate and link this project:

```powershell
npx supabase login
npx supabase link --project-ref dbfrspcvuhdlmshowopb
```

Deploy the function with gateway JWT verification disabled:

```powershell
npx supabase functions deploy delete-account --no-verify-jwt
```

`--no-verify-jwt` is intentional because the project uses a current
publishable key. The function independently validates the caller's bearer
token with `auth.getUser()` before using the server-only service-role key.
Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` to hosted Edge Functions. Do not copy the
service-role key into this repository.

Any future user-owned table should reference `auth.users(id)` with an
appropriate deletion strategy. For data that must disappear with the account,
use `on delete cascade` and test it before launch.

## 5. Test locally

From the repository root, run:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/pages/login.html
```

Verify:

1. The login button redirects to LinkedIn.
2. Successful login returns to `pages/app.html`.
3. The account page displays the user's name and email.
4. Refreshing the account page preserves the session.
5. Signing out returns to the login page.
6. Opening `pages/app.html` after sign-out redirects to the login page.
7. The privacy policy and user agreement are available before sign-in.
8. The login button remains disabled until the consent checkbox is selected.
9. Deleting an account removes it from **Authentication > Users** in Supabase.
10. The deleted account no longer restores a valid session.

Do not test by opening the HTML with a `file:///` URL. OAuth redirects require
an HTTP origin.

The pages currently load the pinned Supabase JavaScript client directly from
jsDelivr. Review and update that version deliberately rather than changing the
URL to an unpinned release.

## 6. Security boundary

The session check controls navigation and presentation only. Static HTML and
JavaScript are always public on GitHub Pages.

Any Supabase table accessed from the browser must have Row Level Security
enabled with policies based on the authenticated user. Do not expose private
data until those policies are in place and tested.

## 7. Compliance review

Read `docs/AUTH_COMPLIANCE.md` and complete every launch-blocking item. Confirm
that `privacy@opendyna.com` and `support@opendyna.com` can receive messages and
send replies before public launch.

## 8. Publish the entry point

After production authentication works, add a link to `pages/login.html` from
`index.html`. Until then, keep the new pages unlinked.

## References

- [Supabase LinkedIn login](https://supabase.com/docs/guides/auth/social-login/auth-linkedin)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase delete user](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
- [LinkedIn API Terms](https://www.linkedin.com/legal/l/api-terms-of-use)
