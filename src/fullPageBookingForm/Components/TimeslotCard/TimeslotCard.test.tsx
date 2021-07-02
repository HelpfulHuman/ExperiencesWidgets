/** @jsx h */
import { h } from "preact";
import { render, screen, fireEvent } from "@testing-library/preact";
import { TimeslotCard } from "./TimeslotCard";
import { defineLanguageDictionary } from "../../../typings/Languages";
import { formatTimeslot } from "../../../typings/FormattedTimeslot";

const defaultMoneyFormat = "${{amount}}";

test("Renders content correctly", async () => {
  render(
    <TimeslotCard
      startsAt={new Date("March 17, 2021 06:00:00")}
      endsAt={new Date("March 17, 2021 10:00:00")}
      timezone="America/Los_Angeles"
      formattedTimeslot={formatTimeslot(new Date("March 17, 2021 06:00:00"), new Date("March 17, 2021 10:00:00"), "America/Los_Angeles")}
      remainingSpots={4}
      minPrice={150}
      onSelect={jest.fn()}
      moneyFormat={defaultMoneyFormat}
      labels={defineLanguageDictionary("en-US")}
    />,
  );

  expect(screen.getByText(/4 spots left/i)).toBeInTheDocument();
  expect(screen.getByText("From $150.00")).toBeInTheDocument();
  expect(screen.getByText("| person")).toBeInTheDocument();
  expect(screen.getByText(/select/i)).toBeInTheDocument();
});

test("Calls onSelect callback", () => {
  const handleSelect = jest.fn();

  render(
    <TimeslotCard
      startsAt={new Date("March 17, 2021 06:00:00")}
      endsAt={new Date("March 17, 2021 10:00:00")}
      timezone={"America/Los_Angeles"}
      formattedTimeslot={formatTimeslot(new Date("March 17, 2021 06:00:00"), new Date("March 17, 2021 10:00:00"), "America/Los_Angeles")}
      remainingSpots={4}
      minPrice={150}
      onSelect={handleSelect}
      moneyFormat={defaultMoneyFormat}
      labels={defineLanguageDictionary("en-US")}
    />,
  );

  fireEvent.click(screen.getByText(/select/i));

  expect(handleSelect).toHaveBeenCalledTimes(1);
});
