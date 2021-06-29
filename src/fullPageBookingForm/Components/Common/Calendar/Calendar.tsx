/** @jsx h */
import { h, FunctionComponent } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import moment from "moment-timezone";
import { Button } from "../Button";
import { TextStyle } from "../TextStyle";
import { LeftIcon } from "./LeftIcon";
import { RightIcon } from "./RightIcon";
import { getCalendarMatrix } from "./getCalendarMatrix";
import "./Calendar.scss";
import { AppDictionary } from "../../../../typings/Languages";

export type CalendarProps = {
  labels: Partial<AppDictionary>;
  month?: number;
  year?: number;
  date: Date;
  loading?: boolean;
  startOfWeek?: "Su" | "Mo";
  dateIsDisabled?: (date: Date) => boolean;
  dateIsSoldOut?: (date: Date) => boolean;
  onDateChange?: (date: Date) => void;
  onMonthChange?: (month: number) => void;
  onYearChange?: (year: number) => void;
};

const today = new Date();

export const Calendar: FunctionComponent<CalendarProps> = ({
  month,
  year,
  date,
  loading,
  startOfWeek = "Su",
  dateIsDisabled,
  dateIsSoldOut,
  onDateChange,
  onMonthChange,
  onYearChange,
  labels,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    month || moment(date).month(),
  );
  const [currentYear, setCurrentYear] = useState(year || moment(date).year());
  const [currentDate, setCurrentDate] = useState(date);

  //Update calendar's front month to current date's month, if the
  //passed in date month is not equal to the current date's month.
  useEffect(() => {
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
    setCurrentDate(date);
  }, [date.getTime()]);

  useEffect(() => {
    if (month) {
      setCurrentMonth(month);
    }
  }, [month]);

  useEffect(() => {
    if (year) {
      setCurrentYear(year);
    }
  }, [year]);

  const handlePreviousMonthClick = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        return 11;
      }

      return prev - 1;
    });

    if (currentMonth === 0) {
      setCurrentYear((prev) => {
        const newYear = prev - 1;

        onYearChange?.(newYear);

        return newYear;
      });
    }
  };

  const handleNextMonthClick = () => {
    setCurrentMonth((prev) => {
      let newMonth = prev + 1;

      if (prev === 11) {
        newMonth = 0;
      }

      onMonthChange?.(newMonth);

      return newMonth;
    });

    if (currentMonth === 11) {
      setCurrentYear((prev) => {
        const newYear = prev + 1;

        onYearChange?.(newYear);

        return newYear;
      });
    }
  };

  const handleTodayClick = () => {
    const newMonth = today.getMonth();
    setCurrentMonth(today.getMonth());
    onMonthChange?.(newMonth);

    const newYear = today.getFullYear();
    setCurrentYear(newYear);
    onYearChange?.(newYear);

    setCurrentDate(today);
    onDateChange?.(today);
  };

  const renderWeekHeader = () => {
    let weekdays = moment.weekdaysMin();

    if (startOfWeek === "Mo") {
      const sunday = weekdays.shift();

      weekdays = [...weekdays, sunday];
    }

    return weekdays.map((weekday) => (
      <div
        key={weekday}
        className="calendar__matrix__day calendar__matrix__day--header"
      >
        <span>{weekday.slice(0, 2)}</span>
      </div>
    ));
  };

  const calendarMatrix = useMemo(
    () =>
      getCalendarMatrix({
        month: currentMonth,
        year: currentYear,
        startOfWeek,
      }),
    [currentMonth, currentYear, startOfWeek],
  );

  const renderDays = () =>
    useMemo(
      () =>
        calendarMatrix.map((weekdays) =>
          weekdays.map(({ day, date }) => {
            if (day === null) {
              return <div />;
            }

            const before = moment(date).isBefore(moment(), "day");
            const disabled = before || dateIsDisabled?.(date) || loading;
            const isSoldOut = dateIsSoldOut(date);

            const handleClick = () => {
              if (!disabled && !isSoldOut) {
                setCurrentDate(date);
                onDateChange?.(date);
              }
            };

            const classNames = ["calendar__matrix__day"];

            const selected = moment(currentDate).isSame(date, "day");

            classNames.push(
              `calendar__matrix__day--${
                disabled
                  ? "disabled"
                  : isSoldOut
                  ? "sold-out"
                  : selected
                  ? "selected"
                  : "default"
              }`,
            );

            const today = moment().isSame(date, "day");

            if (today) {
              classNames.push("calendar__matrix__day--current");
            }

            return (
              <div key={day} className={classNames.join(" ")}>
                <span onClick={handleClick}>{day}</span>
              </div>
            );
          }),
        ),
      [currentMonth, currentYear, currentDate.getTime(), loading, startOfWeek],
    );

  const withinCurrentMonthAndYear =
    moment(today).month() === currentMonth &&
    moment(today).year() === currentYear;

  //Today is disabled if the date is disabled (no timeslots on this date)
  // //or it's sold out.
  // const todayIsDisabled = dateIsDisabled(today) || dateIsSoldOut(today);
  const currentMonthString = moment.months()[currentMonth];

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div className="calendar__header__month">
          <TextStyle
            variant="display2"
            text={`${
              labels[currentMonthString]
                ? labels[currentMonthString]
                : currentMonthString
            } ${currentYear}`}
          />
          {loading && <div className="calendar__loader" />}
        </div>
        <div className="calendar__header__today-btn">
          <Button
            variant="text"
            color="primary"
            text={labels.today ? labels.today : "Today"}
            disabled={
              (moment(currentMonth).isSameOrBefore(month, "date") &&
                withinCurrentMonthAndYear) ||
              loading
            }
            onClick={handleTodayClick}
          />
        </div>
        <div className="calendar__header__month-navigator">
          <button
            disabled={withinCurrentMonthAndYear || loading}
            onClick={handlePreviousMonthClick}
          >
            <LeftIcon />
          </button>
          <button disabled={loading} onClick={handleNextMonthClick}>
            <RightIcon />
          </button>
        </div>
      </div>
      <div className="calendar__matrix">
        {renderWeekHeader()}
        {renderDays()}
      </div>
    </div>
  );
};
