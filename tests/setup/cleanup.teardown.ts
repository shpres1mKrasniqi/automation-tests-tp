import { test, shopConfig } from '../../src/fixtures';
import { hasAdminCredentials } from '../../src/config/loader';

/** Removes leftover test customers (e-mail prefix/domain from the project profile). */
// registered only when cleanup is enabled and Admin API credentials exist (without them the customers cannot be deleted)
if (hasAdminCredentials(shopConfig) && shopConfig.env.cleanupTestData) test('delete leftover test customers', async ({ cfg, adminApi }) => {
  const { emailPrefix, emailDomain } = cfg.testData.customer;
  const deleted = await adminApi!.deleteTestCustomers(emailPrefix, emailDomain);
  test.info().annotations.push({ type: 'cleanup', description: `Deleted ${deleted} test customers` });
});
