import { Page } from '@playwright/test';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

/** SYSTEM-role actions: login and depositing funds into an agent's wallet. */
export class SystemService extends BaseService {
  private readonly auth: AuthService;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthService(page);
  }

  async login(email: string, password: string): Promise<void> {
    await this.auth.login(email, password);
  }

  async depositToAgent(agentPhone: string, amount: number): Promise<void> {
    await this.performCashIn(agentPhone, amount);
    await this.expectBannerVisible('SYSTEM deposit to Agent successful');
  }
}
