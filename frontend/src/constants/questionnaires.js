import { History, ListChecks, SquarePen } from 'lucide-react';
import { ROLES } from './roles.js';

// Cards of the home page: where each role starts from
export const HOME_OPTIONS = [
  {
    key: 'manitas',
    title: 'Cuestionario Manitas!',
    description: 'Formulario para obtener los datos "Manitas".',
    Icon: SquarePen,
    to: '/formulario',
    roles: [ROLES.ADMIN],
  },
  {
    key: 'record',
    title: 'Mis respuestas',
    description: 'Las manitas que has registrado o tienes a cargo como champion.',
    Icon: History,
    to: '/historial',
    actionLabel: 'Ver mis manitas',
    roles: [ROLES.USER],
  },
  {
    key: 'clues',
    title: 'Seguimiento',
    description: 'El avance de todas las manitas, entre su fecha de creación y su vencimiento.',
    Icon: ListChecks,
    to: '/seguimiento',
    actionLabel: 'Ver el seguimiento',
    roles: [ROLES.USER],
  },
];
