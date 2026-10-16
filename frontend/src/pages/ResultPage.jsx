import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { Mail } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import Avatar from '../components/chat/Avatar.jsx';
import Button from '../components/Button.jsx';
import { PANEL } from '../constants/styles.js';
import { flattenQuestions, formatAnswer, formatComputed, shownQuestions } from '../utils/answers.js';
import { championMail, copyRichText, downloadEml, loadLogoPng } from '../utils/championMail.js';
import zfLogo from '../assets/ZF_logo.svg';
import { useAuth } from '../hooks/useAuth.js';

const ACCOUNT_FIELD_LABELS = { payroll: 'número de nómina', email: 'correo electrónico' };

export default function ResultPage() {
  // Filled by ChatPage after sending; missing when the page is opened directly or reloaded
  const { form, response } = useLocation().state ?? {};
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [logo, setLogo] = useState(null);   // the ZF logo as a PNG, for the copied message

  useEffect(() => {
    let active = true;
    loadLogoPng(zfLogo).then(png => { if (active) setLogo(png); }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (!form || !response) {
    return <Navigate to="/" replace />;
  }

  const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
  const details = [
    ...shownQuestions(flattenQuestions(form), byKey).map(q => [q.key, q.text, formatAnswer(q, byKey.get(q.key))]),
    ...response.computed.map(c => [c.key, c.text, formatComputed(c.value)]),
  ];

  const { champion } = response;
  const mail = champion && championMail({
    form, response, champion, sender: user.name, trackingUrl: `${window.location.origin}/seguimiento`, logo,
  });

  // The draft with the ZF format: a mail file that Outlook opens ready to be sent
  function openDraft() {
    downloadEml(mail.eml, mail.fileName);
    setDownloaded(true);
  }

  // Outlook web cannot receive the format in its link: the message is copied, to be pasted there
  function openOutlookWeb() {
    setCopied(copyRichText(mail.html, mail.text));
    window.open(mail.compose, '_blank', 'noopener');
  }

  return (
    <PageContainer>
      <div className={`p-8 ${PANEL}`}>
        <div className="flex flex-col items-center">
          <Avatar size={42} />
          <p className="mt-3 text-center text-sm font-semibold text-zf-blue">{form.title}</p>
        </div>

        <p className="mt-6 text-center text-xl font-semibold text-accent">Respuesta registrada</p>
        {/* Data of the form saved in an account that did not have it (e.g. the payroll number) */}
        {response.completedAccounts?.map(({ name, field }) => (
          <p key={`${name}-${field}`} role="status" className="mt-2 text-center text-xs text-text-muted">
            Se guardó el {ACCOUNT_FIELD_LABELS[field] ?? field} en la cuenta de {name}.
          </p>
        ))}

        <dl className="mt-8 border-t border-white/60 text-sm">
          {details.map(([key, label, value]) => (
            <div key={key} className="border-b border-white/40 py-2">
              <dt className="text-xs text-text-muted">{label}</dt>
              <dd className="mt-0.5 whitespace-pre-line font-medium text-text">{value}</dd>
            </div>
          ))}
        </dl>

        {mail && (
          <div className="mt-8">
            <Button variant="primary" size="lg" onClick={openDraft}>
              <Mail size={16} /> Avisar al champion por correo
            </Button>
            {downloaded ? (
              <p role="status" className="mt-2 rounded-control border border-success/25 bg-success/10 p-3 text-center text-xs text-text">
                Se descargó el correo. Ábrelo desde las descargas del navegador: Outlook lo muestra ya escrito, con el
                formato de ZF, listo para <strong>Enviar</strong>.
              </p>
            ) : (
              <p className="mt-2 text-center text-xs text-text-muted">
                {champion.email
                  ? `Descarga un correo para ${champion.name} (${champion.email}) con el formato de ZF. Al abrirlo, Outlook lo muestra listo para enviar.`
                  : `Descarga un correo con el formato de ZF. ${champion.name} no tiene correo registrado: escribe el destinatario al abrirlo.`}
              </p>
            )}
            <p className="mt-1 text-center text-xs text-text-muted">
              ¿Usas Outlook web?{' '}
              <button type="button" onClick={openOutlookWeb} className="font-medium text-accent hover:underline">
                {copied ? 'Mensaje copiado: pégalo con Ctrl + V' : 'Abrirlo ahí y pegar el mensaje'}
              </button>
              {' · '}
              <a href={mail.plainWeb} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                Texto simple
              </a>
            </p>
          </div>
        )}

        <Button as={Link} to="/formulario" size="lg" className={mail ? 'mt-3' : 'mt-8'} variant={mail ? 'default' : 'primary'}>
          Registrar otra manita
        </Button>

        <Button as={Link} to="/" size="lg" className="mt-3">
          Volver al inicio
        </Button>
      </div>
    </PageContainer>
  );
}
