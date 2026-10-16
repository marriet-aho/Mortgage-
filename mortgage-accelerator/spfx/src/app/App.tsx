import * as React from 'react';
import { Ctx, AppCtx, parseHash, Route } from './context';
import { AdvanceFlowClient } from './services/client';
import { FileStore } from './services/fileStore';
import { AppNotification, Role, UserContext } from './domain/types';
import { relTime } from './format';
import { injectStyles } from './styles';
import { NAV, NavDef, allowed } from './nav';
import { Button, Loading } from './components/ui';
import { PAGES } from './pages';

export interface MortgageAppProps {
  client: AdvanceFlowClient;
  files: FileStore;
  /** Route shown when the URL has no hash, for example when a SharePoint page pins one module. */
  defaultRoute?: string;
  /** Local harness only: a role switcher rendered in the top bar. */
  toolbar?: React.ReactNode;
  /** Changes when the harness switches identity, so the user is reloaded. */
  identityKey?: string;
}

export function MortgageApp(props: MortgageAppProps): JSX.Element {
  injectStyles();
  const fallback = props.defaultRoute || '/';
  const [route, setRoute] = React.useState<Route>(parseHash(window.location.hash, fallback));
  const [user, setUser] = React.useState<UserContext | undefined>(undefined);
  const [version, setVersion] = React.useState(0);
  const [notes, setNotes] = React.useState<AppNotification[]>([]);
  const [toasts, setToasts] = React.useState<Array<{ id: number; text: string }>>([]);
  const [open, setOpen] = React.useState(false);
  const toastId = React.useRef(0);

  React.useEffect(function () {
    const on = function (): void { setRoute(parseHash(window.location.hash, fallback)); };
    window.addEventListener('hashchange', on);
    return function () { window.removeEventListener('hashchange', on); };
  }, [fallback]);

  const toast = React.useCallback(function (text: string): void {
    const id = ++toastId.current;
    setToasts(function (t) { return t.concat([{ id, text }]); });
    window.setTimeout(function () { setToasts(function (t) { return t.filter(function (x) { return x.id !== id; }); }); }, 5200);
  }, []);
  const bump = React.useCallback(function (): void { setVersion(function (v) { return v + 1; }); }, []);

  React.useEffect(function () {
    let live = true;
    props.client.getCurrentUser().then(function (u) { if (live) { setUser(u); } }, function (e) { toast(String(e)); });
    props.client.listNotifications().then(function (n) { if (live) { setNotes(n); } });
    return function () { live = false; };
  }, [props.client, props.identityKey, version === -1]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(function () {
    return props.client.subscribe(function (n) {
      setNotes(function (prev) { return [n].concat(prev); });
      toast(n.title + ': ' + n.body);
      bump();
    });
  }, [props.client, toast, bump]);

  const go = React.useCallback(function (path: string): void {
    window.location.hash = '#' + path;
    setOpen(false);
    window.scrollTo(0, 0);
  }, []);

  if (!user) {
    return <div className="ma-root"><div style={{ padding: 24 }}><Loading /></div></div>;
  }

  const ctx: AppCtx = { client: props.client, files: props.files, user, route, go, toast, version, bump, notifications: notes };
  const roles = user.roles;
  const seg = '/' + (route.segments[0] || '');
  const current = NAV.filter(function (n) { return n.path === seg; })[0];
  const Page = PAGES[route.segments[0] || ''] || PAGES[''];
  const permitted = !current || allowed(current, roles);
  const unread = notes.filter(function (n) { return !n.read; }).length;
  const groups: string[] = [];
  NAV.forEach(function (n) { if (allowed(n, roles) && groups.indexOf(n.group) < 0) { groups.push(n.group); } });

  return (
    <Ctx.Provider value={ctx}>
      <div className="ma-root">
        <div className="ma-shell">
          <aside className="ma-side" aria-label="Mortgage Accelerator navigation">
            <div className="ma-brand"><div className="ma-mark">A</div><div><b>Mortgage Accelerator</b><span>Advance Flow LOS</span></div></div>
            {groups.map(function (g) {
              return (
                <div key={g}>
                  <div className="ma-navgroup">{g}</div>
                  {NAV.filter(function (n) { return n.group === g && allowed(n, roles); }).map(function (n: NavDef) {
                    return (
                      <button key={n.path} type="button" className="ma-nav" aria-current={seg === n.path ? 'page' : undefined} onClick={function () { go(n.path === '/' ? '/' : n.path); }}>
                        <span>{n.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </aside>
          <div className="ma-main">
            <div className="ma-top">
              <div className="ma-row">{props.toolbar}</div>
              <div className="ma-row" style={{ gap: 14 }}>
                <div className="ma-bell">
                  <Button small onClick={function () { setOpen(!open); }} title="Notifications">Notifications{unread ? <span className="ma-badge">{unread}</span> : null}</Button>
                  {open ? (
                    <div className="ma-drawer" role="dialog" aria-label="Notifications">
                      {notes.length === 0 ? <div className="item muted">Nothing yet.</div> : notes.slice(0, 20).map(function (n) {
                        return (
                          <div key={n.id} className={'item' + (n.read ? '' : ' unread')} onClick={function () { void props.client.markNotificationRead(n.id).then(function () { setNotes(function (p) { return p.map(function (x) { return x.id === n.id ? { ...x, read: true } : x; }); }); }); if (n.caseId) { go('/cases/' + n.caseId); } }}>
                            <b>{n.title}</b>
                            <div className="small">{n.body}</div>
                            <div className="small muted">{relTime(n.at)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="small"><b>{user.displayName}</b><div className="muted">{roles.join(', ').toLowerCase().replace(/_/g, ' ')}</div></div>
              </div>
            </div>
            <main className="ma-page">
              {permitted ? <Page /> : <div className="ma-need"><b>You do not have access to this page.</b> Your role does not include it.</div>}
            </main>
          </div>
        </div>
        <div className="ma-toast" aria-live="polite">{toasts.map(function (t) { return <div key={t.id}>{t.text}</div>; })}</div>
      </div>
    </Ctx.Provider>
  );
}

export type { Role };
