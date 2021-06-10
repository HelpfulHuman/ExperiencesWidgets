import { FormattedTimeslot } from "./FormattedTimeslot";

export type Availability = {
  productId: string;
  timeslotId?: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  formattedTimeslot: FormattedTimeslot;
  totalUnits: number;
  unitsLeft: number;
  occurrenceId?: string;
  occurrenceTimeslots?: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    formattedTimeslot: FormattedTimeslot;
  }[];
};