'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FiSliders, FiX } from 'react-icons/fi';
import styles from './JobFilterSidebar.module.css';

const JOB_TYPE_OPTIONS = [
  { value: 'FULL_TIME',   label: 'Full Time' },
  { value: 'PART_TIME',   label: 'Part Time' },
  { value: 'CONTRACT',    label: 'Contract' },
  { value: 'INTERNSHIP',  label: 'Internship' },
  { value: 'TEMPORARY',   label: 'Temporary' },
];

const WORK_MODE_OPTIONS = [
  { value: 'REMOTE',  label: 'Remote' },
  { value: 'ONSITE',  label: 'On-site' },
  { value: 'HYBRID',  label: 'Hybrid' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'ENTRY',       label: 'Entry Level' },
  { value: 'MID',         label: 'Mid Level' },
  { value: 'SENIOR',      label: 'Senior Level' },
  { value: 'LEAD',        label: 'Lead' },
  { value: 'EXECUTIVE',   label: 'Executive' },
];

const SORT_OPTIONS = [
  { value: 'published_at|desc', label: 'Most Recent' },
  { value: 'published_at|asc',  label: 'Oldest First' },
  { value: 'salary_min|desc',   label: 'Highest Salary' },
  { value: 'salary_min|asc',    label: 'Lowest Salary' },
  { value: 'title|asc',         label: 'Title A–Z' },
  { value: 'title|desc',        label: 'Title Z–A' },
];

// ─── parse helpers ────────────────────────────────────────────────────────────

function parseSort(sp: URLSearchParams) {
  const by    = sp.get('sort_by')    ?? 'published_at';
  const order = sp.get('sort_order') ?? 'desc';
  return `${by}|${order}`;
}

function SidebarContent() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // ── Local state mirrors URL params ────────────────────────────────────────
  const [jobTypes,         setJobTypes]         = useState<string[]>(
    searchParams.get('job_type')?.split(',').filter(Boolean) ?? []
  );
  const [workModes,        setWorkModes]        = useState<string[]>(
    searchParams.get('work_mode')?.split(',').filter(Boolean) ?? []
  );
  const [experienceLevels, setExperienceLevels] = useState<string[]>(
    searchParams.get('experience_level')?.split(',').filter(Boolean) ?? []
  );
  const [category,         setCategory]         = useState(searchParams.get('category') ?? '');
  const [locationCity,     setLocationCity]     = useState(searchParams.get('location_city') ?? '');
  const [locationCountry,  setLocationCountry]  = useState(searchParams.get('location_country') ?? '');
  const [salaryMin,        setSalaryMin]        = useState(
    Number(searchParams.get('salary_min') ?? 0)
  );
  const [skills,           setSkills]           = useState(searchParams.get('required_skills') ?? '');
  const [isFeatured,       setIsFeatured]       = useState(searchParams.get('is_featured') === 'true');
  const [sort,             setSort]             = useState(parseSort(searchParams));

  // ── helpers ───────────────────────────────────────────────────────────────
  const toggleItem = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => setter(list.includes(value) ? list.filter(x => x !== value) : [...list, value]);

  const reset = () => {
    setJobTypes([]);
    setWorkModes([]);
    setExperienceLevels([]);
    setCategory('');
    setLocationCity('');
    setLocationCountry('');
    setSalaryMin(0);
    setSkills('');
    setIsFeatured(false);
    setSort('published_at|desc');
  };

  const apply = () => {
    // Preserve q from current URL so search bar isn't wiped
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);

    if (jobTypes.length)         params.set('job_type',          jobTypes.join(','));
    if (workModes.length)        params.set('work_mode',         workModes.join(','));
    if (experienceLevels.length) params.set('experience_level',  experienceLevels.join(','));
    if (category)                params.set('category',          category);
    if (locationCity)            params.set('location_city',     locationCity);
    if (locationCountry)         params.set('location_country',  locationCountry);
    if (salaryMin > 0)           params.set('salary_min',        salaryMin.toString());
    if (skills)                  params.set('required_skills',   skills);
    if (isFeatured)              params.set('is_featured',       'true');

    const [sort_by, sort_order] = sort.split('|');
    if (sort_by !== 'published_at' || sort_order !== 'desc') {
      params.set('sort_by',    sort_by);
      params.set('sort_order', sort_order);
    }

    router.push(`${pathname}?${params.toString()}`);
    setShowDrawer(false);
  };

  // Count active filters for badge
  const activeCount = [
    jobTypes.length, workModes.length, experienceLevels.length,
    category, locationCity, locationCountry,
    salaryMin > 0, skills, isFeatured,
    sort !== 'published_at|desc',
  ].filter(Boolean).length;

  const onWheel = (e: React.WheelEvent) => {
    if (sidebarRef.current) {
      e.stopPropagation();
      // sidebarRef.current.scrollTop += e.deltaY;
    }
  };

  const SidebarBody = (
    <>
      {/* Mobile header */}
      <div className={styles.mobileHeader}>
        <span>Filter Jobs</span>
        <button onClick={() => setShowDrawer(false)} className={styles.closeBtn} aria-label="Close">
          <FiX size={18} />
        </button>
      </div>

      {/* ── Sort ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Sort By</h3>
        <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Job Type ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Job Type</h3>
        <div className={styles.filterList}>
          {JOB_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className={styles.filterItem}>
              <input
                type="checkbox"
                checked={jobTypes.includes(opt.value)}
                onChange={() => toggleItem(opt.value, jobTypes, setJobTypes)}
              />
              <span className={styles.filterName}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Work Mode ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Work Mode</h3>
        <div className={styles.filterList}>
          {WORK_MODE_OPTIONS.map(opt => (
            <label key={opt.value} className={styles.filterItem}>
              <input
                type="checkbox"
                checked={workModes.includes(opt.value)}
                onChange={() => toggleItem(opt.value, workModes, setWorkModes)}
              />
              <span className={styles.filterName}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Experience Level ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Experience Level</h3>
        <div className={styles.filterList}>
          {EXPERIENCE_OPTIONS.map(opt => (
            <label key={opt.value} className={styles.filterItem}>
              <input
                type="checkbox"
                checked={experienceLevels.includes(opt.value)}
                onChange={() => toggleItem(opt.value, experienceLevels, setExperienceLevels)}
              />
              <span className={styles.filterName}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Location ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Location</h3>
        <div className={styles.inputStack}>
          <input
            className={styles.searchInput}
            placeholder="City…"
            value={locationCity}
            onChange={e => setLocationCity(e.target.value)}
          />
          <input
            className={styles.searchInput}
            placeholder="Country…"
            value={locationCountry}
            onChange={e => setLocationCountry(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Category</h3>
        <input
          className={styles.searchInput}
          placeholder="e.g. Engineering, Design…"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
      </div>

      {/* ── Skills ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Required Skills</h3>
        <input
          className={styles.searchInput}
          placeholder="e.g. python, react, sql"
          value={skills}
          onChange={e => setSkills(e.target.value)}
        />
        <p className={styles.fieldHint}>Comma-separated</p>
      </div>

      {/* ── Min Salary ── */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterTitle}>Minimum Salary</h3>
        <input
          type="range"
          min={0}
          max={5000000}
          step={50000}
          value={salaryMin}
          onChange={e => setSalaryMin(Number(e.target.value))}
          className={styles.salaryRange}
        />
        <div className={styles.salaryLabels}>
          <span>₹0</span>
          <span className={styles.salaryValue}>
            {salaryMin > 0 ? `₹${(salaryMin / 100000).toFixed(1)}L` : 'Any'}
          </span>
        </div>
      </div>

      {/* ── Featured ── */}
      <div className={styles.filterSection}>
        <label className={styles.filterItem}>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={e => setIsFeatured(e.target.checked)}
          />
          <span className={styles.filterName}>Featured jobs only</span>
        </label>
      </div>

      {/* ── Action buttons ── */}
      <div className={styles.buttons}>
        <button className={styles.resetBtn} onClick={reset}>Reset</button>
        <button className={styles.applyBtn} onClick={apply}>Apply Filters</button>
      </div>
    </>
  );

  return (
    <>
      {/* FAB */}
      <button
        className={styles.filterFab}
        onClick={() => setShowDrawer(prev => !prev)}
        aria-label="Toggle filters"
      >
        <FiSliders size={20} color="white" />
        {activeCount > 0 && (
          <span className={styles.fabBadge}>{activeCount}</span>
        )}
      </button>

      {/* Overlay */}
      {showDrawer && <div className={styles.overlay} onClick={() => setShowDrawer(false)} />}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onWheel={onWheel}
        className={`${styles.sidebar} ${showDrawer ? styles.show : ''}`}
      >
        {SidebarBody}
      </aside>
    </>
  );
}

export default function JobFilterSidebar() {
  return (
    <Suspense fallback={<div className="w-[280px]" />}>
      <SidebarContent />
    </Suspense>
  );
}