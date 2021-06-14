import { FormattedTimeslot } from "./FormattedTimeslot";
import { Occurrence } from "./Occurrence";

export type Availability = {
  productId: string;
  timeslotId?: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  formattedTimeslot: FormattedTimeslot;
  totalUnits: number;
  unitsLeft: number;
  occurrence?: Occurrence;
};