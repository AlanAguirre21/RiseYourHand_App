import { useState } from 'react';
import { Check, Link } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import ResponsesList from '../components/ResponsesList.jsx';
import Button from '../components/Button.jsx';
import { getExportLink, listAllResponses } from '../api/forms.js';
import { PANEL } from '../constants/styles.js';

function PowerBiExport() {
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState(null);

  async function copyLink() {
    setError(null);
    try {
      await navigator.clipboard.writeText(await getExportLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className={`mt-6 flex flex-wrap items-center justify-between gap-3 p-5 ${PANEL}`}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-text">Exportar a Power BI</h2>
        <p className="mt-0.5 text-xs text-text-muted">
          Enlace a todas las respuestas como una tabla CSV. Úsalo en Power BI con «Obtener datos → Web».
        </p>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
      <Button variant="primary" onClick={copyLink}>
        {copied ? <Check size={16} /> : <Link size={16} />}
        {copied ? 'Enlace copiado' : 'Copiar enlace'}
      </Button>
    </section>
  );
}

export default function ResponsesPage() {
  return (
    <PageContainer size="lg">
      <h1 className="text-2xl font-semibold text-text">Registro de respuestas</h1>
      <p className="mt-1 text-sm text-text-muted">Las manitas registradas por todos los usuarios, de la más reciente a la más antigua. Haz clic en una para editarla.</p>
      <PowerBiExport />
      <div className="mt-6 space-y-4">
        <ResponsesList load={listAllResponses} showUser searchable editable emptyText="Todavía no hay respuestas registradas." />
      </div>
    </PageContainer>
  );
}
