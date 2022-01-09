import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

type ProductRequest = Omit<Product, "amount">;

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO

      const newCart = [...cart];

      const findProductIndex = newCart.findIndex(
        (product) => product.id === productId
      );

      if (findProductIndex > -1) {
        const amountTotal = newCart[findProductIndex].amount + 1;

        const productStock = (await (
          await api.get(`/stock/${productId}`)
        ).data) as Stock;

        if (amountTotal > productStock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        newCart[findProductIndex].amount += 1;
      } else {
        const product = (await (
          await api.get(`/products/${productId}`)
        ).data) as ProductRequest;

        newCart.push({
          ...product,
          amount: 1,
        });
      }

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO

      const findProduct = cart.find((product) => product.id === productId);

      if (!findProduct) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const newCart = cart.filter((product) => product.id !== productId);

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const newCart = [...cart];

      const findProductIndex = newCart.findIndex(
        (product) => product.id === productId
      );

      const product = newCart[findProductIndex];

      const productStock = (await (
        await api.get(`/stock/${productId}`)
      ).data) as Stock;

      if (amount > productStock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      product.amount = amount;

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
