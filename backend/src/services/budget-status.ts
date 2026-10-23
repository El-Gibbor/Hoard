export type BudgetStatus = 'within' | 'approaching' | 'over';

export const getBudgetStatus = (spent: number, budget: number): BudgetStatus => {
  if (spent * 100 > budget * 100) {
    return 'over';
  }
  if (spent * 100 >= budget * 80) {
    return 'approaching';
  }
  return 'within';
};
