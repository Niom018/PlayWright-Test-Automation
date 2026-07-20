import { Page, expect } from '@playwright/test';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

/** Agent-role actions: login, balance check, and depositing to a customer. */
export class AgentService extends BaseService {
  private readonly auth: AuthService;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthService(page);
  }

  async login(email: string, password: string): Promise<void> {
    await this.auth.login(email, password);
  }

  /** Reads the agent's current balance from their profile page. */
  async getBalance(): Promise<number> {
    await this.goto('/profile');

    const balanceField = this.page.getByLabel('Current Balance (BDT)', { exact: false });
    const rawValue = (await balanceField
      .inputValue()
      .catch(() => balanceField.textContent())) as string | null;

    const numeric = parseFloat((rawValue ?? '').replace(/[^0-9.]/g, ''));

    if (Number.isNaN(numeric)) {
      throw new Error(`Could not parse a numeric balance from "${rawValue}".`);
    }

    return numeric;
  }

  /** Asserts the agent's current balance equals the expected amount. */
  async expectBalance(expectedAmount: number): Promise<void> {
    const balance = await this.getBalance();
    expect(balance).toBe(expectedAmount);
  }

  async depositToCustomer(customerPhone: string, amount: number): Promise<void> {
    await this.performCashIn(customerPhone, amount);
    await this.expectBannerVisible('Deposit successful');
  }
}
