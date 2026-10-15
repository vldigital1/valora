'use strict';
/* ============================================================
   Valora — painel de lojas, peças, serviços e orçamentos
   ============================================================ */
const VERSAO = '2026.10.9';
const DB_KEY = 'gerador-orcamento-v1';
const TEMA_KEY = 'gerador-orcamento-tema';
const COR_KEY = 'gerador-orcamento-cor';
const CORES = [['Terracota','#C96442'],['Azul','#2563EB'],['Índigo','#4F46E5'],['Roxo','#7C3AED'],['Rosa','#DB2777'],
  ['Vermelho','#DC2626'],['Laranja','#EA580C'],['Âmbar','#D97706'],['Verde','#16A34A'],['Turquesa','#0D9488'],['Azul-petróleo','#0E7490'],['Grafite','#3F3F46']];
const LIBS = {
  jspdf:       'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  docx:        'https://unpkg.com/docx@8.5.0/build/index.umd.js'
};

/* ================= Utilidades ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = v => (Number(v) || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const n = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? 0 : x; };
const normal = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hoje = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const fmtData = d => d ? d.split('-').reverse().join('/') : '';
const somaDias = (d, dias) => { const x = new Date((d || hoje()) + 'T12:00:00'); x.setDate(x.getDate() + (+dias || 0)); return x.toISOString().slice(0, 10); };
const fmtNum = o => o.numero ? String(o.numero).padStart(4, '0') : '—';
const loja = id => db.lojas.find(l => l.id === id);
const cliente = id => db.clientes.find(c => c.id === id);
const iniciais = s => (s || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
const ehServico = i => i.tipo === 'servico';
const clonar = o => JSON.parse(JSON.stringify(o));
/* Ícones desenhados direto no HTML (sem troca posterior, o clique nunca "se perde") */
const pascal = s => s.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
function ic(nome, cls = ''){
  const no = window.lucide?.icons?.[pascal(nome)];
  if(!no) return `<i data-lucide="${nome}" class="ic ${cls}"></i>`;
  const filhos = no[2].map(([tag, at]) => `<${tag} ${Object.entries(at).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide ic ${cls}" aria-hidden="true">${filhos}</svg>`;
}
const precoFinal = p => n(p.preco) * (1 - n(p.desconto) / 100);
const rotStatus = s => ({pendente:'Pendente', aprovado:'Aprovado', recusado:'Recusado'}[s] || s);
const logoBox = l => `<span class="logo-box">${l?.logo ? `<img src="${l.logo}" alt="">` : esc(iniciais(l?.nome))}</span>`;

const armazem = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } }
};

/* Ícones (Lucide, traço fino) */
let icPendente = 0;
new MutationObserver(() => {
  if(icPendente) return;
  icPendente = requestAnimationFrame(() => { icPendente = 0; if(window.lucide) lucide.createIcons({attrs:{'stroke-width':1.75}}); });
}).observe(document.body, {childList:true, subtree:true});

function toast(msg, tipo){
  const t = $('#toast'); t.textContent = msg; t.className = 'on ' + (tipo || '');
  clearTimeout(t._t); t._t = setTimeout(() => t.className = '', tipo === 'erro' ? 4200 : 2600);
}
function carregarLib(nome){
  if(window[nome]) return Promise.resolve(window[nome]);
  carregarLib.cache ||= {};
  return carregarLib.cache[nome] ||= new Promise((ok, falha) => {
    const s = document.createElement('script'); s.src = LIBS[nome];
    s.onload = () => ok(window[nome]);
    s.onerror = () => { delete carregarLib.cache[nome]; falha(new Error('sem conexão com a internet')); };
    document.head.appendChild(s);
  });
}
function baixarBlob(blob, nome){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function lerImagem(file, max = 600){
  return new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image();
      img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/png')); };
      img.onerror = falha; img.src = r.result; };
    r.onerror = falha; r.readAsDataURL(file);
  });
}

/* ================= Dados ================= */
let db = carregar();
function carregar(){
  let d = null;
  try{ d = JSON.parse(armazem.get(DB_KEY)); }catch(e){}
  d = d || {};
  d.lojas ||= []; d.produtos ||= []; d.clientes ||= []; d.orcamentos ||= []; d.config ||= {};
  return d;
}
function salvarDB(){
  if(!armazem.set(DB_KEY, JSON.stringify(db))) toast('Não foi possível salvar neste navegador (armazenamento cheio ou bloqueado).', 'erro');
}

/* ================= Cálculos ================= */
const brutoLinha = i => n(i.qtd) * n(i.unit);
const totalLinha = i => brutoLinha(i) * (1 - Math.min(100, n(i.desc)) / 100);
const descLinha  = i => brutoLinha(i) - totalLinha(i);
function calcular(o){
  const sec = l => { const s = {qtd:l.length, bruto:0, liq:0}; l.forEach(i => { s.bruto += brutoLinha(i); s.liq += totalLinha(i); }); s.desc = s.bruto - s.liq; return s; };
  const pecas = sec(o.itens.filter(i => !ehServico(i))), servicos = sec(o.itens.filter(ehServico));
  const extra = (base, tipo, valor) => Math.max(0, Math.min(base, tipo === 'R$' ? n(valor) : base * n(valor) / 100));
  pecas.extra = extra(pecas.liq, o.descPecasTipo, o.descPecasValor);
  servicos.extra = extra(servicos.liq, o.descServTipo, o.descServValor);
  const subtotal = pecas.liq + servicos.liq - pecas.extra - servicos.extra;
  const descGeral = extra(subtotal, o.descTipo, o.descValor);   // desconto geral (orçamentos antigos)
  const rotulo = (txt, tipo, valor) => tipo === 'R$' ? txt : `${txt} (${n(valor).toLocaleString('pt-BR', {maximumFractionDigits: 2})}%)`;
  const linhasDesc = [
    [rotulo('Desconto em peças', o.descPecasTipo, o.descPecasValor), pecas.extra],
    [rotulo('Desconto em serviços', o.descServTipo, o.descServValor), servicos.extra],
    [rotulo('Desconto adicional', o.descTipo, o.descValor), descGeral]
  ].filter(x => x[1] > .004);
  const descTotal = pecas.extra + servicos.extra + descGeral;
  return {pecas, servicos, bruto:pecas.bruto + servicos.bruto, subtotal, descGeral, descTotal, linhasDesc,
    total:subtotal - descGeral, economia:pecas.desc + servicos.desc + descTotal};
}

/* ================= Tema / navegação ================= */
/* modo: 'light' | 'dark' | 'auto' */
const escuroSistema = () => !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
function aplicarTema(modo){
  modo = ['light', 'dark', 'auto'].includes(modo) ? modo : 'auto';
  armazem.set(TEMA_KEY, modo);
  document.documentElement.dataset.theme = modo === 'auto' ? (escuroSistema() ? 'dark' : 'light') : modo;
}
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if((armazem.get(TEMA_KEY) || 'auto') === 'auto') aplicarTema('auto'); });
function corClara(hex){
  const h = hex.replace('#', ''), [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.62;
}
function aplicarCor(cor){
  const raiz = document.documentElement.style;
  if(!/^#[0-9a-f]{6}$/i.test(cor || '')){ raiz.removeProperty('--acc'); raiz.removeProperty('--acc-txt'); armazem.set(COR_KEY, ''); cor = '#C96442'; }
  else { raiz.setProperty('--acc', cor); raiz.setProperty('--acc-txt', corClara(cor) ? '#1F1E1D' : '#FFFFFF'); armazem.set(COR_KEY, cor); }
  
}
function abrirAparencia(){
  const modo = armazem.get(TEMA_KEY) || 'auto', cor = (armazem.get(COR_KEY) || '#C96442').toUpperCase();
  abrirModal(`
    <div class="janela-cab"><h2>Aparência</h2><button class="btn btn-ic btn-ghost" onclick="fecharModal()">${ic('x')}</button></div>
    <div class="rot" style="margin-top:0">Modo</div>
    <div class="seg" id="segModo">${[['light', 'sun', 'Claro'], ['dark', 'moon', 'Escuro'], ['auto', 'monitor', 'Automático']].map(([v, i, t]) =>
      `<button data-v="${v}" class="${modo === v ? 'on' : ''}">${ic(i)} ${t}</button>`).join('')}</div>
    <div class="rot">Cor do tema</div>
    <div class="cores">${CORES.map(([nome, c]) => `<button class="cor ${cor === c.toUpperCase() ? 'sel' : ''}" data-c="${c}" style="--c:${c}"><span></span>${nome}</button>`).join('')}</div>
    <label class="cor-livre"><input type="color" id="corLivre" value="${cor}"><span><b>Cor personalizada</b><br><small class="muted">Use a cor da sua marca</small></span></label>
    <div class="amostra"><button class="btn btn-pri btn-sm">${ic('check')} Botão principal</button><span class="tag tag-servico">${ic('wrench')}Serviço</span><span class="pill pill-aprovado">Aprovado</span></div>
    <div class="janela-rod"><button class="btn btn-ghost" id="corPadrao">Restaurar padrão</button><button class="btn btn-pri" onclick="fecharModal()">Pronto</button></div>`);
  const marcarCor = c => $$('.cor').forEach(b => b.classList.toggle('sel', b.dataset.c.toUpperCase() === c.toUpperCase()));
  $$('#segModo button').forEach(b => b.onclick = () => { aplicarTema(b.dataset.v); $$('#segModo button').forEach(x => x.classList.toggle('on', x === b)); });
  $$('.cor').forEach(b => b.onclick = () => { aplicarCor(b.dataset.c); marcarCor(b.dataset.c); $('#corLivre').value = b.dataset.c; });
  $('#corLivre').oninput = e => { aplicarCor(e.target.value); marcarCor(e.target.value); };
  $('#corPadrao').onclick = () => { aplicarCor(''); marcarCor('#C96442'); $('#corLivre').value = '#C96442'; };
}

/* ================= Carregamento estilo IA ================= */
const espera = ms => new Promise(ok => setTimeout(ok, ms));
const BRILHO = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.5c.5 4.9 2.6 7.6 7.4 8.6-4.8 1-6.9 3.7-7.4 8.6-.5-4.9-2.6-7.6-7.4-8.6 4.8-1 6.9-3.7 7.4-8.6z"/><path d="M19.5 15c.2 1.9 1 2.9 2.9 3.3-1.9.4-2.7 1.4-2.9 3.3-.2-1.9-1-2.9-2.9-3.3 1.9-.4 2.7-1.4 2.9-3.3z" opacity=".7"/></svg>`;
async function trabalhando(titulo, etapas, tarefa){
  const el = $('#carregando');
  el.innerHTML = `<div class="ia" role="status" aria-live="polite">
      <div class="ia-cab"><div class="ia-orb">${BRILHO}</div><div><div class="ia-tit">${esc(titulo)}</div><div class="ia-sub" id="iaSub"></div></div></div>
      <ol class="ia-etapas">${etapas.map(t => `<li><span class="ia-st"></span>${esc(t)}</li>`).join('')}</ol>
      <div class="ia-barra"><i id="iaBarra"></i></div></div>`;
  el.classList.add('on');
  let i = 0;
  const marcar = k => {
    $$('.ia-etapas li', el).forEach((li, j) => li.className = j < k ? 'ok' : j === k ? 'at' : '');
    $('#iaBarra').style.width = (k >= etapas.length ? 100 : Math.min(90, (k + 0.6) / etapas.length * 100)) + '%';
    $('#iaSub').textContent = k >= etapas.length ? 'Pronto!' : etapas[k] + '…';
  };
  marcar(0);
  const relogio = setInterval(() => { if(i < etapas.length - 1) marcar(++i); }, 300);
  try{
    const r = await tarefa();
    clearInterval(relogio);
    while(i < etapas.length - 1){ marcar(++i); await espera(110); }
    marcar(etapas.length); await espera(280);
    return r;
  } finally { clearInterval(relogio); el.classList.remove('on'); el.innerHTML = ''; }
}

let view = 'painel', draft = null;
function go(v){
  view = v;
  $$('.nav button[data-view]').forEach(b => b.classList.toggle('ativo', b.dataset.view === v));
  $('.side').classList.remove('aberta');
  ({painel:vPainel, novo:vEditor, orcamentos:vOrcamentos, lojas:vLojas, produtos:vProdutos, clientes:vClientes, backup:vBackup})[v]();
  window.scrollTo(0, 0);
}
const cabecalho = (titulo, sub = '', acoes = '') =>
  `<header class="pg-cab"><div><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="btns">${acoes}</div></header>`;

const ehCelular = () => window.matchMedia('(max-width: 760px)').matches;
function abrirModal(html, tam = ''){
  $('#janela').className = 'janela ' + tam; $('#janela').innerHTML = html;
  $('#modal').classList.toggle('folha', tam.includes('folha'));
  $('#modal').classList.add('aberto');
  const f = $('#janela input:not([type=file]), #janela select, #janela textarea');
  if(f && !tam.includes('xl') && !tam.includes('folha') && !ehCelular()) f.focus();
}
const modalAberto = () => $('#modal').classList.contains('aberto');
function confirmar(titulo, texto = '', botao = 'Excluir', perigo = true){
  return new Promise(ok => {
    abrirModal(`
      <div class="janela-cab"><h2>${esc(titulo)}</h2><button class="btn btn-ic btn-ghost" id="cfNao2">${ic('x')}</button></div>
      ${texto ? `<p class="muted" style="white-space:pre-line">${esc(texto)}</p>` : ''}
      <div class="janela-rod"><button class="btn" id="cfNao">Cancelar</button>
        <button class="btn ${perigo ? 'btn-perigo' : 'btn-pri'}" id="cfSim">${ic(perigo ? 'trash-2' : 'check')} ${esc(botao)}</button></div>`);
    let feito = false;
    const fim = v => { if(feito) return; feito = true; obs.disconnect(); fecharModal(); ok(v); };
    $('#cfSim').onclick = () => fim(true);
    $('#cfNao').onclick = $('#cfNao2').onclick = () => fim(false);
    $('#cfSim').focus();
    const obs = new MutationObserver(() => { if(!modalAberto()) { if(!feito){ feito = true; obs.disconnect(); ok(false); } } });
    obs.observe($('#modal'), {attributes: true, attributeFilter: ['class']});
  });
}
function fecharModal(){ $('#modal').classList.remove('aberto'); $('#janela').innerHTML = ''; if(view === 'novo') $('#lBusca')?.focus(); }
$('#modal').addEventListener('mousedown', e => { if(e.target.id === 'modal') fecharModal(); });

/* ================= Ações dos botões das listas ================= */
const ACOES = {
  'editar-loja': formLoja, 'excluir-loja': excluirLoja,
  'editar-produto': id => formProduto(id), 'excluir-produto': excluirProduto,
  'editar-cliente': id => formCliente(id), 'excluir-cliente': excluirCliente,
  'editar-orc': editarOrcamento, 'baixar-orc': abrirExportar, 'duplicar-orc': duplicar, 'excluir-orc': excluirOrc
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-acao]'); if(!b) return;
  e.preventDefault();
  try{ const r = ACOES[b.dataset.acao]?.(b.dataset.id); if(r?.catch) r.catch(mostrarErro); }
  catch(err){ mostrarErro(err); }
});

/* Qualquer erro aparece na tela (ajuda a descobrir problemas no navegador do usuário) */
function mostrarErro(err){
  console.error(err);
  toast('Ops, algo deu errado: ' + (err?.message || err) + ` (versão ${VERSAO})`, 'erro');
}
window.addEventListener('error', e => mostrarErro(e.error || e.message));
window.addEventListener('unhandledrejection', e => mostrarErro(e.reason));

/* ================= Painel ================= */
function vPainel(){
  const os = db.orcamentos;
  const de = st => os.filter(o => o.status === st);
  const soma = l => l.reduce((s, o) => s + calcular(o).total, 0);
  const h = new Date().getHours();
  const passos = [
    [db.lojas.length, 'Cadastre uma loja', 'com logo e cor', "go('lojas');formLoja()"],
    [db.produtos.length, 'Cadastre peças e serviços', 'com preço e desconto', "go('produtos');formProduto(null,'produto')"],
    [os.length, 'Faça o 1º orçamento', 'e baixe o PDF', 'novoOrcamento()']
  ];
  const stat = (icone, rot, val, sub = '', cls = '') =>
    `<div class="stat ${cls}"><div class="stat-top"><span class="stat-ic">${ic(icone)}</span>${rot}</div><div class="v">${val}</div><div class="s">${sub}</div></div>`;
  $('#app').innerHTML = `
    ${cabecalho(h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite', 'Resumo das suas lojas e orçamentos',
      `<button class="btn btn-pri" onclick="novoOrcamento()">${ic('plus')} Novo orçamento</button>`)}
    ${passos.some(p => !p[0]) ? `<section class="card boas"><h2>${ic('sparkles')} Comece em 3 passos</h2>
      <div class="passos">${passos.map((p, i) => `<button class="passo ${p[0] ? 'feito' : ''}" onclick="${p[3]}">
        <span class="pn">${p[0] ? '✓' : i + 1}</span><span><b>${p[1]}</b><br><small class="muted">${p[2]}</small></span></button>`).join('')}</div></section>` : ''}
    <div class="stats">
      ${stat('file-text', 'Orçamentos', os.length, `${db.lojas.length} loja(s)`)}
      ${stat('clock', 'Pendentes', brl(soma(de('pendente'))), `${de('pendente').length} orçamento(s)`, 'warn')}
      ${stat('circle-check', 'Aprovados', brl(soma(de('aprovado'))), `${de('aprovado').length} orçamento(s)`, 'ok')}
      ${stat('package', 'Catálogo', db.produtos.length, `${db.produtos.filter(p => !ehServico(p)).length} peças · ${db.produtos.filter(ehServico).length} serviços`)}
    </div>
    <div class="grid-2-1">
      <section class="card"><div class="card-cab"><h2>Últimos orçamentos</h2>
        <button class="btn btn-ghost btn-sm" onclick="go('orcamentos')">Ver todos ${ic('chevron-right')}</button></div>
        ${tabelaOrc(os.slice().sort((a, b) => b.criado - a.criado).slice(0, 6), true)}</section>
      <section class="card"><h2>Atalhos</h2>
        <div class="atalhos">
          <button class="atalho" onclick="novoOrcamento()"><span class="ai">${ic('file-plus-2')}</span><span><b>Novo orçamento</b><small>Lançar peças e serviços</small></span></button>
          <button class="atalho" onclick="go('produtos');formProduto(null,'produto')"><span class="ai">${ic('package')}</span><span><b>Cadastrar peça</b><small>Com preço e desconto</small></span></button>
          <button class="atalho" onclick="go('produtos');formProduto(null,'servico')"><span class="ai">${ic('wrench')}</span><span><b>Cadastrar serviço</b><small>Mão de obra, instalação…</small></span></button>
          <button class="atalho" onclick="go('lojas');formLoja()"><span class="ai">${ic('store')}</span><span><b>Nova loja</b><small>Com logo própria</small></span></button>
        </div>
        <p class="muted" style="margin-top:14px;font-size:13px">No orçamento: <kbd>Shift</kbd> lança peça · <kbd>Ctrl</kbd> lança serviço</p>
      </section>
    </div>`;
}

/* ================= Lojas ================= */
function vLojas(){
  $('#app').innerHTML = cabecalho('Lojas', 'Cada loja tem sua logo, cor e numeração de orçamentos',
      `<button class="btn btn-pri" onclick="formLoja()">${ic('plus')} Nova loja</button>`) +
    (db.lojas.length ? `<div class="lojas">${db.lojas.map(l => `
      <div class="loja"><div class="loja-cor" style="background:${esc(l.cor)}"></div>
        <div class="loja-corpo">${logoBox(l)}
          <div class="loja-info"><b>${esc(l.nome)}</b><div>${esc(l.doc)}</div><div>${esc(l.telefone)}</div></div></div>
        <div class="loja-rod"><span>Próx. nº ${String(l.proximo || 1).padStart(4, '0')} · ${esc(MODELOS.find(m => m.id === l.modelo)?.nome || 'Clássico')}</span>
          <span class="btns"><button class="btn btn-sm" data-acao="editar-loja" data-id="${l.id}">${ic('pencil')} Editar</button>
          <button class="btn btn-ic btn-sm perigo" title="Excluir" data-acao="excluir-loja" data-id="${l.id}">${ic('trash-2')}</button></span></div>
      </div>`).join('')}</div>`
    : `<section class="card vazio">${ic('store')}<p>Nenhuma loja cadastrada ainda.</p><br><button class="btn btn-pri" onclick="formLoja()">${ic('plus')} Cadastrar loja</button></section>`);
}
let logoTemp = '';
function formLoja(id){
  const l = id ? loja(id) : {cor:'#C96442', validade:15, proximo:1, modelo:'classico'};
  logoTemp = l.logo || '';
  abrirModal(`
    <div class="janela-cab"><h2>${id ? 'Editar loja' : 'Nova loja'}</h2><button class="btn btn-ic btn-ghost" onclick="fecharModal()">${ic('x')}</button></div>
    <form id="fLoja" class="campos">
      <div class="full up"><span class="logo-box" id="logoPrev">${logoTemp ? `<img src="${logoTemp}">` : ic('image')}</span>
        <div><b>Logo da loja</b><p class="muted" style="font-size:12.5px;margin:2px 0 8px">PNG ou JPG. Aparece no topo do orçamento.</p>
          <div class="btns"><label class="btn btn-sm" style="margin:0">${ic('upload')} Escolher imagem<input type="file" accept="image/*" id="logoFile" hidden></label>
          <button type="button" class="btn btn-sm btn-ghost" onclick="logoTemp='';$('#logoPrev').innerHTML='${ic('image')}'">Remover</button></div></div></div>
      <div class="full"><label>Nome da loja *</label><input name="nome" required value="${esc(l.nome)}"></div>
      <div><label>CNPJ / CPF</label><input name="doc" value="${esc(l.doc)}"></div>
      <div><label>Telefone / WhatsApp</label><input name="telefone" value="${esc(l.telefone)}"></div>
      <div><label>E-mail</label><input name="email" value="${esc(l.email)}"></div>
      <div><label>Chave Pix</label><input name="pix" value="${esc(l.pix)}"></div>
      <div class="full"><label>Endereço</label><input name="endereco" value="${esc(l.endereco)}"></div>
      <div><label>Cor da marca</label><input type="color" name="cor" value="${esc(l.cor || '#C96442')}"></div>
      <div><label>Modelo de impressão padrão</label><select name="modelo">${MODELOS.map(m => `<option value="${m.id}" ${l.modelo === m.id ? 'selected' : ''}>${m.nome}</option>`).join('')}</select></div>
      <div><label>Validade padrão (dias)</label><input type="number" name="validade" min="0" value="${esc(l.validade ?? 15)}"></div>
      <div><label>Próximo nº de orçamento</label><input type="number" name="proximo" min="1" value="${esc(l.proximo || 1)}"></div>
      <div class="full"><label>Forma de pagamento padrão</label><input name="pagamento" value="${esc(l.pagamento)}" placeholder="Pix, cartão em até 10x, 50% de entrada…"></div>
      <div class="full"><label>Texto do rodapé</label><textarea name="rodape" placeholder="Ex.: Garantia de 90 dias para peças e serviços.">${esc(l.rodape)}</textarea></div>
      <div class="full janela-rod"><button type="button" class="btn" onclick="fecharModal()">Cancelar</button><button class="btn btn-pri">${ic('check')} Salvar loja</button></div>
    </form>`, 'lg');
  $('#logoFile').onchange = async e => {
    const f = e.target.files[0]; if(!f) return;
    try{ logoTemp = await lerImagem(f); $('#logoPrev').innerHTML = `<img src="${logoTemp}">`; }
    catch(err){ toast('Não foi possível ler essa imagem', 'erro'); }
  };
  $('#fLoja').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.validade = +d.validade || 0; d.proximo = Math.max(1, +d.proximo || 1); d.logo = logoTemp;
    if(id) Object.assign(l, d); else { d.id = uid(); db.lojas.push(d); db.config.lojaAtual ||= d.id; }
    salvarDB(); fecharModal(); toast('Loja salva'); if(view === 'lojas') vLojas(); else if(view === 'painel') vPainel();
  };
}
async function excluirLoja(id){
  const usados = db.orcamentos.filter(o => o.lojaId === id).length;
  if(!await confirmar(`Excluir a loja "${loja(id).nome}"?`, 'As peças e serviços exclusivos dela também serão excluídos.' + (usados ? `\n${usados} orçamento(s) dela continuarão salvos.` : ''))) return;
  db.lojas = db.lojas.filter(l => l.id !== id);
  db.produtos = db.produtos.filter(p => p.lojaId !== id);
  if(db.config.lojaAtual === id) db.config.lojaAtual = db.lojas[0]?.id || null;
  salvarDB(); vLojas();
}

/* ================= Peças e serviços ================= */
let filtroP = {loja:'', tipo:'', q:''};
function vProdutos(){
  $('#app').innerHTML = cabecalho('Peças e serviços', 'Catálogo com preços e descontos padrão',
      `<button class="btn" onclick="formProduto(null,'servico')">${ic('wrench')} Novo serviço</button>
       <button class="btn btn-pri" onclick="formProduto(null,'produto')">${ic('package')} Nova peça</button>`) + `
    <div class="filtros">
      <div class="seg" id="segTipo">${[['', 'Todos'], ['produto', 'Peças'], ['servico', 'Serviços']].map(([v, t]) =>
        `<button data-v="${v}" class="${filtroP.tipo === v ? 'on' : ''}">${t}</button>`).join('')}</div>
      <select onchange="filtroP.loja=this.value;listaProdutos()"><option value="">Todas as lojas</option>
        ${db.lojas.map(l => `<option value="${l.id}" ${filtroP.loja === l.id ? 'selected' : ''}>${esc(l.nome)}</option>`).join('')}</select>
      <div class="busca">${ic('search')}<input placeholder="Buscar por código ou nome…" value="${esc(filtroP.q)}" oninput="filtroP.q=this.value;listaProdutos()"></div>
    </div>
    <section class="card" id="listaP"></section>`;
  $$('#segTipo button').forEach(b => b.onclick = () => { filtroP.tipo = b.dataset.v; $$('#segTipo button').forEach(x => x.classList.toggle('on', x === b)); listaProdutos(); });
  listaProdutos();
}
function listaProdutos(){
  const q = normal(filtroP.q);
  const lista = db.produtos.filter(p =>
    (!filtroP.loja || !p.lojaId || p.lojaId === filtroP.loja) && (!filtroP.tipo || p.tipo === filtroP.tipo) &&
    (!q || normal(p.codigo + ' ' + p.nome).includes(q))).sort((a, b) => a.codigo.localeCompare(b.codigo));
  $('#listaP').innerHTML = lista.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Nome</th><th class="cel-oculto">Tipo</th><th class="cel-oculto">Loja</th><th class="cel-oculto">Unid.</th>
      <th class="r cel-oculto">Preço</th><th class="r cel-oculto">Desconto</th><th class="r">Preço final</th><th></th></tr></thead><tbody>
    ${lista.map(p => `<tr><td class="mono b">${esc(p.codigo)}</td><td>${esc(p.nome)}</td>
      <td class="cel-oculto"><span class="tag tag-${p.tipo}">${ic(ehServico(p) ? 'wrench' : 'package')}${ehServico(p) ? 'Serviço' : 'Peça'}</span></td>
      <td class="cel-oculto">${p.lojaId ? esc(loja(p.lojaId)?.nome) : '<span class="muted">Todas</span>'}</td><td class="muted cel-oculto">${esc(p.unidade)}</td>
      <td class="r mono cel-oculto">${brl(p.preco)}</td><td class="r mono cel-oculto">${n(p.desconto) ? pct(p.desconto) : '<span class="muted">—</span>'}</td>
      <td class="r mono b">${brl(precoFinal(p))}</td>
      <td class="r nowrap"><button class="btn btn-ic btn-sm" title="Editar" data-acao="editar-produto" data-id="${p.id}">${ic('pencil')}</button>
        <button class="btn btn-ic btn-sm perigo" title="Excluir" data-acao="excluir-produto" data-id="${p.id}">${ic('trash-2')}</button></td></tr>`).join('')}
    </tbody></table></div>`
    : `<div class="vazio">${ic('package-search')}<p>Nenhum item encontrado.</p></div>`;
}
function proximoCodigo(tipo){
  const pre = tipo === 'servico' ? 'S' : 'P';
  const nums = db.produtos.filter(p => p.codigo?.toUpperCase().startsWith(pre)).map(p => parseInt(p.codigo.slice(1)) || 0);
  return pre + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
}
function formProduto(id, tipo, lojaPadrao, extra = {}){
  const p = id ? db.produtos.find(x => x.id === id)
    : {tipo, lojaId: lojaPadrao ?? filtroP.loja, codigo: proximoCodigo(tipo), nome: extra.nome || '', unidade: tipo === 'servico' ? 'sv' : 'un', desconto: 0};
  const serv = p.tipo === 'servico';
  abrirModal(`
    <div class="janela-cab"><h2>${id ? 'Editar' : serv ? 'Novo' : 'Nova'} ${serv ? 'serviço' : 'peça'}</h2><button class="btn btn-ic btn-ghost" onclick="fecharModal()">${ic('x')}</button></div>
    <form id="fProd" class="campos">
      <div><label>Tipo</label><select name="tipo"><option value="produto" ${!serv ? 'selected' : ''}>Peça</option><option value="servico" ${serv ? 'selected' : ''}>Serviço</option></select></div>
      <div><label>Loja</label><select name="lojaId"><option value="">Todas as lojas</option>
        ${db.lojas.map(l => `<option value="${l.id}" ${p.lojaId === l.id ? 'selected' : ''}>${esc(l.nome)}</option>`).join('')}</select></div>
      <div><label>Código *</label><input name="codigo" required value="${esc(p.codigo)}"></div>
      <div class="full"><label>Nome / descrição *</label><input name="nome" required value="${esc(p.nome)}" placeholder="${serv ? 'Ex.: Mão de obra, instalação…' : 'Ex.: Filtro de óleo, cabo HDMI…'}"></div>
      <div><label>Unidade</label><input name="unidade" value="${esc(p.unidade)}" placeholder="un, m, h, kg…"></div>
      <div><label>Preço (R$) *</label><input name="preco" type="number" step="0.01" min="0" required value="${esc(p.preco)}"></div>
      <div><label>Desconto padrão (%)</label><input name="desconto" type="number" step="0.01" min="0" max="100" value="${esc(p.desconto || 0)}"></div>
      <div><label>Preço final</label><input id="pFinal" disabled></div>
      <div class="full janela-rod">
        <button type="button" class="btn" onclick="fecharModal()">Cancelar</button>
        ${!id && !extra.aoSalvar ? `<button type="button" class="btn" id="salvarMais">${ic('copy-plus')} Salvar e cadastrar outro</button>` : ''}
        <button class="btn btn-pri">${ic('check')} ${extra.aoSalvar ? 'Salvar e lançar no orçamento' : 'Salvar'}</button></div>
    </form>`);
  const f = $('#fProd');
  const atual = () => $('#pFinal').value = brl(n(f.preco.value) * (1 - n(f.desconto.value) / 100));
  f.preco.oninput = f.desconto.oninput = atual; atual();
  (f.nome.value ? f.preco : f.nome).focus();
  const gravar = outro => {
    if(!f.reportValidity()) return;
    const d = Object.fromEntries(new FormData(f));
    d.preco = n(d.preco); d.desconto = Math.min(100, n(d.desconto)); d.codigo = d.codigo.trim();
    if(db.produtos.some(x => x.id !== id && x.codigo.toLowerCase() === d.codigo.toLowerCase() && (!x.lojaId || !d.lojaId || x.lojaId === d.lojaId)))
      return toast('Já existe um item com esse código', 'erro');
    let salvo = p;
    if(id) Object.assign(p, d); else { salvo = {...d, id: uid()}; db.produtos.push(salvo); }
    salvarDB(); toast(d.tipo === 'servico' ? 'Serviço salvo' : 'Peça salva');
    if(view === 'produtos') listaProdutos();
    if(outro) formProduto(null, d.tipo, d.lojaId); else { fecharModal(); extra.aoSalvar?.(salvo); }
  };
  f.onsubmit = e => { e.preventDefault(); gravar(false); };
  if($('#salvarMais')) $('#salvarMais').onclick = () => gravar(true);
}
async function excluirProduto(id){
  const p = db.produtos.find(x => x.id === id); if(!p) return;
  if(!await confirmar(`Excluir ${ehServico(p) ? 'o serviço' : 'a peça'} "${p.nome}"?`, 'Ele sai do catálogo. Orçamentos já feitos não mudam.')) return;
  db.produtos = db.produtos.filter(x => x.id !== id); salvarDB(); if($('#listaP')) listaProdutos(); toast(ehServico(p) ? 'Serviço excluído' : 'Peça excluída');
}

/* ================= Clientes ================= */
let filtroC = '';
function vClientes(){
  $('#app').innerHTML = cabecalho('Clientes', '', `<button class="btn btn-pri" onclick="formCliente()">${ic('user-plus')} Novo cliente</button>`) + `
    <div class="filtros"><div class="busca">${ic('search')}<input placeholder="Buscar cliente…" value="${esc(filtroC)}" oninput="filtroC=this.value;listaClientes()"></div></div>
    <section class="card" id="listaC"></section>`;
  listaClientes();
}
function listaClientes(){
  const q = normal(filtroC);
  const l = db.clientes.filter(c => !q || normal(c.nome + ' ' + c.doc + ' ' + c.telefone).includes(q)).sort((a, b) => a.nome.localeCompare(b.nome));
  $('#listaC').innerHTML = l.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>E-mail</th><th class="r">Orçamentos</th><th></th></tr></thead><tbody>
    ${l.map(c => `<tr><td class="b">${esc(c.nome)}</td><td>${esc(c.doc)}</td><td>${esc(c.telefone)}</td><td>${esc(c.email)}</td>
      <td class="r">${db.orcamentos.filter(o => o.clienteId === c.id).length}</td>
      <td class="r nowrap"><button class="btn btn-ic btn-sm" title="Editar" data-acao="editar-cliente" data-id="${c.id}">${ic('pencil')}</button>
      <button class="btn btn-ic btn-sm perigo" title="Excluir" data-acao="excluir-cliente" data-id="${c.id}">${ic('trash-2')}</button></td></tr>`).join('')}
    </tbody></table></div>` : `<div class="vazio">${ic('users')}<p>Nenhum cliente.</p></div>`;
}
function formCliente(id, aoSalvar){
  const c = id ? cliente(id) : {};
  abrirModal(`
    <div class="janela-cab"><h2>${id ? 'Editar' : 'Novo'} cliente</h2><button class="btn btn-ic btn-ghost" onclick="fecharModal()">${ic('x')}</button></div>
    <form id="fCli" class="campos">
      <div class="full"><label>Nome *</label><input name="nome" required value="${esc(c.nome)}"></div>
      <div><label>CPF / CNPJ</label><input name="doc" value="${esc(c.doc)}"></div>
      <div><label>Telefone / WhatsApp</label><input name="telefone" value="${esc(c.telefone)}"></div>
      <div class="full"><label>E-mail</label><input name="email" type="email" value="${esc(c.email)}"></div>
      <div class="full"><label>Endereço</label><input name="endereco" value="${esc(c.endereco)}"></div>
      <div class="full janela-rod"><button type="button" class="btn" onclick="fecharModal()">Cancelar</button><button class="btn btn-pri">${ic('check')} Salvar</button></div>
    </form>`);
  $('#fCli').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    let novoId = id;
    if(id) Object.assign(c, d); else { novoId = uid(); db.clientes.push({...d, id: novoId}); }
    salvarDB(); fecharModal(); toast('Cliente salvo');
    if(aoSalvar) aoSalvar(novoId); else listaClientes();
  };
}
async function excluirCliente(id){
  if(!await confirmar(`Excluir o cliente "${cliente(id)?.nome || ''}"?`, 'Orçamentos já feitos continuam com o nome dele.')) return;
  db.clientes = db.clientes.filter(c => c.id !== id); salvarDB(); if($('#listaC')) listaClientes(); toast('Cliente excluído');
}

/* ================= Lista de orçamentos ================= */
let filtroO = {loja:'', status:'', q:''};
const nomeCliente = o => o.clienteId ? (cliente(o.clienteId)?.nome || o.clienteNome || '—') : (o.clienteNome || 'Sem cliente');
function tabelaOrc(lista, curta){
  if(!lista.length) return `<div class="vazio">${ic('file-text')}<p>Nenhum orçamento ainda.</p></div>`;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th class="cel-oculto">Data</th>${curta ? '' : '<th class="cel-oculto">Loja</th>'}<th>Cliente</th>
    ${curta ? '' : '<th class="r cel-oculto">Peças</th><th class="r cel-oculto">Serviços</th>'}<th class="r">Total</th><th>Status</th><th></th></tr></thead><tbody>
    ${lista.map(o => { const t = calcular(o); return `<tr>
      <td class="mono b">${fmtNum(o)}</td><td class="muted cel-oculto">${fmtData(o.data)}</td>
      ${curta ? '' : `<td class="cel-oculto">${esc(loja(o.lojaId)?.nome || '—')}</td>`}<td>${esc(nomeCliente(o))}</td>
      ${curta ? '' : `<td class="r mono muted cel-oculto">${brl(t.pecas.liq)}</td><td class="r mono muted cel-oculto">${brl(t.servicos.liq)}</td>`}
      <td class="r mono b">${brl(t.total)}</td>
      <td><select class="status-sel" onchange="mudarStatus('${o.id}',this.value)">
        ${['pendente', 'aprovado', 'recusado'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${rotStatus(s)}</option>`).join('')}</select></td>
      <td class="r nowrap">
        <button class="btn btn-ic btn-sm" title="Abrir / editar" data-acao="editar-orc" data-id="${o.id}">${ic('pencil')}</button>
        <button class="btn btn-ic btn-sm" title="Imprimir / baixar" data-acao="baixar-orc" data-id="${o.id}">${ic('download')}</button>
        ${false ? '' : `<button class="btn btn-ic btn-sm" title="Duplicar" data-acao="duplicar-orc" data-id="${o.id}">${ic('copy')}</button>
        <button class="btn btn-ic btn-sm perigo" title="Excluir" data-acao="excluir-orc" data-id="${o.id}">${ic('trash-2')}</button>`}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}
function vOrcamentos(){
  $('#app').innerHTML = cabecalho('Orçamentos', '', `<button class="btn btn-pri" onclick="novoOrcamento()">${ic('plus')} Novo orçamento</button>`) + `
    <div class="filtros">
      <select onchange="filtroO.loja=this.value;listaOrc()"><option value="">Todas as lojas</option>
        ${db.lojas.map(l => `<option value="${l.id}" ${filtroO.loja === l.id ? 'selected' : ''}>${esc(l.nome)}</option>`).join('')}</select>
      <select onchange="filtroO.status=this.value;listaOrc()"><option value="">Todos os status</option>
        ${['pendente', 'aprovado', 'recusado'].map(s => `<option value="${s}" ${filtroO.status === s ? 'selected' : ''}>${rotStatus(s)}</option>`).join('')}</select>
      <div class="busca">${ic('search')}<input placeholder="Buscar por nº ou cliente…" value="${esc(filtroO.q)}" oninput="filtroO.q=this.value;listaOrc()"></div>
    </div>
    <section class="card" id="listaO"></section>`;
  listaOrc();
}
function listaOrc(){
  const q = normal(filtroO.q);
  $('#listaO').innerHTML = tabelaOrc(db.orcamentos.filter(o => (!filtroO.loja || o.lojaId === filtroO.loja) && (!filtroO.status || o.status === filtroO.status) &&
    (!q || normal(fmtNum(o) + ' ' + nomeCliente(o)).includes(q))).sort((a, b) => b.criado - a.criado));
}
function mudarStatus(id, s){ db.orcamentos.find(o => o.id === id).status = s; if(draft?.id === id) draft.status = s; salvarDB(); toast('Status: ' + rotStatus(s)); }
async function excluirOrc(id){
  const o = db.orcamentos.find(x => x.id === id); if(!o) return toast('Orçamento não encontrado', 'erro');
  clearTimeout(autoTimer);
  if(!await confirmar(`Excluir o orçamento nº ${fmtNum(o)}?`, 'Essa ação não pode ser desfeita.')) return;
  db.orcamentos = db.orcamentos.filter(o => o.id !== id); salvarDB(); toast('Orçamento excluído');
  if(draft?.id === id){ draft = null; go('orcamentos'); } else if($('#listaO')) listaOrc(); else go(view);
}
function duplicar(id){
  const orig = db.orcamentos.find(x => x.id === id); if(!orig) return toast('Orçamento não encontrado', 'erro');
  const o = clonar(orig);
  Object.assign(o, {id: null, numero: null, data: hoje(), status: 'pendente', criado: null, copiaDe: fmtNum(orig)});
  draft = o; go('novo'); toast(`Cópia do nº ${fmtNum(orig)} criada — altere o que quiser e salve`);
}

/* ================= Editor de orçamento ================= */
function novoOrcamento(){
  if(!db.lojas.length){ toast('Cadastre uma loja primeiro', 'erro'); go('lojas'); formLoja(); return; }
  const l = loja(db.config.lojaAtual) || db.lojas[0];
  draft = {id: null, numero: null, lojaId: l.id, clienteId: '', clienteNome: '', data: hoje(), validade: l.validade ?? 15,
    itens: [], descTipo: '%', descValor: 0, pagamento: l.pagamento || '', prazo: '', obs: '', status: 'pendente', modelo: l.modelo || 'classico'};
  go('novo');
}
function editarOrcamento(id){
  const o = db.orcamentos.find(x => x.id === id); if(!o) return toast('Orçamento não encontrado', 'erro');
  draft = clonar(o); delete draft.copiaDe; go('novo');
}

/* Salvamento automático ao editar um orçamento já salvo */
let autoTimer = 0;
function alterado(){
  if(!draft?.id || draft.copiaDe) return;
  const ind = $('#autoSalvo'); if(ind) ind.innerHTML = `${ic('loader')} Salvando…`;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => {
    if(view !== 'novo' || !draft?.id) return;
    if(salvarOrc(true, true) && $('#autoSalvo'))
      $('#autoSalvo').innerHTML = `${ic('check')} Salvo automaticamente às ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
  }, 600);
}

function vEditor(){
  if(!draft) return novoOrcamento();
  const l = loja(draft.lojaId);
  $('#app').innerHTML = `
    ${cabecalho(draft.copiaDe ? `Cópia do orçamento nº ${draft.copiaDe}` : draft.id ? `Orçamento nº ${fmtNum(draft)}` : 'Novo orçamento', '', `<span class="pill pill-${draft.status}">${rotStatus(draft.status)}</span>`)}
    ${draft.copiaDe ? `<div class="aviso">${ic('copy')}<div><b>Você está editando uma cópia.</b> Altere peças, valores, nomes e cliente à vontade. Ao salvar, ela vira um <b>novo orçamento</b> e o original não muda.</div></div>`
      : draft.id ? `<div class="aviso aviso-ok">${ic('pencil')}<div><b>Editando o orçamento nº ${fmtNum(draft)}.</b> As alterações são salvas automaticamente. <span id="autoSalvo" class="muted"></span></div></div>` : ''}
    <section class="card"><div class="campos">
      <div><label>Loja</label><div class="sel-logo">${logoBox(l)}
        <select id="eLoja">${db.lojas.map(x => `<option value="${x.id}" ${x.id === draft.lojaId ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></div></div>
      <div><label>Cliente</label><div class="linha-in">
        <select id="eCli"><option value="">— Selecione —</option>
          ${db.clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(c => `<option value="${c.id}" ${c.id === draft.clienteId ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
        <button class="btn btn-ic" title="Novo cliente" onclick="formCliente(null, id => { draft.clienteId = id; vEditor(); })">${ic('user-plus')}</button></div></div>
      <div><label>Nº do orçamento</label><input type="number" min="1" step="1" id="eNum" value="${draft.numero || ''}" placeholder="Automático (${String(l?.proximo || 1).padStart(4, '0')})"></div>
      <div><label>Data do orçamento</label><input type="date" id="eData" value="${draft.data}"></div>
      <div><label>Validade (dias)</label><input type="number" min="0" id="eVal" value="${draft.validade}"></div>
    </div></section>

    <div class="rapido">
      <button class="rapido-btn" onclick="abrirCatalogo('produto')"><span class="rapido-ic">${ic('package')}</span><span><b>Adicionar peça</b><small>Toque para escolher do catálogo</small></span>${ic('plus', 'rapido-mais')}</button>
      <button class="rapido-btn" onclick="abrirCatalogo('servico')"><span class="rapido-ic">${ic('wrench')}</span><span><b>Adicionar serviço</b><small>Toque para escolher do catálogo</small></span>${ic('plus', 'rapido-mais')}</button>
    </div>
    <section class="composer">
      <div class="composer-in">${ic('search')}
        <input id="lBusca" placeholder="Digite o código ou nome da peça ou serviço…" autocomplete="off" spellcheck="false">
        <input id="lQtd" type="number" min="0" step="any" value="1" title="Quantidade">
      </div>
      <div class="composer-rod">
        <div class="dicas"><span><kbd>Shift</kbd> lança peça</span><span><kbd>Ctrl</kbd> lança serviço</span><span><kbd>↑</kbd><kbd>↓</kbd> escolher</span><span><b>3*P001</b> = 3 unidades</span></div>
        <div class="btns">
          <button class="btn btn-sm btn-pri" onmousedown="event.preventDefault()" onclick="lancar('produto')" title="Atalho: Shift">${ic('package')} Lançar peça</button>
          <button class="btn btn-sm btn-pri" onmousedown="event.preventDefault()" onclick="lancar('servico')" title="Atalho: Ctrl">${ic('wrench')} Lançar serviço</button>
          <span class="composer-sep"></span>
          <button class="btn btn-sm" onmousedown="event.preventDefault()" onclick="cadastrarNoOrc('produto')" title="Cadastra no catálogo e já lança no orçamento">${ic('package-plus')} Nova peça</button>
          <button class="btn btn-sm" onmousedown="event.preventDefault()" onclick="cadastrarNoOrc('servico')" title="Cadastra no catálogo e já lança no orçamento">${ic('plus')} Novo serviço</button></div>
      </div>
      <div class="sug" id="sug" hidden></div>
    </section>

    <section class="card card-itens" id="secPecas"></section>
    <section class="card card-itens" id="secServ"></section>

    <div class="grid-fim">
      <section class="card"><h2 style="margin-bottom:14px">${ic('clipboard-list')} Condições</h2><div class="campos">
        <div class="full"><label>Forma de pagamento</label><input id="ePag" value="${esc(draft.pagamento)}" placeholder="Pix, cartão em até 10x, 50% de entrada…"></div>
        <div class="full"><label>Prazo de entrega / execução</label><input id="ePrazo" value="${esc(draft.prazo)}" placeholder="Ex.: 5 dias úteis"></div>
        <div class="full"><label>Observações</label><textarea id="eObs" placeholder="Aparece no orçamento impresso">${esc(draft.obs)}</textarea></div>
      </div></section>
      <section class="card resumo" id="resumo"></section>
    </div>

    <div class="barra">
      <div class="barra-tot" id="barraTot"></div>
      <div class="btns">
        ${draft.id && !draft.copiaDe ? `<button class="btn btn-ic btn-ghost" title="Duplicar este orçamento" data-acao="duplicar-orc" data-id="${draft.id}">${ic('copy')}</button>
        <button class="btn btn-ic btn-ghost perigo" title="Excluir este orçamento" data-acao="excluir-orc" data-id="${draft.id}">${ic('trash-2')}</button>` : ''}
        <button class="btn btn-ghost so-pc" onclick="novoOrcamento()">${ic('file-plus-2')} Novo</button>
        <button class="btn so-pc" onclick="salvarOrc()">${ic('save')} Salvar</button>
        <button class="btn so-cel" onclick="abrirCatalogo('produto')">${ic('plus')} Peça</button>
        <button class="btn so-cel" onclick="abrirCatalogo('servico')">${ic('plus')} Serviço</button>
        <button class="btn btn-pri" onclick="exportarAtual()">${ic('download')} <span class="so-pc">Imprimir / Baixar</span><span class="so-cel">Baixar</span></button>
      </div>
    </div>`;

  $('#eLoja').onchange = e => {
    draft.lojaId = e.target.value; db.config.lojaAtual = draft.lojaId; salvarDB();
    const nl = loja(draft.lojaId);
    if(!draft.id){ draft.validade = nl.validade ?? draft.validade; draft.pagamento = nl.pagamento || draft.pagamento; draft.modelo = nl.modelo || draft.modelo; }
    vEditor(); alterado();
  };
  $('#eCli').onchange = e => { draft.clienteId = e.target.value; alterado(); };
  $('#eNum').oninput = e => { draft.numero = Math.max(0, parseInt(e.target.value) || 0) || null; alterado(); };
  $('#eData').onchange = e => { draft.data = e.target.value || hoje(); alterado(); };
  $('#eVal').oninput = e => { draft.validade = +e.target.value || 0; alterado(); };
  $('#ePag').oninput = e => { draft.pagamento = e.target.value; alterado(); };
  $('#ePrazo').oninput = e => { draft.prazo = e.target.value; alterado(); };
  $('#eObs').oninput = e => { draft.obs = e.target.value; alterado(); };

  const b = $('#lBusca');
  b.addEventListener('input', () => { sugSel = -1; atualizarSug(); });
  b.addEventListener('focus', atualizarSug);
  b.addEventListener('blur', () => setTimeout(() => { const sug = $('#sug'); if(sug && document.activeElement !== b) sug.hidden = true; }, 120));
  renderItens();
  b.focus();
}

/* ----- Busca no catálogo e lançamento ----- */
let sugItens = [], sugSel = -1;
const catalogo = () => db.produtos.filter(p => !p.lojaId || p.lojaId === draft.lojaId);
function parseBusca(){
  let txt = ($('#lBusca')?.value || '').trim(), qtd = n($('#lQtd')?.value) || 1;
  const m = txt.match(/^(\d+(?:[.,]\d+)?)\s*\*\s*(.*)$/);
  if(m){ qtd = n(m[1]) || 1; txt = m[2].trim(); }
  return {txt, qtd};
}
function buscarCatalogo(txt){
  const t = normal(txt), palavras = t.split(/\s+/);
  const nota = p => {
    const c = normal(p.codigo), nm = normal(p.nome);
    if(c === t) return 0; if(c.startsWith(t)) return 1; if(nm.startsWith(t)) return 2;
    if(nm.includes(t) || c.includes(t)) return 3; if(palavras.every(w => (c + ' ' + nm).includes(w))) return 4; return -1;
  };
  const ord = catalogo().map(p => [nota(p), p]).filter(x => x[0] >= 0).sort((a, b) => a[0] - b[0] || a[1].nome.localeCompare(b[1].nome)).map(x => x[1]);
  return {pecas: ord.filter(p => !ehServico(p)).slice(0, 6), servicos: ord.filter(ehServico).slice(0, 6)};
}
function atualizarSug(){
  const box = $('#sug'); if(!box) return;
  const {txt} = parseBusca();
  if(!txt){ box.hidden = true; sugItens = []; sugSel = -1; return; }
  const r = buscarCatalogo(txt);
  sugItens = [...r.pecas, ...r.servicos, null];          // null = serviço avulso
  if(sugSel >= sugItens.length) sugSel = -1;
  const iAvulso = sugItens.length - 1;
  const kTab  = r.pecas.length ? 0 : (r.servicos.length ? r.pecas.length : -1);
  const kCtrl = r.servicos.length ? r.pecas.length : iAvulso;
  const tecla = k => sugSel >= 0 ? (k === sugSel ? 'Enter' : '') : [k === kTab && 'Shift', k === kCtrl && 'Ctrl'].filter(Boolean).join(' / ');
  const linha = (p, k) => `<button type="button" class="sug-i ${k === sugSel ? 'sel' : ''}" data-k="${k}">
      ${ic(p ? (ehServico(p) ? 'wrench' : 'package') : 'plus')}
      <span class="sug-n">${p ? `<b>${esc(p.codigo)}</b>${esc(p.nome)}` : `Lançar “${esc(txt)}” como serviço avulso`}</span>
      ${p ? `<span class="sug-v">${brl(precoFinal(p))}</span>` : ''}${tecla(k) ? `<kbd>${tecla(k)}</kbd>` : ''}</button>`;
  box.innerHTML =
    (r.pecas.length ? `<div class="sug-g">Peças</div>` + r.pecas.map((p, i) => linha(p, i)).join('') : `<div class="sug-g">Peças</div><div class="vazio-sm" style="padding:4px 10px 8px">Nenhuma peça encontrada</div>`) +
    (r.servicos.length ? `<div class="sug-g">Serviços</div>` + r.servicos.map((p, i) => linha(p, r.pecas.length + i)).join('') : '') +
    `<div class="sug-g">Avulso</div>` + linha(null, iAvulso) +
    `<div class="sug-g">Cadastrar no catálogo</div>
     <button type="button" class="sug-i" data-novo="produto">${ic('package-plus')}<span class="sug-n">Cadastrar “${esc(txt)}” como nova peça</span></button>
     <button type="button" class="sug-i" data-novo="servico">${ic('plus')}<span class="sug-n">Cadastrar “${esc(txt)}” como novo serviço</span></button>`;
  $$('.sug-i', box).forEach(el => {
    el.onmousedown = e => e.preventDefault();
    el.onclick = () => el.dataset.novo ? cadastrarNoOrc(el.dataset.novo) : lancarItem(sugItens[+el.dataset.k]);
  });
  box.hidden = false;
  $('.sug-i.sel', box)?.scrollIntoView({block: 'nearest'});
}
function lancar(tipo){
  const b = $('#lBusca'); if(!b) return;
  const {txt} = parseBusca();
  if(!txt){ b.focus(); toast(tipo === 'servico' ? 'Digite o serviço e pressione Ctrl' : 'Digite a peça e pressione Shift'); return; }
  atualizarSug();
  if(sugSel >= 0) return lancarItem(sugItens[sugSel]);
  const pecas = sugItens.filter(p => p && !ehServico(p)), servs = sugItens.filter(p => p && ehServico(p));
  if(tipo === 'servico') return lancarItem(servs[0] || null);
  if(pecas[0] || servs[0]) return lancarItem(pecas[0] || servs[0]);
  toast(`Nenhuma peça encontrada para “${txt}”. Clique em “Nova peça” para cadastrar, ou Ctrl para lançar como serviço avulso.`, 'erro');
}
function lancarItem(p){
  const {txt, qtd} = parseBusca();
  if(!p && !txt) return;
  draft.itens.push(p
    ? {tipo: p.tipo, codigo: p.codigo, descricao: p.nome, unidade: p.unidade, qtd, unit: n(p.preco), desc: n(p.desconto)}
    : {tipo: 'servico', codigo: '', descricao: txt, unidade: 'sv', qtd, unit: 0, desc: 0});
  const k = draft.itens.length - 1;
  $('#lBusca').value = ''; $('#lQtd').value = 1; sugSel = -1; atualizarSug();
  renderItens(); alterado();
  $('#row' + k)?.classList.add('novo');
  if(!p){ const u = $('#u' + k); u?.focus(); u?.select(); toast('Serviço avulso lançado — informe o valor'); }
  else { $('#lBusca').focus(); toast(ehServico(p) ? `Serviço lançado: ${p.nome}` : `Peça lançada: ${p.nome}`); }
}

function cadastrarNoOrc(tipo){
  const {txt} = parseBusca();
  formProduto(null, tipo, '', {nome: txt, aoSalvar: p => lancarItem(p)});
}

/* ----- Catálogo: adicionar peça ou serviço com 1 toque ----- */
let catTipo = 'produto', catBusca = '';
function abrirCatalogo(tipo){
  if(!draft) return;
  catTipo = tipo; catBusca = '';
  abrirModal(`
    <div class="janela-cab"><h2 id="catTit"></h2><button class="btn btn-ic btn-ghost" onclick="fecharModal()" aria-label="Fechar">${ic('x')}</button></div>
    <div class="cat-topo">
      <div class="seg" id="catSeg"><button data-v="produto">${ic('package')} Peças</button><button data-v="servico">${ic('wrench')} Serviços</button></div>
      <div class="busca">${ic('search')}<input id="catBusca" type="search" placeholder="Buscar por nome ou código…" autocomplete="off"></div>
    </div>
    <div class="cat-lista" id="catLista"></div>
    <div class="cat-rod">
      <button class="btn" id="catNovo">${ic('plus')} Cadastrar novo</button>
      <button class="btn btn-pri" onclick="fecharModal()">${ic('check')} Concluir</button>
    </div>`, 'folha');
  $$('#catSeg button').forEach(b => b.onclick = () => { catTipo = b.dataset.v; listaCatalogo(); });
  $('#catBusca').oninput = e => { catBusca = e.target.value; listaCatalogo(); };
  $('#catNovo').onclick = () => formProduto(null, catTipo, '', {nome: catBusca.trim(), aoSalvar: p => { adicionarDoCatalogo(p.id, true); abrirCatalogo(p.tipo); }});
  listaCatalogo();
}
function listaCatalogo(){
  const serv = catTipo === 'servico', q = normal(catBusca);
  $('#catTit').textContent = serv ? 'Adicionar serviço' : 'Adicionar peça';
  $$('#catSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === catTipo));
  const lista = catalogo().filter(p => ehServico(p) === serv && (!q || normal(p.codigo + ' ' + p.nome).includes(q)))
    .sort((a, b) => a.nome.localeCompare(b.nome));
  const noOrc = p => draft.itens.filter(i => i.codigo === p.codigo && i.tipo === p.tipo).reduce((s, i) => s + n(i.qtd), 0);
  $('#catLista').innerHTML = lista.length ? lista.map(p => { const qtd = noOrc(p); return `
    <button class="cat-i ${qtd ? 'tem' : ''}" data-p="${p.id}">
      <span class="cat-n"><b>${esc(p.nome)}</b><small>${esc(p.codigo)} · ${esc(p.unidade || '')}${n(p.desconto) ? ` · ${pct(p.desconto)} desc.` : ''}</small></span>
      <span class="cat-v">${brl(precoFinal(p))}${qtd ? `<small>${qtdFmt(qtd)} no orçamento</small>` : ''}</span>
      <span class="cat-add">${ic(qtd ? 'plus' : 'plus')}</span>
    </button>`; }).join('')
    : `<div class="vazio">${ic(serv ? 'wrench' : 'package')}<p>${q ? 'Nada encontrado para essa busca.' : `Nenhum${serv ? ' serviço' : 'a peça'} no catálogo desta loja.`}</p></div>`;
  $$('.cat-i').forEach(b => b.onclick = () => adicionarDoCatalogo(b.dataset.p));
}
/* 1 toque = adiciona. Se o item já está no orçamento, soma +1 na quantidade. */
function adicionarDoCatalogo(id, silencioso){
  const p = db.produtos.find(x => x.id === id); if(!p) return;
  const existe = draft.itens.findIndex(i => i.codigo === p.codigo && i.tipo === p.tipo && n(i.unit) === n(p.preco));
  if(existe >= 0) draft.itens[existe].qtd = n(draft.itens[existe].qtd) + 1;
  else draft.itens.push({tipo: p.tipo, codigo: p.codigo, descricao: p.nome, unidade: p.unidade, qtd: 1, unit: n(p.preco), desc: n(p.desconto)});
  renderItens(); alterado();
  if(navigator.vibrate) navigator.vibrate(12);
  if(!silencioso) toast(`${existe >= 0 ? '+1 ' : ''}${p.nome} adicionad${ehServico(p) ? 'o' : 'a'}`);
  if($('#catLista')) listaCatalogo();
}
function passoQtd(k, d){
  const i = draft.itens[k]; if(!i) return;
  const v = Math.max(0, n(i.qtd) + d);
  if($('#q' + k)) $('#q' + k).value = v;
  setItem(k, 'qtd', v);
}

/* ----- Tabelas de itens ----- */
function secaoItens(tipo){
  const serv = tipo === 'servico';
  const lista = draft.itens.map((i, k) => [i, k]).filter(([i]) => ehServico(i) === serv);
  const s = calcular(draft)[serv ? 'servicos' : 'pecas'];
  return `<div class="card-cab"><h2>${ic(serv ? 'wrench' : 'package')} ${serv ? 'Serviços' : 'Peças'} <span class="cont">${lista.length}</span></h2>
      <span class="muted">Total em ${serv ? 'serviços' : 'peças'}: <b style="color:var(--txt)" id="st-${tipo}">${brl(s.liq)}</b></span></div>
    ${lista.length ? `<div class="tbl-wrap"><table class="tbl tbl-itens"><thead><tr><th>Cód.</th><th>Descrição</th><th class="r">Qtd</th><th class="r">Valor unit.</th>
      <th class="r">Desc. %</th><th class="r">Desconto</th><th class="r">Total</th><th></th></tr></thead><tbody>
      ${lista.map(([i, k]) => `<tr id="row${k}">
        <td class="muted mono c-cod">${esc(i.codigo) || '—'}</td>
        <td class="c-desc"><input class="in-cel in-desc" value="${esc(i.descricao)}" oninput="setItem(${k},'descricao',this.value)"></td>
        <td class="r c-qtd" data-l="Qtd"><div class="qtd-passo"><button type="button" class="qtd-b" onclick="passoQtd(${k},-1)" aria-label="Diminuir">−</button><input class="in-cel in-num w-qtd" id="q${k}" type="number" inputmode="decimal" step="any" min="0" value="${i.qtd}" oninput="setItem(${k},'qtd',this.value)"><button type="button" class="qtd-b" onclick="passoQtd(${k},1)" aria-label="Aumentar">+</button></div></td>
        <td class="r c-val" data-l="Valor unit."><input class="in-cel in-num w-val" id="u${k}" type="number" inputmode="decimal" step="0.01" min="0" value="${i.unit}" oninput="setItem(${k},'unit',this.value)"></td>
        <td class="r c-pct" data-l="Desc. %"><input class="in-cel in-num w-pct" type="number" inputmode="decimal" step="0.01" min="0" max="100" value="${i.desc}" oninput="setItem(${k},'desc',this.value)"></td>
        <td class="r mono muted c-dsc" data-l="Desconto" id="dl${k}">${descLinha(i) > .004 ? '− ' + brl(descLinha(i)) : '—'}</td>
        <td class="r mono b c-tot" data-l="Total" id="tl${k}">${brl(totalLinha(i))}</td>
        <td class="r nowrap c-acoes"><button class="btn btn-ic btn-sm btn-ghost" title="Mover para ${serv ? 'peças' : 'serviços'}" onclick="moverItem(${k})">${ic('arrow-left-right')}</button>
          <button class="btn btn-ic btn-sm btn-ghost perigo" title="Remover" onclick="removerItem(${k})">${ic('trash-2')}</button></td></tr>`).join('')}
      </tbody></table></div>`
    : `<div class="vazio-sm">${serv ? 'Nenhum serviço ainda.' : 'Nenhuma peça ainda.'} <button class="btn btn-sm" onclick="abrirCatalogo('${tipo}')">${ic('plus')} Adicionar ${serv ? 'serviço' : 'peça'}</button></div>`}`;
}
function renderItens(){
  $('#secPecas').innerHTML = secaoItens('produto');
  $('#secServ').innerHTML = secaoItens('servico');
  renderResumo();
}
function setItem(k, campo, v){
  draft.itens[k][campo] = ['qtd', 'unit', 'desc'].includes(campo) ? n(v) : v;
  const i = draft.itens[k];
  if($('#tl' + k)) $('#tl' + k).textContent = brl(totalLinha(i));
  if($('#dl' + k)) $('#dl' + k).textContent = descLinha(i) > .004 ? '− ' + brl(descLinha(i)) : '—';
  const t = calcular(draft);
  $('#st-produto').textContent = brl(t.pecas.liq); $('#st-servico').textContent = brl(t.servicos.liq);
  renderResumo(); alterado();
}
function moverItem(k){ const i = draft.itens[k]; i.tipo = ehServico(i) ? 'produto' : 'servico'; renderItens(); alterado(); toast(ehServico(i) ? 'Movido para serviços' : 'Movido para peças'); }
function removerItem(k){ draft.itens.splice(k, 1); renderItens(); alterado(); }

function renderResumo(){
  const el = $('#resumo'); if(!el) return;
  if(!el.dataset.pronto){
    el.dataset.pronto = 1;
    const ctrl = (id, chaveTipo, chaveValor) => `<span class="desc-geral">
        <span class="seg seg-sm" data-tipo="${chaveTipo}">${['%', 'R$'].map(v => `<button data-v="${v}" class="${(draft[chaveTipo] || '%') === v ? 'on' : ''}">${v}</button>`).join('')}</span>
        <input id="${id}" data-valor="${chaveValor}" type="number" min="0" step="0.01" placeholder="0" value="${draft[chaveValor] || ''}"></span>`;
    el.innerHTML = `<h2>${ic('calculator')} Resumo</h2>
      <div class="res-l"><span>${ic('package')} Total em peças</span><b id="rPec"></b></div>
      <div class="res-l res-desc"><span>Desconto em peças</span>${ctrl('eDescPec', 'descPecasTipo', 'descPecasValor')}<span class="res-v" id="rDescPec"></span></div>
      <div class="res-l"><span>${ic('wrench')} Total em serviços</span><b id="rSer"></b></div>
      <div class="res-l res-desc"><span>Desconto em serviços</span>${ctrl('eDescSer', 'descServTipo', 'descServValor')}<span class="res-v" id="rDescSer"></span></div>
      ${n(draft.descValor) ? `<div class="res-l res-desc"><span>Desconto adicional</span>${ctrl('eDescVal', 'descTipo', 'descValor')}<span class="res-v" id="rDescGer"></span></div>` : ''}
      <div class="res-l sub"><span>Descontos já aplicados nos itens</span><span id="rDescItens"></span></div>
      <div class="res-total"><span>TOTAL GERAL</span><span id="rTot"></span></div>
      <div class="res-eco" id="rEco"></div>`;
    $$('.seg[data-tipo]', el).forEach(seg => $$('button', seg).forEach(b => b.onclick = () => {
      draft[seg.dataset.tipo] = b.dataset.v; $$('button', seg).forEach(x => x.classList.toggle('on', x === b)); renderResumo(); alterado();
    }));
    $$('input[data-valor]', el).forEach(inp => inp.oninput = () => { draft[inp.dataset.valor] = n(inp.value); renderResumo(); alterado(); });
  }
  const t = calcular(draft);
  const menos = v => v > .004 ? '− ' + brl(v) : '—';
  $('#rPec').textContent = brl(t.pecas.liq);
  $('#rSer').textContent = brl(t.servicos.liq);
  $('#rDescPec').textContent = menos(t.pecas.extra);
  $('#rDescSer').textContent = menos(t.servicos.extra);
  if($('#rDescGer')) $('#rDescGer').textContent = menos(t.descGeral);
  $('#rDescItens').textContent = menos(t.pecas.desc + t.servicos.desc);
  $('#rTot').textContent = brl(t.total);
  $('#rEco').textContent = t.economia > .004 ? `Desconto total concedido ao cliente: ${brl(t.economia)}` : '';
  $('#barraTot').innerHTML = `<span>Peças <b>${brl(t.pecas.liq - t.pecas.extra)}</b></span><span>Serviços <b>${brl(t.servicos.liq - t.servicos.extra)}</b></span>${t.descTotal > .004 ? `<span>Descontos <b>− ${brl(t.descTotal)}</b></span>` : ''}<span class="tot">Total <b>${brl(t.total)}</b></span>`;
}

function salvarOrc(silencioso, automatico){
  if(!draft.itens.length){ if(!automatico){ toast('Lance pelo menos uma peça ou serviço', 'erro'); $('#lBusca')?.focus(); } return null; }
  const l = loja(draft.lojaId); if(!l){ if(!automatico) toast('Selecione uma loja', 'erro'); return null; }
  if(draft.numero && !automatico){
    const igual = db.orcamentos.find(o => o.id !== draft.id && o.lojaId === draft.lojaId && o.numero === draft.numero);
    if(igual) toast(`Atenção: já existe outro orçamento nº ${fmtNum(draft)} nesta loja (${nomeCliente(igual)}).`, 'erro');
  }
  draft.clienteNome = draft.clienteId ? (cliente(draft.clienteId)?.nome || '') : '';
  if(!draft.numero) draft.numero = l.proximo || 1;
  if(draft.numero >= (l.proximo || 1)) l.proximo = draft.numero + 1;
  const eraCopia = !!draft.copiaDe; delete draft.copiaDe;
  if(!draft.id){ draft.id = uid(); draft.criado = Date.now(); db.orcamentos.push(clonar(draft)); }
  else { const i = db.orcamentos.findIndex(o => o.id === draft.id); if(i >= 0) db.orcamentos[i] = clonar(draft); else db.orcamentos.push(clonar(draft)); }
  salvarDB();
  if(!automatico && view === 'novo' && ($('#eNum')?.value !== String(draft.numero) || eraCopia || !$('#autoSalvo'))){ const y = window.scrollY; vEditor(); window.scrollTo(0, y); }
  if(!silencioso) toast('Orçamento nº ' + fmtNum(draft) + ' salvo');
  return db.orcamentos.find(o => o.id === draft.id);
}

/* ----- Teclado: Shift = peça, Ctrl = serviço ----- */
/* Shift sozinho = lança peça · Ctrl sozinho = lança serviço (Shift+letra continua digitando maiúscula normalmente) */
let teclaSozinha = null;
const ehCtrl  = e => e.key === 'Control' || /^Control/.test(e.code || '') || e.keyCode === 17;
const ehShift = e => e.key === 'Shift' || /^Shift/.test(e.code || '') || e.keyCode === 16;
document.addEventListener('keydown', e => {
  teclaSozinha = e.repeat ? teclaSozinha : (ehCtrl(e) ? 'ctrl' : ehShift(e) ? 'shift' : null);
  if(e.key === 'Escape' && modalAberto()){ fecharModal(); return; }
  if(view !== 'novo' || modalAberto()) return;
  const b = $('#lBusca'); if(!b) return;
  const ativo = document.activeElement;
  if(ativo === b){
    if((e.key === 'ArrowDown' || e.key === 'ArrowUp') && sugItens.length){
      e.preventDefault();
      sugSel = e.key === 'ArrowDown' ? (sugSel + 1) % sugItens.length : (sugSel <= 0 ? sugItens.length - 1 : sugSel - 1);
      atualizarSug();
    } else if(e.key === 'Enter'){ e.preventDefault(); lancar('produto'); }
    else if(e.key === 'Escape'){ b.value = ''; sugSel = -1; atualizarSug(); }
  } else if(ativo === $('#lQtd') && e.key === 'Enter'){ e.preventDefault(); lancar('produto'); }
}, true);
document.addEventListener('mousedown', () => teclaSozinha = null, true);
document.addEventListener('keyup', e => {
  const t = teclaSozinha; teclaSozinha = null;
  if(view !== 'novo' || modalAberto() || !$('#lBusca')) return;
  const tipo = t === 'ctrl' && ehCtrl(e) ? 'servico' : t === 'shift' && ehShift(e) ? 'produto' : null;
  if(!tipo) return;
  const noLancador = [$('#lBusca'), $('#lQtd')].includes(document.activeElement);
  if($('#lBusca').value.trim() || noLancador) lancar(tipo);
});

/* ================= Imprimir / baixar ================= */
function exportarAtual(){ const o = salvarOrc(true); if(o) abrirExportar(o.id); }
const nomeArquivo = o => `Orcamento-${fmtNum(o)}-${normal(nomeCliente(o) || 'cliente').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
function encaixar(cont, o, modelo, largura){
  const el = montarDoc(o, modelo), w = document.createElement('div');
  w.className = 'encaixe'; w.appendChild(el); cont.innerHTML = ''; cont.appendChild(w);
  const s = Math.min(1, largura / 794);
  el.style.transform = `scale(${s})`; el.style.transformOrigin = '0 0';
  w.style.width = 794 * s + 'px'; w.style.height = el.offsetHeight * s + 'px';
}
function abrirExportar(id){
  const o = db.orcamentos.find(x => x.id === id); if(!o) return;
  if(!MODELOS.some(m => m.id === o.modelo)) o.modelo = loja(o.lojaId)?.modelo || 'classico';
  const fmt = (f, icone, titulo, sub) => `<button class="fmt" data-f="${f}"><span class="fi">${ic(icone)}</span><span><b>${titulo}</b><small>${sub}</small></span></button>`;
  abrirModal(`<div class="exp">
    <div class="exp-lado">
      <div class="exp-cab"><div><h2>Imprimir ou baixar</h2><p class="muted">Nº ${fmtNum(o)} · ${esc(nomeCliente(o))} · <b>${brl(calcular(o).total)}</b></p></div>
        <button class="btn btn-ic btn-ghost" onclick="fecharModal()">${ic('x')}</button></div>
      <div class="rot">1. Escolha o modelo</div>
      <div class="modelos">${MODELOS.map(m => `<button class="modelo ${o.modelo === m.id ? 'sel' : ''}" data-m="${m.id}" title="${m.desc}">
        <div class="thumb"></div><div class="modelo-txt"><b>${m.nome}</b><span>${m.desc}</span></div>${ic('check', 'modelo-ok')}</button>`).join('')}</div>
      <div class="rot">2. Baixe no formato</div>
      <div class="formatos">
        ${fmt('pdf', 'file-text', 'PDF', 'Para enviar ao cliente')}
        ${fmt('png', 'image', 'Imagem PNG', 'Alta qualidade')}
        ${fmt('jpg', 'image', 'Imagem JPG', 'Arquivo mais leve')}
        ${fmt('docx', 'file-type', 'Word (.docx)', 'Para editar')}
        ${fmt('print', 'printer', 'Imprimir', 'Impressora ou PDF')}
        ${fmt('txt', 'copy', 'Copiar texto', 'Colar no WhatsApp')}
        ${fmt('whats', 'message-circle', 'WhatsApp', 'Baixa o PDF e abre a conversa')}
        ${navigator.share ? fmt('share', 'share-2', 'Compartilhar', 'Envia o PDF pelo celular') : ''}
      </div>
    </div>
    <div class="exp-prev" id="expPrev"></div>
  </div>`, 'xl');
  const prever = () => encaixar($('#expPrev'), o, o.modelo, Math.min(794, $('#expPrev').clientWidth - 48));
  $$('.modelo').forEach(btn => {
    encaixar($('.thumb', btn), o, btn.dataset.m, $('.thumb', btn).clientWidth);
    btn.onclick = () => {
      o.modelo = btn.dataset.m; if(draft?.id === o.id) draft.modelo = o.modelo; salvarDB();
      $$('.modelo').forEach(x => x.classList.toggle('sel', x === btn)); prever();
    };
  });
  $$('.fmt').forEach(b => b.onclick = () => exportar(o, b.dataset.f, b));
  prever();
  document.fonts?.ready.then(() => modalAberto() && $('#expPrev') && prever());
}

/* ===== Motor de PDF e imagem =====
   O orçamento é desenhado numa janela isolada (iframe) que nunca rola. Assim o cabeçalho
   nunca some, em nenhum navegador (Chrome, Safari, celular). As páginas do PDF são cortadas
   pelo próprio sistema, sempre entre uma linha e outra da tabela. */
async function renderizarDoc(o){
  await Promise.all([carregarLib('html2canvas'), carregarLib('jspdf')]);
  const f = document.createElement('iframe');
  f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
  f.style.cssText = 'position:fixed;left:-12000px;top:0;width:794px;height:1123px;border:0;pointer-events:none';
  document.body.appendChild(f);
  try{
    const carregou = new Promise(ok => f.onload = ok);
    const d = f.contentDocument;
    d.open();
    d.write(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTES_URL}">
      <style>${DOC_CSS}html,body{margin:0;padding:0;background:#fff;width:794px;overflow:hidden}</style></head>
      <body>${montarDoc(o, o.modelo).outerHTML}</body></html>`);
    d.close();
    await Promise.race([carregou, espera(3000)]);
    await Promise.race([d.fonts ? d.fonts.ready : null, espera(3000)]);
    await Promise.all([...d.images].map(img => img.complete ? 0 : new Promise(ok => { img.onload = img.onerror = ok; })));
    const el = d.querySelector('.doc');
    const topo = el.getBoundingClientRect().top;
    const altura = Math.ceil(el.scrollHeight);
    // pontos seguros para virar a página (entre linhas e blocos)
    const cortes = [...new Set([...el.querySelectorAll('tr, .nq, .c-sec, .m-sec, .l-sec, .n-sec, .e-sec, .c-fim, .m-desc, .m-cards, .m-cond, .e-fim, .e-local, .l-fim, .n-fim, .n-cond, .k-res, .k-cond, .ass, .rod')]
      .map(x => Math.round(x.getBoundingClientRect().top - topo)).filter(y => y > 0))].sort((a, b) => a - b);
    // celulares têm limite de tamanho de imagem: a qualidade se ajusta sozinha
    const escala = Math.max(1, Math.min(2, Math.sqrt(14e6 / (794 * altura))));
    const canvas = await html2canvas(el, {scale: escala, backgroundColor: '#ffffff', useCORS: true, logging: false,
      width: 794, height: altura, windowWidth: 794, windowHeight: altura, x: 0, y: 0, scrollX: 0, scrollY: 0});
    return {canvas, escala, altura, cortes};
  } finally { f.remove(); }
}
/* Corta o desenho em páginas A4, sempre entre uma linha e outra da tabela */
function fatiarPaginas({canvas, escala, altura, cortes}){
  const pxMm = 794 / 210;                 // pixels por milímetro
  const mTopo = 10, mBase = 12;           // margens (a 1ª página começa na borda, com o cabeçalho)
  const paginas = [];
  let inicio = 0;
  while(inicio < altura - 2){
    const mt = paginas.length ? mTopo : 0;
    const util = (297 - mt - mBase) * pxMm;
    let fim = inicio + util;
    if(fim < altura){
      const bom = cortes.filter(y => y > inicio + util * 0.35 && y <= fim).pop();
      if(bom) fim = bom;
    } else fim = altura;
    const h = fim - inicio;
    const fatia = document.createElement('canvas');
    fatia.width = canvas.width; fatia.height = Math.max(1, Math.round(h * escala));
    const ctx = fatia.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, fatia.width, fatia.height);
    ctx.drawImage(canvas, 0, Math.round(inicio * escala), canvas.width, fatia.height, 0, 0, fatia.width, fatia.height);
    paginas.push({imagem: fatia.toDataURL('image/jpeg', 0.92), topoMm: mt, alturaMm: h / pxMm});
    inicio = fim;
  }
  return paginas;
}
async function pdfBlob(o){
  const paginas = fatiarPaginas(await renderizarDoc(o));
  const pdf = new window.jspdf.jsPDF({unit: 'mm', format: 'a4', orientation: 'portrait', compress: true});
  paginas.forEach((p, i) => {
    if(i) pdf.addPage();
    pdf.addImage(p.imagem, 'JPEG', 0, p.topoMm, 210, p.alturaMm, undefined, 'FAST');
    if(paginas.length > 1){ pdf.setFontSize(8); pdf.setTextColor(150); pdf.text(`Página ${i + 1} de ${paginas.length}`, 105, 292, {align: 'center'}); }
  });
  pdf.setProperties({title: 'Orçamento nº ' + fmtNum(o), creator: 'Valora'});
  return pdf.output('blob');
}
async function gerarImagem(o, f){
  const {canvas} = await renderizarDoc(o);
  return new Promise(ok => canvas.toBlob(ok, f === 'jpg' ? 'image/jpeg' : 'image/png', 0.95));
}
function imprimir(o){
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  const d = f.contentDocument;
  d.open();
  d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${nomeArquivo(o)}</title><link rel="stylesheet" href="${FONTES_URL}">
    <style>${DOC_CSS}@page{size:A4;margin:8mm 0}html,body{margin:0;background:#fff}.doc{margin:0 auto}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
    </head><body>${montarDoc(o, o.modelo).outerHTML}</body></html>`);
  d.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 60000); }, 800);
}
function textoOrc(o){
  const {l, c, t, pecas, serv, validoAte} = dadosDoc(o);
  const lin = i => `• ${qtdFmt(i.qtd)}x ${i.descricao} — ${brl(totalLinha(i))}${n(i.desc) ? ` (${pct(i.desc)} de desconto)` : ''}`;
  const out = [`*ORÇAMENTO Nº ${fmtNum(o)}* — ${l.nome}`];
  if(c.nome) out.push(`Cliente: ${c.nome}`);
  if(pecas.length) out.push('', '*PEÇAS*', ...pecas.map(lin), `Total em peças: ${brl(t.pecas.liq)}`);
  if(serv.length) out.push('', '*SERVIÇOS*', ...serv.map(lin), `Total em serviços: ${brl(t.servicos.liq)}`);
  out.push('');
  t.linhasDesc.forEach(([k, v]) => out.push(`${k}: − ${brl(v)}`));
  out.push(`*TOTAL GERAL: ${brl(t.total)}*`, '');
  if(o.pagamento) out.push(`Pagamento: ${o.pagamento}`);
  if(l.pix) out.push(`Pix: ${l.pix}`);
  if(o.prazo) out.push(`Prazo: ${o.prazo}`);
  out.push(`Válido até ${validoAte}`);
  return out.join('\n');
}
async function copiar(txt){
  try{ await navigator.clipboard.writeText(txt); }
  catch(e){ const a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
}
async function exportar(o, f, btn){
  const nome = nomeArquivo(o);
  const modelo = MODELOS.find(m => m.id === o.modelo)?.nome || 'Clássico';
  const base = ['Organizando peças e serviços', 'Calculando totais e descontos', `Aplicando o modelo ${modelo}`];
  btn?.classList.add('carregando');
  try{
    if(f === 'pdf'){ baixarBlob(await trabalhando('Gerando seu PDF', [...base, 'Renderizando em alta qualidade'], () => pdfBlob(o)), nome + '.pdf'); toast('PDF baixado'); }
    else if(f === 'png' || f === 'jpg'){ baixarBlob(await trabalhando('Gerando a imagem', [...base, `Exportando ${f.toUpperCase()}`], () => gerarImagem(o, f)), `${nome}.${f}`); toast('Imagem baixada'); }
    else if(f === 'docx'){ baixarBlob(await trabalhando('Montando o documento Word', [...base, 'Formatando tabelas e logo'], () => gerarDocx(o)), nome + '.docx'); toast('Arquivo Word baixado'); }
    else if(f === 'print') imprimir(o);
    else if(f === 'txt'){ await copiar(textoOrc(o)); toast('Texto copiado — é só colar no WhatsApp'); }
    else if(f === 'share'){
      const arq = new File([await trabalhando('Preparando para compartilhar', [...base, 'Gerando PDF'], () => pdfBlob(o))], nome + '.pdf', {type: 'application/pdf'});
      if(navigator.canShare?.({files: [arq]})) await navigator.share({files: [arq], title: 'Orçamento nº ' + fmtNum(o)});
      else { baixarBlob(arq, arq.name); toast('Compartilhamento indisponível aqui — o PDF foi baixado'); }
    }
    else if(f === 'whats'){
      const c = cliente(o.clienteId), l = loja(o.lojaId);
      let tel = (c?.telefone || '').replace(/\D/g, ''); if(tel && tel.length <= 11) tel = '55' + tel;
      const msg = `Olá${c ? ' ' + c.nome.split(' ')[0] : ''}! Segue o orçamento nº ${fmtNum(o)} da ${l?.nome || ''}, no valor de ${brl(calcular(o).total)}, válido até ${fmtData(somaDias(o.data, o.validade))}. Qualquer dúvida estou à disposição!`;
      const janela = window.open('about:blank', '_blank');
      baixarBlob(await trabalhando('Preparando para o WhatsApp', [...base, 'Gerando PDF', 'Escrevendo a mensagem'], () => pdfBlob(o)), nome + '.pdf');
      if(janela) janela.location = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
      toast('PDF baixado — anexe o arquivo na conversa');
    }
  }catch(err){
    if(err?.name !== 'AbortError'){ console.error(err); toast('Não foi possível gerar: ' + (err?.message || err), 'erro'); }
  }finally{ btn?.classList.remove('carregando'); }
}

/* ----- Word (.docx) ----- */
function dataUrlBytes(url){
  const b = atob(url.split(',')[1]), a = new Uint8Array(b.length);
  for(let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}
const tamanhoImg = url => new Promise(ok => { const i = new Image(); i.onload = () => ok({w: i.naturalWidth, h: i.naturalHeight}); i.onerror = () => ok({w: 1, h: 1}); i.src = url; });
async function gerarDocx(o){
  const D = await carregarLib('docx');
  const {l, c, t, cor, pecas, serv, validoAte, infoLoja} = dadosDoc(o);
  const hex = cor.replace('#', '').toUpperCase().padEnd(6, '0').slice(0, 6);
  const formal = o.modelo === 'executivo', classico = o.modelo === 'classico';
  const fonte = formal ? 'Georgia' : (o.modelo === 'moderno' ? 'Calibri' : 'Arial');
  const AL = D.AlignmentType;
  const NB = {style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF'}, LB = {style: D.BorderStyle.SINGLE, size: 4, color: 'D0D0D0'};
  const SEM = {top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB};
  const LINHAS = {top: NB, left: NB, right: NB, bottom: LB, insideHorizontal: LB, insideVertical: NB};
  const GRADE = {top: LB, bottom: LB, left: LB, right: LB, insideHorizontal: LB, insideVertical: LB};
  const R = (text, op = {}) => new D.TextRun({text: String(text ?? ''), font: fonte, size: op.size || 19, bold: !!op.bold, color: op.color || '222222'});
  const P = (filhos, op = {}) => new D.Paragraph({children: [].concat(filhos), alignment: op.al, spacing: {before: op.antes || 0, after: op.depois ?? 40}});
  const C = (conteudo, op = {}) => new D.TableCell({
    children: Array.isArray(conteudo) && conteudo[0] instanceof D.Paragraph ? conteudo : [P(conteudo, {al: op.al, depois: 0})],
    shading: op.fill ? {fill: op.fill, type: D.ShadingType.CLEAR, color: 'auto'} : undefined,
    width: op.w ? {size: op.w, type: D.WidthType.PERCENTAGE} : undefined,
    columnSpan: op.span, verticalAlign: D.VerticalAlign.CENTER,
    margins: {top: 70, bottom: 70, left: 110, right: 110}
  });
  const T = (linhas, op = {}) => new D.Table({rows: linhas, width: {size: op.w || 100, type: D.WidthType.PERCENTAGE}, borders: op.bordas || SEM, alignment: op.al});
  const filhos = [];

  let logo = null;
  if(l.logo){
    const {w, h} = await tamanhoImg(l.logo);
    const alt = 62, larg = Math.min(170, Math.round(w * alt / h));
    logo = new D.ImageRun({data: dataUrlBytes(l.logo), transformation: {width: larg, height: Math.round(larg * h / w)}});
  }
  const corTxt = classico ? 'FFFFFF' : '222222';
  if(formal){
    if(logo) filhos.push(P(logo, {al: AL.CENTER, depois: 120}));
    filhos.push(P(R(l.nome.toUpperCase(), {size: 32, bold: true}), {al: AL.CENTER}));
    filhos.push(P(R(infoLoja.join('  |  '), {size: 17, color: '666666'}), {al: AL.CENTER, depois: 200}));
    filhos.push(new D.Paragraph({border: {bottom: {style: D.BorderStyle.DOUBLE, size: 6, color: hex, space: 1}}, spacing: {after: 200}}));
    filhos.push(T([new D.TableRow({children: [C(R('ORÇAMENTO', {size: 36})), C(R(`Nº ${fmtNum(o)} · ${fmtData(o.data)}`, {size: 22}), {al: AL.RIGHT})]})]));
  } else {
    filhos.push(T([new D.TableRow({children: [
      C([...(logo ? [P(logo, {depois: 80})] : []), P(R(l.nome, {size: 30, bold: true, color: corTxt})), ...infoLoja.map(x => P(R(x, {size: 16, color: classico ? 'FFFFFF' : '777777'}), {depois: 0}))], {fill: classico ? hex : undefined, w: 62}),
      C([P(R(classico ? 'ORÇAMENTO' : 'Orçamento', {size: classico ? 18 : 40, color: corTxt}), {al: AL.RIGHT}),
         P(R('Nº ' + fmtNum(o), {size: classico ? 40 : 24, bold: true, color: classico ? 'FFFFFF' : hex}), {al: AL.RIGHT}),
         P(R('Emissão: ' + fmtData(o.data), {size: 17, color: corTxt}), {al: AL.RIGHT, depois: 0}),
         P(R('Válido até: ' + validoAte, {size: 17, color: corTxt}), {al: AL.RIGHT, depois: 0})], {fill: classico ? hex : undefined, w: 38})
    ]})]));
  }
  filhos.push(P(R('CLIENTE', {size: 15, bold: true, color: '888888'}), {antes: 280, depois: 60}));
  filhos.push(T([new D.TableRow({children: [C([
    P(R(c.nome || '—', {bold: true, size: 21}), {depois: 20}),
    ...[[c.doc, c.telefone, c.email].filter(Boolean).join(' · '), c.endereco].filter(Boolean).map(x => P(R(x, {size: 18}), {depois: 0}))
  ], {fill: classico ? undefined : 'F6F6F6'})]})], {bordas: classico || formal ? GRADE : SEM}));

  const tabela = (titulo, lista, s) => {
    if(!lista.length) return;
    filhos.push(P(R(titulo.toUpperCase() + `  (${lista.length} ${lista.length === 1 ? 'item' : 'itens'})`, {bold: true, size: 22, color: formal ? '222222' : hex}), {antes: 320, depois: 80}));
    const cab = ['Cód.', 'Descrição', 'Qtd', 'Valor unit.', 'Desconto', 'Total'], larg = [10, 38, 11, 14, 13, 14];
    const fundoCab = formal ? 'F1F1F1' : (classico ? hex : 'F4F4F4'), corCab = formal ? '222222' : (classico ? 'FFFFFF' : hex);
    filhos.push(T([
      new D.TableRow({tableHeader: true, children: cab.map((h, i) => C(R(h, {bold: true, size: 16, color: corCab}), {fill: fundoCab, al: i > 1 ? AL.RIGHT : AL.LEFT, w: larg[i]}))}),
      ...lista.map(i => new D.TableRow({children: [
        C(R(i.codigo || '—', {size: 17})), C(R(i.descricao, {size: 18})),
        C(R(`${qtdFmt(i.qtd)} ${i.unidade || ''}`, {size: 17}), {al: AL.RIGHT}), C(R(brl(i.unit), {size: 17}), {al: AL.RIGHT}),
        C(R(n(i.desc) ? `${pct(i.desc)} (− ${brl(descLinha(i))})` : '—', {size: 15}), {al: AL.RIGHT}),
        C(R(brl(totalLinha(i)), {size: 18, bold: true}), {al: AL.RIGHT})]})),
      new D.TableRow({children: [C(R('Total em ' + titulo.toLowerCase(), {bold: true, size: 18}), {span: 5, al: AL.RIGHT, fill: 'F7F7F7'}),
        C(R(brl(s.liq), {bold: true, size: 18}), {al: AL.RIGHT, fill: 'F7F7F7'})]})
    ], {bordas: formal ? GRADE : LINHAS}));
  };
  tabela('Peças', pecas, t.pecas);
  tabela('Serviços', serv, t.servicos);

  filhos.push(P(R(''), {antes: 200}));
  const linhaTot = (k, v, op = {}) => new D.TableRow({children: [C(R(k, op), {fill: op.fill}), C(R(v, op), {al: AL.RIGHT, fill: op.fill})]});
  filhos.push(T([
    linhaTot('Total em peças', brl(t.pecas.liq)),
    linhaTot('Total em serviços', brl(t.servicos.liq)),
    ...t.linhasDesc.map(([k, v]) => linhaTot(k, '− ' + brl(v))),
    linhaTot('TOTAL GERAL', brl(t.total), {bold: true, size: 26, color: 'FFFFFF', fill: hex})
  ], {w: 48, al: AL.RIGHT, bordas: GRADE}));
  if(t.economia > .004) filhos.push(P(R(`Desconto total concedido: ${brl(t.economia)}`, {size: 16, color: '1A8F4C'}), {al: AL.RIGHT, antes: 60}));

  filhos.push(P(R(formal ? 'CONDIÇÕES COMERCIAIS' : 'CONDIÇÕES', {size: 15, bold: true, color: '888888'}), {antes: 320, depois: 80}));
  condicoes(o, l).forEach(([k, v]) => filhos.push(P([R(k + ': ', {bold: true}), R(v)])));
  if(o.obs) o.obs.split('\n').forEach((x, i) => filhos.push(P(i ? R(x) : [R('Observações: ', {bold: true}), R(x)])));

  filhos.push(P(R(''), {antes: 700}));
  filhos.push(T([new D.TableRow({children: [
    C([P(R('______________________________'), {al: AL.CENTER, depois: 0}), P(R(l.nome, {size: 17, color: '555555'}), {al: AL.CENTER})]),
    C([P(R('______________________________'), {al: AL.CENTER, depois: 0}), P(R((c.nome || 'Cliente') + ' — de acordo', {size: 17, color: '555555'}), {al: AL.CENTER})])
  ]})]));
  if(l.rodape) filhos.push(P(R(l.rodape, {size: 15, color: '888888'}), {al: AL.CENTER, antes: 300}));

  const doc = new D.Document({
    creator: l.nome, title: 'Orçamento nº ' + fmtNum(o),
    styles: {default: {document: {run: {font: fonte}}}},
    sections: [{properties: {page: {margin: {top: 720, right: 720, bottom: 720, left: 720}}}, children: filhos}]
  });
  return D.Packer.toBlob(doc);
}

/* ================= Backup ================= */
function vBackup(){
  const kb = Math.round((armazem.get(DB_KEY) || '').length / 1024);
  $('#app').innerHTML = cabecalho('Backup', 'Guarde uma cópia dos seus dados') + `
    <section class="card">
      <p>Os dados ficam salvos <b>neste navegador, neste aparelho</b> (${kb} KB usados). Baixe um backup de vez em quando
      e use-o para levar tudo para outro computador ou celular.</p>
      <div class="btns" style="margin-top:16px">
        <button class="btn btn-pri" onclick="exportarBackup()">${ic('download')} Baixar backup</button>
        <label class="btn" style="margin:0">${ic('upload')} Restaurar backup<input type="file" accept=".json,application/json" hidden onchange="importarBackup(this.files[0])"></label>
      </div>
    </section>`;
}
function exportarBackup(){ baixarBlob(new Blob([JSON.stringify(db)], {type: 'application/json'}), `backup-orcamentos-${hoje()}.json`); }
function importarBackup(f){
  if(!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try{
      const d = JSON.parse(r.result);
      if(!Array.isArray(d.lojas) || !Array.isArray(d.orcamentos)) throw 0;
      if(!await confirmar('Restaurar este backup?', 'Todos os dados atuais deste aparelho serão substituídos pelos do backup.', 'Restaurar', false)) return;
      trabalhando('Restaurando backup', ['Lendo o arquivo', `Conferindo ${d.lojas.length} loja(s) e ${d.orcamentos.length} orçamento(s)`, 'Salvando neste aparelho'], async () => {
        db = d; db.produtos ||= []; db.clientes ||= []; db.config ||= {}; salvarDB();
      }).then(() => { toast('Backup restaurado'); go('painel'); });
    }catch(e){ toast('Arquivo de backup inválido', 'erro'); }
  };
  r.readAsText(f);
}

/* ================= Início ================= */
aplicarTema(armazem.get(TEMA_KEY) || 'auto');
$$('.versao').forEach(el => el.textContent = 'versão ' + VERSAO);
aplicarCor(armazem.get(COR_KEY));
go('painel');
Promise.race([Promise.all([document.fonts?.ready, espera(450)]), espera(1400)]).then(() => {
  $('#boot')?.classList.add('sai'); setTimeout(() => $('#boot')?.remove(), 400);
});
