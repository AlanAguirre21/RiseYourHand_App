import { Link } from 'react-router';
import PageContainer from '../../components/layout/PageContainer.jsx';
import ResponsesList from '../../components/ResponsesList.jsx';
import Button from '../../components/Button.jsx';
import { listMyResponses } from '../../api/forms.js';

export default function ProfileRecordPage() {
  return (
    <PageContainer size="lg">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Mis respuestas</h1>
          <p className="mt-1 text-sm text-text-muted">Las manitas que has registrado, de la más reciente a la más antigua.</p>
        </div>
        <Button as={Link} to="/formulario" variant="primary">Registrar manita</Button>
      </div>

      <div className="mt-6 space-y-4">
        <ResponsesList load={listMyResponses} emptyText="Todavía no has registrado ninguna manita." />
      </div>
    </PageContainer>
  );
}
