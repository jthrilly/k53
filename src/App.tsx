import * as React from 'react';
import { useRoute } from './router';
import { useStore } from './lib/store';
import { Header, PhaseBanner, Footer } from './components/Layout';
import { Container } from './components/ui';
import { Home, Practice, Quiz, startReview } from './screens/Study';
import { Mock, TestQuestion, CheckAnswers, Results } from './screens/Mock';
import { Signs, Flashcards, Notes, ProgressPage } from './screens/Reference';

const TITLES: Record<string, string> = {
  home: 'Prepare for your learner\'s licence test', practice: 'Practise questions', quiz: 'Practice question', mock: 'Mock test',
  test: 'Mock test question', check: 'Check your answers', results: 'Mock test result', signs: 'Road signs',
  flashcards: 'Sign flashcards', notes: 'Revision notes', progress: 'Your progress',
};

export function App() {
  let view = useRoute();
  const quiz = useStore(s => s.quiz);
  const test = useStore(s => s.test);
  const result = useStore(s => s.result);
  const flash = useStore(s => s.flashSet);

  if (view === 'review') { /* deep link: start a smart review session */ }
  if (view === 'quiz' && !quiz) view = 'practice';
  if ((view === 'test' || view === 'check') && !test) view = 'mock';
  if (view === 'results' && !result) view = 'mock';
  if (view === 'flashcards' && !flash) view = 'signs';
  if (!TITLES[view] && view !== 'review') view = 'home';

  React.useEffect(() => { if (view === 'review') { if (!startReview()) location.hash = 'practice'; } }, [view]);
  React.useEffect(() => { document.title = `${TITLES[view] ?? 'Smart review'} – K53 Learner's Practice`; }, [view]);
  const mainRef = React.useRef<HTMLElement>(null);
  const first = React.useRef(true);
  React.useEffect(() => { if (first.current) { first.current = false; return; } mainRef.current?.focus({ preventScroll: true }); }, [view]);

  const screen = (() => {
    switch (view) {
      case 'practice': return <Practice />;
      case 'quiz': return <Quiz />;
      case 'mock': return <Mock />;
      case 'test': return <TestQuestion />;
      case 'check': return <CheckAnswers />;
      case 'results': return <Results />;
      case 'signs': return <Signs />;
      case 'flashcards': return <Flashcards />;
      case 'notes': return <Notes />;
      case 'progress': return <ProgressPage />;
      case 'review': return null;
      default: return <Home />;
    }
  })();
  return (
    <div className="flex min-h-dvh flex-col">
      <Header view={view} />
      <PhaseBanner />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 focus:outline-none">
        <Container className="pt-6 pb-10 sm:pt-10">{screen}</Container>
      </main>
      <Footer />
    </div>
  );
}
