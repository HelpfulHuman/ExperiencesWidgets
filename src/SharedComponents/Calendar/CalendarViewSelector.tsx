import { Component, h } from "preact";
import "./CalendarViewSelector.scss";
import { calendarViewType } from "./CalendarWrapper";
import { CalendarIcon } from "../Icons/CalendarIcon";
import { ListIcon } from "../Icons/ListIcon";

interface ICalendarViewSelectorProps {
  view: string;
  selectView(view: string): void;
}

export class CalendarViewSelector extends Component<ICalendarViewSelectorProps> {
  render() {
    const {selectView, view} = this.props;

    return (
      <div className="Calendar-ViewSelector">
        <div
          className={`MonthView ${view === calendarViewType.dayGrid ? "Selected" : ""}`}
          onClick={() => selectView(calendarViewType.dayGrid)}
        >
          <div className="CalendarIcon">
            <CalendarIcon />
          </div>
          <div>Month</div>
        </div>
        <div
          className={`ListView ${view === calendarViewType.list ? "Selected" : ""}`}
          onClick={() => selectView(calendarViewType.list)}
        >
          <div className="ListIcon">
            <ListIcon />
          </div>
          <div>List</div>
        </div>
      </div>
    );
  }
}