'use client';

import Link from 'next/link';
import styles from './ChoiceCards.module.css';

export interface ChoiceCardItem {
  href: string;
  title: string;
  description: string;
  cta: string;
}

interface ChoiceCardsProps {
  kicker?: string;
  title: string;
  subtitle: string;
  choices: ChoiceCardItem[];
}

export default function ChoiceCards({ kicker, title, subtitle, choices }: ChoiceCardsProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {kicker && <p className={styles.kicker}>{kicker}</p>}
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.grid}>
          {choices.map((choice) => (
            <Link key={choice.href} href={choice.href} className={styles.choice}>
              <h2>{choice.title}</h2>
              <p>{choice.description}</p>
              <span>{choice.cta}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
