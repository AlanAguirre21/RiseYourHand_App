import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import OptionCard from '../components/OptionCard.jsx';
import { QUESTIONNAIRE_OPTION } from '../constants/questionnaires.js';
import { PANEL } from '../constants/styles.js';
import zfLogo from '../assets/ZF_logo.svg';

export default function HomePage() {
  const cardBase = `group flex flex-col p-6 ${PANEL}`;

  return (
    <PageContainer size="lg">
      <section className="text-center">
        <hgroup className="flex flex-col items-center">
          <p className="text-sm font-semibold leading-none text-zf-blue sm:text-lg">
            ZF ESL
          </p>
          <h1 className="flex items-center gap-3 text-4xl font-semibold text-text sm:gap-5 sm:text-7xl">
            <img src={zfLogo} alt="" className="size-[1em] object-contain" />
            Captura de datos "Manitas"
          </h1>
        </hgroup>

        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          Este es el formulario "manitas" para agregar una sugerencia o mostrar un punto de alerta en su área de trabajo.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {QUESTIONNAIRE_OPTION.map(option => (
          <Link
            key={option.key}
            to="/formulario"
            className={`${cardBase} transition-all hover:bg-white/60 hover:ring-2 hover:ring-accent/30`}
          >
            <OptionCard option={option} status="available" />
          </Link>
        ))}
      </section>
    </PageContainer>
  );
}
