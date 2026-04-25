const navbar = document.getElementById("navbar");

const updateNav = () => {
  navbar.classList.toggle("is-scrolled", window.scrollY > 48);
};

updateNav();
window.addEventListener("scroll", updateNav, { passive: true });
