import { FormattedTimeslot } from "./FormattedTimeslot";

export type Occurrence = {
  id: string;
  timeslots: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    formattedTimeslot: FormattedTimeslot;
  }[];
};