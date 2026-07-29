import React from 'react';
import { render, waitFor } from '@testing-library/react';
import SearchPage from '../src/pages/search';

// search.tsx fetches once on mount (effect has an empty dependency array) and
// exposes no props to control `results` externally, so — unlike SearchDialog
// and HomePage, which take `results`/`featured` as props — there is no way to
// re-render this page with a different, reordered result set within the same
// mounted instance to exercise a DOM-node-identity-across-reorder test. The
// key fix itself (`key={product.id}`) is the exact same pattern already
// covered by that technique in index.spec.tsx and SearchDialog.spec.tsx; this
// test instead covers what search.tsx alone can meaningfully verify: correct,
// non-duplicated rendering of each product under its category group (this
// page previously had zero test coverage at all).
const mockQuery: { q: string | undefined } = { q: 'tools' };
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    pathname: '/search',
    push: jest.fn(),
    asPath: '/search',
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  mockQuery.q = 'tools';
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: {
        searchProducts: [
          { id: '1', name: 'Heavy Duty Hammer', price: 18.99, imageUrl: '', category: 'Tools' },
          {
            id: '3',
            name: 'Safety Helmet EN397',
            price: 14.99,
            imageUrl: '',
            category: 'Safety Equipment',
          },
        ],
      },
    }),
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SearchPage', () => {
  it('groups results by category and renders each product exactly once', async () => {
    const { getByRole, getByText } = render(<SearchPage />);

    await waitFor(() =>
      expect(getByRole('heading', { name: 'Heavy Duty Hammer' })).toBeTruthy()
    );
    expect(getByText('Tools')).toBeTruthy();
    expect(getByText('Safety Equipment')).toBeTruthy();
    expect(getByRole('heading', { name: 'Safety Helmet EN397' })).toBeTruthy();
  });

  it('stops loading and shows "No products found." when the request fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    const { getByText, queryByText } = render(<SearchPage />);

    await waitFor(() => expect(getByText('No products found.')).toBeTruthy());
    expect(queryByText('Loading...')).toBeFalsy();
  });
});
