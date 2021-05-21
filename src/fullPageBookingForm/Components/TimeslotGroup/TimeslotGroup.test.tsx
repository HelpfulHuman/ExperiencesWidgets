/** @jsx h */
import { h } from "preact";
import { render, screen } from "@testing-library/preact";
import { TimeslotGroup } from "./TimeslotGroup";

test("Renders content correctly", () => {
  render(
    <TimeslotGroup
      timeslots={[
        {
          moneyFormat: "$",
          startsAt: new Date("March 17, 2021 06:00:00"),
          endsAt: new Date("March 17, 2021 10:00:00"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "Asia/Manila",
          onSelect: jest.fn(),
        },
        {
          moneyFormat: "$",
          startsAt: new Date("March 17, 2021 11:30:00"),
          endsAt: new Date("March 17, 2021 12:00:00"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "Asia/Manila",
          onSelect: jest.fn(),
        },
        {
          moneyFormat: "$",
          startsAt: new Date("March 17, 2021 14:30:00"),
          endsAt: new Date("March 17, 2021 16:30:00"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "Asia/Manila",
          onSelect: jest.fn(),
        },
      ]}
    />,
  );

  expect(screen.getByText(/wednesday, march 17/i)).toBeInTheDocument();
  expect(screen.getAllByTestId("timeslot-card").length).toBe(3);
});
