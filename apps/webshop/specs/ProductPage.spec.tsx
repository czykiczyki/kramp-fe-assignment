import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import ProductPage from '../src/pages/product/[id]';
import { CartContext } from '../src/pages/_app';

// Avoid pulling in the real _app.tsx (and its useCart -> uuid ESM-only import,
// which Jest's transform doesn't handle) just to get the CartContext reference.
jest.mock('../src/pages/_app', () => ({
  CartContext: require('react').createContext(undefined),
}));

const mockQuery: { id: string | undefined } = { id: '1' };
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    pathname: '/product/[id]',
    push: jest.fn(),
    asPath: '/product/1',
  }),
}));

function renderProductPage(cartValue: any) {
  return render(
    <CartContext.Provider value={{ cart: cartValue }}>
      <ProductPage />
    </CartContext.Provider>
  );
}

const productResponse = (id: string) => ({
  json: async () => ({
    data: {
      product: {
        id,
        name: `Product ${id}`,
        description: '',
        price: 10,
        category: 'Tools',
        imageUrl: '',
        stock: 1,
        createdAt: '2024-01-01',
      },
    },
  }),
});

beforeEach(() => {
  mockQuery.id = '1';
  global.fetch = jest.fn().mockImplementation((_url, init) => {
    const { variables } = JSON.parse(init.body);
    return Promise.resolve(productResponse(variables.id));
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('does not refetch the product when the cart changes', async () => {
  const cartA = { cart: [], addToCart: jest.fn(), totalItems: 0 };
  const { rerender } = renderProductPage(cartA);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  const cartB = {
    cart: [{ productId: '1', name: 'X', price: 10, quantity: 1 }],
    addToCart: jest.fn(),
    totalItems: 1,
  };
  rerender(
    <CartContext.Provider value={{ cart: cartB }}>
      <ProductPage />
    </CartContext.Provider>
  );
  await act(async () => {
    await Promise.resolve();
  });

  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it('refetches when the product id changes via client-side navigation', async () => {
  const cartValue = { cart: [], addToCart: jest.fn(), totalItems: 0 };
  const { rerender } = renderProductPage(cartValue);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  mockQuery.id = '4';
  rerender(
    <CartContext.Provider value={{ cart: cartValue }}>
      <ProductPage />
    </CartContext.Provider>
  );

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  const secondCallBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
  expect(secondCallBody.variables.id).toBe('4');
});

it('does not fetch while router.query.id is not yet available', async () => {
  mockQuery.id = undefined;
  renderProductPage({ cart: [], addToCart: jest.fn(), totalItems: 0 });
  await act(async () => {
    await Promise.resolve();
  });

  expect(global.fetch).not.toHaveBeenCalled();
});

it('shows a loading state while refetching after an id change, instead of stale product content', async () => {
  let resolveSecondFetch: (value: unknown) => void;
  const secondFetch = new Promise(res => {
    resolveSecondFetch = res;
  });

  (global.fetch as jest.Mock)
    .mockImplementationOnce((_url: string, init: any) => {
      const { variables } = JSON.parse(init.body);
      return Promise.resolve(productResponse(variables.id));
    })
    .mockImplementationOnce(() => secondFetch);

  const cartValue = { cart: [], addToCart: jest.fn(), totalItems: 0 };
  const { rerender, getByText, queryByText } = renderProductPage(cartValue);
  await waitFor(() => expect(getByText('Product 1')).toBeTruthy());

  mockQuery.id = '4';
  rerender(
    <CartContext.Provider value={{ cart: cartValue }}>
      <ProductPage />
    </CartContext.Provider>
  );

  await waitFor(() => expect(queryByText('Product 1')).toBeFalsy());
  expect(getByText('Loading...')).toBeTruthy();

  await act(async () => {
    resolveSecondFetch!(productResponse('4'));
    await Promise.resolve();
  });
  await waitFor(() => expect(getByText('Product 4')).toBeTruthy());
});
