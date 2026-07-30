import 'isomorphic-fetch';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { createContext, useContext } from 'react';
import { useCart } from '../hooks/useCart';
import { Header } from '../components/Header';
import './styles.css';

export interface CartContextValue {
  cart: ReturnType<typeof useCart>;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCartContext(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartContext.Provider');
  }
  return context;
}

function CustomApp({ Component, pageProps }: AppProps) {
  const cart = useCart();

  return (
    <CartContext.Provider value={{ cart }}>
      <Head>
        <title>Kramp Webshop</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main className="app">
        <Component {...pageProps} />
      </main>
    </CartContext.Provider>
  );
}

export default CustomApp;
