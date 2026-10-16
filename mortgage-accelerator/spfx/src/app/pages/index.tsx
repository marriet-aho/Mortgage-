import { AnalyticsPage, AuditPage, ExecutivePage } from './InsightPages';
import { CasesPage } from './CasesPage';
import { ConditionsPage, DisbursementPage, PostDisbursementPage } from './AfterApprovalPages';
import { DashboardPage } from './DashboardPage';
import { EquityPage, PurchasePage } from './ProductPages';
import { FitToLendPage, ValuationsPage } from './CollateralPages';
import { HomePage } from './HomePage';
import { HubPage } from './HubPage';
import { PropertiesPage } from './PropertiesPage';
import { ReadinessPage } from './ReadinessPage';
import { WizardPage } from './WizardPage';

/** Route table. The first URL segment picks the page. */
export const PAGES: { [segment: string]: () => JSX.Element } = {
  '': HomePage,
  purchase: PurchasePage,
  equity: EquityPage,
  apply: WizardPage,
  readiness: ReadinessPage,
  cases: CasesPage,
  hub: HubPage,
  valuations: ValuationsPage,
  properties: PropertiesPage,
  'fit-to-lend': FitToLendPage,
  conditions: ConditionsPage,
  disbursement: DisbursementPage,
  'post-disbursement': PostDisbursementPage,
  dashboard: DashboardPage,
  executive: ExecutivePage,
  analytics: AnalyticsPage,
  audit: AuditPage
};
