import * as React from 'react';
import { QB, BY_ID, SECTIONS, SEC_ORDER, MOCK_MINUTES, SIGNS, LETTERS, sectionQs, topicsOf, pct, imgAlt, imgSrc, type Section } from '../lib/data';
import { actions, useStore, mastered, isDue, isWeak, stat, pickPractice, reviewPool, isRight, MASTER_AT, daysUntilDue, type Item } from '../lib/store';
import { go } from '../router';
import {
  TwoThirds, Stack, Caption, Lead, Body, Small, Link, ButtonLink, Button, ButtonGroup, Inset, ProgressBar, Radios, Tag, SECTION_TAG,
  Notice, ErrorSummary, BackLink, Table, Tabs, Details, SectionBreak, cx,
} from '../components/ui';
import { QuestionView } from '../components/Question';

/* ============================== Home ============================== */
export function Home() {
  useStore(s => s.rev);
  const due = QB.filter(q => isDue(q.id)).length;
  const last = useStore(s => s.mocks[s.mocks.length - 1]);
  const test = useStore(s => s.test);
  return (
    <TwoThirds aside={<HomeAside last={last} />}>
      <Stack gap="gap-6">
        <h1 className="heading-xl">Prepare for your learner's licence test</h1>
        <Lead>Practise with {QB.length} questions based on the official K53 manuals for a Code 2 (light motor vehicle) learner's licence.</Lead>
        <Body>The real test is done on a computer. It has 64 questions in 3 sections, and you must pass every section on its own.</Body>
        <ButtonGroup>
          {test ? <ButtonLink variant="start" href="#test">Continue your mock test</ButtonLink> : <ButtonLink variant="start" href="#mock">Start a mock test</ButtonLink>}
        </ButtonGroup>
        <SectionBreak size="m" />
        <h2 className="heading-l">Practise by section</h2>
        <ul className="flex flex-col">
          {SEC_ORDER.map(k => {
            const qs = sectionQs(k); const m = qs.filter(q => mastered(q.id)).length;
            return (
              <li key={k} className="flex flex-col gap-3 border-t border-line py-5 last:border-b">
                <h3 className="heading-m"><a className="link" href={`#practice`} onClick={e => { e.preventDefault(); startSection(k); }}>{SECTIONS[k].name}</a></h3>
                <Body className="text-muted">{SECTIONS[k].blurb} {qs.length} questions.</Body>
                <div className="max-w-sm"><ProgressBar value={pct(m, qs.length)} label="Mastered" valueText={`${m} of ${qs.length}`} tone={pct(m, qs.length) >= 80 ? 'success' : 'brand'} thin /></div>
              </li>
            );
          })}
        </ul>
        <h2 className="heading-l mt-4">Other ways to study</h2>
        <ul className="flex flex-col gap-4 body-m">
          <li><a className="link font-bold" href="#review" onClick={e => { e.preventDefault(); startReview(); }}>Smart review</a>
            <p className="text-muted">{due ? `${due} question${due === 1 ? '' : 's'} due for another look.` : 'Questions you get wrong come back here over the following days.'}</p></li>
          <li><a className="link font-bold" href="#signs">Road signs</a><p className="text-muted">All {Object.keys(SIGNS).length} signs from the manual, with flashcards.</p></li>
          <li><a className="link font-bold" href="#notes">Revision notes</a><p className="text-muted">Key numbers, distances and rules on one page each.</p></li>
        </ul>
      </Stack>
    </TwoThirds>
  );
}
function HomeAside({ last }: { last?: { pass: boolean; date: number; score: Record<Section, number> } }) {
  const seen = useStore(s => Object.keys(s.stats).length);
  return (
    <div className="border-t-2 border-brand pt-4 md:mt-2">
      <h2 className="heading-m mb-4">Your progress</h2>
      <dl className="body-m flex flex-col gap-3">
        <div><dt className="text-muted">Questions answered</dt><dd className="heading-m">{seen} <span className="body-m font-normal text-muted">of {QB.length}</span></dd></div>
        <div><dt className="text-muted">Last mock test</dt>
          <dd>{last ? <><Tag colour={last.pass ? 'green' : 'red'}>{last.pass ? 'Passed' : 'Not passed'}</Tag>
            <span className="mt-1 block body-s text-muted tabular-nums">{SEC_ORDER.map(k => `${SECTIONS[k].short} ${last.score[k]}/${SECTIONS[k].mock}`).join(' · ')}</span></> : <span className="text-muted">Not taken yet</span>}</dd></div>
      </dl>
      <p className="body-m mt-4"><Link href="#progress">See all your progress</Link></p>
    </div>
  );
}

function startSection(k: Section) {
  if (actions.startQuiz(pickPractice(sectionQs(k), 20), SECTIONS[k].name)) go('quiz');
}
export function startReview() {
  const pool = reviewPool();
  if (!pool.length) { go('practice'); return false; }
  actions.startQuiz(pool, 'Smart review'); go('quiz'); return true;
}

/* ============================== Practice setup ============================== */
export function Practice() {
  useStore(s => s.rev);
  const [sec, setSec] = React.useState<string | null>(null);
  const [len, setLen] = React.useState<string>('20');
  const [err, setErr] = React.useState(false);
  const [tab, setTab] = React.useState<string>('controls');
  const due = QB.filter(q => isDue(q.id)).length;
  const later = QB.filter(q => isWeak(q.id) && !isDue(q.id)).length;
  const done = QB.filter(q => mastered(q.id)).length;
  const started = QB.some(q => stat(q.id));

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sec) { setErr(true); return; }
    const pool = sec === 'all' ? QB : sectionQs(sec as Section);
    if (actions.startQuiz(pickPractice(pool, Number(len)), sec === 'all' ? 'Mixed practice' : SECTIONS[sec as Section].name)) go('quiz');
  };
  return (
    <TwoThirds>
      <Stack gap="gap-8">
        {err && <ErrorSummary errors={[{ text: 'Select what you want to practise', href: '#sec' }]} />}
        <div>
          <Caption>Practise</Caption>
          <h1 className="heading-xl">Practise questions</h1>
        </div>
        <Body>You'll see one question at a time and find out straight away if you got it right, with the rule behind the answer. Questions you haven't seen and ones you got wrong come first.</Body>
        <form onSubmit={start} noValidate className="flex flex-col gap-8">
          <Radios id="sec" name="section" legend="What do you want to practise?" legendClass="heading-m" value={sec} onChange={v => { setSec(v); setErr(false); }}
            error={err ? 'Select what you want to practise' : undefined}
            options={[
              { value: 'all', label: 'All sections, mixed', hint: `${QB.length} questions` },
              ...SEC_ORDER.map(k => ({ value: k, label: SECTIONS[k].name, hint: `${sectionQs(k).length} questions` })),
            ]} />
          <Radios name="length" legend="How many questions?" legendClass="heading-m" inline value={len} onChange={setLen}
            options={[{ value: '10', label: '10' }, { value: '20', label: '20' }, { value: '40', label: '40' }, { value: '0', label: 'All' }]} />
          <ButtonGroup>
            <Button type="submit">Start practising</Button>
          </ButtonGroup>
        </form>

        {started && (
          <Inset>
            <div className="flex flex-col gap-3">
              <h2 className="heading-s">Your review schedule</h2>
              <p>This builds up across all your practice sessions and mock tests, not just the last one. A question is mastered when you get it right on {MASTER_AT} separate days in a row. A wrong answer starts it again.</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 tabular-nums">
                <dt>Due for review today</dt><dd className="font-bold">{due}</dd>
                <dt>Coming back on a later day</dt><dd className="font-bold">{later}</dd>
                <dt>Mastered</dt><dd className="font-bold">{done}</dd>
              </dl>
              {due > 0
                ? <p><Link href="#review" onClick={e => { e.preventDefault(); startReview(); }}>Review the {due} due today</Link></p>
                : <p className="text-muted">Nothing is due today. Come back tomorrow, or keep practising new questions.</p>}
            </div>
          </Inset>
        )}

        <SectionBreak size="m" />
        <div className="flex flex-col gap-4">
          <h2 className="heading-l">Practise one topic</h2>
          <Tabs label="Sections" value={tab} onValueChange={setTab} tabs={SEC_ORDER.map(k => ({
            value: k, label: SECTIONS[k].short,
            content: (
              <Table head={['Topic', 'Mastered', '']} numeric={[1]} rows={topicsOf(k).map(([t, n]) => {
                const ids = sectionQs(k).filter(q => q.topic === t).map(q => q.id);
                const m = ids.filter(mastered).length;
                return [<span className="font-bold">{t}</span>, <span className="whitespace-nowrap">{m} of {n}</span>,
                  <a className="link whitespace-nowrap" href="#quiz" onClick={e => { e.preventDefault(); if (actions.startQuiz(pickPractice(sectionQs(k).filter(q => q.topic === t), 20), t)) go('quiz'); }}>Practise<span className="sr-only"> {t}</span></a>];
              })} />
            ),
          }))} />
        </div>
      </Stack>
    </TwoThirds>
  );
}

/* ============================== Practice quiz ============================== */
export function Quiz() {
  const quiz = useStore(s => s.quiz)!;
  const [err, setErr] = React.useState(false);
  const fbRef = React.useRef<HTMLDivElement>(null);
  const done = quiz.i >= quiz.items.length;
  const item = quiz.items[quiz.i];
  const checked = !!item?.checked;

  React.useEffect(() => { setErr(false); }, [quiz.i]);
  React.useEffect(() => { if (checked) fbRef.current?.focus({ preventScroll: true }); if (checked) fbRef.current?.scrollIntoView({ block: 'nearest' }); }, [checked]);
  React.useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input[type=text],input[type=search],textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase(); const idx = ['1', '2', '3'].indexOf(k) >= 0 ? Number(k) - 1 : ['a', 'b', 'c'].indexOf(k);
      if (idx >= 0 && !checked && item.order[idx] !== undefined) { e.preventDefault(); actions.answerQuiz(item.order[idx]); setErr(false); }
      if (k === 'enter' && !(e.target as HTMLElement).matches('button,a')) { e.preventDefault(); onPrimary(); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });

  if (done) return <QuizSummary />;
  const q = BY_ID[item.id];
  const ok = checked && isRight(item);
  const rightPos = item.order.findIndex(oi => q.opts[oi].c);
  const answered = quiz.items.filter(it => it.checked).length;
  const right = quiz.items.filter(it => it.checked && isRight(it)).length;

  function onPrimary() {
    if (!checked) { if (item.answer === null) { setErr(true); return; } actions.checkQuiz(); }
    else { actions.nextQuiz(); window.scrollTo(0, 0); }
  }
  return (
    <TwoThirds>
      <Stack gap="gap-6">
        {err && <ErrorSummary errors={[{ text: 'Select an answer', href: '#question' }]} />}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Caption size="m">{quiz.title} · Question {quiz.i + 1} of {quiz.items.length}</Caption>
            <Tag colour={SECTION_TAG[q.section]}>{q.topic}</Tag>
          </div>
          <ProgressBar value={pct(quiz.i, quiz.items.length)} srLabel="Session progress" thin />
        </div>
        <form onSubmit={e => { e.preventDefault(); onPrimary(); }} className="flex flex-col gap-8">
          <QuestionView item={item} reveal={checked} onAnswer={i => { actions.answerQuiz(i); setErr(false); }} error={err ? 'Select an answer' : undefined} />
          {checked && (
            <div ref={fbRef} tabIndex={-1} className="focus:outline-none">
              <Notice tone={ok ? 'success' : 'error'} title={ok ? 'Correct' : `Incorrect. The answer is ${LETTERS[rightPos]}.`}>
                <div className="flex flex-col gap-3">
                  {!ok && q.opts[q.opts.findIndex(o => o.c)].t.startsWith('img:') && <p className="font-bold">{imgAlt(q.opts.find(o => o.c)!.t.slice(4))}</p>}
                  {q.exp && <p className="max-w-[38em]">{q.exp}</p>}
                  {q.src && <p className="body-s text-muted">Source: {q.src}</p>}
                  <MasteryNote item={item} ok={ok} />
                </div>
              </Notice>
            </div>
          )}
          <ButtonGroup>
            <Button type="submit">{!checked ? 'Check answer' : quiz.i + 1 < quiz.items.length ? 'Next question' : 'See your results'}</Button>
            <Link href="#quiz" onClick={e => { e.preventDefault(); actions.endQuiz(); }}>End practice</Link>
          </ButtonGroup>
        </form>
        <Small className="max-sm:hidden">{right} right out of {answered} so far. Keyboard: press 1, 2 or 3 to choose an answer and Enter to continue.</Small>
      </Stack>
    </TwoThirds>
  );
}

function Pips({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="inline-flex gap-1">
      {Array.from({ length: MASTER_AT }, (_, i) => <span key={i} className={cx('size-3.5 border-2 border-success', i < n && 'bg-success')} />)}
    </span>
  );
}
const dayText = (d: number) => (d <= 1 ? 'tomorrow' : `in ${d} days`);

/** Where this question now stands in smart review, so it's clear mastery builds up over days. */
function MasteryNote({ item, ok }: { item: Item; ok: boolean }) {
  const box = stat(item.id)?.box ?? 0;
  const before = item.prevBox ?? 0;
  const n = Math.min(box, MASTER_AT);
  const d = daysUntilDue(item.id);
  const text = !ok
    ? (before > 0 ? 'Mastery goes back to 0 for this question. ' : '') + 'It will come back in your next smart review.'
    : box > before
      ? (box >= MASTER_AT && before < MASTER_AT ? "You've mastered this question." : `It comes back for review ${dayText(d)}.`)
      : `This one already counted today. Get it right again ${dayText(d)} to move it closer to mastered.`;
  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3 body-s">
      <p className="flex flex-wrap items-center gap-2 font-bold">Mastery <Pips n={n} /> <span className="tabular-nums">{n} of {MASTER_AT} days</span></p>
      <p>{text}</p>
    </div>
  );
}

function QuizSummary() {
  const quiz = useStore(s => s.quiz)!;
  const n = quiz.items.length;
  const right = quiz.items.filter(isRight).length;
  const wrong = quiz.items.filter(it => !isRight(it));
  return (
    <TwoThirds>
      <Stack gap="gap-8">
        <div>
          <Caption>{quiz.title}</Caption>
          <h1 className="heading-xl">{n ? `You got ${right} out of ${n} right` : 'Practice ended'}</h1>
        </div>
        {n > 0 && <ProgressBar value={pct(right, n)} label="Score" valueText={`${pct(right, n)}%`} tone={pct(right, n) >= 82 ? 'success' : 'brand'} />}
        <Body>{!n ? 'You did not answer any questions.' : pct(right, n) >= 82 ? "That's around the pass level of the real test. Keep it up." : 'The real test needs about 80% in every section. The questions you got wrong will come back in smart review.'}</Body>
        {n > 0 && <Small>This score is for this session only. Mastery builds up separately, over several days. <Link href="#practice">See your review schedule</Link></Small>}
        <ButtonGroup>
          <ButtonLink href="#practice">Practise more questions</ButtonLink>
          {wrong.length > 0 && <Button variant="secondary" onClick={() => { actions.startQuiz(wrong.map(it => BY_ID[it.id]), 'Questions you got wrong'); window.scrollTo(0, 0); }}>Try the {wrong.length} you got wrong again</Button>}
        </ButtonGroup>
        {wrong.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="heading-l">Questions you got wrong</h2>
            {wrong.map(it => <AnswerReview key={it.id} item={it} />)}
          </div>
        )}
      </Stack>
    </TwoThirds>
  );
}

/** Compact review of one answered question, used after practice and mock tests. */
export function AnswerReview({ item, index }: { item: { id: string; answer: number | null }; index?: number }) {
  const q = BY_ID[item.id];
  const right = q.opts.find(o => o.c)!;
  const show = (t: string) => t.startsWith('img:')
    ? <span className="inline-flex items-center gap-2"><img src={imgSrc(t.slice(4))} alt="" className="h-12 w-auto border border-line bg-sign p-0.5" />{imgAlt(t.slice(4))}</span>
    : t;
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <p className="body-s text-muted">{index !== undefined && `Question ${index + 1} · `}{SECTIONS[q.section].short} · {q.topic}</p>
      <p className="body-m font-bold whitespace-pre-line">{q.q}</p>
      {q.img && <img src={imgSrc(q.img)} alt="" className="h-20 w-auto self-start border border-line bg-sign p-1" />}
      {q.diagram && <Details summary="Show the controls diagram"><img src={q.diagram === 'auto' ? 'img/ui/controls-auto.jpg' : 'img/ui/controls-manual.jpg'} alt="Controls diagram" className="max-w-md border border-line bg-sign" /></Details>}
      <dl className="body-m grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">Your answer</dt><dd className="text-error">{item.answer === null ? 'Not answered' : show(q.opts[item.answer].t)}</dd>
        <dt className="text-muted">Correct answer</dt><dd className="font-bold">{show(right.t)}</dd>
      </dl>
      {q.exp && <p className="body-m max-w-[38em] text-muted">{q.exp}</p>}
    </div>
  );
}

export { stat, MOCK_MINUTES };
