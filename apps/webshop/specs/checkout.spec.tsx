import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import CheckoutPage from '../src/pages/checkout';
import { CartContext } from '../src/pages/_app';

// Avoid pulling in the real _app.tsx (and its useCart -> uuid ESM-only import,
// which Jest's transform doesn't handle) just to get the CartContext reference.
jest.mock('../src/pages/_app', () => {
  const { createContext, useContext } = require('react');
  const CartContext = createContext(undefined);
  return { CartContext, useCartContext: () => useContext(CartContext) };
});

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function renderCheckout(cartValue: any) {
  return render(
    <CartContext.Provider value={{ cart: cartValue }}>
      <CheckoutPage />
    </CartContext.Provider>
  );
}

describe('CheckoutPage', () => {
  it('shows an empty-cart message with an accessible "Continue shopping" link when the cart is empty', () => {
    const { getByRole, getByText } = renderCheckout({ cart: [], clearCart: jest.fn() });
    expect(getByText('Your cart is empty.')).toBeTruthy();
    const link = getByRole('link', { name: 'Continue shopping' });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('renders "Place order" as an accessible submit button inside a form', () => {
    const cartValue = {
      cart: [{ productId: '1', name: 'Hammer', price: 18.99, quantity: 2 }],
      clearCart: jest.fn(),
    };
    const { getByRole } = renderCheckout(cartValue);
    const button = getByRole('button', { name: 'Place order' });
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.closest('form')).toBeTruthy();
  });

  it('shows subtotal, VAT, shipping and total in the order summary', () => {
    // Two distinct line-item prices so no line total coincides with any
    // summary value (avoids ambiguous text matches in the assertions below).
    const cartValue = {
      cart: [
        { productId: '1', name: 'Hammer', price: 10, quantity: 1 },
        { productId: '2', name: 'Wrench', price: 15, quantity: 1 },
      ],
      clearCart: jest.fn(),
    };
    const { getByText } = renderCheckout(cartValue);

    expect(getByText('Subtotal')).toBeTruthy();
    expect(getByText('€25.00')).toBeTruthy(); // 10 + 15
    expect(getByText('VAT (21%)')).toBeTruthy();
    expect(getByText('€5.25')).toBeTruthy(); // 25 × 0.21
    expect(getByText('Shipping')).toBeTruthy();
    expect(getByText('€9.90')).toBeTruthy(); // two line items, each quantity 1 ≤ 5 => 4.95 + 4.95
    expect(getByText('Total')).toBeTruthy();
    expect(getByText('€40.15')).toBeTruthy(); // 25 + 5.25 + 9.90
  });

  it('reflects the existing per-item shipping threshold (quantity > 5 => free) in the summary', () => {
    const cartValue = {
      cart: [{ productId: '1', name: 'Hammer', price: 10, quantity: 6 }],
      clearCart: jest.fn(),
    };
    const { getByText } = renderCheckout(cartValue);

    expect(getByText('€0.00')).toBeTruthy(); // shipping row for quantity > 5
  });

  it('clears the cart and shows the confirmation screen when the order is placed', async () => {
    const cartValue = {
      cart: [{ productId: '1', name: 'Hammer', price: 18.99, quantity: 2 }],
      clearCart: jest.fn(),
    };
    const { getByRole, getByText } = renderCheckout(cartValue);

    fireEvent.click(getByRole('button', { name: 'Place order' }));

    expect(cartValue.clearCart).toHaveBeenCalled();
    await waitFor(() => expect(getByText('Order placed!')).toBeTruthy());
    const link = getByRole('link', { name: 'Continue shopping' });
    expect(link.getAttribute('href')).toBe('/');
  });
});
