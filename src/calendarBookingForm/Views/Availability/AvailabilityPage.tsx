import { h, Component } from "preact";
import { ModalStateEnum } from "../../types";
import { TimeSlotList } from "../../Components/TimeSlotList";
import { Availability } from "../../../typings/Availability";
import { DatePicker, DatePickerType } from "../../../SharedComponents/DatePicker";
import "./AvailabilityPage.scss";
import { VariantList } from "../../Components/VariantList";
import { EventDBO, EventVariantDBO } from "../../../typings/Event";
import { FirstAvailability } from "../../../typings/FirstAvailability";
import { getTimeslotsByDate } from "../../../Utils/helpers";
import { AppDictionary } from "../../../typings/Languages";
import { CloseIcon } from "../../../SharedComponents/Icons/CloseIcon";
import { Weekdays } from "../../../Utils/Constants";

export interface IAvailabilityPageProps {
  /** Sets the modal state in the index to "navigate" to a different view */
  navigateTo(state: ModalStateEnum): void;
  /** Object containing all fetched availabilities */
  availability: FirstAvailability;
  /** This is the event for which the user is booking spots */
  event: EventDBO | null;
  /** This is the money format for the merchant */
  moneyFormat: string;
  /** This is the date that the user has selected, if any */
  selectedDate: Date | null;
  /** This is the timeslot that the user has selected, if any */
  selectedTimeslot: Availability | null;
  /** Method passed in from the top level to fetch new availability from a given date */
  setNewAvailability(startDate: Date): void;
  /** Method passed in from the top level to handle date selection */
  onDateSelect(date: Date): void;
  /** Method passed in from the top level to handle timeslot selection */
  onSelectTimeslot(timeslot: Availability): void;
  /** Method passed in to handle navigation via the back button */
  onClickBack(): void;
  /** Method passed in to handle changes in the desired quantity of a variant */
  onChangeQuantity(dir: number, variantId: number): void;
  /** Desired quantities per event variant */
  quantities: { [variantId: number]: number };
  /** Method passed in to handle the on confrim button */
  onConfirm(): void;
  /** Method passed in to handle the on close button of the modal*/
  closeModal(): void;
  /** Method passed in to handle the on the final confrim order button */
  confirmOrder(): void;
  /** Method passed in to handle the first selected avavliability of and event on the calaendar */
  onSelectFirstAvailability(): void;
  /** Method passed in to handle confirmation of date/timeslot/quantity selection */
  onConfirmSelection(): void;
  /** Indicate which language you want the calendar to display in */
  locale: string;
  /** Event custom labels set in admin experience interface */
  labels: Partial<AppDictionary>;
  /** Calendar start day as set in shop's Admin -> Settings panel */
  weekStartsOn: Weekdays;
}

export interface IAvailabilityPageState {
  /** An array of availabilities to display available timeslots */
  timeslots: Availability[];
}
/**
 * This component is the higher order top level component that renders everything
 * related to selecting a timeslot, variant, and quantity
 * 
 * includes:
 * choosing a date
 * choosing a time slot
 * choosing variants
 * choosing quantity per variant
 * 
 */
export class AvailabilityPage extends Component<IAvailabilityPageProps, IAvailabilityPageState> {
  /** Set initial timeslot array to the timeslots for the current date (if available) */
  constructor(props: IAvailabilityPageProps) {
    super(props);
    this.state = {
      timeslots: (this.props.availability && getTimeslotsByDate(this.props.availability, this.props.selectedDate || new Date())),
    };
  }


  /** When the user's selected date changes, set state to appropriate timeslots if available */
  componentDidUpdate(prevProps: IAvailabilityPageProps) {
    if (prevProps.selectedDate !== this.props.selectedDate) {
      const now = new Date();
      this.setState({
        timeslots: (this.props.availability && getTimeslotsByDate(this.props.availability, this.props.selectedDate || now)),
      });
    }
  }

  /** This renders either a timeslot list or a variant list on the right side of the view (left side is the calendar) */
  renderRightSide = () => {
    if (this.props.selectedTimeslot) {
      let variants: EventVariantDBO[] = [];
      const { event, moneyFormat } = this.props;
      if (event) {
        variants = event.variants;
      }
      return (
        <VariantList
          labels={this.props.labels}
          locale={this.props.locale}
          minLimit={this.props.event.minLimit}
          maxLimit={this.props.event.maxLimit}
          moneyFormat={moneyFormat}
          variants={variants}
          variantSelectedDate={this.props.selectedDate}
          variantTimeSlot={this.props.selectedTimeslot}
          onClickBack={this.props.onClickBack}
          onConfirmSelection={this.props.onConfirmSelection}
          onChangeQuantity={this.props.onChangeQuantity}
          quantities={this.props.quantities}
          event={this.props.event}
        />
      );
    } else {
      return (
        <TimeSlotList
          labels={this.props.labels}
          locale={this.props.locale}
          timeslots={this.state.timeslots}
          selectedDate={this.props.selectedDate}
          onSelectTimeSlot={this.props.onSelectTimeslot}
          availability={this.props.availability}
          onSelectFirstAvailability={this.props.onSelectFirstAvailability}
        />
      );
    }
  }

  /** Boolean to determine whether a given date has availability */
  dateHasAvailablility = (date: Date): boolean => {
    const { availability } = this.props;
    const timeslots = (availability && getTimeslotsByDate(availability, date));
    const enabled = (timeslots && timeslots.length > 0) ? true : false; // Array.isArray(timeslots) &&
    return enabled;
  }
  /** when clicked the model will close for the mobile view */
  handleCloseModal = () => {
    this.props.closeModal();
  }

  /** Main render method, renders the calendar and the dynamic right side of the view */
  public render() {
    return (
      <div className="AvailabilityPage">
        <div className="AvailabilityPage-DatePickerContainer">
          <div className="MobileView-Header">
            {/* Back button only for when time slot selected */}
            {!!this.props.selectedTimeslot && 
              <button
                className="BackButton"
                title="Previous Month"
                style={{ float: "left" }}
                onClick={this.props.onClickBack}
              >
                <span>&#8592;</span>
              </button>}
          <button id="MobileView-CloseBtn" onClick={this.handleCloseModal}>
            <CloseIcon />
          </button>
            <p>
              {/* If a date has been selected then select quantity view will appear */}
              {!!this.props.selectedTimeslot ? "Select quantity" : this.props.event.name} 
            </p>
          </div>
          <DatePicker
            hideCalendar={!!this.props.selectedTimeslot}
            type={DatePickerType.SingleDay}
            date={this.props.selectedDate}
            locale={this.props.locale}
            labels={this.props.labels}
            onDateSelected={this.props.onDateSelect}
            isDateEnabled={this.dateHasAvailablility}
            onChangeMonth={this.props.setNewAvailability}
            onChangeYear={this.props.setNewAvailability}
            weekStartsOn={this.props.weekStartsOn}
          />
        </div>
        <div className="AvailabilityPage-TimeSlotContainer">
          {this.renderRightSide()}
        </div>
      </div>
    );
  }
}
