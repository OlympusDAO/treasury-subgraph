export const getISO8601DateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};
