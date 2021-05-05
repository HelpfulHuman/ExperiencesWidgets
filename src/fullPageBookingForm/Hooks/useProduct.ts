import { useEffect, useState } from "preact/hooks";
import { getProduct } from "../../Utils/api";
import { useWidgetData } from "../Components/WidgetDataProvider";
import { useEventStore } from "./useEventStore";

export const useProduct = () => {
  const { baseUrl, shopUrl } = useWidgetData();
  const { event } = useEventStore();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      console.log(event);
      const { data } = await getProduct({
        baseUrl,
        shopId: shopUrl,
        shopifyProductId: event.products[0].id,
      });
      console.log(data);

      setLoading(false);
    };

    fetchProduct();
  }, []);

  return {
    isFetchingProduct: isLoading,
  };
};
