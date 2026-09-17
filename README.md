# Backend — Baby Shower de Nohan

API de la invitación web del baby shower de **Nohan**. Identifica al invitado por celular, muestra la lista de regalos según sea familia o amigos, permite confirmar asistencia y reservar un regalo. El panel administrativo ve quién asiste y quién eligió cada regalo.

---

## Tecnologías

| Paquete | Uso |
|---|---|
| `@nestjs/core` + `@nestjs/common` | Framework principal |
| `@nestjs/platform-fastify` | Adaptador Fastify |
| `@nestjs/config` | Variables de entorno |
| `@nestjs/mongoose` + `mongoose` | MongoDB Atlas |
| `bcryptjs` | Hash de la contraseña del administrador |
| `jsonwebtoken` | JWT del panel admin |
| `uuid` | Token de sesión de cada invitado |

---

## Cómo funciona

1. Hay **un solo enlace** para todos. El invitado entra su número de celular.
2. El backend encuentra su **grupo**. Si no tiene número propio, usa el de alguien del grupo (pareja o familiar).
3. Elige su nombre dentro del grupo.
4. Ve solo los regalos de su tipo:
   - **Familia** → regalos costosos
   - **Amigos** → regalos económicos
5. Confirma si **asiste o no**.
6. Su grupo puede **reservar un solo regalo**. Si otro invitado lo tomó primero, la reserva atómica responde conflicto.

La **Cuna Cama** ya está reservada. Los invitados no la ven. En el panel admin aparece como reservada, sin nombre.

---

## Estructura del proyecto

```
src/
├── main.ts
├── app.module.ts
├── health/
├── shared/          # esquemas Mongo, guards JWT y de invitado
├── seed/            # invitados, regalos y datos del evento
├── invite/          # API pública de la invitación
└── admin/           # panel del dueño
```

---

## API

Todos los endpoints van bajo el prefijo `/api`.

### Público

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Ping para despertar el servidor |
| `GET` | `/api/event` | Datos de la invitación (fecha, dirección, textos) |
| `POST` | `/api/invite/identify` | Busca el grupo por `{ phone }` |
| `POST` | `/api/invite/session` | Elige persona del grupo `{ phone, guestId }` y devuelve `token` |

### Invitado — header `x-guest-token`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/invite/me` | Sesión, grupo, asistencia y regalos |
| `PATCH` | `/api/invite/attendance` | `{ attending: true \| false }` |
| `POST` | `/api/invite/gifts/:giftId/reserve` | Reserva atómica del regalo |
| `POST` | `/api/invite/gifts/:giftId/release` | Libera el regalo de su grupo |

### Admin — header `Authorization: Bearer <token>`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/admin/login` | `{ email, password }` → JWT (8 horas) |
| `GET` | `/api/admin/overview` | Contadores de asistencia y regalos |
| `GET` | `/api/admin/groups` | Lista todos los grupos (incluye vacíos) para asignar invitados |
| `POST` | `/api/admin/groups` | Crea un grupo `{ name, type, key? }` |
| `PATCH` | `/api/admin/groups/:groupKey` | Edita nombre o tipo del grupo |
| `DELETE` | `/api/admin/groups/:groupKey` | Elimina un grupo vacío |
| `GET` | `/api/admin/guests` | Checklist de invitados agrupados |
| `POST` | `/api/admin/guests` | Crea un invitado `{ name, type, phone?, groupKey?, groupName? }` |
| `PATCH` | `/api/admin/guests/:guestId` | Edita nombre, celular, tipo o grupo |
| `DELETE` | `/api/admin/guests/:guestId` | Elimina un invitado |
| `PATCH` | `/api/admin/guests/:guestId/attendance` | Marca asistencia (`true`, `false` o `null`) |
| `GET` | `/api/admin/gifts` | Catálogo completo, con quién reservó cada uno |
| `POST` | `/api/admin/gifts/:giftId/release` | Libera un regalo (no aplica a la Cuna Cama) |

---

## Variables de entorno

Crea un archivo `.env` en la raíz (puedes copiar `.env.example`):

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/baby_shower_nohan
PORT=3000
JWT_SECRET=cambia_este_secreto_en_produccion
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@horusautomation.com
ADMIN_PASSWORD=admin2026
```

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión de MongoDB Atlas |
| `PORT` | Puerto del servidor (por defecto `3000`) |
| `JWT_SECRET` | Secreto para firmar el JWT del admin |
| `FRONTEND_URL` | Origen(es) permitidos en CORS, separados por coma |
| `ADMIN_EMAIL` | Correo del administrador (solo se usa al crear el seed) |
| `ADMIN_PASSWORD` | Contraseña del administrador (solo se usa al crear el seed) |

---

## Instalación y ejecución

```bash
npm install
npm run start:dev
```

El servidor levanta en `http://localhost:3000/api`.

Al iniciar por primera vez, si las colecciones están vacías, se cargan invitados, regalos y la cuenta admin.

- **Correo:** el de `ADMIN_EMAIL` (por defecto `admin@horusautomation.com`)
- **Contraseña:** la de `ADMIN_PASSWORD` (por defecto `admin2026`)

Cambia estos valores **antes** del primer arranque en producción. El seed no pisa un admin que ya exista.

---

## Despliegue

| Pieza | Dónde |
|---|---|
| Base de datos | MongoDB Atlas |
| Backend | Render (`npm run build` + `npm start`) |
| Frontend | Vercel |

En Render configura las mismas variables del `.env`. El `PORT` lo asigna Render; el servidor ya escucha en `0.0.0.0`.

### MongoDB Atlas desde Render

Render no tiene una IP fija en el plan gratuito. Si Atlas solo permite tu IP de casa, el deploy falla con `MongooseServerSelectionError` y Render reporta *No open ports detected* porque Nest no llega a abrir el puerto hasta conectar a Mongo.

En Atlas:

1. **Network Access** → **Add IP Address**
2. Elige **Allow Access from Anywhere**: `0.0.0.0/0`
3. Confirma que el usuario de **Database Access** coincide con el de `MONGODB_URI`
4. Si la contraseña tiene caracteres especiales (`@`, `#`, `/`, `%`), encódalos en la URI (`@` → `%40`)

URI de ejemplo:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/baby-shower
```

---

## Clasificación de regalos

**Costosos (familia):** Mecedora / silla vibradora, Monitor de seguridad, Pañalera cambiador, Colchón antirreflujo, Esterilizador de tetero, Olla hervidora, Cambiador portátil.

**Económicos (amigos):** Kit de Aseo + semanario, Cobija, Termo, Lámpara baja intensidad, Abanico recargable, Ropita 3-6 meses, Juguetes estimulación, Almohada lactancia, Kit baño bebé.

**Oculto:** Cuna Cama (reservada, sin nombre).
