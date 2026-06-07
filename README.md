# Taska

A full-stack task manager built as a monorepo:

- **frontend/** - Vue 3 + Vite + Tailwind CSS (Pinia, Vue Router, Axios)
- **backend/** - Node.js + Express + MySQL (JWT auth, bcrypt, express-validator)

Users can register, log in, and manage their personal todo list (create, complete/incomplete, delete) behind JWT-protected routes.

---

## Project structure

```
taska/
├── frontend/          # Vue 3 app
├── backend/           # Node.js Express app
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [MySQL](https://www.mysql.com/) 8+ running locally

---

## 1. Database setup

The schema lives in `backend/taska.sql`. It creates the `taska` database plus the `users` and `todos` tables.

**macOS / Linux (bash):**

```bash
mysql -u root -p < backend/taska.sql
```

**Windows (PowerShell)** - PowerShell does not support the `<` operator, so use one of these:

```powershell
Get-Content backend/taska.sql | mysql -u root -p
# or
mysql -u root -p -e "source backend/taska.sql"
```

Or from inside a MySQL shell (any OS):

```sql
SOURCE D:/Dev-Ops/Taska/backend/taska.sql;
```

### Migrations (existing databases)

If you already created the database with an earlier schema, apply the
incremental migrations in `backend/migrations/` instead of re-importing
`taska.sql` (which would not alter existing tables). They are additive and
safe to re-run:

```powershell
Get-Content backend/migrations/002_task_fields.sql | mysql -u root -p taska
```

`002_task_fields.sql` adds `priority`, `due_date`, and `updated_at` to `todos`.

---

## 2. Backend setup

```bash
cd backend
npm install
```

Edit `backend/.env` with your MySQL credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=taska
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

Run the API:

```bash
npm run dev     # with auto-reload (nodemon)
# or
npm start       # plain node
```

The API runs at `http://localhost:5000`. Health check: `GET http://localhost:5000/api/health`.

### API endpoints

| Method | Endpoint             | Auth | Description        |
| ------ | -------------------- | ---- | ------------------ |
| POST   | `/api/auth/register` | No   | Register a user    |
| POST   | `/api/auth/login`    | No   | Log in a user      |
| GET    | `/api/todos`         | Yes  | List user's todos  |
| POST   | `/api/todos`         | Yes  | Create a todo      |
| PUT    | `/api/todos/:id`     | Yes  | Update a todo      |
| DELETE | `/api/todos/:id`     | Yes  | Delete a todo      |

A todo has these fields: `title` (required), `description`, `priority`
(`low` \| `medium` \| `high`, default `medium`), `due_date` (`YYYY-MM-DD` or
null), `is_completed`, plus `created_at` / `updated_at`. `POST` and `PUT`
accept `title`, `description`, `priority`, `due_date`, and `is_completed`.

All responses use a consistent shape:

```json
{ "success": true, "message": "", "data": {} }
```

Authenticated requests must send the token: `Authorization: Bearer <token>`.
JWTs expire in **7 days**; passwords are hashed with **bcryptjs**.

---

## 3. Frontend setup

```bash
cd frontend
npm install
```

`frontend/.env` points the app at the API:

```
VITE_API_URL=http://localhost:5000/api
```

Run the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

### Pages

- `/register` - create an account
- `/login` - sign in
- `/dashboard` - protected todo CRUD page (redirects to `/login` if not authenticated)

---

## 4. Running both locally

Open two terminals:

```bash
# Terminal 1 - backend
cd backend
npm run dev

# Terminal 2 - frontend
cd frontend
npm run dev
```

Then visit `http://localhost:5173`, register an account, and start adding tasks.

If you hit `EADDRINUSE` on port 5000, a previous server is still running. Free the port with:

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## Tech stack

**Frontend:** Vue 3 (Composition API), Vite, Vue Router 4, Pinia, Axios, Tailwind CSS

**Backend:** Node.js, Express, MySQL2, jsonwebtoken, bcryptjs, dotenv, cors, express-validator
