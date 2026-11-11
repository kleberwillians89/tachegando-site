(function () {
  var user = TC.usuarioAtual();
  if (!user) { location.replace("/entrar"); return; }
  var el = document.getElementById("tela"), foco = document.getElementById("conteudo");
  var ehVend = user.tipo === "vendedor";
  var CH_RASC = "tc_rascunho_" + user.email;
  function cartaoUsuario() {
    var temNome = !!(user.perfil && user.perfil.nome), n = temNome ? user.perfil.nome : "Sua conta";
    var ini = temNome ? n.split(" ").filter(Boolean).slice(0, 2).map(function (x) { return x.charAt(0); }).join("").toUpperCase() : (user.email || "?").charAt(0).toUpperCase();
    document.getElementById("quem").innerHTML = '<span class="av" aria-hidden="true">' + esc(ini) + '</span><span class="tx"><b>' + esc(n) + '</b><span class="fn">' + (ehVend ? "Vendedor" : "Rede de Apoio") + '</span><span class="em">' + esc(user.email) + '</span></span>';
    document.getElementById("top-u").innerHTML = '<span class="av" aria-hidden="true">' + esc(ini) + '</span><span class="nm">' + esc(n) + '</span>';
  }
  function sair() { TC.sair(); location.href = "/"; }
  document.getElementById("sair").onclick = sair; document.getElementById("sair-m").onclick = sair;
  if (user.tipo === "consumidor") { consumidorPainel(); return; }

  // Consumidor: um passo de cadastro e uma tela de início, sem menu (PROTÓTIPO, sem dados reais)
  function consumidorPainel() {
    var BUSCA = ["Frutas e verduras", "Ovos", "Pão", "Doces", "Queijo", "Artesanato", "Flores", "Picolé", "Outro"];
    var ok = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
    document.body.classList.add("sem-menu");
    function completoC() { var q = user.perfil; return !!(q && q.nome && q.cidade); }
    function tags(arr) { return '<span class="pn-tags">' + arr.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</span>"; }
    function cadastroC(editando) {
      var rasc = null, CH = "tc_rascunho_" + user.email;
      try { rasc = JSON.parse(localStorage.getItem(CH)); } catch (e) {}
      var p = JSON.parse(JSON.stringify(user.perfil || rasc || TC.perfilExemplo("consumidor")));
      document.getElementById("top-t").textContent = "Meu cadastro";
      el.innerHTML = '<div class="pn-cadw"><div class="pn-ph curto"><div class="tx"><span class="eyebrow">' + (editando ? "Meu cadastro" : "Vamos começar") + '</span><h1>Seus dados</h1><p>Só o básico, pra gente saber onde você está e o que você procura.</p></div></div>' +
        '<form id="pf" novalidate>' + campo("nome", "Seu nome", p.nome, 'autocomplete=name placeholder="Ex.: Ana Souza"') + campo("cidade", "Cidade", p.cidade, 'autocomplete=address-level2 placeholder="Ex.: São Paulo"') +
        campo("bairro", "Bairro", p.bairro, 'placeholder="Ex.: Mooca"', "text", true) + '<p class="nota-m largo">O bairro ajuda a mostrar vendedores que passam perto de você.</p>' +
        grupo("O que você costuma procurar? Pode marcar mais de um.", opc("busca", BUSCA, p.busca)) +
        '<div class="nav-b"><span></span><button class="btn or" type="submit" id="prox">' + (editando ? "Salvar" : "Criar meu cadastro") + '</button></div></form></div>';
      window.scrollTo(0, 0); foco.focus({ preventScroll: true });
      var f = document.getElementById("pf"); TCForm.limpaAoDigitar(f);
      function le() { p.nome = f.nome.value.trim(); p.cidade = f.cidade.value.trim(); p.bairro = f.bairro.value.trim(); p.busca = marcados(f, "busca"); }
      f.addEventListener("change", function () { le(); try { localStorage.setItem(CH, JSON.stringify(p)); } catch (e) {} });
      f.onsubmit = function (e) {
        e.preventDefault(); le(); var erros = [];
        if (!p.nome) erros.push(["nome", "Falta o seu nome."]);
        if (!p.cidade) erros.push(["cidade", "Falta a cidade."]);
        if (erros.length) { mostraErros(f, erros); return; }
        var b = document.getElementById("prox"); TCForm.enviando(b, true, "Salvando…");
        TC.salvarPerfil(p).then(function (u) { try { localStorage.removeItem(CH); } catch (e) {} user = u; inicioC(); })
          .catch(function () { TCForm.enviando(b, false); });
      };
    }
    function inicioC() {
      cartaoUsuario();
      var p = user.perfil || {}, nome = esc((p.nome || "").split(" ")[0] || "por aqui");
      var temp = '<div class="pn-temp" role="note"><b>Este painel é temporário.</b><span>O app Tá Chegando ainda não saiu. Seu cadastro já fica pronto: quando o app for lançado, é só entrar com a mesma conta que você usou aqui. A gente te avisa.</span></div>';
      var ph = '<div class="pn-ph"><div class="tx"><span class="eyebrow">Painel de quem procura</span><h1>Oi, ' + nome + '</h1><p>Cadastro pronto. Quando o app sair, é nele que você encontra quem vende por perto.</p><div class="pn-chips"><span class="pn-chip"><span class="ok">' + ok + '</span>Cadastro completo</span><span class="pn-chip">' + esc(p.cidade) + '</span>' + (p.bairro ? '<span class="pn-chip">' + esc(p.bairro) + '</span>' : "") + '</div></div><div class="ac"><button class="btn ln-d" id="edit-top" type="button">Editar cadastro</button></div></div>';
      var busca = '<article class="pn-cd rota"><h2>O que você procura</h2><p class="sub">Isso ajuda a mostrar quem vende o que você quer.</p>' + ((p.busca || []).length ? tags(p.busca) : '<p class="sub">Você ainda não marcou nada.</p>') + '</article>';
      var stat = '<article class="pn-cd stat"><span class="soon">Em breve</span><h2 class="big">O app sai no lançamento oficial.</h2><p class="txt">Quando chegar a hora, a gente avisa você.</p><h3>O que falta</h3><ul class="pn-tl"><li class="ok"><span class="p">' + ok.replace('width="12" height="12"', 'width="14" height="14"') + '</span><div>Conta criada</div></li><li class="ok"><span class="p">' + ok.replace('width="12" height="12"', 'width="14" height="14"') + '</span><div>Cadastro completo</div></li><li class="prox"><span class="p"></span><div>Encontrar vendedores no app<small>No lançamento</small></div></li></ul></article>';
      var info = '<div><dt>Nome</dt><dd>' + esc(p.nome) + '</dd></div><div><dt>Cidade</dt><dd>' + esc(p.cidade) + '</dd></div><div><dt>Bairro</dt><dd>' + esc(p.bairro || "-") + '</dd></div><div><dt>Procura</dt><dd>' + esc((p.busca || []).join(", ") || "-") + '</dd></div>';
      var cad = '<article class="pn-cd cad"><h2>Seu cadastro</h2><dl class="pn-info">' + info + '</dl><button class="btn az" id="edit" type="button">Editar cadastro</button></article>';
      document.getElementById("top-t").textContent = "Início";
      el.innerHTML = temp + ph + '<div class="pn-grid vend">' + busca + stat + cad + '</div>';
      document.getElementById("edit").onclick = function () { cadastroC(true); };
      document.getElementById("edit-top").onclick = function () { cadastroC(true); };
      window.scrollTo(0, 0); foco.focus({ preventScroll: true });
    }
    cartaoUsuario();
    if (completoC()) inicioC(); else cadastroC(false);
  }

  var VENDE = ["Frutas e verduras", "Ovos", "Pão", "Doces", "Queijo", "Artesanato", "Flores", "Roupas", "Picolé", "Serviços", "Outro"];
  var MEIO = ["A pé", "Bicicleta", "Moto", "Carro ou caminhonete", "Carrinho", "Outro"];
  var DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  var AREAS = ["Jurídico", "Contabilidade", "Marketing", "Gestão e RH", "Oficina mecânica", "Seguros", "Outra"];
  var DIST = ["Perto", "Normal", "Mais longe"];
  var DISTDICA = { "Perto": "Só recebe pedidos de quem está bem perto da rota.", "Normal": "Serve pra maioria das rotas.", "Mais longe": "Recebe também pedidos de quem está um pouco mais longe." };
  function cnpjOk(v) {
    var d = String(v).replace(/\D/g, ""); if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    function dv(n) { var s = 0, pos = n - 7; for (var i = n; i >= 1; i--) { s += d[n - i] * pos--; if (pos < 2) pos = 9; } var r = s % 11; return r < 2 ? 0 : 11 - r; }
    return dv(12) == d[12] && dv(13) == d[13];
  }
  function mascaraCnpj(v) { var d = String(v).replace(/\D/g, "").slice(0, 14); return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2"); }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function opc(nome, lista, sel, tipo) {
    return '<div class="opcoes" data-g="' + nome + '">' + lista.map(function (o) {
      return '<label><input type="' + (tipo || "checkbox") + '" name="' + nome + '" value="' + esc(o) + '"' + ((sel || []).indexOf(o) > -1 ? " checked" : "") + '><span>' + esc(o) + '</span></label>';
    }).join("") + '</div>';
  }
  function marcados(f, n) { return Array.from(f.querySelectorAll('input[name="' + n + '"]:checked')).map(function (i) { return i.value; }); }
  function campo(id, rot, val, extra, tipo, largo) { return '<div class="cp' + (largo ? " largo" : "") + '"><label class="l" for="' + id + '">' + rot + '</label><input type="' + (tipo || "text") + '" id="' + id + '" name="' + id + '" value="' + esc(val) + '" ' + (extra || "") + '></div>'; }
  function grupo(rot, corpo, cls) { return '<div class="gp' + (cls ? " " + cls : "") + '"><span class="rot l">' + rot + '</span>' + corpo + '</div>'; }

  // cada validação devolve uma lista de [campo, mensagem]
  var PASSOS = ehVend ? [
    { t: "Seus dados", d: "Quem é você e como a gente chama o seu negócio.",
      h: function (p) { return campo("nome", "Seu nome", p.nome, "autocomplete=name placeholder=\"Ex.: João Silva\"") + campo("negocio", "Nome do seu negócio", p.negocio, "placeholder=\"Ex.: Frutas do João\" autocomplete=off") + campo("telefone", "Telefone com DDD", p.telefone, "autocomplete=tel inputmode=tel placeholder=\"(11) 99999-9999\"", "tel") + '<p class="nota-m largo">Seu nome e o do negócio aparecem no seu perfil. O telefone, só usamos pra falar do seu cadastro.</p>'; },
      l: function (f, p) { var e = []; p.nome = f.nome.value.trim(); p.negocio = f.negocio.value.trim(); p.telefone = f.telefone.value.trim();
        if (!p.nome) e.push(["nome", "Falta o seu nome."]);
        if (!p.negocio) e.push(["negocio", "Qual o nome do seu negócio?"]);
        if (!p.telefone) e.push(["telefone", "Falta o telefone, com DDD."]); else if (!TCForm.telefone(p.telefone)) e.push(["telefone", "Esse telefone tá faltando número. Use o DDD e o número, tipo (11) 99999-9999."]);
        return e; } },
    { t: "O que você vende", d: "Isso ajuda quem procura a achar você.",
      h: function (p) { return grupo("O que você vende? Pode marcar mais de um.", opc("vende", VENDE, p.vende)) +
          '<div id="outro-w" class="gp"' + ((p.vende || []).indexOf("Outro") > -1 ? "" : " hidden") + '>' + campo("vendeOutro", "O que mais você vende?", p.vendeOutro, "", "text", true) + '</div>' +
          grupo("Como você sai pra vender?", opc("meio", MEIO, p.meio ? [p.meio] : [], "radio")) + '<p class="nota-m largo">Isso aparece no seu perfil, pra quem procura saber o que você vende.</p>'; },
      l: function (f, p) { var e = []; p.vende = marcados(f, "vende"); p.meio = marcados(f, "meio")[0] || ""; p.vendeOutro = f.vendeOutro ? f.vendeOutro.value.trim() : "";
        if (!p.vende.length) e.push(["vende", "Marque o que você vende, nem que seja uma coisa só."]);
        if (p.vende.indexOf("Outro") > -1 && !p.vendeOutro) e.push(["vendeOutro", "Escreva o que mais você vende."]);
        if (!p.meio) e.push(["meio", "Marque como você sai pra vender."]);
        return e; } },
    { t: "Sua rota", d: "Por onde você passa, em que dias e quem a gente avisa.",
      h: function (p) { return campo("rota", "Como você chama essa rota?", p.rota, "placeholder=\"Ex.: Centro de manhã\"") + campo("cidade", "Cidade", p.cidade, "autocomplete=address-level2 placeholder=\"Ex.: São Paulo\"") + campo("bairros", "Bairros onde você costuma passar", p.bairros, 'placeholder="Ex.: Mooca, Tatuapé, Belém"', "text", true) +
          grupo("Em que dias você sai?", opc("dias", DIAS, p.dias), "dias") +
          grupo("Até que distância da rota você aceita pedidos de parada?", opc("distancia", DIST, p.distancia ? [p.distancia] : ["Normal"], "radio") + '<p class="nota-m dica" id="dist-dica" aria-live="polite">' + (DISTDICA[p.distancia || "Normal"]) + '</p>', "dist") + '<p class="nota-m largo">Quem está por perto vê quando e por onde você costuma passar. Você muda isso quando quiser.</p>'; },
      l: function (f, p) { var e = []; p.rota = f.rota.value.trim(); p.cidade = f.cidade.value.trim(); p.bairros = f.bairros.value.trim(); p.dias = marcados(f, "dias"); p.distancia = marcados(f, "distancia")[0] || "Normal";
        if (!p.rota) e.push(["rota", "Dê um nome pra rota. Pode ser o do bairro."]);
        if (!p.cidade) e.push(["cidade", "Falta a cidade."]);
        if (!p.dias.length) e.push(["dias", "Marque os dias em que você sai."]);
        return e; } }
  ] : [
    { t: "Sua empresa", d: "O básico pra equipe conferir quem é a empresa.",
      h: function (p) { return campo("nome", "Nome da empresa", p.nome, "autocomplete=organization placeholder=\"Ex.: Silva Contabilidade\"") + campo("cnpj", "CNPJ", p.cnpj, "inputmode=numeric autocomplete=off placeholder=\"00.000.000/0000-00\"") + campo("site", "Site ou rede social da empresa", p.site, "placeholder=\"Ex.: www.suaempresa.com.br\"", "text", true) + '<p class="nota-m largo">Com esses dados, a equipe confere se a empresa existe e está funcionando.</p>'; },
      l: function (f, p) { var e = []; p.nome = f.nome.value.trim(); p.cnpj = f.cnpj.value.trim(); p.site = f.site.value.trim();
        if (!p.nome) e.push(["nome", "Falta o nome da empresa."]);
        if (!p.cnpj) e.push(["cnpj", "Falta o CNPJ."]); else if (!cnpjOk(p.cnpj)) e.push(["cnpj", "Esse CNPJ não bateu. Confira os 14 números."]);
        if (!p.site) e.push(["site", "Coloque o site ou a rede social da empresa. A equipe usa pra conferir."]);
        return e; } },
    { t: "Contato da empresa", d: "Com quem a equipe pode falar.", h: function (p) { return campo("responsavel", "Nome do responsável", p.responsavel, "autocomplete=name placeholder=\"Ex.: Ana Lima\"") + campo("telefone", "Telefone com DDD", p.telefone, "autocomplete=tel inputmode=tel placeholder=\"(11) 99999-9999\"", "tel") + campo("cidade", "Cidade da empresa", p.cidade, "autocomplete=address-level2 placeholder=\"Ex.: São Paulo\"") + '<p class="nota-m largo">A equipe usa esse contato só pra falar sobre a candidatura.</p>'; },
      l: function (f, p) { var e = []; p.responsavel = f.responsavel.value.trim(); p.telefone = f.telefone.value.trim(); p.cidade = f.cidade.value.trim();
        if (!p.responsavel) e.push(["responsavel", "Falta o nome do responsável."]);
        if (!p.telefone) e.push(["telefone", "Falta o telefone, com DDD."]); else if (!TCForm.telefone(p.telefone)) e.push(["telefone", "Esse telefone tá faltando número. Use o DDD e o número, tipo (11) 99999-9999."]);
        if (!p.cidade) e.push(["cidade", "Falta a cidade da empresa."]);
        return e; } },
    { t: "Como a empresa apoia", d: "Em que a empresa pode ajudar quem vende na rua.", h: function (p) { return grupo("Em que áreas a empresa atua? Pode marcar mais de uma.", opc("areas", AREAS, p.areas)) + '<div class="cp largo"><label class="l" for="apoio">Em poucas palavras, como a empresa pode ajudar vendedores? <span class="opc">(opcional)</span></label><textarea id="apoio" name="apoio" rows="4" placeholder="Ex.: Podemos ajudar a organizar as contas do mês.">' + esc(p.apoio) + '</textarea></div>'; },
      l: function (f, p) { p.areas = marcados(f, "areas"); p.apoio = f.apoio.value.trim(); return p.areas.length ? [] : [["areas", "Marque ao menos uma área."]]; } }
  ];

  function completo() { var p = user.perfil; return !!p && (ehVend ? p.vende && p.vende.length && p.cidade && p.negocio : p.areas && p.areas.length && p.telefone && p.cnpj); }
  function rascunho() { try { return JSON.parse(localStorage.getItem(CH_RASC)); } catch (e) { return null; } }
  function guarda(p, i) { try { localStorage.setItem(CH_RASC, JSON.stringify(Object.assign({}, p, { _i: i }))); } catch (e) {} }
  function limpaRascunho() { try { localStorage.removeItem(CH_RASC); } catch (e) {} }

  function mostraErros(form, erros) {
    TCForm.limpaTudo(form); form.querySelectorAll(".erro-grupo").forEach(function (g) { g.remove(); });
    var primeiro = null;
    erros.forEach(function (x) {
      var campoEl = form.elements[x[0]];
      if (campoEl && campoEl.tagName === "INPUT" || campoEl && campoEl.tagName === "TEXTAREA") { TCForm.erro(campoEl, x[1]); primeiro = primeiro || campoEl; }
      else { var g = form.querySelector('.opcoes[data-g="' + x[0] + '"]'); if (g) { var p = document.createElement("p"); p.className = "erro-campo erro-grupo"; p.setAttribute("role", "alert"); p.textContent = x[1]; g.insertAdjacentElement("afterend", p); primeiro = primeiro || g.querySelector("input"); } }
    });
    if (primeiro) { primeiro.focus(); primeiro.scrollIntoView({ block: "center", behavior: "smooth" }); }
  }

  function cadastro(editando) {
    var rasc = rascunho();
    var p = JSON.parse(JSON.stringify(user.perfil || rasc || TC.perfilExemplo(user.tipo))), i = (!user.perfil && rasc && rasc._i) || 0; delete p._i;
    function pinta() {
      var ultimo = i === PASSOS.length - 1;
      var pins = PASSOS.map(function (x, k) { return '<li class="' + (k < i ? "on" : k === i ? "at" : "") + '"' + (k === i ? ' aria-current="step"' : "") + '><i>' + (k < i ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>' : (k + 1)) + '</i><span>' + x.t + '</span></li>'; }).join("");
      el.innerHTML = '<div class="pn-cadw"><div class="pn-ph curto"><div class="tx"><span class="eyebrow">' + (editando ? "Meu cadastro" : "Vamos começar") + '</span><h1>' + PASSOS[i].t + '</h1><p>' + PASSOS[i].d + '</p></div></div>' +
        '<p class="pn-etapa">Passo ' + (i + 1) + ' de ' + PASSOS.length + '<span> · ' + PASSOS[i].t + '</span></p><ol class="pn-passos" aria-label="Passos do cadastro">' + pins + '</ol>' +
        '<form id="pf" novalidate>' + PASSOS[i].h(p) +
        '<div class="nav-b">' + (i > 0 ? '<button type="button" class="btn ln-d" id="volta">Voltar</button>' : '<span></span>') +
        '<button class="btn or" type="submit" id="prox">' + (ultimo ? "Salvar cadastro" : "Continuar") + '</button></div></form></div>';
      foco.focus({ preventScroll: true }); window.scrollTo(0, 0);
      var f = document.getElementById("pf");
      TCForm.ativaMascara(f); TCForm.limpaAoDigitar(f);
      var cj = f.querySelector("#cnpj"); if (cj) cj.classList.add("cnpj");
      cj = f.querySelector("#cnpj"); if (cj) { cj.value = mascaraCnpj(cj.value); cj.addEventListener("input", function () { cj.value = mascaraCnpj(cj.value); }); }
      var dd = document.getElementById("dist-dica");
      if (dd) f.addEventListener("change", function (e) { if (e.target.name === "distancia") dd.textContent = DISTDICA[e.target.value]; });
      var ow = document.getElementById("outro-w");
      if (ow) f.addEventListener("change", function (e) { if (e.target.name === "vende") ow.hidden = !f.querySelector('input[name="vende"][value="Outro"]').checked; });
      f.addEventListener("change", function () { PASSOS[i].l(f, p); guarda(p, i); });
      var v = document.getElementById("volta");
      if (v) v.onclick = function () { PASSOS[i].l(f, p); guarda(p, i - 1); i--; pinta(); };
      f.onsubmit = function (e) {
        e.preventDefault();
        var erros = PASSOS[i].l(f, p);
        if (erros.length) { mostraErros(f, erros); return; }
        if (!ultimo) { guarda(p, i + 1); i++; pinta(); return; }
        var b = document.getElementById("prox"); TCForm.enviando(b, true, "Salvando…");
        if (!ehVend && !p.status) p.status = "em_verificacao";
        TC.salvarPerfil(p).then(function (u) { limpaRascunho(); user = u; if (editando) ir("inicio"); else pronto(); })
          .catch(function () {
            TCForm.enviando(b, false);
            var ef = f.querySelector(".erro-form"); if (!ef) { ef = document.createElement("p"); ef.className = "erro-campo erro-form"; ef.setAttribute("role", "alert"); f.querySelector(".nav-b").insertAdjacentElement("beforebegin", ef); }
            ef.textContent = "Não deu pra salvar agora. Tente de novo daqui a pouco.";
          });
      };
    }
    pinta();
  }
  function pronto() {
    cartaoUsuario();
    var p = user.perfil || {};
    var linhas = ehVend
      ? [["Negócio", p.negocio], ["Vende", (p.vende || []).join(", ")], ["Rota", [p.rota, p.cidade].filter(Boolean).join(" · ")], ["Dias", (p.dias || []).join(", ")]]
      : [["Empresa", p.nome], ["Áreas", (p.areas || []).join(", ")], ["Cidade", p.cidade], ["Situação", "Em verificação"]];
    el.innerHTML = '<div class="pn-cadw"><div class="pn-pronto"><span class="ok" aria-hidden="true">' + CHECK.replace('width="14" height="14"', 'width="28" height="28"') + '</span>' +
      '<h1>Pronto, seu cadastro está feito.</h1><p>' + (ehVend ? "Quando o app for lançado, é só entrar com a mesma conta que você usou aqui. A gente te avisa." : "Agora a nossa equipe confere a empresa. Depois a gente entra em contato.") + '</p>' +
      '<dl class="pn-info">' + linhas.map(function (l) { return '<div><dt>' + l[0] + '</dt><dd>' + esc(l[1] || "-") + '</dd></div>'; }).join("") + '</dl>' +
      '<button class="btn or" type="button" id="ir-painel">Ir para o painel</button></div></div>';
    document.getElementById("top-t").textContent = "Cadastro concluído";
    window.scrollTo(0, 0);
    var b = document.getElementById("ir-painel"); b.onclick = function () { ir("inicio"); window.scrollTo(0, 0); };
    foco.focus({ preventScroll: true });
  }

  var CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
  var SPARK = '<svg width="86" height="34" viewBox="0 0 86 34" aria-hidden="true"><path d="M2 28 C20 28 22 8 40 12 S66 30 84 6" fill="none" stroke="#BB4938" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7"/></svg>';
  function lista(t) { return String(t || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }
  function pontosDaRota() {
    var p = user.perfil || {};
    var l = ehVend ? lista(p.bairros) : (p.areas || []);
    if (!l.length) l = ehVend ? [p.cidade || "Sua cidade"] : [p.cidade || "Sua cidade"];
    return l.slice(0, 5);
  }
  // pins em HTML sobre a linha pontilhada: rótulos legíveis em qualquer largura
  var TRACO = "M30 140 C120 140 130 50 230 60 S340 150 410 110 S520 40 570 60";
  function colocaPins() {
    var box = document.getElementById("rmap"); if (!box) return;
    var path = box.querySelector("path"), pts = pontosDaRota(), len = path.getTotalLength();
    pts.forEach(function (nome, k) {
      var t = pts.length === 1 ? 0.5 : 0.08 + 0.84 * k / (pts.length - 1), pt = path.getPointAtLength(len * t);
      var x = pt.x / 6, y = pt.y / 1.9, pos = pts.length > 1 && k === 0 ? "ini" : pts.length > 1 && k === pts.length - 1 ? "fim" : "";
      var d = document.createElement("span"); d.className = "pin " + (k % 2 ? "baixo" : "cima") + (pos ? " " + pos : "");
      d.style.left = x.toFixed(2) + "%"; d.style.top = y.toFixed(2) + "%";
      d.innerHTML = '<i></i><b title="' + esc(nome) + '">' + esc(nome) + '</b>';
      box.appendChild(d);
    });
    arruma(box);
  }
  // escolhe, ponto a ponto, o lado do rótulo (em cima ou embaixo) que não bate em nada
  function arruma(box) {
    var pins = Array.prototype.slice.call(box.querySelectorAll(".pin")), feitos = [];
    function bate(a, c) { return a.left < c.right + 4 && c.left < a.right + 4 && a.top < c.bottom + 2 && c.top < a.bottom + 2; }
    var dots = pins.map(function (p) { return p.querySelector("i").getBoundingClientRect(); });
    pins.forEach(function (p, k) {
      var b = p.querySelector("b"), ordem = k % 2 ? ["baixo", "cima"] : ["cima", "baixo"], ok = false;
      [0, 1, 2].forEach(function (nv) {
        if (ok) return;
        p.classList.toggle("mini", nv === 1); p.classList.toggle("micro", nv === 2);
        ordem.forEach(function (lado) {
          if (ok) return;
          p.classList.remove("cima", "baixo"); p.classList.add(lado);
          var r = b.getBoundingClientRect();
          if (!feitos.some(function (x) { return bate(r, x); }) && !dots.some(function (x, j) { return j !== k && bate(r, x); })) ok = true;
        });
      });
      feitos.push(b.getBoundingClientRect());
    });
  }
  function inicio() {
    var p = user.perfil || {};
    var nome = esc(((ehVend ? p.nome : p.responsavel) || "").split(" ")[0] || "por aqui");
    var vende = (p.vende || []).map(function (x) { return x === "Outro" && p.vendeOutro ? "Outro: " + p.vendeOutro : x; });
    var tags = function (arr) { return '<span class="pn-tags">' + arr.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</span>"; };
    var chips = '<span class="pn-chip"><span class="ok">' + CHECK.replace('width="14" height="14"', 'width="12" height="12"') + '</span>Cadastro completo</span><span class="pn-chip">' + esc(p.cidade) + '</span>' + (ehVend ? '<span class="pn-chip">' + esc(p.meio) + '</span>' : '<span class="pn-chip">Em verificação</span>');
    var dias = ehVend ? '<div class="pn-dias" aria-label="Dias em que você sai">' + DIAS.map(function (d) { return '<span class="' + ((p.dias || []).indexOf(d) > -1 ? "" : "off") + '">' + d + "</span>"; }).join("") + "</div>" : "";
    var ph = '<div class="pn-ph"><div class="tx"><span class="eyebrow">' + (ehVend ? "Painel do vendedor" : "Candidatura da Rede de Apoio") + '</span><h1>Oi, ' + nome + '</h1><p>' + (ehVend ? "Cadastro pronto. Quando o app sair, é nele que você grava a sua rota." : "Recebemos a candidatura da sua empresa. Agora a equipe confere os dados.") + '</p><div class="pn-chips">' + chips + '</div></div><div class="ac"><button class="btn ln-d" id="edit-top" type="button">Editar cadastro</button></div></div>';
    var kpis = "";
    var rota = '<article class="pn-cd rota"><h2>' + (ehVend ? esc(p.rota || "Sua rota") : "Onde a empresa apoia") + '</h2><p class="sub">' + (ehVend ? "Por onde você passa e em que dias." : "Áreas em que a empresa atua, em " + esc(p.cidade) + ".") + '</p>' +
      '<div class="pn-rmap" id="rmap" role="img" aria-label="Pontos: ' + esc(pontosDaRota().join(", ")) + '"><svg viewBox="0 0 600 190" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="' + TRACO + '" fill="none" stroke="#BB4938" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 12" vector-effect="non-scaling-stroke"/></svg></div>' + dias + '</article>';
    var passos = ehVend
      ? '<li class="ok"><span class="p">' + CHECK + '</span><div>Conta criada</div></li><li class="ok"><span class="p">' + CHECK + '</span><div>Cadastro completo</div></li><li class="prox"><span class="p"></span><div>Usar o app na sua rota<small>No lançamento</small></div></li>'
      : '<li class="ok"><span class="p">' + CHECK + '</span><div>Conta criada</div></li><li class="ok"><span class="p">' + CHECK + '</span><div>Candidatura enviada</div></li><li class="prox"><span class="p"></span><div>Equipe confere a empresa<small>Em andamento</small></div></li><li class="fut"><span class="p"></span><div>Entrada na Rede de Apoio<small>Depois de aprovada</small></div></li>';
    var stat = '<article class="pn-cd stat"><span class="soon">' + (ehVend ? "Em breve" : "Em verificação") + '</span>' +
      (ehVend ? '<h2 class="big">O app sai no lançamento oficial.</h2><p class="txt">Quando chegar a hora, a gente avisa você.</p>'
              : '<h2 class="big">Sua empresa está em verificação.</h2><p class="txt">Nossa equipe está conferindo se ela existe e está funcionando. Depois a gente entra em contato.</p>') +
      '<h3>O que falta</h3><ul class="pn-tl">' + passos + '</ul></article>';
    var info = ehVend
      ? '<div><dt>Negócio</dt><dd>' + esc(p.negocio) + '</dd></div><div><dt>Vende</dt><dd>' + tags(vende) + '</dd></div><div><dt>Vai de</dt><dd>' + esc(p.meio) + '</dd></div><div><dt>Rota</dt><dd>' + esc(p.rota) + ' · ' + esc(p.cidade) + (p.bairros ? " · " + esc(p.bairros) : "") + '</dd></div><div><dt>Pedidos de parada</dt><dd>' + esc(p.distancia || "Normal") + '</dd></div><div><dt>Telefone</dt><dd>' + esc(p.telefone) + '</dd></div>'
      : '<div><dt>Empresa</dt><dd>' + esc(p.nome) + '</dd></div><div><dt>CNPJ</dt><dd>' + esc(p.cnpj) + '</dd></div><div><dt>Site ou rede</dt><dd>' + esc(p.site) + '</dd></div><div><dt>Responsável</dt><dd>' + esc(p.responsavel) + '</dd></div><div><dt>Áreas</dt><dd>' + tags(p.areas || []) + '</dd></div><div><dt>Cidade</dt><dd>' + esc(p.cidade) + '</dd></div><div><dt>Contato</dt><dd>' + esc(p.telefone) + '</dd></div><div><dt>Situação</dt><dd>Em verificação</dd></div>';
    var cad = '<article class="pn-cd cad"><h2>Seu cadastro</h2><dl class="pn-info">' + info + '</dl><button class="btn az" id="edit" type="button">Editar cadastro</button></article>';
    var indica = '<article class="pn-cd indica"><div><h2>' + (ehVend ? "Conhece alguém que vende na rua?" : "Conhece uma empresa que poderia apoiar?") + '</h2><p>' + (ehVend ? "Manda o Tá Chegando pra ela dar uma olhada." : "Passe a Rede de Apoio pra ela. Quem é indicado passa pela mesma verificação.") + '</p></div><div class="pn-acoes"><button class="btn az" id="copia" type="button">Copiar link</button><a class="btn ln-d" id="zap" target="_blank" rel="noopener" href="#">Enviar no WhatsApp</a></div><p class="pn-ok" id="copia-ok" role="status" aria-live="polite"></p></article>';
    var temp = '<div class="pn-temp" role="note"><b>Este painel é temporário.</b><span>O app Tá Chegando ainda não saiu. Seu cadastro já fica pronto: quando o app for lançado, é só entrar com a mesma conta que você usou aqui. A gente te avisa.</span></div>';
    el.innerHTML = temp + ph + kpis + '<div class="pn-grid ' + (ehVend ? "vend" : "apoio") + '">' + (ehVend ? rota + stat : stat + rota) + cad + indica + '</div>';
    document.getElementById("edit").onclick = function () { ir("perfil"); };
    document.getElementById("edit-top").onclick = function () { ir("perfil"); window.scrollTo(0, 0); };
    colocaPins();
    var link = location.origin + (ehVend ? "/vendedores" : "/rede-de-apoio"), msg = (ehVend ? "Olha o Tá Chegando, um app pra quem vende na rua ser encontrado: " : "Olha a Rede de Apoio do Tá Chegando: ") + link;
    document.getElementById("zap").href = "https://wa.me/?text=" + encodeURIComponent(msg);
    document.getElementById("copia").onclick = function () {
      var ok = document.getElementById("copia-ok");
      function feito() { ok.textContent = "Link copiado."; setTimeout(function () { ok.textContent = ""; }, 2500); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(feito, function () { ok.textContent = "Copie o link: " + link; });
      else ok.textContent = "Copie o link: " + link;
    };
  }
  function kpiLinha() {
    var kp = ehVend ? ["Clientes esperando", "Onde tem clientes", "Rotas"] : ["Vendedores na rede", "Contatos", "Áreas"];
    return '<div class="pn-kpis" role="group" tabindex="0" aria-label="Números">' + kp.map(function (k) { return '<article class="pn-cd kpi"><small>' + k + '</small><b aria-label="sem dados ainda">&ndash;</b>' + SPARK + '</article>'; }).join("") + '</div>' +
      '<p class="pn-nota">Os números aparecem quando você começar a usar o app.</p>';
  }
  var NOME_M = ehVend ? "Métricas" : "Candidatura";
  if (!ehVend) {
    var bm = document.querySelector('.pn-item[data-v="metricas"]'); bm.querySelector(".tx").textContent = NOME_M; var sm = bm.querySelector("small"); if (sm) sm.remove();
    var tm = document.querySelector('.pn-tabs [data-v="metricas"]'); tm.lastChild.textContent = NOME_M;
  } else { var sm2 = document.querySelector('.pn-item[data-v="metricas"] small'); if (sm2) sm2.remove(); }
  function metricas() {
    if (ehVend) TCMetricas.vendedor(el, user.perfil || {}, esc, foco); else TCMetricas.apoio(el, user.perfil || {}, esc, foco, CHECK);
  }
  function ir(v) {
    cartaoUsuario();
    var atual = completo() ? v : "perfil";
    // antes de concluir o cadastro, só a aba Meu cadastro aparece
    // antes de concluir o cadastro, a tela de cadastro aparece sozinha, sem menu lateral nem abas
    document.body.classList.toggle("sem-menu", !completo());
    document.getElementById("top-t").textContent = atual === "perfil" ? "Meu cadastro" : atual === "metricas" ? NOME_M : "Início";
    document.querySelectorAll("[data-v]").forEach(function (b) { if (b.dataset.v === atual) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    if (!completo()) { cadastro(false); return; }
    if (v === "perfil") cadastro(true); else if (v === "metricas") metricas(); else { inicio(); foco.focus({ preventScroll: true }); }
  }
  document.querySelectorAll("[data-v]").forEach(function (b) { b.onclick = function () { ir(b.dataset.v); window.scrollTo(0, 0); }; });
  ir("inicio");
})();
