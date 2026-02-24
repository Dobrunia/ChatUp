# ChatUp MVP

ChatUp is a modern, real-time messaging application. It relies on a strong architecture focused on a single source of truth (Prisma), separated layers, and a type-safe RPC API.

## 🛠 Local Development & Testing

You will need **Node.js** and **Docker** installed.

### 1. Start the Local Database
Run the MySQL database container in the background:
```bash
docker-compose up -d
```
*This exposes a MySQL 8.0 database at `localhost:3306` with credentials matching our defaults (`chatup_dev`).*

### 2. Configure Environment Variables
You need `.env` files for both the frontend and backend.
- **Windows (PowerShell):**
  - Backend: `Copy-Item backend/.env.example backend/.env`
  - Frontend: `Copy-Item frontend/.env.example frontend/.env`
- **macOS/Linux:**
  - Backend: `cp backend/.env.example backend/.env`
  - Frontend: `cp frontend/.env.example frontend/.env`

*(The fallback values in the backend defaults will work perfectly with the local Docker database)*

### 3. Install Dependencies
Install packages for the entire monorepo from the root directory:
```bash
npm install
```

### 4. Run Migrations
Apply the initial Prisma schema to the Docker MySQL database:
```bash
npm run db:migrate --workspace=backend
```

### 5. Start the Application
Start servers in two separate terminals (recommended):

- **Terminal 1 (Backend):**
```bash
npm run dev --workspace=backend
```

- **Terminal 2 (Frontend):**
```bash
npm run dev --workspace=frontend
```

- **Frontend** runs at `http://localhost:5173`
- **Backend API** runs at `http://localhost:3000`

---

## 🚀 Releasing to Production

Deploying the app to a production environment requires a few critical changes. Both local and production environments use a remote S3 for file storage, but the database handling and code serving change.

### 1. Managed Database (MySQL)
- **Do not** use the `docker-compose.yml` for your production database.
- Provision a managed MySQL 8.0 instance (e.g. AWS RDS, Yandex Managed Service for MySQL).
- Apply migrations via your CI/CD pipeline using: `npx prisma migrate deploy`.

### 2. Cloud Storage (S3)
- Create an Object Storage bucket (e.g. Yandex Cloud S3).
- **CRITICAL:** Configure CORS on your bucket to allow direct `PUT` uploads from your frontend domain.
- Supply the `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and `S3_BUCKET` in your production backend environment.

### 3. Backend Deployment
- Set `NODE_ENV=production`.
- Supply a highly secure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Supply the proper `DATABASE_URL` pointing to your managed MySQL instance.
- Build the backend using `npm run build --workspace=backend`.
- Run the compiled node application via PM2, Docker, or a platform like Render/Heroku: `node dist/index.js`.

### 4. Frontend Deployment
- Ensure `VITE_API_URL` and `VITE_WS_URL` point to your deployed backend domain (e.g. `https://api.yourdomain.com/trpc` and `wss://api.yourdomain.com`).
- Build the static assets: `npm run build --workspace=frontend`.
- Host the `frontend/dist` folder on a CDN or static host provider (Vercel, Netlify, Nginx, AWS CloudFront).
