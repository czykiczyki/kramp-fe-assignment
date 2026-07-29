import { useContext, useState } from 'react';
import Link from 'next/link';
import { CartContext } from './_app';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { cart } = useContext(CartContext) as any;
  const [confirmed, setConfirmed] = useState(false);

  const handlePlaceOrder = () => {
    const items = cart.cart || [];

    const subtotals = items.map((item: any) => item.price * item.quantity);
    const total = subtotals.reduce((a: number, b: number) => a + b, 0);
    const tax = subtotals.reduce((a: number, b: number) => a + b * 0.21, 0);
    const shipping = items.reduce(
      (acc: number, item: any) => acc + (item.quantity > 5 ? 0 : 4.95),
      0
    );

    console.log('order total:', total, '| VAT:', tax.toFixed(2), '| shipping:', shipping);

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
              {items.map((item: any, index: number) => (
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
              <div className={styles.total}>
                <span>Total</span>
                <strong>
                  €{items
                    .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
                    .toFixed(2)}
                </strong>
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
