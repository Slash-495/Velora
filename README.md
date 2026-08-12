# 🚀 Velora — AI-Powered Career Intelligence & Resume Studio

**Velora** is an all-in-one AI career workspace designed to accelerate your job search. It seamlessly combines an intelligent ATS Resume Studio, Job Application Tracker, Interactive Mock Interview Simulator, Company Research Library, and dynamic GitHub-style Career Activity Analytics.

---

## ✨ Key Features

### 📄 AI Resume Studio & Builder
- **Real-Time ATS Scoring**: Analyze resume content against industry standards with live feedback.
- **Job Description Tailoring**: Automatically align bullet points, skills, and summary for target roles using Google Gemini AI.
- **Custom Themes & Templates**: Clean, modern resume layouts exportable to PDF (`html2pdf.js`).
- **Interactive Section Editor**: Real-time side-by-side live preview and editing for Experience, Education, Projects, and Skills.

### 📊 Job Application Tracker
- **Kanban Pipeline**: Track applications across statuses: `Wishlist`, `Applied`, `OA (Online Assessment)`, `Interview`, `Offer`, and `Rejected`.
- **Linked Resume Ecosystem**: Associate specific tailored resumes with job applications.
- **Deadline & Salary Tracking**: Set application submission dates, OA deadlines, salary ranges, and custom notes.

### 🔥 Dynamic Activity Timeline & Career Heatmap
- **18-Month Career Heatmap**: A GitHub-style contribution grid mapping your application submissions, assessments, interviews, and job offers.
- **Reactive Activity Stream**: Real-time timeline connected dynamically to job tracking, daily focus goals, and resume updates.

### 🎙️ AI Interview Prep & Mock Simulator
- **Interactive AI Screening Calls**: Real-time conversational technical and behavioral interview practice.
- **Voice Synthesis & Evaluation**: Practice answering questions with instant AI feedback on technical depth, clarity, and missing concepts.

### 📝 AI Cover Letter & Company Research
- **Instant Cover Letter Generation**: Produce personalized cover letters tailored to company context and desired tone.
- **Company Intelligence Workspace**: Research company tech stacks, culture, and interview red flags powered by AI.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/), Custom Design Tokens & Dark Mode
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini SDK)
- **Authentication & Database**: [Supabase Auth & SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
- **PDF Generation**: `html2pdf.js`

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: v18.17.0 or higher
- **npm** / **yarn** / **pnpm**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/velora.git
cd velora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and set the following credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key

# Site URL (Optional for OAuth callback)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3002`) in your browser to explore Velora.

---

## 📁 Project Structure

```text
Velora/
├── app/                        # Next.js App Router Pages & API Routes
│   ├── (auth)/                 # Sign In, Sign Up, & Auth Server Actions
│   ├── api/                    # AI API Routes (Analyze, Tailor, Review, Interview Chat)
│   ├── dashboard/              # Main User Dashboard Workspace
│   │   ├── applications/       # Job Application Kanban Tracker
│   │   ├── career-tracks/      # Target Career Tracks
│   │   ├── company-research/   # Company Intelligence Workspace
│   │   ├── interview-prep/     # AI Mock Interview Simulator
│   │   ├── profile/            # User Settings & Profile
│   │   ├── resume-review/      # AI Resume Checker & Reviewer
│   │   └── resume-studio/      # Live Resume Editor & Template Customizer
│   └── page.tsx                # Landing Page
├── components/                 # React UI Components
│   ├── analytics/              # Career Activity Heatmap
│   ├── auth/                   # SignIn & SignUp Forms
│   ├── dashboard/              # Sidebar, Topbar, & Widgets
│   ├── ui/                     # Navbar, Footer, Buttons, Modals
│   └── resume-builder/         # Resume Studio Editor & Templates
├── hooks/                      # Custom React Hooks (useAuth, useDebounce)
├── lib/                        # Mock Data & Local Data Persistence Store
└── utils/                      # Supabase Client & Server Utilities
```

---

## 📜 Available Scripts

- `npm run dev` — Launch the Next.js development server.
- `npm run build` — Create an optimized production build.
- `npm run start` — Start the Next.js production server.
- `npm run lint` — Run ESLint checks.

---

## 🔒 Session & Security

- **Persistent Sessions**: Configured with 7-day session cookies and browser storage persistence.
- **Protected Routes**: Navigation handlers verify active user sessions before granting workspace access.
- **Graceful Error Boundaries**: Robust fallback handlers across all AI API endpoints to eliminate HTTP 500 errors.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
