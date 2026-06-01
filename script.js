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

/* ===== 共有メディアクエリ ===== */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

/* ===== スクロール登場（reveal） ===== */
const revealEls = document.querySelectorAll("[data-reveal]");
if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.transitionDelay = (Number(el.dataset.revealDelay) || 0) + "ms";
      el.classList.add("is-revealed");
      obs.unobserve(el);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  // JS無効相当 / モーション抑制時は即表示
  revealEls.forEach((el) => el.classList.add("is-revealed"));
}

/* ===== Heroのカーソル追従グロー ===== */
const heroGlow = hero && hero.querySelector(".hero-glow");
if (heroGlow && finePointer.matches && !prefersReducedMotion.matches) {
  let gx = 0, gy = 0, ticking = false, active = false;
  // rectはスクロール/リサイズ時のみ更新し、pointermoveのホットパスから外す
  let rect = hero.getBoundingClientRect();
  const updateRect = () => { rect = hero.getBoundingClientRect(); };
  window.addEventListener("resize", updateRect, { passive: true });
  window.addEventListener("scroll", updateRect, { passive: true });

  const applyGlow = () => {
    heroGlow.style.setProperty("--mx", gx + "px");
    heroGlow.style.setProperty("--my", gy + "px");
    ticking = false;
  };
  hero.addEventListener("pointermove", (e) => {
    gx = e.clientX - rect.left;
    gy = e.clientY - rect.top;
    if (!active) { heroGlow.classList.add("is-active"); active = true; }
    if (!ticking) { ticking = true; requestAnimationFrame(applyGlow); }
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    heroGlow.classList.remove("is-active");
    active = false;
  });
}

/* ===== 背景パーティクル星座（サイト全体・Canvas） ===== */
(function constellation() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let reduce = prefersReducedMotion.matches; // ライブ切替に追従するためmutable
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let w = 0, h = 0, dpr = 1, cfg = null;
  let particles = [];
  let rafId = null, running = false, lastT = 0;
  const FRAME_MS = 1000 / 40; // 約40fpsに制限（高リフレッシュ環境でも一定）
  const pointer = { x: -9999, y: -9999, active: false };

  // 大半はオフホワイト、少量にライム/シアン（ブランド色）
  const COLORS = [
    "242, 240, 232", "242, 240, 232", "242, 240, 232", "242, 240, 232",
    "217, 255, 84", "121, 215, 255"
  ];

  function makeParticle() {
    const col = COLORS[(Math.random() * COLORS.length) | 0];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * cfg.speed * 2,
      vy: (Math.random() - 0.5) * cfg.speed * 2,
      r: Math.random() * 1.1 + 0.7,
      fill: "rgba(" + col + ", 0.55)" // ドット色は生成時に確定（毎フレーム生成しない）
    };
  }

  function config() {
    const area = w * h;
    const divisor = coarse ? 22000 : 13000; // 大きいほど点が少ない
    const cap = coarse ? 44 : 120;
    return {
      count: Math.max(12, Math.min(cap, Math.round(area / divisor))),
      link: coarse ? 112 : 142,
      speed: 0.16
    };
  }

  function seed() {
    cfg = config();
    particles = [];
    for (let i = 0; i < cfg.count; i++) particles.push(makeParticle());
  }

  // リサイズ時は作り直さず比例移動＋数の調整のみ（モバイルのURLバー伸縮で飛ばない）
  function reflow(ow, oh) {
    cfg = config();
    if (ow > 0 && oh > 0) {
      const sx = w / ow, sy = h / oh;
      for (let i = 0; i < particles.length; i++) {
        particles[i].x *= sx;
        particles[i].y *= sy;
      }
    }
    if (particles.length < cfg.count) {
      while (particles.length < cfg.count) particles.push(makeParticle());
    } else if (particles.length > cfg.count) {
      particles.length = cfg.count;
    }
  }

  function resize() {
    const ow = w, oh = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) seed();
    else reflow(ow, oh);
  }

  // dt = 60fps基準のステップ数（0なら位置を進めず静止描画）
  function draw(dt) {
    if (!cfg) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    const link2 = cfg.link * cfg.link;

    // 点
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (dt > 0) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = p.fill;
      ctx.fill();
    }

    // 点同士をつなぐ線（白・距離で減衰。色は固定し透明度のみglobalAlphaで可変）
    ctx.strokeStyle = "rgba(242, 240, 232, 1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < link2) {
          ctx.globalAlpha = (1 - d2 / link2) * 0.16;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // カーソルへの線（ライム）
    if (pointer.active) {
      const pl2 = (cfg.link * 1.6) * (cfg.link * 1.6);
      ctx.strokeStyle = "rgba(217, 255, 84, 1)";
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const dx = a.x - pointer.x, dy = a.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < pl2) {
          ctx.globalAlpha = (1 - d2 / pl2) * 0.45;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  function frame(t) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (!lastT) { lastT = t; draw(0); return; } // 初回は静止描画
    const elapsed = t - lastT;
    if (elapsed < FRAME_MS) return;              // 約40fpsに間引き
    lastT = t;
    draw(Math.min(elapsed, 50) / 16.6667);       // 経過時間で正規化＋クランプ
  }

  function start() {
    if (running || reduce) return;
    running = true;
    lastT = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    lastT = 0;
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); draw(0); }, 200);
  }, { passive: true });

  // カーソル反応（fine pointerのみ。reduceのライブ切替後も効くよう常時登録）
  if (!coarse) {
    window.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    }, { passive: true });
    window.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget) pointer.active = false;
    }, { passive: true });
  }

  // 非表示タブでは停止してバッテリーを節約
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else start();
  });

  // OSのモーション設定のライブ切替に追従（CSSの@mediaと挙動を揃える）
  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener("change", (e) => {
      reduce = e.matches;
      if (reduce) { stop(); draw(0); } else { start(); }
    });
  }

  resize();
  if (reduce) draw(0); else start(); // reduce時は静止した星座を1フレームだけ描画
})();
