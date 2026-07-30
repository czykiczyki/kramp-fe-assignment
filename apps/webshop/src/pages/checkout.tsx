import { useState } from 'react';
import Link from 'next/link';
import { useCartContext } from './_app';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { cart } = useCartContext();
  const [confirmed, setConfirmed] = useState(false);

  const handlePlaceOrder = () => {
    cart.clearCart();
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className={styles.confirmation}>
        <h1>Order placed!</h1>
        <p>Thank you for your order. You will receive a confirmation email shortly.</p>
        <Link href="/">Continue shopping</Link>
      </div>
    );
  }

  const items = cart.cart || [];
  const subtotals = items.map((item) => item.price * item.quantity);
  const subtotal = subtotals.reduce((a: number, b: number) => a + b, 0);
  const tax = subtotals.reduce((a: number, b: number) => a + b * 0.21, 0);
  const shipping = items.reduce(
    (acc, item) => acc + (item.quantity > 5 ? 0 : 4.95),
    0
  );
  const total = subtotal + tax + shipping;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>Checkout</h1>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Your cart is empty.</p>
            <Link href="/" className={styles.continueLink}>Continue shopping</Link>
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              handlePlaceOrder();
            }}
          >
            <div className={styles.items}>
              {items.map((item, index) => (
                <div key={index} className={styles.item}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQty}>×{item.quantity}</span>
                  <span className={styles.itemPrice}>
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>VAT (21%)</span>
                <span>€{tax.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>€{shipping.toFixed(2)}</span>
              </div>
              <div className={styles.total}>
                <span>Total</span>
                <strong>€{total.toFixed(2)}</strong>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.placeOrderButton}>
                Place order
              </button>
              <Link href="/" className={styles.continueLink}>Continue shopping</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
