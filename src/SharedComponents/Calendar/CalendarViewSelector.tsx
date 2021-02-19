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
  selectListView = () => {
    this.props.selectView(calendarViewType.list);
  }

  selectGridView = () => {
    this.props.selectView(calendarViewType.dayGrid);
  }

  render() {
    const { view } = this.props;

    return (
      <div className="Calendar-ViewSelector">
        <div
          className={`MonthView ${view === calendarViewType.dayGrid ? "Selected" : ""}`}
          onClick={this.selectGridView}
        >
          <div className="CalendarIcon">
            <CalendarIcon />
          </div>
          <div>Month</div>
        </div>
        <div
          className={`ListView ${view === calendarViewType.list ? "Selected" : ""}`}
          onClick={this.selectListView}
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