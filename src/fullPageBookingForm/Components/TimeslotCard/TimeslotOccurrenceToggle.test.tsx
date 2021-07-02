/** @jsx h */
import { h } from "preact";
import { render, screen, fireEvent } from "@testing-library/preact";
import { TimeslotOccurrenceToggle } from "./TimeslotOccurrenceToggle";


test("Calls onToggle callback", async () => {
  const handleToggle = jest.fn();

  render(
    <TimeslotOccurrenceToggle
      active={false}
      clickFunction={handleToggle}
    />,
  );

  fireEvent.click(screen.getByRole("switch"));

  expect(handleToggle).toHaveBeenCalledTimes(1);
});
