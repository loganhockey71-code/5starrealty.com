(function () {
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const addListingBtn = document.getElementById('addListingBtn');
  const tableBody = document.getElementById('listingsTableBody');
  const publishBtn = document.getElementById('publishBtn');

  const historyOverlay = document.getElementById('historyOverlay');
  const historyTitle = document.getElementById('historyTitle');
  const historyList = document.getElementById('historyList');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');

  let publishStatus = { pendingPages: [], pendingListingIds: [], pendingListings: false, hasPending: false };

  const formOverlay = document.getElementById('formOverlay');
  const listingForm = document.getElementById('listingForm');
  const formTitle = document.getElementById('formTitle');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  const existingPhotosField = document.getElementById('existingPhotosField');
  const existingPhotosEl = document.getElementById('existingPhotos');

  let listings = [];
  let removedPhotos = [];
  let editingId = null;

  function formatPrice(price) {
    const num = Number(price);
    return Number.isNaN(num) ? price : '$' + num.toLocaleString('en-US');
  }

  function showLogin() {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  }

  function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    loadListings();
    refreshPublishStatus();
  }

  function refreshPublishStatus() {
    return fetch('/api/admin/publish/status')
      .then((res) => res.json())
      .then((status) => {
        publishStatus = status;
        const count = status.pendingPages.length + status.pendingListingIds.length + status.deletedListingCount;
        publishBtn.disabled = !status.hasPending;
        publishBtn.textContent = status.hasPending ? `Publish to Live Site (${count})` : 'No changes to publish';
        renderTable();
        renderPagePicker();
      });
  }

  publishBtn.addEventListener('click', () => {
    const count = publishStatus.pendingPages.length + publishStatus.pendingListingIds.length + publishStatus.deletedListingCount;
    if (!confirm(`Publish ${count} pending change${count === 1 ? '' : 's'} to 5starrealtyfl.com?`)) return;
    publishBtn.disabled = true;
    fetch('/api/admin/publish', { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error('Publish failed');
        return refreshPublishStatus();
      })
      .catch(() => {
        alert('Could not publish. Please try again.');
        refreshPublishStatus();
      });
  });

  function formatTimestamp(iso) {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function openHistory(label, fetchUrl, restoreUrl, onRestored) {
    historyTitle.textContent = `History — ${label}`;
    historyList.innerHTML = '<p class="admin-history-empty">Loading…</p>';
    historyOverlay.classList.add('open');

    fetch(fetchUrl)
      .then((res) => res.json())
      .then((entries) => {
        if (!entries.length) {
          historyList.innerHTML = '<p class="admin-history-empty">No past published versions yet.</p>';
          return;
        }
        historyList.innerHTML = '';
        entries.forEach((entry) => {
          const row = document.createElement('div');
          row.className = 'admin-history-row';
          row.innerHTML = `<time>${escapeHtml(formatTimestamp(entry.timestamp))}</time>`;
          const restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.textContent = 'Restore';
          restoreBtn.addEventListener('click', () => {
            fetch(restoreUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timestamp: entry.timestamp }),
            })
              .then((res) => {
                if (!res.ok) throw new Error('Restore failed');
                closeHistory();
                onRestored();
                refreshPublishStatus();
              })
              .catch(() => alert('Could not restore this version. Please try again.'));
          });
          row.appendChild(restoreBtn);
          historyList.appendChild(row);
        });
      });
  }

  function closeHistory() {
    historyOverlay.classList.remove('open');
  }

  closeHistoryBtn.addEventListener('click', closeHistory);
  historyOverlay.addEventListener('click', (e) => {
    if (e.target === historyOverlay) closeHistory();
  });

  function checkSession() {
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => (data.authenticated ? showDashboard() : showLogin()))
      .catch(() => showLogin());
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          loginError.textContent = data.error || 'Login failed';
          return;
        }
        loginForm.reset();
        showDashboard();
      })
      .catch(() => {
        loginError.textContent = 'Something went wrong. Try again.';
      });
  });

  logoutBtn.addEventListener('click', () => {
    fetch('/api/logout', { method: 'POST' }).then(showLogin);
  });

  function loadListings() {
    fetch('/api/admin/listings')
      .then((res) => res.json())
      .then((data) => {
        listings = data;
        renderTable();
      });
  }

  function renderTable() {
    tableBody.innerHTML = '';
    if (!listings.length) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:24px;">No properties yet.</td></tr>';
      return;
    }
    listings.forEach((listing) => {
      const tr = document.createElement('tr');
      const thumb = (listing.photos && listing.photos[0]) || 'https://i.imgur.com/RJV9XBt.jpg';
      const statusClass = (listing.status || 'active').toLowerCase();
      const isPending = publishStatus.pendingListingIds.includes(listing.id);
      tr.innerHTML = `
        <td><img class="admin-thumb" src="${escapeAttr(thumb)}" alt=""></td>
        <td>${escapeHtml(listing.address)}${isPending ? '<span class="admin-unpublished-pill">Unpublished</span>' : ''}</td>
        <td>${escapeHtml(formatPrice(listing.price))}</td>
        <td><span class="admin-status-pill ${escapeAttr(statusClass)}">${escapeHtml(listing.status || 'Active')}</span></td>
        <td>
          <div class="admin-row-actions">
            <button data-action="edit">Edit</button>
            <button data-action="history">History</button>
            <button data-action="delete" class="danger">Delete</button>
          </div>
        </td>
      `;
      tr.querySelector('[data-action="edit"]').addEventListener('click', () => openForm(listing));
      tr.querySelector('[data-action="history"]').addEventListener('click', () => {
        openHistory(
          listing.address,
          `/api/admin/history/listings/${listing.id}`,
          `/api/admin/history/listings/${listing.id}/restore`,
          loadListings
        );
      });
      tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteListing(listing));
      tableBody.appendChild(tr);
    });
  }

  function deleteListing(listing) {
    if (!confirm(`Delete "${listing.address}"? This cannot be undone.`)) return;
    fetch(`/api/admin/listings/${listing.id}`, { method: 'DELETE' })
      .then(loadListings)
      .then(refreshPublishStatus);
  }

  function openForm(listing) {
    listingForm.reset();
    removedPhotos = [];
    editingId = listing ? listing.id : null;
    formTitle.textContent = listing ? 'Edit Property' : 'Add Property';

    if (listing) {
      document.getElementById('listingId').value = listing.id;
      document.getElementById('address').value = listing.address;
      document.getElementById('city').value = listing.city || '';
      document.getElementById('price').value = listing.price;
      document.getElementById('status').value = listing.status;
      document.getElementById('beds').value = listing.beds;
      document.getElementById('baths').value = listing.baths;
      document.getElementById('sqft').value = listing.sqft;
      document.getElementById('description').value = listing.description || '';
      renderExistingPhotos(listing.photos || []);
    } else {
      existingPhotosField.style.display = 'none';
      existingPhotosEl.innerHTML = '';
    }

    formOverlay.classList.add('open');
  }

  function renderExistingPhotos(photos) {
    if (!photos.length) {
      existingPhotosField.style.display = 'none';
      return;
    }
    existingPhotosField.style.display = '';
    existingPhotosEl.innerHTML = '';
    photos.forEach((url) => {
      const wrap = document.createElement('div');
      wrap.className = 'admin-existing-photo';
      wrap.innerHTML = `<img src="${url}" alt=""><button type="button">&times;</button>`;
      wrap.querySelector('button').addEventListener('click', () => {
        removedPhotos.push(url);
        wrap.remove();
      });
      existingPhotosEl.appendChild(wrap);
    });
  }

  function closeForm() {
    formOverlay.classList.remove('open');
  }

  cancelFormBtn.addEventListener('click', closeForm);
  formOverlay.addEventListener('click', (e) => {
    if (e.target === formOverlay) closeForm();
  });

  addListingBtn.addEventListener('click', () => openForm(null));

  listingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(listingForm);
    removedPhotos.forEach((url) => formData.append('removePhotos', url));

    const url = editingId ? `/api/admin/listings/${editingId}` : '/api/admin/listings';
    const method = editingId ? 'PUT' : 'POST';

    fetch(url, { method, body: formData })
      .then((res) => {
        if (!res.ok) throw new Error('Save failed');
        return res.json();
      })
      .then(() => {
        closeForm();
        loadListings();
        refreshPublishStatus();
      })
      .catch(() => alert('Could not save this property. Please try again.'));
  });

  // === EDIT PAGES ===
  const tabListingsBtn = document.getElementById('tabListingsBtn');
  const tabPagesBtn = document.getElementById('tabPagesBtn');
  const listingsPanel = document.getElementById('listingsPanel');
  const pagesPanel = document.getElementById('pagesPanel');
  const pagePicker = document.getElementById('pagePicker');
  const pageFieldsContainer = document.getElementById('pageFieldsContainer');
  const pageContentForm = document.getElementById('pageContentForm');
  const pageSaveStatus = document.getElementById('pageSaveStatus');
  const pageHistoryBtn = document.getElementById('pageHistoryBtn');

  const PAGE_ORDER = ['index', 'team', 'properties', 'services', 'contact', 'privacy'];
  const PAGE_LABELS = {
    index: 'Home',
    team: 'Meet the Team',
    properties: 'Our Listings',
    services: 'Search MLS',
    contact: 'Contact',
    privacy: 'Privacy Policy',
  };

  let contentSchema = null;
  let contentData = null;
  let currentPage = 'index';
  let pagesLoaded = false;

  tabListingsBtn.addEventListener('click', () => switchTab('listings'));
  tabPagesBtn.addEventListener('click', () => switchTab('pages'));

  function switchTab(tab) {
    tabListingsBtn.classList.toggle('active', tab === 'listings');
    tabPagesBtn.classList.toggle('active', tab === 'pages');
    listingsPanel.classList.toggle('hidden', tab !== 'listings');
    pagesPanel.classList.toggle('hidden', tab !== 'pages');
    if (tab === 'pages' && !pagesLoaded) loadPagesEditor();
  }

  function loadPagesEditor() {
    Promise.all([
      fetch('/api/admin/content-schema').then((r) => r.json()),
      fetch('/api/admin/content').then((r) => r.json()),
    ]).then(([schema, content]) => {
      contentSchema = schema;
      contentData = content;
      pagesLoaded = true;
      renderPagePicker();
      renderPageForm(currentPage);
    });
  }

  function renderPagePicker() {
    if (!contentSchema) return;
    pagePicker.innerHTML = '';
    const pageIds = PAGE_ORDER.filter((id) => contentSchema[id]);
    Object.keys(contentSchema).forEach((id) => {
      if (!pageIds.includes(id)) pageIds.push(id);
    });
    pageIds.forEach((pageId) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-picker-btn' + (pageId === currentPage ? ' active' : '');
      btn.textContent = PAGE_LABELS[pageId] || pageId;
      if (publishStatus.pendingPages.includes(pageId)) {
        btn.innerHTML += '<span class="admin-unpublished-pill">•</span>';
      }
      btn.addEventListener('click', () => {
        currentPage = pageId;
        renderPagePicker();
        renderPageForm(pageId);
      });
      pagePicker.appendChild(btn);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function renderPageForm(pageId) {
    pageSaveStatus.textContent = '';
    pageFieldsContainer.innerHTML = '';
    const fields = contentSchema[pageId] || [];
    const values = contentData[pageId] || {};

    fields.forEach((field) => {
      const wrap = document.createElement('div');
      wrap.className = 'page-field';
      const value = values[field.key] || '';

      if (field.type === 'image') {
        wrap.innerHTML = `
          <label>${field.label}</label>
          <div class="page-field-image">
            <img src="${value}" alt="">
            <input type="file" accept="image/*" data-field-key="${field.key}" data-field-type="image">
          </div>
        `;
      } else {
        const isMarkup = value.includes('<') || value.length > 80;
        if (isMarkup) {
          wrap.innerHTML = `
            <label>${field.label}</label>
            <textarea data-field-key="${field.key}" data-field-type="text">${escapeHtml(value)}</textarea>
          `;
        } else {
          wrap.innerHTML = `
            <label>${field.label}</label>
            <input type="text" value="${escapeAttr(value)}" data-field-key="${field.key}" data-field-type="text">
          `;
        }
      }
      pageFieldsContainer.appendChild(wrap);
    });
  }

  pageContentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData();
    pageFieldsContainer.querySelectorAll('[data-field-key]').forEach((el) => {
      const key = el.getAttribute('data-field-key');
      const type = el.getAttribute('data-field-type');
      if (type === 'image') {
        if (el.files && el.files[0]) formData.append(key, el.files[0]);
      } else {
        formData.append(key, el.value);
      }
    });

    pageSaveStatus.textContent = 'Saving…';
    fetch(`/api/admin/content/${currentPage}`, { method: 'PUT', body: formData })
      .then((res) => {
        if (!res.ok) throw new Error('Save failed');
        return res.json();
      })
      .then((data) => {
        contentData[currentPage] = data.content;
        pageSaveStatus.textContent = 'Saved!';
        renderPageForm(currentPage);
        refreshPublishStatus();
        setTimeout(() => { pageSaveStatus.textContent = ''; }, 2000);
      })
      .catch(() => {
        pageSaveStatus.textContent = 'Could not save. Please try again.';
      });
  });

  pageHistoryBtn.addEventListener('click', () => {
    openHistory(
      PAGE_LABELS[currentPage] || currentPage,
      `/api/admin/history/content/${currentPage}`,
      `/api/admin/history/content/${currentPage}/restore`,
      () => {
        fetch('/api/admin/content')
          .then((r) => r.json())
          .then((content) => {
            contentData = content;
            renderPageForm(currentPage);
          });
      }
    );
  });

  checkSession();
})();
