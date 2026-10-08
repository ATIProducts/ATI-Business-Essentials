/* ATI Business Essentials: small, dependency-free site script.
   Mobile menu, Services dropdown, contact forms, cookie consent, and ad attribution. */
(function () {
  'use strict';

  // ---------- Mobile menu ----------
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  var ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18"></path></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"></path></svg>';
  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.setAttribute('data-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.innerHTML = (open ? ICON_CLOSE : ICON_MENU) + '<span class="sr-only">' + (open ? 'Close menu' : 'Open menu') + '</span>';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(nav.getAttribute('data-open') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // ---------- Services dropdown: close on outside click ----------
  document.addEventListener('click', function (e) {
    var open = document.querySelectorAll('#site-nav details[open]');
    for (var i = 0; i < open.length; i++) if (!open[i].contains(e.target)) open[i].open = false;
  });

  // ---------- Ad attribution (gclid / UTM), kept for the session ----------
  function readAttr() { try { return JSON.parse(sessionStorage.getItem('ati_attr') || '{}'); } catch (e) { return {}; } }
  try {
    var q = new URLSearchParams(window.location.search);
    var keys = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    var found = {};
    keys.forEach(function (k) { if (q.get(k)) found[k] = q.get(k); });
    var attr = readAttr();
    if (Object.keys(found).length) {
      Object.keys(found).forEach(function (k) { attr[k] = found[k]; });
      attr.landing = window.location.pathname;
      sessionStorage.setItem('ati_attr', JSON.stringify(attr));
    } else if (!sessionStorage.getItem('ati_attr') && document.referrer) {
      sessionStorage.setItem('ati_attr', JSON.stringify({ referrer: document.referrer, landing: window.location.pathname }));
    }
  } catch (e) {}

  // ---------- Contact forms ----------
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get('service');
  var forms = document.querySelectorAll('form.form-card');
  Array.prototype.forEach.call(forms, function (form) {
    var select = form.querySelector('select[name="service"]');
    if (wanted && select) {
      for (var i = 0; i < select.options.length; i++) if (select.options[i].value === wanted || select.options[i].text === wanted) select.selectedIndex = i;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var old = form.querySelector('.form-msg');
      if (old) old.parentNode.removeChild(old);
      var fd = new FormData(form);
      var payload = {
        name: fd.get('name') || '', email: fd.get('email') || '', phone: fd.get('phone') || '',
        service: fd.get('service') || '', message: fd.get('message') || '',
        company_website: fd.get('company_website') || '', page: window.location.pathname,
      };
      var a = readAttr(); Object.keys(a).forEach(function (k) { payload[k] = a[k]; });
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Something went wrong. Please call (800) 360-6115.'); return j; }); })
        .then(function () {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'generate_lead', lead_service: payload.service, form_location: payload.page });
          form.innerHTML = '<h3>Thanks, we got it.</h3><p class="form-msg ok" role="status">Your message is on its way. A member of our team will reach out shortly, usually within one business day.</p>';
        })
        .catch(function (err) {
          var p = document.createElement('p');
          p.className = 'form-msg err'; p.setAttribute('role', 'alert'); p.textContent = err.message;
          if (btn) { btn.parentNode.insertBefore(p, btn); btn.disabled = false; btn.textContent = 'Send'; }
        });
    });
  });

  // ---------- Cookie consent (Google Consent Mode v2) ----------
  var choice = null;
  try { choice = localStorage.getItem('ati_consent'); } catch (e) {}
  if (choice !== 'granted' && choice !== 'denied' && !/\/admin/.test(window.location.pathname)) {
    var bar = document.createElement('div');
    bar.className = 'cookie'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML = '<p>We use cookies to understand how visitors use this site and to measure our ads. You can accept or decline non-essential cookies. <a href="/privacy-policy">Privacy policy</a></p>' +
      '<button type="button" class="btn btn-outline" data-c="denied" style="color:#fff;border-color:#fff">Decline</button>' +
      '<button type="button" class="btn btn-primary" data-c="granted">Accept</button>';
    bar.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-c');
      if (!v) return;
      try { localStorage.setItem('ati_consent', v); } catch (err) {}
      if (typeof window.gtag === 'function') window.gtag('consent', 'update', { ad_storage: v, analytics_storage: v, ad_user_data: v, ad_personalization: v });
      bar.parentNode.removeChild(bar);
    });
    document.body.appendChild(bar);
  }
  // ---------- Motion: sections slide in as you scroll, numbers count up ----------
  // Skipped for visitors whose device asks for reduced motion, and in the admin editor (no scripts run there).
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var SEL = '.section .section-head, .section .card, .section .split > *, .section .stats > li, .section .steps > li, .section .faq > details, .section .answer-box, .section .prose > h2, .section .prose > p, .section .prose > ul, .section .form-card, .section .pill-list, .section .checklist, .section .contact-points, .section .wrap > h2, .section .wrap > .lead, .section .wrap > .btn-row, .section .blog-card';
    var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
    var picked = els.filter(function (el) {
      for (var p = el.parentElement; p; p = p.parentElement) if (els.indexOf(p) !== -1) return false; // no nested reveals
      return !el.closest('.hero');
    });
    var count = function (el) {
      var m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(el.textContent.trim());
      if (!m || el.getAttribute('data-counted')) return;
      el.setAttribute('data-counted', '1');
      var final = el.textContent, target = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, t0 = null;
      el.setAttribute('aria-label', final.trim());
      var step = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - k, 3);
        el.textContent = k < 1 ? m[1] + (target * e).toFixed(dec) + m[3] : final;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        el.classList.add('in');
        var nums = el.matches('.stat-value') ? [el] : el.querySelectorAll('.stat-value');
        for (var i = 0; i < nums.length; i++) count(nums[i]);
        // once in place, hand the element back to the normal hover effects
        setTimeout(function () { el.classList.remove('reveal', 'in'); el.style.transitionDelay = ''; el.removeAttribute('data-from'); }, 1600);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    var groups = new Map();
    picked.forEach(function (el) {
      var parent = el.parentElement, n = groups.get(parent) || 0;
      groups.set(parent, n + 1);
      if (el.parentElement.classList.contains('split')) {
        var isMedia = el.classList.contains('split-media'), left = el.parentElement.classList.contains('img-left');
        el.setAttribute('data-from', isMedia === left ? 'left' : 'right');
      } else if (el.matches('.form-card, .answer-box')) el.setAttribute('data-from', 'zoom');
      if (n) el.style.transitionDelay = Math.min(n, 5) * 0.1 + 's';
      el.classList.add('reveal');
      io.observe(el);
    });
    document.documentElement.classList.add('anim');
  }
})();
