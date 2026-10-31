// UTC midnight keeps a calendar date on that day regardless of the server's timezone.
export const calendarDate = (isoDate: string): Date => new Date(`${isoDate}T00:00:00.000Z`);

export const monthRange = (month: string): { start: Date; end: Date } => {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7));
  return {
    start: new Date(Date.UTC(year, monthIndex - 1, 1)),
    end: new Date(Date.UTC(year, monthIndex, 1)),
  };
};
