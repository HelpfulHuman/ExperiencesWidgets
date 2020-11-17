import { AssetDBO } from "@helpfulhuman/expapp-shared-libs";
import { ViewApi } from "@fullcalendar/react";

export interface ICalendarEventContent {
  event: {
    start: Date;
    _def: {
      extendedProps: {
        imageUrl?: string | AssetDBO;
        paymentType?: string;
        price?: string;
      };
      title: string;
    };
  };
}

export type DateClickEvent = {
  dateStr: string;
  date: Date;
  allDat: boolean;
  jsEvent: MouseEvent;
  view: ViewApi;
  dayEl: HTMLElement;
};