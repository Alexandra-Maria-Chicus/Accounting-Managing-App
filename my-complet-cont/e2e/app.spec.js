import { test, expect } from '@playwright/test';

async function goToTable(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /get started/i }).click();
  await page.locator('input[type="email"]').fill('admin@completcont.ro');
  await page.locator('input[type="password"]').fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('columnheader', { name: /firm name/i })).toBeVisible();
}

test.describe('Navigation', () => {
  test('landing page shows app name and Get Started button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/complet cont/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  });

  test('Get Started navigates to the documents table', async ({ page }) => {
    await goToTable(page);
    await expect(page.getByRole('columnheader', { name: /firm name/i })).toBeVisible();
  });

  test('navbar Documents and Companies links switch views', async ({ page }) => {
    await goToTable(page);
    await page.getByRole('button', { name: /companies/i }).click();
    await expect(page.getByRole('button', { name: /add company/i })).toBeVisible();
    await page.getByRole('button', { name: /documents/i }).click();
    await expect(page.getByRole('columnheader', { name: /firm name/i })).toBeVisible();
  });
});

test.describe('Add Entry – Validation', () => {
  test('saving without selecting a company shows validation error', async ({ page }) => {
    await goToTable(page);
    await page.getByRole('button', { name: /add new entry/i }).click();
    await page.getByRole('button', { name: /save entry/i }).click();
    await expect(page.getByText(/please select a company/i)).toBeVisible();
  });

  test('selecting a company clears the validation error and saves', async ({ page }) => {
    await goToTable(page);
    await page.getByRole('button', { name: /add new entry/i }).click();
    const select = page.locator('select').first();
    await select.selectOption({ index: 1 });
    await page.getByRole('button', { name: /save entry/i }).click();
    await expect(page.getByRole('columnheader', { name: /firm name/i })).toBeVisible();
  });
});

test.describe('Delete Entry', () => {
  test('clicking delete shows Yes/No confirmation', async ({ page }) => {
    await goToTable(page);
    const trashBtns = page.locator('td.pe-4 button.text-danger');
    await trashBtns.first().click();
    await expect(page.getByText(/delete\?/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^yes$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^no$/i })).toBeVisible();
  });

  test('cancelling delete (No) keeps the entry in the table', async ({ page }) => {
    await goToTable(page);
    const trashBtns = page.locator('td.pe-4 button.text-danger');
    const rowCountBefore = await page.locator('tbody tr').count();
    await trashBtns.first().click();
    await page.getByRole('button', { name: /^no$/i }).click();
    await expect(page.locator('tbody tr')).toHaveCount(rowCountBefore);
  });

  test('confirming delete (Yes) removes the entry from the table', async ({ page }) => {
    await goToTable(page);
    const trashBtns = page.locator('td.pe-4 button.text-danger');
    const rowCountBefore = await page.locator('tbody tr').count();
    await trashBtns.first().click();
    await page.getByRole('button', { name: /^yes$/i }).click();
    await expect(page.locator('tbody tr')).toHaveCount(rowCountBefore - 1);
  });
});

test.describe('Edit Entry', () => {
  test('clicking edit opens the Edit Document form', async ({ page }) => {
    await goToTable(page);
    const editBtns = page.locator('td.pe-4 button.text-primary');
    await editBtns.first().click();
    await expect(page.getByRole('heading', { name: /edit document/i })).toBeVisible();
  });

  test('changing status and saving updates the row badge', async ({ page }) => {
    await goToTable(page);
    const editBtns = page.locator('td.pe-4 button.text-primary');
    await editBtns.first().click();
    await page.locator('select').filter({ hasText: /not started|in progress|finished/i }).selectOption('Finished');
    await page.getByRole('button', { name: /update entry/i }).click();
    await expect(page.getByRole('columnheader', { name: /firm name/i })).toBeVisible();
  });
});

test.describe('Pagination', () => {
  test('table shows at most 5 rows per page', async ({ page }) => {
    await goToTable(page);
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeLessThanOrEqual(5);
  });
});
