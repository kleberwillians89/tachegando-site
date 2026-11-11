(function () {
  if (TC.usuarioAtual()) { location.replace("/painel"); return; }
  var q = new URLSearchParams(location.search);
  var criar = q.get("modo") === "criar";
  var f = document.getElementById("f"), msg = document.getElementById("msg"), btn = document.getElementById("enviar");
  var tEntrar = document.getElementById("t-entrar"), tCriar = document.getElementById("t-criar");
  TCForm.limpaAoDigitar(f);

  function modo(c) {
    criar = c;
    tEntrar.setAttribute("aria-selected", String(!c)); tCriar.setAttribute("aria-selected", String(c));
    document.getElementById("titulo").textContent = c ? "Criar conta" : "Entrar";
    document.getElementById("apoio").textContent = c ? "Escolha seu perfil e comece pelo cadastro." : "Acesse o seu painel.";
    document.getElementById("bloco-tipo").hidden = !c;
    document.getElementById("legal").hidden = !c;
    document.getElementById("demo-box").hidden = c;
    btn.textContent = c ? "Criar conta com e-mail" : "Entrar com e-mail";
    document.getElementById("google-tx").textContent = c ? "Criar conta com o Google" : "Entrar com o Google";
    f.senha.autocomplete = c ? "new-password" : "current-password";
    f.email.value = c ? TC.emailNovo() : TC.demo.vendedor.email; f.senha.value = "demo123"; // PROTÓTIPO: já preenchido
    TCForm.limpaTudo(f); msg.textContent = "";
  }
  tEntrar.onclick = function () { modo(false); };
  tCriar.onclick = function () { modo(true); };
  var tq = q.get("tipo"); f.querySelector('input[value="' + (tq === "apoio" || tq === "consumidor" ? tq : "vendedor") + '"]').checked = true;
  modo(criar);

  // teclado do celular aberto: mantém o campo e o botão principal à vista
  var toque = window.matchMedia("(pointer:coarse)");
  f.addEventListener("focusin", function (e) {
    if (!toque.matches || !e.target.matches("input[type=email],input[type=password]")) return;
    setTimeout(function () { e.target.scrollIntoView({ block: "center", behavior: "smooth" }); }, 320);
  });

  function vai(p) { return p.then(function () { location.href = "/painel"; }); }
  document.querySelectorAll("[data-demo]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = TC.demo[b.dataset.demo]; TCForm.enviando(b, true, "Entrando…");
      vai(TC.entrar(d.email, d.senha)).catch(function () { TCForm.enviando(b, false); msg.textContent = "Não deu certo agora. Tente de novo daqui a pouco."; });
    });
  });

  // Google: no protótipo só simula. Para valer, ligar ao login do Google no Supabase do app.
  var g = document.getElementById("google");
  g.addEventListener("click", function () {
    msg.textContent = ""; TCForm.enviando(g, true, criar ? "Criando conta…" : "Entrando…");
    var p = criar ? TC.criarConta(TC.emailNovo(), "google-" + Date.now(), f.tipo.value) : TC.entrar(TC.demo.vendedor.email, TC.demo.vendedor.senha);
    vai(p).catch(function () { TCForm.enviando(g, false); msg.textContent = "Não deu certo agora. Tente de novo daqui a pouco."; });
  });

  f.addEventListener("submit", function (e) {
    e.preventDefault(); TCForm.limpaTudo(f); msg.textContent = "";
    var email = f.email.value, senha = f.senha.value, ok = true;
    if (!email.trim()) { TCForm.erro(f.email, "Falta o e-mail."); ok = false; }
    else if (!TCForm.email(email)) { TCForm.erro(f.email, "Esse e-mail parece errado. Tente algo como nome@exemplo.com."); ok = false; }
    if (!senha) { TCForm.erro(f.senha, "Falta a senha."); ok = false; }
    else if (senha.length < 6) { TCForm.erro(f.senha, "A senha precisa de 6 caracteres ou mais."); ok = false; }
    if (!ok) { TCForm.foco(f); return; }
    TCForm.enviando(btn, true, criar ? "Criando conta…" : "Entrando…");
    vai(criar ? TC.criarConta(email, senha, f.tipo.value) : TC.entrar(email, senha)).catch(function (err) {
      TCForm.enviando(btn, false);
      msg.textContent = err.message === "E-mail ou senha incorretos." ? "E-mail ou senha não conferem. Dá uma olhada e tenta de novo."
        : err.message === "Já existe uma conta com esse e-mail." ? "Esse e-mail já tem conta. Experimente entrar com ele." : "Não deu certo agora. Tente de novo daqui a pouco.";
    });
  });
})();
