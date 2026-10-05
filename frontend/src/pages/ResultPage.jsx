import { Link, Navigate, useLocation } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import Avatar from '../components/chat/Avatar.jsx';
import Button from '../components/Button.jsx';
import { PANEL } from '../constants/styles.js';
import { flattenQuestions, formatAnswer, formatDays } from '../utils/answers.js';

export default function ResultPage() {
  // Filled by ChatPage after sending; missing when the page is opened directly or reloaded
  const { form, response } = useLocation().state ?? {};

  if (!form || !response) {
    return <Navigate to="/" replace />;
  }

  const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
  const details = [
    ...flattenQuestions(form).map(q => [q.key, q.text, formatAnswer(q, byKey.get(q.key))]),
    ...response.computed.map(c => [c.key, c.text, formatDays(c.value)]),
  ];

  return (
    <PageContainer>
      <div className={`p-8 ${PANEL}`}>
        <div className="flex flex-col items-center">
          <Avatar size={42} />
          <p className="mt-3 text-center text-sm font-semibold text-zf-blue">{form.title}</p>
        </div>

        <p className="mt-6 text-center text-xl font-semibold text-accent">Respuesta registrada</p>

        <dl className="mt-8 border-t border-white/60 text-sm">
          {details.map(([key, label, value]) => (
            <div key={key} className="border-b border-white/40 py-2">
              <dt className="text-xs text-text-muted">{label}</dt>
              <dd className="mt-0.5 whitespace-pre-line font-medium text-text">{value}</dd>
            </div>
          ))}
        </dl>

        <Button as={Link} to="/formulario" variant="primary" size="lg" className="mt-8">
          Registrar otra manita
        </Button>

        <Button as={Link} to="/" size="lg" className="mt-3">
          Volver al inicio
        </Button>
      </div>
    </PageContainer>
  );
}
