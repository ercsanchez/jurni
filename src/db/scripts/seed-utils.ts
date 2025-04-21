import { faker } from '@faker-js/faker';

import { createDateObj } from '@/utils/datetime';
import { SEED_START_DATE, SEED_END_DATE } from './seed-constants';

const genRandomDatetimeBetRange = (from: string | Date, to: string | Date) => {
  const fromDate = createDateObj(from);
  const toDate = createDateObj(to);

  return faker.date.between({ from: fromDate, to: toDate });
};

// generated datetime is between the seed start date until the end (by default), unless a start value is provided, in which case it is from the start value until the seed end date
export const genRandomSeedDatetime = (range?: {
  start?: string | Date;
  end?: string | Date;
}) => {
  const dateObj = (defaultVal: string, date?: string | Date) =>
    !date
      ? new Date(defaultVal)
      : typeof date === 'string'
        ? new Date(date)
        : date;

  const fromDate = dateObj(SEED_START_DATE, range?.start);

  if (fromDate.getTime() < new Date(SEED_START_DATE).getTime())
    throw new Error('Start value cannot be earlier than the SEED_START_DATE');

  const endDate = dateObj(SEED_END_DATE, range?.end);

  if (endDate.getTime() > new Date(SEED_END_DATE).getTime())
    throw new Error('End value cannot be later than the SEED_END_DATE');

  return genRandomDatetimeBetRange(fromDate, endDate);
};

// only needed if storing session startAt/endAt times as datetime
// const sessionTimeWithTzToDatetime = (time: string, timezoneOffset: string) =>
//   new Date(`1970-01-01T${time}${timezoneOffset}`);
