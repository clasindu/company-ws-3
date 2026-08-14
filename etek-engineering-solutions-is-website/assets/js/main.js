/* =========================================================================
   ETEK - Interaction layer
   Progressive enhancement only: every section is readable and usable with
   JavaScript disabled.
   ========================================================================= */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  function initYear() {
    var el = document.getElementById('year');
    if (el) {
      el.textContent = String(new Date().getFullYear());
    }
  }

  /* ---------------------------------------------------------------------
     Theme toggle, persisted in localStorage
     --------------------------------------------------------------------- */
  function initTheme() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    function sync() {
      var isDark = document.documentElement.dataset.theme === 'dark';
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    toggle.addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('etek-theme', next);
      } catch (e) {}
      sync();
    });

    sync();
  }

  /* ---------------------------------------------------------------------
     Sticky header shadow and mobile navigation
     --------------------------------------------------------------------- */
  function initHeader() {
    var header = document.getElementById('site-header');
    var navToggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');

    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-stuck', window.scrollY > 8);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (!navToggle || !nav) return;

    var setOpen = function (open) {
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
    };

    navToggle.addEventListener('click', function () {
      setOpen(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (navToggle.getAttribute('aria-expanded') !== 'true') return;
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------------
     Services tabs - roving tabindex, arrow key support
     --------------------------------------------------------------------- */
  function initTabs() {
    var list = document.querySelector('[role="tablist"]');
    if (!list) return;

    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(i, false);
      });

      tab.addEventListener('keydown', function (event) {
        var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (event.key in keys) {
          event.preventDefault();
          select((i + keys[event.key] + tabs.length) % tabs.length, true);
        } else if (event.key === 'Home') {
          event.preventDefault();
          select(0, true);
        } else if (event.key === 'End') {
          event.preventDefault();
          select(tabs.length - 1, true);
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Products carousel - native scroll snap, buttons drive scrollTo
     --------------------------------------------------------------------- */
  function initCarousel() {
    var viewport = document.getElementById('products-viewport');
    var prev = document.getElementById('products-prev');
    var next = document.getElementById('products-next');
    var progress = document.getElementById('products-progress');
    if (!viewport || !prev || !next) return;

    var slides = Array.prototype.slice.call(viewport.querySelectorAll('.carousel__slide'));
    if (!slides.length) return;

    function step() {
      var gap = parseFloat(getComputedStyle(viewport).columnGap) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    }

    function update() {
      var max = viewport.scrollWidth - viewport.clientWidth;
      prev.disabled = viewport.scrollLeft <= 2;
      next.disabled = viewport.scrollLeft >= max - 2;

      if (progress) {
        var perView = Math.max(1, Math.round(viewport.clientWidth / step()));
        var width = Math.min(100, (perView / slides.length) * 100);
        var travel = max > 0 ? viewport.scrollLeft / max : 0;
        // translateX is a share of the bar's own width, not of the track.
        var shift = width < 100 ? (travel * (100 - width) * 100) / width : 0;
        progress.style.width = width + '%';
        progress.style.transform = 'translateX(' + shift + '%)';
      }
    }

    prev.addEventListener('click', function () {
      viewport.scrollBy({ left: -step(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    next.addEventListener('click', function () {
      viewport.scrollBy({ left: step(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    viewport.addEventListener('scroll', function () {
      window.requestAnimationFrame(update);
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
  }

  /* ---------------------------------------------------------------------
     Autoplaying section videos - muted loop, no controls, pause off-screen
     --------------------------------------------------------------------- */
  function bindAutoplayVideo(stage, video) {
    if (!stage || !video) return;

    var wantsPlayback = !prefersReducedMotion;
    var isOnScreen = true;

    function apply() {
      if (!wantsPlayback || !isOnScreen) {
        video.pause();
        return;
      }
      var started = video.play();
      if (started && typeof started.catch === 'function') started.catch(function () {});
    }

    if (prefersReducedMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        isOnScreen = entries[0].isIntersecting;
        apply();
      }, { threshold: 0.15 }).observe(stage);
    }

    apply();
  }

  function initVesselVideo() {
    bindAutoplayVideo(document.getElementById('vessel'), document.getElementById('vessel-video'));
  }

  /* ---------------------------------------------------------------------
     Scroll reveal - staggered inside a shared parent
     --------------------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll(
      '.section-head, .bento > *, .tabs, .products__stage, .carousel, .why__media,' +
      ' .accordion, .process .step, .careers__collage, .careers__points, .about__stack,' +
      ' .about__facts, .contact-tile, .contact__panel, .build-cta__inner > *'
    );
    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.add('reveal', 'is-visible');
      });
      return;
    }

    var groups = new Map();
    targets.forEach(function (el) {
      el.classList.add('reveal');
      var parent = el.parentElement;
      var index = groups.get(parent) || 0;
      groups.set(parent, index + 1);
      el.style.setProperty('--reveal-delay', Math.min(index, 5) * 70 + 'ms');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     Highlight the section currently in view in the main nav
     --------------------------------------------------------------------- */
  function initNavHighlight() {
    if (!('IntersectionObserver' in window)) return;

    var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
    var map = new Map();

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var section = document.querySelector(id);
      if (section) map.set(section, link);
    });

    if (!map.size) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.removeAttribute('aria-current');
        });
        var active = map.get(entry.target);
        if (active) active.setAttribute('aria-current', 'page');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach(function (link, section) {
      observer.observe(section);
    });
  }

  /* ---------------------------------------------------------------------
     Hero — subtle white particles across the full navy section
     --------------------------------------------------------------------- */
  function initHeroParticles() {
    var hero = document.querySelector('.hero');
    var canvas = document.getElementById('hero-particles');
    if (!hero || !canvas) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var particles = [];
    var running = true;
    var dpr = 1;
    var w = 0;
    var h = 0;
    var start = 0;

    function seed() {
      particles = [];
      var cols = 14;
      var rows = 8;
      var gx;
      var gy;
      var roll;
      var size;
      var p;

      for (gy = 0; gy < rows; gy++) {
        for (gx = 0; gx < cols; gx++) {
          if (Math.random() < 0.16) continue;
          roll = Math.random();
          if (roll > 0.9) size = 2.3 + Math.random() * 0.7;
          else if (roll > 0.55) size = 1.6 + Math.random() * 0.5;
          else size = 1 + Math.random() * 0.55;
          p = {
            ox: ((gx + 0.1 + Math.random() * 0.8) / cols) * w,
            oy: ((gy + 0.1 + Math.random() * 0.8) / rows) * h,
            r: size,
            aBase: 0.22 + Math.random() * 0.38,
            ampX: 14 + Math.random() * 22,
            ampY: 16 + Math.random() * 26,
            spdX: 0.35 + Math.random() * 0.55,
            spdY: 0.4 + Math.random() * 0.65,
            drift: (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 9),
            fade: 0.35 + Math.random() * 0.55,
            phase: Math.random() * Math.PI * 2
          };
          particles.push(p);
        }
      }
    }

    function resize() {
      var nextW = hero.clientWidth || 1;
      var nextH = hero.clientHeight || 1;
      var nextDpr = Math.min(window.devicePixelRatio || 1, 1.75);
      if (nextW === w && nextH === h && nextDpr === dpr && canvas.width) return;
      var sx = w ? nextW / w : 1;
      var sy = h ? nextH / h : 1;
      dpr = nextDpr;
      w = nextW;
      h = nextH;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!particles.length) seed();
      else {
        var i;
        for (i = 0; i < particles.length; i++) {
          particles[i].ox *= sx;
          particles[i].oy *= sy;
        }
      }
    }

    function wrap(v, max) {
      if (v < -8) return v + max + 16;
      if (v > max + 8) return v - max - 16;
      return v;
    }

    function paint(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var i;
      var p;
      var x;
      var y;
      var alpha;
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        x = wrap(p.ox + Math.sin(t * p.spdX + p.phase) * p.ampX + p.drift * t * 0.12, w);
        y = wrap(p.oy + Math.cos(t * p.spdY + p.phase * 0.9) * p.ampY, h);
        alpha = p.aBase * (0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * p.fade + p.phase)));
        ctx.beginPath();
        ctx.arc(x * dpr, y * dpr, p.r * 2.4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.2) + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x * dpr, y * dpr, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.fill();
      }
    }

    function tick(now) {
      requestAnimationFrame(tick);
      if (!running) return;
      paint((now - start) / 1000);
    }

    resize();
    window.addEventListener('resize', resize);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(hero);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
      }, { threshold: 0.02 }).observe(hero);
    }

    start = performance.now();
    paint(0);
    requestAnimationFrame(tick);
  }

  function init() {
    initYear();
    initTheme();
    initHeader();
    initTabs();
    initCarousel();
    initVesselVideo();
    initReveal();
    initNavHighlight();
    initHeroParticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
