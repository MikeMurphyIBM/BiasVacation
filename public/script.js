// script.js — 2027 Bias Family Vacation
// Scroll reveal for inner pages

(function () {
  'use strict';

  // Reveal elements on scroll
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });

  // Subtle parallax on fixed background — moves slightly on scroll for depth
  var bg = document.querySelector('.page-bg');
  if (bg) {
    window.addEventListener('scroll', function () {
      var offset = window.scrollY * 0.18;
      bg.style.transform = 'translateY(' + offset + 'px)';
    }, { passive: true });
  }

})();
