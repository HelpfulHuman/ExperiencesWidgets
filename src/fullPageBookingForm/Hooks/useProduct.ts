import { useEffect, useState } from "preact/hooks";
import { IProduct } from "../../typings/Event";
import { getProduct } from "../../Utils/api";
import { useWidgetData } from "../Components/WidgetDataProvider";
import { useEventStore } from "./useEventStore";

export const useProduct = () => {
  const { baseUrl, shopUrl } = useWidgetData();
  const { event } = useEventStore();
  const [isLoading, setLoading] = useState(true);
  const [products, addProduct] = useState<IProduct[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      event.products.forEach(async (product) => {
        const { data } = await getProduct({
          baseUrl,
          shopId: shopUrl,
          shopifyProductId: event.products[0].id,
        });
        addProduct((prevState) => [...prevState, data]);
      });

      setLoading(false);
    };

    fetchProduct();
  }, []);

  return {
    products,
    isFetchingProduct: isLoading,
  };
};
