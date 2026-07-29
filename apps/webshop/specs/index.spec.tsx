import React from 'react';
import { render } from '@testing-library/react';

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
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('Index', () => {
  it('should render successfully', () => {
    const { default: HomePage } = require('../src/pages/index');
    const { baseElement } = render(<HomePage featured={[]} timestamp={Date.now()} />);
    expect(baseElement).toBeTruthy();
  });

  it('preserves the DOM node for a featured product across a reorder (stable key)', () => {
    const { default: HomePage } = require('../src/pages/index');
    const first = [
      { id: '1', name: 'Heavy Duty Hammer', price: 18.99, imageUrl: '' },
      { id: '4', name: 'Cordless Drill/Driver 18V', price: 119, imageUrl: '' },
    ];
    const { rerender, getByRole } = render(<HomePage featured={first} timestamp={Date.now()} />);
    const drillBefore = getByRole('heading', { name: 'Cordless Drill/Driver 18V' });

    const reordered = [
      { id: '4', name: 'Cordless Drill/Driver 18V', price: 119, imageUrl: '' },
      { id: '1', name: 'Heavy Duty Hammer', price: 18.99, imageUrl: '' },
    ];
    rerender(<HomePage featured={reordered} timestamp={Date.now()} />);
    const drillAfter = getByRole('heading', { name: 'Cordless Drill/Driver 18V' });

    expect(drillAfter).toBe(drillBefore);
  });
});

describe('getServerSideProps', () => {
  const productResponse = (id: string) => ({
    ok: true,
    json: async () => ({
      data: { product: { id, name: `Product ${id}`, price: 10, imageUrl: '', description: '', category: 'Tools', stock: 1, createdAt: '2024-01-01' } },
    }),
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips a product whose request fails and still returns the rest', async () => {
    const { getServerSideProps } = require('../src/pages/index');
    global.fetch = jest.fn().mockImplementation((_url: string, init: any) => {
      const { variables } = JSON.parse(init.body);
      if (variables.id === '4') {
        return Promise.reject(new Error('network down'));
      }
      return Promise.resolve(productResponse(variables.id));
    }) as jest.Mock;

    const result = await getServerSideProps({} as any);
    const featuredIds = result.props.featured.map((p: any) => p.id);

    expect(featuredIds).toEqual(['1', '11', '17']);
  });
});
