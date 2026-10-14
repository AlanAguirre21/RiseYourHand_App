import { Link } from 'react-router';
import PageContainer from '../../components/layout/PageContainer.jsx';
import ResponsesList from '../../components/ResponsesList.jsx';
import Button from '../../components/Button.jsx';
import { listMyResponses } from '../../api/forms.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLES } from '../../constants/roles.js';

export default function ProfileRecordPage() {
  const { user } = useAuth();

  return (
    <PageContainer size="lg">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Mis respuestas</h1>
          <p className="mt-1 text-sm text-text-muted">Las manitas que has reportado y las que tienes a cargo como champion, de la más reciente a la más antigua.</p>
        </div>
        {user.role === ROLES.ADMIN && <Button as={Link} to="/formulario" variant="primary">Registrar manita</Button>}
      </div>

      <div className="mt-6 space-y-4">
        <ResponsesList load={listMyResponses} showUser searchable championName={user.name} emptyText="Todavía no tienes ninguna manita." />
      </div>
    </PageContainer>
  );
}
