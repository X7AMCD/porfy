# X7 Studios website builder — test plan

## Test environment safety

Do not test publishing against the production Worker or production D1 database. The editor writes published website changes to the Worker database and those changes are visible to the public website.

Before browser testing:
1. Deploy this branch to a non-public preview/staging site, not to `main`.
2. Point the staging preview/admin build at a separate staging Worker and a separate D1 database.
3. Configure the staging Worker with the same route handlers and schema as production, but separate secrets and data.
4. Protect staging admin routes with Cloudflare Access.
5. Confirm the staging `/website-content` endpoint returns staging data and does not use `https://api.x7studios.co.za`.

No staging Worker, D1 database, or deployment has been created by this PR. If the hosting setup cannot provide a staging Worker, use a disposable test Worker/database before trying save or publish.

## Browser test matrix

Use a non-production test page and a disposable page section. Do not edit the real homepage while validating.

| Area | Steps | Expected result |
| --- | --- | --- |
| Preview loading | Open the admin Website Builder; wait for preview and saved state to load. | Same-origin preview loads, current published changes are visible, layer list populates. |
| Layer selection | Select a heading, paragraph, image and section in the preview, then select each from the layer list. | Selected label, tag, selector and outline match the selected node. |
| Protected elements | Try selecting navigation, header/footer, links, buttons, forms and form fields. | Protected controls cannot be edited or moved. |
| Stable identity | Select an element without an ID, add a harmless style change, save, reload the builder and select it again. | A `data-x7-managed-id` is applied once, reused after reload, and the original HTML `id` is not overwritten. |
| Existing IDs | Select an element with a normal HTML ID and edit it. | The existing ID is used; no new identity registration is needed. |
| Drag | Drag a non-interactive element a small distance. | It moves without changing its parent or breaking page flow; the X/Y fields update. |
| Resize | Use the resize handle on a disposable image or section. | Width/height fields update; resize does not affect other elements. |
| Responsive preview | Switch desktop, tablet and mobile widths. | The iframe viewport changes; layer selection still works. |
| Responsive styles | Change only the width in mobile mode, save and publish to staging. | Mobile width changes at mobile viewport; desktop/tablet retain their prior style values. |
| Draft persistence | Add a change, save draft, refresh admin, load saved draft. | Draft reappears; public/staging page is unchanged until publish. |
| Cumulative publishing | Start with one published change, add a second change and publish. | Both old and new published changes remain applied. |
| New element | Add a paragraph or heading to a disposable parent and publish. | Element appears once, with its persistent ID; repeated reloads do not duplicate it. |
| Removal | Remove a disposable test element and publish. | Only the selected element is removed. |
| Version history | Publish two different staging versions and restore the first. | The first version returns and the pre-restore version remains in history. |
| Legacy edits | Load existing selector-based text/style/image/link/element edits. | Existing records continue to apply. |
| Booking regression | Open booking, availability, client and gallery admin modules without changing data. | Existing modules still load and behave as before. |

## Worker/API checks

- `GET /website-content` returns the published edit list without requiring admin authentication.
- `GET /admin/website-builder` returns separate `draft` and `published` arrays under Cloudflare Access.
- `POST /admin/website-builder` with `action: "save"` updates only the draft.
- `POST /admin/website-builder` with `action: "publish"` updates published edits and creates the expected version-history record.
- `POST /admin/website-builder` with `action: "discard"` clears the draft but leaves published edits unchanged.
- `POST /admin/website-builder/restore` restores a selected version.
- Invalid selectors, duplicate IDs, unsupported CSS properties, non-HTTPS image URLs and attempts to target protected controls are rejected with HTTP 400.
- Unauthenticated admin requests remain rejected.

## Automated checks

Run:

```sh
node --test tests/website-builder.test.cjs
```

The GitHub Actions workflow runs these regression checks for pull requests to `main` and pushes to the feature branch.

## Exit criteria before merge

- All browser and Worker/API checks above pass in staging.
- No booking, availability, client, gallery or portfolio regression is found.
- Version restore succeeds after multiple publishes.
- Production Worker and D1 are unchanged during testing.
- Review the final PR diff and deployment plan before merging.
