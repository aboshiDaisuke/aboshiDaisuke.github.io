const navbar = document.getElementById("navbar");
const hero = document.getElementById("hero");

if (navbar && hero) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Heroセクションの上部が画面上部の監視閾値（48px）を超えたらクラスをトグル
      navbar.classList.toggle("is-scrolled", !entry.isIntersecting);
    });
  }, {
    rootMargin: "-48px 0px 0px 0px",
    threshold: 0
  });

  navObserver.observe(hero);
}

