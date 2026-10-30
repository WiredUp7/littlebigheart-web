(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  root.setAttribute('data-js', 'ok');

  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  // Menüü (mobiil)
  var hdr = d.querySelector('.hdr');
  var burger = d.querySelector('.burger');

  function shut() {
    if (!hdr || !burger) return;
    hdr.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', burger.getAttribute('data-open') || '');
  }

  if (hdr && burger) {
    burger.addEventListener('click', function () {
      var open = hdr.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', (open ? burger.getAttribute('data-close') : burger.getAttribute('data-open')) || '');
    });
    each(d.querySelectorAll('.nav a'), function (a) {
      a.addEventListener('click', shut);
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && hdr.classList.contains('open')) {
        shut();
        burger.focus();
      }
    });
  }

  // Lehesisesed lingid: sujuv kerimine ja fookus sihtkohta
  each(d.querySelectorAll('a[href^="#"]'), function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      var t = d.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', id);
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    });
  });

  // Sõnade kaupa esiletulev tekst ja viivitused
  each(d.querySelectorAll('.words'), function (el) {
    var parts = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    parts.forEach(function (w, i) {
      var s = d.createElement('span');
      s.className = 'w';
      s.style.setProperty('--wd', Math.min(i / 22, 0.6).toFixed(2) + 's');
      s.textContent = w;
      el.appendChild(s);
      if (i < parts.length - 1) el.appendChild(d.createTextNode(' '));
    });
  });

  each(d.querySelectorAll('.stag'), function (p) {
    each(p.children, function (c, i) {
      c.style.setProperty('--d', Math.min(i / 12, 0.36).toFixed(2) + 's');
    });
  });

  // Kampaania loendur: enne starti aeg alguseni, kampaania ajal lõpuni, pärast lõppu peidus.
  // Kuupäev ja ühikud tulevad brauseri Intl-ist lehe keeles ja külastaja ajavööndis.
  var cds = d.querySelectorAll('.cd[data-start]');
  if (cds.length) {
    var lang = root.getAttribute('lang') || 'et';
    var oma = { et: { day: ['päev', 'päeva'] }, sv: { day: ['dag', 'dagar'] }, nb: { day: ['dag', 'dager'] } };
    var yksused = ['day', 'hour', 'minute', 'second'];

    var nimi = function (n, u) {
      var o = oma[lang.slice(0, 2) === 'nb' ? 'nb' : lang.slice(0, 2)];
      if (o && o[u]) return o[u][n === 1 ? 0 : 1];
      try {
        return new Intl.NumberFormat(lang, { style: 'unit', unit: u, unitDisplay: 'long' }).formatToParts(n)
          .filter(function (p) { return p.type === 'unit'; }).map(function (p) { return p.value; }).join('');
      } catch (e) {
        return { day: 'd', hour: 'h', minute: 'min', second: 's' }[u];
      }
    };

    var kuup = function (t) {
      try {
        return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(t);
      } catch (e) {
        return new Date(t).toLocaleString();
      }
    };

    var joonista = function (cd) {
      var algus = Date.parse(cd.getAttribute('data-start'));
      var lopp = Date.parse(cd.getAttribute('data-end'));
      var nyyd = Date.now();
      if (!(nyyd < lopp)) {
        cd.hidden = true;
        return false;
      }
      var enne = nyyd < algus;
      var jaak = Math.max(0, Math.floor(((enne ? algus : lopp) - nyyd) / 1000));
      var arvud = [Math.floor(jaak / 86400), Math.floor(jaak / 3600) % 24, Math.floor(jaak / 60) % 60, jaak % 60];
      cd.classList.toggle('kaib', !enne);
      cd.querySelector('.cd-t').textContent = cd.getAttribute(enne ? 'data-enne' : 'data-kaib');
      cd.querySelector('.cd-aeg').textContent = enne ? kuup(algus) : '';
      cd.querySelector('.cd-s').textContent = cd.getAttribute(enne ? 'data-jalgi' : 'data-lopuni');
      var n = cd.querySelector('.cd-n');
      if (!n.children.length) {
        yksused.forEach(function () {
          var u = d.createElement('span');
          u.className = 'cd-u';
          u.appendChild(d.createElement('b'));
          u.appendChild(d.createElement('span'));
          n.appendChild(u);
        });
      }
      each(n.children, function (u, i) {
        u.firstChild.textContent = i ? (arvud[i] < 10 ? '0' : '') + arvud[i] : String(arvud[i]);
        u.lastChild.textContent = nimi(arvud[i], yksused[i]);
      });
      cd.hidden = false;
      return true;
    };

    var tiksu = function () {
      var elus = false;
      each(cds, function (cd) { if (joonista(cd)) elus = true; });
      if (elus) setTimeout(tiksu, 1000 - (Date.now() % 1000));
    };
    tiksu();
  }

  // Sissekerimine
  var els = d.querySelectorAll('.rev, .words');
  if (!('IntersectionObserver' in window)) {
    each(els, function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    each(els, function (e) { io.observe(e); });
  }

  // Taganemisvorm: kaks sammu (ilma JS-ita on see üks samm ja saatmisnupp on olemas)
  var form = d.getElementById('vorm');
  if (!form) return;

  var s1 = form.querySelector('[data-samm="1"]');
  var s2 = form.querySelector('[data-samm="2"]');
  var nextBtn = form.querySelector('.js-edasi');
  var plainBtn = form.querySelector('.js-saada');
  var backBtn = form.querySelector('.js-muuda');
  var stepper = d.querySelector('.stepper');
  var card = d.getElementById('vorm-kaart');
  var started = form.querySelector('[name="algus"]');
  var heading = s2 ? s2.querySelector('.ulevaade-h') : null;
  var okBtn = s2 ? s2.querySelector('button[type="submit"]') : null;
  var msgRequired = form.getAttribute('data-msg-required') || '';
  var msgOsa = form.getAttribute('data-msg-osa') || '';
  var review = false;

  if (started) started.value = String(Date.now());
  if (!s1 || !s2 || !nextBtn) return;

  var textFields = ['nimi', 'epost', 'tellimus'].map(function (n) { return form.elements[n]; });
  var info = form.elements['lisainfo'];

  function checked() {
    return form.querySelector('input[name="ulatus"]:checked');
  }

  function check() {
    textFields.forEach(function (f) {
      if (!f) return;
      f.setCustomValidity('');
      if (!f.value.trim()) f.setCustomValidity(msgRequired);
    });
    if (info) {
      info.setCustomValidity('');
      var r = checked();
      if (r && r.value === 'osa' && !info.value.trim()) info.setCustomValidity(msgOsa);
    }
    return form.reportValidity();
  }

  function value(name) {
    var el = form.elements[name];
    return el ? String(el.value).trim() : '';
  }

  function fill() {
    each(s2.querySelectorAll('[data-fld]'), function (dd) {
      var n = dd.getAttribute('data-fld');
      var t = '';
      if (n === 'ulatus') {
        var r = checked();
        var lab = r ? r.closest('label') : null;
        t = lab ? lab.textContent.trim() : '';
      } else {
        t = value(n);
      }
      if (!t) t = dd.getAttribute('data-empty') || '';
      dd.textContent = t;
    });
  }

  function show(step) {
    var two = step === 2;
    review = two;
    s1.hidden = two;
    s2.hidden = !two;
    if (stepper) {
      each(stepper.querySelectorAll('li'), function (li, i) {
        var on = (i === 1) === two;
        li.classList.toggle('on', on);
        if (on) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
      });
    }
    if (card) card.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    var target = two ? heading : form.elements['nimi'];
    if (target) target.focus({ preventScroll: true });
  }

  function goNext() {
    if (check()) {
      fill();
      show(2);
    }
  }

  form.addEventListener('input', function (e) {
    var t = e.target;
    if (t && t.setCustomValidity) t.setCustomValidity('');
    if (t && t.name === 'ulatus' && info) info.setCustomValidity('');
  });

  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !review && e.target && e.target.tagName === 'INPUT') {
      e.preventDefault();
      goNext();
    }
  });

  form.addEventListener('submit', function (e) {
    if (!review) {
      e.preventDefault();
      goNext();
      return;
    }
    if (okBtn) okBtn.disabled = true;
  });

  window.addEventListener('pageshow', function (e) {
    if (e.persisted && okBtn) okBtn.disabled = false;
  });

  nextBtn.addEventListener('click', goNext);
  if (backBtn) backBtn.addEventListener('click', function () { show(1); });

  nextBtn.hidden = false;
  if (plainBtn && plainBtn.parentNode) plainBtn.parentNode.removeChild(plainBtn);
  if (stepper) stepper.hidden = false;
})();

// Külastuste statistika: Cloudflare Web Analytics (küpsisteta, koondarvud). Ainult päris domeenil,
// et eelvaade ja testid statistikat ei risustaks. ?notrack=1 jätab selle brauseri jäädavalt välja
// (oma kontrollkülastused), ?notrack=0 lülitab tagasi.
(function () {
  if (location.hostname !== 'littlebigheart.store') return;
  try {
    var p = new URLSearchParams(location.search).get('notrack');
    if (p === '1') localStorage.setItem('lbh_notrack', '1');
    else if (p === '0') localStorage.removeItem('lbh_notrack');
    if (localStorage.getItem('lbh_notrack') === '1') return;
  } catch (e) {}
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', '{"token": "6191584bee094b7dac868cccf1211be1"}');
  document.head.appendChild(s);
})();
