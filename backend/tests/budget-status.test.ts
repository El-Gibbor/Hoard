import { describe, expect, it } from 'vitest';
import { getBudgetStatus } from '../src/services/budget-status';

describe('budget status', () => {
  const budget = 1000;

  it('is within when nothing has been spent', () => {
    expect(getBudgetStatus(0, budget)).toBe('within');
  });

  it('is within when 79.9 percent of the budget is spent', () => {
    expect(getBudgetStatus(799, budget)).toBe('within');
  });

  it('is approaching when exactly 80 percent of the budget is spent', () => {
    expect(getBudgetStatus(800, budget)).toBe('approaching');
  });

  it('is approaching when exactly 100 percent of the budget is spent', () => {
    expect(getBudgetStatus(1000, budget)).toBe('approaching');
  });

  it('is over when 100.1 percent of the budget is spent', () => {
    expect(getBudgetStatus(1001, budget)).toBe('over');
  });

  it('is over when spending is far above the budget', () => {
    expect(getBudgetStatus(50_000, budget)).toBe('over');
  });
});
