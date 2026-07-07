(function () {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  const modal = document.getElementById('listingModal');
  const modalImg = document.getElementById('listingModalImg');
  const modalVideo = document.getElementById('listingModalVideo');
  const modalPrev = document.getElementById('listingModalPrev');
  const modalNext = document.getElementById('listingModalNext');
  const modalTitle = document.getElementById('listingModalTitle');
  const modalPrice = document.getElementById('listingModalPrice');
  const modalPlace = document.getElementById('listingModalPlace');
  const modalSpecs = document.getElementById('listingModalSpecs');
  const modalDesc = document.getElementById('listingModalDesc');
  const modalClose = document.getElementById('listingModalClose');

  const ownerAddBtn = document.getElementById('ownerAddListingBtn');
  const ownerFormOverlay = document.getElementById('ownerFormOverlay');
  const ownerListingForm = document.getElementById('ownerListingForm');
  const ownerCancelFormBtn = document.getElementById('ownerCancelFormBtn');

  let listings = [];
  let activePhotoIndex = 0;
  let activeListing = null;
  let isOwner = false;

  function formatPrice(price) {
    const num = Number(price);
    if (Number.isNaN(num)) return price;
    return '$' + num.toLocaleString('en-US');
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function placeholderPhoto() {
    return 'https://i.imgur.com/RJV9XBt.jpg';
  }

  function renderCard(listing) {
    const status = (listing.status || 'Active').toLowerCase();
    const photo = (listing.photos && listing.photos[0]) || placeholderPhoto();
    const card = document.createElement('div');
    card.className = 'listing-card js-listing-card';
    card.dataset.category = status;
    card.innerHTML = `
      <div class="listing-photo">
        <img src="${esc(photo)}" alt="${esc(listing.address)}" loading="lazy">
        <span class="listing-tag tag-${esc(status)}">${esc(listing.status || 'Active')}</span>
        ${isOwner ? '<button type="button" class="owner-remove-btn">Remove</button>' : ''}
      </div>
      <div class="listing-info">
        <div class="listing-top">
          <h3>${esc(listing.address)}</h3>
          <span class="listing-price">${esc(formatPrice(listing.price))}</span>
        </div>
        <p class="listing-place">${esc(listing.city)}</p>
        <p class="listing-desc">${esc(listing.description)}</p>
        <p class="listing-specs">${esc(listing.beds)} bd &nbsp;·&nbsp; ${esc(listing.baths)} ba &nbsp;·&nbsp; ${Number(listing.sqft).toLocaleString('en-US')} sqft</p>
        <span class="listing-cta">View details →</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(listing));
    if (isOwner) {
      const removeBtn = card.querySelector('.owner-remove-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeListing(listing);
      });
    }
    return card;
  }

  function removeListing(listing) {
    if (!confirm(`Remove "${listing.address}" from the properties page?`)) return;
    fetch(`/api/admin/listings/${listing.id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Delete failed');
        return loadListings();
      })
      .catch(() => alert('Could not remove this property. Please try again.'));
  }

  function renderGrid() {
    grid.innerHTML = '';
    if (!listings.length) {
      grid.innerHTML = '<p class="listings-empty">No properties to show right now — check back soon, or search the full MLS.</p>';
      return;
    }
    listings.forEach((listing) => grid.appendChild(renderCard(listing)));
  }

  function loadListings() {
    return fetch('/api/listings')
      .then((res) => res.json())
      .then((data) => {
        listings = data;
        renderGrid();
      })
      .catch(() => {
        grid.innerHTML = '<p class="listings-empty">Couldn\'t load properties right now. Please try again shortly.</p>';
      });
  }

  function openModal(listing) {
    activeListing = listing;
    activePhotoIndex = 0;
    modalTitle.textContent = listing.address;
    modalPrice.textContent = formatPrice(listing.price);
    modalPlace.textContent = listing.city || '';
    modalSpecs.textContent = `${listing.beds} bd · ${listing.baths} ba · ${Number(listing.sqft).toLocaleString('en-US')} sqft`;
    modalDesc.textContent = listing.description || '';
    updateModalPhoto();
    modal.classList.add('open');
  }

  function slideCount() {
    const photos = (activeListing && activeListing.photos) || [];
    const hasVideo = Boolean(activeListing && activeListing.video);
    return photos.length + (hasVideo ? 1 : 0);
  }

  function updateModalPhoto() {
    const photos = (activeListing && activeListing.photos) || [];
    const hasVideo = Boolean(activeListing && activeListing.video);
    const onVideoSlide = hasVideo && activePhotoIndex === photos.length;

    if (onVideoSlide) {
      modalVideo.src = activeListing.video;
      modalVideo.classList.add('active');
      modalImg.classList.add('hidden-slide');
    } else {
      const photo = photos.length ? photos[activePhotoIndex] : placeholderPhoto();
      modalImg.src = photo;
      modalImg.alt = activeListing ? activeListing.address : '';
      modalImg.classList.remove('hidden-slide');
      modalVideo.classList.remove('active');
      modalVideo.pause();
      modalVideo.removeAttribute('src');
      modalVideo.load();
    }

    const hasMultiple = slideCount() > 1;
    modalPrev.style.display = hasMultiple ? '' : 'none';
    modalNext.style.display = hasMultiple ? '' : 'none';
  }

  function closeModal() {
    modal.classList.remove('open');
    activeListing = null;
    modalVideo.pause();
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  modalPrev.addEventListener('click', () => {
    const total = slideCount();
    if (!total) return;
    activePhotoIndex = (activePhotoIndex - 1 + total) % total;
    updateModalPhoto();
  });
  modalNext.addEventListener('click', () => {
    const total = slideCount();
    if (!total) return;
    activePhotoIndex = (activePhotoIndex + 1) % total;
    updateModalPhoto();
  });

  function openAddForm() {
    ownerListingForm.reset();
    ownerFormOverlay.classList.add('open');
  }

  function closeAddForm() {
    ownerFormOverlay.classList.remove('open');
  }

  if (ownerAddBtn) {
    ownerAddBtn.addEventListener('click', openAddForm);
    ownerCancelFormBtn.addEventListener('click', closeAddForm);
    ownerFormOverlay.addEventListener('click', (e) => {
      if (e.target === ownerFormOverlay) closeAddForm();
    });
    ownerListingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(ownerListingForm);
      fetch('/api/admin/listings', { method: 'POST', body: formData })
        .then((res) => {
          if (!res.ok) throw new Error('Save failed');
          return res.json();
        })
        .then(() => {
          closeAddForm();
          loadListings();
        })
        .catch(() => alert('Could not save this property. Please try again.'));
    });
  }

  fetch('/api/session')
    .then((res) => res.json())
    .then((data) => {
      isOwner = Boolean(data.authenticated);
      if (isOwner && ownerAddBtn) ownerAddBtn.classList.remove('hidden');
      return loadListings();
    })
    .catch(() => loadListings());
})();
