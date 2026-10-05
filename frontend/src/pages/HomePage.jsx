import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import OptionCard from '../components/OptionCard.jsx';
import { listQuestionnaires } from '../api/questionnaires.js';
import { QUESTIONNAIRE_OPTIONS } from '../constants/questionnaires.js';
import { CHIP, PANEL } from '../constants/styles.js';

const FIVE_S = ['Seiri', 'Seiton', 'Seiso', 'Seiketsu', 'Shitsuke'];

export default function HomePage() {
  const [availableKeys, setAvailableKeys] = useState(null);   // null = still loading
  const [error, setError] = useState(null);

  useEffect(() => {
    listQuestionnaires()
      .then(items => setAvailableKeys(new Set(items.map(q => q.key))))
      .catch(e => setError(e.message));
  }, []);

  function statusOf(key) {
    if (availableKeys === null) return error ? 'unavailable' : 'loading';
    return availableKeys.has(key) ? 'available' : 'unavailable';
  }

  const cardBase = `group flex flex-col p-6 ${PANEL}`;

  return (
    <PageContainer size="lg">
      <section className="text-center">
        <hgroup className="flex flex-col items-center gap-0 sm:gap-0">
        <p className="text-sm font-semibold leading-none text-zf-blue sm:text-lg">
          ZF ESL
        </p>
        <h1 className="flex items-center gap-3 text-4xl font-semibold text-text sm:gap-5 sm:text-7xl">
          <img src="/ZF_logo.svg" alt="" className="size-[1em] object-contain" />
          Evaluación 5S
        </h1>
      </hgroup>

        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          Selecciona el tipo de área a auditar. Responderás preguntas de Sí o No
          organizadas por cada una de las 5S.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {FIVE_S.map(s => (
            <li key={s} className={`px-5 py-2 text-base font-medium text-text-muted ${CHIP}`}>
              {s}
            </li>
          ))}
        </ul>
      </section>

      {error && <div className="mt-8"><StatusMessage error={error} /></div>}

      {availableKeys?.size === 0 && (
        <div role="status" className="glass mt-8 rounded-control border border-warning/25 bg-warning/25 p-4 text-center text-sm text-text">
          No hay cuestionarios cargados.
        </div>
      )}

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {QUESTIONNAIRE_OPTIONS.map(option => {
          const status = statusOf(option.key);

          return status === 'available' ? (
            <Link
              key={option.key}
              to={`/audits/new/${option.key}`}
              className={`${cardBase} transition-all hover:bg-white/60 hover:ring-2 hover:ring-accent/30`}
            >
              <OptionCard option={option} status={status} />
            </Link>
          ) : (
            <div key={option.key} aria-disabled="true" className={`${cardBase} cursor-not-allowed opacity-40`}>
              <OptionCard option={option} status={status} />
            </div>
          );
        })}
      </section>
    </PageContainer>
  );
}