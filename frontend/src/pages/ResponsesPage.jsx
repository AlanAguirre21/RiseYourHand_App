import PageContainer from '../components/layout/PageContainer.jsx';
import ResponsesList from '../components/ResponsesList.jsx';
import { listAllResponses } from '../api/forms.js';

export default function ResponsesPage() {
  return (
    <PageContainer size="lg">
      <h1 className="text-2xl font-semibold text-text">Registro de respuestas</h1>
      <p className="mt-1 text-sm text-text-muted">Las manitas registradas por todos los usuarios, de la más reciente a la más antigua.</p>

      <div className="mt-6 space-y-4">
        <ResponsesList load={listAllResponses} showUser emptyText="Todavía no hay respuestas registradas." />
      </div>
    </PageContainer>
  );
}
