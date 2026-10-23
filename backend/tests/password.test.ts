import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password';

describe('password helpers', () => {
  it('hashes a password into a bcrypt hash that is not the plain password', async () => {
    const hash = await hashPassword('password1');

    expect(hash).not.toBe('password1');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('gives a different hash each time the same password is hashed', async () => {
    const first = await hashPassword('password1');
    const second = await hashPassword('password1');

    expect(first).not.toBe(second);
  });

  it('verifies the correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('password1');

    expect(await verifyPassword('password1', hash)).toBe(true);
    expect(await verifyPassword('password2', hash)).toBe(false);
  });
});
