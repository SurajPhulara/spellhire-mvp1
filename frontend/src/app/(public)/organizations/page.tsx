'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ProfileService } from '@/lib/api/services/profile';
import { Organization } from '@/types';
import styles from './page.module.css';

function matchesQuery(org: Organization, q: string) {
  const haystack = [
    org.name,
    org.industry,
    org.headquarters_location,
    org.website,
    org.contact_email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export default function OrganizationsPage() {
  const [query, setQuery] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (q?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ProfileService.listOrganizations(q || undefined, 40, 0);
      const list = response.data?.organizations || [];
      setOrganizations(list);
    } catch (err: any) {
      setError(err?.message || 'Could not load organizations.');
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    load(query.trim());
  };

  const visible = useMemo(() => {
    const q = query.trim();
    if (!q) return organizations;
    return organizations.filter((org) => matchesQuery(org, q));
  }, [organizations, query]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.kicker}>Organizations</p>
        <h1>Find your company</h1>
        <p>
          Search public organization profiles. Joining a team is invitation-only —
          if you already have access, sign in as a member from the company page.
        </p>
        <form className={styles.search} onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, industry, or location"
          />
          <button type="submit">Search</button>
        </form>
        <p className={styles.hint}>
          Search uses organization name and industry. Location is used to refine the results shown here.
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {isLoading ? (
        <p className={styles.status}>Searching organizations…</p>
      ) : visible.length === 0 ? (
        <div className={styles.empty}>
          <h2>No organizations found</h2>
          <p>
            If this is a new company, you can create it. If you were invited, use the
            link in your email instead of joining from search.
          </p>
          <Link href="/register/hire">Create an organization</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((org) => (
            <Link key={org.id} href={`/organization/${org.id}`} className={styles.orgCard}>
              <div className={styles.logo}>
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" />
                ) : (
                  (org.name || 'O').slice(0, 1).toUpperCase()
                )}
              </div>
              <div>
                <h3>{org.name || 'Unnamed organization'}</h3>
                <p>{[org.industry, org.headquarters_location].filter(Boolean).join(' · ') || 'Company profile'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
