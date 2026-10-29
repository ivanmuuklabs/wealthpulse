import { Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { InvestmentsPage } from './InvestmentsPage';
import { SettingsPage } from './SettingsPage';
import { ExpensesPage } from './ExpensesPage';
import { DashboardPage } from './DashboardPage';
import { BudgetsPage } from './BudgetsPage';

export class PageFactory {
  constructor(private page: Page) {}

  login(): LoginPage {
    return new LoginPage(this.page);
  }

  investments(): InvestmentsPage {
    return new InvestmentsPage(this.page);
  }

  settings(): SettingsPage {
    return new SettingsPage(this.page);
  }

  expenses(): ExpensesPage {
    return new ExpensesPage(this.page);
  }

  dashboard(): DashboardPage {
    return new DashboardPage(this.page);
  }

  budgets(): BudgetsPage {
    return new BudgetsPage(this.page);
  }
}
