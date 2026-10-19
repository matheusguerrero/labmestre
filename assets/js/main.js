/* Lab MESTRE UFU — interações do site */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Cabeçalho: muda de cor ao rolar ----------
     Nas páginas sem o topo escuro (blog), fica sempre claro. */
  var header = document.querySelector(".site-header");
  var hasHero = !!document.querySelector(".hero");
  function onScroll() {
    header.classList.toggle("is-scrolled", !hasHero || window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu móvel ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("menu");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    header.classList.toggle("menu-open", open);
    document.body.classList.toggle("no-scroll", open);
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("menu-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ---------- Link ativo no menu (só na página inicial) ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a")).filter(function (a) {
    return a.hash && a.pathname === location.pathname;
  });
  if (hasHero && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-current", a.hash === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) {
      var target = document.getElementById(a.hash.slice(1));
      if (target) sectionObserver.observe(target);
    });
  }

  /* ---------- Revelar ao rolar ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Filtros (publicações, inovação) ----------
     Cada .filters indica a lista em data-target e a mensagem de vazio em data-empty;
     os itens da lista têm data-cat. */
  document.querySelectorAll(".filters").forEach(function (group) {
    var list = document.querySelector(group.dataset.target);
    var empty = document.querySelector(group.dataset.empty);
    if (!list) return;
    var items = list.querySelectorAll("[data-cat]");
    var chips = group.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var filter = chip.dataset.filter;
        chips.forEach(function (c) {
          var active = c === chip;
          c.classList.toggle("is-active", active);
          c.setAttribute("aria-pressed", String(active));
        });
        var shown = 0;
        items.forEach(function (item) {
          var match = filter === "all" || item.dataset.cat.split(" ").indexOf(filter) !== -1;
          item.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  });

  /* ---------- Ano no rodapé ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Hero: série temporal com excessos acima do limiar u ----------
     Um AR(1) com inovações t de Student (cauda pesada). O que passa do
     limiar u é desenhado em dourado, como no símbolo do laboratório. */
  var canvas = document.querySelector(".hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var STEP = 7;          // px entre observações
  var SPEED = 0.35;      // px por quadro
  var PHI = 0.55;        // autocorrelação
  var DF = 3;            // graus de liberdade da t
  var U = 3.1;           // limiar, em unidades da série

  var w, h, dpr, series = [], last = 0, offset = 0, running = true, rafId;

  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function studentT() {
    var chi2 = 0;
    for (var i = 0; i < DF; i++) { var z = gauss(); chi2 += z * z; }
    return gauss() / Math.sqrt(chi2 / DF);
  }
  function next() {
    last = PHI * last + studentT() * 0.9;
    last = Math.max(-6, Math.min(7.5, last));
    return last;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var needed = Math.ceil(w / STEP) + 3;
    while (series.length < needed) series.push(next());
    if (series.length > needed) series = series.slice(series.length - needed);
  }

  // Faixa vertical ocupada pela série (parte inferior do hero)
  function band() {
    var mobile = w < 640;
    var bottom = h - 56;
    var height = mobile ? 110 : Math.min(h * 0.42, 340);
    return { bottom: bottom, scale: height / 10.5 };
  }
  function yOf(v, b) { return b.bottom - (v + 4) * b.scale; }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var b = band();
    var yU = yOf(U, b);
    var x0 = -offset;

    // caminho da série
    ctx.beginPath();
    for (var i = 0; i < series.length; i++) {
      var x = x0 + i * STEP, y = yOf(series[i], b);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = w < 640 ? 1.6 : 2;

    // abaixo do limiar: degradê petróleo → ciano, apagando à esquerda
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(30,95,116,0)");
    grad.addColorStop(0.25, "rgba(30,95,116,.55)");
    grad.addColorStop(1, "rgba(61,214,208,.9)");
    ctx.save();
    ctx.beginPath(); ctx.rect(0, yU, w, h); ctx.clip();
    strokeSeries(x0, b, grad);
    ctx.restore();

    // acima do limiar: dourado
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, yU); ctx.clip();
    strokeSeries(x0, b, "#D9B44A");
    ctx.restore();

    // limiar u
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, yU + 0.5); ctx.lineTo(w, yU + 0.5); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("u", w - 22, yU - 8);

    // picos acima de u
    for (var j = 1; j < series.length - 1; j++) {
      var v = series[j];
      if (v > U && v >= series[j - 1] && v >= series[j + 1]) {
        var px = x0 + j * STEP, py = yOf(v, b);
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(217,180,74,.18)"; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#D9B44A"; ctx.fill();
      }
    }
  }

  function strokeSeries(x0, b, style) {
    ctx.beginPath();
    for (var i = 0; i < series.length; i++) {
      var x = x0 + i * STEP, y = yOf(series[i], b);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = style;
    ctx.stroke();
  }

  function tick() {
    offset += SPEED;
    while (offset >= STEP) {
      offset -= STEP;
      series.shift();
      series.push(next());
    }
    draw();
    rafId = running ? requestAnimationFrame(tick) : null;
  }

  // Garante ao menos um extremo visível no quadro inicial
  function seed() {
    series = [];
    last = 0;
    resize();
    var k = Math.floor(series.length * 0.72);
    series[k - 1] = 2.2; series[k] = 5.4; series[k + 1] = 1.8;
  }

  seed();
  draw();
  window.addEventListener("resize", function () { resize(); draw(); });

  if (!reduceMotion) {
    // pausa quando o hero sai da tela ou a aba fica oculta
    var heroVisible = true;
    function update() {
      var shouldRun = heroVisible && !document.hidden;
      if (shouldRun && !running) { running = true; rafId = requestAnimationFrame(tick); }
      if (!shouldRun) { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting; update();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", update);
    rafId = requestAnimationFrame(tick);
  }
})();
