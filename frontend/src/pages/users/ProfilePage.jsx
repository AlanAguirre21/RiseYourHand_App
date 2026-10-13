import { Link } from 'react-router';
import { ChevronRight, History } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import AvatarEditor from '../../components/profile/AvatarEditor.jsx';
import PersonalInfoCard from '../../components/profile/PersonalInfoCard.jsx';
import RoleCard from '../../components/profile/RoleCard.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { PANEL } from '../../constants/styles.js';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  return (
    <PageContainer size="lg">
      <h1 className="text-2xl font-semibold text-text">Mi perfil</h1>
      <p className="mt-1 text-sm text-text-muted">Tu información en el sistema de captura de Manitas.</p>

      <div className="mt-6 grid items-start gap-4 md:grid-cols-[18rem_1fr]">
        <AvatarEditor user={user} onSaved={updateUser} />

        <div className="space-y-4">
          <PersonalInfoCard user={user} onSaved={updateUser} />
          <RoleCard user={user} onSaved={updateUser} />

          <Link
            to="/historial"
            className={`flex items-center gap-3 p-5 transition-all hover:bg-white/60 hover:ring-2 hover:ring-accent/30 ${PANEL}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
              <History size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-text">Mis respuestas</span>
              <span className="block text-sm text-text-muted">Las manitas que has registrado o tienes a cargo como champion.</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-text-muted" />
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
