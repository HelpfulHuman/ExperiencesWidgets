/** @jsx h */
import { h } from "preact";
import { TimeslotGroup } from "./TimeslotGroup";
import { formatTimeslot } from "../../../typings/FormattedTimeslot";
import { defineLanguageDictionary } from "../../../typings/Languages";

export default {
  title: "Full Page Booking Form/App/Timeslot Group",
  component: TimeslotGroup,
};

export const Basic = () => (
  <div style={{ width: 460 }}>
    <TimeslotGroup
      timeslots={[
        {
          startsAt: new Date("March 17, 2021 06:00:00"),
          endsAt: new Date("March 17, 2021 10:00:00"),
          formattedTimeslot: formatTimeslot(new Date("March 17, 2021 06:00:00"), new Date("March 17, 2021 10:00:00"), "America/Los_Angeles"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "America/Los_Angeles",
          onSelect: () => {},
          moneyFormat: "${{amount}}",
          labels: defineLanguageDictionary("en-US"),
        },
        {
          startsAt: new Date("March 17, 2021 10:00:00"),
          endsAt: new Date("March 17, 2021 13:00:00"),
          formattedTimeslot: formatTimeslot(new Date("March 17, 2021 10:00:00"), new Date("March 17, 2021 13:00:00"), "America/Los_Angeles"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "America/Los_Angeles",
          onSelect: () => {},
          moneyFormat: "${{amount}}",
          labels: defineLanguageDictionary("en-US"),
        },
        {
          startsAt: new Date("March 17, 2021 13:00:00"),
          endsAt: new Date("March 17, 2021 16:00:00"),
          formattedTimeslot: formatTimeslot(new Date("March 17, 2021 13:00:00"), new Date("March 17, 2021 16:00:00"), "America/Los_Angeles"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "America/Los_Angeles",
          onSelect: () => {},
          moneyFormat: "${{amount}}",
          labels: defineLanguageDictionary("en-US"),
        },
      ]}
      lang={"en-US"}
    />
  </div>
);
