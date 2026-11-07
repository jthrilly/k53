import questionsJson from '../data/questions.json';
import signsJson from '../data/signs.json';
import { NOTES as notesData } from '../data/notes.js';

export type Section = 'controls' | 'signs' | 'rules';
export type Option = { t: string; c: number };
export type Question = {
  id: string; section: Section; topic: string; q: string; opts: Option[];
  exp?: string; src?: string; img?: string; diagram?: 1 | 'auto'; fixed?: 1; auto?: 1;
};
export type Sign = { code: string; name: string; meaning: string; group: string };
export type Note = { id: string; title: string; html: string };

export const QB = questionsJson as Question[];
export const SIGNS = signsJson as Record<string, Sign>;
export const NOTES = notesData as Note[];
export const BY_ID: Record<string, Question> = Object.fromEntries(QB.map(q => [q.id, q]));

export const SECTIONS: Record<Section, { name: string; short: string; mock: number; pass: number; blurb: string }> = {
  controls: { name: 'Vehicle controls', short: 'Controls', mock: 8, pass: 6, blurb: 'The numbered controls diagram, and what each control does.' },
  signs: { name: 'Signs, signals and markings', short: 'Signs', mock: 28, pass: 23, blurb: 'Road signs, road markings and traffic lights.' },
  rules: { name: 'Rules of the road', short: 'Rules', mock: 28, pass: 22, blurb: 'Speed limits, right of way, parking, lights, licences and more.' },
};
export const SEC_ORDER: Section[] = ['controls', 'signs', 'rules'];
export const MOCK_MINUTES = 60;
export const GROUP_NAMES: Record<string, string> = {
  control: 'Control', command: 'Command', prohibition: 'Prohibition', reservation: 'Reservation',
  comprehensive: 'Comprehensive', selective: 'Selective restriction', warning: 'Warning', information: 'Information and guidance',
};
export const LETTERS = ['A', 'B', 'C', 'D'];

export const sectionQs = (s: Section) => QB.filter(q => q.section === s);
export function topicsOf(s: Section): [string, number][] {
  const m = new Map<string, number>();
  sectionQs(s).forEach(q => m.set(q.topic, (m.get(q.topic) || 0) + 1));
  return [...m.entries()];
}

export const isMark = (key: string) => !SIGNS[key] && /^[mt]-/.test(key);
export const imgSrc = (key: string) => (isMark(key) ? `img/marks/${key}.svg` : `img/signs/${key}.png`);
export const imgAlt = (key: string) => (SIGNS[key] ? SIGNS[key].name : key.replace(/^[mt]-/, '').replace(/-/g, ' '));
export const diagramSrc = (q: Question) => (q.diagram === 'auto' ? 'img/ui/controls-auto.jpg' : 'img/ui/controls-manual.jpg');

export function shuffle<T>(a: T[]): T[] {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

/** Questions about the same sign share a family so one session never asks both versions. */
export function family(q: Question) {
  if (q.img) return 'sign:' + q.img;
  const c = q.opts.find(o => o.c);
  if (q.auto && c && c.t.startsWith('img:')) return 'sign:' + c.t.slice(4);
  return q.id;
}
export function dedupe(list: Question[]) {
  const seen = new Set<string>();
  return list.filter(q => { const f = family(q); if (seen.has(f)) return false; seen.add(f); return true; });
}
