import { h, Component } from "preact";

import { addYears, addMonths, addWeeks, addDays, isSameDay, isBefore, isWithinInterval } from "date-fns";

import { Calendar } from "./Calendar";
import "./index.css";
import { AppDictionary } from "../../typings/Languages";
import { Weekdays } from "../../Utils/Constants";


export enum DatePickerType {
  SingleDay = "SingleDay",
  DateRange = "DateRange",
}

type DatePickerProps = {
  /** The initial date to load and pre-select on the calendar if it is single day picker*/
  date?: Date;
  /** Indicate which language you want the calendar to display in */
  locale: string;
  /** optional boolean to disable the entire calendar functionality including header and days default to false */
  disabled?: boolean;
  /** designates whether you want the calendar to function as a single day picker or a date range selector */
  type: DatePickerType;
  /** The initial start of the date range that will be selected on load if it is a date range selector  */
  startDate?: Date;
  /** The initial end date of the range that will be selected on load if it is a date range selector */
  endDate?: Date;
  /** Determine if we hide calendar */
  hideCalendar?: boolean;
  /** Custom function to determine if a date is enabled for selection */
  isDateEnabled?(focused: number | Date): boolean;
  /** Fires every time a date is selected by the user either by clicking on it or navigating and hitting enter - Only applies to single date picker*/
  onDateSelected?(date: Date): void;
  /** Fires every time a start date is selected by the user - Only applies to a date range picker*/
  onStartDateSelected?(date: Date): void;
  /** Fires every time a end date is selected by the user - Only applies to a date range picker*/
  onEndDateSelected?(date: Date): void;
  /** Fires every time a date is hovered by the user */
  onDateHovered?(date: Date): void;
  /** Fires every time a date is focused by the user */
  onDateFocused?(date: Date): void;
  /** Fires every time a date is highlighted by the user */
  isDateHighlighted?(date: Date): boolean;
  /** Fires every time a year is changed */
  onChangeYear(date: Date): void;
  /** Fires every time a date is changed */
  onChangeMonth(date: Date): void;
  /** Event custom labels set in admin experience interface */
  labels: Partial<AppDictionary>;
  /** Calendar start day as set in shop's Admin -> Settings panel */
  weekStartsOn: Weekdays;
};

type DatePickerState = {
  /** Set to the current date that is being hovered */
  hovered?: Date;
  /** Set to the current date that is being focused */
  focused?: Date;
  /** Set to the current month of the calendar that is being displayed */
  month?: number;
  /** Set to the current year of the calendar that is being displayed */
  year?: number;
};

/**
 * Calendar Controller
 */
export class DatePicker extends Component<DatePickerProps, DatePickerState> {
  /**
	 * References the calendar HTML Element
	 */
  private calendar: null | HTMLDivElement;

  constructor(props: DatePickerProps) {
    super();

    // Init to current month/year or provided date.
    const initialDate = props.date || (new Date());
    const month = initialDate.getMonth() + 1;
    const year = initialDate.getFullYear();
    this.state = {
      month,
      year,
    };
  }

  /**
   * fires when component mounts
   */
  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyPress);
  }

  /**
   * fires when component unmounts
   */
  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyPress);
  }

  /** Check to see whether the selected date has updated and, if so, update state */
  componentDidUpdate(prevProps: DatePickerProps) {
    if (prevProps.date !== this.props.date) {
      const month = this.props.date.getMonth() + 1;
      const year = this.props.date.getFullYear();
      this.setState({
        month,
        year,
      });
    }
  }

  /**
   * Handles any keyboard events to allow navigation in the calendar by arrows
   */
  handleKeyPress = (event: KeyboardEvent) => {
    // Ignore key press if this component isn't focused.
    const componentHasFocus = this.calendar && this.calendar.contains(document.activeElement);
    if (!componentHasFocus) { return; }

    // Otherwise prevent default.
    event.preventDefault();

    const {
      shiftKey,
      keyCode,
    } = event;
    const enter = keyCode === 13;
    const pageUp = keyCode === 33;
    const pageDown = keyCode === 34;
    const leftArrow = keyCode === 37;
    const upArrow = keyCode === 38;
    const rightArrow = keyCode === 39;
    const downArrow = keyCode === 40;

    const { isDateEnabled } = this.props;
    let { focused } = this.state;

    // Enter key selects a day.
    if (enter) {
      if (isDateEnabled(focused)) {
        this.onDateSelected(focused);
      }
      return;
    }
    // Shift key + pageUp moves backward 1yr.
    if (shiftKey && pageUp) {
      const nextDate = addYears(focused, -1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
    // Shift key + pageDown moves forward 1yr.
    if (shiftKey && pageDown) {
      const nextDate = addYears(focused, 1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
    // pageUp moves backward 1mo.
    if (pageUp) {
      const nextDate = addMonths(focused, -1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
    // pageDown moves forward 1mo.
    if (pageDown) {
      const nextDate = addMonths(focused, 1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
    // Up Arrow moves backward 1wk.
    if (upArrow) {
      const nextDate = addWeeks(focused, -1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
    // Down Arrow moves forward 1wk.
    if (downArrow) {
      const nextDate = addWeeks(focused, 1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
    // Left Arrow moves backward 1day.
    if (leftArrow) {
      const nextDate = addDays(focused, -1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
    // Right Arrow moves forward 1wk.
    if (rightArrow) {
      const nextDate = addDays(focused, 1);
      if (isDateEnabled(nextDate)) {
        this.onDateFocused(nextDate);
      }
      return;
    }
  }

  /** 
   * Fires every time that the year is changed by the user
   */
  onChangeYear = (event: Event) => {
    event.preventDefault();

    const year = parseInt((event.target as HTMLInputElement).value) || undefined;

    // Set year to value as Integer (or fall back to undefined if NaN)
    this.setState({
      year,
    });

    if (this.props.onChangeYear) {
      const date = new Date(this.state.year, this.state.month - 1);
      this.props.onChangeYear(date);
    }
  }

  /**
   * Fires every time the user changes the month that is currently selected
   */
  onChangeMonth = (delta: number): void => {
    let { month, year = 0 } = this.state;
    let nextMonth = month + delta;
    let nextYear = year;

    // Change current month by the given delta.
    // But if next month is not between 1 & 12, adjust year too.
    // TODO: handle case where delta >12mo.
    if (nextMonth < 1) {
      nextMonth = 12 + nextMonth;
      nextYear -= 1;
    }
    if (nextMonth > 12) {
      nextMonth = nextMonth - 12;
      nextYear += 1;
    }

    this.setState({
      month: nextMonth,
      year: nextYear,
    });

    if (this.props.onChangeMonth) {
      //Fetch availability one month ahead of time
      //Note: "this.state.month" is from the calendar's non-zero-based month index, so it technically refers to next month
      //"this.state.month" - 1 would refer to this month
      const date = new Date(this.state.year, this.state.month);
      this.props.onChangeMonth(date);
    }
  }

  /**
   * Fires every time a new date is selected by the user
   */
  onDateSelected = (date: Date) => {
    const {
      type,
      onDateSelected,
      onStartDateSelected,
      onEndDateSelected,
      startDate,
      endDate,
    } = this.props;
    // DatePicker -> one date selected.
    if (type === DatePickerType.SingleDay) {

      if (onDateSelected) {
        onDateSelected(date);
      }
    }
    // DateRangePicker -> either first or second date selected.
    else if (type === DatePickerType.DateRange) {
      const noStartDate = !startDate;
      const allSelected = startDate && endDate;
      const dateIsPriorToStart = startDate && startDate > date;
      const needStartDate = noStartDate || allSelected || dateIsPriorToStart;
      // No start date, make this the start date.
      if (needStartDate) {
        if (onStartDateSelected) { onStartDateSelected(date); }
        if (onEndDateSelected) { onEndDateSelected(null); }
      }
      // Has start date, make this the end date.
      else {
        if (onEndDateSelected) { onEndDateSelected(date); }
      }
    }
  }

  /**
   * Fires every time a date is hovered
   */
  onDateHovered = (date: Date) => {
    const { onDateHovered } = this.props;

    // Update date hovered in state.
    this.setState({ hovered: date }, () => {
      // If we have a prop hover handler, run it.
      if (onDateHovered) { onDateHovered(date); }
    });
  }

  handleDateUnHovered = () => {
    this.setState({ hovered: null });
  }

  /**
   * Fires when a date has been focused
   */
  onDateFocused = (date: Date) => {
    const { onDateFocused } = this.props;
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    // Update date focused in state.
    this.setState({ focused: date, month, year }, () => {
      // If we have a prop focus handler, run it.
      if (onDateFocused) { onDateFocused(date); }
    });
  }

  /**
   * Determines whether a specific date is enabled using
   * a function that was passed in from above.
   */
  isDateEnabled = (date: Date): boolean => {
    // Check with prop function whether date is enabled.
    const { isDateEnabled } = this.props;
    return isDateEnabled ? isDateEnabled(date) : true;
  }

  /**
   * Determines whether a date should be highlighted using
   * a custom function from props
   */
  isDateHighlighted = (date: Date): boolean => {
    // Check with prop function whether date is highlighted.
    const { isDateHighlighted } = this.props;

    return (isDateHighlighted && isDateHighlighted(date));
  }

  /**
   * Determines if a date is focused 
   */
  isDateFocused = (date: Date): boolean => {
    // Is this date currently focused?
    return (date && isSameDay(date, this.state.focused));
  }
  /**
   * Determines if a date is hovered
   */
  isDateHovered = (date: Date): boolean => {
    // Is this date currently hovered?
    return isSameDay(date, this.state.hovered);
  }

  /**
   * Determines if a date is selected
   */
  isDateSelected = (date: Date): boolean => {
    // DatePicker/DateRangePicker have different dates.
    const selectedDays = this.props.type === DatePickerType.SingleDay
      ? [this.props.date]
      : [this.props.startDate, this.props.endDate];
    // Is this date selected?
    return selectedDays.some((selected) => {
      return selected ? isSameDay(selected, date) : false;
    });

  }

  /**
   * Determines if a date falls between the start and end range 
   * only applies to the date range picker
   */
  isDateInRange = (date: Date): boolean => {
    // Only DateRangePicker can have a range.
    if (this.props.type === DatePickerType.SingleDay) { return false; }

    // We can only have a range if there's a start date and either and endDate or a hovered/focusedDate.
    const { startDate: startRange, endDate } = this.props;
    const { focused, hovered } = this.state;
    const endRange = endDate || (startRange && focused && !isSameDay(startRange, focused) ? focused : hovered);
    if (!startRange || !endRange || isBefore(endRange, startRange)) { return false; }

    // Check if date is within the range of start/end.
    return isWithinInterval(date, { start: startRange, end: endRange });
  }

  /**
	 * Binds the top level calendar reference
	 */
  private bindRef = (ref: null | HTMLDivElement) => (this.calendar = ref);

  /** render */
  render() {

    return (
      <Calendar
        hideCalendar={this.props.hideCalendar}
        calendarRef={this.bindRef}
        month={this.state.month}
        year={this.state.year}
        isDateSelected={this.isDateSelected}
        isDateEnabled={this.isDateEnabled}
        isDateFocused={this.isDateFocused}
        isDateHighlighted={this.isDateHighlighted}
        isDateHovered={this.isDateHovered}
        isDateInRange={this.isDateInRange}
        onDateSelected={this.onDateSelected}
        onDateHovered={this.onDateHovered}
        onDateUnHovered={this.handleDateUnHovered}
        onDateFocused={this.onDateFocused}
        onChangeMonth={this.onChangeMonth}
        onChangeYear={this.onChangeYear}
        locale={this.props.locale}
        disabled={this.props.disabled}
        labels={this.props.labels}
        weekStartsOn={this.props.weekStartsOn}
      />
    );
  }
}