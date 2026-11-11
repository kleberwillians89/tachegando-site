(function () {
  var f = document.getElementById("contato-f"); if (!f) return;
  var msg = document.getElementById("c-aviso"), btn = f.querySelector('button[type="submit"]');
  TCForm.limpaAoDigitar(f);
  function aviso(t, ok) { msg.textContent = t; msg.className = "msg" + (ok ? " ok" : ""); }
  f.addEventListener("submit", function (e) {
    e.preventDefault(); if (f.site.value) return;
    TCForm.limpaTudo(f); aviso("", true);
    var nome = f.nome.value.trim(), contato = f.contato.value.trim(), texto = f.msg.value.trim(), ok = true;
    if (!nome) { TCForm.erro(f.nome, "Falta o seu nome."); ok = false; }
    if (!contato) { TCForm.erro(f.contato, "Deixe um e-mail ou WhatsApp pra gente responder."); ok = false; }
    else if (!TCForm.email(contato) && !TCForm.telefone(contato)) { TCForm.erro(f.contato, "Esse contato parece incompleto. Use um e-mail ou um WhatsApp com DDD, tipo (13) 99999-9999."); ok = false; }
    if (texto.length < 5) { TCForm.erro(f.msg, "Escreva sua mensagem, mesmo que curta."); ok = false; }
    if (!f.ok.checked) { TCForm.erro(f.ok, "Marque a caixa pra gente poder responder."); ok = false; }
    if (!ok) { TCForm.foco(f); return; }
    TCForm.enviando(btn, true, "Enviando…");
    TC.registrarContato({ nome: nome, contato: contato, assunto: f.assunto.value, msg: texto }).then(function () {
      TCForm.enviando(btn, false); aviso("Recebemos sua mensagem. A resposta vai pro contato que você deixou.", true);
    }).catch(function () { TCForm.enviando(btn, false); aviso("Não deu pra enviar agora. Tente de novo daqui a pouco.", false); });
  });
})();
