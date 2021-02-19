import "ts-polyfill";

/**
 * Loads a specified widget code into the website
 *
 * @param keyAttribute The attribute id that represents that widget
 * @param scriptPath The url to the widget code
 */
function loadExpAppWidget(keyAttribute: string, scriptPath: string): void {
  const mountPoints = document.querySelectorAll(keyAttribute);

  if (mountPoints.length > 0) {
    let head = document.getElementsByTagName("HEAD")[0];
    let script = document.createElement("script");
    let styles = document.createElement("link");

    styles.rel = "stylesheet";
    styles.type = "text/css";
    styles.href = scriptPath.replace(".js", ".css");

    script.src = scriptPath;
    head.appendChild(styles);
    document.body.appendChild(script);
  }
}
// baseUrl for Development
// const baseUrl = "__BASE_URL__/__ENV_NAME__";
// baseURL for Production
const baseUrl = "__BASE_URL__/public/__ENV_NAME__";
loadExpAppWidget("[data-expapp-gallery]", `${baseUrl}/expAppListView.js`);
loadExpAppWidget(
  "[data-expapp-calendar-booking-form]",
  `${baseUrl}/calendarBookingForm.js`,
);
loadExpAppWidget("[data-expapp-aggregate-view]", `${baseUrl}/aggregateView.js`);