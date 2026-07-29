import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SearchDialog } from '../src/components/SearchDialog';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

const results = [
  { id: '1', name: 'Heavy Duty Hammer', price: 18.99 },
  { id: '2', name: 'Adjustable Wrench', price: 22.75 },
];

describe('SearchDialog', () => {
  it('renders nothing when there are no results', () => {
    const { container } = render(<SearchDialog results={[]} onSelect={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders each result as an accessible link to its product page', () => {
    const { getByRole } = render(<SearchDialog results={results} onSelect={jest.fn()} />);
    const link = getByRole('link', { name: /Heavy Duty Hammer/ });
    expect(link.getAttribute('href')).toBe('/product/1');
  });

  it('calls onSelect with the result id when a result is clicked', () => {
    const onSelect = jest.fn();
    const { getByRole } = render(<SearchDialog results={results} onSelect={onSelect} />);
    fireEvent.click(getByRole('link', { name: /Adjustable Wrench/ }));
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('preserves the DOM node for a result across a reorder (stable key)', () => {
    const first = [
      { id: '1', name: 'Heavy Duty Hammer', price: 18.99 },
      { id: '2', name: 'Adjustable Wrench', price: 22.75 },
    ];
    const { rerender, getByRole } = render(
      <SearchDialog results={first} onSelect={jest.fn()} />
    );
    const wrenchBefore = getByRole('link', { name: /Adjustable Wrench/ });

    const reordered = [
      { id: '2', name: 'Adjustable Wrench', price: 22.75 },
      { id: '1', name: 'Heavy Duty Hammer', price: 18.99 },
    ];
    rerender(<SearchDialog results={reordered} onSelect={jest.fn()} />);
    const wrenchAfter = getByRole('link', { name: /Adjustable Wrench/ });

    expect(wrenchAfter).toBe(wrenchBefore);
  });
});
