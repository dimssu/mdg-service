import { comparePassword, hashPassword } from './password.js';

describe('password utils', () => {
  it('hashes to a bcrypt-shaped string and round-trips compare', async () => {
    const hash = await hashPassword('Admin@12345');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(hash).not.toContain('Admin@12345');
    await expect(comparePassword('Admin@12345', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    await expect(comparePassword('something-else', hash)).resolves.toBe(false);
  });

  it('produces a different hash for the same input each time (salt)', async () => {
    const a = await hashPassword('same-password');
    const b = await hashPassword('same-password');
    expect(a).not.toBe(b);
  });
}, 30_000);
