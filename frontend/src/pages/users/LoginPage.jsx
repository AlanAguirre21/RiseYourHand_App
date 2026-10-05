import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import { Input, Label } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { PANEL, TILE } from '../../constants/styles.js';
import zfLogo from '../../assets/ZF_logo.svg';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();

  const [name, setName]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  if (user) return <Navigate to={location.state?.from ?? '/'} replace />;

  const isValid = name.trim() !== '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await login(name.trim());
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className={`mt-4 p-6 sm:mt-8 sm:p-8 ${PANEL}`}>
        <header className="flex flex-col items-center border-b border-white/60 pb-6 text-center">
          <span className={`neu-raised flex h-16 w-16 items-center justify-center ${TILE}`}>
            <img src={zfLogo} alt="" className="size-10 object-contain" />
          </span>
          <hgroup className="mt-4 max-w-full">
            <p className="text-xs font-semibold leading-none tracking-wide text-zf-blue">
              ZF ESL
            </p>
            <h1 className="mt-1.5 text-balance break-words text-2xl font-semibold text-text sm:text-3xl">
              Formulario "manitas"
            </h1>
          </hgroup>
          <h2 className="mt-2 text-sm font-medium text-text-muted">Iniciar sesión</h2>
        </header>

        <div className="mt-6">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoFocus
            autoComplete="name"
            spellCheck={false}
            placeholder="Tu nombre completo"
            aria-describedby="name-hint"
            className="py-2"
          />
          <p id="name-hint" className="mt-1 text-xs text-text-faint">
            Ingresa tu nombre completo para iniciar sesión.
          </p>
        </div>

        {error && <div className="mt-4"><StatusMessage error={error} /></div>}

        <Button type="submit" size="lg" className="mt-6" variant="primary" disabled={!isValid || submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        ¿Aún no estás registrado?{' '}
        <Link to="/usuarios/nuevo" className="font-medium text-accent hover:underline">Regístrate</Link>
      </p>
    </PageContainer>
  );
}
