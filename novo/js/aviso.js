(function () {
  var f = document.getElementById("aviso-f"); if (!f) return;
  var msg = document.getElementById("a-msg"), btn = f.querySelector('button[type="submit"]');
  TCForm.limpaAoDigitar(f);
  function aviso(t, ok) { msg.textContent = t; msg.className = "msg" + (ok ? " ok" : ""); }
  f.addEventListener("submit", function (e) {
    e.preventDefault(); if (f.site.value) return; // campo-isca contra robôs
    TCForm.limpaTudo(f); aviso("", true);
    var nome = f.nome.value.trim(), contato = f.contato.value.trim(), ok = true;
    if (!nome) { TCForm.erro(f.nome, "Falta o seu nome."); ok = false; }
    var email = TCForm.email(contato), fone = TCForm.telefone(contato);
    if (!contato) { TCForm.erro(f.contato, "Deixe um e-mail ou WhatsApp pra gente avisar."); ok = false; }
    else if (!email && !fone) { TCForm.erro(f.contato, "Esse contato parece incompleto. Use um e-mail ou um WhatsApp com DDD, tipo (13) 99999-9999."); ok = false; }
    if (!f.ok.checked) { TCForm.erro(f.ok, "Marque a caixa pra gente poder avisar do lançamento."); ok = false; }
    if (!ok) { TCForm.foco(f); return; }
    TCForm.enviando(btn, true, "Enviando…");
    TC.registrarInteresse({ nome: nome, contato: contato, local: f.local.value.trim() }).then(function () {
      TCForm.enviando(btn, false); aviso("Anotado. Quando o Tá Chegando sair, a gente avisa.", true);
    }).catch(function () { TCForm.enviando(btn, false); aviso("Não deu pra enviar agora. Tente de novo daqui a pouco.", false); });
  });
})();
