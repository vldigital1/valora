/* ============================================================
   Modelos de impressão do orçamento (Clássico, Moderno, Executivo)
   ============================================================ */
const MODELOS = [
  {id:'classico',  nome:'Clássico',  desc:'Faixa colorida no topo e tabelas destacadas'},
  {id:'moderno',   nome:'Moderno',   desc:'Visual limpo com cartões de total'},
  {id:'executivo', nome:'Executivo', desc:'Formal, com grade e fonte serifada'},
  {id:'lateral',    nome:'Faixa lateral', desc:'Barra colorida na lateral e títulos em etiqueta'},
  {id:'minimalista',nome:'Minimalista',   desc:'Preto e branco, tipografia grande'},
  {id:'compacto',   nome:'Compacto',      desc:'Tabela única, cabe muito item por página'}
];

const FONTES_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&display=swap';

const DOC_CSS = `
.doc{width:794px;background:#fff;color:#1d1d1f;font-size:11.5px;line-height:1.45;font-family:Arial,Helvetica,sans-serif;text-align:left}
.doc *{box-sizing:border-box}
.doc h1,.doc h2,.doc h3{margin:0;font-weight:700;letter-spacing:0}
.doc table{width:100%;border-collapse:collapse}
.doc .r{text-align:right;white-space:nowrap}
.doc .b{font-weight:700}
.doc small{font-size:9.5px;color:#8a8a8a}
.doc tr,.doc .nq{page-break-inside:avoid;break-inside:avoid}
.doc .cn{width:22px;color:#9a9a9a}
.doc .ass{display:flex;gap:48px;margin-top:56px;page-break-inside:avoid;break-inside:avoid}
.doc .ass div{flex:1;border-top:1px solid #9a9a9a;padding-top:6px;text-align:center;font-size:10.5px;color:#555}
.doc .rod{margin-top:22px;font-size:9.5px;color:#8a8a8a;text-align:center}

/* ---------- Clássico ---------- */
.doc-classico .c-faixa{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:28px 40px;color:#fff}
.doc-classico .c-emp{display:flex;gap:16px;align-items:center}
.doc-classico .c-logo{width:84px;height:84px;background:#fff;border-radius:10px;padding:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.doc-classico .c-logo img{max-width:100%;max-height:100%}
.doc-classico h2{font-size:20px;margin-bottom:4px}
.doc-classico .c-dados{font-size:10.5px;opacity:.95}
.doc-classico .c-num{text-align:right;flex-shrink:0}
.doc-classico .c-num .t{font-size:11px;letter-spacing:3px;opacity:.9}
.doc-classico .c-num .n{font-size:26px;font-weight:700;line-height:1.2}
.doc-classico .c-num .d{font-size:10.5px}
.doc-classico .c-corpo{padding:22px 40px 30px}
.doc-classico .c-rot{font-size:9.5px;font-weight:700;letter-spacing:1.5px;color:#888;text-transform:uppercase;margin-bottom:5px}
.doc-classico .c-cli{border:1px solid #e3e3e3;border-radius:8px;padding:11px 14px}
.doc-classico .c-sec{margin-top:22px}
.doc-classico .c-sec-tit{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px;padding:0 0 6px}
.doc-classico .c-sec-tit span{font-size:10px;font-weight:400;color:#888}
.doc-classico th{color:#fff;font-size:9.5px;text-transform:uppercase;letter-spacing:.8px;padding:7px 8px;text-align:left;font-weight:700}
.doc-classico td{padding:7px 8px;border-bottom:1px solid #ececec;vertical-align:top}
.doc-classico .c-sub td{background:#f6f6f6;font-weight:700;border-bottom:0}
.doc-classico .c-fim{display:flex;gap:24px;margin-top:24px;align-items:flex-start;page-break-inside:avoid;break-inside:avoid}
.doc-classico .c-cond{flex:1}
.doc-classico .c-cond div{margin-bottom:4px}
.doc-classico .c-tot{width:300px;border:1px solid #e3e3e3;border-radius:8px;padding:10px 14px 0;overflow:hidden}
.doc-classico .c-tot .l{display:flex;justify-content:space-between;padding:4px 0}
.doc-classico .c-tot .g{margin:8px -14px 0;padding:12px 14px;color:#fff;font-size:16px;font-weight:700;display:flex;justify-content:space-between}
.doc-classico .eco{font-size:10px;color:#1a8f4c;text-align:right;margin-top:6px}

/* ---------- Moderno ---------- */
.doc-moderno{font-family:Inter,Arial,sans-serif;font-size:11px}
.doc-moderno .m-barra{height:8px}
.doc-moderno .m-pad{padding:30px 44px 30px}
.doc-moderno .m-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.doc-moderno .m-emp{display:flex;gap:14px;align-items:center}
.doc-moderno .m-emp img{max-width:130px;max-height:66px}
.doc-moderno .m-emp h2{font-size:17px;font-weight:700}
.doc-moderno .m-emp .i{font-size:10px;color:#777;margin-top:2px}
.doc-moderno .m-tit{text-align:right}
.doc-moderno .m-tit .a{font-size:32px;font-weight:300;letter-spacing:-1px;line-height:1;color:#1d1d1f}
.doc-moderno .m-tit .b{font-size:14px;font-weight:700;margin-top:6px}
.doc-moderno .m-info{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-top:26px}
.doc-moderno .m-card{border-radius:10px;padding:11px 13px}
.doc-moderno .k{font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:#8a8a8a;margin-bottom:3px;font-weight:600}
.doc-moderno .m-sec{margin-top:26px}
.doc-moderno .m-sec h3{display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px}
.doc-moderno .m-sec h3 .dot{width:9px;height:9px;border-radius:50%}
.doc-moderno .m-sec h3 .q{font-weight:500;color:#9a9a9a;font-size:11px}
.doc-moderno th{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;padding:8px 9px;text-align:left}
.doc-moderno th:first-child{border-radius:8px 0 0 8px}
.doc-moderno th:last-child{border-radius:0 8px 8px 0}
.doc-moderno td{padding:8px 9px;vertical-align:top}
.doc-moderno tbody tr:nth-child(even) td{background:#fafafa}
.doc-moderno .m-sub td{border-top:1px solid #ececec;font-weight:700;background:#fff!important}
.doc-moderno .m-desc{display:flex;justify-content:flex-end;gap:16px;margin-top:22px;font-size:11px;color:#555}
.doc-moderno .m-cards{display:grid;grid-template-columns:1fr 1fr 1.35fr;gap:10px;margin-top:10px;page-break-inside:avoid;break-inside:avoid}
.doc-moderno .m-cards > div{border-radius:12px;padding:13px 15px;border:1px solid #ececec}
.doc-moderno .m-cards .v{font-size:17px;font-weight:700;margin-top:2px}
.doc-moderno .m-cards .tot{color:#fff;border:0}
.doc-moderno .m-cards .tot .k{color:rgba(255,255,255,.8)}
.doc-moderno .m-cards .tot .v{font-size:22px}
.doc-moderno .eco{font-size:10px;color:#1a8f4c;text-align:right;margin-top:6px}
.doc-moderno .m-cond{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-top:24px;padding-top:16px;border-top:1px solid #ececec;page-break-inside:avoid;break-inside:avoid}

/* ---------- Executivo ---------- */
.doc-executivo{font-family:Georgia,"Times New Roman",serif;color:#222}
.doc-executivo .e-pad{padding:40px 52px 30px}
.doc-executivo .e-topo{text-align:center}
.doc-executivo .e-topo img{max-height:72px;max-width:190px;margin-bottom:10px}
.doc-executivo .e-topo h2{font-size:19px;letter-spacing:3px;text-transform:uppercase}
.doc-executivo .e-topo .i{font-size:10px;color:#666;margin-top:5px}
.doc-executivo .e-regua{border-top:3px double;margin:18px 0 18px}
.doc-executivo .e-titulo{display:flex;justify-content:space-between;align-items:baseline}
.doc-executivo .e-titulo h1{font-size:22px;letter-spacing:5px;font-weight:400}
.doc-executivo .e-titulo span{font-size:13px}
.doc-executivo .e-dados{margin-top:12px}
.doc-executivo .e-dados td{border:1px solid #cfcfcf;padding:6px 9px;font-size:11px}
.doc-executivo .e-dados .k{background:#f4f4f4;width:92px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#555}
.doc-executivo .e-sec{margin:24px 0 7px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700}
.doc-executivo .e-itens th{background:#f1f1f1;border:1px solid #cfcfcf;font-size:9px;padding:6px 8px;text-transform:uppercase;letter-spacing:.8px;text-align:left;font-weight:700}
.doc-executivo .e-itens td{border:1px solid #cfcfcf;padding:6px 8px;vertical-align:top}
.doc-executivo .e-itens .e-sub td{background:#fafafa;font-weight:700}
.doc-executivo .e-fim{display:flex;gap:28px;margin-top:26px;align-items:flex-start;page-break-inside:avoid;break-inside:avoid}
.doc-executivo .e-cond{flex:1;font-size:11px}
.doc-executivo .e-cond ol{margin:6px 0 0;padding-left:18px}
.doc-executivo .e-cond li{margin-bottom:3px}
.doc-executivo .e-tot{width:290px}
.doc-executivo .e-tot td{border:1px solid #cfcfcf;padding:7px 10px}
.doc-executivo .e-tot .g td{color:#fff;font-size:14px;font-weight:700;border-color:transparent}
.doc-executivo .eco{font-size:10px;color:#1a8f4c;text-align:right;margin-top:6px;font-style:italic}
.doc-executivo .e-local{margin-top:34px;text-align:right;font-size:11px}

/* ---------- Faixa lateral ---------- */
.doc-lateral{font-family:Inter,Arial,sans-serif;border-left:18px solid;font-size:11px}
.doc-lateral .l-pad{padding:34px 40px 30px 34px}
.doc-lateral .l-topo{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
.doc-lateral .l-emp img{max-height:62px;max-width:160px;display:block;margin-bottom:8px}
.doc-lateral .l-emp h2{font-size:18px}
.doc-lateral .l-emp .i{font-size:10px;color:#777}
.doc-lateral .l-num{border-radius:14px;padding:14px 18px;color:#fff;text-align:right;min-width:190px}
.doc-lateral .l-num .t{font-size:10px;letter-spacing:2.5px;opacity:.85}
.doc-lateral .l-num .n{font-size:24px;font-weight:700;line-height:1.15}
.doc-lateral .l-num .d{font-size:10px;opacity:.9}
.doc-lateral .l-cli{margin-top:22px;padding:4px 0 4px 14px;border-left:3px solid}
.doc-lateral .l-cli .k{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#888;font-weight:700}
.doc-lateral .l-cli b{font-size:14px}
.doc-lateral .l-sec{margin-top:24px}
.doc-lateral .l-etq{display:inline-block;color:#fff;font-weight:700;font-size:10px;letter-spacing:1.5px;padding:4px 12px;border-radius:20px;margin-bottom:8px}
.doc-lateral .l-etq span{font-weight:400;opacity:.85;letter-spacing:0;margin-left:6px}
.doc-lateral th{font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:#555;text-align:left;padding:7px 8px;border-bottom:2px solid}
.doc-lateral td{padding:8px;border-bottom:1px solid #eee;vertical-align:top}
.doc-lateral .l-sub td{border-bottom:0;font-weight:700;padding-top:10px}
.doc-lateral .l-fim{display:flex;gap:30px;margin-top:26px;align-items:flex-start;page-break-inside:avoid;break-inside:avoid}
.doc-lateral .l-cond{flex:1;line-height:1.7}
.doc-lateral .l-cond .k{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#888;font-weight:700;margin-bottom:4px}
.doc-lateral .l-tot{width:270px}
.doc-lateral .l-tot .l{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #ddd}
.doc-lateral .l-tot .g{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:8px;border-top:3px solid}
.doc-lateral .l-tot .g span:first-child{font-size:10px;letter-spacing:1.5px;font-weight:700}
.doc-lateral .l-tot .g span:last-child{font-size:24px;font-weight:800}
.doc-lateral .eco{font-size:10px;color:#1a8f4c;text-align:right;margin-top:6px}

/* ---------- Minimalista ---------- */
.doc-minimalista{font-family:Inter,Arial,sans-serif;color:#111;font-size:11px}
.doc-minimalista .n-pad{padding:44px 54px 34px}
.doc-minimalista .n-topo{display:flex;justify-content:space-between;align-items:center}
.doc-minimalista .n-marca{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600}
.doc-minimalista .n-marca img{max-height:40px;max-width:110px}
.doc-minimalista .n-marca i{width:9px;height:9px;display:inline-block}
.doc-minimalista .n-loja{font-size:9.5px;color:#777;text-align:right;line-height:1.6}
.doc-minimalista h1{font-size:46px;font-weight:300;letter-spacing:-1.5px;margin:34px 0 18px}
.doc-minimalista .n-meta{display:grid;grid-template-columns:1fr 1fr 1fr 2fr;border-top:1px solid #111;border-bottom:1px solid #111}
.doc-minimalista .n-meta div{padding:10px 12px 10px 0}
.doc-minimalista .n-meta div+div{padding-left:12px;border-left:1px solid #ddd}
.doc-minimalista .k{font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:3px}
.doc-minimalista .n-sec{margin-top:30px}
.doc-minimalista .n-sec h3{font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;margin-bottom:6px}
.doc-minimalista th{font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:#888;font-weight:500;text-align:left;padding:6px 6px 6px 0;border-bottom:1px solid #111}
.doc-minimalista td{padding:9px 6px 9px 0;border-bottom:1px solid #eee;vertical-align:top}
.doc-minimalista .n-sub td{border-bottom:0;font-weight:600}
.doc-minimalista .n-fim{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-top:34px;padding-top:18px;border-top:1px solid #111;page-break-inside:avoid;break-inside:avoid}
.doc-minimalista .n-res div{display:flex;gap:30px;justify-content:space-between;color:#555;padding:2px 0}
.doc-minimalista .n-total{text-align:right}
.doc-minimalista .n-total .v{font-size:38px;font-weight:300;letter-spacing:-1px;line-height:1.1}
.doc-minimalista .n-cond{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:28px;page-break-inside:avoid;break-inside:avoid}
.doc-minimalista .eco{font-size:10px;color:#555;margin-top:4px}

/* ---------- Compacto ---------- */
.doc-compacto{font-size:10px;line-height:1.35}
.doc-compacto .k-pad{padding:26px 32px 24px}
.doc-compacto .k-cab{display:grid;grid-template-columns:1.4fr 1fr;border:1.5px solid #222}
.doc-compacto .k-cab>div{padding:10px 12px}
.doc-compacto .k-cab>div+div{border-left:1.5px solid #222}
.doc-compacto .k-emp{display:flex;gap:10px;align-items:center}
.doc-compacto .k-emp img{max-height:48px;max-width:90px}
.doc-compacto .k-emp h2{font-size:14px}
.doc-compacto .k-tit{display:flex;justify-content:space-between;align-items:center;color:#fff;margin:-10px -12px 8px;padding:6px 12px;font-weight:700;letter-spacing:2px}
.doc-compacto .k-lin{display:flex;justify-content:space-between;padding:1px 0}
.doc-compacto .k-cli{border:1.5px solid #222;border-top:0;padding:7px 12px;display:flex;gap:18px;flex-wrap:wrap}
.doc-compacto .k-cli b{font-size:11px}
.doc-compacto table.k-it{margin-top:10px;border:1.5px solid #222}
.doc-compacto .k-it th{font-size:8.5px;text-transform:uppercase;letter-spacing:.6px;text-align:left;padding:5px 6px;background:#222;color:#fff}
.doc-compacto .k-it td{padding:4px 6px;border-bottom:1px dashed #ccc;vertical-align:top}
.doc-compacto .k-it th.r{text-align:right}
.doc-compacto .k-grp td{font-weight:700;letter-spacing:1.5px;font-size:9px;padding:5px 6px;border-bottom:1px solid #222}
.doc-compacto .k-sub td{font-weight:700;background:#f4f4f4;border-bottom:1.5px solid #222}
.doc-compacto table.k-res{margin-top:10px;border:1.5px solid #222;page-break-inside:avoid;break-inside:avoid}
.doc-compacto .k-res td{padding:7px 10px;border-left:1px solid #ccc;text-align:center}
.doc-compacto .k-res td:first-child{border-left:0}
.doc-compacto .k-res .k{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#777}
.doc-compacto .k-res b{font-size:13px}
.doc-compacto .k-res .g{color:#fff}
.doc-compacto .k-res .g .k{color:rgba(255,255,255,.8)}
.doc-compacto .k-res .g b{font-size:16px}
.doc-compacto .k-cond{margin-top:10px;border:1px dashed #999;padding:8px 10px;display:flex;flex-wrap:wrap;gap:4px 18px;page-break-inside:avoid;break-inside:avoid}
.doc-compacto .ass{margin-top:40px}
`;

/* ---------- Auxiliares ---------- */
function tint(hex, a){
  let h = String(hex || '#333333').replace('#', '');
  if(h.length === 3) h = h.split('').map(x => x + x).join('');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
const pct = v => n(v).toLocaleString('pt-BR', {maximumFractionDigits:2}) + '%';
const qtdFmt = v => n(v).toLocaleString('pt-BR', {maximumFractionDigits:3});

function dadosDoc(o){
  const l = loja(o.lojaId) || {nome:'Sua loja'};
  const c = cliente(o.clienteId) || {nome:o.clienteNome || ''};
  return {
    l, c, t: calcular(o), cor: l.cor || '#C96442',
    pecas: o.itens.filter(i => !ehServico(i)),
    serv: o.itens.filter(ehServico),
    validoAte: fmtData(somaDias(o.data, o.validade)),
    infoLoja: [l.doc && ('CNPJ/CPF: ' + l.doc), l.endereco, [l.telefone, l.email].filter(Boolean).join(' · ')].filter(Boolean)
  };
}
const celDesc = i => n(i.desc) ? `${pct(i.desc)}<br><small>− ${brl(descLinha(i))}</small>` : '—';
const linhasItens = lista => lista.map((i,k) => `<tr>
  <td class="cn">${k+1}</td><td>${esc(i.codigo) || '—'}</td><td>${esc(i.descricao)}</td>
  <td class="r">${qtdFmt(i.qtd)} ${esc(i.unidade || '')}</td><td class="r">${brl(i.unit)}</td>
  <td class="r">${celDesc(i)}</td><td class="r b">${brl(totalLinha(i))}</td></tr>`).join('');
const cabItens = (estilo='') => `<tr${estilo}><th class="cn">#</th><th style="width:62px">Cód.</th><th>Descrição</th><th class="r">Qtd</th><th class="r">Valor unit.</th><th class="r">Desconto</th><th class="r">Total</th></tr>`;
const qtdItens = l => `${l.length} ${l.length === 1 ? 'item' : 'itens'}`;
function condicoes(o, l){
  return [
    o.pagamento && ['Forma de pagamento', o.pagamento],
    l.pix && ['Chave Pix', l.pix],
    o.prazo && ['Prazo', o.prazo],
    ['Validade', `${o.validade} dias`]
  ].filter(Boolean);
}
const quebra = s => esc(s).replace(/\n/g, '<br>');

/* ---------- Modelo 1: Clássico ---------- */
function modeloClassico(o, d){
  const {l, c, t, cor, pecas, serv, validoAte, infoLoja} = d;
  const secao = (titulo, lista, s) => !lista.length ? '' : `
    <div class="c-sec">
      <div class="c-sec-tit" style="color:${cor}">${titulo}<span>${qtdItens(lista)}</span></div>
      <table>${cabItens(` style="background:${cor}"`)}${linhasItens(lista)}
        <tr class="c-sub"><td colspan="6" class="r">Total em ${titulo.toLowerCase()}</td><td class="r">${brl(s.liq)}</td></tr></table>
    </div>`;
  return `
  <div class="c-faixa" style="background:${cor}">
    <div class="c-emp">
      ${l.logo ? `<div class="c-logo"><img src="${l.logo}"></div>` : ''}
      <div><h2>${esc(l.nome)}</h2><div class="c-dados">${infoLoja.map(esc).join('<br>')}</div></div>
    </div>
    <div class="c-num"><div class="t">ORÇAMENTO</div><div class="n">Nº ${fmtNum(o)}</div>
      <div class="d">Emissão: ${fmtData(o.data)}<br>Válido até: ${validoAte}</div></div>
  </div>
  <div class="c-corpo">
    <div class="c-rot">Cliente</div>
    <div class="c-cli"><b>${esc(c.nome) || '—'}</b>${c.doc ? ' · ' + esc(c.doc) : ''}<br>
      ${esc([c.telefone, c.email].filter(Boolean).join(' · '))}${c.endereco ? '<br>' + esc(c.endereco) : ''}</div>
    ${secao('Peças', pecas, t.pecas)}
    ${secao('Serviços', serv, t.servicos)}
    <div class="c-fim">
      <div class="c-cond">
        <div class="c-rot">Condições</div>
        ${condicoes(o, l).map(([k,v]) => `<div><b>${k}:</b> ${esc(v)}</div>`).join('')}
        ${o.obs ? `<div style="margin-top:8px"><b>Observações:</b><br>${quebra(o.obs)}</div>` : ''}
      </div>
      <div>
        <div class="c-tot">
          <div class="l"><span>Total em peças</span><span>${brl(t.pecas.liq)}</span></div>
          <div class="l"><span>Total em serviços</span><span>${brl(t.servicos.liq)}</span></div>
          ${t.linhasDesc.map(([k, v]) => `<div class="l"><span>${k}</span><span>− ${brl(v)}</span></div>`).join('')}
          <div class="g" style="background:${cor}"><span>TOTAL GERAL</span><span>${brl(t.total)}</span></div>
        </div>
        ${t.economia > .004 ? `<div class="eco">Desconto total concedido: ${brl(t.economia)}</div>` : ''}
      </div>
    </div>
    <div class="ass"><div>${esc(l.nome)}</div><div>${esc(c.nome) || 'Cliente'} — de acordo</div></div>
    ${l.rodape ? `<div class="rod">${quebra(l.rodape)}</div>` : ''}
  </div>`;
}

/* ---------- Modelo 2: Moderno ---------- */
function modeloModerno(o, d){
  const {l, c, t, cor, pecas, serv, validoAte, infoLoja} = d;
  const leve = tint(cor, .08);
  const secao = (titulo, lista, s) => !lista.length ? '' : `
    <div class="m-sec">
      <h3><span class="dot" style="background:${cor}"></span>${titulo}<span class="q">${qtdItens(lista)}</span></h3>
      <table><thead>${cabItens(` style="background:${leve};color:${cor}"`)}</thead>
        <tbody>${linhasItens(lista)}</tbody>
        <tr class="m-sub"><td colspan="6" class="r">Total em ${titulo.toLowerCase()}</td><td class="r">${brl(s.liq)}</td></tr></table>
    </div>`;
  return `
  <div class="m-barra" style="background:${cor}"></div>
  <div class="m-pad">
    <div class="m-topo">
      <div class="m-emp">${l.logo ? `<img src="${l.logo}">` : ''}
        <div><h2>${esc(l.nome)}</h2>${infoLoja.map(x => `<div class="i">${esc(x)}</div>`).join('')}</div></div>
      <div class="m-tit"><div class="a">Orçamento</div><div class="b" style="color:${cor}">Nº ${fmtNum(o)}</div></div>
    </div>
    <div class="m-info">
      <div class="m-card" style="background:${leve}"><div class="k">Cliente</div><b>${esc(c.nome) || '—'}</b>
        <div>${esc([c.doc, c.telefone, c.email].filter(Boolean).join(' · '))}</div>${c.endereco ? `<div>${esc(c.endereco)}</div>` : ''}</div>
      <div class="m-card" style="background:#f6f6f6"><div class="k">Emissão</div><b>${fmtData(o.data)}</b></div>
      <div class="m-card" style="background:#f6f6f6"><div class="k">Válido até</div><b>${validoAte}</b></div>
    </div>
    ${secao('Peças', pecas, t.pecas)}
    ${secao('Serviços', serv, t.servicos)}
    ${t.descTotal > .004 ? `<div class="m-desc">${t.linhasDesc.map(([k, v]) => `<span>${k} − ${brl(v)}</span>`).join('')}</div>` : '<div style="height:14px"></div>'}
    <div class="m-cards">
      <div><div class="k">Total em peças</div><div class="v">${brl(t.pecas.liq)}</div></div>
      <div><div class="k">Total em serviços</div><div class="v">${brl(t.servicos.liq)}</div></div>
      <div class="tot" style="background:${cor}"><div class="k">Total geral</div><div class="v">${brl(t.total)}</div></div>
    </div>
    ${t.economia > .004 ? `<div class="eco">Você economiza ${brl(t.economia)}</div>` : ''}
    <div class="m-cond">
      ${condicoes(o, l).map(([k,v]) => `<div><div class="k">${k}</div>${esc(v)}</div>`).join('')}
      ${o.obs ? `<div style="grid-column:1/-1"><div class="k">Observações</div>${quebra(o.obs)}</div>` : ''}
    </div>
    <div class="ass"><div>${esc(l.nome)}</div><div>${esc(c.nome) || 'Cliente'} — de acordo</div></div>
    ${l.rodape ? `<div class="rod">${quebra(l.rodape)}</div>` : ''}
  </div>`;
}

/* ---------- Modelo 3: Executivo ---------- */
function modeloExecutivo(o, d){
  const {l, c, t, cor, pecas, serv, validoAte, infoLoja} = d;
  const secao = (num, titulo, lista, s) => !lista.length ? '' : `
    <div class="e-sec" style="color:${cor}">${num}. ${titulo}</div>
    <table class="e-itens">${cabItens()}${linhasItens(lista)}
      <tr class="e-sub"><td colspan="6" class="r">Total em ${titulo.toLowerCase()}</td><td class="r">${brl(s.liq)}</td></tr></table>`;
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const [a, m, di] = (o.data || hoje()).split('-');
  return `
  <div class="e-pad">
    <div class="e-topo">${l.logo ? `<img src="${l.logo}"><br>` : ''}
      <h2>${esc(l.nome)}</h2><div class="i">${infoLoja.map(esc).join(' &nbsp;|&nbsp; ')}</div></div>
    <div class="e-regua" style="border-color:${cor}"></div>
    <div class="e-titulo"><h1>ORÇAMENTO</h1><span>Nº <b>${fmtNum(o)}</b> &nbsp;·&nbsp; ${fmtData(o.data)}</span></div>
    <table class="e-dados">
      <tr><td class="k">Cliente</td><td><b>${esc(c.nome) || '—'}</b></td><td class="k">CPF/CNPJ</td><td>${esc(c.doc) || '—'}</td></tr>
      <tr><td class="k">Telefone</td><td>${esc(c.telefone) || '—'}</td><td class="k">E-mail</td><td>${esc(c.email) || '—'}</td></tr>
      <tr><td class="k">Endereço</td><td>${esc(c.endereco) || '—'}</td><td class="k">Válido até</td><td>${validoAte}</td></tr>
    </table>
    ${secao('I', 'Peças', pecas, t.pecas)}
    ${secao(pecas.length ? 'II' : 'I', 'Serviços', serv, t.servicos)}
    <div class="e-fim">
      <div class="e-cond"><b>Condições comerciais</b>
        <ol>${condicoes(o, l).map(([k,v]) => `<li>${k}: ${esc(v)}</li>`).join('')}
          ${o.obs ? `<li>${quebra(o.obs)}</li>` : ''}</ol></div>
      <div>
        <table class="e-tot">
          <tr><td>Total em peças</td><td class="r">${brl(t.pecas.liq)}</td></tr>
          <tr><td>Total em serviços</td><td class="r">${brl(t.servicos.liq)}</td></tr>
          ${t.linhasDesc.map(([k, v]) => `<tr><td>${k}</td><td class="r">− ${brl(v)}</td></tr>`).join('')}
          <tr class="g" style="background:${cor}"><td>TOTAL GERAL</td><td class="r">${brl(t.total)}</td></tr>
        </table>
        ${t.economia > .004 ? `<div class="eco">Desconto total concedido: ${brl(t.economia)}</div>` : ''}
      </div>
    </div>
    <div class="e-local">________________________, ${+di} de ${meses[+m - 1]} de ${a}.</div>
    <div class="ass"><div>${esc(l.nome)}</div><div>${esc(c.nome) || 'Cliente'} — de acordo</div></div>
    ${l.rodape ? `<div class="rod">${quebra(l.rodape)}</div>` : ''}
  </div>`;
}

/* ---------- Modelo 4: Faixa lateral ---------- */
function modeloLateral(o, d){
  const {l, c, t, cor, pecas, serv, validoAte, infoLoja} = d;
  const secao = (titulo, lista, s) => !lista.length ? '' : `
    <div class="l-sec"><div class="l-etq" style="background:${cor}">${titulo.toUpperCase()}<span>${qtdItens(lista)}</span></div>
      <table><thead><tr style="border-color:${cor}">${cabItens().replace(/<tr>|<\/tr>/g, '').replace(/<th/g, `<th style="border-color:${cor}"`)}</tr></thead>
      <tbody>${linhasItens(lista)}<tr class="l-sub"><td colspan="6" class="r">Total em ${titulo.toLowerCase()}</td><td class="r" style="color:${cor}">${brl(s.liq)}</td></tr></tbody></table></div>`;
  return `<div class="l-pad">
    <div class="l-topo">
      <div class="l-emp">${l.logo ? `<img src="${l.logo}">` : ''}<h2>${esc(l.nome)}</h2>${infoLoja.map(x => `<div class="i">${esc(x)}</div>`).join('')}</div>
      <div class="l-num" style="background:${cor}"><div class="t">ORÇAMENTO</div><div class="n">Nº ${fmtNum(o)}</div>
        <div class="d">Emissão ${fmtData(o.data)} · Válido até ${validoAte}</div></div>
    </div>
    <div class="l-cli" style="border-color:${cor}"><div class="k">Preparado para</div><b>${esc(c.nome) || '—'}</b>
      <div>${esc([c.doc, c.telefone, c.email].filter(Boolean).join(' · '))}</div>${c.endereco ? `<div>${esc(c.endereco)}</div>` : ''}</div>
    ${secao('Peças', pecas, t.pecas)}${secao('Serviços', serv, t.servicos)}
    <div class="l-fim">
      <div class="l-cond"><div class="k">Condições</div>
        ${condicoes(o, l).map(([k, v]) => `<div><b>${k}:</b> ${esc(v)}</div>`).join('')}
        ${o.obs ? `<div style="margin-top:6px"><b>Observações:</b> ${quebra(o.obs)}</div>` : ''}</div>
      <div class="l-tot">
        <div class="l"><span>Total em peças</span><span>${brl(t.pecas.liq)}</span></div>
        <div class="l"><span>Total em serviços</span><span>${brl(t.servicos.liq)}</span></div>
        ${t.linhasDesc.map(([k, v]) => `<div class="l"><span>${k}</span><span>− ${brl(v)}</span></div>`).join('')}
        <div class="g" style="border-color:${cor}"><span>TOTAL GERAL</span><span style="color:${cor}">${brl(t.total)}</span></div>
        ${t.economia > .004 ? `<div class="eco">Desconto total concedido: ${brl(t.economia)}</div>` : ''}
      </div>
    </div>
    <div class="ass"><div>${esc(l.nome)}</div><div>${esc(c.nome) || 'Cliente'} — de acordo</div></div>
    ${l.rodape ? `<div class="rod">${quebra(l.rodape)}</div>` : ''}
  </div>`;
}

/* ---------- Modelo 5: Minimalista ---------- */
function modeloMinimalista(o, d){
  const {l, c, t, cor, pecas, serv, validoAte, infoLoja} = d;
  const secao = (titulo, lista, s) => !lista.length ? '' : `
    <div class="n-sec"><h3>${titulo}</h3>
      <table>${cabItens()}${linhasItens(lista)}
        <tr class="n-sub"><td colspan="6" class="r">Total em ${titulo.toLowerCase()}</td><td class="r">${brl(s.liq)}</td></tr></table></div>`;
  return `<div class="n-pad">
    <div class="n-topo">
      <div class="n-marca">${l.logo ? `<img src="${l.logo}">` : `<i style="background:${cor}"></i>`}${esc(l.nome)}</div>
      <div class="n-loja">${infoLoja.map(esc).join('<br>')}</div>
    </div>
    <h1>Orçamento</h1>
    <div class="n-meta">
      <div><div class="k">Número</div><b>${fmtNum(o)}</b></div>
      <div><div class="k">Data</div>${fmtData(o.data)}</div>
      <div><div class="k">Válido até</div>${validoAte}</div>
      <div><div class="k">Cliente</div><b>${esc(c.nome) || '—'}</b>${[c.telefone, c.email].filter(Boolean).length ? `<br><small>${esc([c.telefone, c.email].filter(Boolean).join(' · '))}</small>` : ''}</div>
    </div>
    ${secao('Peças', pecas, t.pecas)}${secao('Serviços', serv, t.servicos)}
    <div class="n-fim">
      <div class="n-res">
        <div><span>Total em peças</span><span>${brl(t.pecas.liq)}</span></div>
        <div><span>Total em serviços</span><span>${brl(t.servicos.liq)}</span></div>
        ${t.linhasDesc.map(([k, v]) => `<div><span>${k}</span><span>− ${brl(v)}</span></div>`).join('')}
      </div>
      <div class="n-total"><div class="k">Total geral</div><div class="v">${brl(t.total)}</div>
        ${t.economia > .004 ? `<div class="eco">Desconto concedido: ${brl(t.economia)}</div>` : ''}</div>
    </div>
    <div class="n-cond">${condicoes(o, l).map(([k, v]) => `<div><div class="k">${k}</div>${esc(v)}</div>`).join('')}
      ${o.obs ? `<div style="grid-column:1/-1"><div class="k">Observações</div>${quebra(o.obs)}</div>` : ''}</div>
    <div class="ass"><div>${esc(l.nome)}</div><div>${esc(c.nome) || 'Cliente'} — de acordo</div></div>
    ${l.rodape ? `<div class="rod">${quebra(l.rodape)}</div>` : ''}
  </div>`;
}

/* ---------- Modelo 6: Compacto ---------- */
function modeloCompacto(o, d){
  const {l, c, t, cor, pecas, serv, validoAte, infoLoja} = d;
  const grupo = (titulo, lista, s) => !lista.length ? '' : `
    <tr class="k-grp"><td colspan="7" style="color:${cor}">${titulo.toUpperCase()} · ${qtdItens(lista)}</td></tr>
    ${linhasItens(lista)}
    <tr class="k-sub"><td colspan="6" class="r">Total em ${titulo.toLowerCase()}</td><td class="r">${brl(s.liq)}</td></tr>`;
  return `<div class="k-pad">
    <div class="k-cab">
      <div class="k-emp">${l.logo ? `<img src="${l.logo}">` : ''}<div><h2>${esc(l.nome)}</h2>${infoLoja.map(esc).join('<br>')}</div></div>
      <div><div class="k-tit" style="background:${cor}"><span>ORÇAMENTO</span><span>Nº ${fmtNum(o)}</span></div>
        <div class="k-lin"><span>Emissão</span><b>${fmtData(o.data)}</b></div>
        <div class="k-lin"><span>Válido até</span><b>${validoAte}</b></div>
        <div class="k-lin"><span>Itens</span><b>${o.itens.length}</b></div></div>
    </div>
    <div class="k-cli"><span>Cliente: <b>${esc(c.nome) || '—'}</b></span>${c.doc ? `<span>CPF/CNPJ: ${esc(c.doc)}</span>` : ''}
      ${c.telefone ? `<span>Tel.: ${esc(c.telefone)}</span>` : ''}${c.email ? `<span>${esc(c.email)}</span>` : ''}${c.endereco ? `<span>${esc(c.endereco)}</span>` : ''}</div>
    <table class="k-it">${cabItens()}${grupo('Peças', pecas, t.pecas)}${grupo('Serviços', serv, t.servicos)}</table>
    <table class="k-res"><tr>
      <td><div class="k">Peças</div><b>${brl(t.pecas.liq)}</b>${t.pecas.extra > .004 ? `<div class="k">Desconto em peças − ${brl(t.pecas.extra)}</div>` : ''}</td>
      <td><div class="k">Serviços</div><b>${brl(t.servicos.liq)}</b>${t.servicos.extra > .004 ? `<div class="k">Desconto em serviços − ${brl(t.servicos.extra)}</div>` : ''}</td>
      <td><div class="k">Descontos</div><b>${t.descTotal > .004 ? '− ' + brl(t.descTotal) : '—'}</b></td>
      <td class="g" style="background:${cor}"><div class="k">Total geral</div><b>${brl(t.total)}</b></td></tr></table>
    <div class="k-cond">${condicoes(o, l).map(([k, v]) => `<span><b>${k}:</b> ${esc(v)}</span>`).join('')}
      ${o.obs ? `<span style="flex-basis:100%"><b>Obs.:</b> ${quebra(o.obs)}</span>` : ''}</div>
    <div class="ass"><div>${esc(l.nome)}</div><div>${esc(c.nome) || 'Cliente'} — de acordo</div></div>
    ${l.rodape ? `<div class="rod">${quebra(l.rodape)}</div>` : ''}
  </div>`;
}

function montarDoc(o, modelo){
  modelo = MODELOS.some(m => m.id === modelo) ? modelo : 'classico';
  const el = document.createElement('div');
  el.className = 'doc doc-' + modelo;
  const fn = {classico:modeloClassico, moderno:modeloModerno, executivo:modeloExecutivo,
    lateral:modeloLateral, minimalista:modeloMinimalista, compacto:modeloCompacto}[modelo];
  const d = dadosDoc(o);
  el.innerHTML = fn(o, d);
  if(modelo === 'lateral') el.style.borderLeftColor = d.cor;
  return el;
}

/* CSS dos documentos também na página (para pré-visualização e PDF) */
(() => { const s = document.createElement('style'); s.id = 'doc-css'; s.textContent = DOC_CSS; document.head.appendChild(s); })();
