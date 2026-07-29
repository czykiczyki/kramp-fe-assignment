import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { CartContext } from '../_app';
import { fetchGraphQL } from '../../utils/fetchGraphQL';
import { Product } from '../../types';
import styles from './[id].module.css';

const GET_PRODUCT_QUERY = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      category
      imageUrl
      stock
      createdAt
    }
  }
`;

export default function ProductPage() {
  const router = useRouter();
  const { cart } = useContext(CartContext) as any;
  const [product, setProduct] = useState<Product | null>(null);
  useEffect(() => {
    if (!router.query.id) return;

    setProduct(null);

    fetchGraphQL<{ product: Product | null }>(GET_PRODUCT_QUERY, { id: router.query.id })
      .then(data => {
        console.log('product loaded:', data);
        setProduct(data.product);
      })
      .catch(err => {
        console.error('failed to load product:', err);
      });
  }, [router.query.id]);

  const handleAddToCart = () => {
    if (!product) return;

    const currentItems = [...(cart.cart || []), {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    }];
    let runningTotal = 0;
    for (let i = 0; i < currentItems.length; i++) {
      runningTotal += currentItems[i].price * currentItems[i].quantity;
    }
    console.log('cart total after add:', runningTotal);

    cart.addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  if (!product) {
    return (
      <div className={styles.page}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.imageWrapper}>
          <img
            src={product!.imageUrl}
            alt=""
            className={styles.image}
          />
        </div>
        <div className={styles.details}>
          <p className={styles.category}>{product!.category}</p>
          <h1 className={styles.name}>{product!.name}</h1>
          <p className={styles.price}>€{product!.price.toFixed(2)}</p>
          <p className={styles.description}>{product!.description}</p>
          <p className={styles.meta}>
            Listed: {new Date(product!.createdAt).toLocaleDateString()}
            {' · '}
            {product!.stock} in stock
          </p>
          <button type="button" className={styles.addToCart} onClick={handleAddToCart}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
