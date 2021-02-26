import { parseISO, isBefore } from "date-fns";
import moment from "moment-timezone";
import { FirstAvailability } from "../typings/FirstAvailability";
import { Availability } from "../typings/Availability";
import { EventAssetLinkDBO, EventVariantDBO } from "../typings/Event";
import { AssetDBO } from "@helpfulhuman/expapp-shared-libs";
import { EventAvailability } from "./api";
import { CalendarEvent, FullCalendarEvent } from "../SharedComponents/Calendar/CalendarWrapper";

/**
* Takes in shopify money_format property along with a float value
* Returns formatted currency with symbol identical to how shopify displays currency
* eg: $1,000,000.00 or €1.000.000,00
*/
export function formatCurrency(liquidFormat: string = undefined, value: number | string = 0) {

  if (typeof value === "string") {
    value = parseFloat(value);
  }

  //Shopify rounds if no decimal is specified in shop settings so let's mimick that
  liquidFormat && liquidFormat.includes("no_decimals") ? value = Math.round(value) : value = value.toFixed(2);

  //Default to US eg: 1,000,000.00 and then we can replace , or . if specified in shop settings
  let valueSplit = value.toString().split(".");
  valueSplit[0] = parseInt(valueSplit[0]).toLocaleString("en-US");
  value = valueSplit.join(".");

  //if no formatter is provided just return the value
  if (!liquidFormat) { return `$${value}`; }

  // Re-assign liquidFormat to an HTML-free string
  liquidFormat = liquidFormat.replace(/<[^>]*>/g, "");

  //for comma separator replace commas with periods and decimal with a comma
  if (liquidFormat.includes("comma_separator")) {
    const separated = value.split(".");
    separated[0] = separated[0].split(",").join(".");
    value = separated.join(",");
  }

  //for apostrophe separator replace commas with apostrophies.
  if (liquidFormat.includes("apostrophe_separator")) {
    value = value.split(",").join("'");
  }

  //find index of opening and closing brackets, we want to replace this with the amount value
  const start = liquidFormat.indexOf("{{");
  const end = liquidFormat.indexOf("}}");

  //if there's no liquid format provided, just concat the new value and return it
  if (start === -1 && end === -1) { return liquidFormat.concat(value); }

  //otherwise replace liquid value with new formatted value and return
  return liquidFormat.replace(liquidFormat.slice(start, end + 2), value);
}

/**
 * Get all available timeslots from first available day.
 */
export function getFirstDayAvailabilities(data: FirstAvailability): Availability[] {
  const firstYear = data[Object.keys(data)[0]] || {};
  const firstMonth = firstYear[Object.keys(firstYear)[0]] || {};
  const firstWeek = firstMonth[Object.keys(firstMonth)[0]] || {};

  return firstWeek[Object.keys(firstWeek)[0]].filter(a => a && a.unitsLeft > 0) || [];
}

/**
 * Get Timeslots from `/firstAvailability` response by Date
 */
export function getTimeslotsByDate(data: FirstAvailability, selectedDate: Date): Availability[] {
  const y = selectedDate.getFullYear();
  const m = selectedDate.getMonth();
  const d = selectedDate.getDay();
  const w = Math.ceil((selectedDate.getDate() - 1 - d) / 7);

  const yearData = data[y] || {};
  const monthData = yearData[m] || {};
  const weekData = monthData[w] || {};

  return weekData[d] || [];
}
/**
 * Returns the plural of an English word.
 *
 * @export
 * @param {string} word
 * @param {number} [amount]
 * @returns {string}
 */
export function plural(word: string, amount?: number): string {
  let output = word;

  if (amount !== undefined && amount === 1) {
    return output;
  }
  const plural: { [key: string]: string } = {
    "(quiz)$": "$1zes",
    "^(ox)$": "$1en",
    "([m|l])ouse$": "$1ice",
    "(matr|vert|ind)ix|ex$": "$1ices",
    "(x|ch|ss|sh)$": "$1es",
    "([^aeiouy]|qu)y$": "$1ies",
    "(hive)$": "$1s",
    "(?:([^f])fe|([lr])f)$": "$1$2ves",
    "(shea|lea|loa|thie)f$": "$1ves",
    "sis$": "ses",
    "([ti])um$": "$1a",
    "(tomat|potat|ech|her|vet)o$": "$1oes",
    "(bu)s$": "$1ses",
    "(alias)$": "$1es",
    "(octop)us$": "$1i",
    "(ax|test)is$": "$1es",
    "(us)$": "$1es",
    "([^s]+)$": "$1s",
  };
  const irregular: { [key: string]: string } = {
    "move": "moves",
    "foot": "feet",
    "goose": "geese",
    "sex": "sexes",
    "child": "children",
    "man": "men",
    "tooth": "teeth",
    "person": "people",
  };
  const uncountable: string[] = [
    "sheep",
    "fish",
    "deer",
    "moose",
    "series",
    "species",
    "money",
    "rice",
    "information",
    "equipment",
    "bison",
    "cod",
    "offspring",
    "pike",
    "salmon",
    "shrimp",
    "swine",
    "trout",
    "aircraft",
    "hovercraft",
    "spacecraft",
    "sugar",
    "tuna",
    "you",
    "wood",
  ];
  // save some time in the case that singular and plural are the same
  if (uncountable.indexOf(word.toLowerCase()) >= 0) {
    return output;
  }
  // check for irregular forms
  for (const w in irregular) {
    const pattern = new RegExp(`${w}$`, "i");
    const replace = irregular[w];
    if (pattern.test(word)) {
      output = word.replace(pattern, replace);
      output = word[0] + output.slice(1);
      return output;
    }
  }
  // check for matches using regular expressions
  for (const reg in plural) {
    const pattern = new RegExp(reg, "i");
    if (pattern.test(word)) {
      output = word.replace(pattern, plural[reg]);
      output = word[0] + output.slice(1);
      return output;
    }
  }
  return output;
}

/**
 * Returns the singular of an English word.
 *
 * @export
 * @param {string} word
 * @param {number} [amount]
 * @returns {string}
 */
export function singular(word: string, amount?: number): string {
  if (amount !== undefined && amount !== 1) {
    return word;
  }
  const singular: { [key: string]: string } = {
    "(quiz)zes$": "$1",
    "(matr)ices$": "$1ix",
    "(vert|ind)ices$": "$1ex",
    "^(ox)en$": "$1",
    "(alias)es$": "$1",
    "(octop|vir)i$": "$1us",
    "(cris|ax|test)es$": "$1is",
    "(shoe)s$": "$1",
    "(o)es$": "$1",
    "(bus)es$": "$1",
    "([m|l])ice$": "$1ouse",
    "(x|ch|ss|sh)es$": "$1",
    "(m)ovies$": "$1ovie",
    "(s)eries$": "$1eries",
    "([^aeiouy]|qu)ies$": "$1y",
    "([lr])ves$": "$1f",
    "(tive)s$": "$1",
    "(hive)s$": "$1",
    "(li|wi|kni)ves$": "$1fe",
    "(shea|loa|lea|thie)ves$": "$1f",
    "(^analy)ses$": "$1sis",
    "((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$": "$1$2sis",
    "([ti])a$": "$1um",
    "(n)ews$": "$1ews",
    "(h|bl)ouses$": "$1ouse",
    "(corpse)s$": "$1",
    "(us)es$": "$1",
    "s$": "",
  };
  const irregular: { [key: string]: string } = {
    "move": "moves",
    "foot": "feet",
    "goose": "geese",
    "sex": "sexes",
    "child": "children",
    "man": "men",
    "tooth": "teeth",
    "person": "people",
  };
  const uncountable: string[] = [
    "sheep",
    "fish",
    "deer",
    "moose",
    "series",
    "species",
    "money",
    "rice",
    "information",
    "equipment",
    "bison",
    "cod",
    "offspring",
    "pike",
    "salmon",
    "shrimp",
    "swine",
    "trout",
    "aircraft",
    "hovercraft",
    "spacecraft",
    "sugar",
    "tuna",
    "you",
    "wood",
  ];
  // save some time in the case that singular and plural are the same
  if (uncountable.indexOf(word.toLowerCase()) >= 0) {
    return word;
  }
  // check for irregular forms
  for (const w in irregular) {
    const pattern = new RegExp(`${irregular[w]}$`, "i");
    const replace = w;
    if (pattern.test(word)) {
      return word.replace(pattern, replace);
    }
  }
  // check for matches using regular expressions
  for (const reg in singular) {
    const pattern = new RegExp(reg, "i");
    if (pattern.test(word)) {
      return word.replace(pattern, singular[reg]);
    }
  }
  return word;
}

const KEY_SEPARATOR = "::";

/**
 * Takes any # of string/numbers and strings them together. Separates the
 * values with the separator. 
 * 
 * @param args Any string/number to be keyified
 */
export function keyify(...args: (string | number)[]) {
  return args.join(KEY_SEPARATOR);
}

/**
 * Takes in a keyified string to split up.
 * 
 * @param keyStr The string to split up into array of values.
 */
export function unkeyify(keyStr: string) {
  return keyStr.split(KEY_SEPARATOR);
}

// URL to default featured image (same as what's used in admin UI)
const DEFAULT_EVENT_FEATURED_IMAGE = "https://s3-us-west-2.amazonaws.com/shopify-experiences-app/image_upload_illustration.png";

/**
 * Finds the featured image URL with provided resources. If one cannot be found, defaults
 * to a default URL.
 */
export function findFeaturedImageUrl(images: EventAssetLinkDBO[], imageLinks: AssetDBO[]): string {
  let featuredId;

  for (let i = 0; i < images.length; i++) {
    const { id, featured } = images[i];
    if (featured) {
      featuredId = id.toString();
      break;
    }
  }

  if(!featuredId && images.length > 0) {
    featuredId = images[0].id;
  }

  for (let j = 0; j < imageLinks.length; j++) {
    if (imageLinks[j]._id.toString() === featuredId) {
      return imageLinks[j].url;
    }
  }

  return imageLinks.length > 0
    ? imageLinks[0].url
    : DEFAULT_EVENT_FEATURED_IMAGE;
}

/*
Takes images and imageLinks and returns a url of a featured of first image
 */
export const resolveImageUrl = (baseUrl: string, images: EventAssetLinkDBO[] = [], links: AssetDBO[] = []): string => {
  if (!images.length) {
    return `${baseUrl}/images/default_event_image.png`;
  }

  let featuredImage = images.find(i => i.featured);
  if(!featuredImage && images.length > 0) {
    featuredImage = images[0];
  }
  const featuredImageId = featuredImage ? featuredImage.id : 0;
  const link = links.find(i => i._id === featuredImageId);

  if (!link) {
    return `${baseUrl}/images/default_event_image.png`;
  }

  if (typeof link === "string") {
    return link || `${baseUrl}/images/default_event_image.png`;
  } else {
    return link.url || `${baseUrl}/images/default_event_image.png`;
  }
};

/*
  Finds cheapest variant price from an array of EventVariantDBO
 */
export const findCheapestVariantPrice = (variants: EventVariantDBO[] = []): [string, number] => {
  let result: [string, number];

  if (!variants.length) {
    return ["$0", 0];
  }

  const prices = variants.map(v => v.price);
  const price = Math.min(...prices);
  const priceStr = variants.length > 1 ? `Starts at $${price}` : `$${price}`;
  result = [priceStr, price];
  return result;
};

export const makeid = (length: number = 10): string => {
  var result           = "";
  var characters       = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/*
 Takes events response and extracts available timeslots to display on FullCalendar
 */
export const extractAndParseEvents = (events: EventAvailability[], storeUrl: string, baseUrl: string): {
  calendarEvents: CalendarEvent[];
  fullCalendarEvents: FullCalendarEvent[];
} => {

  const calendarEvents: CalendarEvent[] = [];
  const fullCalendarEvents: FullCalendarEvent[] = [];
  events
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .forEach(e => {
      const event = { title: e.name };
      e.availabilityProducts && e.availabilityProducts.forEach((p) => {
        p.availableTimeslots && p.availableTimeslots.forEach((ts: Availability, i: number) => {
          const pastEvent = isBefore(new Date(ts.startsAt), new Date());
          const startAtLocationTZ = moment(ts.startsAt).tz(ts.timezone);
          let calendarEvent = {
            ...event,
            event: {},
            uuid: makeid(),
            id: `${i}-${ts.productId}`,
            start: parseISO(ts.formattedTimeslot.isoWithoutTZ),
            customUrl: pastEvent ? "#" : `https://${storeUrl}/products/${e.handle}?select=${startAtLocationTZ.unix()}`,
            imageUrl: resolveImageUrl(baseUrl, e.images, e.imageLinks),
            paymentType: e.paymentType,
            price: findCheapestVariantPrice(e.variants),
            editable: false,
            startEditable: false,
            durationEditable: false,
            resourceEditable: false,
            pastEvent,
          };
          calendarEvents.push(calendarEvent);
          let fullCalendarEvent = { ...calendarEvent };
          fullCalendarEvents.push(fullCalendarEvent);
        });
      });
    });

  return {
    calendarEvents,
    fullCalendarEvents,
  };
};