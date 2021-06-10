/** @jsx h */
import { h } from "preact";
import { TimeslotCard, TimeslotCardProps } from "./TimeslotCard";
import { defineLanguageDictionary } from "../../../typings/Languages";
import { formatTimeslot } from "../../../typings/FormattedTimeslot";

export default {
  title: "Full Page Booking Form/App/Timeslot Card",
  component: TimeslotCard,
};

const Template = (args: TimeslotCardProps) => (
  <div style={{ width: 460 }}>
    <TimeslotCard {...args} />
  </div>
);

const defaultArgs: TimeslotCardProps = {
  startsAt: new Date("March 17, 2021 06:00:00"),
  endsAt: new Date("March 17, 2021 10:00:00"),
  formattedTimeslot: formatTimeslot(new Date("March 17, 2021 06:00:00"), new Date("March 17, 2021 10:00:00"), "America/Los_Angeles"),
  remainingSpots: 4,
  minPrice: 150,
  timezone: "America/Los_Angeles",
  onSelect: () => {},
  moneyFormat: "${{amount}}",
  labels: defineLanguageDictionary("en-US"),
};

export const Basic = Template.bind({});
Basic.args = {
  ...defaultArgs,
};
