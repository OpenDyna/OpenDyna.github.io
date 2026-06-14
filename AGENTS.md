# Repository Guidance

- This is a static GitHub Pages site for `https://www.opendyna.com/`.
- Preserve the plain HTML, CSS, and JavaScript architecture unless a task
  explicitly requires build tooling.
- Shared site styles live in `styles.css`; page-specific shared styles may live
  under `styles/`.
- Shared browser scripts live under `js/`.
- Never commit private credentials, Supabase secret/service-role keys, or OAuth
  client secrets. A Supabase publishable key may be used in browser code only
  when database access is protected by tested Row Level Security policies.
- Serve the repository over HTTP for local browser testing:
  `python -m http.server 8000`.
- Before finishing a change, check relative paths from both the site root and
  files under `pages/`, and review the diff for unrelated edits.
