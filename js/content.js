(function () {
  var page = document.body.getAttribute('data-page');
  if (!page) return;

  function keyOf(attrValue) {
    return attrValue.split('.').slice(1).join('.');
  }

  fetch('/api/content')
    .then(function (res) { return res.json(); })
    .then(function (content) {
      var pageContent = content[page] || {};

      document.querySelectorAll('[data-editable]').forEach(function (el) {
        var key = keyOf(el.getAttribute('data-editable'));
        if (Object.prototype.hasOwnProperty.call(pageContent, key)) {
          el.innerHTML = pageContent[key];
        }
      });

      document.querySelectorAll('[data-editable-img]').forEach(function (el) {
        var key = keyOf(el.getAttribute('data-editable-img'));
        if (Object.prototype.hasOwnProperty.call(pageContent, key)) {
          el.src = pageContent[key];
        }
      });

      document.querySelectorAll('[data-editable-bg]').forEach(function (el) {
        var key = keyOf(el.getAttribute('data-editable-bg'));
        if (Object.prototype.hasOwnProperty.call(pageContent, key)) {
          el.style.backgroundImage = "url('" + pageContent[key] + "')";
        }
      });
    })
    .catch(function () { /* keep default HTML content on failure */ });
})();
