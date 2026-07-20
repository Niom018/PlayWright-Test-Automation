import { Page, expect } from '@playwright/test';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

/**
 * Admin-role actions. Composes AuthService for login instead of duplicating
 * login logic — Admin skips the OTP step, but that's handled transparently
 * inside AuthService.login(), so this class doesn't need to know or care.
 */
export class AdminService extends BaseService {
  private readonly auth: AuthService;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthService(page);
  }

  async login(email: string, password: string): Promise<void> {
    await this.auth.login(email, password);
  }

  /**
   * Finds the newly registered agent in the User List by their unique
   * email, opens their detail page, switches into edit mode, and changes
   * Account Status from Pending to Active.
   *
   * There's no direct "Activate" button — the real flow is
   * VIEW -> Edit User -> Account Status dropdown -> Active -> Save Changes.
   */
  async activateAgent(agentEmail: string): Promise<void> {
    await this.goto('/admin/users');

    // The list is sorted newest-first, so a freshly registered agent
    // always lands on the first page — avoids needing the exact
    // interaction pattern of the "Search Type" dropdown.
    const agentRow = this.page.getByRole('row', { name: agentEmail, exact: false });
    await agentRow.getByRole('button', { name: 'View', exact: false }).click();

    await this.clickByRole('button', 'Edit User');

    // "Account Status" isn't programmatically linked to its combobox, and
    // this page has two comboboxes (Role, Account Status). Rather than
    // rely on DOM position/order (which proved fragile), filter directly
    // by the combobox's current text — at this point in the flow we're
    // always activating a freshly-registered agent, so it reliably shows
    // "Pending".
    await this.page.getByRole('combobox').filter({ hasText: 'Pending' }).click();

    await this.page.getByRole('option', { name: 'Active', exact: true }).click();
    await this.clickByRole('button', 'Save Changes');

    // The generic expectBannerVisible() helper is too loose here — "Active"
    // legitimately appears in more than one place on this page after
    // saving. The status Chip specifically renders literal uppercase
    // "ACTIVE" text (not just CSS styling), so match on that exactly.
    await expect(this.page.getByText('ACTIVE', { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  }
}
