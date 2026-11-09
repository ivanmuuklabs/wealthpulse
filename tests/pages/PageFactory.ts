import { Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { InvestmentsPage } from './InvestmentsPage';
import { BudgetsPage } from './BudgetsPage';
import { ExpensesPage } from './ExpensesPage';

export class PageFactory {
  constructor(private page: Page) {}

  login(): LoginPage {
    return new LoginPage(this.page);
  }

  investments(): InvestmentsPage {
    return new InvestmentsPage(this.page);
  }

  budgets(): BudgetsPage {
    return new BudgetsPage(this.page);
  }

  expenses(): ExpensesPage {
    return new ExpensesPage(this.page);
  }
}
