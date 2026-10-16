import { Role } from './domain/types';

export interface NavDef {
  path: string;
  label: string;
  group: string;
  /** Roles that may open the page. ADMIN can always open everything. */
  roles: Role[] | 'ALL';
  /** Which of the 13 modules this page delivers. */
  module?: number;
}

const STAFF: Role[] = ['MORTGAGE_OFFICER', 'MORTGAGE_LEAD', 'HR', 'CREDIT', 'LEGAL', 'COLLATERAL', 'APPROVER', 'CREDIT_ADMIN', 'OPERATIONS', 'POST_DISBURSEMENT', 'EXECUTIVE', 'AUDITOR'];
const MORTGAGE: Role[] = ['MORTGAGE_OFFICER', 'MORTGAGE_LEAD'];

/** Navigation tree. Order is the order shown. */
export const NAV: NavDef[] = [
  { path: '/', label: 'Home', group: 'Workspace', roles: 'ALL' },
  { path: '/purchase', label: 'Home Purchase', group: 'Products', roles: 'ALL', module: 1 },
  { path: '/equity', label: 'Home Equity Release', group: 'Products', roles: 'ALL', module: 2 },
  { path: '/apply', label: 'Application wizard', group: 'Applications', roles: ['APPLICANT', ...MORTGAGE], module: 3 },
  { path: '/readiness', label: 'Readiness check', group: 'Applications', roles: ['APPLICANT', ...MORTGAGE, 'CREDIT'], module: 4 },
  { path: '/cases', label: 'Case management', group: 'Applications', roles: 'ALL', module: 5 },
  { path: '/hub', label: 'Collaboration hub', group: 'Collaboration', roles: 'ALL', module: 6 },
  { path: '/valuations', label: 'Valuations', group: 'Collateral', roles: ['COLLATERAL', 'VALUER', ...MORTGAGE, 'CREDIT', 'EXECUTIVE', 'AUDITOR'], module: 7 },
  { path: '/properties', label: 'Property repository', group: 'Collateral', roles: ['COLLATERAL', 'LEGAL', ...MORTGAGE, 'CREDIT', 'EXECUTIVE', 'AUDITOR'], module: 8 },
  { path: '/fit-to-lend', label: 'Fit-to-lend workspace', group: 'Collateral', roles: ['COLLATERAL', 'LEGAL', 'CREDIT_ADMIN', ...MORTGAGE, 'AUDITOR'], module: 9 },
  { path: '/conditions', label: 'Conditions tracker', group: 'After approval', roles: ['APPLICANT', ...STAFF], module: 10 },
  { path: '/disbursement', label: 'Disbursement', group: 'After approval', roles: ['CREDIT_ADMIN', 'OPERATIONS', 'APPROVER', ...MORTGAGE, 'EXECUTIVE', 'AUDITOR'] },
  { path: '/post-disbursement', label: 'Post-disbursement', group: 'After approval', roles: ['POST_DISBURSEMENT', 'LEGAL', ...MORTGAGE, 'EXECUTIVE', 'AUDITOR'] },
  { path: '/dashboard', label: 'Mortgage dashboard', group: 'Insight', roles: STAFF.filter(function (r) { return r !== 'EXECUTIVE'; }), module: 11 },
  { path: '/executive', label: 'Executive dashboard', group: 'Insight', roles: ['EXECUTIVE', 'MORTGAGE_LEAD', 'AUDITOR'], module: 12 },
  { path: '/analytics', label: 'Analytics', group: 'Insight', roles: ['MORTGAGE_LEAD', 'EXECUTIVE', 'CREDIT', 'AUDITOR'], module: 13 },
  { path: '/audit', label: 'Audit trail', group: 'Insight', roles: 'ALL' }
];

export function allowed(n: NavDef, roles: Role[]): boolean {
  if (n.roles === 'ALL' || roles.indexOf('ADMIN') >= 0) {
    return true;
  }
  const list = n.roles;
  return roles.some(function (r) { return list.indexOf(r) >= 0; });
}
