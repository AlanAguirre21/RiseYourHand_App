import { Link } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import OptionCard from '../components/OptionCard.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { HOME_OPTIONS } from '../constants/questionnaires.js';
import { ROLES } from '../constants/roles.js';
import { PANEL } from '../constants/styles.js';
import zfLogo from '../assets/ZF_logo.svg';

// Every user registers manitas and follows them; admins also manage users and responses
const INTRO = {
  [ROLES.ADMIN]: 'Este es el formulario "manitas" para agregar una sugerencia o mostrar un punto de alerta en su área de trabajo.',
  [ROLES.USER]: 'Levanta la mano con una sugerencia o un punto de alerta en tu área de trabajo, consulta tus manitas y sigue el avance de todas.',
};

export default function HomePage() {
  const { user } = useAuth();
  const options = HOME_OPTIONS.filter(option => option.roles.includes(user.role));
  const cardBase = `group flex w-full max-w-sm flex-col sm:min-w-0 sm:flex-1 items-center p-8 text-center ${PANEL}`;

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

        <p className="mt-4 max-w-xl text-balance text-text-muted">{INTRO[user.role]}</p>
      </header>

      {/* Stacked on a phone, side by side from there on */}
      <section className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center">
        {options.map(option => (
          <Link
            key={option.key}
            to={option.to}
            className={`${cardBase} transition-all hover:bg-white/60 hover:ring-2 hover:ring-accent/30`}
          >
            <OptionCard option={option} status="available" />
          </Link>
        ))}
      </section>
    </PageContainer>
  );
}
