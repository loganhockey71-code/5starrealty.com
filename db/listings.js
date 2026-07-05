const fs = require('fs');

// Factory so callers can point at either the published listings file (read
// by the public site) or the draft listings file (read/written by the admin
// panel) using identical CRUD logic.
function createListingsDb(dataFile) {
  function readAll() {
    if (!fs.existsSync(dataFile)) return [];
    const raw = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(raw || '[]');
  }

  function writeAll(listings) {
    fs.writeFileSync(dataFile, JSON.stringify(listings, null, 2));
  }

  function getById(id) {
    return readAll().find((l) => l.id === id) || null;
  }

  function create(data) {
    const listings = readAll();
    const now = new Date().toISOString();
    const listing = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      address: data.address,
      city: data.city || '',
      price: data.price,
      beds: data.beds,
      baths: data.baths,
      sqft: data.sqft,
      description: data.description || '',
      status: data.status || 'Active',
      photos: data.photos || [],
      createdAt: now,
      updatedAt: now,
    };
    listings.unshift(listing);
    writeAll(listings);
    return listing;
  }

  function update(id, data) {
    const listings = readAll();
    const idx = listings.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    const existing = listings[idx];
    const updated = {
      ...existing,
      address: data.address ?? existing.address,
      city: data.city ?? existing.city,
      price: data.price ?? existing.price,
      beds: data.beds ?? existing.beds,
      baths: data.baths ?? existing.baths,
      sqft: data.sqft ?? existing.sqft,
      description: data.description ?? existing.description,
      status: data.status ?? existing.status,
      photos: data.photos ?? existing.photos,
      updatedAt: new Date().toISOString(),
    };
    listings[idx] = updated;
    writeAll(listings);
    return updated;
  }

  function remove(id) {
    const listings = readAll();
    const idx = listings.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    const [removed] = listings.splice(idx, 1);
    writeAll(listings);
    return removed;
  }

  return { readAll, writeAll, getById, create, update, remove };
}

module.exports = { createListingsDb };
