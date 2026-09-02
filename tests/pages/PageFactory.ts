import { Page } from '@playwright/test';
import { LoginPage } from './LoginPage';
import { InvestmentsPage } from './InvestmentsPage';
import { WastePage } from './WastePage';

export class PageFactory {
  constructor(private page: Page) {}

  login(): LoginPage {
    return new LoginPage(this.page);
  }

  investments(): InvestmentsPage {
    return new InvestmentsPage(this.page);
  }

  waste(): WastePage {
    return new WastePage(this.page);
  }
}
