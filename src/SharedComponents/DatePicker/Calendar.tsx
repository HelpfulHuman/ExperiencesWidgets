import { h, Component } from "preact";
import format from "date-fns/format";

import { CalendarHeader } from "./CalendarHeader";
import { CalendarDay } from "./CalendarDay";
import {
    getMonthHeaderTemplate,
    getMonthTemplate,
} from "./Utils";
import { isToday } from "date-fns";
import { AppDictionary } from "../../typings/Languages";
import { Weekdays } from "../../Utils/Constants";

type CalendarProps = {
    /** Gives a unique reference to the top level calendar node */
    calendarRef(ref: null | HTMLDivElement): void;
    /** the currently displayed month */
    month: number;
    /** the currently displayed year */
    year: number;
    /** Determine if we hide calendar */
    hideCalendar?: boolean;
    /** function to determine if a specific date has been selected */
    isDateSelected(date: Date): boolean;
    /** function to determine if a specific date is highlighted */
    isDateHighlighted(date: Date): boolean;
    /** function to determine if a specific date is hovered */
    isDateHovered(date: Date): boolean;
    /** function to determine if a specific date is focused */
    isDateFocused(date: Date): boolean;
    /** function to determine if a specific date is in a range */
    isDateInRange(date: Date): boolean;
    /** function to determine if a specific date is enabled */
    isDateEnabled(date: Date): boolean;
    /** function to fire on date focused */
    onDateFocused(date: Date): void,
    /** function to fire on date hovered */
    onDateHovered(date: Date): void,
    /** function to fire on date unhovered */
    onDateUnHovered(): void,
    /** function to fire on date selected */
    onDateSelected(date: Date): void,
    /** function to fire when the month is changed */
    onChangeMonth(delta: number): void;
    /** function to fire when the year is changed */
    onChangeYear(ev: Event): void,
    /** indicates whether the entire calendar should be disabled */
    disabled: boolean;
    /** Indicate which language you want the calendar to display in */
    locale?: string;
    /** Event custom labels set in admin experience interface */
    labels: Partial<AppDictionary>;
    /** Calendar start day as set in shop's Admin -> Settings panel */
    weekStartsOn: Weekdays;
};

/** Top Level Calendar component */
export class Calendar extends Component<CalendarProps> {
    /** returns the month name based on the locale for the current header */
    get headerTemplate() {
        const { locale, weekStartsOn } = this.props;
        return getMonthHeaderTemplate(locale, weekStartsOn);
    }

    /** returns all the days in the month with the correct offset for that month */
    get monthTemplate() {
        const { month, year, weekStartsOn } = this.props;
        return getMonthTemplate(month, year || 0, weekStartsOn);
    }

    /** Moves the calendar back one month */
    private handleBack = () => this.props.onChangeMonth(-1);

    /** Moves the calendar forward one month */
    private handleForward = () => this.props.onChangeMonth(1);

    /** render */
    render({ month, calendarRef, year, isDateSelected, isDateEnabled, isDateHovered, isDateFocused, isDateInRange, isDateHighlighted, onDateFocused, onDateHovered, onDateSelected, onChangeYear, disabled, labels }: CalendarProps) {
        return (
            /** Hide calendar view if a date has been selected */
            <div ref={calendarRef} className={`CalendarContainer ${this.props.hideCalendar ? "isHidden" : ""}`}>
                <CalendarHeader
                    month={month}
                    year={year}
                    onBack={this.handleBack}
                    onForward={this.handleForward}
                    disabled={disabled}
                    labels={labels}
                />
                <div className="Calendar" role="grid">
                    <div className="head" role="row">
                        {this.headerTemplate.map(({ dayName, style }, i) => (
                            <div key={dayName} className="dayHeading" style={style} role="columnheader" aria-label={dayName}>
                                {/* changing day name by slicing the first one letters */}
                                <abbr>{dayName.slice(0, 1)}</abbr>
                            </div>
                        ))}
                    </div>
                    <div className="body" role="row">
                        {this.monthTemplate.map(({ date, style }, i) => {
                            return (
                                <CalendarDay
                                    key={`${date.getTime()}-${i}`}
                                    date={date}
                                    dateLabel={format(date, "EEEE, MMMM d, yyyy")}
                                    style={style}
                                    isSelected={isDateSelected(date)}
                                    isDisabled={!isDateEnabled(date)}
                                    isToday={isToday(date)}
                                    isHovered={isDateHovered(date)}
                                    isFocused={isDateFocused(date)}
                                    isInRange={isDateInRange(date)}
                                    isHighlighted={isDateHighlighted(date)}
                                    onSelect={onDateSelected}
                                    onHover={onDateHovered}
                                    onUnHover={this.props.onDateUnHovered}
                                    onFocus={onDateFocused}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}