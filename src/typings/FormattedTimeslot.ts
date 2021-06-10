import moment from "moment-timezone";

export type FormattedTimeslot = {
  time: string;
  timeRange: string;
  dateStamp: string;
  date: string;
  isoWithoutTZ: string;
  when: string;
  whenOccurrence?: string;
};

export function formatTimeslot(start: Date | string, end: Date | string, timezone: string, startOccurrence?: Date | string, endOccurrence?: Date | string): FormattedTimeslot {
  const startMoment = moment(start).tz(timezone);
  const endMoment = moment(end).tz(timezone);
  const whenOccurrence = !!startOccurrence && !!endOccurrence
    ? `${moment(startOccurrence).tz(timezone).format("MMM D, YYYY [at] h:mma z[(]ZZ[)]")} to ${moment(endOccurrence).tz(timezone).format("MMM D, YYYY [at] h:mma z[(]ZZ[)]")}`
    : undefined;

  return {
    time: startMoment.format("h:mma z"),
    timeRange: `${startMoment.format("h:mma")}–${endMoment.format("h:mma z")}`,
    dateStamp: startMoment.format("YYYY-M-D"),
    date: startMoment.format("MMM D"),
    isoWithoutTZ: startMoment.format("YYYY-MM-DD[T]HH:mm:ss"),
    when: `${startMoment.format("MMM D, YYYY [at] h:mma z[(]ZZ[)]")} to ${endMoment.format("MMM D, YYYY [at] h:mma z[(]ZZ[)]")}`,
    whenOccurrence,
  };
}