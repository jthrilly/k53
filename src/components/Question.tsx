import { BY_ID, LETTERS, imgSrc, isMark, diagramSrc, type Question as Q } from '../lib/data';
import type { Item } from '../lib/store';
import { Radios, type RadioOption, cx } from './ui';

export function QuestionFigure({ q }: { q: Q }) {
  if (q.diagram) {
    return (
      <figure className="border border-line bg-sign p-2 sm:p-4">
        <img src={diagramSrc(q)} alt={`Numbered diagram of a ${q.diagram === 'auto' ? 'car with an automatic gearbox' : 'car with a manual gearbox'}, controls 1 to 11`} className="mx-auto w-full max-w-[36rem]" />
      </figure>
    );
  }
  if (q.img) {
    return (
      <figure className="flex justify-center border border-line bg-sign p-4 sm:justify-start">
        <img src={imgSrc(q.img)} alt="The sign or road marking this question is about" className={cx('w-auto object-contain', isMark(q.img) ? 'h-52' : 'h-40 sm:h-44')} />
      </figure>
    );
  }
  return null;
}

/** One question as a fieldset of large radios. `reveal` marks right/wrong after checking. */
export function QuestionView({ item, onAnswer, reveal, error, legendId = 'question' }: {
  item: Item; onAnswer: (i: number) => void; reveal?: boolean; error?: string; legendId?: string;
}) {
  const q = BY_ID[item.id];
  const options: RadioOption[] = item.order.map((oi, pos) => {
    const o = q.opts[oi];
    const isImg = o.t.startsWith('img:');
    return {
      value: String(oi),
      label: isImg ? <span className="font-bold">{LETTERS[pos]}</span> : <span><span className="sr-only">{LETTERS[pos]}: </span>{o.t}</span>,
      image: isImg ? imgSrc(o.t.slice(4)) : undefined,
      mark: reveal ? (o.c ? 'right' : item.answer === oi ? 'wrong' : undefined) : undefined,
    };
  });
  return (
    <div className="flex flex-col gap-6">
      <QuestionFigure q={q} />
      <Radios
        id={legendId}
        name={`q-${q.id}`}
        legend={q.q}
        legendClass="heading-m sm:!text-[1.75rem] sm:!leading-tight"
        options={options}
        value={item.answer === null ? null : String(item.answer)}
        onChange={v => onAnswer(Number(v))}
        disabled={reveal}
        error={error}
      />
    </div>
  );
}
