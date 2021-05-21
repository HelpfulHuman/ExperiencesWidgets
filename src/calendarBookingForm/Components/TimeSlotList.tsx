import "./TimeSlotList.scss";

import { format } from "date-fns";
import { Component, h, JSX } from "preact";

import { Availability } from "../../typings/Availability";
import { TimeSlot } from "./TimeSlot";
import { TimeSlotHeader } from "./TimeSlotHeader";
import { AppDictionary, localeMap } from "../../typings/Languages";
import { FirstAvailability } from "../../typings/FirstAvailability";

export interface ITimeSlotListMainProps {
  /** creating time slots to hold an array of needed detail for selected date availability */
  timeslots: Availability[];
  /** if a date is selected it will return that that or null if not*/
  selectedDate: Date | null;
  /** holds detail on the selected time slot */
  onSelectTimeSlot(timeslot: Availability): void;
  /** Object containing all fetched availabilities */
  availability: FirstAvailability;
  /** handles the first selected availability on the calendar that has an event */
  onSelectFirstAvailability(): void;
  /** Indicate which language you want the calendar to display in */
  locale: string;
  /** Event custom labels set in admin experience interface */
  labels: Partial<AppDictionary>;
}
export interface ITimeSlotListMainState {
  /** making loading either true or false depending on its state*/
  loading: boolean;
}
/** exports time slot list and renders time slot availabitity details */
export class TimeSlotList extends Component<
  ITimeSlotListMainProps,
  ITimeSlotListMainState
> {
  constructor(props: ITimeSlotListMainProps) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  /**
   * Handles the logic for when a timeslot list is empty
   * or the user has not selected a date
   */
  renderTimeSlots = () => {
    const { timeslots, selectedDate, locale, labels } = this.props;
    const noAvailableTimeSlots =
      !Object.keys(this.props.availability).length ||
      !this.props.timeslots.some((timeslot) => timeslot.unitsLeft > 0);

    if (!timeslots || !Array.isArray(timeslots) || !timeslots.length) {
      return (
        <div className="TimeSlots">
          <div className="TimeSlots-NotAvailable">
            <span className="TimeSlot-DateSelected">
              {format(new Date(this.props.selectedDate), "EEEE MMMM d, yyyy", {
                locale: localeMap[locale],
              })}
            </span>
            <p>{labels.nothingIsAvailableTodayLabel}</p>
            <button
              onClick={this.props.onSelectFirstAvailability}
              className="TimeSlots-NextAvailableBtn"
              disabled={noAvailableTimeSlots}
            >
              {noAvailableTimeSlots
                ? "This event is sold out"
                : labels.goToNextAvailableLabel}
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="TimeSlotsHeader-Container">
          <TimeSlotHeader selectedDate={selectedDate} locale={locale} />
          <div className="TimeSlots-Container">
            {timeslots.map(this.renderTimeslot)}
          </div>
        </div>
      );
    }
  };

  /**
   * This function is used to iterate over the list of
   * availability and return a timeslot component for
   * each one
   */
  renderTimeslot = (timeslot: Availability): JSX.Element => {
    return (
      <TimeSlot
        labels={this.props.labels}
        timeslot={timeslot}
        onSelectTimeSlot={this.props.onSelectTimeSlot}
      />
    );
  };

  /** render */
  render() {
    return (
      <div className="SelectedDateContainer">{this.renderTimeSlots()}</div>
    );
  }
}
