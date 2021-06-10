import { h, FunctionalComponent } from "preact";

export type TimeslotOccurrenceToggleProps = {
  active: boolean;
  clickFunction(event: MouseEvent): void;
};

export const TimeslotOccurrenceToggle: FunctionalComponent<TimeslotOccurrenceToggleProps> = ({active, clickFunction}) => {
  return (
    <button role={"switch"} onClick={clickFunction} className={`timeslot-card__occurrence-toggle${active ? " active" : ""}`}>
      <svg width="14" height="7" xmlns="http://www.w3.org/2000/svg">
        <path d="m 6.0705207,6.7011562 c 0.2492266,0.199147 0.5785261,0.29872 0.9288446,0.29872 0.3513196,0 0.68162,-0.09957 0.9288448,-0.29872 L 13.749504,1.3242009 a 0.73166541,0.72788044 0 0 0 0,-1.09530584 0.94786203,0.94295871 0 0 0 -1.238126,0 L 6.9993653,5.3071309 1.4883536,0.22889506 a 0.94786203,0.94295871 0 0 0 -1.238126,0 0.73066449,0.72688471 0 0 0 0,1.09530584 z" fill="#fff" fill-rule="evenodd" />
      </svg>
    </button>
  );
};