# LevantaMano

Aplicación web para registrar «manitas» (sugerencias de mejora) mediante un formulario en forma de chat, guardar las respuestas y exportarlas a Power BI.

## Qué hace

- **Formulario tipo chat.** Para cualquier usuario con sesión. Se responde pregunta por pregunta: texto libre, opción única, opción múltiple, fecha o un usuario registrado (que se puede dar de alta ahí mismo).
- **Registro de respuestas.** Cada manita recibe un folio consecutivo. Cada usuario ve su historial; los administradores ven las respuestas de todos.
- **Seguimiento con evidencias.** Un administrador o el champion a cargo inicia la manita y actualiza su avance (0–100 %); cada cambio guarda una evidencia con comentario y, opcionalmente, una foto.
- **Dashboard.** Gráficas de las manitas para administradores.
- **Campos calculados.** A partir de las fechas se obtienen la situación de la manita (En tiempo, Por vencer, Vence hoy, Vencida), los días transcurridos y los días para su vencimiento. Se calculan al leer, no se guardan.
- **Exportación a Power BI.** Un enlace devuelve todas las respuestas como una tabla CSV.
- **Usuarios y roles.** El acceso es solo por nombre, sin contraseña. Hay dos roles: `user` y `admin`.

## Tecnologías

| Parte | Tecnologías |
|-------|-------------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 8, lucide-react |
| Backend | Node.js, Express 5, Mongoose 9 |
| Base de datos | MongoDB |

La lista completa de requisitos y dependencias está en [requirements.txt](requirements.txt).

## Estructura

```
LevantaMano_Project/
├── backend/
│   ├── .env.example        Variables de entorno de ejemplo
│   └── src/
│       ├── server.js       Arranque: conecta a MongoDB, sincroniza el formulario y asegura un admin
│       ├── app.js          Express: middlewares y rutas
│       ├── config/         Conexión a la base de datos
│       ├── constants/      Roles
│       ├── controllers/    Manejo de las peticiones
│       ├── middlewares/    Sesión, roles y errores
│       ├── models/         User, Form, Response, Evidence, Counter
│       ├── routes/         /api/auth, /api/users, /api/form
│       ├── seed/           form.json (formulario), default_champions.json y seed.js
│       ├── services/       Lógica de negocio
│       └── utils/          Campos calculados, seguimiento y CSV
├── frontend/
│   ├── public/             Archivos que se copian tal cual a dist (icono de la pestaña)
│   └── src/
│       ├── api/            Llamadas al backend
│       ├── auth/           Sesión y protección de rutas
│       ├── components/     Componentes de interfaz
│       ├── constants/      Estilos y roles
│       ├── hooks/          useAuth, useFormChat, useLiveData
│       ├── pages/          Páginas de la aplicación
│       └── utils/          Respuestas, fechas, dashboard y correo al champion
├── DESIGN_SYSTEM.md        Guía visual
├── ecosystem.config.js     Configuración de pm2 para producción
└── requirements.txt        Requisitos y dependencias
```

## Puesta en marcha

Requisitos: Node.js 22 o superior, npm y una base de datos MongoDB (local o Atlas).

### 1. Backend

```bash
cd backend
npm install
```

Crea `backend/.env` a partir de `backend/.env.example`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor. Por defecto `3000`. | `3000` |
| `MONGO_URI` | Cadena de conexión a MongoDB. | `mongodb://localhost:27017/levantamano` |
| `FRONTEND_ORIGIN` | Origen del frontend permitido por CORS. | `http://localhost:5173` |
| `EXPORT_KEY` | Clave secreta del enlace de exportación. Sin ella la exportación queda desactivada. | cadena aleatoria larga |

Para generar una `EXPORT_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Arranca el servidor:

```bash
npm run dev      # desarrollo, con recarga automática
npm start        # producción
```

Al arrancar, el servidor guarda en la base de datos el formulario de `src/seed/form.json` y, si no existe ningún administrador, crea el usuario **Admin 01** con rol `admin`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. En desarrollo, Vite redirige `/api` a `http://localhost:3000`; si el backend usa otro puerto, cámbialo en `frontend/vite.config.js`.

Si el backend está en otra dirección, defínela en `frontend/.env` con `VITE_API_URL` (por ejemplo `VITE_API_URL=https://servidor/api`).

### 3. Primer acceso

Entra con el nombre **Admin 01**. Desde la sección de usuarios, un administrador puede cambiar el rol de los demás. Cualquier persona puede registrarse desde la pantalla de acceso con su nombre, correo electrónico y número de nómina.

## Despliegue en producción (pm2)

En producción la aplicación corre como **un solo proceso** de pm2, `manitas-data-capture`: el backend sirve la API y también la compilación del frontend (`frontend/dist`). Los usuarios la abren en `http://<servidor>:<PORT>`, con el `PORT` de `backend/.env`; es el único puerto que hay que abrir.

### Primer despliegue

Desde la raíz del proyecto:

```bash
# 1. Crea backend/.env a partir de backend/.env.example
npm ci --prefix backend --omit=dev
npm ci --prefix frontend
npm run build --prefix frontend
pm2 start ecosystem.config.js
pm2 save          # y "pm2 startup" una vez, para que vuelva a arrancar tras un reinicio del equipo
```

### Actualización

```bash
git pull
npm ci --prefix backend --omit=dev    # solo si cambiaron las dependencias del backend
npm ci --prefix frontend              # solo si cambiaron las dependencias del frontend
npm run build --prefix frontend
pm2 restart manitas-data-capture
```

- Un cambio solo del frontend queda publicado al terminar `npm run build`; el reinicio solo hace falta si cambió el backend o `backend/.env`.
- Si cambias `ecosystem.config.js`, usa `pm2 reload ecosystem.config.js --update-env` en lugar de `restart`.
- No edites nada dentro de `frontend/dist`: se regenera en cada compilación. Los archivos que deban servirse tal cual, como el icono de la pestaña, van en `frontend/public`.

Para comprobar que está en marcha: `pm2 list` y `pm2 logs manitas-data-capture`.

## Scripts

| Carpeta | Comando | Descripción |
|---------|---------|-------------|
| `backend` | `npm run dev` | Servidor con nodemon |
| `backend` | `npm start` | Servidor sin recarga |
| `backend` | `npm run seed` | Sincroniza el formulario, los índices de usuarios y el admin por defecto |
| `frontend` | `npm run dev` | Servidor de desarrollo de Vite |
| `frontend` | `npm run build` | Compilación de producción en `frontend/dist` |
| `frontend` | `npm run preview` | Sirve la compilación de producción para revisarla en local (en producción la sirve el backend) |
| `frontend` | `npm run lint` | Revisión con oxlint |

## Páginas

| Ruta | Acceso | Contenido |
|------|--------|-----------|
| `/login` | Público | Acceso por nombre |
| `/usuarios/nuevo` | Público | Registro de usuario |
| `/` | Usuarios | Inicio |
| `/formulario` | Usuarios | Formulario en forma de chat |
| `/formulario/resultado` | Usuarios | Resumen de la respuesta enviada |
| `/perfil` | Usuarios | Perfil y avatar |
| `/historial` | Usuarios | Respuestas propias |
| `/seguimiento` | Usuarios | Seguimiento y evidencias de las manitas |
| `/dashboard` | Administradores | Gráficas de las manitas |
| `/registro` | Administradores | Respuestas de todos y exportación a Power BI |
| `/usuarios` | Administradores | Gestión de usuarios y roles |

## API

Todas las rutas cuelgan de `/api`. La sesión se envía como `Authorization: Bearer <id de usuario>`.

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/health` | Público | Estado del servidor |
| POST | `/auth/login` | Público | Acceso por nombre |
| GET | `/auth/me` | Sesión | Usuario de la sesión |
| POST | `/users` | Público | Crea un usuario (nombre, correo y número de nómina). Un admin también elige el rol y puede crear un champion (`champion: true`, con su `area` y correo) |
| PATCH | `/users/me` | Sesión | Edita el nombre, el correo, el número de nómina o el avatar propios (un champion no puede cambiar su nombre) |
| GET | `/users` | Admin | Lista de usuarios |
| GET | `/users/names` | Sesión | Nombres de los usuarios, para elegirlos en el formulario |
| PATCH | `/users/:id` | Admin | Edita el nombre, el correo, el número de nómina o, de un champion, su área (los champions iniciales, con su área, vienen de `backend/src/seed/default_champions.json`) |
| DELETE | `/users/:id` | Admin | Desactiva un usuario (no el propio ni el admin predeterminado) |
| PATCH | `/users/:id/role` | Admin | Cambia el rol de un usuario |
| GET | `/form` | Sesión | Formulario vigente |
| POST | `/form/responses` | Sesión | Guarda una respuesta |
| GET | `/form/responses` | Sesión | Manitas propias (con el usuario como champion o como quien la reportó); con `?scope=all`, las de todos (admin) |
| PATCH | `/form/responses/:id` | Admin | Edita las respuestas de un registro |
| GET | `/form/dashboard` | Admin | Todas las manitas, para el dashboard |
| GET | `/form/tracking` | Sesión | Todas las manitas, para la página de seguimiento (solo lectura) |
| PATCH | `/form/responses/:id/award` | Admin | Marca una manita terminada como premiada (`{ awarded: true }`) o le quita el premio |
| PATCH | `/form/responses/:id/tracking` | Admin o champion a cargo | Inicia una manita o cambia su avance; el cambio lleva evidencia (`{ comment, image? }`), opcional para admins |
| GET | `/form/responses/:id/evidence` | Sesión | Evidencias de una manita, de la más reciente a la más antigua |
| GET | `/form/export-key` | Admin | Clave del enlace de exportación |
| GET | `/form/responses.csv?key=…` | Clave | Todas las respuestas en CSV |

## Exportación a Power BI

1. Entra como administrador en **Registro de respuestas** (`/registro`).
2. Pulsa **Copiar enlace** en la sección «Exportar a Power BI».
3. En Power BI: **Obtener datos → Web** y pega el enlace.

El CSV tiene una fila por manita, de la más reciente a la más antigua, con estas columnas:

| Columna | Clave de `form.json` | Contenido |
|---------|----------------------|-----------|
| Champion | `champion` | Champion a cargo |
| Nombre manita | `hand_name` | Nombre de la manita |
| Color | `color` | Color de la manita |
| Estatus | `status` | `Not Started`, `In Progress` o `Completed`, según su seguimiento |
| Alerta | `alert` | Situación respecto al vencimiento |
| Fecha creación | `creation_date` | Fecha de creación |
| Fecha vencimiento | `expiration_date` | Fecha de vencimiento |
| Área | `area` | Área donde se detectó |
| Dias transcurridos | `days_gone` | Días transcurridos desde la creación |
| Días para vencimiento | `expiration_days` | Días para el vencimiento |
| Descripción | — | Descripción del problema: la respuesta a la última pregunta abierta de la manita (la de su color) |

Las columnas se definen en `EXPORT_COLUMNS` (`backend/src/services/response.service.js`).

A tener en cuenta:

- **El enlace es la llave.** Power BI no puede iniciar sesión, así que el enlace lleva la `EXPORT_KEY`. Quien tenga el enlace puede leer todas las respuestas.
- **Para revocarlo**, cambia `EXPORT_KEY` en `backend/.env` y reinicia el servidor. Los enlaces anteriores dejan de funcionar.
- **El enlace usa la dirección desde la que se abre la aplicación.** Copiado en `localhost`, solo sirve para Power BI Desktop en ese mismo equipo; para la actualización programada en el servicio de Power BI, la aplicación debe estar publicada en una dirección accesible.

## Modificar el formulario

El formulario se define en `backend/src/seed/form.json`: secciones, preguntas (`open`, `single`, `multiple`, `date`) y campos calculados (`days_since`, `days_until`, `expiration_status`, siempre a partir de una pregunta de fecha).

- Si la versión actual **aún no tiene respuestas**, los cambios se aplican al reiniciar el servidor o al ejecutar `npm run seed`.
- Si **ya tiene respuestas**, incrementa `"version"` para que los cambios se apliquen. Las respuestas anteriores conservan la versión con la que se contestaron, hasta que un administrador las edita: al guardarlas pasan a la versión vigente y hay que contestar las preguntas nuevas.

## Seguridad

El acceso es solo por nombre: no hay contraseñas ni tokens firmados, y la sesión es el id del usuario. La aplicación está pensada para una red interna de confianza; no debe exponerse a internet tal cual.
