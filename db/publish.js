const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../lib/paths');

const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const CONTENT_DRAFT_FILE = path.join(DATA_DIR, 'content.draft.json');
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');
const LISTINGS_DRAFT_FILE = path.join(DATA_DIR, 'listings.draft.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

const MAX_HISTORY = 20;

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  const raw = fs.readFileSync(file, 'utf-8');
  return raw ? JSON.parse(raw) : fallback;
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readHistory() {
  return readJson(HISTORY_FILE, []);
}

function writeHistory(history) {
  writeJson(HISTORY_FILE, history);
}

// Compares draft vs. published so the admin UI can show what has
// unpublished changes without maintaining a separate dirty flag that could
// drift out of sync with the actual files.
function getStatus() {
  const contentDraft = readJson(CONTENT_DRAFT_FILE, {});
  const contentPublished = readJson(CONTENT_FILE, {});
  const pageKeys = new Set([...Object.keys(contentDraft), ...Object.keys(contentPublished)]);
  const pendingPages = [...pageKeys].filter(
    (key) => JSON.stringify(contentDraft[key] || {}) !== JSON.stringify(contentPublished[key] || {})
  );

  const listingsDraft = readJson(LISTINGS_DRAFT_FILE, []);
  const listingsPublished = readJson(LISTINGS_FILE, []);
  const publishedById = new Map(listingsPublished.map((l) => [l.id, l]));
  const draftIds = new Set(listingsDraft.map((l) => l.id));

  const pendingListingIds = listingsDraft
    .filter((l) => JSON.stringify(l) !== JSON.stringify(publishedById.get(l.id) || null))
    .map((l) => l.id);
  const deletedListingIds = listingsPublished.filter((l) => !draftIds.has(l.id)).map((l) => l.id);

  const pendingListings = pendingListingIds.length > 0 || deletedListingIds.length > 0;

  return {
    pendingPages,
    pendingListingIds,
    deletedListingCount: deletedListingIds.length,
    pendingListings,
    hasPending: pendingPages.length > 0 || pendingListings,
  };
}

// Publish = snapshot what's currently live into history, then overwrite the
// live files with the draft. Listings publish as a full-array copy, so
// creates/edits/deletes/reordering are all handled by this one copy with no
// per-item diffing needed.
function publish() {
  const prevContent = readJson(CONTENT_FILE, {});
  const prevListings = readJson(LISTINGS_FILE, []);

  const history = readHistory();
  history.unshift({ timestamp: new Date().toISOString(), content: prevContent, listings: prevListings });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  writeHistory(history);

  writeJson(CONTENT_FILE, readJson(CONTENT_DRAFT_FILE, {}));
  writeJson(LISTINGS_FILE, readJson(LISTINGS_DRAFT_FILE, []));
}

function historyForPage(page) {
  return readHistory()
    .map((snap) => ({ timestamp: snap.timestamp, data: (snap.content || {})[page] }))
    .filter((entry) => entry.data !== undefined);
}

function historyForListing(id) {
  return readHistory()
    .map((snap) => ({ timestamp: snap.timestamp, data: (snap.listings || []).find((l) => l.id === id) }))
    .filter((entry) => entry.data !== undefined);
}

// Restoring writes into the draft only — a restored page/listing still
// needs an explicit Publish to go live, same as any other edit.
function restoreContentFromHistory(page, timestamp) {
  const snap = readHistory().find((s) => s.timestamp === timestamp);
  if (!snap || !snap.content || snap.content[page] === undefined) return null;
  const draft = readJson(CONTENT_DRAFT_FILE, {});
  draft[page] = snap.content[page];
  writeJson(CONTENT_DRAFT_FILE, draft);
  return draft[page];
}

function restoreListingFromHistory(id, timestamp) {
  const snap = readHistory().find((s) => s.timestamp === timestamp);
  if (!snap) return null;
  const historicalListing = (snap.listings || []).find((l) => l.id === id);
  if (!historicalListing) return null;

  const draft = readJson(LISTINGS_DRAFT_FILE, []);
  const idx = draft.findIndex((l) => l.id === id);
  if (idx === -1) draft.push(historicalListing);
  else draft[idx] = historicalListing;
  writeJson(LISTINGS_DRAFT_FILE, draft);
  return historicalListing;
}

module.exports = {
  CONTENT_FILE,
  CONTENT_DRAFT_FILE,
  LISTINGS_FILE,
  LISTINGS_DRAFT_FILE,
  readJson,
  writeJson,
  getStatus,
  publish,
  historyForPage,
  historyForListing,
  restoreContentFromHistory,
  restoreListingFromHistory,
};
