/**
 * Jest global setup — runs before all test suites.
 * Sets NODE_ENV and JWT_SECRET so they are available
 * across both the app module and test modules.
 */
export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-for-jest';
}
