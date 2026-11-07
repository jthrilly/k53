import * as React from 'react';
import { Clock, Flag } from 'lucide-react';
import { BY_ID, SECTIONS, SEC_ORDER, MOCK_MINUTES, pct, LETTERS, type Section } from '../lib/data';
import { actions, useStore, isRight, getState } from '../lib/store';
import { go } from '../router';
import {
  TwoThirds, Stack, Caption, Lead, Body, Link, ButtonLink, Button, ButtonGroup, Inset, Table, Tag, SECTION_TAG, ProgressBar,
  Checkbox, Panel, WarningText, Accordion, ConfirmDialog, Details, SummaryList, cx,
} from '../components/ui';
import { QuestionView } from '../components/Question';
import { AnswerReview } from './Study';

const fmtDate = (t: number) => { try { return new Date(t).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + new Date(t).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const fmtTime = (sec: number) => { sec = Math.max(0, sec); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };

/* ============================== Mock test start page ============================== */
export function Mock() {
  const test = useStore(s => s.test);
  const mocks = useStore(s => s.mocks);
  const hist = mocks.slice(-5).reverse();
  return (
    <TwoThirds>
      <Stack gap="gap-6">
        <div><Caption>Mock test</Caption><h1 className="heading-xl">Take a mock learner's licence test</h1></div>
        <Lead>Answer 64 questions under the same conditions as the computerised test.</Lead>
        <Body>Questions are drawn at random. Your answers are only marked at the end. You can flag questions and go back to them before you finish.</Body>
        <Table head={['Section', 'Questions', 'Pass mark']} numeric={[1, 2]} rows={[
          ...SEC_ORDER.map(k => [SECTIONS[k].name, SECTIONS[k].mock, `${SECTIONS[k].pass} (${pct(SECTIONS[k].pass, SECTIONS[k].mock)}%)`]),
          [<b>Total</b>, <b>64</b>, ''],
        ]} />
        <Inset>You must reach the pass mark in <b>every</b> section. A high score in one section does not make up for a low score in another.</Inset>
        <Body>You have {MOCK_MINUTES} minutes. This is the time limit most testing centres report; the official limit is not published.</Body>
        <ButtonGroup>
          {test ? (
            <>
              <ButtonLink variant="start" href="#test">Continue your test</ButtonLink>
              <ConfirmDialog trigger={<button type="button" className="link body-m">Start a new test instead</button>}
                title="Start a new test?" description={<p>Your current test will be thrown away and won't be marked.</p>}
                confirm="Start a new test" tone="primary" onConfirm={() => { actions.startTest(); go('test'); }} />
            </>
          ) : <Button variant="start" onClick={() => { actions.startTest(); go('test'); }}>Start now</Button>}
        </ButtonGroup>
        {hist.length > 0 && (
          <>
            <h2 className="heading-l mt-6">Your recent tests</h2>
            <Table head={['Date', ...SEC_ORDER.map(k => SECTIONS[k].short), 'Result']} numeric={[1, 2, 3]} rows={hist.map(m => [
              <span className="whitespace-nowrap">{fmtDate(m.date)}</span>, ...SEC_ORDER.map(k => `${m.score[k]}/${SECTIONS[k].mock}`),
              <Tag colour={m.pass ? 'green' : 'red'}>{m.pass ? 'Passed' : 'Failed'}</Tag>,
            ])} />
          </>
        )}
      </Stack>
    </TwoThirds>
  );
}

/* ============================== Timer ============================== */
function useCountdown() {
  const ends = useStore(s => s.test?.ends);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const h = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(h); }, []);
  const left = ends ? Math.round((ends - now) / 1000) : 0;
  React.useEffect(() => { if (ends && left <= 0 && getState().test) { actions.finishTest(true); go('results'); } }, [left, ends]);
  return left;
}
function Timer() {
  const left = useCountdown();
  const low = left < 300;
  return (
    <span role="timer" aria-label={`${Math.ceil(left / 60)} minutes left`}
      className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 heading-s tabular-nums', low ? 'bg-tag-red-bg text-tag-red' : 'bg-surface-alt')}>
      <Clock aria-hidden className="size-5" strokeWidth={2.5} />{fmtTime(left)}<span className="sr-only"> left</span>
    </span>
  );
}

/* ============================== Test: one question per page ============================== */
export function TestQuestion() {
  const test = useStore(s => s.test)!;
  const item = test.items[test.i];
  const q = BY_ID[item.id];
  const answered = test.items.filter(it => it.answer !== null).length;
  const flagged = test.flags.includes(test.i);
  const last = test.i === test.items.length - 1;
  const secStart = test.items.findIndex(it => BY_ID[it.id].section === q.section);
  const secCount = SECTIONS[q.section].mock;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).matches('input[type=text],input[type=search],textarea,select')) return;
      const k = e.key.toLowerCase(); const idx = ['1', '2', '3'].indexOf(k) >= 0 ? Number(k) - 1 : ['a', 'b', 'c'].indexOf(k);
      if (idx >= 0 && item.order[idx] !== undefined) { e.preventDefault(); actions.answerTest(item.order[idx]); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });
  const next = () => { if (last) go('check'); else { actions.gotoTest(test.i + 1); window.scrollTo(0, 0); } };

  return (
    <TwoThirds aside={<QuestionMap />}>
      <Stack gap="gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Caption size="m">Mock test · {SECTIONS[q.section].name}</Caption>
            <Timer />
          </div>
          <ProgressBar value={pct(answered, test.items.length)} label={`Question ${test.i + 1} of 64`} srLabel={`Question ${test.i + 1} of 64, question ${test.i - secStart + 1} of ${secCount} in this section`} valueText={`${answered} answered`} thin />
        </div>
        <form onSubmit={e => { e.preventDefault(); next(); }} className="flex flex-col gap-8">
          <QuestionView item={item} onAnswer={a => actions.answerTest(a)} />
          <Checkbox checked={flagged} onChange={() => actions.toggleFlag(test.i)}>
            <span className="inline-flex items-center gap-2">Flag this question to check later {flagged && <Flag aria-hidden className="size-5 fill-[#ffdd00] text-ink" />}</span>
          </Checkbox>
          <ButtonGroup>
            <Button type="submit">{last ? 'Check your answers' : 'Save and continue'}</Button>
            {test.i > 0 && <Button type="button" variant="secondary" onClick={() => { actions.gotoTest(test.i - 1); window.scrollTo(0, 0); }}>Previous question</Button>}
            {!last && <Link href="#check">Check your answers and finish</Link>}
          </ButtonGroup>
        </form>
      </Stack>
    </TwoThirds>
  );
}

function QuestionMap() {
  const test = useStore(s => s.test)!;
  const grid = (
    <div className="flex flex-col gap-4">
      {SEC_ORDER.map(sec => (
        <div key={sec}>
          <h3 className="body-s mb-2 font-bold">{SECTIONS[sec].name}</h3>
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5">
            {test.items.map((it, idx) => BY_ID[it.id].section !== sec ? null : (
              <li key={idx}>
                <button type="button" onClick={() => { actions.gotoTest(idx); window.scrollTo(0, 0); }}
                  aria-label={`Question ${idx + 1}${it.answer !== null ? ', answered' : ', not answered'}${test.flags.includes(idx) ? ', flagged' : ''}`}
                  aria-current={idx === test.i ? 'step' : undefined}
                  className={cx('relative h-10 w-full border-2 body-s tabular-nums cursor-pointer focus-visible:outline-none focus-visible:bg-focus focus-visible:text-focus-ink focus-visible:border-focus-ink',
                    it.answer !== null ? 'border-brand bg-brand text-white' : 'border-line bg-surface',
                    idx === test.i && 'outline-3 outline-offset-1 outline-line-strong')}>
                  {idx + 1}
                  {test.flags.includes(idx) && <span aria-hidden className="absolute -top-1.5 -right-1.5 size-3.5 rounded-full border-2 border-surface bg-[#ffdd00]" />}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className="body-s text-muted flex flex-wrap gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 bg-brand" />Answered</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-[#ffdd00]" />Flagged</span>
      </p>
    </div>
  );
  return (
    <>
      <div className="max-md:hidden border-t-2 border-brand pt-4">
        <h2 className="heading-s mb-3">Questions</h2>{grid}
      </div>
      <div className="md:hidden"><Details summary="Go to a question">{grid}</Details></div>
    </>
  );
}

/* ============================== Check your answers ============================== */
export function CheckAnswers() {
  const test = useStore(s => s.test)!;
  const unanswered = test.items.filter(it => it.answer === null).length;
  // Open only the sections that still need attention (unanswered or flagged questions).
  const [open, setOpen] = React.useState<string[]>(() => SEC_ORDER.filter(sec => test.items.some((it, idx) => BY_ID[it.id].section === sec && (it.answer === null || test.flags.includes(idx)))));
  return (
    <TwoThirds>
      <Stack gap="gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><Caption>Mock test</Caption><h1 className="heading-xl">Check your answers</h1></div>
          <Timer />
        </div>
        {unanswered > 0
          ? <WarningText>You have not answered {unanswered} question{unanswered === 1 ? '' : 's'}. Unanswered questions are marked wrong.</WarningText>
          : <Body>You have answered every question. Check any you flagged, then mark your test.</Body>}
        {test.flags.length > 0 && <Body>You flagged {test.flags.length} question{test.flags.length === 1 ? '' : 's'}.</Body>}
        <Accordion value={open} onValueChange={setOpen} items={SEC_ORDER.map(sec => {
          const rows = test.items.map((it, idx) => ({ it, idx })).filter(r => BY_ID[r.it.id].section === sec);
          const done = rows.filter(r => r.it.answer !== null).length;
          const fl = rows.filter(r => test.flags.includes(r.idx)).length;
          return {
            id: sec, title: SECTIONS[sec].name, summary: `${done} of ${rows.length} answered${fl ? ` · ${fl} flagged` : ''}`,
            content: (
              <SummaryList compactKey rows={rows.map(({ it, idx }) => {
                const q = BY_ID[it.id];
                const pos = it.answer === null ? -1 : it.order.indexOf(it.answer);
                const t = it.answer === null ? '' : q.opts[it.answer].t;
                return {
                  key: <span>Question {idx + 1}</span>,
                  value: (
                    <span className="flex flex-col gap-1">
                      <span className="line-clamp-2 text-muted">{q.q.split('\n')[0]}</span>
                      <span className="flex flex-wrap gap-2">
                        {it.answer === null ? <Tag colour="red">Not answered</Tag> : <span>Answer {LETTERS[pos]}{t.startsWith('img:') ? '' : `: ${t.length > 60 ? t.slice(0, 57) + '…' : t}`}</span>}
                        {test.flags.includes(idx) && <Tag colour="yellow">Flagged</Tag>}
                      </span>
                    </span>
                  ),
                  action: <a className="link" href="#test" onClick={e => { e.preventDefault(); actions.gotoTest(idx); go('test'); }}>Change<span className="sr-only"> question {idx + 1}</span></a>,
                };
              })} />
            ),
          };
        })} />
        <h2 className="heading-m mt-4">Now mark your test</h2>
        <Body>Once you mark the test you cannot change your answers.</Body>
        <ButtonGroup>
          <Button onClick={() => { actions.finishTest(false); go('results'); }}>Mark my test</Button>
          <Link href="#test">Go back to the questions</Link>
        </ButtonGroup>
      </Stack>
    </TwoThirds>
  );
}

/* ============================== Results ============================== */
export function Results() {
  const r = useStore(s => s.result)!;
  const { rec, secPass, timeUp, items } = r;
  const failed = SEC_ORDER.filter(k => !secPass[k]);
  const wrongBy = (k: Section) => items.map((it, idx) => ({ it, idx })).filter(x => BY_ID[x.it.id].section === k && !isRight(x.it));
  const [open, setOpen] = React.useState<string[]>([]);
  const wrongTotal = items.filter(it => !isRight(it)).length;
  return (
    <TwoThirds>
      <Stack gap="gap-8">
        <Panel tone={rec.pass ? 'pass' : 'fail'} title={rec.pass ? 'You passed' : 'You did not pass this time'}>
          {timeUp && <p className="mb-2">Your time ran out.</p>}
          <p>{rec.pass ? 'You reached the pass mark in all three sections.' : `You did not reach the pass mark for ${failed.map(k => SECTIONS[k].name.toLowerCase()).join(' and ')}.`}</p>
        </Panel>
        <Table head={['Section', 'Your score', 'Pass mark', 'Result']} numeric={[1, 2]} rows={SEC_ORDER.map(k => [
          SECTIONS[k].name, <b>{rec.score[k]} / {SECTIONS[k].mock}</b>, SECTIONS[k].pass,
          <Tag colour={secPass[k] ? 'green' : 'red'}>{secPass[k] ? 'Pass' : 'Fail'}</Tag>,
        ])} />
        <Body>{rec.pass ? 'Take a few more mock tests to make sure you pass consistently before you book.' : 'The questions you got wrong have been added to smart review.'} Time used: {rec.mins} minutes.</Body>
        <ButtonGroup>
          {wrongTotal > 0 && <Button onClick={() => { actions.startQuiz(items.filter(it => !isRight(it)).map(it => BY_ID[it.id]), 'Mock test mistakes'); go('quiz'); }}>Practise the {wrongTotal} you got wrong</Button>}
          <Button variant="secondary" onClick={() => { actions.startTest(); go('test'); }}>Take another mock test</Button>
        </ButtonGroup>
        {wrongTotal > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="heading-l">Your mistakes</h2>
            <Accordion value={open} onValueChange={setOpen} items={SEC_ORDER.filter(k => wrongBy(k).length).map(k => ({
              id: 'r-' + k, title: SECTIONS[k].name, summary: `${wrongBy(k).length} wrong`,
              content: <div className="flex flex-col gap-5">{wrongBy(k).map(({ it, idx }) => <AnswerReview key={idx} item={it} index={idx} />)}</div>,
            }))} />
          </div>
        )}
      </Stack>
    </TwoThirds>
  );
}

export { SECTION_TAG };
