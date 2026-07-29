import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { Header } from '../src/components/Header';
import { CartContext } from '../src/pages/_app';

// Avoid pulling in the real _app.tsx (and its useCart -> uuid ESM-only import,
// which Jest's transform doesn't handle) just to get the CartContext reference.
jest.mock('../src/pages/_app', () => ({
  CartContext: require('react').createContext(undefined),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockCartValue = { cart: { totalItems: 0 } };

function renderHeader() {
  return render(
    <CartContext.Provider value={mockCartValue}>
      <Header />
    </CartContext.Provider>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { searchProducts: [] } }),
  }) as jest.Mock;
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Header search debounce', () => {
  it('sends exactly one request after a burst of rapid changes, once the delay elapses', async () => {
    const { getByPlaceholderText } = renderHeader();
    const input = getByPlaceholderText('Search products...');

    fireEvent.change(input, { target: { value: 'h' } });
    fireEvent.change(input, { target: { value: 'ha' } });
    fireEvent.change(input, { target: { value: 'ham' } });
    fireEvent.change(input, { target: { value: 'hamm' } });

    expect(global.fetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.variables.q).toBe('hamm');
  });

  it('clears results after the delay when the query is cleared', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { searchProducts: [{ id: '1', name: 'Hammer', price: 9.99 }] },
      }),
    });
    const { getByPlaceholderText, queryByText } = renderHeader();
    const input = getByPlaceholderText('Search products...');

    fireEvent.change(input, { target: { value: 'hammer' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(queryByText('Hammer')).toBeTruthy());

    fireEvent.change(input, { target: { value: '' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(queryByText('Hammer')).toBeFalsy());
  });

  it('only fetches the latest value when the query changes before the previous delay elapses', async () => {
    const { getByPlaceholderText } = renderHeader();
    const input = getByPlaceholderText('Search products...');

    fireEvent.change(input, { target: { value: 'ham' } });
    act(() => {
      jest.advanceTimersByTime(150); // before the 300ms delay elapses
    });
    fireEvent.change(input, { target: { value: 'hammer' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.variables.q).toBe('hammer');
  });

  it('does not crash and shows no results dropdown when the search request fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    const { getByPlaceholderText, container } = renderHeader();
    const input = getByPlaceholderText('Search products...');

    fireEvent.change(input, { target: { value: 'hammer' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('a[href^="/product/"]')).toBeNull();
  });

  it('ignores a stale response that resolves after a newer one', async () => {
    function createDeferred<T>() {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>(res => {
        resolve = res;
      });
      return { promise, resolve };
    }

    const first = createDeferred<any>(); // response for the earlier query "ha"
    const second = createDeferred<any>(); // response for the newer query "hammer"

    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const { getByPlaceholderText, queryByText } = renderHeader();
    const input = getByPlaceholderText('Search products...');

    fireEvent.change(input, { target: { value: 'ha' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    fireEvent.change(input, { target: { value: 'hammer' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    // The newer request ("hammer") resolves first.
    await act(async () => {
      second.resolve({
        ok: true,
        json: async () => ({
          data: { searchProducts: [{ id: '2', name: 'Hammer Drill', price: 59 }] },
        }),
      });
      await Promise.resolve();
    });
    await waitFor(() => expect(queryByText('Hammer Drill')).toBeTruthy());

    // The older request ("ha") resolves later — its response must be ignored.
    await act(async () => {
      first.resolve({
        ok: true,
        json: async () => ({
          data: { searchProducts: [{ id: '3', name: 'Hand Saw', price: 12 }] },
        }),
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(queryByText('Hammer Drill')).toBeTruthy();
      expect(queryByText('Hand Saw')).toBeFalsy();
    });
  });
});
