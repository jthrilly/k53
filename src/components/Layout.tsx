import * as React from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import { Menu } from 'lucide-react';
import { Container, Tag, cx } from './ui';
import { actions, useStore, type Theme } from '../lib/store';

export const NAV = [
  { href: '#home', label: 'Home', match: ['home'] },
  { href: '#practice', label: 'Practise', match: ['practice', 'quiz', 'review'] },
  { href: '#mock', label: 'Mock test', match: ['mock', 'test', 'check', 'results'] },
  { href: '#signs', label: 'Road signs', match: ['signs', 'flashcards'] },
  { href: '#notes', label: 'Revision notes', match: ['notes'] },
  { href: '#progress', label: 'Your progress', match: ['progress'] },
];

function LPlate() {
  return (
    <span aria-hidden="true" className="grid size-8 place-items-center border-2 border-white bg-white">
      <span className="grid size-full place-items-center bg-[#d4351c] text-[1.1rem] font-extrabold leading-none text-white">L</span>
    </span>
  );
}

export function Header({ view }: { view: string }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [view]);
  const current = NAV.find(n => n.match.includes(view));
  return (
    <>
      <a href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}
        className="sr-only focus:not-sr-only focus:block focus:bg-focus focus:px-4 focus:py-2 focus:text-focus-ink focus:underline">Skip to main content</a>
      <header className="bg-header text-header-ink">
        <Container className="flex items-center justify-between gap-4 pt-2.5 pb-2">
          <a href="#home" className="group inline-flex items-center gap-2.5 text-[1.375rem] font-bold leading-none tracking-tight text-header-ink no-underline focus-visible:outline-none focus-visible:bg-focus focus-visible:text-focus-ink focus-visible:shadow-[0_-2px_var(--c-focus),0_4px_var(--c-focus-ink)]">
            <LPlate />
            <span className="group-hover:underline group-hover:decoration-[3px] group-hover:underline-offset-4">K53 Learner's Practice</span>
          </a>
        </Container>
        <div className="h-2 bg-brand" />
      </header>
      {/* Service navigation */}
      <Collapsible.Root open={open} onOpenChange={setOpen} className="border-b border-line bg-surface-alt">
        <Container>
          <div className="flex items-center justify-between md:hidden">
            <span className="body-m py-3 font-bold">{current?.label ?? 'Menu'}</span>
            <Collapsible.Trigger className="link body-m inline-flex items-center gap-1.5 py-3 font-bold">
              <Menu aria-hidden className="size-5" /> {open ? 'Close' : 'Menu'}
            </Collapsible.Trigger>
          </div>
          <nav aria-label="Menu" className="max-md:hidden">
            <NavList view={view} />
          </nav>
          <Collapsible.Panel className="md:hidden pb-2">
            <nav aria-label="Menu"><NavList view={view} /></nav>
          </Collapsible.Panel>
        </Container>
      </Collapsible.Root>
    </>
  );
}
function NavList({ view }: { view: string }) {
  return (
    <ul className="flex flex-col md:flex-row md:gap-8">
      {NAV.map(n => {
        const active = n.match.includes(view);
        return (
          <li key={n.href} className={cx('relative', active && 'md:shadow-[inset_0_-5px_0_var(--c-brand)] max-md:border-l-[5px] max-md:border-brand max-md:pl-3')}>
            <a href={n.href} aria-current={active ? 'page' : undefined}
              className={cx('link body-m inline-block py-2.5 md:py-4', active ? 'font-bold !text-ink no-underline hover:underline' : 'no-underline hover:underline')}>
              {n.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function PhaseBanner() {
  return (
    <div className="border-b border-line">
      <Container className="flex items-start gap-3 py-2.5">
        <Tag colour="blue" className="shrink-0 font-bold uppercase !text-[0.8rem] tracking-wide">Study aid</Tag>
        <p className="body-s pt-0.5">An unofficial study aid, not a Department of Transport service.</p>
      </Container>
    </div>
  );
}

export function Footer() {
  const theme = useStore(s => s.theme);
  const opts: [Theme, string][] = [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']];
  return (
    <footer className="mt-16 border-t-[10px] border-brand bg-surface-alt pt-8 pb-10">
      <Container className="flex flex-col gap-6 body-s">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-bold">Appearance:</span>
          {opts.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={theme === k} onClick={() => actions.setTheme(k)}
              className={cx('link', theme === k && 'font-bold !text-ink no-underline')}>{l}</button>
          ))}
        </div>
        <p className="max-w-[45em] text-muted">
          Questions and sign images are based on the Department of Transport's <i>SA Learner Driver Manual</i> (2012): Rules of the Road,
          Manual on Road Traffic Signs and Vehicle Controls, updated for later law changes. Check the current manual before your test.
        </p>
        <p className="text-muted">Your progress is saved in this browser only. <a className="link" href="https://github.com/jthrilly/k53">Source code</a></p>
      </Container>
    </footer>
  );
}
