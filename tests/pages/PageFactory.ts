import { Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { InvestmentsPage } from './InvestmentsPage';
import { ChartsPage } from './ChartsPage';
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

  charts(): ChartsPage {
    return new ChartsPage(this.page);
  }

  expenses(): ExpensesPage {
    return new ExpensesPage(this.page);
  }

  settings(): SettingsPage {
    return new SettingsPage(this.page);
  }
}
