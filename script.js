// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.card, .section-title, .section-label').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// Navbar background on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.style.background = 'rgba(7, 9, 15, 0.92)';
  } else {
    navbar.style.background = 'rgba(7, 9, 15, 0.7)';
  }
}, { passive: true });
