const navbar = document.getElementById("navbar");
const hero = document.getElementById("hero");
const toTop = document.querySelector(".to-top");

if (navbar && hero && "IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(([entry]) => {
    navbar.classList.toggle("is-scrolled", !entry.isIntersecting);
    toTop?.classList.toggle("is-visible", !entry.isIntersecting);
  }, {
    rootMargin: "-48px 0px 0px 0px",
    threshold: 0
  });

  navObserver.observe(hero);
} else {
  toTop?.classList.add("is-visible");
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealEls = document.querySelectorAll("[data-reveal]");

if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      el.style.transitionDelay = `${Number(el.dataset.revealDelay) || 0}ms`;
      el.classList.add("is-revealed");
      observer.unobserve(el);
    });
  }, {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.12
  });

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-revealed"));
}


// Tiny 3D ghosts: drag to turn, tap to spin once.
document.querySelectorAll(".hw-ghost").forEach((ghost) => {
  let downX = 0;
  let downY = 0;
  let spinning = false;

  ghost.addEventListener("pointerdown", (event) => {
    downX = event.clientX;
    downY = event.clientY;
  });

  ghost.addEventListener("click", (event) => {
    const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
    if (moved > 6 || spinning || !ghost.loaded || prefersReducedMotion.matches) return;

    spinning = true;
    const orbit = ghost.getCameraOrbit();
    const start = orbit.theta;
    const duration = 900;
    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      ghost.cameraOrbit = `${start + eased * Math.PI * 2}rad ${orbit.phi}rad ${orbit.radius}m`;
      ghost.jumpCameraToGoal();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        spinning = false;
      }
    };

    requestAnimationFrame(step);
  });
});
