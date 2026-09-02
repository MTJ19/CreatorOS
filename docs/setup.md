# CreatorOS — Developer Setup & Installation Guide

This guide walks through setting up and running the CreatorOS development environment locally.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: `v18.0.0` or higher
- **npm** or **pnpm**
- **Git**

---

## 📥 Cloning & Repository Structure

```bash
git clone https://github.com/MTJ19/CreatorOS.git
cd CreatorOS
```

### Directory Structure:
```text
CreatorOS/
├── .github/
│   └── workflows/
│       └── deploy-docs.yml      # CI/CD GitHub Pages deployment
├── docs/                        # Project Documentation
│   ├── index.md                 # Documentation Portal Home
│   ├── architecture.md          # Multi-layer architecture
│   ├── features.md              # Feature specs & formulas
│   └── setup.md                 # Setup guide (this file)
├── journals/                    # Team Member Weekly Technical Journals
│   ├── README.md                # Journal requirements & guidelines
│   ├── TEMPLATE.md              # Standard weekly submission template
│   └── <ROLLNO>-<FIRSTNAME>/    # Member-specific journal folder
├── Frontend/
│   └── creator-dashboard/       # React + Vite application
├── Backend/                     # API & Supabase integration
└── README.md                    # Root overview
```

---

## 💻 Running the Frontend Dashboard

1. Navigate to the frontend directory:
   ```bash
   cd Frontend/creator-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in `Frontend/creator-dashboard/`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser at `http://localhost:5173`.

---

## 🧪 Testing & Verification

- **Linting & Code Quality:**
  ```bash
  npm run lint
  ```
- **Type Checking:**
  ```bash
  npx tsc --noEmit
  ```
- **Production Build:**
  ```bash
  npm run build
  ```

---

## 🚀 Publishing Documentation (GitHub Pages)

1. Ensure the `docs/` folder contains your latest markdown files.
2. Push your changes to the `main` branch.
3. In GitHub Settings:
   - Go to **Settings** > **Pages**
   - Source: **GitHub Actions** (or Deploy from branch `main` / `/docs`)
4. The deployment workflow in `.github/workflows/deploy-docs.yml` will automatically build and publish the documentation site.
