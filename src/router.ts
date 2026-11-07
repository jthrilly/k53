import { useSyncExternalStore } from 'react';

const read = () => location.hash.replace(/^#/, '') || 'home';
export function useRoute() {
  return useSyncExternalStore(cb => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); }, read, () => 'home');
}
export function go(view: string) {
  if (read() === view) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = view;
  window.scrollTo(0, 0);
}
