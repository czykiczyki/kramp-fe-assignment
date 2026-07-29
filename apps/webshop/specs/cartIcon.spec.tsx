import React from 'react';
import { render } from '@testing-library/react';
import { CartIcon } from '../src/components/cartIcon';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('CartIcon', () => {
  it('renders as an accessible link to the checkout page when the cart is empty', () => {
    const { getByRole } = render(<CartIcon count={0} />);
    const link = getByRole('link', { name: 'Cart' });
    expect(link.getAttribute('href')).toBe('/checkout');
  });

  it('computes an accessible name of "Cart (3)" without the hidden badge duplicating the count', () => {
    const { getByRole, container } = render(<CartIcon count={3} />);
    const link = getByRole('link', { name: 'Cart (3)' });
    expect(link.getAttribute('href')).toBe('/checkout');

    const badge = container.querySelector('[aria-hidden="true"]');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toBe('3');
  });

  it('renders no badge when the cart is empty', () => {
    const { container } = render(<CartIcon count={0} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
