# LevantaMano

Aplicación web para registrar «manitas» (sugerencias de mejora) mediante un formulario en forma de chat, guardar las respuestas y exportarlas a Power BI.

## Qué hace

- **Formulario tipo chat.** El usuario responde pregunta por pregunta: texto libre, opción única, opción múltiple, fecha o un usuario registrado (que se puede dar de alta ahí mismo).
- **Registro de respuestas.** Cada usuario ve su historial; los administradores ven las respuestas de todos.
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
│       ├── models/         User, Form, Response
│       ├── routes/         /api/auth, /api/users, /api/form
│       ├── seed/           form.json (definición del formulario) y seed.js
│       ├── services/       Lógica de negocio
│       └── utils/          Campos calculados y CSV
├── frontend/
│   └── src/
│       ├── api/            Llamadas al backend
│       ├── auth/           Sesión y protección de rutas
│       ├── components/     Componentes de interfaz
│       ├── constants/      Estilos y roles
│       ├── hooks/          useAuth, useFormChat
│       ├── pages/          Páginas de la aplicación
│       └── utils/          Formato de respuestas
├── DESIGN_SYSTEM.md        Guía visual
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

## Scripts

| Carpeta | Comando | Descripción |
|---------|---------|-------------|
| `backend` | `npm run dev` | Servidor con nodemon |
| `backend` | `npm start` | Servidor sin recarga |
| `backend` | `npm run seed` | Sincroniza el formulario, los índices de usuarios y el admin por defecto |
| `frontend` | `npm run dev` | Servidor de desarrollo de Vite |
| `frontend` | `npm run build` | Compilación de producción en `frontend/dist` |
| `frontend` | `npm run preview` | Sirve la compilación de producción |
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
| `/registro` | Administradores | Respuestas de todos y exportación a Power BI |
| `/usuarios` | Administradores | Gestión de usuarios y roles |

## API

Todas las rutas cuelgan de `/api`. La sesión se envía como `Authorization: Bearer <id de usuario>`.

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/health` | Público | Estado del servidor |
| POST | `/auth/login` | Público | Acceso por nombre |
| GET | `/auth/me` | Sesión | Usuario de la sesión |
| POST | `/users` | Público | Crea un usuario (nombre, correo y número de nómina) |
| PATCH | `/users/me` | Sesión | Edita el nombre, el correo, el número de nómina o el avatar propios |
| GET | `/users` | Admin | Lista de usuarios |
| GET | `/users/names` | Sesión | Nombres de los usuarios, para elegirlos en el formulario |
| PATCH | `/users/:id` | Admin | Edita el nombre, el correo, el número de nómina o si es champion |
| PATCH | `/users/:id/champion` | Sesión | Marca a un usuario como champion |
| PATCH | `/users/:id/role` | Admin | Cambia el rol de un usuario |
| GET | `/form` | Sesión | Formulario vigente |
| POST | `/form/responses` | Sesión | Guarda una respuesta |
| GET | `/form/responses` | Sesión | Manitas propias (registradas por el usuario o con él como champion); con `?scope=all`, las de todos (admin) |
| PATCH | `/form/responses/:id` | Admin | Edita las respuestas de un registro |
| GET | `/form/dashboard` | Admin | Todas las manitas, para el dashboard |
| GET | `/form/tracking` | Sesión | Todas las manitas, para la página de seguimiento (solo lectura) |
| PATCH | `/form/responses/:id/tracking` | Admin | Inicia una manita o cambia su avance |
| GET | `/form/export-key` | Admin | Clave del enlace de exportación |
| GET | `/form/responses.csv?key=…` | Clave | Todas las respuestas en CSV |

## Exportación a Power BI

1. Entra como administrador en **Registro de respuestas** (`/registro`).
2. Pulsa **Copiar enlace** en la sección «Exportar a Power BI».
3. En Power BI: **Obtener datos → Web** y pega el enlace.

El CSV tiene una fila por respuesta, de la más reciente a la más antigua, con estas columnas: `user` (quién la registró), una columna por pregunta y una por campo calculado. Los encabezados son las claves (`key`) de `form.json`. Las respuestas de opción múltiple se separan con `; `.

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
