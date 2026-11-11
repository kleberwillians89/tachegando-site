/*
 * Aba Métricas do PROTÓTIPO.
 * Os números são de exemplo: nascem do cadastro (dias, bairros, distância) e de contas fixas.
 * No app real vêm de purchase_intents (avisos de chegada), vendor_routes (rotas),
 * demand_clusters (zonas sugeridas) e vendors (nota). Ao ligar o banco, troque só dados().
 */
window.TCMetricas = (function () {
  var SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  var PESO_DIA = [9, 6, 11, 7, 13, 17, 8];
  var FAIXAS = [["6h", 4], ["8h", 9], ["10h", 15], ["12h", 12], ["14h", 8], ["16h", 11], ["18h", 16]];
  var ZONAS = [[14, 3, "Aceita"], [9, 5, "Sugerida"], [6, 2, "Concluída"], [3, 7, "Recusada"]];
  var METROS = { "Perto": 100, "Normal": 150, "Mais longe": 300 };
  var DUR = ["3h10", "2h40", "3h25"];
  function n(v) { return String(v).replace(".", ","); }
  function pl(v, um, vv) { return v + " " + (v === 1 ? um : vv); }

  function dados(p, per) {
    var dias = p.dias && p.dias.length ? p.dias : SEMANA;
    var barras;
    if (per === "7") barras = SEMANA.map(function (d, i) { return { r: d, v: dias.indexOf(d) > -1 ? PESO_DIA[i] : 0, folga: dias.indexOf(d) < 0 }; });
    else {
      var sem = PESO_DIA.reduce(function (s, v, i) { return s + (dias.indexOf(SEMANA[i]) > -1 ? v : 0); }, 0);
      barras = [0.8, 0.9, 1.1, 1].map(function (f, i) { return { r: "Sem " + (i + 1), v: Math.round(sem * f) }; });
    }
    var total = barras.reduce(function (s, b) { return s + b.v; }, 0);
    var at = Math.round(total * 0.46), ac = Math.round(total * 0.14), ag = Math.round(total * 0.08), ex = total - at - ac - ag;
    var rotas = per === "7" ? dias.length : dias.length * 4;
    var peso = FAIXAS.reduce(function (s, x) { return s + x[1]; }, 0), usado = 0;
    var horas = FAIXAS.map(function (x, i) { var v = i === FAIXAS.length - 1 ? total - usado : Math.round(total * x[1] / peso); usado += v; return { r: x[0] + " às " + (parseInt(x[0], 10) + 2) + "h", v: v }; });
    var bairros = String(p.bairros || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    if (!bairros.length) bairros = ["Centro"];
    var esc = per === "7" ? 1 : 3.6;
    var zonas = ZONAS.slice(0, Math.min(4, Math.max(bairros.length, 2))).map(function (z, i) { return { nome: bairros[i % bairros.length] + (i >= bairros.length ? " (extra)" : ""), v: Math.round(z[0] * esc), min: z[1], st: z[2] }; });
    var ult = dias.slice().reverse().slice(0, 3).map(function (d, i) { var a = Math.round(PESO_DIA[SEMANA.indexOf(d)] * 0.9); return { d: d, dur: DUR[i], a: a, at: Math.round(a * 0.46) }; });
    return { barras: barras, total: total, at: at, ac: ac, ag: ag, ex: ex, rotas: rotas, horas: horas, zonas: zonas, ult: ult, metros: METROS[p.distancia || "Normal"] || 150 };
  }

  function barras(d, esc) {
    var max = Math.max.apply(null, d.barras.map(function (b) { return b.v; })) || 1, topo = d.barras.reduce(function (m, b, i) { return b.v > d.barras[m].v ? i : m; }, 0);
    return '<ul class="mt-bars" aria-label="Avisos por ' + (d.barras.length === 7 ? "dia" : "semana") + '">' + d.barras.map(function (b, i) {
      var h = b.v ? Math.max(6, Math.round(b.v / max * 100)) : 0;
      return '<li class="' + (i === topo ? "top" : "") + (b.folga ? " folga" : "") + '" aria-label="' + esc(b.r) + ": " + (b.folga ? "dia de folga" : pl(b.v, "aviso", "avisos")) + '"><span class="v" aria-hidden="true">' + (b.folga ? "" : b.v) + '</span><span class="c" aria-hidden="true"><i style="height:' + h + '%"></i></span><span class="r" aria-hidden="true">' + esc(b.r) + '</span></li>';
    }).join("") + "</ul>";
  }

  function vendedor(el, p, esc, foco) {
    var per = "7";
    var rotulos = { "7": "Últimos 7 dias", "4": "Últimas 4 semanas" };
    el.innerHTML = '<div class="pn-ph curto"><div class="tx"><span class="eyebrow">Métricas</span><h1>Seus números</h1><p>Como foi a procura pela sua rota.</p></div>' +
      '<div class="mt-ac"><div class="mt-per" role="group" aria-label="Período"><button type="button" data-per="7" aria-pressed="true">7 dias</button><button type="button" data-per="4" aria-pressed="false">4 semanas</button></div></div></div>' +
      '<p class="mt-ex"><span class="etq">Exemplo</span><span>Números de exemplo, feitos a partir do seu cadastro.</span></p><div id="mt" aria-live="polite"></div>';
    var box = el.querySelector("#mt");
    function desenha() {
      var d = dados(p, per), t = d.total || 1;
      var seg = [["at", "Atendidos", d.at], ["ac", "A caminho", d.ac], ["ag", "Aguardando", d.ag], ["ex", "Expirados", d.ex]];
      var maxH = Math.max.apply(null, d.horas.map(function (h) { return h.v; })), topH = d.horas.filter(function (h) { return h.v === maxH; })[0];
      var maxZ = Math.max.apply(null, d.zonas.map(function (z) { return z.v; }));
      box.innerHTML =
        '<div class="pn-kpis q4" role="group" tabindex="0" aria-label="Resumo, ' + rotulos[per].toLowerCase() + '">' +
          '<article class="pn-cd kpi"><small>Avisos de chegada</small><b>' + d.total + '</b><em>' + rotulos[per] + '</em></article>' +
          '<article class="pn-cd kpi"><small>Atendidos</small><b>' + d.at + '</b><em>' + Math.round(d.at / t * 100) + '% dos avisos</em></article>' +
          '<article class="pn-cd kpi"><small>Rotas feitas</small><b>' + d.rotas + '</b><em>' + d.metros + ' m de aviso</em></article>' +
          '<article class="pn-cd kpi"><small>Sua nota</small><b>4,8</b><em>23 avaliações</em></article>' +
        '</div>' +
        '<div class="pn-grid mt-g">' +
          '<article class="pn-cd mt-a"><h2>Avisos de chegada</h2><p class="sub">Quantas pessoas pediram pra ser avisadas quando você passar, por ' + (per === "7" ? "dia" : "semana") + '.</p>' + barras(d, esc) + '</article>' +
          '<article class="pn-cd mt-b"><h2>Como terminaram</h2><p class="sub">Cada aviso vale por 30 minutos.</p>' +
            '<div class="mt-seg" role="img" aria-label="' + seg.map(function (s) { return s[1] + " " + s[2]; }).join(", ") + '">' + seg.map(function (s) { return '<i class="' + s[0] + '" style="flex-grow:' + Math.max(s[2], 0.0001) + '"></i>'; }).join("") + '</div>' +
            '<ul class="mt-leg">' + seg.map(function (s) { return '<li><i class="' + s[0] + '" aria-hidden="true"></i><span>' + s[1] + '</span><b>' + s[2] + '</b></li>'; }).join("") + '</ul></article>' +
          '<article class="pn-cd mt-c"><h2>Horários</h2><p class="sub">Mais avisos entre <b>' + esc(topH.r.replace(" às ", " e ")) + '</b>.</p><ul class="mt-hor">' + d.horas.map(function (h) {
            return '<li class="' + (h === topH ? "top" : "") + '"><span class="r">' + esc(h.r.replace(" às ", " às ")) + '</span><span class="b" aria-hidden="true"><i style="width:' + Math.round(h.v / (maxH || 1) * 100) + '%"></i></span><b>' + h.v + '<span class="sr"> avisos</span></b></li>'; }).join("") + '</ul></article>' +
          '<article class="pn-cd mt-d"><h2>Onde tem clientes</h2><p class="sub">Lugares perto da sua rota onde mais gente pediu aviso.</p><ul class="mt-zon">' + d.zonas.map(function (z) {
            return '<li><div class="l"><b>' + esc(z.nome) + '</b><span class="st st-' + z.st.toLowerCase().replace("í", "i").replace("ç", "c").replace("ã", "a") + '">' + z.st + '</span></div><span class="b" aria-hidden="true"><i style="width:' + Math.round(z.v / maxZ * 100) + '%"></i></span><p>' + pl(z.v, "aviso", "avisos") + ' · desvio de cerca de ' + z.min + ' min</p></li>'; }).join("") + '</ul></article>' +
          '<article class="pn-cd mt-e"><h2>Últimas rotas</h2><p class="sub">Quanto tempo você ficou na rua e quantos avisos apareceram.</p><ul class="mt-rot">' + d.ult.map(function (r) {
            return '<li><span class="dia" aria-hidden="true">' + r.d + '</span><div><b>' + esc(p.rota || "Sua rota") + '</b><p>' + r.dur.replace("h", " h ") + ' na rua · ' + pl(r.a, "aviso", "avisos") + ' · ' + r.at + ' atendidos</p></div></li>'; }).join("") + '</ul></article>' +
          '<article class="pn-cd mt-f"><h2>Sua nota</h2><p class="sub">É o que aparece no seu perfil pra quem procura.</p><div class="mt-nota"><b>4,8</b><div><span class="est" role="img" aria-label="4,8 de 5 estrelas"><i style="width:96%"></i></span><p>23 avaliações</p></div></div></article>' +
        '</div>' +
        '<p class="pn-nota mt-fim">No app, esses números vêm dos avisos de chegada e das rotas que você grava.</p>';
    }
    el.querySelectorAll("[data-per]").forEach(function (b) {
      b.onclick = function () {
        per = b.dataset.per;
        el.querySelectorAll("[data-per]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        desenha();
      };
    });
    desenha();
    foco.focus({ preventScroll: true });
  }

  function apoio(el, p, esc, foco, CHECK) {
    var item = function (ok, t, s) { return '<li class="' + (ok ? "ok" : "prox") + '"><span class="p">' + (ok ? CHECK : "") + '</span><div>' + t + '<small>' + s + '</small></div></li>'; };
    el.innerHTML = '<div class="pn-ph curto"><div class="tx"><span class="eyebrow">Candidatura</span><h1>Acompanhe a verificação</h1><p>A Rede de Apoio só aceita empresas conferidas pela nossa equipe.</p></div></div>' +
      '<div class="pn-grid mt-ap"><article class="pn-cd stat"><span class="soon">Em verificação</span><h2 class="big">' + esc(p.nome || "Sua empresa") + '</h2><p class="txt">Nossa equipe está conferindo os dados. Depois a gente entra em contato.</p><h3>O que a equipe confere</h3><ul class="pn-tl">' +
      item(true, "CNPJ válido", esc(p.cnpj || "")) + item(true, "Site ou rede social informado", esc(p.site || "")) + item(false, "Empresa existe e está em funcionamento", "Em andamento") + item(false, "Atuação combina com a rede", "Depois da conferência") + '</ul></article>' +
      '<article class="pn-cd"><h2>E depois?</h2><p class="sub">Aprovada a empresa, ela entra na Rede de Apoio e a equipe combina os próximos passos por ' + esc(p.telefone || "telefone") + '.</p><p class="sub">Ainda não há números por empresa. Quando houver, eles aparecem aqui.</p></article></div>';
    foco.focus({ preventScroll: true });
  }
  return { vendedor: vendedor, apoio: apoio };
})();
