/** @jsx h */
import { h, render, ComponentFactory } from "preact";
import "ts-polyfill";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import { App, AppProps } from "./Components/App";
import { mountComponent } from "../Utils/mount";

const url = new URL(location.href);
const urlPaths = url.pathname.split("/");

//Provided by express template injection.
declare const baseUrl: string;

//Proxied version of app has multiple path parameters.
if (urlPaths.length >= 6) {
  const langCodeIdx = 3;
  const productIdIdx = 4;
  const autoOpenIdx = 5;
  /**
   * Mounts an instance of the widget component to the found HTML element.
   */
  const mountWidget = (component: ComponentFactory<AppProps>, el: Element) => {
    try {
      const languageCode = urlPaths[langCodeIdx];
      const shopifyProductId = urlPaths[productIdIdx];
      const autoOpen = urlPaths[autoOpenIdx];
      const shopUrl = url.host;

      const props: AppProps = {
        baseUrl,
        languageCode,
        shopUrl,
        shopifyProductId: parseFloat(shopifyProductId),
        autoOpen: parseFloat(autoOpen),
      };
      render(h(component, props), el);
    } catch (err) {
      console.error(`Failed to mount the "full page" widget.`, err);
      return;
    }
  };

  mountWidget(App, document.getElementById("container"));
} else {
  mountComponent<AppProps>({
    dataName: "expapp-full-page-booking-form",
    formatData(data) {
      if (!data.fullPageBookingFormShopUrl) {
        throw new Error(
          "You must specify the [data-expapp-full-page-booking-form-shop-url] attribute for this widget to load",
        );
      }

      if (!data.fullPageBookingFormBaseUrl) {
        throw new Error(
          "You must specify the [data-expapp-full-page-booking-form-base-url] attribute for this widget to load",
        );
      }

      if (!data.fullPageBookingFormProductId) {
        throw new Error(
          "You must specify the [data-expapp-full-page-booking-form-product-id] attribute for this widget to load",
        );
      }

      return {
        baseUrl: data.fullPageBookingFormBaseUrl,
        shopUrl: data.fullPageBookingFormShopUrl,
        shopifyProductId: parseInt(data.fullPageBookingFormProductId),
        languageCode: data.fullPageBookingFormLanguageCode || "en-US",
      };
    },
    component: App,
  });
}
