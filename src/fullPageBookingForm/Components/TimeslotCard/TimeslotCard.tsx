/** @jsx h */
import { h, FunctionComponent, Fragment } from "preact";
import { useState } from "preact/hooks";
import { Button } from "../Common/Button";
import { Card } from "../Common/Card";
import { TextStyle } from "../Common/TextStyle";
import "./TimeslotCard.scss";
import { formatCurrency } from "../../../Utils/helpers";
import { AppDictionary } from "../../../typings/Languages";
import { FormattedTimeslot } from "../../../typings/FormattedTimeslot";
import { TimeslotOccurrenceToggle } from "./TimeslotOccurrenceToggle";

export type TimeslotCardProps = {
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  formattedTimeslot: FormattedTimeslot;
  remainingSpots: number;
  minPrice: number;
  onSelect: () => void;
  moneyFormat: string;
  labels: Partial<AppDictionary>;
  occurrence?: {
    id: string;
    timeslots: {
      id: string;
      startsAt: Date;
      endsAt: Date;
      formattedTimeslot: FormattedTimeslot;
    }[];
  }
};

export const TimeslotCard: FunctionComponent<TimeslotCardProps> = ({
  formattedTimeslot,
  remainingSpots,
  minPrice,
  moneyFormat,
  onSelect,
  labels,
  occurrence,
}) => {
  const [activeOccurrences, setActiveOccurrences] = useState<string[]>([]);

  const handleOccurrenceToggle = (occurrenceId: string) => {
    let activeOccurrencesClone = [...activeOccurrences];

    if (activeOccurrencesClone.includes(occurrenceId)){
      activeOccurrencesClone.splice(activeOccurrences.indexOf(occurrenceId), 1);
    } else {
      activeOccurrencesClone.push(occurrenceId);
    }

    setActiveOccurrences(activeOccurrencesClone);
  };

  let timeslotClassNames = ["timeslot-card"];

  if (remainingSpots === 0) {
    timeslotClassNames.push("timeslot-card--is-disabled");
  }

  const remainingSpotsText = `${remainingSpots} ${
    remainingSpots !== 1
      ? labels.spotsLeftLabel
        ? labels.spotsLeftLabel
        : "spots left"
      : labels.spotLeftLabel
      ? labels.spotLeftLabel
      : "spot left"
  }`;

  const timeslotInfo = !!occurrence?.timeslots.length
    ? `${occurrence.timeslots[0].formattedTimeslot.date} – ${occurrence.timeslots[occurrence.timeslots.length - 1].formattedTimeslot.date}`
    : formattedTimeslot.timeRange;

  const occurrenceInfo = !!occurrence?.timeslots.length && (
    <ul className={`timeslot-card__occurrence${!!~activeOccurrences.indexOf(occurrence.id) ? " active" : ""}`}>
      {occurrence.timeslots.map((ts) =>
        <li key={ts.id} className="timeslot-card__occurrence__node">{ts.formattedTimeslot.date}, {ts.formattedTimeslot.timeRange}</li>)
      }
    </ul>
  );

  return (
    <Card>
      <div className={timeslotClassNames.join(" ")} data-testid="timeslot-card">
        <div className="timeslot-card__details">
          <div className="timeslot-card__details__time">
            <TextStyle
              variant="body1"
              text={
                <Fragment>
                  {timeslotInfo}{" | "}
                </Fragment>
              }
            />
            <TextStyle variant="body3" text={remainingSpotsText} />
          </div>
          <div className="timeslot-card__details__pricing">
            <TextStyle
              variant="display1"
              text={
                minPrice
                  ? `From ${formatCurrency(moneyFormat, minPrice)}`
                  : "Free"
              }
            />
            <TextStyle
              variant="body1"
              text={` | ${
                labels.singularUnitLabel ? labels.singularUnitLabel : "person"
              }`}
            />
          </div>
        </div>
        <div className="timeslot-card__button">
          <Button
            color={remainingSpots === 0 ? "grayed" : "primary"}
            text={
              remainingSpots === 0
                ? `${labels.soldOutLabel ? labels.soldOutLabel : "Sold Out"}`
                : `${
                    labels.selectDateLabel ? labels.selectDateLabel : "Select"
                  }`
            }
            onClick={onSelect}
            disabled={remainingSpots === 0}
          />
        </div>
        {!!occurrence && (
          <TimeslotOccurrenceToggle
            active={!!~activeOccurrences.indexOf(occurrence.id)}
            clickFunction={handleOccurrenceToggle.bind(null, occurrence.id)}
          />
        )}
        {occurrenceInfo}
      </div>
    </Card>
  );
};
