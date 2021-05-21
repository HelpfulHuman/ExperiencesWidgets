/** @jsx h */
import { h, FunctionComponent } from "preact";
import { BookingFormPage } from "../Typings/BookingFormPage";
import { WizardModal } from "./Common/WizardModal";
import { TimeslotSelection } from "./Views/TimeslotSelection";
import { OrderDetails } from "./Views/OrderDetails";
import { SubmissionLoader } from "./Views/SubmissionLoader";
import { Confirmation } from "./Views/Confirmation";
import { WidgetDataProvider } from "./WidgetDataProvider";
import { useEventStore } from "../Hooks/useEventStore";
import { useTimeslotStore } from "../Hooks/useTimeslotStore";
import { getEventCustomLabels, getShopDetails } from "../../Utils/api";
import { useEffect, useState } from "preact/hooks";
import {
  AppDictionary,
  defineLanguageDictionary,
  LanguageCodes,
} from "../../typings/Languages";
import {
  CustomerFormStore,
  useCustomerFormStore,
} from "../Hooks/useCustomerFormStore";
import {
  CustomFormStore,
  useCustomFormStore,
  OrderDetailsStore,
  useOrderDetailsStore,
  QuantitySelectionStore,
  useQtySelectionStore,
} from "../Hooks";
import { useConnectActivators } from "../Hooks/useConnectActivators";

export type AppProps = {
  baseUrl: string;
  languageCode: string;
  shopUrl: string;
  shopifyProductId: number;
  autoOpen?: number;
};

export const App: FunctionComponent<AppProps> = ({
  baseUrl,
  shopUrl,
  shopifyProductId,
  languageCode,
  autoOpen,
}) => {
  //Proxied version of app is requested, which is automatically open on mount.
  const isOpenOnMount = autoOpen === 1;

  const { open, setOpen } = useConnectActivators();

  const [moneyFormat, setMoneyFormat] = useState("${{amount}}");
  const [initialCustomerFormStore] = useState<CustomerFormStore>(
    useCustomerFormStore.getState(),
  );
  const [initialCustomFormStore] = useState<CustomFormStore>(
    useCustomFormStore.getState(),
  );
  const [initialOrderDetailsStore] = useState<OrderDetailsStore>(
    useOrderDetailsStore.getState(),
  );
  const [initialQtySelectionStore] = useState<QuantitySelectionStore>(
    useQtySelectionStore.getState(),
  );

  const resetOrderDetailsStores = () => {
    useCustomerFormStore.setState(initialCustomerFormStore, true);
    useCustomFormStore.setState(initialCustomFormStore, true);
    useOrderDetailsStore.setState(initialOrderDetailsStore, true);
    useQtySelectionStore.setState(initialQtySelectionStore, true);
  };

  //Updates money format on mount.
  useEffect(() => {
    try {
      const updateMoneyFormat = async () => {
        const shop = await getShopDetails({ baseUrl, shopId: shopUrl });

        setMoneyFormat(shop.moneyFormat);
      };

      updateMoneyFormat();
    } catch (error) {
      console.error(error);
    }
  }, []);

  //Reset store data on unmount
  useEffect(() => {
    return resetOrderDetailsStores;
  }, []);

  const event = useEventStore((state) => state.event);
  const selectedTimeslot = useTimeslotStore((state) => state.selectedTimeslot);
  const [labels, setLabels] = useState<Partial<AppDictionary>>({});

  //Fetch labels associated with event on mount.
  useEffect(() => {
    async function fetchLabels() {
      const labelResponse = await getEventCustomLabels({
        baseUrl,
        shopId: shopUrl,
        shopifyProductId: shopifyProductId,
      });

      const labelsResolved =
        labelResponse && labelResponse.data
          ? {
              ...defineLanguageDictionary(languageCode as LanguageCodes),
              ...labelResponse.data,
            }
          : defineLanguageDictionary(languageCode as LanguageCodes);

      setLabels(labelsResolved);
    }

    fetchLabels();
  }, []);

  const handleClose = () => {
    //For non proxied version of application, we want to close the modal on click of "X" button.
    //Otherwise, redirect to the previous shopify page.
    if (!isOpenOnMount) {
      resetOrderDetailsStores();
      setOpen(false);
    } else {
      location.href = document.referrer;
    }
  };

  const customerEmail = useCustomerFormStore(
    (state) => state.customerData.email,
  );

  const hideCloseButton = (page: number) =>
    [BookingFormPage.SUBMISSION_LOADER, BookingFormPage.CONFIRMATION].includes(
      page,
    );

  const hideTitleBar = (page: number) =>
    [BookingFormPage.SUBMISSION_LOADER, BookingFormPage.CONFIRMATION].includes(
      page,
    );

  return (
    <WidgetDataProvider
      data={{ baseUrl, shopUrl, shopifyProductId, languageCode }}
    >
      <WizardModal
        open={isOpenOnMount ? isOpenOnMount : open}
        initialPage={BookingFormPage.TIMESLOT_SELECTION}
        hideCloseButton={hideCloseButton}
        hideTitleBar={hideTitleBar}
        onClose={handleClose}
      >
        <WizardModal.Page page={BookingFormPage.TIMESLOT_SELECTION}>
          <TimeslotSelection moneyFormat={moneyFormat} />
        </WizardModal.Page>
        <WizardModal.Page page={BookingFormPage.ORDER_DETAILS}>
          <OrderDetails
            error=""
            event={event}
            labels={labels}
            selectedTimeslot={selectedTimeslot}
            onBackClick={resetOrderDetailsStores}
            moneyFormat={moneyFormat}
          />
        </WizardModal.Page>
        <WizardModal.Page page={BookingFormPage.SUBMISSION_LOADER}>
          <SubmissionLoader />
        </WizardModal.Page>
        <WizardModal.Page page={BookingFormPage.CONFIRMATION}>
          <Confirmation email={customerEmail} onClose={handleClose} />
        </WizardModal.Page>
      </WizardModal>
    </WidgetDataProvider>
  );
};
