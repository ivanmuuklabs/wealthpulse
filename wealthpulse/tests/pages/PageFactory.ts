import { Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { InvestmentsPage } from './InvestmentsPage';
import { DashboardPage } from './DashboardPage';
import { ExpensesPage } from './ExpensesPage';
import { SettingsPage } from './SettingsPage';

export class PageFactory {
  constructor(private page: Page) {}

  login(): LoginPage {
    return new LoginPage(this.page);
  }

  investments(): InvestmentsPage {
    return new InvestmentsPage(this.page);
  }

  dashboard(): DashboardPage {
    return new DashboardPage(this.page);
  }

  expenses(): ExpensesPage {
    return new ExpensesPage(this.page);
  }

  settings(): SettingsPage {
    return new SettingsPage(this.page);
  }
}
