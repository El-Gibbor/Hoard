export type BudgetStatus = 'within' | 'approaching' | 'over';

export const getBudgetStatus = (spent: number, budget: number): BudgetStatus => {
  if (spent > budget) {
    return 'over';
  }
  if (spent * 100 >= budget * 80) {
    return 'approaching';
  }
  return 'within';
};
