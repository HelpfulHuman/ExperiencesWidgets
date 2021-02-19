import { fromUnixTime } from "date-fns/fp";
import React from "preact/compat";
import moment from "moment-timezone";
import { Component, h } from "../../../../node_modules/preact";
import { getQueryVariable } from "../../../SharedComponents/DatePicker/Utils";
import { Loading } from "../../../SharedComponents/loading/Loading";
import { Modal } from "../../../SharedComponents/Modal/Modal";
import { Availability } from "../../../typings/Availability";
import { OrderInputData } from "../../../typings/CreateOrderInput";
import { CustomerInputData } from "../../../typings/CustomerInput";
import { EventDBO, EventVariantDBO, PaymentType } from "../../../typings/Event";
import { FirstAvailability } from "../../../typings/FirstAvailability";
import { FormFieldValueInput } from "../../../typings/FormFieldValueInput";
import { AppDictionary, defineLanguageDictionary, LanguageCodes } from "../../../typings/Languages";
import { OrderLineItemInputData } from "../../../typings/OrderLineItemInput";
import { ShopDetails } from "../../../typings/ShopDetails";
import {
  addToCart,
  AddToCartArgs,
  createOrder,
  CreateOrderArgs,
  getCustomScripts,
  getEvent,
  getEventCustomLabels,
  getFirstAvailability,
  getShopDetails,
} from "../../../Utils/api";
import { getFirstDayAvailabilities, getTimeslotsByDate } from "../../../Utils/helpers";
import { unionAvailability } from "../../../Utils/mergeAvailability";
import { ModalStateEnum } from "../../types";
import { NotFound } from "../404/NotFound";
import { AvailabilityPage } from "../Availability/AvailabilityPage";
import { ConfirmPage } from "../Confirmation/ConfirmPage";
import { OrderDetailsPage } from "../OrderDetails/OrderDetailsPage";
import "./CalendarWidgetMain.scss";
import { FormField } from "../../../typings/CustomForm";
import { Weekdays } from "../../../Utils/Constants";

enum CUSTOM_FIELDS_TO_SKIP {
  firstName = "First Name",
  lastName = "Last Name",
  email = "Email",
}

/** 32 days expressed in seconds, used to fetch new availability */
const TIMESPAN_IN_SECONDS = 32 * 24 * 60 * 60;

/** This is the app initial state, to be set upon loading and upon closing of the modal */
const INITIAL_STATE: ICalendarWidgetMainState = {
  showModal: false,
  modalState: ModalStateEnum.Availability,
  loading: false,
  event: null,
  error: "",
  shop: {
    name: "",
    moneyFormat: "",
    timezone: "",
  },
  now: new Date(),
  availability: null,
  firstAvailable: null,
  fetchedMonths: {},
  selectedDate: null,
  selectedTimeslot: null,
  quantitiesMap: {},
  lineItems: [],
  customerInfo: null,
  labels: {},
  weekStartsOn: Weekdays.Monday,
};

export type VariantInput = {
  id: number;
  name: string;
  title: string;
  price: number;
};

export interface ICalendarWidgetMainProps {
  /** The base URL */
  baseUrl: string;
  /** Optional storefront access token, which if present will enable the Shopify buy SDK */
  storefrontAccessToken?: string;
  /** The shopify url of this shop */
  shopUrl: string;
  /** The shopify ID for this product (event) */
  shopifyProductId: number;
  /** The experience's language code */
  languageCode: string;
}

export interface ICalendarWidgetMainState {
  /** Determines whether the modal is open at any given time */
  showModal: boolean;
  /** Determines the view displayed within the modal when open */
  modalState: ModalStateEnum;
  /** Used to display a loading message when true */
  loading: boolean;
  /** The event for which the user is booking spots */
  event: EventDBO | null;
  /** Stores an error message to display if necessary */
  error: string;
  /** The name, money format, and time zone for the shop */
  shop: ShopDetails;
  /** Stores the current date */
  now: Date;
  /** The first date with available timeslots for the given event */
  firstAvailable: Date | null;
  /** Object containing all of the availability data that has been fetched for the event */
  availability: FirstAvailability | null;
  /** The date the user has selected - the date picker only displays timeslots when this is not null */
  selectedDate: Date | null;
  /** The timeslot the user has selected - the date picker only displays variants when this is not null */
  selectedTimeslot: Availability | null;
  /** Tracks months for which availability has been fetched to prevent overfetching */
  fetchedMonths: { [year: number]: number[] };
  /** An object containing the number of spots a user has selected for each event variant */
  quantitiesMap: { [variantId: number]: number };
  /** Array of line item objects, used to create the order upon confirmation */
  lineItems: OrderLineItemInputData[];
  /** Name and email address of the purchaser collected when booking for a non-prepay event */
  customerInfo: CustomerInputData | null;
  /** Event custom labels set in admin experience interface */
  labels: Partial<AppDictionary>;
  /** Calendar start day as set in shop's Admin -> Settings panel */
  weekStartsOn: Weekdays;
}

/** This is the root component of the app, it stores all of the state as the user completes their order */
export class CalendarWidgetMain extends Component<
  ICalendarWidgetMainProps,
  ICalendarWidgetMainState
> {
  constructor(props: ICalendarWidgetMainProps) {
    super(props);

    this.state = INITIAL_STATE;
  }

  /** Fetch shop, event, and availability data and set the state */
  async componentDidMount() {
    this.setLoading();
    const { baseUrl, shopUrl, shopifyProductId, languageCode } = this.props;

    // select day and timeslot when coming from aggregate view (or elsewhere)
    const date = getQueryVariable("select");
    const ms = +date;
    const selectedDate = isNaN(ms) ? new Date() : fromUnixTime(ms);
    const availabilityRangeEnd = (Date.now() + ms * 1000) > (Date.now() + TIMESPAN_IN_SECONDS * 1000) ? 
      (selectedDate.getTime() / 1000) + (TIMESPAN_IN_SECONDS * 2) : 
      TIMESPAN_IN_SECONDS * 2;

    try {
      // fetch everything in parallel to improve loading time
      const [shop, labels, event, availability, settings] = await Promise.all([
        // fetch the shop
        getShopDetails({ baseUrl, shopId: shopUrl }),

        // fetch custom event labels
        getEventCustomLabels({ baseUrl, shopId: shopUrl, shopifyProductId }),

        // fetch the event
        getEvent({ baseUrl, shopId: shopUrl, shopifyProductId }),

        // get availability for the current month and the next
        this.fetchRangeOfAvailability(
          this.state.now,
          availabilityRangeEnd,
        ),

        getCustomScripts({ baseUrl, shopId: shopUrl }),
      ]);

      //add next month to the fetched month state
      this.addFetchedMonth(
        this.state.now.getMonth() + 1,
        this.state.now.getFullYear(),
      );
      //capture the first day with availability
      const firstAvailable = getFirstDayAvailabilities(availability);
      
      const labelsResolved = labels && labels.data ? 
        { ...defineLanguageDictionary(languageCode as LanguageCodes), ...labels.data } : 
        defineLanguageDictionary(languageCode as LanguageCodes);

      const selectedDateTimeslots = date ? getTimeslotsByDate(availability, selectedDate) : [];
      const selectedTimeslot = selectedDateTimeslots.find(ts => (new Date(ts.startsAt)).getTime() === +date * 1000) || null;

      const weekStartsOn = settings.weekStartsOn !== undefined ?
        settings.weekStartsOn as Weekdays :
        Weekdays.Monday;

      //set state with the fetched values
      this.setState({
        shop,
        event: event && event.data,
        labels: labelsResolved,
        error: "",
        availability,
        firstAvailable: firstAvailable[0] && new Date(firstAvailable[0].startsAt),
        loading: false,
        selectedDate,
        showModal: !!date,
        weekStartsOn,
      }, () => {
        if (selectedTimeslot) {
          this.handleSelectTimeSlot(selectedTimeslot);
        }
      });
    } catch (err) {
      this.setState({
        error: err,
        loading: false,
      });
    }
  }

  /** Add a new month to the fetchedMonths state object */
  private addFetchedMonth(month: number, year: number) {
    const { fetchedMonths } = this.state;
    let newYear = [];
    if (!fetchedMonths[year]) {
      newYear = [month];
    } else {
      newYear = fetchedMonths[year].concat([month]);
    }

    this.setState({
      fetchedMonths: {
        ...this.state.fetchedMonths,
        [year]: newYear,
      },
    });
  }

  /** Determine if a given month/year has previously been fetched */
  private monthWasFetched(month: number, year: number) {
    const { fetchedMonths } = this.state;

    if (fetchedMonths[year] && fetchedMonths[year].includes(month)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Fetchs a chunk of availability based on the currently set timespan in seconds
   */
  fetchRangeOfAvailability = async (
    date: Date,
    timespanInSeconds = TIMESPAN_IN_SECONDS,
  ) => {
    const { baseUrl, shopUrl, shopifyProductId } = this.props;
    return getFirstAvailability({
      baseUrl,
      shopId: shopUrl,
      productId: shopifyProductId,
      startingFrom: date,
      timespanInSeconds,
    });
  }

  /**
   * On navigation to a new month or year, this method is called to fetch more availability and add it to the current availability in state.
   * Note: the date passed in is usually the first of the given month.
   */
  setNewAvailability = async (date: Date) => {
    //pull the month and year from the date passed in
    const month = date.getMonth();
    const year = date.getFullYear();

    //check to see whether the month has already been fetched. if not, fetch it.
    if (!this.monthWasFetched(month, year)) {
      let fetchedAvailability: FirstAvailability = {};

      //if the current date is mid-month, only fetch beginning from the current date
      if (this.state.now.getTime() >= date.getTime()) {
        fetchedAvailability = await this.fetchRangeOfAvailability(this.state.now);
        //else fetch from the date passed in (i.e. the first of the month)
      } else {
        fetchedAvailability = await this.fetchRangeOfAvailability(date);
      }

      //merge the fetched availability with the previously fetched availability in state
      const newAvailability = unionAvailability(
        this.state.availability,
        fetchedAvailability,
      );

      this.setState({
        availability: newAvailability,
      });

      //remember that this month has already been fetched
      this.addFetchedMonth(month, year);
    }
  }

  /** Sets the top-level loading state to true */
  setLoading = () => {
    //calls out to api
    this.setState({ loading: true, error: "" });
  }

  /** Sets the showModal state slice to true, displaying the modal */
  openModal = () => {
    this.setState({
      showModal: true,
    });
  }

  /** Sets the showModal state slice to false, and returns the component to its initial state */
  closeModal = () => {
    this.setState({
      showModal: false,
      modalState: ModalStateEnum.Availability,
      loading: false,
      error: "",
      now: new Date(),
      selectedDate: new Date(),
      selectedTimeslot: null,
      quantitiesMap: {},
      lineItems: [],
      customerInfo: null,
    });
  }

  /** Pass in a valid modal state to dictate the modal's current content */
  navigateTo = (modalState: ModalStateEnum) => {
    this.setState({
      modalState,
    });
  }
  /** On click fires the first available event */
  handleSelectFirstAvailability = () => {
    this.handleDateSelect(this.state.firstAvailable);
  }

  /**
   * Redirects client to checkout URL (ie: cart page if within realm of Shopify). Takes
   * in optional url (ie: when using Buy SDK) to manually set checkout URL.
   */
  private handleNavigateToCheckout = (url?: string) => {
    window.location.href = url || "/cart";
  }

  /** Sets up the order and either sends confirmation email OR adds the order to the cart */
  private handleConfirmOrder = async () => {
    //set loading to true
    this.setLoading();
    this.navigateTo(ModalStateEnum.ConfirmPage);

    const paymentType = this.state.event.paymentType;

    //if the event payment type is prepay, order will be added to cart
    if (paymentType === PaymentType.Prepay) {
      const { event, quantitiesMap, selectedTimeslot } = this.state;
      const { name: eventName, variants } = event;

      //set up arguments for adding to cart
      const shopifyVariants: VariantInput[] = [];

      // Manually loop to populate formatted shopify variants & avoid fat arrow
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        shopifyVariants.push({
          id: v.shopifyVariantId,
          name: `${eventName} - ${v.name}`,
          title: v.name,
          price: v.price,
        });
      }

      // Define order object
      const order: AddToCartArgs = {
        variants: shopifyVariants,
        timeslot: selectedTimeslot,
        quantities: quantitiesMap,
        shopUrl: this.props.shopUrl,
      };

      //add the order to the cart
      try {
        await addToCart(order, {
          event,
          storefrontAccessToken: this.props.storefrontAccessToken,
          onCartAdd: this.handleNavigateToCheckout,
        });
      } catch (e) {
        this.setState({ loading: false });
        console.error(e);
      }
    // The order is *NOT* prepay, so it should be created in our system
    } else {
      const { customerInfo, lineItems } = this.state;
      const { baseUrl, shopUrl } = this.props;

      //set up the order creation arguments
      const order: OrderInputData = {
        customer: customerInfo,
        lineItems,
      };

      const orderArgs: CreateOrderArgs = {
        order,
        baseUrl,
        shopId: shopUrl,
      };

      //create the order
      try {
        await createOrder(orderArgs);
      } catch(error) {
        this.setState({
          error: "Invalid email address", 
          modalState: ModalStateEnum.OrderDetails,
          customerInfo: null,
          lineItems: [],
        });
      }

      //reset loading to false and navigate to the confirmation page
      this.setState({ loading: false });
    }
  }

  /** makes sure to set state to selected date */
  handleDateSelect = (date: Date) => {
    this.setState({
      selectedDate: date,
      selectedTimeslot: null,
    });
  }

  /** Called when the user selects a timeslot
   * Stores the timeslot in state and sets the initial quantities per variant to zero
   * */
  handleSelectTimeSlot = (timeslot: Availability) => {
    //Set up or reset the quantities to be zero for each variant
    const { variants } = this.state.event;
    let quantities: { [variantId: number]: number } = {};
    variants.forEach(function (variant) {
      quantities[variant.shopifyVariantId] = 0;
    });
    //Set the state with the new timeslot and the zero quantities
    this.setState({
      selectedTimeslot: timeslot,
      quantitiesMap: quantities,
    });
  }

  /** Triggered when the user increments or decrements the quantity for a single variant */
  handleChangeQuantity = (dir: number, variantId: number) => {
    let newQuantities = this.state.quantitiesMap;
    newQuantities[variantId] += dir;
    this.setState({ quantitiesMap: newQuantities });
  }

  /** Triggered upon clicking the back button displayed on the date picker when a timeslot is selected
   * Deselects the timeslot by setting the timeslot to null in state
   */
  handleClickBack = () => {
    this.setState({
      selectedTimeslot: null,
    });
  }
  /** Triggered upon clicking the back button in the conformation view will display the selected time slot */
  handleConfirmationClickBack = () => {
    this.navigateTo(ModalStateEnum.Availability);
  }

  /** Creates an order line item  */
  handleAddLineItem = (
    variant: EventVariantDBO,
    customFormFieldValues?: FormFieldValueInput[],
    index?: number,
  ) => {
    const { event, selectedTimeslot } = this.state;
    const firstName: Partial<FormField> = customFormFieldValues ?
      customFormFieldValues.find(({ label }) => label === CUSTOM_FIELDS_TO_SKIP.firstName) : {};
    const lastName: Partial<FormField> = customFormFieldValues ?
      customFormFieldValues.find(({ label }) => label === CUSTOM_FIELDS_TO_SKIP.lastName) : {};
    const name = ((firstName && firstName.value) || (lastName && lastName.value)) ?
      `${firstName ? firstName.value : ""} ${lastName ? lastName.value : ""}` : "N/A";
    const email: Partial<FormField> = customFormFieldValues ?
      customFormFieldValues.find(({ label }) => label === CUSTOM_FIELDS_TO_SKIP.email) : {};

    // remove attendee info from custom form fields
    const filteredCustomFormFieldValues = customFormFieldValues ? customFormFieldValues.filter(({ label }) =>
      !Object.values(CUSTOM_FIELDS_TO_SKIP).includes(label)) : undefined;

    const eventId = event._id.toString();

    const newLineItem = {
      eventId,
      eventVariantName: variant.name,
      productId: event.shopifyProductId,
      productVariantId: variant.shopifyVariantId,
      timeslotId: selectedTimeslot.timeslotId,
      startsAt: selectedTimeslot.startsAt,
      endsAt: selectedTimeslot.endsAt,
      timezone: selectedTimeslot.timezone,
      quantity: 1,
      customOrderDetailsValues: filteredCustomFormFieldValues,
      attendee: {
        // @ts-ignore
        checkedInAt: null,
        info: {
          name,
          email: email ? email.value : "N/A",
        },
      },
    };

    let newLineItems = this.state.lineItems;
    if (index !== undefined && typeof index === "number") {
      // if this index exists, update it with the newer version
      newLineItems[index] = newLineItem;
    } else {
      // otherwise, add it
      newLineItems.push(newLineItem);
    }
    
    return new Promise((resolve) => this.setState({
      lineItems: newLineItems,
    }, resolve));
  }

  /** If an event is not prepay, this is triggered when the user enters their name and email
   * This happens in the OrderDetailsPage view
   */
  handleAddCustomerInfo = (customer: CustomerInputData) => {
    return new Promise((resolve) => this.setState({
      customerInfo: customer,
    }, resolve));
  }

  /** This is triggered when the user confirms their desired date, timeslot, and variant quantities */
  handleConfirmVariants = () => {
    //TODO: add state validation

    const { event } = this.state;

    // If the event has a custom form, redirect to the OrderDetailsPage view
    if (
      event.customOrderDetails.fields &&
      Array.isArray(event.customOrderDetails.fields) &&
      event.customOrderDetails.fields.length
    ) {
      this.navigateTo(ModalStateEnum.OrderDetails);
      // If the event is not prepay, also redirect to the OrderDetailsPage view
    } else if (event.paymentType !== PaymentType.Prepay) {
      this.navigateTo(ModalStateEnum.OrderDetails);
      // If neither of the above cases apply, simply add the order to the user's cart
    } else {
      this.handleConfirmOrder();
    }
  }

  /** Determine content of the loading view */
  renderLoading = () => {
    const { lineItems } = this.state;
    let date = moment();
    if (Array.isArray(lineItems) && lineItems[0]) {
      const { startsAt, timezone } = lineItems[0];
      date = moment(startsAt).tz(timezone);
    }

    return (
      <div className="Loading-Container">
        <Loading>
          {(this.state.modalState === ModalStateEnum.ConfirmPage && Array.isArray(lineItems) && lineItems[0]) ? 
          (
            <React.Fragment>
              <span className="Loading-ReserveSpot">
                Reserving {lineItems.length} spot{lineItems.length > 1 && "s"} for{" "}
              </span>
              <span className="Loading-ReserveDate">
                {date.format("dddd MMMM D, YYYY")} at{" "}
                {date.format("h:mmA")}
              </span>
            </React.Fragment>
          ) : (
            <span className="Loading-ReserveDate">Loading...</span>
          )}
        </Loading>
      </div>
    );
  }

  /** Switch case statement to render the appropriate view in the modal */
  renderModalContent = () => {
    if (this.state.loading) {
      return this.renderLoading();
    }
    switch (this.state.modalState) {
      case ModalStateEnum.Availability:
        return (
          // This view is the date picker where the user can select a date, timeslot, and set variant quantities
          <AvailabilityPage
            labels={this.state.labels}
            locale={this.props.languageCode}
            availability={this.state.availability}
            moneyFormat={this.state.shop && this.state.shop.moneyFormat}
            event={this.state.event}
            navigateTo={this.navigateTo}
            setNewAvailability={this.setNewAvailability}
            selectedDate={this.state.selectedDate}
            selectedTimeslot={this.state.selectedTimeslot}
            onClickBack={this.handleClickBack}
            onDateSelect={this.handleDateSelect}
            onSelectTimeslot={this.handleSelectTimeSlot}
            quantities={this.state.quantitiesMap}
            onChangeQuantity={this.handleChangeQuantity}
            onConfirm={this.handleConfirmVariants}
            closeModal={this.closeModal}
            confirmOrder={this.handleConfirmOrder}
            onSelectFirstAvailability={this.handleSelectFirstAvailability}
            onConfirmSelection={this.handleConfirmVariants}
            weekStartsOn={this.state.weekStartsOn}
          />
        );
      case ModalStateEnum.OrderDetails:
        return (
          // This view renders forms to collect user and attendee data if applicable
          <OrderDetailsPage
            lineItems={this.state.lineItems}
            labels={this.state.labels}
            quantities={this.state.quantitiesMap}
            selectedDate={this.state.selectedDate}
            selectedTimeslot={this.state.selectedTimeslot}
            event={this.state.event}
            error={this.state.error}
            onAddCustomFormValues={this.handleAddLineItem}
            onAddCustomerInfo={this.handleAddCustomerInfo}
            customerInfo={this.state.customerInfo}
            onConfirmOrder={this.handleConfirmOrder}
            onClickBack={this.handleClickBack}
            closeModal={this.closeModal}
          />
        );
      case ModalStateEnum.ConfirmPage:
        return (
          <ConfirmPage
            labels={this.state.labels}
            closeModal={this.closeModal}
            customerInfo={this.state.customerInfo}
          />
        );
      default:
        <NotFound navigateTo={this.navigateTo} />;
    }
  }

  /** Main render method - renders the display button, and the modal if open */
  public render() {
    const { event, firstAvailable } = this.state;
    const { bookButtonLabel, reserveButtonLabel, noUpcomingTimeSlotsLabel } = this.state.labels;
    const resolvedBookLabel = event && event.paymentType === PaymentType.Prepay ? bookButtonLabel : reserveButtonLabel;

    // TODO: should we keep Reserve or use Book as it is in admin panel?
    const label = this.state.loading ? "Loading..." : resolvedBookLabel;
    return (
      <div>
        <div className="CalendarWidgetMain">
          {!!firstAvailable ? (<button
            onClick={this.openModal}
            className={`CalendarWidgetMain-OpenModalButton ${
              this.state.loading ? "-isLoading" : ""
            }`}
          >
            {label}
          </button>) : 
          <p>{noUpcomingTimeSlotsLabel}</p>}
          <Modal
            orderDetails={this.state.modalState}
            showModal={this.state.showModal}
            closeModal={this.closeModal}
          >
            {this.renderModalContent()}
          </Modal>
        </div>
      </div>
    );
  }
}
