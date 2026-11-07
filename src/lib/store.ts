import { useSyncExternalStore } from 'react';
import { QB, BY_ID, SECTIONS, SEC_ORDER, MOCK_MINUTES, sectionQs, shuffle, dedupe, family, type Question, type Section } from './data';

/* ---------- Persistent progress (same key/schema as v1, so existing progress carries over) ---------- */
type Stat = { n: number; r: number; w: number; box: number; due: number; last: number; lastOk?: number };
export type MockRecord = { date: number; score: Record<Section, number>; pass: boolean; mins: number };
export type Theme = 'system' | 'light' | 'dark';
type Persist = { stats: Record<string, Stat>; mocks: MockRecord[]; flash: Record<string, number>; theme: Theme };

const KEY = 'k53-progress-v1';
const TEST_KEY = 'k53-test-v2';
const DAY = 864e5;
const BOX_DAYS = [0, 1, 3, 7, 16, 35];

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); if (raw) return { ...fallback, ...JSON.parse(raw) }; } catch { /* unavailable */ }
  return fallback;
}
function persist(key: string, value: unknown) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

/* ---------- Session types ---------- */
export type Item = { id: string; order: number[]; answer: number | null; checked?: boolean };
export type Quiz = { title: string; items: Item[]; i: number };
export type Test = { items: Item[]; i: number; flags: number[]; started: number; ends: number };
export type Result = { rec: MockRecord; secPass: Record<Section, boolean>; timeUp: boolean; items: Item[] };
export type Flash = { keys: string[]; i: number; show: boolean; known: number; group: string };

type State = Persist & { quiz: Quiz | null; test: Test | null; result: Result | null; flashSet: Flash | null; rev: number };

let state: State = {
  ...load<Persist>(KEY, { stats: {}, mocks: [], flash: {}, theme: 'system' }),
  quiz: null, test: (() => { try { const t = localStorage.getItem(TEST_KEY); return t ? JSON.parse(t) : null; } catch { return null; } })(),
  result: null, flashSet: null, rev: 0,
};
const listeners = new Set<() => void>();
function emit(patch: Partial<State>, save = true) {
  state = { ...state, ...patch, rev: state.rev + 1 };
  if (save) persist(KEY, { stats: state.stats, mocks: state.mocks, flash: state.flash, theme: state.theme });
  if ('test' in patch) persist(TEST_KEY, state.test);
  listeners.forEach(l => l());
}
export const getState = () => state;
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => sel(state), () => sel(state));
}

/* ---------- Spaced repetition ---------- */
export const stat = (id: string): Stat | undefined => state.stats[id];
export const mastered = (id: string) => (stat(id)?.box ?? 0) >= 3;
export const isWeak = (id: string) => { const s = stat(id); return !!s && s.w > 0 && s.box < 3; };
export const isDue = (id: string) => { const s = stat(id); return !!s && s.box < 5 && s.due <= Date.now() && (s.w > 0 || s.box < 2); };
function recorded(stats: Record<string, Stat>, id: string, ok: boolean) {
  const s = { ...(stats[id] || { n: 0, r: 0, w: 0, box: 0, due: 0, last: 0 }) };
  s.n++; s.last = Date.now();
  if (ok) { s.r++; s.box = Math.min(5, s.box + 1); s.lastOk = 1; } else { s.w++; s.box = 0; s.lastOk = 0; }
  s.due = Date.now() + BOX_DAYS[s.box] * DAY;
  return { ...stats, [id]: s };
}
export const isRight = (it: Item) => it.answer !== null && !!BY_ID[it.id].opts[it.answer].c;

/* ---------- Picking questions ---------- */
export function prep(q: Question): Item {
  const idx = q.opts.map((_, i) => i);
  return { id: q.id, order: q.fixed ? idx : shuffle(idx), answer: null };
}
export function pickPractice(pool: Question[], n: number) {
  const tier = (q: Question) => { const s = stat(q.id); if (!s) return 1; if (isDue(q.id) || isWeak(q.id)) return 0; return 2 + s.box; };
  const sorted = shuffle(pool).sort((a, b) => tier(a) - tier(b) || (stat(a.id)?.last || 0) - (stat(b.id)?.last || 0));
  return shuffle(dedupe(sorted).slice(0, n || pool.length));
}
export function reviewPool() {
  let pool = QB.filter(q => isDue(q.id));
  if (!pool.length) pool = QB.filter(q => isWeak(q.id));
  return dedupe(shuffle(pool).sort((a, b) => (stat(a.id)!.due) - (stat(b.id)!.due))).slice(0, 25);
}
export function buildMock(): Question[] {
  const out: Question[] = [];
  const ctrl = sectionQs('controls');
  const diag = shuffle(ctrl.filter(q => q.diagram)).slice(0, 6);
  out.push(...shuffle([...diag, ...shuffle(ctrl.filter(q => !diag.includes(q))).slice(0, 2)]));
  const signs = sectionQs('signs');
  const fams = new Set<string>();
  const take = (list: Question[], n: number, acc: Question[]) => {
    for (const q of list) { if (acc.length >= n) break; const f = family(q); if (fams.has(f)) continue; fams.add(f); acc.push(q); }
    return acc;
  };
  const s = take(dedupe(shuffle(signs.filter(q => q.auto))), 16, []);
  take(shuffle(signs.filter(q => !q.auto)), 28, s);
  out.push(...shuffle(s));
  out.push(...shuffle(sectionQs('rules')).slice(0, 28));
  return out;
}

/* ---------- Actions ---------- */
export const actions = {
  startQuiz(list: Question[], title: string) {
    if (!list.length) return false;
    emit({ quiz: { title, items: list.map(prep), i: 0 } }, false);
    return true;
  },
  answerQuiz(answer: number) {
    const quiz = state.quiz!; const items = quiz.items.slice();
    items[quiz.i] = { ...items[quiz.i], answer };
    emit({ quiz: { ...quiz, items } }, false);
  },
  checkQuiz() {
    const quiz = state.quiz!; const it = quiz.items[quiz.i];
    if (it.answer === null || it.checked) return;
    const items = quiz.items.slice(); items[quiz.i] = { ...it, checked: true };
    emit({ quiz: { ...quiz, items }, stats: recorded(state.stats, it.id, isRight(it)) });
  },
  nextQuiz() { const q = state.quiz!; emit({ quiz: { ...q, i: q.i + 1 } }, false); },
  endQuiz() { const q = state.quiz!; const items = q.items.filter(it => it.checked); emit({ quiz: { ...q, items, i: items.length } }, false); },

  startTest() {
    const now = Date.now();
    emit({ test: { items: buildMock().map(prep), i: 0, flags: [], started: now, ends: now + MOCK_MINUTES * 60e3 } }, false);
  },
  answerTest(answer: number) {
    const t = state.test!; const items = t.items.slice(); items[t.i] = { ...items[t.i], answer };
    emit({ test: { ...t, items } }, false);
  },
  gotoTest(i: number) { emit({ test: { ...state.test!, i } }, false); },
  toggleFlag(i: number) {
    const t = state.test!; const flags = t.flags.includes(i) ? t.flags.filter(f => f !== i) : [...t.flags, i];
    emit({ test: { ...t, flags } }, false);
  },
  abandonTest() { emit({ test: null }, false); },
  finishTest(timeUp: boolean) {
    const t = state.test; if (!t) return;
    const score = { controls: 0, signs: 0, rules: 0 } as Record<Section, number>;
    let stats = state.stats;
    t.items.forEach(it => {
      const q = BY_ID[it.id]; const ok = isRight(it);
      if (ok) score[q.section]++;
      if (it.answer !== null) stats = recorded(stats, q.id, ok);
    });
    const secPass = Object.fromEntries(SEC_ORDER.map(k => [k, score[k] >= SECTIONS[k].pass])) as Record<Section, boolean>;
    const rec: MockRecord = { date: Date.now(), score, pass: SEC_ORDER.every(k => secPass[k]), mins: Math.min(MOCK_MINUTES, Math.round((Date.now() - t.started) / 60e3)) };
    emit({ stats, mocks: [...state.mocks, rec].slice(-50), result: { rec, secPass, timeUp, items: t.items }, test: null });
  },

  startFlash(keys: string[], group: string) {
    const order = shuffle(keys).sort((a, b) => (state.flash[a] || 0) - (state.flash[b] || 0));
    emit({ flashSet: { keys: order, i: 0, show: false, known: 0, group } }, false);
  },
  flashShow() { emit({ flashSet: { ...state.flashSet!, show: true } }, false); },
  flashMark(knew: boolean) {
    const f = state.flashSet!; const k = f.keys[f.i];
    emit({ flash: { ...state.flash, [k]: knew ? (state.flash[k] || 0) + 1 : 0 }, flashSet: { ...f, i: f.i + 1, show: false, known: f.known + (knew ? 1 : 0) } });
  },
  flashRestart() { const f = state.flashSet!; actions.startFlash(f.keys, f.group); },

  setTheme(theme: Theme) { emit({ theme }); applyTheme(theme); },
  reset() { emit({ stats: {}, mocks: [], flash: {} }); },
};

export function applyTheme(t: Theme = state.theme) {
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
}
