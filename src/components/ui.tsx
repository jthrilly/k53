/* Design-system components. Behaviour from Base UI (headless, accessible); look from the token utilities in styles.css. */
import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Progress } from '@base-ui/react/progress';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { Collapsible } from '@base-ui/react/collapsible';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { ChevronDown, ChevronRight, ChevronLeft, Check, X, TriangleAlert } from 'lucide-react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- Layout ---------- */
export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-page px-4 sm:px-[30px]', className)}>{children}</div>;
}
export function TwoThirds({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="grid gap-x-[30px] gap-y-10 md:grid-cols-3">
      <div className="min-w-0 md:col-span-2">{children}</div>
      {aside && <aside className="min-w-0">{aside}</aside>}
    </div>
  );
}
export const Stack = ({ children, gap = 'gap-6', className }: { children: React.ReactNode; gap?: string; className?: string }) => (
  <div className={cx('flex flex-col', gap, className)}>{children}</div>
);

/* ---------- Typography ---------- */
export const Caption = ({ children, size = 'l' }: { children: React.ReactNode; size?: 'l' | 'm' }) => (
  <span className={cx('block', size === 'l' ? 'caption-l mb-1' : 'caption-m mb-1')}>{children}</span>
);
export const Lead = ({ children }: { children: React.ReactNode }) => <p className="body-l max-w-[30em]">{children}</p>;
export const Body = ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={cx('body-m max-w-[38em]', className)}>{children}</p>;
export const Small = ({ children, className }: { children: React.ReactNode; className?: string }) => <p className={cx('body-s text-muted', className)}>{children}</p>;
export const Link = ({ href, children, className, onClick }: { href?: string; children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) => (
  <a href={href ?? '#'} onClick={onClick} className={cx('link', className)}>{children}</a>
);
export const SectionBreak = ({ visible = true, size = 'l' }: { visible?: boolean; size?: 'm' | 'l' | 'xl' }) => (
  <hr className={cx('border-0', visible && 'border-t border-line', size === 'm' ? 'my-5' : size === 'l' ? 'my-8' : 'my-12')} />
);

/* ---------- Buttons ---------- */
type BtnVariant = 'primary' | 'secondary' | 'warning' | 'start';
const btnBase = 'relative inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-none border-2 border-transparent px-3 pt-2 pb-[7px] body-m font-normal leading-tight text-center cursor-pointer select-none mb-[2px] ' +
  'focus-visible:outline-3 focus-visible:outline-transparent focus-visible:!bg-focus focus-visible:!text-focus-ink focus-visible:!shadow-[0_2px_0_var(--c-focus-ink)] active:translate-y-[2px] active:shadow-none data-disabled:opacity-50 data-disabled:cursor-not-allowed';
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-btn text-btn-ink shadow-[0_2px_0_var(--c-btn-shadow)] hover:bg-btn-hover',
  start: 'bg-btn text-btn-ink shadow-[0_2px_0_var(--c-btn-shadow)] hover:bg-btn-hover font-bold heading-m !text-[1.1875rem] sm:!text-2xl px-4 pt-3 pb-[11px]',
  secondary: 'bg-btn2 text-btn2-ink shadow-[0_2px_0_var(--c-btn2-shadow)] hover:bg-btn2-hover',
  warning: 'bg-error-fill text-white shadow-[0_2px_0_#55150b] hover:brightness-90',
};
export function Button({ variant = 'primary', className, children, ...rest }: React.ComponentProps<typeof BaseButton> & { variant?: BtnVariant }) {
  return (
    <BaseButton className={cx(btnBase, btnVariants[variant], className as string)} {...rest}>
      {children}
      {variant === 'start' && <StartArrow />}
    </BaseButton>
  );
}
export function ButtonLink({ variant = 'primary', href, children, className }: { variant?: BtnVariant; href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} role="button" draggable={false} className={cx(btnBase, btnVariants[variant], 'no-underline', className)}>
      {children}
      {variant === 'start' && <StartArrow />}
    </a>
  );
}
const StartArrow = () => (
  <svg aria-hidden="true" focusable="false" width="17.5" height="19" viewBox="0 0 33 40" className="ml-1 shrink-0 fill-current">
    <path d="M0 0h13l20 20-20 20H0l20-20z" />
  </svg>
);
export const ButtonGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 [&>a.link]:self-center sm:[&>a.link]:self-auto">{children}</div>
);

/* ---------- Tags ---------- */
export type TagColour = 'blue' | 'green' | 'red' | 'yellow' | 'grey' | 'orange';
const tagC: Record<TagColour, string> = {
  blue: 'bg-tag-blue-bg text-tag-blue', green: 'bg-tag-green-bg text-tag-green', red: 'bg-tag-red-bg text-tag-red',
  yellow: 'bg-tag-yellow-bg text-tag-yellow', grey: 'bg-tag-grey-bg text-tag-grey', orange: 'bg-tag-orange-bg text-tag-orange',
};
export const Tag = ({ colour = 'blue', children, className }: { colour?: TagColour; children: React.ReactNode; className?: string }) => (
  <strong className={cx('inline-block max-w-max px-2 pt-[2px] pb-[3px] body-s !text-[0.875rem] sm:!text-base font-normal leading-snug', tagC[colour], className)}>{children}</strong>
);
export const SECTION_TAG: Record<string, TagColour> = { controls: 'orange', signs: 'red', rules: 'blue' };

/* ---------- Content blocks ---------- */
export const Inset = ({ children }: { children: React.ReactNode }) => (
  <div className="body-m max-w-[38em] border-l-[10px] border-line py-1 pl-4">{children}</div>
);
export const WarningText = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-4 body-m font-bold">
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-page text-2xl font-bold leading-none">!</span>
    <span className="pt-1"><span className="sr-only">Warning </span>{children}</span>
  </div>
);
export function Panel({ tone = 'pass', title, children }: { tone?: 'pass' | 'fail'; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className={cx('border-[5px] border-transparent p-6 text-center text-panel-ink sm:p-9', tone === 'pass' ? 'bg-panel-pass' : 'bg-panel-fail')}>
      <h1 className="heading-xl">{title}</h1>
      {children && <div className="body-l mt-4">{children}</div>}
    </div>
  );
}
export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'success' | 'error'; title: string; children?: React.ReactNode }) {
  const border = tone === 'success' ? 'border-success' : tone === 'error' ? 'border-error' : 'border-brand';
  const head = tone === 'success' ? 'bg-btn' : tone === 'error' ? 'bg-error-fill' : 'bg-brand';
  return (
    <div role={tone === 'info' ? 'region' : 'alert'} className={cx('border-[5px]', border)}>
      <div className={cx('px-4 pt-[2px] pb-[5px] body-m font-bold text-white', head)}>{title}</div>
      {children && <div className="bg-surface px-4 py-4 body-m sm:px-5">{children}</div>}
    </div>
  );
}
export function ErrorSummary({ errors }: { errors: { text: string; href: string }[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="border-[5px] border-error p-4 focus-box sm:p-5">
      <h2 className="heading-m mb-3">There is a problem</h2>
      <ul>{errors.map(e => <li key={e.text}><a className="link font-bold !text-error" href={e.href} onClick={ev => { ev.preventDefault(); document.querySelector<HTMLElement>(e.href)?.focus(); }}>{e.text}</a></li>)}</ul>
    </div>
  );
}
export const BackLink = ({ href, children = 'Back', onClick }: { href?: string; children?: React.ReactNode; onClick?: (e: React.MouseEvent) => void }) => (
  <a href={href ?? '#'} onClick={onClick} className="link body-s inline-flex items-center gap-1 !text-ink">
    <ChevronLeft aria-hidden className="size-4" strokeWidth={3} />{children}
  </a>
);

/* ---------- Summary list (key / value / action rows) ---------- */
export function SummaryList({ rows, compactKey }: { rows: { key: React.ReactNode; value: React.ReactNode; action?: React.ReactNode }[]; compactKey?: boolean }) {
  return (
    <dl className="body-m">
      {rows.map((r, i) => (
        <div key={i} className={cx('grid gap-x-5 gap-y-1 border-b border-line py-3', compactKey ? 'grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[7.5rem_minmax(0,1fr)_auto]' : 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_auto]')}>
          <dt className="font-bold">{r.key}</dt>
          <dd className={cx('min-w-0', compactKey && 'max-sm:col-span-2 max-sm:row-start-2')}>{r.value}</dd>
          {r.action && <dd className={cx('sm:text-right', compactKey && 'max-sm:col-start-2 max-sm:row-start-1 text-right')}>{r.action}</dd>}
        </div>
      ))}
    </dl>
  );
}

/* ---------- Table ---------- */
export function Table({ caption, head, rows, numeric = [] }: { caption?: string; head: React.ReactNode[]; rows: React.ReactNode[][]; numeric?: number[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse body-m tabular-nums">
        {caption && <caption className="heading-m mb-4 text-left">{caption}</caption>}
        <thead><tr>{head.map((h, i) => <th key={i} scope="col" className={cx('border-b border-line py-2.5 pr-5 text-left font-bold last:pr-0', numeric.includes(i) && 'text-right')}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className={cx('border-b border-line py-2.5 pr-5 align-top last:pr-0', numeric.includes(ci) && 'text-right')}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/* ---------- Progress bar ---------- */
export function ProgressBar({ value, label, valueText, tone = 'brand', thin, srLabel }: { value: number; label?: string; valueText?: string; tone?: 'brand' | 'success'; thin?: boolean; srLabel?: string }) {
  return (
    <Progress.Root value={value} className="flex flex-col gap-1.5" aria-label={srLabel ?? label}>
      {(label || valueText) && (
        <div className="flex justify-between gap-3 body-s">
          {label && <Progress.Label className="text-muted">{label}</Progress.Label>}
          {valueText && <span className="font-bold tabular-nums">{valueText}</span>}
        </div>
      )}
      <Progress.Track className={cx('w-full overflow-hidden bg-surface-alt outline outline-1 -outline-offset-1 outline-line', thin ? 'h-1.5' : 'h-2.5')}>
        <Progress.Indicator className={cx('block h-full transition-[width] duration-300', tone === 'success' ? 'bg-success' : 'bg-brand')} />
      </Progress.Track>
    </Progress.Root>
  );
}

/* ---------- Radios (large, GOV.UK-sized targets) ---------- */
export type RadioOption = { value: string; label: React.ReactNode; hint?: React.ReactNode; mark?: 'right' | 'wrong'; image?: string };
export function Radios({ name, legend, legendClass = 'heading-l', hint, options, value, onChange, disabled, inline, error, id }: {
  name: string; legend: React.ReactNode; legendClass?: string; hint?: React.ReactNode; options: RadioOption[]; value: string | null;
  onChange: (v: string) => void; disabled?: boolean; inline?: boolean; error?: string; id?: string;
}) {
  const legendId = React.useId();
  return (
    <div className={cx(error && 'border-l-[5px] border-error pl-4')}>
      <RadioGroup
        id={id}
        name={name}
        aria-labelledby={legendId}
        value={value ?? ''}
        onValueChange={v => onChange(String(v))}
        disabled={disabled}
        className="flex flex-col gap-3"
      >
        <div id={legendId} className={cx(legendClass, 'mb-1 whitespace-pre-line')}>{legend}</div>
        {hint && <div className="body-m -mt-2 mb-1 text-muted">{hint}</div>}
        {error && <p className="body-m font-bold text-error"><span className="sr-only">Error: </span>{error}</p>}
        <div className={cx('flex', inline ? 'flex-row flex-wrap gap-x-6 gap-y-3' : 'flex-col gap-3')}>
          {options.map(o => (
            <label key={o.value} className={cx('group/radio flex items-start gap-3 body-m', disabled ? 'cursor-default' : 'cursor-pointer')}>
              <Radio.Root
                value={o.value}
                className={cx('relative grid size-10 shrink-0 place-items-center rounded-full border-2 border-line-strong bg-surface',
                  'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--c-focus)]',
                  'data-disabled:opacity-100',
                  o.mark === 'right' && 'border-success', o.mark === 'wrong' && 'border-error')}
              >
                <Radio.Indicator className={cx('size-5 rounded-full data-unchecked:hidden', o.mark === 'right' ? 'bg-success' : o.mark === 'wrong' ? 'bg-error' : 'bg-ink')} />
              </Radio.Root>
              <span className="flex min-w-0 flex-1 flex-col gap-1 pt-[7px]">
                {o.image ? (
                  <span className="flex flex-wrap items-center gap-3">
                    {o.label}
                    <img src={o.image} alt={typeof o.label === 'string' ? `Option ${o.label}` : ''} className="h-24 w-auto max-w-[9rem] border border-line bg-sign object-contain p-1.5" />
                  </span>
                ) : <span>{o.label}</span>}
                {o.hint && <span className="text-muted">{o.hint}</span>}
                {o.mark && (
                  <span className={cx('inline-flex items-center gap-1 font-bold', o.mark === 'right' ? 'text-success' : 'text-error')}>
                    {o.mark === 'right' ? <Check aria-hidden className="size-5" strokeWidth={3} /> : <X aria-hidden className="size-5" strokeWidth={3} />}
                    {o.mark === 'right' ? 'Correct answer' : 'Your answer'}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

/* ---------- Checkbox ---------- */
export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 body-m">
      <BaseCheckbox.Root checked={checked} onCheckedChange={v => onChange(!!v)}
        className="grid size-10 shrink-0 place-items-center border-2 border-line-strong bg-surface focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--c-focus)]">
        <BaseCheckbox.Indicator className="data-unchecked:hidden"><Check className="size-7" strokeWidth={3.5} aria-hidden /></BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <span className="pt-[7px]">{children}</span>
    </label>
  );
}

/* ---------- Text input and select (native elements, styled) ---------- */
export const fieldClass = 'body-m w-full rounded-none border-2 border-line-strong bg-surface px-2 py-[5px] text-ink focus:outline-3 focus:outline-focus focus:outline-offset-0 focus:shadow-[inset_0_0_0_2px_var(--c-focus-ink)]';
export function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="body-m font-bold">{label}</label>
      {hint && <div className="body-m text-muted">{hint}</div>}
      {children}
    </div>
  );
}

/* ---------- Confirm dialog ---------- */
export function ConfirmDialog({ trigger, title, description, confirm, onConfirm, tone = 'warning' }: {
  trigger: React.ReactElement; title: string; description: React.ReactNode; confirm: string; onConfirm: () => void; tone?: 'warning' | 'primary';
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={trigger} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-black/60 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border-[5px] border-line-strong bg-surface p-6 text-ink focus:outline-none sm:p-8">
          <AlertDialog.Title className="heading-m mb-3">{title}</AlertDialog.Title>
          <AlertDialog.Description render={<div />} className="body-m mb-6 flex flex-col gap-3">{description}</AlertDialog.Description>
          <ButtonGroup>
            <AlertDialog.Close render={<Button variant={tone} onClick={onConfirm}>{confirm}</Button>} />
            <AlertDialog.Close className="link body-m">Cancel</AlertDialog.Close>
          </ButtonGroup>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/* ---------- Details (Collapsible) ---------- */
export function Details({ summary, children, defaultOpen }: { summary: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen} className="body-m">
      <Collapsible.Trigger className="link group inline-flex items-center gap-1.5 text-left">
        <ChevronRight aria-hidden className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-90" strokeWidth={3} />
        <span>{summary}</span>
      </Collapsible.Trigger>
      <Collapsible.Panel className="mt-3 border-l-[5px] border-line pl-4 pt-1 pb-2">{children}</Collapsible.Panel>
    </Collapsible.Root>
  );
}

/* ---------- Accordion ---------- */
export function Accordion({ items, value, onValueChange }: {
  items: { id: string; title: React.ReactNode; summary?: React.ReactNode; content: React.ReactNode }[];
  value: string[]; onValueChange: (v: string[]) => void;
}) {
  const allOpen = value.length === items.length;
  return (
    <div>
      <button type="button" className="link body-m mb-2 inline-flex items-center gap-2" onClick={() => onValueChange(allOpen ? [] : items.map(i => i.id))}>
        <ChevronDown aria-hidden className={cx('size-5 rounded-full bg-ink p-0.5 text-page transition-transform', allOpen && 'rotate-180')} strokeWidth={3} />
        {allOpen ? 'Hide all sections' : 'Show all sections'}
      </button>
      <BaseAccordion.Root multiple value={value} onValueChange={v => onValueChange(v as string[])} className="border-b border-line">
        {items.map(it => (
          <BaseAccordion.Item key={it.id} value={it.id} id={it.id} className="border-t border-line scroll-mt-4">
            <BaseAccordion.Header>
              <BaseAccordion.Trigger className="group flex w-full flex-col items-start gap-2 py-4 text-left focus-visible:outline-none">
                <span className="heading-m group-hover:underline group-focus-visible:bg-focus group-focus-visible:text-focus-ink group-focus-visible:shadow-[0_-2px_var(--c-focus),0_4px_var(--c-focus-ink)]">{it.title}</span>
                {it.summary && <span className="body-m text-muted">{it.summary}</span>}
                <span className="inline-flex items-center gap-2 body-s text-link group-focus-visible:bg-focus group-focus-visible:text-focus-ink">
                  <ChevronDown aria-hidden className="size-5 rounded-full border border-current p-0.5 transition-transform group-data-panel-open:rotate-180" strokeWidth={3} />
                  <span className="group-data-panel-open:hidden">Show</span><span className="hidden group-data-panel-open:inline">Hide</span>
                  <span className="sr-only"> this section</span>
                </span>
              </BaseAccordion.Trigger>
            </BaseAccordion.Header>
            <BaseAccordion.Panel className="pb-8 pt-1">{it.content}</BaseAccordion.Panel>
          </BaseAccordion.Item>
        ))}
      </BaseAccordion.Root>
    </div>
  );
}

/* ---------- Tabs (GOV.UK style on wide screens, list of links on narrow) ---------- */
export function Tabs({ tabs, value, onValueChange, label }: { tabs: { value: string; label: string; content: React.ReactNode }[]; value: string; onValueChange: (v: string) => void; label: string }) {
  return (
    <BaseTabs.Root value={value} onValueChange={v => onValueChange(String(v))}>
      <BaseTabs.List aria-label={label} className="flex flex-wrap gap-x-1 gap-y-1 border-b border-line max-sm:flex-col max-sm:border-b-0 max-sm:gap-0">
        {tabs.map(t => (
          <BaseTabs.Tab key={t.value} value={t.value}
            className="body-m cursor-pointer text-left text-link underline sm:-mb-px sm:border sm:border-transparent sm:bg-surface-alt sm:px-5 sm:pt-2 sm:pb-2.5 sm:text-ink hover:text-link-hover focus-visible:outline-none focus-visible:bg-focus focus-visible:text-focus-ink data-active:no-underline sm:data-active:border-line sm:data-active:border-b-surface sm:data-active:bg-surface sm:data-active:pt-3.5 sm:data-active:pb-4 sm:data-active:-mt-1.5 max-sm:py-1 max-sm:data-active:font-bold max-sm:data-active:text-ink">
            {t.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {tabs.map(t => (
        <BaseTabs.Panel key={t.value} value={t.value} className="pt-6 focus-visible:outline-3 focus-visible:outline-focus sm:border sm:border-t-0 sm:border-line sm:px-5 sm:pb-6 max-sm:border-t max-sm:border-line max-sm:mt-4">
          {t.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}

export { TriangleAlert, cx };
