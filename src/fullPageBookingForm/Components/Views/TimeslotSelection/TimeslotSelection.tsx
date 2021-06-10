/** @jsx h */
import { h, FunctionComponent, Fragment } from "preact";
import { useEffect, useState, useMemo } from "preact/hooks";
import InfiniteScroll from "react-infinite-scroller";
import moment from "moment";
import { Availability } from "../../../../typings/Availability";
import { getTimeslotsByDate } from "../../../../Utils/helpers";
import { BookingFormPage } from "../../../Typings/BookingFormPage";
import { useTimeslotStore } from "../../../Hooks/useTimeslotStore";
import { Calendar } from "../../Common/Calendar";
import { BottomDrawer } from "../../Common/BottomDrawer";
import { TextStyle } from "../../Common/TextStyle";
import {
  useWizardModalAction,
  WizardModalTitleBar,
} from "../../Common/WizardModal";
import { EventTitle } from "../../EventTitle";
import { TimeslotGroup, TimeslotGroupSkeleton } from "../../TimeslotGroup";
import { CalendarIcon } from "./CalendarIcon";
import { useEvent } from "./useEvent";
import { useAvailabilities } from "./useAvailabilities";
import "./TimeslotSelection.scss";
import { Button } from "../../Common/Button";
import { Donger } from "../../Common/Icon/Donger";
import { AppDictionary } from "../../../../typings/Languages";
import { CalendarSkeleton } from "../../Common/CalendarSkeleton";

export type TimeslotSelectionProps = {
  /**Format for money in shop. */
  moneyFormat: string;
  /**Labels to be used in the view. */
  labels: Partial<AppDictionary>;
  /**Language code */
  languageCode: string;
};

export const TimeslotSelection: FunctionComponent<TimeslotSelectionProps> = ({
  moneyFormat,
  labels,
  languageCode,
}) => {
  const setSelectedTimeslot = useTimeslotStore(
    (state) => state.setSelectedTimeslot,
  );
  const { setPage, close } = useWizardModalAction();
  const [hasMoreAvailableDates, setHasMoreAvailableDates] = useState(true);
  const [calendarDrawerOpen, setCalendarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const { isFetchingEvent, event } = useEvent();
  const {
    isFetchingInitialAvailabilities,
    isFetchingMoreAvailabilities,
    isFetchingMoreFromList,
    availabilities,
    timeslotsByDay,
    fetchMoreFromList,
    hasMoreAvailabilites,
  } = useAvailabilities({
    date: currentDate,
    month: currentMonth,
    year: currentYear,
  });

  useEffect(() => {
    if (!Object.keys(timeslotsByDay)[0]) {
      return;
    }

    const newDate = new Date(Object.keys(timeslotsByDay)[0]);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    setCurrentDate(newDate);
  }, [Object.keys(timeslotsByDay)[0]]);

  const handleTimeslotSelect = (timeslot: Availability) => {
    setSelectedTimeslot(timeslot);
    setPage(BookingFormPage.ORDER_DETAILS);
  };

  const handleClose = () => {
    close();
  };

  const handleCalendarDrawerToggle = () => setCalendarOpen((prev) => !prev);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);

    document
      .querySelector(".wizard-modal__root")
      ?.scrollTo({ top: 0, behavior: "smooth" });

    setCalendarOpen(false);
  };

  const handleMonthChange = (month: number) => setCurrentMonth(month);

  const handleYearChange = (year: number) => setCurrentYear(year);

  /**Loads more events on callback from infinite scroller. */
  const handleLoadMore = async () => {
    if (!isFetchingMoreFromList) {
      const hasMore = await hasMoreAvailabilites();
      setHasMoreAvailableDates(hasMore);

      if (hasMore) {
        fetchMoreFromList();
      }
    }
  };

  const dateIsDisabled = (date: Date) => {
    const timeslots = getTimeslotsByDate(availabilities, date);
    const disabled = !timeslots.length;

    return disabled;
  };

  /**Callback to determine if date is sold out. */
  const dateIsSoldOut = (date: Date) => {
    const timeslots = getTimeslotsByDate(availabilities, date);
    const isSoldOut = timeslots.every((timeslot) => timeslot.unitsLeft === 0);

    return isSoldOut;
  };
  const calendar = (
    <Calendar
      labels={labels}
      date={currentDate}
      month={currentMonth}
      year={currentYear}
      dateIsDisabled={dateIsDisabled}
      dateIsSoldOut={dateIsSoldOut}
      loading={isFetchingInitialAvailabilities || isFetchingMoreAvailabilities}
      onDateChange={handleDateChange}
      onMonthChange={handleMonthChange}
      onYearChange={handleYearChange}
    />
  );

  const minPrice = useMemo(
    () => event?.variants?.map(({ price }) => price).sort()[0],
    [isFetchingEvent],
  );

  const getDaysToRender = () => {
    const dateFormat = "YYYY-MM-DD";

    const startingPointIndex = Object.keys(timeslotsByDay).findIndex(
      (key) =>
        moment(currentDate).format(dateFormat) ===
        moment(key).format(dateFormat),
    );

    let daysToRender = Object.keys(timeslotsByDay);

    if (startingPointIndex >= 0) {
      daysToRender = daysToRender.slice(startingPointIndex);
    }

    return daysToRender;
  };

  const renderTimeslots = () => {
    if (isFetchingInitialAvailabilities) {
      return null;
    }

    const daysToRender = getDaysToRender();

    return (
      <InfiniteScroll
        hasMore={hasMoreAvailableDates}
        useWindow={false}
        getScrollParent={() => document.querySelector(".wizard-modal__root")}
        loadMore={handleLoadMore}
        loader={
          (isFetchingMoreFromList ? (
            <TimeslotGroupSkeleton length={1} />
          ) : undefined) as JSX.Element
        }
      >
        {daysToRender.map((date) => (
          <TimeslotGroup
            key={date}
            lang={languageCode}
            timeslots={timeslotsByDay[date].map((timeslot) => {
              const handleSelect = () => handleTimeslotSelect(timeslot);

              return {
                minPrice,
                moneyFormat: moneyFormat,
                startsAt: new Date(timeslot.startsAt),
                endsAt: new Date(timeslot.endsAt),
                formattedTimeslot: timeslot.formattedTimeslot,
                occurrenceId: timeslot.occurrenceId,
                occurrence: timeslot.occurrenceTimeslots,
                remainingSpots: timeslot.unitsLeft,
                timezone: timeslot.timezone,
                onSelect: handleSelect,
                labels: labels,
              };
            })}
          />
        ))}
      </InfiniteScroll>
    );
  };

  /**Renders calendar and timeslot cards for view. */
  const renderView = () => {
    return (
      <div className="timeslot-selection">
        {isFetchingInitialAvailabilities && (
          <div className="timeslot-selection__loader" />
        )}
        <div className="timeslot-selection__calendar">
          {isFetchingInitialAvailabilities ? (
            <CalendarSkeleton />
          ) : (
            <Fragment>
              <EventTitle
                title={event.name}
                thumbnailSrc={event.featuredImageUrl}
              />
              {calendar}
            </Fragment>
          )}
        </div>
        <BottomDrawer
          open={calendarDrawerOpen}
          onClose={handleCalendarDrawerToggle}
        >
          {calendar}
        </BottomDrawer>
        <div className="timeslot-selection__timeslot-list">
          {isFetchingInitialAvailabilities ? (
            <TimeslotGroupSkeleton length={5} />
          ) : (
            <Fragment>{renderTimeslots()}</Fragment>
          )}
        </div>
      </div>
    );
  };

  return (
    <Fragment>
      <WizardModalTitleBar
        title={labels.selectDateLabel ? labels.selectDateLabel : "Select dates"}
        onBack={handleClose}
      >
        {!isFetchingEvent && (
          <button
            className="timeslot-selection__calendar-button"
            onClick={handleCalendarDrawerToggle}
          >
            <CalendarIcon />
          </button>
        )}
      </WizardModalTitleBar>
      {!isFetchingInitialAvailabilities &&
      Object.keys(availabilities).length === 0 ? (
        <div className="timeslot-selection__no-availability">
          <Donger />
          <TextStyle
            text={labels.whoopsLabel ? labels.whoopsLabel : "Whoops!"}
            variant="display1"
          />
          <TextStyle
            text={
              labels.noUpcomingTimeSlotsLabel
                ? labels.noUpcomingTimeSlotsLabel
                : "There is currently no availability for this experience."
            }
            variant="body1"
          />
          <Button
            text={<TextStyle text="close" variant="body1" />}
            color="transparent"
            onClick={handleClose}
          />
        </div>
      ) : (
        renderView()
      )}
    </Fragment>
  );
};
