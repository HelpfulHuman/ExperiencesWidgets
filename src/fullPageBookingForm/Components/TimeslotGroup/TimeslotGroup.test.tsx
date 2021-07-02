/** @jsx h */
import { h } from "preact";
import { render, screen } from "@testing-library/preact";
import { TimeslotGroup } from "./TimeslotGroup";
import { formatTimeslot } from "../../../typings/FormattedTimeslot";
import { defineLanguageDictionary } from "../../../typings/Languages";

test("Renders content correctly", () => {
  render(
    <TimeslotGroup
      timeslots={[
        {
          startsAt: new Date(Date.UTC(2021, 2, 17, 10)),
          endsAt: new Date(Date.UTC(2021, 2, 17, 11)),
          formattedTimeslot: formatTimeslot(new Date(Date.UTC(2021, 2, 17, 10)), new Date(Date.UTC(2021, 2, 17, 11)), "America/Los_Angeles"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "America/Los_Angeles",
          onSelect: jest.fn(),
          moneyFormat: "${{amount}}",
          labels: defineLanguageDictionary("en-US"),
        },
        {
          startsAt: new Date(Date.UTC(2021, 2, 17, 11)),
          endsAt: new Date(Date.UTC(2021, 2, 17, 12)),
          formattedTimeslot: formatTimeslot(new Date(Date.UTC(2021, 2, 17, 11)), new Date(Date.UTC(2021, 2, 17, 12)), "America/Los_Angeles"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "America/Los_Angeles",
          onSelect: jest.fn(),
          moneyFormat: "${{amount}}",
          labels: defineLanguageDictionary("en-US"),
        },
        {
          startsAt: new Date(Date.UTC(2021, 2, 17, 12)),
          endsAt: new Date(Date.UTC(2021, 2, 17, 13)),
          formattedTimeslot: formatTimeslot(new Date(Date.UTC(2021, 2, 17, 12)), new Date(Date.UTC(2021, 2, 17, 13)), "America/Los_Angeles"),
          remainingSpots: 4,
          minPrice: 150,
          timezone: "America/Los_Angeles",
          onSelect: jest.fn(),
          moneyFormat: "${{amount}}",
          labels: defineLanguageDictionary("en-US"),
        },
      ]}
      lang={"en-US"}
    />,
  );

  expect(screen.getByText(/wednesday, march 17/i)).toBeInTheDocument();
  expect(screen.getAllByTestId("timeslot-card").length).toBe(3);
});
