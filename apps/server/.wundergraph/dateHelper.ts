import { addDays } from "date-fns";

/**
 * The Graph Protocol's server has a limit of 1000 records per query (per endpoint).
 * 
 * There are on average 50 records per day (for Ethereum, which has the most records),
 * so we can query 10 days at a time to stay under the limit.
 */
const OFFSET_DAYS = 10;

export const getISO8601DateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
}

export const getNextEndDate = (currentDate: Date | null): Date => {
  // If currentDate is null (first time being used), set the end date as tomorrow
  const tomorrowDate: Date = addDays(new Date(), 1);
  tomorrowDate.setUTCHours(0, 0, 0, 0);

  return currentDate === null ? tomorrowDate : currentDate;
}

export const getOffsetDays = (dateOffset?: number): number => {
  if (!dateOffset) {
    return OFFSET_DAYS;
  }

  return dateOffset;
}

export const getNextStartDate = (offsetDays: number, finalStartDate: Date, currentDate: Date | null): Date => {
  const newEndDate: Date = getNextEndDate(currentDate);

  // Subtract OFFSET_DAYS from the end date to get the new start date
  const newStartDate: Date = addDays(newEndDate, -offsetDays);

  // If the new start date is before the final start date, use the final start date
  return newStartDate.getTime() < finalStartDate.getTime() ? finalStartDate : newStartDate;
};
