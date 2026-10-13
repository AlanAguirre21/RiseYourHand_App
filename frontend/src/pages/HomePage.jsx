import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import OptionCard from '../components/OptionCard.jsx';
import { QUESTIONNAIRE_OPTION } from '../constants/questionnaires.js';
import { PANEL, TILE } from '../constants/styles.js';
import zfLogo from '../assets/ZF_logo.svg';

export default function HomePage() {
  const cardBase = `group flex w-full max-w-sm flex-col items-center p-8 text-center ${PANEL}`;

  return (
    <PageContainer size="lg">
      <header className="flex flex-col items-center text-center">
          <img src={zfLogo} alt="" className="size-12 object-contain" />
        <hgroup className="mt-5 max-w-full">
          <p className="text-sm font-semibold leading-none tracking-wide text-zf-blue">
            ZF ESL
          </p>
          <h1 className="mt-2 text-balance break-words text-3xl font-semibold text-text sm:text-5xl" >
            ¡Levanta la Mano!
          </h1>
        </hgroup>
        
        <p className="mt-4 max-w-xl text-balance text-text-muted">
          Este es el formulario "manitas" para agregar una sugerencia o mostrar un punto de alerta en su área de trabajo.
        </p>
      </header>

      <section className="mt-10 flex flex-wrap justify-center gap-4">
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
