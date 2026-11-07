/* K53 Learner's practice app. Vanilla JS, hash routing, progress kept in localStorage (guarded). */
(function () {
'use strict';

const QB = window.QB || [];
const SIGNS = window.SIGNS || {};
const NOTES = window.NOTES || [];
const BY_ID = Object.fromEntries(QB.map(q => [q.id, q]));

const SECTIONS = {
  controls: { name: 'Vehicle controls', short: 'Controls', mock: 8, pass: 6 },
  signs: { name: 'Signs, signals & markings', short: 'Signs', mock: 28, pass: 23 },
  rules: { name: 'Rules of the road', short: 'Rules', mock: 28, pass: 22 },
};
const SEC_ORDER = ['controls', 'signs', 'rules'];
const MOCK_MINUTES = 60;
const GROUP_NAMES = {
  control: 'Control', command: 'Command', prohibition: 'Prohibition', reservation: 'Reservation',
  comprehensive: 'Comprehensive', selective: 'Selective restriction', warning: 'Warning', information: 'Information & guidance',
};
const DAY = 864e5;
const BOX_DAYS = [0, 1, 3, 7, 16, 35];

/* ---------- storage ---------- */
const KEY = 'k53-progress-v1';
let store = { stats: {}, mocks: [], flash: {}, theme: 'system' };
try { const raw = localStorage.getItem(KEY); if (raw) store = Object.assign(store, JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } }

function stat(id) { return store.stats[id] || null; }
function record(id, ok) {
  const s = store.stats[id] || { n: 0, r: 0, w: 0, box: 0, due: 0, last: 0 };
  s.n++; s.last = Date.now();
  if (ok) { s.r++; s.box = Math.min(5, s.box + 1); s.lastOk = 1; }
  else { s.w++; s.box = 0; s.lastOk = 0; }
  s.due = Date.now() + BOX_DAYS[s.box] * DAY;
  store.stats[id] = s;
}
const mastered = id => { const s = stat(id); return !!s && s.box >= 3; };
const isWeak = id => { const s = stat(id); return !!s && s.w > 0 && s.box < 3; };
const isDue = id => { const s = stat(id); return !!s && s.box < 5 && s.due <= Date.now() && (s.w > 0 || s.box < 2); };

/* ---------- theme ---------- */
function applyTheme() {
  const t = store.theme;
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
}
applyTheme();

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const isMark = key => !SIGNS[key] && /^[mt]-/.test(key);
function imgSrc(key) { return isMark(key) ? `img/marks/${key}.svg` : `img/signs/${key}.png`; }
function imgAlt(key) { return SIGNS[key] ? SIGNS[key].name : key.replace(/^[mt]-/, '').replace(/-/g, ' '); }
const LETTERS = ['A', 'B', 'C', 'D'];
function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
function fmtTime(sec) { sec = Math.max(0, sec); const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }
function fmtDate(t) { try { return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}
/* Questions about the same sign share a "family" so a test never asks both versions. */
function family(q) {
  if (q.img) return 'sign:' + q.img;
  const c = q.opts.find(o => o.c);
  if (q.auto && c && c.t.startsWith('img:')) return 'sign:' + c.t.slice(4);
  return q.id;
}
function sectionQs(sec) { return QB.filter(q => q.section === sec); }
function topicsOf(sec) {
  const m = new Map();
  sectionQs(sec).forEach(q => m.set(q.topic, (m.get(q.topic) || 0) + 1));
  return [...m.entries()];
}

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  mock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
  signs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5" stroke-linecap="round"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M8 7h6"/></svg>',
  review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  flash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 2h12a2 2 0 012 2v12"/></svg>',
};

/* ---------- shell ---------- */
const NAV = [['home', 'Home'], ['practice', 'Practice'], ['mock', 'Mock test'], ['signs', 'Signs'], ['notes', 'Notes'], ['progress', 'Progress']];
const TABS = [['home', 'Home'], ['practice', 'Practice'], ['mock', 'Mock'], ['signs', 'Signs'], ['notes', 'Notes']];
function navKey(view) {
  return ({ quiz: 'practice', review: 'practice', test: 'mock', results: 'mock', flashcards: 'signs' })[view] || view;
}
function shell() {
  document.body.insertAdjacentHTML('afterbegin', `
  <header class="topbar"><div class="topbar-inner">
    <a class="brand" href="#home"><span class="plate" aria-hidden="true">L</span>K53 Learner's</a>
    <nav class="nav" aria-label="Main">${NAV.map(([k, n]) => `<a href="#${k}" data-nav="${k}">${n}</a>`).join('')}</nav>
  </div></header>
  <main id="main" tabindex="-1"></main>
  <nav class="tabbar" aria-label="Main">${TABS.map(([k, n]) => `<a href="#${k}" data-nav="${k}">${ICONS[k === 'mock' ? 'mock' : k]}<span>${n}</span></a>`).join('')}</nav>`);
}
function setNav(view) {
  const k = navKey(view);
  document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}

/* ---------- session state (in memory) ---------- */
let quiz = null;   // practice session
let test = null;   // mock test
let lastResult = null;
let timerHandle = null;
let flashState = null;

/* ---------- router ---------- */
const VIEWS = {};
function go(view) { if (location.hash === '#' + view) route(); else location.hash = view; }
function route() {
  if (timerHandle && (location.hash.slice(1) !== 'test')) { clearInterval(timerHandle); timerHandle = null; }
  let view = location.hash.slice(1) || 'home';
  if (!VIEWS[view]) view = 'home';
  if (view === 'quiz' && !quiz) view = 'practice';
  if (view === 'test' && !test) view = 'mock';
  if (view === 'results' && !lastResult) view = 'mock';
  if (view === 'flashcards' && !flashState) view = 'signs';
  setNav(view);
  const main = $('#main');
  main.innerHTML = '';
  VIEWS[view](main);
  window.scrollTo(0, 0);
}

/* ---------- Home ---------- */
VIEWS.home = main => {
  const secs = SEC_ORDER.map(k => {
    const qs = sectionQs(k), m = qs.filter(q => mastered(q.id)).length, seen = qs.filter(q => stat(q.id)).length;
    return `<div class="secbox"><span class="eyebrow">${SECTIONS[k].short}</span>
      <span class="num">${m}<span class="muted small"> / ${qs.length}</span></span>
      <div class="meter ${pct(m, qs.length) >= 80 ? 'good' : ''}"><i style="width:${pct(m, qs.length)}%"></i></div>
      <span class="small muted">mastered · ${seen} seen</span></div>`;
  }).join('');
  const due = QB.filter(q => isDue(q.id)).length;
  const last = store.mocks[store.mocks.length - 1];
  main.innerHTML = `
  <section class="hero">
    <div class="stack">
      <span class="eyebrow">Code 2 · light motor vehicle</span>
      <h1>Pass your learner's test</h1>
      <p class="muted">${QB.length} practice questions built from the official Department of Transport learner manuals, plus a timed mock of the computerised test: 64 questions in three sections, each of which you must pass on its own.</p>
    </div>
    <img class="sign" src="img/signs/stop.png" alt="">
  </section>
  <section class="actions">
    <a class="action main" href="#mock"><span class="ico">${ICONS.mock}</span><span><b>Mock test</b><span>8 controls, 28 signs, 28 rules · ${MOCK_MINUTES} min${last ? ` · last: ${last.pass ? 'passed' : 'not passed'}` : ''}</span></span></a>
    <button class="action" data-act="review"><span class="ico">${ICONS.review}</span><span><b>Smart review</b><span>${due ? `${due} question${due === 1 ? '' : 's'} due for another look` : 'Questions you get wrong come back here'}</span></span></button>
    <a class="action" href="#practice"><span class="ico">${ICONS.practice}</span><span><b>Practise by topic</b><span>Instant feedback with the rule behind each answer</span></span></a>
    <a class="action" href="#signs"><span class="ico">${ICONS.signs}</span><span><b>Sign gallery</b><span>${Object.keys(SIGNS).length} signs from the manual, with flashcards</span></span></a>
  </section>
  <section class="stack"><h2>Your progress</h2><div class="sections">${secs}</div>
    <p class="small muted">A question counts as mastered after you answer it correctly three times in a row, spaced out over days. <a href="#progress">Full progress</a> · <a href="#notes">Revision notes</a></p>
  </section>`;
  main.querySelector('[data-act="review"]').onclick = startReview;
};

/* ---------- Practice setup ---------- */
let practiceSec = 'all';
let practiceLen = 20;
VIEWS.practice = main => {
  const secBtns = [['all', 'All'], ...SEC_ORDER.map(k => [k, SECTIONS[k].short])]
    .map(([k, n]) => `<button aria-pressed="${practiceSec === k}" data-sec="${k}">${n}</button>`).join('');
  const lenBtns = [10, 20, 40, 0].map(n => `<button aria-pressed="${practiceLen === n}" data-len="${n}">${n || 'All'}</button>`).join('');
  const secs = practiceSec === 'all' ? SEC_ORDER : [practiceSec];
  const topicRows = secs.map(sec => {
    const rows = topicsOf(sec).map(([t, n]) => {
      const ids = sectionQs(sec).filter(q => q.topic === t).map(q => q.id);
      const m = ids.filter(mastered).length;
      return `<button class="topic" data-topic="${esc(t)}" data-tsec="${sec}"><span><b>${esc(t)}</b></span><span class="cnt">${m}/${n} mastered</span><div class="meter ${pct(m, n) >= 80 ? 'good' : ''}"><i style="width:${pct(m, n)}%"></i></div></button>`;
    }).join('');
    return `<div class="stack"><span class="eyebrow">${SECTIONS[sec].name}</span><div class="topics">${rows}</div></div>`;
  }).join('');
  const weak = QB.filter(q => isWeak(q.id)).length;
  main.innerHTML = `
  <div class="stack"><h1>Practise</h1><p class="muted">Pick a section or a single topic. You see the right answer and the rule behind it straight after each question. Unseen and weak questions come first.</p></div>
  <div class="stack">
    <div class="row"><span class="eyebrow" style="min-width:70px">Section</span><div class="segmented" role="group" aria-label="Section">${secBtns}</div></div>
    <div class="row"><span class="eyebrow" style="min-width:70px">Length</span><div class="segmented" role="group" aria-label="Number of questions">${lenBtns}</div></div>
    <div class="row"><button class="btn primary" data-act="start">Start ${practiceSec === 'all' ? 'mixed' : SECTIONS[practiceSec].short.toLowerCase()} practice</button>
    <button class="btn" data-act="review" ${weak ? '' : 'disabled'}>Practise my ${weak} weak question${weak === 1 ? '' : 's'}</button></div>
  </div>
  ${topicRows}`;
  main.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => { practiceSec = b.dataset.sec; route(); });
  main.querySelectorAll('[data-len]').forEach(b => b.onclick = () => { practiceLen = +b.dataset.len; route(); });
  main.querySelector('[data-act="start"]').onclick = () => {
    const pool = practiceSec === 'all' ? QB : sectionQs(practiceSec);
    startQuiz(pickPractice(pool, practiceLen), practiceSec === 'all' ? 'Mixed practice' : SECTIONS[practiceSec].name);
  };
  main.querySelector('[data-act="review"]').onclick = () => {
    const pool = shuffle(QB.filter(q => isWeak(q.id)));
    startQuiz(dedupe(pool).slice(0, practiceLen || pool.length), 'Weak questions');
  };
  main.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => {
    const pool = sectionQs(b.dataset.tsec).filter(q => q.topic === b.dataset.topic);
    startQuiz(pickPractice(pool, practiceLen), b.dataset.topic);
  });
};
function dedupe(list) { const seen = new Set(); return list.filter(q => { const f = family(q); if (seen.has(f)) return false; seen.add(f); return true; }); }
/* Priority: due/weak, then unseen, then the rest by least recently seen; light shuffle within tiers. */
function pickPractice(pool, n) {
  const tier = q => { const s = stat(q.id); if (!s) return 1; if (isDue(q.id) || isWeak(q.id)) return 0; return 2 + s.box; };
  const sorted = shuffle(pool).sort((a, b) => tier(a) - tier(b) || ((stat(a.id) || {}).last || 0) - ((stat(b.id) || {}).last || 0));
  const picked = dedupe(sorted).slice(0, n || pool.length);
  return shuffle(picked);
}
function startReview() {
  let pool = QB.filter(q => isDue(q.id));
  if (!pool.length) pool = QB.filter(q => isWeak(q.id));
  if (!pool.length) { toast('Nothing to review yet. Practise or take a mock test first.'); go('practice'); return; }
  pool = dedupe(shuffle(pool).sort((a, b) => stat(a.id).due - stat(b.id).due)).slice(0, 25);
  startQuiz(shuffle(pool), 'Smart review');
}

/* ---------- Question rendering (shared) ---------- */
function prepQuestion(q) {
  const order = q.fixed ? q.opts.map((_, i) => i) : shuffle(q.opts.map((_, i) => i));
  return { id: q.id, order, answer: null };
}
function questionHTML(q, item, mode) {
  const optsAreImgs = q.opts.every(o => o.t.startsWith('img:'));
  let img = '';
  if (q.diagram === 'auto') img = `<figure class="qimg diagram" style="margin:0"><img src="img/ui/controls-auto.jpg" alt="Numbered diagram of an automatic car's controls (1 to 11, no 8)"></figure>`;
  else if (q.diagram) img = `<figure class="qimg diagram" style="margin:0"><img src="img/ui/controls-manual.jpg" alt="Numbered diagram of a manual car's controls (1 to 11)"></figure>`;
  else if (q.img) img = `<figure class="qimg ${isMark(q.img) ? 'svg' : ''}" style="margin:0"><img src="${imgSrc(q.img)}" alt="The sign or marking in question"></figure>`;
  const answered = item.answer !== null && mode === 'practice';
  const opts = item.order.map((oi, pos) => {
    const o = q.opts[oi];
    let cls = 'opt';
    if (answered) { if (o.c) cls += ' right'; else if (item.answer === oi) cls += ' wrong'; }
    else if (item.answer === oi) cls += ' sel';
    const body = o.t.startsWith('img:') ? `<img src="${imgSrc(o.t.slice(4))}" alt="Option ${LETTERS[pos]}">` : `<span>${esc(o.t)}</span>`;
    return `<button class="${cls}" data-opt="${oi}" ${answered ? 'disabled' : ''} aria-pressed="${item.answer === oi}"><span class="key">${LETTERS[pos]}</span>${body}</button>`;
  }).join('');
  return `<div class="qcard">
    ${img}
    <p class="qtext">${esc(q.q)}</p>
    <div class="opts ${optsAreImgs ? 'imgs' : ''}">${opts}</div>
    ${answered ? feedbackHTML(q, item) : ''}
  </div>`;
}
function feedbackHTML(q, item) {
  const ok = q.opts[item.answer].c;
  const rightPos = item.order.findIndex(oi => q.opts[oi].c);
  return `<div class="feedback ${ok ? 'good' : 'bad'}" role="status">
    <b>${ok ? 'Correct' : 'Not quite'}</b>
    ${ok ? '' : `<p>The correct answer is <strong>${LETTERS[rightPos]}</strong>.</p>`}
    ${q.exp ? `<p>${esc(q.exp)}</p>` : ''}
    ${q.src ? `<p class="src">Source: ${esc(q.src)}</p>` : ''}
  </div>`;
}

/* ---------- Practice quiz ---------- */
function startQuiz(list, title) {
  if (!list.length) { toast('No questions to practise here.'); return; }
  quiz = { title, items: list.map(prepQuestion), i: 0, right: 0, done: 0 };
  go('quiz');
}
VIEWS.quiz = main => {
  if (quiz.i >= quiz.items.length) return quizSummary(main);
  const item = quiz.items[quiz.i], q = BY_ID[item.id];
  main.innerHTML = `
  <div class="stack">
    <div class="qhead"><span class="pill ${q.section}">${SECTIONS[q.section].short} · ${esc(q.topic)}</span>
      <span class="small muted">Question ${quiz.i + 1} of ${quiz.items.length} · ${quiz.right} right</span></div>
    <div class="progressline"><i style="width:${pct(quiz.i, quiz.items.length)}%"></i></div>
  </div>
  <div id="qbox">${questionHTML(q, item, 'practice')}</div>
  <div class="qnav"><button class="btn ghost" data-act="end">End session</button>
    <button class="btn primary" data-act="next" ${item.answer === null ? 'hidden' : ''}>${quiz.i + 1 < quiz.items.length ? 'Next question' : 'See summary'}</button></div>
  <p class="small muted kbd-hint">Keys: 1, 2, 3 (or A, B, C) to answer · Enter for next.</p>`;
  bindQuiz(main);
};
function bindQuiz(main) {
  const item = quiz.items[quiz.i], q = BY_ID[item.id];
  main.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
    if (item.answer !== null) return;
    item.answer = +b.dataset.opt;
    const ok = !!q.opts[item.answer].c;
    record(q.id, ok); save();
    quiz.done++; if (ok) quiz.right++;
    $('#qbox').innerHTML = questionHTML(q, item, 'practice');
    const next = main.querySelector('[data-act="next"]'); next.hidden = false; next.focus({ preventScroll: true });
    $('#qbox .feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  main.querySelector('[data-act="next"]').onclick = () => { quiz.i++; route(); };
  main.querySelector('[data-act="end"]').onclick = () => { quiz.items = quiz.items.slice(0, quiz.done); quiz.i = quiz.items.length; route(); };
}
function quizSummary(main) {
  const n = quiz.done, wrong = quiz.items.filter(it => it.answer !== null && !BY_ID[it.id].opts[it.answer].c);
  main.innerHTML = `
  <div class="stack"><span class="eyebrow">${esc(quiz.title)}</span><h1>${n ? `${quiz.right} of ${n} right (${pct(quiz.right, n)}%)` : 'Session ended'}</h1>
  <p class="muted">${n ? (pct(quiz.right, n) >= 82 ? 'That is around the pass level of the real test. Keep going.' : 'The real test needs roughly 80% in every section. The questions you missed will come back in smart review.') : 'No questions answered.'}</p></div>
  <div class="row"><button class="btn primary" data-act="again">Practise more</button>${wrong.length ? `<button class="btn" data-act="redo">Retry the ${wrong.length} I missed</button>` : ''}<a class="btn ghost" href="#home">Home</a></div>
  ${wrong.length ? `<div class="stack"><h2>Missed questions</h2>${wrong.map(it => reviewItemHTML(BY_ID[it.id], it.answer)).join('')}</div>` : ''}`;
  main.querySelector('[data-act="again"]').onclick = () => go('practice');
  const redo = main.querySelector('[data-act="redo"]');
  if (redo) redo.onclick = () => startQuiz(shuffle(wrong.map(it => BY_ID[it.id])), 'Retry missed');
}
function optText(o) { return o.t.startsWith('img:') ? `<img class="thumb" src="${imgSrc(o.t.slice(4))}" alt="${esc(imgAlt(o.t.slice(4)))}">` : esc(o.t); }
function reviewItemHTML(q, ans) {
  const right = q.opts.find(o => o.c);
  let pic = '';
  if (q.diagram) pic = `<img class="thumb" src="img/ui/controls-${q.diagram === 'auto' ? 'auto' : 'manual'}.jpg" alt="Controls diagram" style="max-height:120px">`;
  else if (q.img) pic = `<img class="thumb" src="${imgSrc(q.img)}" alt="">`;
  return `<div class="review-item"><span class="pill ${q.section}" style="align-self:flex-start">${SECTIONS[q.section].short} · ${esc(q.topic)}</span>
    ${pic}<p><b>${esc(q.q)}</b></p>
    ${ans === null || ans === undefined ? '<p class="muted small">Not answered</p>' : (q.opts[ans].c ? '' : `<p class="small">Your answer: <span class="ans-wrong">${optText(q.opts[ans])}</span></p>`)}
    <p class="small">Correct: <span class="ans-right">${optText(right)}</span></p>
    ${q.exp ? `<p class="small muted">${esc(q.exp)}</p>` : ''}${q.src ? `<p class="src">Source: ${esc(q.src)}</p>` : ''}</div>`;
}
VIEWS.review = main => { startReview(); };

/* ---------- Mock test ---------- */
VIEWS.mock = main => {
  const hist = store.mocks.slice(-5).reverse();
  main.innerHTML = `
  <div class="stack"><span class="eyebrow">Computerised learner's licence test</span><h1>Mock test</h1>
  <p class="muted">Like the real test: 64 questions, three options each, drawn at random. You must pass every section separately. Answers are only marked at the end, and you can flag questions and jump back to them.</p></div>
  <div class="tablewrap"><table class="restable"><thead><tr><th>Section</th><th class="n" style="text-align:right">Questions</th><th class="n" style="text-align:right">Pass mark</th></tr></thead><tbody>
    ${SEC_ORDER.map(k => `<tr><td>${SECTIONS[k].name}</td><td class="n">${SECTIONS[k].mock}</td><td class="n">${SECTIONS[k].pass} (${pct(SECTIONS[k].pass, SECTIONS[k].mock)}%)</td></tr>`).join('')}
    <tr><td><b>Total</b></td><td class="n"><b>64</b></td><td class="n">${MOCK_MINUTES} min</td></tr></tbody></table></div>
  <p class="small muted">The section sizes and pass marks are the ones the RTMC and testing centres publish for the computerised test. The ${MOCK_MINUTES}-minute limit is the commonly reported figure, not an official one.</p>
  <div class="row"><button class="btn primary" data-act="start">Start mock test</button>${test ? '<button class="btn" data-act="resume">Resume current test</button>' : ''}</div>
  ${hist.length ? `<div class="stack"><h2>Recent attempts</h2><div class="tablewrap"><table class="restable"><thead><tr><th>Date</th>${SEC_ORDER.map(k => `<th class="n" style="text-align:right">${SECTIONS[k].short}</th>`).join('')}<th>Result</th></tr></thead><tbody>
    ${hist.map(m => `<tr><td>${fmtDate(m.date)}</td>${SEC_ORDER.map(k => `<td class="n">${m.score[k]}/${SECTIONS[k].mock}</td>`).join('')}<td><span class="badge ${m.pass ? 'pass' : 'fail'}">${m.pass ? 'Pass' : 'Fail'}</span></td></tr>`).join('')}
  </tbody></table></div></div>` : ''}`;
  main.querySelector('[data-act="start"]').onclick = startTest;
  const r = main.querySelector('[data-act="resume"]'); if (r) r.onclick = () => go('test');
};
function buildMock() {
  const out = [];
  // Controls: 8, at least 6 diagram questions (the real test shows a numbered controls picture).
  const ctrl = sectionQs('controls');
  const diag = shuffle(ctrl.filter(q => q.diagram)).slice(0, 6);
  const rest = shuffle(ctrl.filter(q => !diag.includes(q))).slice(0, 2);
  out.push(...shuffle([...diag, ...rest]));
  // Signs: 28, mostly picture questions, no two questions on the same sign.
  const signs = sectionQs('signs');
  const picture = dedupe(shuffle(signs.filter(q => q.auto)));
  const other = shuffle(signs.filter(q => !q.auto));
  const fams = new Set();
  const take = (list, n, acc) => { for (const q of list) { if (acc.length >= n) break; const f = family(q); if (fams.has(f)) continue; fams.add(f); acc.push(q); } return acc; };
  const s = take(picture, 16, []);
  take(other, 28, s);
  out.push(...shuffle(s));
  // Rules: 28
  out.push(...shuffle(sectionQs('rules')).slice(0, 28));
  return out;
}
function startTest() {
  const list = buildMock();
  test = { items: list.map(prepQuestion), i: 0, flags: new Set(), started: Date.now(), ends: Date.now() + MOCK_MINUTES * 60e3, confirm: false };
  go('test');
}
VIEWS.test = main => {
  const item = test.items[test.i], q = BY_ID[item.id];
  const answered = test.items.filter(it => it.answer !== null).length;
  let gridHTML = '', last = '';
  test.items.forEach((it, idx) => {
    const sec = BY_ID[it.id].section;
    if (sec !== last) { gridHTML += `<span class="sep">${SECTIONS[sec].short}</span>`; last = sec; }
    gridHTML += `<button data-go="${idx}" class="${it.answer !== null ? 'done' : ''} ${test.flags.has(idx) ? 'flagged' : ''} ${idx === test.i ? 'cur' : ''}" aria-label="Question ${idx + 1}${it.answer !== null ? ', answered' : ''}${test.flags.has(idx) ? ', flagged' : ''}">${idx + 1}</button>`;
  });
  main.innerHTML = `
  <div class="stack">
    <div class="qhead"><span class="pill ${q.section}">${SECTIONS[q.section].name}</span><span class="timer" id="timer" aria-live="off">--:--</span></div>
    <div class="qhead"><span class="small muted">Question ${test.i + 1} of ${test.items.length} · ${answered} answered</span>
    <button class="flag" data-act="flag" aria-pressed="${test.flags.has(test.i)}">${test.flags.has(test.i) ? 'Flagged' : 'Flag for later'}</button></div>
    <div class="progressline"><i style="width:${pct(answered, test.items.length)}%"></i></div>
  </div>
  <div id="qbox">${questionHTML(q, item, 'test')}</div>
  <div class="qnav"><button class="btn" data-act="prev" ${test.i === 0 ? 'disabled' : ''}>Previous</button>
    <button class="btn primary" data-act="next">${test.i + 1 < test.items.length ? 'Next' : 'Review & finish'}</button></div>
  <details class="panel" ${test.gridOpen ? 'open' : ''}><summary>All questions (${answered}/${test.items.length} answered, ${test.flags.size} flagged)</summary><div class="grid-nav" style="margin-top:12px">${gridHTML}</div></details>
  <div id="finish">${finishHTML(answered)}</div>`;
  main.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
    item.answer = +b.dataset.opt;
    $('#qbox').innerHTML = questionHTML(q, item, 'test');
    route.soft();
  });
  main.querySelector('[data-act="flag"]').onclick = () => { test.flags.has(test.i) ? test.flags.delete(test.i) : test.flags.add(test.i); route.soft(); };
  main.querySelector('[data-act="prev"]').onclick = () => { test.i--; route(); };
  main.querySelector('[data-act="next"]').onclick = () => { if (test.i + 1 < test.items.length) { test.i++; route(); } else { test.confirm = true; route.soft(); $('#finish').scrollIntoView({ behavior: 'smooth' }); } };
  main.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { test.i = +b.dataset.go; test.gridOpen = true; route(); });
  main.querySelector('details.panel').ontoggle = e => { test.gridOpen = e.target.open; };
  bindFinish(main);
  tick();
  if (!timerHandle) timerHandle = setInterval(tick, 1000);
};
function finishHTML(answered) {
  const left = test.items.length - answered;
  if (!test.confirm) return `<div class="row"><button class="btn ghost" data-act="ask-finish">Finish test</button></div>`;
  return `<div class="confirm"><b>Finish and mark the test?</b><p class="small">${left ? `${left} question${left === 1 ? ' is' : 's are'} unanswered and will be marked wrong. ` : 'All questions answered. '}${test.flags.size ? `${test.flags.size} flagged.` : ''}</p>
  <div class="row"><button class="btn primary" data-act="finish">Mark my test</button><button class="btn ghost" data-act="cancel-finish">Keep going</button></div></div>`;
}
function bindFinish(main) {
  const a = main.querySelector('[data-act="ask-finish"]'); if (a) a.onclick = () => { test.confirm = true; route.soft(); };
  const f = main.querySelector('[data-act="finish"]'); if (f) f.onclick = () => finishTest(false);
  const c = main.querySelector('[data-act="cancel-finish"]'); if (c) c.onclick = () => { test.confirm = false; route.soft(); };
}
/* Re-render the current test view without resetting scroll. */
route.soft = () => { const y = window.scrollY; const main = $('#main'); main.innerHTML = ''; VIEWS.test(main); window.scrollTo(0, y); };
function tick() {
  if (!test) return;
  const left = Math.round((test.ends - Date.now()) / 1000);
  const el = $('#timer');
  if (el) { el.textContent = fmtTime(left); el.classList.toggle('low', left < 300); el.setAttribute('aria-label', `${Math.ceil(left / 60)} minutes left`); }
  if (left <= 0) finishTest(true);
}
function finishTest(timeUp) {
  clearInterval(timerHandle); timerHandle = null;
  const score = { controls: 0, signs: 0, rules: 0 };
  test.items.forEach(it => {
    const q = BY_ID[it.id], ok = it.answer !== null && !!q.opts[it.answer].c;
    if (ok) score[q.section]++;
    if (it.answer !== null) record(q.id, ok);
  });
  const secPass = Object.fromEntries(SEC_ORDER.map(k => [k, score[k] >= SECTIONS[k].pass]));
  const pass = SEC_ORDER.every(k => secPass[k]);
  const rec = { date: Date.now(), score, pass, mins: Math.round((Date.now() - test.started) / 60e3) };
  store.mocks.push(rec); store.mocks = store.mocks.slice(-50); save();
  lastResult = { rec, secPass, timeUp, items: test.items };
  test = null;
  go('results');
}
VIEWS.results = main => {
  const { rec, secPass, timeUp, items } = lastResult;
  const wrong = items.filter(it => it.answer === null || !BY_ID[it.id].opts[it.answer].c);
  const failed = SEC_ORDER.filter(k => !secPass[k]).map(k => SECTIONS[k].short.toLowerCase());
  main.innerHTML = `
  <div class="result-banner ${rec.pass ? 'pass' : 'fail'}"><span class="eyebrow" style="color:inherit;opacity:.85">${timeUp ? 'Time up · ' : ''}Mock test result</span>
    <h2>${rec.pass ? 'Pass' : 'Not yet a pass'}</h2>
    <p>${rec.pass ? 'You passed all three sections. Do a few more mock tests to make sure it is consistent.' : `You need to pass every section. Work on: ${failed.join(', ')}.`}</p></div>
  <div class="tablewrap"><table class="restable"><thead><tr><th>Section</th><th class="n" style="text-align:right">Score</th><th class="n" style="text-align:right">Needed</th><th>Result</th></tr></thead><tbody>
  ${SEC_ORDER.map(k => `<tr><td>${SECTIONS[k].name}</td><td class="n">${rec.score[k]}/${SECTIONS[k].mock}</td><td class="n">${SECTIONS[k].pass}</td><td><span class="badge ${secPass[k] ? 'pass' : 'fail'}">${secPass[k] ? 'Pass' : 'Fail'}</span></td></tr>`).join('')}
  </tbody></table></div>
  <p class="small muted">Time used: ${Math.min(rec.mins, MOCK_MINUTES)} min. Missed questions have been added to smart review.</p>
  <div class="row"><button class="btn primary" data-act="new">New mock test</button>${wrong.length ? `<button class="btn" data-act="redo">Practise the ${wrong.length} I missed</button>` : ''}<a class="btn ghost" href="#home">Home</a></div>
  ${wrong.length ? `<div class="stack"><h2>Review your mistakes</h2>${wrong.map(it => reviewItemHTML(BY_ID[it.id], it.answer)).join('')}</div>` : ''}`;
  main.querySelector('[data-act="new"]').onclick = startTest;
  const r = main.querySelector('[data-act="redo"]'); if (r) r.onclick = () => startQuiz(shuffle(wrong.map(it => BY_ID[it.id])), 'Mock test mistakes');
};

/* ---------- Signs gallery ---------- */
let signGroup = 'all', signQuery = '', signHide = false;
VIEWS.signs = main => {
  const groups = ['all', ...Object.keys(GROUP_NAMES).filter(g => Object.values(SIGNS).some(s => s.group === g))];
  main.innerHTML = `
  <div class="stack"><h1>Road signs</h1><p class="muted">Every sign here is taken from the Department of Transport's learner manual. Regulatory signs (control, command, prohibition, reservation) must be obeyed; warning signs tell you about a hazard ahead; information and guidance signs help you find your way.</p></div>
  <div class="segmented" role="group" aria-label="Sign group">${groups.map(g => `<button aria-pressed="${signGroup === g}" data-g="${g}">${g === 'all' ? 'All' : GROUP_NAMES[g]}</button>`).join('')}</div>
  <div class="searchbar"><input type="search" placeholder="Search signs, e.g. yield, parking, R201" value="${esc(signQuery)}" aria-label="Search signs">
    <button class="btn" data-act="hide" aria-pressed="${signHide}">${signHide ? 'Show names' : 'Hide names (test yourself)'}</button>
    <button class="btn primary" data-act="flash">${ICONS.flash.replace('<svg', '<svg width="18" height="18"')} Flashcards</button></div>
  <div class="signgrid" id="signgrid"></div>`;
  const draw = () => {
    const qy = signQuery.trim().toLowerCase();
    const list = Object.entries(SIGNS).filter(([k, s]) => (signGroup === 'all' || s.group === signGroup) &&
      (!qy || (s.name + ' ' + s.meaning + ' ' + s.code).toLowerCase().includes(qy)));
    $('#signgrid').innerHTML = list.length ? list.map(([k, s]) => `
      <button class="signcard ${signHide ? 'hide-text' : ''}" data-k="${k}" aria-label="${esc(s.name)}"><span class="pic"><img src="img/signs/${k}.png" alt="" loading="lazy"></span>
      <span class="code">${esc(s.code)} · ${GROUP_NAMES[s.group] || s.group}</span><b>${esc(s.name)}</b><span class="mean">${esc(s.meaning)}</span></button>`).join('')
      : '<p class="empty">No signs match that search.</p>';
    $('#signgrid').querySelectorAll('.signcard').forEach(c => c.onclick = () => { if (signHide) c.classList.toggle('hide-text'); });
  };
  draw();
  const input = main.querySelector('input');
  input.oninput = () => { signQuery = input.value; draw(); };
  main.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { signGroup = b.dataset.g; route(); });
  main.querySelector('[data-act="hide"]').onclick = () => { signHide = !signHide; route(); };
  main.querySelector('[data-act="flash"]').onclick = () => {
    const keys = Object.keys(SIGNS).filter(k => signGroup === 'all' || SIGNS[k].group === signGroup);
    // Signs you don't know yet come first.
    const order = shuffle(keys).sort((a, b) => (store.flash[a] || 0) - (store.flash[b] || 0));
    flashState = { keys: order, i: 0, show: false, known: 0, group: signGroup };
    go('flashcards');
  };
};
VIEWS.flashcards = main => {
  const f = flashState;
  if (f.i >= f.keys.length) {
    main.innerHTML = `<div class="stack"><h1>Flashcards done</h1><p class="muted">You knew ${f.known} of ${f.keys.length} signs.</p>
      <div class="row"><button class="btn primary" data-act="again">Go again</button><a class="btn ghost" href="#signs">Back to signs</a></div></div>`;
    main.querySelector('[data-act="again"]').onclick = () => { f.keys = shuffle(f.keys).sort((a, b) => (store.flash[a] || 0) - (store.flash[b] || 0)); f.i = 0; f.known = 0; f.show = false; route(); };
    return;
  }
  const k = f.keys[f.i], s = SIGNS[k];
  main.innerHTML = `
  <div class="qhead"><span class="pill signs">${f.group === 'all' ? 'All signs' : GROUP_NAMES[f.group]}</span><span class="small muted">Card ${f.i + 1} of ${f.keys.length} · knew ${f.known}</span></div>
  <div class="flash"><div class="pic"><img src="img/signs/${k}.png" alt="A road sign"></div>
    ${f.show ? `<span class="code small muted">${esc(s.code)} · ${GROUP_NAMES[s.group]}</span><h2>${esc(s.name)}</h2><p>${esc(s.meaning)}</p>
      <div class="row" style="justify-content:center"><button class="btn" data-act="no">Didn't know it</button><button class="btn primary" data-act="yes">Knew it</button></div>`
    : `<p class="muted">What does this sign mean? Say it out loud, then check.</p><button class="btn primary" data-act="show">Show the answer</button>`}
  </div>
  <div class="row" style="justify-content:center"><a class="btn ghost" href="#signs">Stop</a></div>`;
  const b = a => main.querySelector(`[data-act="${a}"]`);
  if (b('show')) b('show').onclick = () => { f.show = true; route(); };
  if (b('yes')) b('yes').onclick = () => { store.flash[k] = (store.flash[k] || 0) + 1; save(); f.known++; f.i++; f.show = false; route(); };
  if (b('no')) b('no').onclick = () => { store.flash[k] = 0; save(); f.i++; f.show = false; route(); };
};

/* ---------- Notes ---------- */
VIEWS.notes = main => {
  main.innerHTML = `
  <div class="stack"><h1>Revision notes</h1><p class="muted">The facts the test asks about most, condensed from the three official manuals and checked against changes since 2012.</p></div>
  <nav class="notes-toc" aria-label="Sections">${NOTES.map(n => `<a href="#notes" data-jump="${n.id}">${esc(n.title)}</a>`).join('')}</nav>
  ${NOTES.map(n => `<section class="note" id="note-${n.id}"><h2>${esc(n.title)}</h2>${n.html}</section>`).join('')}`;
  main.querySelectorAll('[data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); const t = document.getElementById('note-' + a.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth' }); });
};

/* ---------- Progress ---------- */
VIEWS.progress = main => {
  const rows = SEC_ORDER.map(k => {
    const qs = sectionQs(k), seen = qs.filter(q => stat(q.id));
    const r = seen.reduce((a, q) => a + stat(q.id).r, 0), n = seen.reduce((a, q) => a + stat(q.id).n, 0);
    return `<tr><td>${SECTIONS[k].name}</td><td class="n">${seen.length}/${qs.length}</td><td class="n">${qs.filter(q => mastered(q.id)).length}</td><td class="n">${n ? pct(r, n) + '%' : '–'}</td></tr>`;
  }).join('');
  const weakTopics = [];
  SEC_ORDER.forEach(k => topicsOf(k).forEach(([t]) => {
    const qs = sectionQs(k).filter(q => q.topic === t && stat(q.id));
    const r = qs.reduce((a, q) => a + stat(q.id).r, 0), n = qs.reduce((a, q) => a + stat(q.id).n, 0);
    if (n >= 3) weakTopics.push({ k, t, p: pct(r, n), n });
  }));
  weakTopics.sort((a, b) => a.p - b.p);
  const passes = store.mocks.filter(m => m.pass).length;
  main.innerHTML = `
  <div class="stack"><h1>Progress</h1><p class="muted">Saved on this device only.</p></div>
  <div class="tablewrap"><table class="restable"><thead><tr><th>Section</th><th class="n" style="text-align:right">Seen</th><th class="n" style="text-align:right">Mastered</th><th class="n" style="text-align:right">Accuracy</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="stack"><h2>Weakest topics</h2>${weakTopics.length ? `<div class="topics">${weakTopics.slice(0, 6).map(w => `<button class="topic" data-t="${esc(w.t)}" data-s="${w.k}"><span><b>${esc(w.t)}</b> <span class="small muted">${SECTIONS[w.k].short}</span></span><span class="cnt">${w.p}% of ${w.n}</span><div class="meter"><i style="width:${w.p}%"></i></div></button>`).join('')}</div>` : '<p class="empty">Answer a few questions in each topic to see where you are weakest.</p>'}</div>
  <div class="stack"><h2>Mock tests</h2><p>${store.mocks.length ? `${store.mocks.length} taken, ${passes} passed. Aim for three passes in a row before booking.` : 'No mock tests yet.'}</p></div>
  <div class="stack"><h2>Appearance</h2><div class="segmented" role="group" aria-label="Theme">${[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([k, n]) => `<button aria-pressed="${store.theme === k}" data-theme-opt="${k}">${n}</button>`).join('')}</div></div>
  <div class="stack"><h2>Reset</h2><div id="reset"><button class="btn danger" data-act="reset">Reset all progress</button></div></div>
  <p class="small muted">Question bank: ${QB.length} questions (${SEC_ORDER.map(k => `${sectionQs(k).length} ${SECTIONS[k].short.toLowerCase()}`).join(', ')}). Not an official DoT product; always check the current manual at a testing centre.</p>`;
  main.querySelectorAll('[data-t]').forEach(b => b.onclick = () => startQuiz(pickPractice(sectionQs(b.dataset.s).filter(q => q.topic === b.dataset.t), 20), b.dataset.t));
  main.querySelectorAll('[data-theme-opt]').forEach(b => b.onclick = () => { store.theme = b.dataset.themeOpt; save(); applyTheme(); route(); });
  main.querySelector('[data-act="reset"]').onclick = () => {
    $('#reset').innerHTML = `<div class="confirm"><b>Delete all progress on this device?</b><p class="small">Your answer history, mock results and flashcard scores will be cleared. This can't be undone.</p>
      <div class="row"><button class="btn danger" data-act="yes">Yes, reset</button><button class="btn ghost" data-act="no">Cancel</button></div></div>`;
    $('#reset [data-act="yes"]').onclick = () => { store.stats = {}; store.mocks = []; store.flash = {}; save(); toast('Progress reset'); route(); };
    $('#reset [data-act="no"]').onclick = () => route();
  };
};

/* ---------- keyboard ---------- */
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const view = location.hash.slice(1);
  if (view !== 'quiz' && view !== 'test') return;
  const k = e.key.toLowerCase();
  const idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? +k - 1 : ['a', 'b', 'c', 'd'].indexOf(k);
  const opts = document.querySelectorAll('#qbox [data-opt]');
  if (idx >= 0 && opts[idx] && !opts[idx].disabled) { e.preventDefault(); opts[idx].click(); return; }
  if (k === 'enter' && view === 'quiz') { const n = document.querySelector('[data-act="next"]:not([hidden])'); if (n && document.activeElement !== n) { e.preventDefault(); n.click(); } }
  if (view === 'test') {
    if (k === 'arrowright') { const n = document.querySelector('[data-act="next"]'); if (n) n.click(); }
    if (k === 'arrowleft') { const p = document.querySelector('[data-act="prev"]'); if (p && !p.disabled) p.click(); }
  }
});

/* ---------- boot ---------- */
shell();
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* not available (e.g. sandboxed frame) */ }
}
})();
