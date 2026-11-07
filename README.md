# K53 Learner's Practice

A study app (installable PWA) for the South African **K53 learner's licence test, Code 2** (light motor vehicle / car).

**Live app:** https://jthrilly.github.io/k53/

## What's in it

- **672 practice questions** across the three test sections: 62 vehicle controls, 417 signs/signals/markings, 193 rules of the road. Each one has an explanation and a reference to the manual section it comes from.
- **Mock test** shaped like the computerised test: 64 questions (8 controls, 28 signs, 28 rules) with a 60-minute timer. You can flag questions and jump between them. Each section is marked against its own pass mark (6, 23, 22), and you must pass all three.
- **Smart review**: questions you get wrong come back on a spaced-repetition schedule. A question counts as "mastered" after three correct answers in a row, spaced over days.
- **Sign gallery** of all 152 signs cropped from the official manual, with search, a "hide names" self-test mode and flashcards.
- **Revision notes** covering key numbers, parking/stopping distances, lights, alcohol limits, traffic lights, the controls diagram and changes since 2012.
- Works offline once it has loaded, and can be installed to your home screen. Progress is saved in the browser on that device only.

## Sources

- Department of Transport, *SA Learner Driver Manual* (2012): Rules of the Road; Manual on Road Traffic Signs (v1.02); Vehicle Controls Manual. The same files are at natis.gov.za. All sign images and the controls diagrams are taken from these manuals.
- Test format (64 questions, 8/28/28, pass marks 6/23/22) as published by the RTMC and testing centres for the computerised learner's licence test, as of November 2026.
- Post-2012 law changes reflected in the questions:
  - breath alcohol limit 0,24 mg per 1 000 ml (0,10 for professional drivers);
  - children under 3 must be in a child restraint (reg. 213(6A), 2015).

  The zero-alcohol limit is still only a proposal and AARTO demerit points are not in force, so neither is tested.

Every question was checked against the manual text by independent reviewers. Road-marking and traffic-light pictures are simplified drawings, not official artwork.

This is not an official DoT product. Always check the current manual.

## Design

The interface follows the approach of the GOV.UK Design System: plain pages, one question per page, large radio buttons, "check your answers" before finishing, and a yellow focus highlight. It does not use any GOV.UK branding or its typeface. The typeface is Public Sans.

- **Components:** [Base UI](https://base-ui.com) (headless and accessible) for radios, checkboxes, accordions, tabs, dialogs, progress bars and collapsibles. They are styled in `src/components/ui.tsx`.
- **Design tokens:** semantic colour tokens in `src/styles.css` (`--c-*` mapped to Tailwind `bg-surface`, `text-ink`, `border-line` and so on), with light and dark values. The type scale is the `heading-xl` … `body-s` utilities.
- **App:** React with hash routing (`#practice`, `#mock` …). Progress is kept in `localStorage`, and a mock test in progress survives a page reload.

## Running locally

```sh
npm install
npm run dev        # development server
npm run build      # production build in dist/ (also writes dist/sw.js for offline use)
```

## Editing questions

Questions live in `source/rules.txt`, `source/controls.txt` and `source/signs.txt`:

| Line | Meaning |
|---|---|
| `@` | topic |
| `Q` | question (further lines before the options continue it) |
| `- ` | wrong option |
| `-* ` | correct option |
| `F` | keep the option order |
| `D` / `D auto` | show the manual / automatic controls diagram |
| `I key` | picture |
| `E` | explanation |
| `R` | source |

Two questions per sign are also generated from `source/signs.json`. Rebuild after editing:

```sh
npm run questions        # python3 tools/build.py → src/data/questions.json
python3 tools/marks.py   # regenerates road-marking / traffic-light SVGs in public/img/marks
```

## Hosting

`.github/workflows/pages.yml` builds the app and deploys it to GitHub Pages on every push to `main`. Set the repository's **Settings → Pages → Source** to **GitHub Actions**. The build uses relative paths, so `dist/` also works on any static host.
