/** @jsx h */
import { h, FunctionComponent, Fragment } from "preact";
import { Availability } from "../../../../typings/Availability";
import {
  EventDBO,
  OrderDetailsFormType,
  PaymentType,
} from "../../../../typings/Event";
import { AppDictionary } from "../../../../typings/Languages";
import { BookingFormPage } from "../../../Typings/BookingFormPage";
import { Button } from "../../Common/Button";
import {
  CustomerInfoForm,
  CustomerInfoFormProps,
} from "../../Common/CustomerInfoForm";
import { QuantitySelection } from "../../Common/QuantitySelection";
import { TextStyle } from "../../Common/TextStyle";
import "./OrderDetails.scss";
import {
  CustomForm,
  PerAttendeeTypeProps,
  PerOrderTypeProps,
} from "../../Common/CustomForm";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { CustomFormValue } from "../../../Typings/CustomForm";
import { useCustomerFormStore } from "../../../Hooks/useCustomerFormStore";
import { useCustomFormStore } from "../../../Hooks/useCustomFormStore";
import { useOrderDetailsStore } from "../../../Hooks/useOrderDetailsStore";
import { useQtySelectionStore } from "../../../Hooks/useQtySelectionStore";
import { useAddOrderToCart } from "../../../Hooks/useCreateOrder";
import { BackIcon } from "../../Common/WizardModal/BackIcon";
import {
  useWizardModalAction,
  WizardModalTitleBar,
} from "../../Common/WizardModal";
import moment from "moment-timezone";
import { getCart } from "../../../../Utils/api";
import { formatCurrency } from "../../../../Utils/helpers";

export type OrderDetailsProps = {
  /**Format for money in shop. */
  moneyFormat: string;
  /** This is the timeslot that the user has selected for the order */
  selectedTimeslot: Availability;
  /** This is the event for which the order is being created */
  event: EventDBO;
  /** Any errors that should be displayed on the form */
  error: string;
  /** Event custom labels set in admin experience interface */
  labels: Partial<AppDictionary>;
  /**Whether the view is being tested in storybook. */
  isStorybookTest?: boolean;
  /**Callback to handle back click in parent. */
  onBackClick: () => void;
};

export const OrderDetails: FunctionComponent<OrderDetailsProps> = ({
  event,
  moneyFormat,
  selectedTimeslot,
  labels,
  isStorybookTest,
  onBackClick,
}) => {
  const addOrderToCart = isStorybookTest ? () => {} : useAddOrderToCart();
  const setPage = isStorybookTest
    ? (value: number) => {}
    : useWizardModalAction().setPage;
  //Whether the save and continue button should be disabled.
  const isSaveContinueDisabled = useOrderDetailsStore(
    (state) => state.isSaveContinueDisabled,
  );

  const [itemsInCart, setItemsInCart] = useState<number | null>(null);

  //Populate qty selection variants on mount of component.
  useEffect(() => {
    !isStorybookTest
      ? getCart()
          .then((cart) => {
            const items = cart.items ? cart.items : [];
            let numOfProductInCart: number = 0;
            for (let i = 0; i < items.length; i++) {
              // check if the product and time slot are the same to add up the total number in cart so far
              if (
                items[i].product_id === event.shopifyProductId &&
                items[i].properties.When ===
                  selectedTimeslot.formattedTimeslot.when &&
                items[i].properties.Timeslot === selectedTimeslot.timeslotId
              ) {
                numOfProductInCart += items[i].quantity;
              }
            }

            let unitsLeft =
              selectedTimeslot.unitsLeft > numOfProductInCart
                ? selectedTimeslot.unitsLeft - numOfProductInCart
                : 0;
            setItemsInCart(numOfProductInCart);
            useQtySelectionStore((state) => state.setVariants)(
              event,
              unitsLeft,
            );
          })
          .catch((e) => {
            console.error(e);
          })
      : useQtySelectionStore((state) => state.setVariants)(
          event,
          selectedTimeslot.unitsLeft,
        );
  }, []);

  //Create callback for scrolling to edit button when created in view.
  const setEditRef = useCallback((element: HTMLDivElement) => {
    const editRef = useRef(element);

    if (editRef.current) {
      window.scrollTo({
        behavior: "smooth",
        top: editRef.current.offsetTop,
      });
    }
  }, []);

  //Get variants associated with event
  const variants = useQtySelectionStore((state) => state.variants);

  //Calculate minimum cost of the event.
  const minCost = Math.min(...event.variants.map((variant) => variant.price));

  /** Triggered on submission of a custom form */
  const handleSubmitCustomForm = (ev: Event) => {
    ev.preventDefault();
    if (event.paymentType === PaymentType.Prepay) {
      return addOrderToCart();
    }

    useOrderDetailsStore((state) => state.setPage)(
      BookingFormPage.SUBMISSION_LOADER,
    );
  };

  //Whether the merchant has provided a custom form for this experience.
  const hasCustomForm =
    event.customOrderDetails.formType !== OrderDetailsFormType.None &&
    event.customOrderDetails.fields &&
    Array.isArray(event.customOrderDetails.fields) &&
    event.customOrderDetails.fields.length > 0;

  //Custom form provided is per attendee.
  const hasPerAttendeeCustomForm =
    hasCustomForm &&
    event.customOrderDetails.formType === OrderDetailsFormType.PerAttendee;

  //Custom form provided is per order.
  const hasPerOrderCustomForm =
    hasCustomForm &&
    event.customOrderDetails.formType === OrderDetailsFormType.PerOrder;

  //Whether a custom form should be rendered in the view.
  const shouldRenderCustomForm = isSaveContinueDisabled && hasCustomForm;

  //Calculate current total of order.
  const variantTotal = Object.values(variants)
    .filter((variant) => variant.currentQty > 0)
    .map((variant) => variant.price * variant.currentQty)
    .reduce((total, value) => total + value, 0);

  //Populates custom form variants in store.
  const populateCustomFormVariants = () => {
    //Grab selected variants to render custom forms.
    const selectedVariants = useQtySelectionStore(
      (state) => state.variants,
    ).filter((variant) => variant.currentQty > 0);

    useCustomFormStore((state) => state.setCustomFormValues)(
      event,
      labels,
      selectedVariants,
    );
  };

  //On mount, check if we are in a prepay event, with a per order custom form.
  //If so, populate the custom form store with variants to show in view immediately.
  useEffect(() => {
    if (event.paymentType === PaymentType.Prepay && hasPerOrderCustomForm) {
      populateCustomFormVariants();
    }
  }, []);

  /*
   * If required by event type, render customer form.
   */
  const renderCustomerForm = (hasConfirmButton: boolean) => {
    //Update state of customer form on change.
    const handleCustomerFormChange = useCustomerFormStore(
      (state) => state.handleCustomerFormChange,
    );
    const customerData = useCustomerFormStore((state) => state.customerData);

    //Handle submission of form, and pass data in form to parent component.
    const handleFormSubmit = (e: Event) => {
      e.preventDefault();

      if (event.paymentType === PaymentType.Prepay) {
        return addOrderToCart();
      }

      useOrderDetailsStore((state) => state.setPage)(
        BookingFormPage.SUBMISSION_LOADER,
      );
    };

    const customerFormProps: CustomerInfoFormProps = {
      customerData,
      handleChange: handleCustomerFormChange,
      labels,
    };

    const formClassNames = ["OrderDetails__Input__Customer-Form"];

    const saveButtonVisibility = useOrderDetailsStore(
      (state) => state.saveButtonVisibility,
    );
    //If the save button is hidden, the customer form should be disabled.
    if (saveButtonVisibility === "hidden") {
      formClassNames.push("OrderDetails__Input__Customer-Form--disabled");
    }

    //Save/Confirm button is disabled if store requires it to be disabled, if a variant qty hasn't been
    //specified, or if the customer form hasn't been populated.
    const canConfirm =
      useQtySelectionStore((state) => state.canConfirmOrder)() &&
      useCustomerFormStore((state) => state.canConfirmOrder)();

    return (
      <form className={formClassNames.join(" ")} onSubmit={handleFormSubmit}>
        <div className="OrderDetails__Input__Customer-Form__Title">
          <TextStyle variant="display2" text="Customer info" />
        </div>

        <CustomerInfoForm
          {...customerFormProps}
          isCustomerInfoFormDisabled={saveButtonVisibility === "hidden"}
        />
        <div className="OrderDetails__Header-Rule" />
        {saveButtonVisibility !== "hidden" && (
          <div className="OrderDetails__Input__Customer-Form__Submit">
            {hasConfirmButton
              ? renderConfirmButton(!canConfirm)
              : renderSaveButton(!canConfirm)}
          </div>
        )}
      </form>
    );
  };

  /** Renders a custom order form as set up by the merchant
   * This form is either per attendee or per order
   */
  const renderCustomOrderDetails = () => {
    const { customOrderDetails } = event;

    let formValues: CustomFormValue[] = useCustomFormStore(
      (state) => state.customFormValues,
    );

    //Whether the user is allowed to confirm order by populating
    //all required custom form fields.
    const canConfirm =
      useCustomFormStore((state) => state.customFormValues).every((form) =>
        form.fields.every(
          (field) =>
            !field.isRequired || (field.isRequired && field.value !== ""),
        ),
      ) && useQtySelectionStore((state) => state.canConfirmOrder)();

    //Render per attendee form.
    if (customOrderDetails.formType === OrderDetailsFormType.PerAttendee) {
      //Handle removal of variant from view.
      const handleRemoveVariant = () => {
        const variantName = useCustomFormStore(
          (state) => state.removeVariantName,
        );

        //Remove selected variant from quantity selection store.
        useQtySelectionStore((state) => state.handleRemoveVariant)(variantName);
        //Remove variant from custom form store.
        useCustomFormStore((state) => state.removeVariant)();
        //Close modal.
        useCustomFormStore((state) => state.setIsModalOpen)(false, {
          idx: 0,
          name: "",
        });
      };

      //Create per attendee form details object, used to populate
      //all fields for a per attendee custom form.
      const perAttendeeFormType: PerAttendeeTypeProps = {
        //Form values for each variant selected in custom form.
        formValues,
        minLimit: useQtySelectionStore((state) => state.minLimit),
        //Total fields per variant selected, to be separated by header rule
        //in form.
        removeVariantModal: {
          isOpen: useCustomFormStore((state) => state.isModalOpen),
          variantToRemove: useCustomFormStore(
            (state) => state.removeVariantName,
          ),
          setIsRemoveVariantModalOpen: useCustomFormStore(
            (state) => state.setIsModalOpen,
          ),
          removeVariant: handleRemoveVariant,
        },
      };

      //Render the custom form for per attendee,
      //renders on how many tickets are bought
      return (
        <div className="CustomOrder">
          <form id="CustomOrder-Details" onSubmit={handleSubmitCustomForm}>
            <CustomForm
              labels={labels}
              key={`CustomForm`}
              formType={perAttendeeFormType}
              handleChange={useCustomFormStore(
                (state) => state.handleCustomFormChange,
              )}
            />
            <div className="OrderDetails__Button">
              {renderConfirmButton(!canConfirm)}
            </div>
          </form>
        </div>
      );
    } else {
      //Create data structure for per order form.
      const perOrderFormType: PerOrderTypeProps = {
        formValues,
        formDescription: customOrderDetails.formDescription,
        formTitle: customOrderDetails.formTitle,
      };

      //The custom form is per order, render only once
      return (
        <div className="CustomOrder">
          <form id="CustomOrder-Details" onSubmit={handleSubmitCustomForm}>
            <CustomForm
              labels={labels}
              key={"CustomForm"}
              formType={perOrderFormType}
              handleChange={useCustomFormStore(
                (state) => state.handleCustomFormChange,
              )}
            />
            <div className="OrderDetails__Button">
              {renderConfirmButton(!canConfirm)}
            </div>
          </form>
        </div>
      );
    }
  };

  /**Renders the quantity selection component in the view. */
  const renderQtySelection = () => (
    <div className="OrderDetails__Input__Quantity-Selection">
      <QuantitySelection
        itemsInCart={itemsInCart}
        {...useQtySelectionStore()}
      />
    </div>
  );

  //Renders confirm button in view.
  const renderConfirmButton = (isDisabled: boolean) => {
    const handleClick = () => {
      if (event.paymentType === PaymentType.Prepay) {
        return addOrderToCart();
      }

      useOrderDetailsStore((state) => state.setPage)(
        BookingFormPage.SUBMISSION_LOADER,
      );
    };

    return (
      <Button
        text={labels.confirmReservationButtonLabel}
        variant="contained"
        fullWidth
        color="primary"
        onClick={handleClick}
        disabled={isDisabled}
        type="submit"
      />
    );
  };

  //Renders save button in view.
  const renderSaveButton = (isDisabled: boolean) => {
    const handleClick = () => {
      useOrderDetailsStore((state) => state.setIsSaveContinueDisabled)(true);
      useOrderDetailsStore((state) => state.setSaveButtonVisibility)("hidden");
      useQtySelectionStore((state) => state.disableVariants)();
      populateCustomFormVariants();
    };

    return (
      <Button
        text={"Save & continue"}
        variant="contained"
        fullWidth
        color="primary"
        onClick={handleClick}
        disabled={isDisabled}
      />
    );
  };

  //Render edit button in view.
  const renderEditButton = () => {
    const handleClick = () => {
      useOrderDetailsStore((state) => state.setIsSaveContinueDisabled)(false);
      useOrderDetailsStore((state) => state.setSaveButtonVisibility)("visible");
      useQtySelectionStore((state) => state.enableVariants)();
    };
    return (
      <div className="OrderDetails__Button" ref={setEditRef}>
        <Button
          text="Edit"
          variant="contained"
          fullWidth
          color="primary"
          onClick={handleClick}
        />
      </div>
    );
  };

  //Renders pre-pay flow.
  const renderPrePayFlow = () => {
    const canQtySelectionConfirm = useQtySelectionStore(
      (state) => state.canConfirmOrder,
    )();
    const canCustomerFormConfirm = useCustomerFormStore(
      (state) => state.canConfirmOrder,
    )();
    return (
      <Fragment>
        {/**Always render the quantity selection component. */}
        {renderQtySelection()}
        {/** If no custom form is provided, render confirm button
         * to go to checkout after variants are selected.
         */}
        {!hasCustomForm && renderConfirmButton(!canQtySelectionConfirm)}
        {/** If per order custom form is provided, render it
         * directly beneath quantity selection to go to checkout afterwards.
         */}
        {hasPerOrderCustomForm && renderCustomOrderDetails()}

        {/* If custom per attendee form, render save button to capture variant quantities,
        then render custom per attendee form.
         */}
        {hasPerAttendeeCustomForm &&
          !shouldRenderCustomForm &&
          renderSaveButton(!canQtySelectionConfirm && !canCustomerFormConfirm)}
        {hasPerAttendeeCustomForm && shouldRenderCustomForm && (
          <Fragment>
            {renderEditButton()}
            {renderCustomOrderDetails()}
          </Fragment>
        )}
      </Fragment>
    );
  };
  //Renders non-pre-pay flow.
  const renderNonPrePayFlow = () => {
    return (
      <Fragment>
        {/**Always render the quantity selection component
         * and customer form.
         */}
        {renderQtySelection()}
        {/**Render confirm button if no custom form is provided. */}
        {renderCustomerForm(!hasCustomForm)}

        {/* If custom form is provided, render custom form
        after variant quantities and customer details are provided.
         */}
        {shouldRenderCustomForm && (
          <Fragment>
            {renderEditButton()}
            {renderCustomOrderDetails()}
          </Fragment>
        )}
      </Fragment>
    );
  };

  //Handles clicking back in wizard modal.
  const handleBackClick = () => {
    onBackClick();
    setPage(BookingFormPage.TIMESLOT_SELECTION);
  };

  //Format start and end time of selected event.
  const { startsAt, timezone, endsAt } = selectedTimeslot;
  const startTime = moment(startsAt).tz(timezone).format("h:mma");
  const endTime = moment(endsAt).tz(timezone).format("h:mma");

  //Format day of week and month/day of event.
  const dayOfWeek = moment(startsAt).format("dddd");
  const monthAndDay = moment(startsAt).format("MMMM Do");

  //Determine number of units left to select for each variant.
  const unitsLeft = useQtySelectionStore((state) => state.unitsLeft);

  /** Main render method. */
  return (
    <Fragment>
      <WizardModalTitleBar title="Select quantity" onBack={handleBackClick} />
      <div className="OrderDetails">
        <div className="OrderDetails__Summary">
          <div className="OrderDetails__Summary__Back">
            <Button
              variant="text"
              text={<BackIcon />}
              onClick={handleBackClick}
            />
          </div>
          <img
            className="OrderDetails__Summary__Image"
            src={event.featuredImageUrl}
          />

          <div className="OrderDetails__Summary__Title">
            <TextStyle text={event.name} variant="display1" />
          </div>

          <div className="OrderDetails__Header-Rule" />
          <TextStyle variant="display2" text={`${dayOfWeek}, ${monthAndDay}`} />

          <div>
            <div className="OrderDetails__Summary__Time-Slot">
              <TextStyle variant="body1" text={`${startTime} - ${endTime}`} />
              <TextStyle variant="body1" text="|" />
              <TextStyle
                variant="body3"
                text={
                  unitsLeft !== 1
                    ? `${unitsLeft} spots left`
                    : `${unitsLeft} spot left`
                }
              />
            </div>
          </div>
          <div>
            <TextStyle
              variant="body2"
              text={`From ${formatCurrency(moneyFormat, minCost)} `}
            />
            <TextStyle variant="body1" text={"/ person"} />
          </div>
          <div className="OrderDetails__Header-Rule" />
          {isSaveContinueDisabled && (
            <div className="OrderDetails__Overview">
              {Object.values(variants)
                .filter((variant) => variant.currentQty > 0)
                .map((variant) => (
                  <div
                    className="OrderDetails__Overview__Values"
                    key={`VariantTotal_${variant.name}_${variant.price}`}
                  >
                    <TextStyle variant="body1" text={variant.name} />
                    <TextStyle
                      variant="body1"
                      text={`${variant.currentQty}x`}
                    />
                    <div className="OrderDetails__Overview__Values__Total">
                      <TextStyle
                        variant="body1"
                        text={`${formatCurrency(
                          moneyFormat,
                          variant.currentQty * variant.price,
                        )}`}
                      />
                    </div>
                  </div>
                ))}
              <div className="OrderDetails__Overview__Total">
                <TextStyle variant="body2" text="Total" />
                <TextStyle
                  variant="body2"
                  text={`${formatCurrency(moneyFormat, variantTotal)}`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="OrderDetails__Input">
          {/**
           * Flow for rendering forms on page by default.
           * Review .png diagram file for state diagram of flow.
           */}
          {event.paymentType === PaymentType.Prepay
            ? renderPrePayFlow()
            : renderNonPrePayFlow()}
        </div>
      </div>
    </Fragment>
  );
};
