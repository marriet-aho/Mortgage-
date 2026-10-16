import * as React from 'react';
import { AdvanceFlowClient } from './services/client';
import { AppNotification, UserContext } from './domain/types';
import { FileStore } from './services/fileStore';

export interface Route {
  segments: string[];
  query: { [k: string]: string };
}

export interface AppCtx {
  client: AdvanceFlowClient;
  files: FileStore;
  user: UserContext;
  route: Route;
  go: (path: string) => void;
  toast: (message: string) => void;
  /** Bumped whenever data changes (mutation or push notification). Pages re-fetch on change. */
  version: number;
  bump: () => void;
  notifications: AppNotification[];
}

export const Ctx = React.createContext<AppCtx | undefined>(undefined);

export function useApp(): AppCtx {
  const c = React.useContext(Ctx);
  if (!c) {
    throw new Error('useApp must be used inside <MortgageApp>');
  }
  return c;
}

export function parseHash(hash: string, fallback: string): Route {
  let h = hash.replace(/^#/, '');
  if (!h || h === '/') {
    h = fallback;
  }
  const qi = h.indexOf('?');
  const path = qi >= 0 ? h.slice(0, qi) : h;
  const query: { [k: string]: string } = {};
  if (qi >= 0) {
    h.slice(qi + 1).split('&').forEach(function (kv) {
      const p = kv.split('=');
      if (p[0]) {
        query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      }
    });
  }
  return { segments: path.split('/').filter(Boolean), query };
}

export interface AsyncState<T> {
  data?: T;
  error?: string;
  loading: boolean;
  reload: () => void;
}

/** Fetches on mount, on dependency change and whenever app data changes. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const app = useApp();
  const [state, setState] = React.useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [tick, setTick] = React.useState(0);
  React.useEffect(function () {
    let live = true;
    fn().then(
      function (data) { if (live) { setState({ data, loading: false }); } },
      function (e) { if (live) { setState({ error: e instanceof Error ? e.message : String(e), loading: false }); } }
    );
    return function () { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.version, tick].concat(deps as number[]));
  return { data: state.data, error: state.error, loading: state.loading && state.data === undefined, reload: function () { setTick(function (t) { return t + 1; }); } };
}

/** Runs a mutation, shows its error as a toast and refreshes data afterwards. */
export function useAction(): (fn: () => Promise<unknown>, success?: string) => Promise<boolean> {
  const app = useApp();
  return React.useCallback(async function (fn: () => Promise<unknown>, success?: string): Promise<boolean> {
    try {
      await fn();
      if (success) {
        app.toast(success);
      }
      app.bump();
      return true;
    } catch (e) {
      app.toast(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, [app]);
}
