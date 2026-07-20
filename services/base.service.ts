import { Page, expect } from '@playwright/test';

/**
 * Shared base class for every role-specific service (Auth, Admin, System,
 * Agent). Holds the common Playwright plumbing so each subclass only needs
 * to describe *what* it does on the page, not *how* to click/fill/wait.
 */
export class BaseService {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Fills a field by its visible label, falling back to placeholder text.
   * The site's form fields render label-like text (e.g. "Amount (BDT) *")
   * that may be a real <label> or just a placeholder — this covers both
   * without needing to know the exact markup ahead of time.
   */
  protected async fillByLabel(label: string, value: string): Promise<void> {
    const byLabel = this.page.getByLabel(label, { exact: false });
    if (await byLabel.count()) {
      await byLabel.first().fill(value);
      return;
    }
    await this.page.getByPlaceholder(label, { exact: false }).first().fill(value);
  }

  protected async clickByRole(
    role: Parameters<Page['getByRole']>[0],
    name: string
  ): Promise<void> {
    await this.page.getByRole(role, { name, exact: false }).click();
  }

  /** Asserts a success/confirmation banner containing the given text is visible. */
  async expectBannerVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text, { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  }

  /**
   * The "Cash In" form (phone number + amount) is visually and structurally
   * identical whether SYSTEM is depositing to an Agent or an Agent is
   * depositing to a Customer — only which account is logged in differs.
   * Both SystemService and AgentService reuse this rather than duplicating
   * the same three lines.
   */
  protected async performCashIn(recipientPhone: string, amount: number): Promise<void> {
    await this.goto('/agent/cash-in');
    await this.fillByLabel('Phone Number', recipientPhone);
    await this.fillByLabel('Amount (BDT)', String(amount));
    await this.clickByRole('button', 'Cash In');
  }
}
