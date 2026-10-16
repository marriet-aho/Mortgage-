export function money(n: number, currency: string = 'GHS'): string {
  return currency + ' ' + Math.round(n).toLocaleString('en-GB');
}

export function compactMoney(n: number): string {
  if (n >= 1e6) {
    return (n / 1e6).toFixed(1) + 'M';
  }
  if (n >= 1e3) {
    return Math.round(n / 1e3) + 'K';
  }
  return String(Math.round(n));
}

export function fmtDate(iso?: string): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso?: string): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function relTime(iso: string, now: number = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) { return 'just now'; }
  if (m < 60) { return m + ' min ago'; }
  const h = Math.round(m / 60);
  if (h < 24) { return h + ' h ago'; }
  const d = Math.round(h / 24);
  return d + (d === 1 ? ' day ago' : ' days ago');
}

export function duration(ms: number): string {
  const neg = ms < 0;
  const a = Math.abs(ms);
  const d = Math.floor(a / 86400000);
  const h = Math.floor((a % 86400000) / 3600000);
  const m = Math.floor((a % 3600000) / 60000);
  const body = d > 0 ? d + 'd ' + h + 'h' : h > 0 ? h + 'h ' + m + 'm' : m + 'm';
  return (neg ? '-' : '') + body;
}

export function title(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
}
