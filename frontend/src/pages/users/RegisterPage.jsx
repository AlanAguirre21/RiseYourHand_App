import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import PageContainer from '../../components/layout/PageContainer.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import Button from '../../components/Button.jsx';
import { Input, Label } from '../../components/Input.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createUser } from '../../api/users.js';
import { ROLES } from '../../constants/roles.js';
import { CONTACT_HINT, cleanName, cleanEmail, cleanPayroll, isValidName, isValidContact } from '../../utils/userFields.js';
import { PANEL, TILE } from '../../constants/styles.js';
import zfLogo from '../../assets/ZF_logo.svg';

// Self-registration from the login page. Admins add users (and choose roles) in UsersPage.
export default function NewUserPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [payroll, setPayroll]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);

  if (user && !submitting) return <Navigate to={user.role === ROLES.ADMIN ? '/usuarios' : '/'} replace />;

  const data = { name: cleanName(name), email: cleanEmail(email), payroll: cleanPayroll(payroll) };
  const isValid = isValidName(data.name) && isValidContact(data);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const newUser = await createUser(data);
      await login(newUser.name);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <form onSubmit={handleSubmit} className={`mt-4 p-6 sm:mt-8 sm:p-8 ${PANEL}`}>
        <header className="flex flex-col items-center border-b border-white/60 pb-6 text-center">
            <img src={zfLogo} alt="" className="size-10 object-contain" />
          <hgroup className="mt-4 max-w-full">
            <p className="text-xs font-semibold leading-none tracking-wide text-zf-blue">
              ZF ESL
            </p>
            <h1 className="mt-1.5 text-balance break-words text-2xl font-semibold text-text sm:text-3xl">
              Formulario "manitas"
            </h1>
          </hgroup>
          <h2 className="mt-2 text-sm font-medium text-text-muted">Crear usuario</h2>
        </header>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              autoFocus
              autoComplete="off"
              placeholder="p. ej. Juan Pérez"
              aria-describedby="name-hint"
              className="py-2"
            />
            <p id="name-hint" className="mt-1 text-xs text-text-faint">
              Con el nombre que ingreses se inicia sesión. No importan mayúsculas ni acentos.
            </p>
          </div>

          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={100}
              autoComplete="off"
              placeholder="p. ej. miguel.torres@zf.com"
              className="py-2"
            />
          </div>

          <div>
            <Label htmlFor="payroll">Número de nómina</Label>
            <Input
              id="payroll"
              value={payroll}
              onChange={e => setPayroll(e.target.value)}
              maxLength={20}
              autoComplete="off"
              placeholder="p. ej. 123456"
              className="py-2"
            />
            <p className="mt-1 text-xs text-text-faint">{CONTACT_HINT}</p>
          </div>
        </div>

        {error && <div className="mt-4"><StatusMessage error={error} /></div>}

        <Button type="submit" size="lg" className="mt-6" variant="primary" disabled={!isValid || submitting}>
          {submitting ? 'Creando…' : 'Crear usuario'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        ¿Ya estás registrado?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">Inicia sesión</Link>
      </p>
    </PageContainer>
  );
}