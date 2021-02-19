import { getMonthHeaderTemplate, getMonthTemplate } from "../Utils";
import { Weekdays } from "../../../Utils/Constants";
import moment from "moment-timezone";
import timemachine from "timemachine";

describe("Utils", () => {
  describe("getMonthHeaderTemplate", () => {
    it("returns proper array when week starts on Monday", () => {
      timemachine.config({
        dateString: "December 25, 2020 13:12:59",
      });
      const result = getMonthHeaderTemplate("en-US", Weekdays.Sunday);
      expect(result && result[0] && result[0].dayName).toBe("Sunday");
      expect(result && result[6] && result[6].dayName).toBe("Saturday");
    });
  });

  describe("getMonthTemplate", () => {
    it("returns proper days when week starts on Monday", () => {
      const today = moment().toDate();
      const result = getMonthTemplate(today.getMonth(), today.getFullYear(), Weekdays.Monday);
      expect(result[0].date.getDay()).toBe(Weekdays.Monday);
      expect(result[6].date.getDay()).toBe(Weekdays.Sunday);
      expect(result[7].date.getDay()).toBe(Weekdays.Monday);
      expect(result[13].date.getDay()).toBe(Weekdays.Sunday);
      expect(result[14].date.getDay()).toBe(Weekdays.Monday);
      expect(result[20].date.getDay()).toBe(Weekdays.Sunday);
    });
  });
});