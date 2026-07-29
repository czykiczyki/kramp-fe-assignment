import { GetServerSideProps } from 'next';
import ProductCard from '../components/ProductCard';
import styles from './index.module.css';

export const getServerSideProps: GetServerSideProps = async () => {
  const FEATURED_IDS = ['1', '4', '11', '17'];
  const featured = [];

  for (const id of FEATURED_IDS) {
    try {
      const res = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetProduct($id: ID!) {
              product(id: $id) {
                id
                name
                price
                imageUrl
                description
                category
                stock
                createdAt
              }
            }
          `,
          variables: { id },
        }),
      });
      const data = await res.json();
      if (data.data?.product) {
        featured.push(data.data.product);
      }
    } catch (e) {}
  }

  return {
    props: {
      featured,
      timestamp: Date.now(),
    },
  };
};

interface HomePageProps {
  featured: any[];
  timestamp: number;
}

export default function HomePage({ featured, timestamp }: HomePageProps) {
  return (
    <div>
      <section className={styles.hero}>
        <img
          src="https://placehold.co/1200x800/e63329/ffffff?text=Kramp+Webshop"
          alt="Kramp — Your industrial supply partner"
          loading="lazy"
          className={styles.heroImage}
        />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Industrial supplies, delivered.</h1>
          <p className={styles.heroSubtitle}>
            Tools, fasteners, safety equipment and power tools for professionals.
          </p>
        </div>
      </section>

      <section className={styles.featured}>
        <div className={styles.featuredHeader}>
          <h2>Featured products</h2>
          <p className={styles.timestamp}>
            Last updated: {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className={styles.grid}>
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className={styles.categories}>
        <h2>Shop by category</h2>
        <div className={styles.categoryGrid}>
          {['Tools', 'Fasteners', 'Safety Equipment', 'Power Tools'].map((cat, index) => (
            <a key={index} href={`/search?q=${cat}`} className={styles.categoryCard}>
              {cat}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
