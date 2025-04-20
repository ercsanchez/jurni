// import { DEFAULT_TIMEZONE_OFFSET } from '@/config/constants';
import { padLeftWithOneZero } from './general';

// append timezone offset (+00:00) to time (00:00:00.000)
// export const appendTzToTimeStr = (str: string, tzOffset?: string) =>
//   `${str}${tzOffset ?? DEFAULT_TIMEZONE_OFFSET}`;

// export const postgresDatetimeStr = (data?: {
//   date?: Date;
//   tzOffset?: string;
// }) => {
//   const dateObj = data?.date ?? new Date();
//   const tz = data?.tzOffset ?? DEFAULT_TIMEZONE_OFFSET;

//   const year = dateObj.getFullYear().toString();

//   // getMonth returns a value of 0-11 for the 12 months
//   const month = `${padLeftWithOneZero((dateObj.getMonth() + 1).toString())}`;

//   const day = `${padLeftWithOneZero(dateObj.getDate().toString())}`;
//   const hours = `${padLeftWithOneZero(dateObj.getHours().toString())}`;
//   const mins = `${padLeftWithOneZero(dateObj.getMinutes().toString())}`;
//   const secs = `${padLeftWithOneZero(dateObj.getSeconds().toString())}`;

//   // const ms = `${padLeftWithTwoZeroes(dateObj.getMilliseconds().toString())}`;
//   // return `${year}-${month}-${day} ${hours}:${mins}:${secs}.${ms}${tz}`;

//   return `${year}-${month}-${day} ${hours}:${mins}:${secs}${tz}`;
// };

// generates a datetime obj that will be used to constrain employee check ins to only once per day (unique constraint on employee checkins on a group)
// time portion is set to 12:00MN/24:00 local time
// export const postgresDateStr = (data?: { date?: Date; tzOffset?: string }) => {
//   const dateObj = data?.date ?? new Date();
//   const tz = data?.tzOffset ?? DEFAULT_TIMEZONE_OFFSET;

//   const year = dateObj.getFullYear().toString();

//   // getMonth returns a value of 0-11 for the 12 months
//   const month = `${padLeftWithOneZero((dateObj.getMonth() + 1).toString())}`;

//   const day = `${padLeftWithOneZero(dateObj.getDate().toString())}`;

//   return `${year}-${month}-${day} 00:00:00${tz}`;
// };

// export const postgresDatetimeTzStr = (data?: {
//   date?: Date;
//   tzOffset?: string;
// }) => {
//   const dateObj = data?.date ?? new Date();
//   const tz = data?.tzOffset ?? DEFAULT_TIMEZONE_OFFSET;

//   const year = dateObj.getUTCFullYear().toString();

//   // getUTCMonth returns a value of 0-11 for the 12 months
//   const month = `${padLeftWithOneZero((dateObj.getUTCMonth() + 1).toString())}`;

//   const day = `${padLeftWithOneZero(dateObj.getUTCDate().toString())}`;
//   const hours = `${padLeftWithOneZero(dateObj.getUTCHours().toString())}`;
//   const mins = `${padLeftWithOneZero(dateObj.getUTCMinutes().toString())}`;
//   const secs = `${padLeftWithOneZero(dateObj.getUTCSeconds().toString())}`;

//   // const ms = `${padLeftWithTwoZeroes(dateObj.getMilliseconds().toString())}`;
//   // return `${year}-${month}-${day} ${hours}:${mins}:${secs}.${ms}${tz}`;

//   return `${year}-${month}-${day} ${hours}:${mins}:${secs}${tz}`;
// };

export const getDateValues = (dateObj: Date) => {
  const year = dateObj.getFullYear();
  const monthIndex = dateObj.getMonth();
  const day = dateObj.getDate();
  // const dayOfWeek = dateObj.getDay();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const seconds = dateObj.getSeconds();
  // const milliseconds = dateObj.getMilliseconds(); \\ don't need this precision

  return {
    year,
    monthIndex,
    day,
    // dayOfWeek,
    hours,
    minutes,
    seconds,
    // milliseconds,
  };
};

export const getUTCDateValues = (dateObj: Date) => {
  const year = dateObj.getUTCFullYear();
  const monthIndex = dateObj.getUTCMonth();
  const day = dateObj.getUTCDate();
  // const dayOfWeek = dateObj.getUTCDay();
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  const seconds = dateObj.getUTCSeconds();
  // const milliseconds = dateObj.getUTCMilliseconds(); \\ don't need this precision

  return {
    year,
    monthIndex,
    day,
    // dayOfWeek,
    hours,
    minutes,
    seconds,
    // milliseconds,
  };
};

export const getTzOffsetStrWithSign = (tzOffset: string) => {
  return tzOffset.toUpperCase() === 'Z' || tzOffset.length === 0
    ? '+00:00'
    : tzOffset.includes('+') || tzOffset.includes('-')
      ? tzOffset
      : `+${tzOffset}`;
};

export const tzOffsetStrToMins = (tzOffset: string) => {
  const tzWithSign = getTzOffsetStrWithSign(tzOffset);
  const sign = tzWithSign.charAt(0);

  const [, hhmm] = tzWithSign.includes('-')
    ? tzWithSign.split('-')
    : tzWithSign.split('+');

  if (hhmm === '00:00' || hhmm === '0:0' || hhmm === '00' || hhmm === '0')
    return 0;

  const [hh, mm] = hhmm.split(':');

  const mins = Number(hh) * 60 + (mm ? Number(mm) : 0);

  const minsWithSign = sign + mins.toString();

  // console.log(sign, mins.toString());

  return Number(minsWithSign);
};

export const tzOffsetStrToMs = (tzOffset: string) =>
  tzOffsetStrToMins(tzOffset) * 60 * 1000; // 60s * 1000ms

// convert tz offset in mins to +/-HH:MM format
export const tzOffsetMinsToHhMm = (mins: number) => {
  const h = (Math.floor(mins / 60) * -1).toString(); // Date().getTimezoneOffset() gets the offset of UTC from the client's local timezone (e.g. -480 is equivalent to +08:00) | we need to invert the sign here

  const m = (mins % 60).toString();

  const hWithSign = h.includes('+') || h.includes('-') ? h : `+${h}`;

  const [sign, hWithouSign] = hWithSign;

  return `${sign}${padLeftWithOneZero(hWithouSign)}:${padLeftWithOneZero(m)}`;
};

// gets current datetime if no arg value
export const createDateObj = (date?: Date | string) =>
  !date ? new Date() : typeof date === 'string' ? new Date(date) : date;

// takes in js Date obj / ISO string and adds the tzoffset (shifting epoch)
// js Date obj will always be a utc value (behind the scenes) | date ISO string, can have an offset but will be converted to utc once converted into a Date obj
export const shiftUTCDateGivenTzOffset = (
  tzOffset: string,
  date?: Date | string,
) => {
  const dateObj = createDateObj(date);

  const { year, monthIndex, day, hours, minutes, seconds } =
    getUTCDateValues(dateObj);

  const tzOffsetMs = tzOffsetStrToMs(tzOffset);

  // this adjusts the date to account for tz offset of a session, so that we can get the actual yy-mm-dd (and not the utc yy-mm-dd) where the group resides

  const shiftUTCDateGivenTzOffset = new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
      hours,
      minutes,
      seconds,
      tzOffsetMs, // tz offset in ms
    ),
  );

  // only use the date and time values of the date obj generated with this fun | do not use the timezone since it will stil be UTC (Z/+00:00)
  // date string (yy-mm-dd) willl be used to write to "Member Checkins" table, "date" field
  return shiftUTCDateGivenTzOffset;
};

// return value will be used to write to "Member Checkins" Table, "date" Field
export const getShiftedDateISOStringGivenTz = (
  tzOffset: string,
  date?: Date | string,
) => {
  const [dateString] = shiftUTCDateGivenTzOffset(tzOffset, date)
    .toISOString()
    .split('T');

  return dateString;
};

export const getShiftedDatetimeISOStringGivenTimeAndTz = ({
  tzOffset,
  time,
  date,
}: {
  tzOffset: string;
  time?: string; // actual time in user's local timezone (already adjusted using tz offset)
  date?: Date | string;
}) => {
  const tzOffsetStrWithSign = getTzOffsetStrWithSign(tzOffset);
  const tzOffsetMins = tzOffsetStrToMins(tzOffsetStrWithSign);

  if (tzOffsetMins === 0) {
    const datetimeString = new Date().toISOString();

    if (time) {
      const [dateString] = datetimeString.split('T');
      return `${dateString}T${time}Z`;
    }
    return datetimeString;
  } else {
    // tzOffset !== 0, so generated date needs to be shifted accdg. to offset
    const shiftedDatetimeString = shiftUTCDateGivenTzOffset(
      tzOffsetStrWithSign,
      date,
    ).toISOString();

    if (time) {
      const [shiftedDateString] = shiftedDatetimeString.split('T');
      return `${shiftedDateString}T${time}${tzOffsetStrWithSign}`;
    }
    return `${shiftedDatetimeString}${tzOffsetStrWithSign}`;
  }
};

// export const getShiftedDatetimeISOStringGivenTz = (
//   tzOffset: string,
//   date?: Date | string,
// ) => {
//   const tzOffsetWithSign = getTzOffsetStrWithSign(tzOffset);

//   const datetimeISOStringWithTz =
//     shiftUTCDateGivenTzOffset(tzOffset, date)
//       .toISOString()
//       // .replace('T', ' ') TODO: NO NEED FOR THIS IN ORDER TO WRITE TO DB?
//       .replace('Z', '') + tzOffsetWithSign; // TODO: WE DON'T SEEM TO NEED THIS
//   // .replace(".000", ' ') // don't use this since we don't know if the date obj has a milliseconds value = .000

//   return datetimeISOStringWithTz;
// };

// console.log(
//   getShiftedDatetimeISOStringGivenTimeAndTz({
//     tzOffset: '+00:30',
//     time: '03:00',
//     date: new Date('2025-01-01T00:00:00+01:00'),
//   }),
//   new Date(
//     getShiftedDatetimeISOStringGivenTimeAndTz({
//       tzOffset: '+00:30',
//       time: '03:00',
//       date: new Date('2025-01-01T00:00:00+01:00'),
//     }),
//   ),
// );
