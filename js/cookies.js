(function () {
  var KEY = '5star_cookie_consent';

  function getConsent() { return localStorage.getItem(KEY); }
  function setConsent(v) { localStorage.setItem(KEY, v); }

  function removeBanner(el) {
    el.style.transform = 'translateY(100%)';
    el.style.opacity = '0';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 380);
  }

  function enableTracking() {
    // Tracking is now permitted.
    // To add Google Analytics in the future, uncomment and replace GA_ID:
    // var s = document.createElement('script');
    // s.async = true;
    // s.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
    // document.head.appendChild(s);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    // gtag('js', new Date()); gtag('config', 'GA_ID');
    document.dispatchEvent(new Event('tracking-enabled'));
  }

  function showBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');

    banner.innerHTML =
      '<div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;flex:1;min-width:220px;">' +
          '<svg style="flex-shrink:0;margin-top:1px;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
          '<div>' +
            '<p style="margin:0 0 3px;font-size:0.88rem;font-weight:600;color:#1a1a1a;font-family:inherit;">This site uses cookies</p>' +
            '<p style="margin:0;font-size:0.82rem;color:#5b554e;line-height:1.6;font-family:inherit;">We use cookies to improve your experience on our site. You can accept or decline at any time. <a href="privacy.html" style="color:#C9A84C;font-weight:600;text-decoration:underline;text-underline-offset:2px;">Privacy Policy</a></p>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-shrink:0;">' +
          '<button id="cookie-decline" style="padding:9px 20px;background:transparent;border:1px solid #d4cfc9;border-radius:6px;font-size:0.83rem;font-weight:500;color:#5b554e;cursor:pointer;font-family:inherit;white-space:nowrap;transition:border-color 0.2s,color 0.2s;">Decline</button>' +
          '<button id="cookie-accept" style="padding:9px 22px;background:#C9A84C;border:1px solid #C9A84C;border-radius:6px;font-size:0.83rem;font-weight:700;color:#1a1000;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background 0.2s,transform 0.15s;">Accept all</button>' +
        '</div>' +
      '</div>';

    Object.assign(banner.style, {
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      background: '#ffffff',
      borderTop: '1px solid #e8e4df',
      padding: '16px 28px',
      zIndex: '99999',
      boxShadow: '0 -4px 28px rgba(0,0,0,0.09)',
      transform: 'translateY(100%)',
      opacity: '0',
      transition: 'transform 0.38s cubic-bezier(0.25,0.1,0.25,1), opacity 0.38s ease'
    });

    document.body.appendChild(banner);

    setTimeout(function () {
      banner.style.transform = 'translateY(0)';
      banner.style.opacity = '1';
    }, 700);

    var acceptBtn = document.getElementById('cookie-accept');
    var declineBtn = document.getElementById('cookie-decline');

    acceptBtn.addEventListener('click', function () {
      setConsent('accepted');
      removeBanner(banner);
      enableTracking();
    });
    acceptBtn.addEventListener('mouseenter', function () { this.style.background = '#b8912a'; });
    acceptBtn.addEventListener('mouseleave', function () { this.style.background = '#C9A84C'; });

    declineBtn.addEventListener('click', function () {
      setConsent('declined');
      removeBanner(banner);
    });
    declineBtn.addEventListener('mouseenter', function () { this.style.borderColor = '#C9A84C'; this.style.color = '#8a6a10'; });
    declineBtn.addEventListener('mouseleave', function () { this.style.borderColor = '#d4cfc9'; this.style.color = '#5b554e'; });
  }

  function init() {
    var consent = getConsent();
    if (!consent) {
      showBanner();
    } else if (consent === 'accepted') {
      enableTracking();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
