# Room Finder

Room Finder is a production-style student rental marketplace focused on Ranchi, Jharkhand. It includes a professional landing page, student experience, owner dashboard, admin dashboard, JWT-based authentication, room search, favourites, map integration, reviews, inquiries, reports and analytics.

## Features

- Student room discovery and advanced filters
- Owner listing management with pending approval workflow
- Separate admin dashboard and role-based authorization
- JWT authentication and password hashing
- MongoDB + Mongoose data layer
- Room comparison and favorites
- Map view with Leaflet and OpenStreetMap
- Enquiries, visit requests, reviews and reports
- Notification and activity log flow
- Realistic Ranchi demo data for 10+ room listings

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Auth: JWT, bcryptjs
- Map: Leaflet, React Leaflet, OpenStreetMap
- Charts: Recharts

## Folder Structure

```text
room-finder/
├─ backend/
│  ├─ config/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ utils/
│  ├─ .env
│  ├─ .env.example
│  ├─ package.json
│  └─ server.js
├─ frontend/
│  ├─ src/
│  ├─ .env.local
│  ├─ package.json
│  └─ ...
├─ README.md
├─ package.json
└─ .gitignore
```

## Local Setup

1. Install dependencies from the project root:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

2. Create `.env` in the backend root from `.env.example` and set values.

3. Start backend:

```bash
cd backend
npm run dev
```

4. Start frontend:

```bash
cd frontend
npm run dev
```

5. Open `http://localhost:3000`.

## Environment Variables

Backend `.env`:

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=roomfinder-dev-secret-key
CLIENT_URL=http://localhost:3000
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## MongoDB Setup

- Local MongoDB: add your connection string to `MONGODB_URI`.
- If left blank, the backend falls back to an in-memory MongoDB server for local development.

## Admin Login

Use the seeded admin credentials:

- Email: `admin@roomfinder.local`
- Password: `Admin@123`

> These are development/demo credentials and must be replaced in production.

## Demo Accounts

- Student: `student@roomfinder.local` / `Student@123`
- Owner: `owner@roomfinder.local` / `Owner@123`
- Admin: `admin@roomfinder.local` / `Admin@123`

## Authentication Flow

- User registers via `/api/auth/register`
- User signs in via `/api/auth/login`
- JWT is returned and must be sent in the `Authorization` header as `Bearer <token>`
- Private routes use middleware to protect and authorize roles

## Role-Based Authorization

- Student: browse listings, favorites, inquiries, reviews
- Owner: add/update listings, manage enquiries and visits
- Admin: moderate listings, users, reports and verification

## Important Architecture Decisions

- Separate frontend and backend projects for cleaner scaling
- In-memory MongoDB fallback for local development and demos
- Pending approval for owner listings before public visibility
- Verification workflow for owners controlled by admin
- REST-based API structure for maintainability and interview readiness

## Deployment

- Vercel for frontend
- Render / Railway / VPS for backend
- MongoDB Atlas for production database
- Use secure `JWT_SECRET`, environment variables and production credentials

## Interview Questions

1. How did you separate roles and route protection?
2. Why use a MongoDB memory server fallback during local development?
3. How does the approval workflow work for owner listings?
4. How is room search filtered and sorted in the API?
5. Why is JWT used with protected middleware and not client-side role trust?

## Common Errors and Solutions

- If backend cannot start: ensure Node dependencies are installed and `.env` file exists.
- If MongoDB fails: check `MONGODB_URI` or allow the in-memory fallback.
- If frontend cannot reach API: confirm `NEXT_PUBLIC_API_URL` matches backend port.
- If build fails: run `npm run build` in `frontend` and fix TypeScript or ESLint warnings.
