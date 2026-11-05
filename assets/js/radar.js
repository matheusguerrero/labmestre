/* Radar de bolsas (página /radar/)
   O código de desenho veio do painel no claude.ai. Lá, o motor do tipo Dashboard
   fornece o objeto `dash`; aqui ele é substituído pela versão mínima abaixo, que lê
   os dois JSON de /assets/radar/ (atualizados pela rotina diária) e redesenha a página. */
(function () {
'use strict';

const radarRaiz = document.getElementById('radar');
if (!radarRaiz || !window.d3) return;

const dash = (() => {
  const fontes = {};
  const calcs = [];
  const desenhos = new Map();
  const ouvintes = [];
  const pega = (nome) => fontes[nome] || { status: 'loading', data: [] };
  const recalcula = () => {
    for (const c of calcs) {
      const ins = c.inputs.map(pega);
      if (ins.some((s) => s.status === 'error')) fontes[c.nome] = { status: 'error', data: [] };
      else if (!ins.every((s) => s.status === 'ok')) fontes[c.nome] = { status: 'loading', data: [] };
      else {
        try { fontes[c.nome] = { status: 'ok', data: c.fn(...ins.map((s) => s.data)) }; }
        catch (e) { console.error(e); fontes[c.nome] = { status: 'error', data: [] }; }
      }
    }
  };
  const roda = (nome) => {
    const fn = desenhos.get(nome);
    if (!fn) return;
    for (const alvo of document.querySelectorAll(`[data-draw="${nome}"]`)) {
      try { fn(alvo); } catch (e) { console.error(e); }
    }
  };
  const tudo = () => {
    recalcula();
    for (const nome of desenhos.keys()) roda(nome);
    for (const f of ouvintes) f();
  };
  return {
    calc(nome, def) { calcs.push({ nome, inputs: def.inputs, fn: def.fn }); },
    data: pega,
    draw(nome, fn) { if (fn) desenhos.set(nome, fn); roda(nome); },
    onData(fn) { ouvintes.push(fn); },
    setLink(id) { history.replaceState(null, '', '#' + id); },
    carrega(nomes, base) {
      return Promise.all(nomes.map((nome) => fetch(`${base}${nome}.json`, { cache: 'no-cache' })
        .then((r) => { if (!r.ok) throw new Error(`${nome}.json: ${r.status}`); return r.json(); })
        .then((d) => { fontes[nome] = { status: 'ok', data: d }; },
          (e) => { console.error(e); fontes[nome] = { status: 'error', data: [] }; }))).then(tudo);
    },
    redesenha: roda,
  };
})();

dash.calc('prazos', {
  title: 'Dias até cada prazo',
  description: 'Quantos dias faltam para o prazo de cada programa, contados a partir de hoje no horário de Brasília. Quando o prazo já passou, a situação vira Encerrada.',
  inputs: ['oportunidades'],
  fn: (oportunidades) => {
    const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    const dia = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
    return oportunidades.map((o) => {
      const dias = o.prazo ? Math.round((dia(o.prazo) - dia(hoje)) / 864e5) : null;
      return { id: o.id, dias, situacao_hoje: dias !== null && dias < 0 ? 'Encerrada' : o.situacao };
    });
  },
});

dash.calc('resumo', {
  title: 'Resumo de hoje',
  description: 'Chamadas abertas que aceitam graduandos, quantas fecham em até 30 dias, o próximo prazo, em quantos países há chamadas abertas (sem contar as de vários países) e a data da última verificação.',
  inputs: ['oportunidades', 'prazos'],
  fn: (oportunidades, prazos) => {
    const p = new Map(prazos.map((r) => [r.id, r]));
    const abertas = oportunidades.filter((o) => o.graduacao !== 'Não' && ['Aberta', 'Fluxo contínuo'].includes(p.get(o.id).situacao_hoje));
    const datadas = abertas.filter((o) => p.get(o.id).dias !== null).sort((a, b) => p.get(a.id).dias - p.get(b.id).dias);
    const prox = datadas[0];
    const paises = new Set(abertas.map((o) => o.pais).filter((x) => x && x !== 'Vários' && x !== 'On-line'));
    const verif = oportunidades.map((o) => o.verificado_em).filter(Boolean).sort().pop() || '';
    const dm = (s) => s.slice(8, 10) + '/' + s.slice(5, 7);
    return [{
      abertas: abertas.length,
      fecham_30: datadas.filter((o) => p.get(o.id).dias <= 30).length,
      proximo_dias: prox ? p.get(prox.id).dias : null,
      proximo_nome: prox ? prox.sigla : '',
      proximo_data: prox ? dm(prox.prazo) : '',
      paises: paises.size,
      verificado: verif ? dm(verif) + '/' + verif.slice(0, 4) : '',
      total: oportunidades.length,
    }];
  },
});

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const ORDEM_PRIO = { 'Muito alta': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
const URGENTE = 7;
const MAX_PRAZOS = 20;
const ORDEM_REGIAO = ['Brasil', 'América Latina', 'América do Norte', 'Europa', 'Rússia e Eurásia', 'Oriente Médio', 'África', 'Ásia', 'Oceania', 'Global'];

// Ajudantes
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};
const estado = (...ids) => {
  const s = ids.map((id) => dash.data(id).status);
  if (s.some((x) => x === 'error' || x === 'connect' || x === 'declined' || x === 'missing')) return 'error';
  if (s.every((x) => x === 'ok')) return 'ok';
  return 'loading';
};
const falha = (alvo) => {
  const f = el('div', 'rb-falha');
  f.append(el('span', 'rb-falha-ponto'), el('span', null, 'Não carregou'));
  alvo.replaceChildren(f);
};
const juntar = () => {
  const dias = new Map(dash.data('prazos').data.map((r) => [r.id, r]));
  return dash.data('oportunidades').data.map((o) => ({ ...o, dias: dias.get(o.id)?.dias ?? null, sit: dias.get(o.id)?.situacao_hoje ?? o.situacao }));
};
const aberta = (o) => o.graduacao !== 'Não' && (o.sit === 'Aberta' || o.sit === 'Fluxo contínuo');
const faltam = (d) => (d === 0 ? 'fecha hoje' : d === 1 ? 'falta 1 dia' : `faltam ${d} dias`);
const corPrio = (p) => (p === 'Muito alta' ? 'var(--rb-p1)' : p === 'Alta' ? 'var(--rb-p2)' : 'var(--rb-p3)');
const dataCurta = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
const usd = (v) => 'US$ ' + v.toLocaleString('pt-BR');

// Números da capa
const valorDoResumo = (nome, campo) => dash.draw(nome, (alvo) => {
  const d = dash.data('resumo');
  alvo.classList.toggle('dash-skeleton', d.status === 'loading');
  const v = d.status === 'ok' && d.data[0] ? d.data[0][campo] : null;
  alvo.textContent = v === null || v === undefined || v === '' ? '—' : String(v);
});
valorDoResumo('verificado', 'verificado');
valorDoResumo('n-abertas', 'abertas');
valorDoResumo('n-30', 'fecham_30');
valorDoResumo('n-prox', 'proximo_dias');
valorDoResumo('prox-nome', 'proximo_nome');
valorDoResumo('prox-data', 'proximo_data');
valorDoResumo('n-paises', 'paises');
valorDoResumo('total', 'total');

// Dica (tooltip) dentro do gráfico
const dica = (caixa) => {
  const d = el('div', 'rb-dica');
  d.style.display = 'none';
  caixa.append(d);
  return {
    mostra(ev, linhas) {
      d.replaceChildren(...linhas);
      d.style.display = 'block';
      const cr = caixa.getBoundingClientRect();
      const x = ev.clientX - cr.left, y = ev.clientY - cr.top;
      const w = d.offsetWidth, h = d.offsetHeight;
      d.style.left = Math.max(4, Math.min(x + 14, cr.width - w - 4)) + 'px';
      d.style.top = (y - h - 12 < 0 ? y + 16 : y - h - 12) + 'px';
    },
    esconde() { d.style.display = 'none'; },
  };
};
const linhasDica = (o) => {
  const a = el('div', 'rb-dica-quando', o.instituicao);
  const b = el('div');
  b.append(el('b', null, o.programa));
  const c = el('div', null, `Prazo: ${o.prazo_texto}${o.dias !== null && o.dias >= 0 ? ` (${faltam(o.dias)})` : ''}`);
  const v = el('div', null, `Valor: ${o.valor_texto}`);
  const p = el('div', null, `Prioridade: ${o.prioridade.toLowerCase()}`);
  return [a, b, c, v, p];
};

// Gráfico: dias até cada prazo
dash.draw('grafico-prazos', (caixa) => {
  const st = estado('oportunidades', 'prazos');
  caixa.classList.toggle('dash-skeleton', st === 'loading');
  if (st === 'error') return falha(caixa);
  caixa.replaceChildren();
  if (st !== 'ok') return;
  const linhas = juntar().filter((o) => o.graduacao !== 'Não' && o.dias !== null && o.dias >= 0).sort((a, b) => a.dias - b.dias || (ORDEM_PRIO[a.prioridade] ?? 9) - (ORDEM_PRIO[b.prioridade] ?? 9)).slice(0, MAX_PRAZOS);
  if (!linhas.length) return;
  const W = Math.max(280, caixa.clientWidth - 24);
  const passo = 34, topo = 6, base = 26, alt = 16;
  const H = topo + linhas.length * passo + base;
  const svg = d3.select(caixa).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Dias até o prazo de cada chamada');
  // largura dos rótulos à esquerda e à direita, medidas como desenhadas
  const mede = (cls, textos) => {
    const t = svg.append('text').attr('class', cls);
    let m = 0;
    for (const s of textos) { t.text(s); m = Math.max(m, t.node().getComputedTextLength()); }
    t.remove();
    return m;
  };
  const fimTxt = (o) => `${o.dias === 0 ? 'hoje' : o.dias + (o.dias === 1 ? ' dia' : ' dias')} · ${dataCurta(o.prazo)}`;
  const esq = Math.min(W * 0.42, mede('rb-rotulo', linhas.map((o) => o.sigla)) + 16);
  const dir = mede('rb-fim', linhas.map(fimTxt)) + 12;
  const max = Math.max(30, d3.max(linhas, (o) => o.dias));
  const x = d3.scaleLinear([0, max], [esq, W - dir]);
  const marcas = x.ticks(Math.max(2, Math.floor((W - esq - dir) / 80)));
  svg.append('g').selectAll('line').data(marcas).join('line')
    .attr('x1', (t) => x(t)).attr('x2', (t) => x(t)).attr('y1', topo).attr('y2', H - base)
    .attr('stroke', 'var(--rb-grade)').attr('stroke-width', 1);
  svg.append('g').selectAll('text').data(marcas).join('text')
    .attr('class', 'rb-eixo').attr('x', (t) => x(t)).attr('y', H - base + 17).attr('text-anchor', 'middle')
    .text((t) => (t === 0 ? 'hoje' : `${t} d`));
  const tip = dica(caixa);
  const g = svg.append('g').selectAll('g').data(linhas).join('g')
    .attr('transform', (o, i) => `translate(0, ${topo + i * passo})`);
  g.append('text').attr('class', 'rb-rotulo').attr('x', esq - 14).attr('y', passo / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
    .text((o) => o.sigla)
    .each(function (o) {
      // corta rótulos longos para não invadir a barra
      const t = d3.select(this);
      let s = o.sigla;
      while (this.getComputedTextLength() > esq - 16 && s.length > 4) { s = s.slice(0, -1); t.text(s + '…'); }
    });
  g.append('rect').attr('x', esq).attr('width', W - dir - esq).attr('y', (passo - alt) / 2).attr('height', alt).attr('rx', 4).attr('fill', 'var(--rb-trilho)');
  g.append('rect').attr('class', 'rb-barra')
    .attr('x', esq).attr('y', (passo - alt) / 2).attr('height', alt).attr('rx', 4)
    .attr('width', (o) => Math.max(4, x(o.dias) - esq))
    .attr('fill', (o) => corPrio(o.prioridade))
    .attr('stroke', (o) => (o.dias <= URGENTE ? 'var(--rb-dourado)' : 'none')).attr('stroke-width', 2)
    .on('mousemove', (ev, o) => tip.mostra(ev, linhasDica(o)))
    .on('mouseleave', () => tip.esconde());
  g.append('text').attr('class', (o) => (o.dias <= URGENTE ? 'rb-fim' : 'rb-fim rb-fim-suave'))
    .attr('x', (o) => Math.max(esq + 4, x(o.dias)) + 8).attr('y', passo / 2).attr('dy', '0.35em')
    .text(fimTxt);
});

// Cartões das chamadas abertas
dash.draw('cards-abertas', (caixa) => {
  const st = estado('oportunidades', 'prazos');
  caixa.classList.toggle('dash-skeleton', st === 'loading');
  if (st === 'error') return falha(caixa);
  caixa.replaceChildren();
  if (st !== 'ok') return;
  const linhas = juntar().filter(aberta).sort((a, b) => {
    const da = a.dias ?? 1e6, db = b.dias ?? 1e6;
    return da - db || (ORDEM_PRIO[a.prioridade] ?? 9) - (ORDEM_PRIO[b.prioridade] ?? 9);
  });
  for (const o of linhas) {
    const card = el('article', 'rb-card' + (o.dias !== null && o.dias <= URGENTE ? ' rb-urgente' : ''));
    const data = el('div', 'rb-data' + (o.prazo ? '' : ' rb-continuo'));
    if (o.prazo) data.append(el('span', 'rb-data-dia', o.prazo.slice(8, 10)), el('span', 'rb-data-mes', MESES[+o.prazo.slice(5, 7) - 1]));
    else data.append(el('span', 'rb-data-dia', 'Fluxo contínuo'));
    const corpo = el('div', 'rb-card-corpo');
    const cab = el('div', 'rb-card-cab');
    cab.append(el('span', 'rb-inst', o.pais && o.pais !== 'Vários' ? `${o.pais} · ${o.instituicao}` : o.instituicao));
    if (o.prioridade === 'Muito alta') cab.append(el('span', 'rb-selo rb-selo-p1', 'Prioridade muito alta'));
    else if (o.prioridade === 'Alta') cab.append(el('span', 'rb-selo rb-selo-p2', 'Prioridade alta'));
    const h = el('h3');
    if (o.url) {
      const a = el('a', null, o.programa);
      a.href = o.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      h.append(a);
    } else h.textContent = o.programa;
    corpo.append(cab, h, el('p', 'rb-card-valor', o.valor_texto), el('p', 'rb-card-nota', o.requisitos));
    const pe = el('div', 'rb-card-pe');
    if (o.dias !== null) pe.append(el('span', 'rb-selo ' + (o.dias <= URGENTE ? 'rb-selo-urg' : 'rb-selo-neutro'), faltam(o.dias)));
    else pe.append(el('span', 'rb-selo rb-selo-neutro', o.prazo_texto));
    if (o.url) {
      const a = el('a', 'rb-ext', 'Ver chamada');
      a.href = o.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      pe.append(a);
    }
    corpo.append(pe);
    card.append(data, corpo);
    caixa.append(card);
  }
});

// Tabela com filtros
const filtro = { regiao: '', finalidade: '', tipo: '', soGrad: true, busca: '', ordem: 'prazo', dir: 1 };
const CAMPOS = ['regiao', 'finalidade', 'tipo'];
const filtrar = (linhas) => {
  const q = filtro.busca.trim().toLowerCase();
  return linhas.filter((o) => CAMPOS.every((c) => !filtro[c] || o[c] === filtro[c])
    && (!filtro.soGrad || o.graduacao !== 'Não')
    && (!q || [o.programa, o.instituicao, o.sigla, o.pais, o.regiao, o.areas, o.requisitos, o.finalidade, o.observacao].join(' ').toLowerCase().includes(q)));
};
const ordenar = (linhas) => {
  const peso = (o) => (o.sit === 'Encerrada' || o.sit === 'Não se aplica' ? 2 : 0);
  const cmp = {
    programa: (a, b) => a.programa.localeCompare(b.programa, 'pt-BR'),
    prioridade: (a, b) => (ORDEM_PRIO[a.prioridade] ?? 9) - (ORDEM_PRIO[b.prioridade] ?? 9),
    prazo: (a, b) => peso(a) - peso(b) || (a.dias === null) - (b.dias === null) || (a.dias ?? 0) - (b.dias ?? 0),
  }[filtro.ordem];
  return [...linhas].sort((a, b) => filtro.dir * cmp(a, b) || a.programa.localeCompare(b.programa, 'pt-BR'));
};
const seloSit = (s) => (s === 'Aberta' ? 'rb-selo-ok' : s === 'Fluxo contínuo' ? 'rb-selo-p1' : s === 'Encerrada' ? 'rb-selo-neutro' : s === 'Não se aplica' ? 'rb-selo-neutro' : 'rb-selo-warn');
const ordemRegiao = (a, b) => {
  const ia = ORDEM_REGIAO.indexOf(a), ib = ORDEM_REGIAO.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'pt-BR');
};

dash.draw('tabela', (tbody) => {
  const st = estado('oportunidades', 'prazos');
  tbody.replaceChildren();
  if (st !== 'ok') return;
  for (const o of ordenar(filtrar(juntar()))) {
    const tr = el('tr', o.sit === 'Encerrada' || o.sit === 'Não se aplica' ? 'rb-fora' : '');
    tr.dataset.key = o.id;
    const prog = el('td', 'rb-prog');
    if (o.url) {
      const a = el('a', null, o.programa);
      a.href = o.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      prog.append(a);
    } else prog.textContent = o.programa;
    const sit = el('td');
    sit.append(el('span', 'rb-selo ' + seloSit(o.sit), o.sit));
    tr.append(prog, el('td', null, o.pais), el('td', 'rb-sec2', o.finalidade), el('td', 'rb-valor', o.valor_texto),
      el('td', 'rb-prazo', o.prazo_texto), el('td', 'rb-mono rb-dir', o.dias === null ? '' : String(o.dias)), sit,
      el('td', 'rb-sec2', o.graduacao), el('td', 'rb-sec2', o.prioridade), el('td', 'rb-sec2 rb-desc', o.requisitos));
    tbody.append(tr);
  }
});

// Seletores de região, finalidade e quem oferece: as opções vêm dos dados
const seletor = (nome, campo, todos) => dash.draw(nome, (sel) => {
  const d = dash.data('oportunidades');
  const vals = d.status === 'ok' ? [...new Set(d.data.map((o) => o[campo]).filter(Boolean))] : [];
  vals.sort(campo === 'regiao' ? ordemRegiao : (a, b) => a.localeCompare(b, 'pt-BR'));
  sel.replaceChildren(new Option(todos, ''), ...vals.map((v) => new Option(v, v)));
  sel.value = vals.includes(filtro[campo]) ? filtro[campo] : '';
});
seletor('sel-regiao', 'regiao', 'Todas as regiões');
seletor('sel-finalidade', 'finalidade', 'Tudo o que financiam');
seletor('sel-tipo', 'tipo', 'Todos os financiadores');

const atualizaTabela = () => {
  for (const sel of document.querySelectorAll('.rb-sel[data-campo]')) {
    sel.value = filtro[sel.dataset.campo] || '';
    sel.classList.toggle('rb-ativo', !!filtro[sel.dataset.campo]);
  }
  for (const b of document.querySelectorAll('.rb-limpar')) b.hidden = !(CAMPOS.some((c) => filtro[c]) || filtro.busca);
  dash.draw('tabela');
  for (const p of document.querySelectorAll('#tabela-vazio')) p.hidden = estado('oportunidades', 'prazos') !== 'ok' || filtrar(juntar()).length > 0;
};
for (const sel of document.querySelectorAll('.rb-sel[data-campo]')) {
  sel.addEventListener('change', () => { filtro[sel.dataset.campo] = sel.value; atualizaTabela(); });
}
for (const c of document.querySelectorAll('.rb-so-grad')) {
  c.addEventListener('change', () => { filtro.soGrad = c.checked; atualizaTabela(); });
}
for (const i of document.querySelectorAll('.rb-busca')) {
  i.addEventListener('input', () => { filtro.busca = i.value; atualizaTabela(); });
}
for (const b of document.querySelectorAll('.rb-limpar')) {
  b.addEventListener('click', () => {
    for (const c of CAMPOS) filtro[c] = '';
    filtro.busca = '';
    for (const i of document.querySelectorAll('.rb-busca')) i.value = '';
    atualizaTabela();
  });
}
for (const b of document.querySelectorAll('#tabela th button[data-ordem]')) {
  b.addEventListener('click', () => {
    const k = b.dataset.ordem;
    filtro.dir = filtro.ordem === k ? -filtro.dir : 1;
    filtro.ordem = k;
    for (const th of document.querySelectorAll('#tabela th')) {
      const bt = th.querySelector('button[data-ordem]');
      if (bt && bt.dataset.ordem === k) th.setAttribute('aria-sort', filtro.dir === 1 ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    }
    dash.draw('tabela');
  });
}

// Gráfico: programas por região (abertos e fechados no momento); um clique filtra a tabela
dash.draw('grafico-regioes', (caixa) => {
  const st = estado('oportunidades', 'prazos');
  caixa.classList.toggle('dash-skeleton', st === 'loading');
  if (st === 'error') return falha(caixa);
  caixa.replaceChildren();
  if (st !== 'ok') return;
  const elegiveis = juntar().filter((o) => o.graduacao !== 'Não' && o.sit !== 'Não se aplica');
  const linhas = [...new Set(elegiveis.map((o) => o.regiao).filter(Boolean))].sort(ordemRegiao).map((regiao) => {
    const daqui = elegiveis.filter((o) => o.regiao === regiao);
    const abertos = daqui.filter(aberta).length;
    return { regiao, abertos, fechados: daqui.length - abertos, total: daqui.length };
  });
  if (!linhas.length) return;
  const W = Math.max(260, caixa.clientWidth);
  const passo = 30, alt = 14, base = 4;
  const H = linhas.length * passo + base;
  const svg = d3.select(caixa).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Programas por região de destino');
  const mede = (cls, textos) => {
    const t = svg.append('text').attr('class', cls);
    let m = 0;
    for (const s of textos) { t.text(s); m = Math.max(m, t.node().getComputedTextLength()); }
    t.remove();
    return m;
  };
  const fimTxt = (r) => (r.abertos ? `${r.abertos} de ${r.total}` : String(r.total));
  const esq = Math.min(W * 0.45, mede('rb-rotulo', linhas.map((r) => r.regiao)) + 12);
  const dir = mede('rb-fim', linhas.map(fimTxt)) + 10;
  const x = d3.scaleLinear([0, d3.max(linhas, (r) => r.total)], [esq, W - dir]);
  const tip = dica(caixa);
  const g = svg.append('g').selectAll('g').data(linhas).join('g').attr('class', 'rb-alvo')
    .attr('transform', (r, i) => `translate(0, ${i * passo})`)
    .on('click', (ev, r) => {
      filtro.regiao = filtro.regiao === r.regiao ? '' : r.regiao;
      atualizaTabela();
      const alvo = document.getElementById('todas');
      if (alvo && filtro.regiao) { alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }); dash.setLink('todas'); }
    })
    .on('mousemove', (ev, r) => {
      const a = el('div', 'rb-dica-quando', r.regiao);
      const b = el('div', null, `Abertos agora: ${r.abertos}`);
      const c = el('div', null, `Fechados no momento: ${r.fechados}`);
      tip.mostra(ev, [a, b, c]);
    })
    .on('mouseleave', () => tip.esconde());
  g.append('rect').attr('x', 0).attr('width', W).attr('y', 0).attr('height', passo).attr('fill', 'transparent');
  g.append('text').attr('class', 'rb-rotulo').attr('x', esq - 12).attr('y', passo / 2).attr('dy', '0.35em').attr('text-anchor', 'end').text((r) => r.regiao);
  g.append('rect').attr('x', esq).attr('y', (passo - alt) / 2).attr('height', alt).attr('rx', 4)
    .attr('width', (r) => Math.max(3, x(r.total) - esq)).attr('fill', 'var(--rb-p3)');
  g.filter((r) => r.abertos > 0).append('rect').attr('x', esq).attr('y', (passo - alt) / 2).attr('height', alt).attr('rx', 4)
    .attr('width', (r) => Math.max(3, x(r.abertos) - esq)).attr('fill', 'var(--rb-p1)');
  g.append('text').attr('class', 'rb-fim').attr('x', (r) => x(r.total) + 8).attr('y', passo / 2).attr('dy', '0.35em').text(fimTxt);
});

// O que mudou
dash.draw('tabela-mudancas', (tbody) => {
  const d = dash.data('mudancas');
  tbody.replaceChildren();
  if (d.status !== 'ok') return;
  const linhas = [...d.data].sort((a, b) => (b.data > a.data ? 1 : b.data < a.data ? -1 : b.id.localeCompare(a.id)));
  for (const m of linhas) {
    const tr = el('tr');
    tr.dataset.key = m.id;
    tr.append(el('td', 'rb-mono', `${m.data.slice(8, 10)}/${m.data.slice(5, 7)}/${m.data.slice(0, 4)}`), el('td', null, m.oportunidade), el('td', 'rb-desc', m.descricao));
    tbody.append(tr);
  }
});

// Mostra e esconde os avisos de lista vazia
dash.onData(() => {
  const ok = estado('oportunidades', 'prazos') === 'ok';
  const linhas = ok ? juntar() : [];
  const datadas = linhas.filter((o) => o.graduacao !== 'Não' && o.dias !== null && o.dias >= 0);
  for (const p of document.querySelectorAll('#prazos-vazio')) p.hidden = !ok || datadas.length > 0;
  for (const p of document.querySelectorAll('#abertas-vazio')) p.hidden = !ok || linhas.some(aberta);
  for (const p of document.querySelectorAll('#tabela-vazio')) p.hidden = !ok || filtrar(linhas).length > 0;
});

// Os gráficos medem a largura da caixa: redesenha quando a largura muda.
let larguraAntes = window.innerWidth;
let espera = 0;
window.addEventListener('resize', () => {
  if (window.innerWidth === larguraAntes) return;
  larguraAntes = window.innerWidth;
  clearTimeout(espera);
  espera = setTimeout(() => { dash.redesenha('grafico-prazos'); dash.redesenha('grafico-regioes'); }, 150);
});

dash.carrega(['oportunidades', 'mudancas'], radarRaiz.dataset.base || '/assets/radar/');
})();
