(function () {
  // barra fixa: reserva o espaço dela e compacta ao rolar
  var topo = document.querySelector("header.top");
  if (topo) {
    var dentroHero = !!topo.closest(".hero");
    if (!dentroHero) topo.classList.add("solido");
    var reserva = function () {
      var rolou = topo.classList.contains("rolou"); topo.classList.remove("rolou");
      var h = topo.offsetHeight; if (rolou) topo.classList.add("rolou");
      document.documentElement.style.setProperty("--hdr", h + "px");
      if (!dentroHero && !document.body.classList.contains("legal")) document.body.style.paddingTop = (h + 24) + "px";
    };
    var rola = function () { topo.classList.toggle("rolou", window.scrollY > 24); };
    reserva(); rola();
    window.addEventListener("scroll", rola, { passive: true });
    window.addEventListener("resize", reserva);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserva);
  }
  // menu do celular (tela cheia com vidro)
  var b = document.querySelector(".menu-btn"), n = document.getElementById("nav-principal");
  if (b && n) {
    var raiz = document.documentElement;
    function define(abre) {
      b.setAttribute("aria-expanded", String(abre)); b.setAttribute("aria-label", abre ? "Fechar menu" : "Abrir menu");
      n.classList.toggle("aberto", abre); raiz.classList.toggle("menu-aberto", abre);
    }
    b.addEventListener("click", function () {
      var abre = b.getAttribute("aria-expanded") !== "true"; define(abre);
      if (abre) { var p = n.querySelector("a"); if (p) p.focus({ preventScroll: true }); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && b.getAttribute("aria-expanded") === "true") { define(false); b.focus(); } });
    n.addEventListener("click", function (e) { if (e.target.closest("a")) define(false); });
    matchMedia("(min-width:1001px)").addEventListener("change", function (m) { if (m.matches) define(false); });
  }
  // decoração leve das seções (pins e rota), só anima quando aparece na tela
  var PIN = '<svg viewBox="-22 -24 44 56" aria-hidden="true" focusable="false"><path d="M0 -22C-13 -22 -22 -13 -22 -2C-22 12 0 30 0 30C0 30 22 12 22 -2C22 -13 13 -22 0 -22ZM0 -9a7 7 0 110 14 7 7 0 010-14Z" fill="currentColor" fill-rule="evenodd"/></svg>';
  var POS = [["5%", "16%", "42px", ".55", "10s", "0s"], ["88%", "10%", "28px", ".4", "8s", "-3s"], ["92%", "68%", "46px", ".5", "11s", "-5s"], ["9%", "70%", "26px", ".4", "9s", "-2s"]];
  var decos = [];
  document.querySelectorAll(".manifesto,.rede,.final,.transp2").forEach(function (s) {
    s.classList.add("tem-deco");
    var d = document.createElement("div"); d.className = "deco"; d.setAttribute("aria-hidden", "true");
    d.innerHTML = '<svg class="rota" viewBox="0 0 1200 400" preserveAspectRatio="none" focusable="false"><path vector-effect="non-scaling-stroke" d="M-20 330 C220 330 260 150 520 190 S900 330 1220 90"/></svg>' +
      POS.map(function (p) { return '<span class="pin" style="--x:' + p[0] + ';--y:' + p[1] + ';--t:' + p[2] + ';--o:' + p[3] + ';--d:' + p[4] + ';--a:' + p[5] + '">' + PIN + '</span>'; }).join("");
    s.insertBefore(d, s.firstChild); decos.push(d);
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("vivo", e.isIntersecting); }); });
    decos.forEach(function (d) { io.observe(d); });
  } else decos.forEach(function (d) { d.classList.add("vivo"); });
  // mostrar/ocultar senha
  var v = document.querySelector(".ver-senha");
  if (v) v.addEventListener("click", function () {
    var i = document.getElementById("senha"), mostra = i.type === "password";
    i.type = mostra ? "text" : "password"; v.setAttribute("aria-pressed", String(mostra)); v.textContent = mostra ? "Ocultar" : "Mostrar";
  });
})();
