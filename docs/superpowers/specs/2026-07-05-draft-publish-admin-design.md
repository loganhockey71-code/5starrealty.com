# Draft / Publish Workflow for Admin Panel — Design Spec
**Date:** 2026-07-05
**Files:** `server.js`, `routes/content.js`, `routes/listings.js`, `db/listings.js`, `admin.html`, `js/admin.js`, new `db/publish.js`
**Stack:** Express + flat-file JSON storage (no framework changes)

---

## Goal

Today, every "Save Page" click and every listing create/edit/delete in the admin panel writes directly to the files the public site reads — there is no staging step. Add a real draft → publish workflow: admin edits accumulate as a draft, the live site keeps serving the last published version, and a single **"Publish to Live Site"** button pushes every pending change (pages + listings) live at once. Add per-page/per-listing **History** with restore-to-draft.

This mirrors a reference admin UI the user showed (a "We Love Adventure Travels" admin: a Pages list with Edit/History per row and one global Publish button).

---

## 1. Data model

Two existing files become "published" (read by the public site, unchanged paths):
- `content.json`
- `listings.json`

Two new "draft" files (read/written by the admin panel):
- `content.draft.json`
- `listings.draft.json`

One new history log:
- `history.json` — an array of up to **20** snapshots, newest first: `{ timestamp: ISOString, content: {...}, listings: [...] }`. Each snapshot holds a full copy of what was published *immediately before* a publish action overwrote it.

All three new files live in `DATA_DIR`, already on the Render persistent disk — no `render.yaml` changes needed.

### Seeding (server.js)

`seedDataDir()` currently copies the repo's bundled `data/content.json` / `data/listings.json` into `DATA_DIR` on first boot if missing. Extend it so that on first boot the draft files are also seeded (copied from the same bundled defaults, or from the published files if those already exist), and `history.json` is initialized to `[]` if missing. Never overwrite existing draft/published/history files on subsequent boots.

### Publish semantics

```
function publish() {
  const prevContent = readPublishedContent();
  const prevListings = readPublishedListings();

  const history = readHistory();
  history.unshift({ timestamp: new Date().toISOString(), content: prevContent, listings: prevListings });
  if (history.length > 20) history.length = 20;
  writeHistory(history);

  writePublishedContent(readDraftContent());
  writePublishedListings(readDraftListings());
}
```

Because listings publish as a full-array copy of the draft, creates/edits/deletes/reordering are all handled by this one copy — no per-item diffing needed. A deleted listing's data still exists in whatever history snapshot predates the deletion, so it's recoverable via History even after being removed from the draft.

### Restore semantics

Restoring from history writes the historical value into the **draft only**. It never touches the published files directly — a restored page/listing still needs an explicit Publish to go live, same as any other edit. This keeps "what's live" always equal to "the last thing actually published," with no special cases.

---

## 2. API changes

Public (unchanged behavior, still read published files):
- `GET /api/content`
- `GET /api/listings`
- `GET /api/listings/:id`

Admin — content (`routes/content.js`):
- `GET /api/admin/content` *(new)* — draft content map, used to populate the page editor so it reflects pending edits across reloads.
- `PUT /api/admin/content/:page` — now reads/writes the **draft** file (was: published).
- `GET /api/admin/history/content/:page` *(new)* — returns `[{ timestamp, data }]` extracted from each history snapshot's `content[page]`.
- `POST /api/admin/history/content/:page/restore` *(new)* — body `{ timestamp }`; copies that snapshot's `content[page]` into the draft.

Admin — listings (`routes/listings.js`, `db/listings.js`):
- `GET /api/admin/listings` *(new)* — draft listings array, for the admin table.
- `POST /api/admin/listings`, `PUT /api/admin/listings/:id`, `DELETE /api/admin/listings/:id` — now operate on the **draft** listings file (was: published). `db/listings.js`'s `readAll`/`writeAll`/etc. gain a `{ draft: true }`-style variant, or are parameterized by file path, so the same CRUD logic serves both draft (admin) and published (public) reads without duplicating the module.
- `GET /api/admin/history/listings/:id` *(new)* — returns `[{ timestamp, data }]` extracted from each snapshot's `listings` array (only entries where that id existed).
- `POST /api/admin/history/listings/:id/restore` *(new)* — body `{ timestamp }`; upserts that snapshot's listing object into the draft listings array by id (re-adds it if it was deleted since).

Admin — publish (new `routes/publish.js` + `db/publish.js`):
- `GET /api/admin/publish/status` *(new)* — `{ pendingPages: string[], pendingListings: boolean, hasPending: boolean }`, computed by deep-comparing (`JSON.stringify`) each page's draft vs. published value, and the draft vs. published listings arrays as a whole.
- `POST /api/admin/publish` *(new)* — runs the `publish()` routine above.

All new/changed admin routes reuse the existing `requireAuth` middleware. All continue to be mounted under `/api` as today.

---

## 3. UI changes

### Top bar (`admin.html`)
Add a **"Publish to Live Site"** button next to "Log Out". On load, and after any save/restore, the panel calls `GET /api/admin/publish/status`:
- If `hasPending` is false, the button is disabled with label "No changes to publish".
- If true, it's enabled with a count, e.g. "Publish to Live Site (3)".

Clicking it shows a confirm step ("Publish 3 pending changes to 5starrealtyfl.com?"), then calls `POST /api/admin/publish`, shows a success toast, and refreshes the status (button goes back to disabled).

### Manage Listings tab
Each row's action group (`Edit` / `Delete`) gains a **History** button. Rows whose draft differs from published get a small "unpublished changes" pill, reusing the existing `.admin-status-pill` styling already defined in `admin.html`.

### Edit Pages tab
The page-picker buttons get the same "unpublished changes" pill treatment for any page whose draft differs from published. The save bar (`Save Page` / status text) gains a **History** button for whichever page is currently open.

### History modal (shared)
A single modal component, opened from either tab. Lists snapshots newest-first as `{ formatted timestamp } → [Restore]`. Clicking Restore calls the relevant restore endpoint, closes the modal, reloads the current draft view, and leaves the change unpublished (still requires hitting the global Publish button).

### `js/admin.js` data flow changes
- Page editor loads from `GET /api/admin/content` instead of the public `/api/content`.
- Listings table loads from `GET /api/admin/listings` instead of the public `/api/listings`.
- After any successful save (page or listing) or restore, re-fetch `/api/admin/publish/status` to refresh pending indicators and the Publish button state.

---

## 4. Known limitations (accepted for v1)

- Single-admin workflow — no conflict resolution if two people edit concurrently (matches today's behavior; the site has one admin user).
- An uploaded photo's file is fetchable by direct URL as soon as it's uploaded, even before publish — same exposure as today, since `/uploads` has never been access-gated.
- History is capped at the last 20 publish events **total**, not 20 per page/listing — a burst of many small, separately-published edits could scroll a specific page's older history out of range faster than its edit frequency alone would suggest.
- Restoring a listing that was deleted re-adds it with its original `id` and timestamps from the snapshot; it does not attempt to preserve its original position among other listings beyond whatever order the draft array restore uses (append semantics, matching `db/listings.js`'s existing `create()` behavior is out of scope here — restore reinserts in place if the id already has a slot, else appends).
