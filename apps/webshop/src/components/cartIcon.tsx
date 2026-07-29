import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './cartIcon.module.css';

interface CartIconProps {
  count: number;
}

export function CartIcon({ count }: CartIconProps) {
  const [label, setLabel] = useState('Cart');

  useEffect(() => {
    if (count > 0) {
      setLabel(`Cart (${count})`);
    } else {
      setLabel('Cart');
    }
  }, [count]);

  return (
    <Link href="/checkout" className={styles.cartIcon}>
      <span className={styles.label}>{label}</span>
      {count > 0 && (
        <span className={styles.badge} aria-hidden="true">{count}</span>
      )}
    </Link>
  );
}
