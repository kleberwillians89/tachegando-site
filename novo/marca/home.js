(function () {
  var topo = document.querySelector("header.topo"), raiz = document.documentElement;
  function rola() { topo.classList.toggle("rolou", window.scrollY > 24); }
  rola(); window.addEventListener("scroll", rola, { passive: true });

  var b = document.querySelector(".menu-btn"), n = document.getElementById("nav-principal");
  function define(abre) {
    b.setAttribute("aria-expanded", String(abre)); b.setAttribute("aria-label", abre ? "Fechar menu" : "Abrir menu");
    n.classList.toggle("aberto", abre); raiz.classList.toggle("menu-aberto", abre);
  }
  b.addEventListener("click", function () { var abre = b.getAttribute("aria-expanded") !== "true"; define(abre); if (abre) { var p = n.querySelector("a"); if (p) p.focus({ preventScroll: true }); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && b.getAttribute("aria-expanded") === "true") { define(false); b.focus(); } });
  n.addEventListener("click", function (e) { if (e.target.closest("a")) define(false); });
  matchMedia("(min-width:901px)").addEventListener("change", function (m) { if (m.matches) define(false); });

  // entrada suave de cada bloco ao aparecer na tela
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".rev").forEach(function (x) { io.observe(x); });
  } else document.querySelectorAll(".rev").forEach(function (x) { x.classList.add("on"); });

  // carrossel de vendedores: no mouse corre sozinho (CSS); no toque corre sozinho e dá pra arrastar com o dedo
  var pista = document.querySelector(".car-pista"), car = document.querySelector(".carrossel"), janela = document.querySelector(".car-janela");
  if (pista && car && janela && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    Array.prototype.slice.call(pista.children).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); Array.prototype.forEach.call(c.querySelectorAll("img"), function (i) { i.alt = ""; }); pista.appendChild(c); });
    var visivel = false;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; pista.classList.toggle("rodando", visivel); }, { threshold: 0.05 }).observe(car);
    else { visivel = true; pista.classList.add("rodando"); }
    function metade() { return pista.scrollWidth / 2; }
    if (matchMedia("(pointer:coarse)").matches) {
      janela.classList.add("toque");
      var pos = 0, ultimo = 0, quando = 0, VEL = 40;
      function inicia() { pos = metade(); janela.scrollLeft = pos; ultimo = janela.scrollLeft; }
      inicia(); window.addEventListener("load", inicia);
      function mexeu() { quando = Date.now(); }
      ["touchstart", "touchmove", "pointerdown", "wheel"].forEach(function (ev) { janela.addEventListener(ev, mexeu, { passive: true }); });
      janela.addEventListener("scroll", function () {
        var h = metade();
        if (Math.abs(janela.scrollLeft - ultimo) > 2) { mexeu(); pos = janela.scrollLeft; }
        if (janela.scrollLeft >= h * 2 - janela.clientWidth - 2) { pos = janela.scrollLeft - h; janela.scrollLeft = pos; }
        else if (janela.scrollLeft <= 1) { pos = janela.scrollLeft + h; janela.scrollLeft = pos; }
        ultimo = janela.scrollLeft;
      }, { passive: true });
      var t0 = 0;
      (function passo(t) {
        if (visivel && Date.now() - quando > 2500 && !document.hidden) {
          pos += VEL * Math.min(0.1, (t - t0) / 1000 || 0);
          if (pos >= metade() * 2 - janela.clientWidth - 2) pos -= metade();
          janela.scrollLeft = pos; ultimo = janela.scrollLeft;
        } else pos = janela.scrollLeft;
        t0 = t; requestAnimationFrame(passo);
      })(0);
    } else {
      function mede() { pista.style.setProperty("--dur", Math.max(30, Math.round(pista.scrollWidth / 2 / 45)) + "s"); }
      pista.classList.add("auto"); mede(); window.addEventListener("load", mede); window.addEventListener("resize", mede);
    }
  }
})();
