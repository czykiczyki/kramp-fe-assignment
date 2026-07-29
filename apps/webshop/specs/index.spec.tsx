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
