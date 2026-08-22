// frontend/src/app/(public)/organization/[id]/page.tsx

import OrganizationView from '@/components/organization/OrganizationView';
import styles from './page.module.css';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function PublicOrganizationPage({ params }: Props) {
    const { id } = await params;

    console.log("id", id);

    return <div className={styles.page}>
        <OrganizationView mode="view" orgId={id} />;
    </div>
}