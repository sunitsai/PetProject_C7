# Pet Manager (No-build React + Tailwind, Dark Mode)

A super-simple frontend you can open directly in a browser. Built for fast collaboration in VS Code and GitHub without Node.js tooling.

## Features

- **Login / Sign-up** (localStorage auth demo)
- **Dashboard – Pet List** (search, list)
- **Add/Edit Form** (modal)
- **Delete Pet Button**
- **Dark mode** UI with Tailwind CDN
- No backend required (uses `localStorage`), but DB schema is provided in `schema.sql`

> Demo credentials are seeded: `admin@example.com` / `admin123`

## Run locally

1. Clone or download this repo.
2. Open `index.html` in your browser (double-click) — that's it.

> For best results (and to avoid CORS issues when expanding), use a local web server:
>
> - VS Code: install **Live Server** extension → right-click `index.html` → **Open with Live Server**
> - Or Python: `python -m http.server 5173` then open `http://localhost:5173`

## Collaborate via GitHub

```bash
# inside the project folder
git init
git add .
git commit -m "Initial commit: Pet Manager (no-build React)"
git branch -M main
git remote add origin https://github.com/<your-username>/pet-manager.git
git push -u origin main
```

## Folder structure

```
pet-frontend/
├─ index.html
├─ app.js
├─ schema.sql
└─ README.md
```

## Notes

- This app uses **React & ReactDOM UMD** from unpkg and **Tailwind CDN** for simplicity.
- For production or larger apps, migrate to a proper build tool (Vite/Next) and real API.
