# Deploying the X7 Studios Cloudflare Worker

The complete Cloudflare Worker source is stored in the repository file `worker`.

## Source version prepared for deployment

Use the `worker` file on the `worker-overwrite-ready` branch:

https://github.com/X7AMCD/porfy/blob/worker-overwrite-ready/worker

This is a complete Worker source file, not a patch. It is intended to replace the code in the existing `x7studios-api` Worker.

## Replace the code in Cloudflare

1. Open the source link above and view the complete file.
2. Copy the complete contents of `worker`.
3. Open the Cloudflare Dashboard.
4. Go to **Workers & Pages** and open **x7studios-api**.
5. Choose **Edit code**.
6. Select the existing editor contents and replace them with the complete contents copied from the repository.
7. Save and deploy.

## Preserve the existing Worker configuration

Replacing the JavaScript source does not recreate or change Worker bindings, secrets, custom domains, routes, or Cloudflare Access policies. Keep these existing settings in place:

- D1 binding: `DB` → database `x7-studios-bookings`
- Secret: `BREVO_API_KEY`
- Secret: `IMAGEKIT_PRIVATE_KEY`
- Custom domain: `api.x7studios.co.za`
- Existing Cloudflare Access policy protecting the admin API

Do not paste secret values into the source file or commit them to GitHub.

## What changed in this source

The `/admin/website-images` endpoint now extracts ImageKit URLs cleanly from the six existing collection arrays on `https://x7studios.co.za/preview`. It handles the stray leading `]` present before the first Portraits URL, removes duplicates, and returns the clean URL consistently in both `url` and `source_url`.

The other Worker routes and existing collection names/slugs are retained.
