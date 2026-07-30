import Link from 'next/link';
import { SearchResult } from '../types';
import styles from './SearchDialog.module.css';

interface SearchDialogProps {
  results: SearchResult[];
  onSelect: (id: string) => void;
}

export function SearchDialog({ results, onSelect }: SearchDialogProps) {
  if (!results.length) return null;

  return (
    <div className={styles.dialog}>
      {results.map((result) => (
        <Link
          key={result.id}
          href={`/product/${result.id}`}
          className={styles.item}
          onClick={() => onSelect(result.id)}
        >
          <span className={styles.itemName}>{result.name}</span>
          <span className={styles.itemPrice}>€{result.price.toFixed(2)}</span>
        </Link>
      ))}
    </div>
  );
}
