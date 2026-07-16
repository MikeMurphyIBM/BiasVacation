// script.js — 2027 Bias Family Vacation
// Handles: path switching, scroll reveal, smooth navigation, sticky nav

(function () {
  'use strict';

  // ============================================================
  // PATH SWITCHER
  // ============================================================
  const pathMap = {
    history: 'path-history',
    stay:    'path-stay',
    food:    'path-food',
    things:  'path-things',
    outdoor: 'path-outdoor',
    spa:     'path-spa',
  };

  function activatePath(pathKey) {
    // Hide all panels
    Object.values(pathMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
      }
    });

    // Show chosen panel
    var target = document.getElementById(pathMap[pathKey]);
    if (target) {
      target.classList.add('active');
      // Re-run reveal for newly shown section
      observeReveals();
    }

    // Update trail buttons (hero chooser)
    document.querySelectorAll('.trail-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.path === pathKey);
    });

    // Update sticky nav links
    document.querySelectorAll('.nav-trail-link').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.path === pathKey);
    });

    // Scroll to trail chooser
    var chooser = document.getElementById('trail-chooser');
    if (chooser) {
      var offset = chooser.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }

  // Wire up hero trail chooser buttons
  document.querySelectorAll('.trail-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activatePath(btn.dataset.path);
    });
  });

  // Wire up sticky nav buttons
  document.querySelectorAll('.nav-trail-link').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activatePath(btn.dataset.path);
    });
  });

  // ============================================================
  // HERO BUTTONS
  // ============================================================
  var rideBtn = document.getElementById('hero-ride-btn');
  if (rideBtn) {
    rideBtn.addEventListener('click', function () {
      var chooser = document.getElementById('trail-chooser');
      if (chooser) {
        chooser.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  var scrollBtn = document.getElementById('hero-scroll-btn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      var main = document.querySelector('main');
      if (main) {
        main.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ============================================================
  // SMOOTH SCROLL for any <a href="#..."> links
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ============================================================
  // STICKY NAV — show after hero
  // ============================================================
  var stickyNav = document.getElementById('sticky-nav');
  var hero = document.querySelector('.hero');

  if (stickyNav && hero) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // When hero is NOT visible, add a visible class to nav
          if (!entry.isIntersecting) {
            stickyNav.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
          } else {
            stickyNav.style.boxShadow = 'none';
          }
        });
      },
      { threshold: 0.1 }
    );
    navObserver.observe(hero);
  }

  // ============================================================
  // SCROLL REVEAL
  // ============================================================
  var revealObserver = null;

  function observeReveals() {
    var reveals = document.querySelectorAll('.reveal:not(.visible)');

    if (!reveals.length) return;

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
    }

    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  // Initial observe on page load
  observeReveals();

  // ============================================================
  // CARD IMAGE FALLBACK — handle broken Unsplash URLs gracefully
  // ============================================================
  document.querySelectorAll('img.card-img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.style.display = 'none';
      var placeholder = document.createElement('div');
      placeholder.className = 'card-img-placeholder';
      placeholder.textContent = '🏝️';
      img.parentNode.insertBefore(placeholder, img.nextSibling);
    });
  });

  // ============================================================
  // SECTION BANNER parallax — subtle depth effect on scroll
  // ============================================================
  function onScroll() {
    var banners = document.querySelectorAll('.section-banner-bg');
    banners.forEach(function (bg) {
      var rect = bg.parentElement.getBoundingClientRect();
      var offset = (rect.top / window.innerHeight) * 20;
      bg.style.transform = 'translateY(' + offset + 'px)';
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

})();
