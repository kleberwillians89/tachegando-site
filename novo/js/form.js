/* Utilitários de formulário: erro por campo, máscara de telefone, estado de envio. */
window.TCForm = (function () {
  function erroEl(input) {
    var id = input.id + "-erro", e = document.getElementById(id);
    if (!e) {
      e = document.createElement("p"); e.id = id; e.className = "erro-campo"; e.setAttribute("role", "alert");
      var alvo = input.closest(".senha-w") || (input.type === "checkbox" ? input.closest("label") : null) || input; alvo.insertAdjacentElement("afterend", e);
    }
    return e;
  }
  function erro(input, msg) {
    var e = erroEl(input); e.textContent = msg; input.setAttribute("aria-invalid", "true");
    var d = (input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    if (d.indexOf(e.id) < 0) d.push(e.id); input.setAttribute("aria-describedby", d.join(" "));
  }
  function limpa(input) {
    var e = document.getElementById(input.id + "-erro"); if (e) e.textContent = "";
    input.removeAttribute("aria-invalid");
  }
  function limpaTudo(form) { form.querySelectorAll("[aria-invalid]").forEach(limpa); }
  function foco(form) { var i = form.querySelector('[aria-invalid="true"]'); if (i) { i.focus(); i.scrollIntoView({ block: "center", behavior: "smooth" }); } }
  function mascaraTel(v) {
    var d = String(v).replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  function ativaMascara(raiz) {
    (raiz || document).querySelectorAll('input[type="tel"]').forEach(function (i) {
      if (i.dataset.mask) return; i.dataset.mask = "1";
      i.addEventListener("input", function () { i.value = mascaraTel(i.value); });
      if (i.value) i.value = mascaraTel(i.value);
    });
  }
  function limpaAoDigitar(form) {
    form.addEventListener("input", function (e) { if (e.target.matches("[aria-invalid]")) limpa(e.target); });
  }
  function enviando(btn, on, txt) {
    if (on) { btn.dataset.rot = btn.textContent; btn.textContent = txt || "Enviando…"; btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
    else { btn.textContent = btn.dataset.rot || btn.textContent; btn.disabled = false; btn.removeAttribute("aria-busy"); }
  }
  var email = function (v) { return /^\S+@\S+\.\S+$/.test(v.trim()); };
  var telefone = function (v) { var n = v.replace(/\D/g, "").length; return n === 10 || n === 11; };
  return { erro: erro, limpa: limpa, limpaTudo: limpaTudo, foco: foco, ativaMascara: ativaMascara, limpaAoDigitar: limpaAoDigitar, enviando: enviando, email: email, telefone: telefone, mascaraTel: mascaraTel };
})();
