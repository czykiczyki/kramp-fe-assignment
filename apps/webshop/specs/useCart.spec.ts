import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from '../src/hooks/useCart';

// uuid ships ESM-only and Jest's transform doesn't handle it; useCart imports
// v4 directly, so it must be mocked here (unlike specs that only pull in
// useCart transitively through a mocked _app module).
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

const STORED_CART = [{ productId: '1', name: 'Hammer', price: 18.99, quantity: 2 }];

beforeEach(() => {
  localStorage.clear();
});

it('loads the persisted cart from localStorage after mount', async () => {
  localStorage.setItem('cart', JSON.stringify(STORED_CART));

  const { result } = renderHook(() => useCart());

  await waitFor(() => expect(result.current.cart).toEqual(STORED_CART));
  expect(result.current.totalItems).toBe(2);
});

it('does not lose a persisted cart after mount', async () => {
  const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  localStorage.setItem('cart', JSON.stringify(STORED_CART));
  setItemSpy.mockClear();

  renderHook(() => useCart());

  await waitFor(() => {
    expect(JSON.parse(localStorage.getItem('cart')!)).toEqual(STORED_CART);
  });
  // The final state alone isn't enough: a missing first-write guard would
  // transiently overwrite the persisted cart with '[]' before a later effect
  // re-persists the real data, which the assertion above wouldn't catch.
  expect(setItemSpy).not.toHaveBeenCalledWith('cart', '[]');
});

it('still persists genuine cart changes to localStorage', async () => {
  const { result } = renderHook(() => useCart());

  act(() => {
    result.current.addToCart({ productId: '9', name: 'Wrench', price: 5, quantity: 1 });
  });

  await waitFor(() => {
    const persisted = JSON.parse(localStorage.getItem('cart')!);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].productId).toBe('9');
  });
});
