# PetProject Backend (Node/Express + SQLite)

Simple REST backend with auth and pets CRUD.

## Features
- SignUp/Login with JWT
- CRUD for Pets (per-user)
- SQLite file DB (no external services)
- Input validation with Zod

## Quick start
1. Copy env:
   - Duplicate `.env.example` to `.env` and adjust values (optional).
2. Install deps:
```powershell
npm install
```
3. Run dev server (auto-reload):
```powershell
npm run dev
```
Server listens on http://localhost:4000 by default.

## API
- POST /api/auth/signup { name, email, password }
- POST /api/auth/login { email, password }
- GET /api/pets
- POST /api/pets { name, type?, age? }
- GET /api/pets/:id
- PUT /api/pets/:id { name?, type?, age? }
- DELETE /api/pets/:id

Auth: send `Authorization: Bearer <token>` header for all /api/pets endpoints.

