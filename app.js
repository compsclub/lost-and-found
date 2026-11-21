/* Fasilkom UI Lost & Found
 * Front-end only: reports are stored in the browser's localStorage.
 * To go live for everyone, replace loadReports()/saveReports() with calls to a backend API. */
(function () {
  'use strict';

  /* ---------- Config ---------- */
  // Bumped to v3 so any previously saved example posts are discarded.
  var STORAGE_KEY = 'fasilkom_lostfound_reports_v3';
  try { localStorage.removeItem('fasilkom_lostfound_reports_v2'); localStorage.removeItem('fasilkom_lostfound_reports_v1'); } catch (e) { /* ignore */ }

  var CATEGORIES = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'cards', label: 'Cards & Documents'},
    { value: 'bottle', label: 'Water Bottle'},
    { value: 'other', label: 'Other'}
  ];

  var LOCATIONS = [
    'Gedung Lama',
    'Gedung Baru'
  ];

  var CONTACT_METHODS = [
    { value: 'whatsapp', label: 'WhatsApp', field: 'WhatsApp number', placeholder: 'e.g. 081234567890' },
    { value: 'line', label: 'LINE', field: 'LINE ID', placeholder: 'e.g. rina.cs23' },
    { value: 'instagram', label: 'Instagram', field: 'Instagram username', placeholder: 'e.g. rina.cs23' },
    { value: 'telegram', label: 'Telegram', field: 'Telegram username', placeholder: 'e.g. rina_cs' },
    { value: 'email', label: 'Email', field: 'Email address', placeholder: 'e.g. name@ui.ac.id' }
  ];

  /* ---------- Helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function categoryOf(value) {
    return CATEGORIES.filter(function (c) { return c.value === value; })[0] || CATEGORIES[CATEGORIES.length - 1];
  }
  function contactOf(value) {
    return CONTACT_METHODS.filter(function (c) { return c.value === value; })[0] || CONTACT_METHODS[0];
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function formatDate(str) {
    var p = String(str).split('-');
    if (p.length !== 3) return str;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  /* ---------- Data ---------- */
  function seedReports() {
    return [];
  }

  function loadReports() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data)) return data;
      }
    } catch (e) { /* ignore */ }
    var seeded = seedReports();
    saveReports(seeded);
    return seeded;
  }

  function saveReports(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  var reports = loadReports();

  /* ---------- Contact privacy ----------
   * Only the one method the reporter selected is stored and rendered. */
  function contactHref(method, value) {
    var v = String(value).trim();
    switch (method) {
      case 'whatsapp':
        var digits = v.replace(/[^\d]/g, '');
        if (digits.indexOf('0') === 0) digits = '62' + digits.slice(1);
        return 'https://wa.me/' + digits;
      case 'instagram':
        return 'https://instagram.com/' + encodeURIComponent(v.replace(/^@/, ''));
      case 'telegram':
        return 'https://t.me/' + encodeURIComponent(v.replace(/^@/, ''));
      case 'email':
        return 'mailto:' + encodeURI(v);
      default:
        return ''; // LINE IDs can't be deep-linked reliably
    }
  }

  /* ---------- Views ---------- */
  var views = { list: $('#view-list'), detail: $('#view-detail'), form: $('#view-form') };

  function showView(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    $$('[data-nav]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === name);
    });
    window.scrollTo(0, 0);
  }

  /* ---------- List view ---------- */
  function fillSelect(select, items, getValue, getLabel) {
    items.forEach(function (it) {
      var o = document.createElement('option');
      o.value = getValue(it);
      o.textContent = getLabel(it);
      select.appendChild(o);
    });
  }

  function cardHTML(r) {
    var cat = categoryOf(r.category);
    var badge = '<span class="badge badge-' + esc(r.type) + '">' + (r.type === 'lost' ? 'Lost' : 'Found') + '</span>';
    var media = r.photo
      ? '<div class="card-media"><img src="' + esc(r.photo) + '" alt="Photo of ' + esc(r.title) + '" loading="lazy">' + badge + '</div>'
      : '';
    return '' +
      '<a class="report-card' + (r.photo ? '' : ' no-photo') + '" href="#/report/' + encodeURIComponent(r.id) + '">' +
        media +
        '<div class="card-body">' +
          (r.photo ? '' : '<div class="card-badge">' + badge + '</div>') +
          '<h3>' + esc(r.title) + '</h3>' +
          '<p class="card-desc">' + esc(r.description) + '</p>' +
          '<div class="meta">' +
            '<span>📍 ' + esc(r.location) + (r.room ? ' · ' + esc(r.room) : '') + '</span>' +
            '<span>📅 ' + esc(formatDate(r.date)) + '</span>' +
          '</div>' +
          '<span class="chip">' + esc(cat.label) + '</span>' +
        '</div>' +
      '</a>';
  }

  function applyFilters() {
    var q = $('#f-search').value.trim().toLowerCase();
    var type = $('#f-type').value;
    var cat = $('#f-category').value;
    var loc = $('#f-location').value;

    var list = reports.filter(function (r) {
      if (q && r.title.toLowerCase().indexOf(q) === -1) return false;
      if (type && r.type !== type) return false;
      if (cat && r.category !== cat) return false;
      if (loc && r.location !== loc) return false;
      return true;
    }).sort(function (a, b) { return b.createdAt - a.createdAt; });

    $('#report-grid').innerHTML = list.map(cardHTML).join('');
    $('#empty-state').hidden = list.length > 0;
    $('#result-count').textContent =
      list.length === reports.length
        ? 'Showing all ' + list.length + ' report' + (list.length === 1 ? '' : 's')
        : 'Showing ' + list.length + ' of ' + reports.length + ' reports';
  }

  function renderStats() {
    $('#stat-lost').textContent = reports.filter(function (r) { return r.type === 'lost'; }).length;
    $('#stat-found').textContent = reports.filter(function (r) { return r.type === 'found'; }).length;
  }

  function showList() {
    document.title = 'Fasilkom UI Lost & Found';
    renderStats();
    applyFilters();
    showView('list');
  }

  /* ---------- Detail view ---------- */
  function showDetail(id) {
    var r = reports.filter(function (x) { return x.id === id; })[0];
    var box = $('#detail-content');

    if (!r) {
      document.title = 'Report not found · Fasilkom UI Lost & Found';
      box.innerHTML = '<div class="empty"><div class="empty-icon" aria-hidden="true">❓</div>' +
        '<h2>Report not found</h2><p>This report may have been removed or the link is incorrect.</p>' +
        '<a href="#/" class="btn btn-blue">View all reports</a></div>';
      showView('detail');
      return;
    }

    var cat = categoryOf(r.category);
    var cm = contactOf(r.contactMethod);
    var href = contactHref(r.contactMethod, r.contactValue);
    var media = r.photo
      ? '<div class="detail-media"><img src="' + esc(r.photo) + '" alt="Photo of ' + esc(r.title) + '"></div>'
      : '';

    var action = href
      ? '<a class="btn btn-red" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">Open ' + esc(cm.label) + '</a>'
      : '';

    box.innerHTML = '' +
      '<article class="card detail">' +
        media +
        '<div class="detail-body">' +
          '<div class="detail-head">' +
            '<span class="badge badge-' + esc(r.type) + '">' + (r.type === 'lost' ? 'Lost' : 'Found') + '</span>' +
            '<h1>' + esc(r.title) + '</h1>' +
          '</div>' +
          '<dl class="info-grid">' +
            '<div class="info"><dt>Category</dt><dd>' + esc(cat.label) + '</dd></div>' +
            '<div class="info"><dt>Location</dt><dd>' + esc(r.location) + '</dd></div>' +
            (r.room ? '<div class="info"><dt>Room / spot</dt><dd>' + esc(r.room) + '</dd></div>' : '') +
            '<div class="info"><dt>' + (r.type === 'lost' ? 'Date lost' : 'Date found') + '</dt><dd>' + esc(formatDate(r.date)) + '</dd></div>' +
            (r.name ? '<div class="info"><dt>Posted by</dt><dd>' + esc(r.name) + '</dd></div>' : '') +
          '</dl>' +
          '<h2 class="section-title">Description</h2>' +
          '<p class="description">' + esc(r.description) + '</p>' +
          '<div class="contact-panel">' +
            '<div>' +
              '<div class="label">Contact via ' + esc(cm.label) + '</div>' +
              '<div class="value">' + esc(r.contactValue) + '</div>' +
              '<p class="note">' + (r.type === 'lost'
                ? 'Found this item? Please get in touch.'
                : 'Is this yours? Describe a detail that only the owner would know.') + '</p>' +
            '</div>' + action +
          '</div>' +
        '</div>' +
      '</article>';

    document.title = r.title + ' · Fasilkom UI Lost & Found';
    showView('detail');
  }

  /* ---------- Form view ---------- */
  var photoData = '';

  function updateTypeLabels() {
    var type = $('input[name="type"]:checked').value;
    $('#date-label').textContent = type === 'lost' ? 'Date lost' : 'Date found';
  }

  function updateContactField() {
    var cm = contactOf($('#r-contact-method').value);
    $('#contact-label').textContent = cm.field;
    $('#r-contact-value').placeholder = cm.placeholder;
    $('#r-contact-value').type = cm.value === 'email' ? 'email' : 'text';
  }

  function setError(name, msg) {
    var p = $('[data-error-for="' + name + '"]');
    if (!p) return;
    p.textContent = msg || '';
    var field = p.closest('.field');
    if (field) field.classList.toggle('invalid', !!msg);
  }

  function clearErrors() {
    $$('[data-error-for]').forEach(function (p) {
      p.textContent = '';
      var f = p.closest('.field');
      if (f) f.classList.remove('invalid');
    });
  }

  function resetForm(presetType) {
    $('#report-form').reset();
    clearErrors();
    photoData = '';
    $('#photo-preview').hidden = true;
    $('#photo-img').removeAttribute('src');
    $('#desc-count').textContent = '0';
    $('#r-date').max = todayStr();
    $('#r-date').value = todayStr();
    if (presetType === 'found' || presetType === 'lost') {
      $('input[name="type"][value="' + presetType + '"]').checked = true;
    }
    updateTypeLabels();
    updateContactField();
  }

  function showForm(presetType) {
    document.title = 'Submit a report · Fasilkom UI Lost & Found';
    resetForm(presetType);
    showView('form');
  }

  /* Downscale photos so they fit comfortably in localStorage */
  function processPhoto(file, cb) {
    var reader = new FileReader();
    reader.onerror = function () { cb(null); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { cb(null); };
      img.onload = function () {
        var max = 900;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function validate(data) {
    var ok = true;
    clearErrors();

    if (!data.title.trim()) { setError('title', 'Please enter the item name.'); ok = false; }
    if (!data.category) { setError('category', 'Please select a category.'); ok = false; }
    if (!data.location) { setError('location', 'Please select a location.'); ok = false; }

    if (!data.date) { setError('date', 'Please choose a date.'); ok = false; }
    else if (data.date > todayStr()) { setError('date', 'The date cannot be in the future.'); ok = false; }

    if (data.description.trim().length < 10) {
      setError('description', 'Please add a short description (at least 10 characters).'); ok = false;
    }

    var cv = data.contactValue.trim();
    if (!cv) {
      setError('contactValue', 'Please enter your contact detail.'); ok = false;
    } else if (data.contactMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cv)) {
      setError('contactValue', 'Please enter a valid email address.'); ok = false;
    } else if (data.contactMethod === 'whatsapp' && cv.replace(/[^\d]/g, '').length < 8) {
      setError('contactValue', 'Please enter a valid phone number.'); ok = false;
    }
    return ok;
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var data = {
      type: form.type.value,
      title: form.title.value,
      category: form.category.value,
      location: form.location.value,
      room: form.room.value,
      date: form.date.value,
      description: form.description.value,
      contactMethod: form.contactMethod.value,
      contactValue: form.contactValue.value,
      name: form.name.value
    };

    if (!validate(data)) {
      var first = $('.field.invalid', form);
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var report = {
      id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: data.type,
      title: data.title.trim(),
      category: data.category,
      location: data.location,
      room: data.room.trim(),
      date: data.date,
      description: data.description.trim(),
      photo: photoData,
      // Only the selected contact method is stored, so nothing else can leak publicly.
      contactMethod: data.contactMethod,
      contactValue: data.contactValue.trim(),
      name: data.name.trim(),
      createdAt: Date.now()
    };

    var next = [report].concat(reports);
    if (!saveReports(next)) {
      if (report.photo) {
        report.photo = '';
        next = [report].concat(reports);
        if (saveReports(next)) {
          reports = next;
          toast('Report published, but the photo was too large to store.');
          location.hash = '#/report/' + encodeURIComponent(report.id);
          return;
        }
      }
      toast('Could not save the report: browser storage is full.');
      return;
    }
    reports = next;
    toast('Your report has been published.');
    location.hash = '#/report/' + encodeURIComponent(report.id);
  }

  /* ---------- Router ---------- */
  function route() {
    var hash = location.hash || '#/';
    var parts = hash.split('?');
    var path = parts[0];
    var query = parts[1] || '';

    var m = path.match(/^#\/report\/(.+)$/);
    if (m) { showDetail(decodeURIComponent(m[1])); return; }
    if (path === '#/new') {
      var t = (query.match(/type=(lost|found)/) || [])[1];
      showForm(t);
      return;
    }
    showList();
  }

  /* ---------- Init ---------- */
  function init() {
    // Populate selects
    fillSelect($('#f-category'), CATEGORIES, function (c) { return c.value; }, function (c) { return c.label; });
    fillSelect($('#f-location'), LOCATIONS, function (l) { return l; }, function (l) { return l; });
    fillSelect($('#r-category'), CATEGORIES, function (c) { return c.value; }, function (c) { return c.label; });
    fillSelect($('#r-location'), LOCATIONS, function (l) { return l; }, function (l) { return l; });
    fillSelect($('#r-contact-method'), CONTACT_METHODS, function (c) { return c.value; }, function (c) { return c.label; });

    // Filters
    ['#f-search', '#f-type', '#f-category', '#f-location'].forEach(function (sel) {
      $(sel).addEventListener('input', applyFilters);
      $(sel).addEventListener('change', applyFilters);
    });
    $('#f-reset').addEventListener('click', function () {
      $('#filters').reset();
      applyFilters();
    });

    // Form interactions
    $$('input[name="type"]').forEach(function (r) { r.addEventListener('change', updateTypeLabels); });
    $('#r-contact-method').addEventListener('change', updateContactField);
    $('#r-description').addEventListener('input', function (e) {
      $('#desc-count').textContent = e.target.value.length;
    });

    $('#r-photo').addEventListener('change', function (e) {
      var file = e.target.files[0];
      setError('photo', '');
      if (!file) { photoData = ''; $('#photo-preview').hidden = true; return; }
      if (!/^image\//.test(file.type)) {
        setError('photo', 'Please choose an image file.');
        e.target.value = ''; return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('photo', 'Image is too large (max 10 MB).');
        e.target.value = ''; return;
      }
      processPhoto(file, function (dataUrl) {
        if (!dataUrl) { setError('photo', 'Could not read this image.'); return; }
        photoData = dataUrl;
        $('#photo-img').src = dataUrl;
        $('#photo-preview').hidden = false;
      });
    });
    $('#photo-remove').addEventListener('click', function () {
      photoData = '';
      $('#r-photo').value = '';
      $('#photo-preview').hidden = true;
    });

    $('#report-form').addEventListener('submit', onSubmit);

    window.addEventListener('hashchange', route);
    route();
  }

  init();
})();