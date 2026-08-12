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
     Products video - play/pause control, paused while off screen
     --------------------------------------------------------------------- */
  function initVesselVideo() {
    var stage = document.getElementById('vessel');
    var video = document.getElementById('vessel-video');
    var button = document.getElementById('vessel-playback');
    if (!stage || !video || !button) return;

    // Looping footage is a motion effect, so the OS setting decides whether it
    // runs on load. The button can still start it either way.
    var wantsPlayback = !prefersReducedMotion;
    var isOnScreen = true;

    function syncButton() {
      var paused = video.paused;
      stage.classList.toggle('is-paused', paused);
      button.title = paused ? 'Play the video' : 'Pause the video';
      button.setAttribute(
        'aria-label',
        paused ? 'Play the port operations video' : 'Pause the port operations video'
      );
    }

    function apply() {
      if (!wantsPlayback || !isOnScreen) {
        video.pause();
        return;
      }
      var started = video.play();
      // Some browsers refuse to autoplay: keep the button honest when they do.
      if (started && typeof started.catch === 'function') started.catch(syncButton);
    }

    button.addEventListener('click', function () {
      wantsPlayback = video.paused;
      apply();
    });

    video.addEventListener('play', syncButton);
    video.addEventListener('pause', syncButton);

    if (prefersReducedMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    }

    // Playing off screen spends bandwidth and battery on nothing.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        isOnScreen = entries[0].isIntersecting;
        apply();
      }, { threshold: 0.15 }).observe(stage);
    }

    syncButton();
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

  function init() {
    initYear();
    initTheme();
    initHeader();
    initTabs();
    initCarousel();
    initVesselVideo();
    initReveal();
    initNavHighlight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
