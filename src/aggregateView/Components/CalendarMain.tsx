import "./CalendarMain.scss";
import { addDays, isAfter, subDays } from "date-fns/fp";
import { format } from "date-fns";
import { Component, createRef, h } from "preact";
import { CalendarViewSelector } from "../../SharedComponents/Calendar/CalendarViewSelector";
import { fetchProductsWithAvailability, getCustomScripts } from "../../Utils/api";
import {
  Calendar,
  CalendarEvent,
  calendarViewType,
  FullCalendarEvent,
} from "../../SharedComponents/Calendar/CalendarWrapper";
import { extractAndParseEvents } from "../../Utils/helpers";
import { CalendarEventListContent } from "../../SharedComponents/Calendar/CalendarEventListContent";
import { CalendarEventGridContent } from "../../SharedComponents/Calendar/CalendarEventGridContent";
import { CalendarDaySchedule } from "../../SharedComponents/Calendar/CalendarDaySchedule";
import { CalendarEventClick, DateClickEvent } from "../../typings/Calendar";
import { CalendarNoEventsMessage } from "../../SharedComponents/Calendar/CalendarNoEventsMessage";
import { Loading } from "../../SharedComponents/loading/Loading";
import { Weekdays } from "../../Utils/Constants";

interface ICalendarContainerProps {
  aggregateViewBaseUrl?: string;
  aggregateViewShop?: string;
  aggregateViewShopUrl?: string;
  defaultVew?: string;
  baseUrl?: string;
  languageCode?: string;
  shopUrl?: string;
  storefrontAccessToken?: string;
}

interface ICalendarContainerState {
  view: string;
  daySelected?: Date;
  events: CalendarEvent[];
  fullCalendarEvents: FullCalendarEvent[];
  daySelectedEvents: CalendarEvent[];
  start: Date; // tracks current start date of next and prev updates
  end: Date; // tracks current end date of next and prev updates
  loading: boolean;
  weekStartsOn: Weekdays;
}

const eventRendererViewMap = {
  [calendarViewType.dayGrid]: CalendarEventGridContent,
  [calendarViewType.list]: CalendarEventListContent,
};

export class CalendarContainer extends Component<ICalendarContainerProps, ICalendarContainerState> {
  calendarRef = createRef();
  state: ICalendarContainerState = {
    view: calendarViewType.dayGrid,
    events: [],
    fullCalendarEvents: [],
    daySelected: null,
    daySelectedEvents: [],
    start: subDays(30)(new Date()),
    end: addDays(60)(new Date()),
    loading: false,
    weekStartsOn: Weekdays.Monday,
  };

  async componentDidMount() {
    const { defaultVew, shopUrl, baseUrl } = this.props;
    this.fetchEvents();
    this.fetchSettings(baseUrl, shopUrl);

    // only show list view on smaller screens
    if (window && window.innerWidth < 768) {
      this.selectView(calendarViewType.list);
    }

    if (defaultVew && calendarViewType[defaultVew]) {
      this.selectView(calendarViewType[defaultVew]);
    }

    document && document.getElementsByClassName("fc-prev-button")[0].addEventListener("click", this.handlePrevClick);
    document && document.getElementsByClassName("fc-next-button")[0].addEventListener("click", this.handleNextClick);
  }

  componentWillUnmount() {
    document && document.getElementsByClassName("fc-prev-button")[0].removeEventListener("click", this.handlePrevClick);
    document && document.getElementsByClassName("fc-next-button")[0].removeEventListener("click", this.handleNextClick);
  }

  handlePrevClick = async () => {
    const { view, start, end } = this.state;
    const decrement = view === calendarViewType.dayGrid ? 30 : 7;
    const newEnd = subDays(decrement)(end);
    const newStart = subDays(decrement)(start);
    if (isAfter(newEnd, end)) {
      this.setState({ end: newEnd });
    }
    this.fetchEvents(newStart, end);
    this.setState({ start: newStart });
  }

  handleNextClick = async () => {
    const { view, start, end } = this.state;
    const increment = view === calendarViewType.dayGrid ? 30 : 7;
    const newEnd = addDays(increment)(end);
    this.fetchEvents(start, newEnd);
    this.setState({ end: newEnd });
  }

  fetchSettings = async (baseUrl: string, shopId: string) => {
    const settings = await getCustomScripts({ baseUrl, shopId });
    const weekStartsOn = settings.weekStartsOn !== undefined ?
      settings.weekStartsOn as Weekdays :
      Weekdays.Monday;
    this.setState({ weekStartsOn });
  }

  fetchEvents = async (start = this.state.start, end = this.state.end) => {
    const { baseUrl, shopUrl } = this.props;
    this.setState({ loading: true });
    const eventsResponse = await fetchProductsWithAvailability(baseUrl, shopUrl, start, end);
    const { calendarEvents: events, fullCalendarEvents } = extractAndParseEvents(eventsResponse, shopUrl, baseUrl);
    this.setState({ events, fullCalendarEvents, loading: false });
  }

  navigateToNextAvailableTS = () => {
    const earliestAvailableEventDate = Math.min(...this.state.events.map(e => e.start.getTime()));
    const calendarApi = this.calendarRef.current.getApi();
    calendarApi.gotoDate(new Date(earliestAvailableEventDate));
  }

  renderCalendarNoEventsMessage = () => {
    return <CalendarNoEventsMessage  onNextAvailableClick={this.navigateToNextAvailableTS} />;
  }

  handleEventClick = ({ event: { _def, _instance }}: CalendarEventClick) => {
    const eventSelected = this.state.events.find(e => _def.extendedProps.uuid === e.uuid);
    this.setState({ daySelected: _instance.range.start, daySelectedEvents: [eventSelected] });
  }

  selectView = (view: string) => {
    const calendarApi = this.calendarRef.current.getApi();
    calendarApi.changeView(view);
    this.setState({ view });
  }

  handleMoreClick = ({ date }: DateClickEvent) => {
    const earliest = new Date(date).getTime();
    const latest = new Date(date).setHours(23, 59, 59);
    const daySelectedEvents = this.state.events.filter(e => e.start.getTime() >= earliest && e.start.getTime() < latest);
    this.setState({ daySelected: date, daySelectedEvents });
  }

  handleClose = () => this.setState({ daySelected: null });

  render() {
    const { fullCalendarEvents, view, daySelected, daySelectedEvents, loading, weekStartsOn } = this.state;
    const titleFormat = window && window.innerWidth >= 1024 ? null : { month: "short", year: "numeric" };

    return (
      <div className="CalendarAggregate-Container">
        {loading && <Loading
          customStyles={{
            position: "absolute",
            zIndex: 1000,
          }}
        />}
        <div className="main-heading">Events Calendar</div>
        <div className="AggregateCalendar-Main">
          <CalendarViewSelector view={view} selectView={this.selectView} />
          <CalendarDaySchedule
            open={!!daySelected && !!daySelectedEvents.length}
            handleClose={this.handleClose}
            title={daySelected ? format(daySelected, "MMMM d, y") : ""}
            events={daySelectedEvents}
          />
          <Calendar
            firstDay={weekStartsOn}
            showNonCurrentDates={false}
            dayMaxEventRows={4}
            eventClick={this.handleEventClick}
            forwardRef={this.calendarRef}
            view={view}
            events={fullCalendarEvents}
            eventContent={eventRendererViewMap[view]}
            titleFormat={titleFormat}
            moreLinkClick={this.handleMoreClick}
            noEventsContent={this.renderCalendarNoEventsMessage()}
          />
        </div>
      </div>
    );
  }
}