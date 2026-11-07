import * as React from 'react';
import { SIGNS, GROUP_NAMES, NOTES, QB, SECTIONS, SEC_ORDER, sectionQs, topicsOf, pct, type Section } from '../lib/data';
import { actions, useStore, mastered, stat, pickPractice } from '../lib/store';
import { go } from '../router';
import {
  TwoThirds, Stack, Caption, Lead, Body, Small, Link, ButtonLink, Button, ButtonGroup, Tag, Table, Checkbox, Field, fieldClass,
  Accordion, ConfirmDialog, SummaryList, ProgressBar, Radios, cx,
} from '../components/ui';

/* ============================== Signs gallery ============================== */
export function Signs() {
  const [group, setGroup] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [hide, setHide] = React.useState(false);
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const groups = Object.keys(GROUP_NAMES).filter(g => Object.values(SIGNS).some(s => s.group === g));
  const qy = query.trim().toLowerCase();
  const list = Object.entries(SIGNS).filter(([, s]) => (group === 'all' || s.group === group) && (!qy || `${s.name} ${s.meaning} ${s.code}`.toLowerCase().includes(qy)));
  const count = (g: string) => Object.values(SIGNS).filter(s => g === 'all' || s.group === g).length;
  return (
    <Stack gap="gap-8">
      <TwoThirds>
        <Stack gap="gap-5">
          <div><Caption>Signs, signals and markings</Caption><h1 className="heading-xl">Road signs</h1></div>
          <Lead>All {Object.keys(SIGNS).length} signs in the learner's manual, with what each one means.</Lead>
          <Body>Regulatory signs (control, command, prohibition, reservation) must be obeyed. Warning signs tell you about a hazard ahead. Information and guidance signs help you find your way.</Body>
        </Stack>
      </TwoThirds>
      <div className="grid gap-6 border-y border-line py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <Field label="Search" htmlFor="sign-search" >
          <input id="sign-search" type="search" className={fieldClass} value={query} onChange={e => setQuery(e.target.value)} placeholder="For example yield, parking or R201" />
        </Field>
        <Field label="Type of sign" htmlFor="sign-group">
          <select id="sign-group" className={cx(fieldClass, 'cursor-pointer')} value={group} onChange={e => setGroup(e.target.value)}>
            <option value="all">All signs ({count('all')})</option>
            {groups.map(g => <option key={g} value={g}>{GROUP_NAMES[g]} ({count(g)})</option>)}
          </select>
        </Field>
        <Button onClick={() => { actions.startFlash(list.map(([k]) => k), group); go('flashcards'); }} disabled={!list.length}>Flashcards ({list.length})</Button>
      </div>
      <Checkbox checked={hide} onChange={v => { setHide(v); setRevealed(new Set()); }}>Hide the names so I can test myself</Checkbox>
      <p className="body-m" role="status">{list.length === Object.keys(SIGNS).length ? `Showing all ${list.length} signs` : `${list.length} sign${list.length === 1 ? '' : 's'} found`}{hide && '. Select a sign to reveal its name.'}</p>
      {list.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map(([k, s]) => {
            const hidden = hide && !revealed.has(k);
            const Inner = (
              <>
                <span className="grid h-28 place-items-center bg-sign p-2"><img src={`img/signs/${k}.png`} alt="" loading="lazy" className="max-h-24 w-auto object-contain" /></span>
                <span className="flex flex-col gap-1 p-3">
                  <span className="body-s text-muted tabular-nums">{s.code} · {GROUP_NAMES[s.group]}</span>
                  {hidden ? <span className="body-m font-bold text-link underline">Show name</span> : <>
                    <span className="body-m font-bold">{s.name}</span>
                    <span className="body-s text-muted">{s.meaning}</span></>}
                </span>
              </>
            );
            return (
              <li key={k} className="flex">
                {hide ? (
                  <button type="button" onClick={() => setRevealed(r => new Set(r).add(k))} disabled={!hidden}
                    className="flex w-full flex-col border border-line bg-surface text-left cursor-pointer disabled:cursor-default focus-visible:outline-3 focus-visible:outline-focus focus-visible:shadow-[inset_0_0_0_2px_var(--c-focus-ink)]">{Inner}</button>
                ) : <div className="flex w-full flex-col border border-line bg-surface">{Inner}</div>}
              </li>
            );
          })}
        </ul>
      ) : <Body>No signs match your search. Try a different word, or choose "All signs".</Body>}
    </Stack>
  );
}

/* ============================== Flashcards ============================== */
export function Flashcards() {
  const f = useStore(s => s.flashSet)!;
  const groupLabel = f.group === 'all' ? 'All signs' : GROUP_NAMES[f.group];
  if (f.i >= f.keys.length) {
    return (
      <TwoThirds>
        <Stack gap="gap-6">
          <div><Caption>Flashcards · {groupLabel}</Caption><h1 className="heading-xl">You knew {f.known} of {f.keys.length} signs</h1></div>
          <ProgressBar value={pct(f.known, f.keys.length)} label="Known" valueText={`${pct(f.known, f.keys.length)}%`} tone="success" />
          <Body>Signs you didn't know will come first next time.</Body>
          <ButtonGroup><Button onClick={() => actions.flashRestart()}>Go through them again</Button><Link href="#signs">Back to road signs</Link></ButtonGroup>
        </Stack>
      </TwoThirds>
    );
  }
  const k = f.keys[f.i]; const s = SIGNS[k];
  return (
    <TwoThirds>
      <Stack gap="gap-6">
        <div className="flex flex-col gap-3">
          <Caption size="m">Flashcards · {groupLabel} · Card {f.i + 1} of {f.keys.length}</Caption>
          <ProgressBar value={pct(f.i, f.keys.length)} srLabel="Progress" thin />
        </div>
        <h1 className="heading-l">What does this sign mean?</h1>
        <figure className="grid place-items-center border border-line bg-sign p-6"><img src={`img/signs/${k}.png`} alt="A road sign" className="h-48 w-auto object-contain" /></figure>
        {f.show ? (
          <div aria-live="polite" className="flex flex-col gap-2 border-l-[10px] border-brand py-1 pl-4">
            <span className="body-s text-muted">{s.code} · {GROUP_NAMES[s.group]}</span>
            <h2 className="heading-m">{s.name}</h2>
            <p className="body-m max-w-[38em]">{s.meaning}</p>
          </div>
        ) : <Body className="text-muted">Say the answer out loud, then check.</Body>}
        <ButtonGroup>
          {f.show ? (<>
            <Button onClick={() => actions.flashMark(true)}>I knew it</Button>
            <Button variant="secondary" onClick={() => actions.flashMark(false)}>I didn't know it</Button>
          </>) : <Button onClick={() => actions.flashShow()}>Show the answer</Button>}
          <Link href="#signs">Stop</Link>
        </ButtonGroup>
      </Stack>
    </TwoThirds>
  );
}

/* ============================== Revision notes ============================== */
export function Notes() {
  const [open, setOpen] = React.useState<string[]>([]);
  return (
    <TwoThirds aside={
      <nav aria-label="Contents" className="border-t-2 border-brand pt-4 md:sticky md:top-4">
        <h2 className="heading-s mb-3">Contents</h2>
        <ol className="body-s flex flex-col gap-2">
          {NOTES.map(n => <li key={n.id}><a className="link" href={`#notes`} onClick={e => { e.preventDefault(); setOpen(o => o.includes(n.id) ? o : [...o, n.id]); requestAnimationFrame(() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth' })); }}>{n.title}</a></li>)}
        </ol>
      </nav>
    }>
      <Stack gap="gap-6">
        <div><Caption>Revise</Caption><h1 className="heading-xl">Revision notes</h1></div>
        <Lead>The facts the test asks about most, condensed from the three official manuals.</Lead>
        <Body>Numbers use South African notation (a decimal comma, for example 0,05 g). The last section lists the rules that changed after the 2012 manual.</Body>
        <Accordion value={open} onValueChange={setOpen} items={NOTES.map(n => ({
          id: n.id, title: n.title,
          content: <div className="note-body body-m" dangerouslySetInnerHTML={{ __html: n.html }} />,
        }))} />
      </Stack>
    </TwoThirds>
  );
}

/* ============================== Progress ============================== */
export function ProgressPage() {
  useStore(s => s.rev);
  const mocks = useStore(s => s.mocks);
  const theme = useStore(s => s.theme);
  const passes = mocks.filter(m => m.pass).length;
  const lastThree = mocks.slice(-3);
  const weak: { k: Section; t: string; p: number; n: number }[] = [];
  SEC_ORDER.forEach(k => topicsOf(k).forEach(([t]) => {
    const qs = sectionQs(k).filter(q => q.topic === t && stat(q.id));
    const r = qs.reduce((a, q) => a + stat(q.id)!.r, 0), n = qs.reduce((a, q) => a + stat(q.id)!.n, 0);
    if (n >= 3) weak.push({ k, t, p: pct(r, n), n });
  }));
  weak.sort((a, b) => a.p - b.p);
  return (
    <TwoThirds>
      <Stack gap="gap-8">
        <div><Caption>Your progress</Caption><h1 className="heading-xl">How you're doing</h1></div>
        <SummaryList rows={SEC_ORDER.map(k => {
          const qs = sectionQs(k); const seen = qs.filter(q => stat(q.id));
          const r = seen.reduce((a, q) => a + stat(q.id)!.r, 0), n = seen.reduce((a, q) => a + stat(q.id)!.n, 0);
          const m = qs.filter(q => mastered(q.id)).length;
          return {
            key: SECTIONS[k].name,
            value: <span className="flex flex-col gap-2"><ProgressBar value={pct(m, qs.length)} label={`${m} of ${qs.length} mastered`} tone={pct(m, qs.length) >= 80 ? 'success' : 'brand'} thin />
              <span className="body-s text-muted">{seen.length} seen · {n ? `${pct(r, n)}% answered correctly` : 'not started'}</span></span>,
          };
        })} />
        <Small>A question is mastered when you get it right on three separate days in a row. Answering it again on the same day doesn't count twice.</Small>

        <div className="flex flex-col gap-4">
          <h2 className="heading-l">Your weakest topics</h2>
          {weak.length ? (
            <Table head={['Topic', 'Section', 'Correct', '']} numeric={[2]} rows={weak.slice(0, 6).map(w => [
              <b>{w.t}</b>, SECTIONS[w.k].short, `${w.p}%`,
              <a className="link whitespace-nowrap" href="#quiz" onClick={e => { e.preventDefault(); if (actions.startQuiz(pickPractice(sectionQs(w.k).filter(q => q.topic === w.t), 20), w.t)) go('quiz'); }}>Practise<span className="sr-only"> {w.t}</span></a>,
            ])} />
          ) : <Body>Answer at least 3 questions in a topic to see how you're doing in it.</Body>}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="heading-l">Mock tests</h2>
          <Body>{mocks.length ? `You've taken ${mocks.length} mock test${mocks.length === 1 ? '' : 's'} and passed ${passes}.` : "You haven't taken a mock test yet."}{' '}
            {lastThree.length === 3 && lastThree.every(m => m.pass) ? "You've passed your last three in a row, so you're likely ready to book." : 'Aim to pass three in a row before you book your test.'}</Body>
          <ButtonGroup><ButtonLink href="#mock" variant="secondary">Go to mock tests</ButtonLink></ButtonGroup>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="heading-l">Settings</h2>
          <Radios name="theme" legend="Appearance" legendClass="heading-m" inline value={theme} onChange={v => actions.setTheme(v as 'system')}
            options={[{ value: 'system', label: 'Match my device' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="heading-m">Delete your progress</h2>
          <Body>This clears your answer history, mock test results and flashcard scores on this device.</Body>
          <div><ConfirmDialog trigger={<Button variant="warning">Delete all progress</Button>} title="Delete all your progress?"
            description={<><p>Your answer history, mock test results and flashcard scores will be deleted from this device.</p><p className="font-bold">You can't undo this.</p></>}
            confirm="Yes, delete everything" onConfirm={() => actions.reset()} /></div>
        </div>
        <Small>Question bank: {QB.length} questions ({SEC_ORDER.map(k => `${sectionQs(k).length} ${SECTIONS[k].short.toLowerCase()}`).join(', ')}).</Small>
      </Stack>
    </TwoThirds>
  );
}

export { Tag };
