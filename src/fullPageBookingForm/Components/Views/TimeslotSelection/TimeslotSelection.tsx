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
import { useProduct } from "../../../Hooks/useProduct";

export type TimeslotSelectionProps = {
  /**Format for money in shop. */
  moneyFormat: string;
};

export const TimeslotSelection: FunctionComponent<TimeslotSelectionProps> = ({
  moneyFormat,
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
  const { isFetchingProduct, products } = useProduct();
  const isLoading = isFetchingEvent || isFetchingProduct;

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

  // const totalProductsRemaining = useMemo(
  //   () =>
  //     []
  //       .concat(
  //         ...products.map((product) => [
  //           ...product.variants.map((variant) => variant.inventory_quantity),
  //         ]),
  //       )
  //       .reduce((total, current) => total + current, null),
  //   [isFetchingProduct],
  // );

  const totalProductsRemaining = 0;

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
            timeslots={timeslotsByDay[date].map((timeslot) => {
              const handleSelect = () => handleTimeslotSelect(timeslot);

              return {
                minPrice,
                moneyFormat: moneyFormat,
                startsAt: new Date(timeslot.startsAt),
                endsAt: new Date(timeslot.endsAt),
                remainingSpots: timeslot.unitsLeft,
                timezone: timeslot.timezone,
                onSelect: handleSelect,
                productUnitsRemaining: totalProductsRemaining,
              };
            })}
          />
        ))}
      </InfiniteScroll>
    );
  };

  return (
    <Fragment>
      <WizardModalTitleBar title="Select dates" onBack={handleClose}>
        {!isLoading && (
          <button
            className="timeslot-selection__calendar-button"
            onClick={handleCalendarDrawerToggle}
          >
            <CalendarIcon />
          </button>
        )}
      </WizardModalTitleBar>
      {isLoading ? (
        <div style={{ textAlign: "center" }}>
          <TextStyle variant="display2" text="Loading experience data..." />
        </div>
      ) : !isFetchingInitialAvailabilities &&
        Object.keys(availabilities).length === 0 ? (
        <div className="timeslot-selection__no-availability">
          <Donger />
          <TextStyle text="Whoops!" variant="display1" />
          <TextStyle
            text="There is currently no availability for this experience."
            variant="body1"
          />
          <Button
            text={<TextStyle text="close" variant="body1" />}
            color="transparent"
            onClick={handleClose}
          />
        </div>
      ) : (
        <Fragment>
          <div className="timeslot-selection">
            <div className="timeslot-selection__calendar">
              <EventTitle
                inlineWithThumbnail
                title={event.name}
                thumbnailSrc={event.featuredImageUrl}
              />
              {calendar}
              <div className="timeslot-selection__legend">
                <div className="timeslot-selection__legend-container">
                  <TextStyle text="T" variant="body1" />
                  <TextStyle
                    text="Sold out. No availability on this day"
                    variant="body1"
                  />
                </div>
                <div className="timeslot-selection__legend-container">
                  <TextStyle text="T" variant="body1" />
                  <TextStyle
                    text="Timeslots not offered on this day"
                    variant="body1"
                  />
                </div>
              </div>
            </div>
            <BottomDrawer
              open={calendarDrawerOpen}
              onClose={handleCalendarDrawerToggle}
            >
              {calendar}
            </BottomDrawer>
            <div className="timeslot-selection__timeslot-list">
              {isFetchingInitialAvailabilities ? (
                <Fragment>
                  <TimeslotGroupSkeleton length={4} />
                  <TimeslotGroupSkeleton length={2} />
                </Fragment>
              ) : (
                <Fragment>{renderTimeslots()}</Fragment>
              )}
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};
