# NFC Konekt — Digital Business Card Platform

<p align="center">
  <img src="src/app/NFC Konekt Logo.jfif" alt="NFC Konekt Logo" width="120" />
</p>

**NFC Konekt** is a full-stack digital business card platform that replaces traditional paper cards with NFC-powered smart cards. Users create rich online profiles, link them to physical NFC cards, and share contact information instantly with a single tap — no app required for the recipient.

---

## ✨ Key Features

### 🪪 Digital Profiles
- Create and customize professional profiles with contact info, bio, job title, company details, and social media links.
- Each user gets a unique shareable URL (`/p/your-name`) that works as a standalone digital business card.
- Visitors can download your contact as a **VCard (.vcf)** file with one click.

### 📱 NFC Card Integration
- Link physical NFC-enabled cards to your digital profile.
- Tap the card on any smartphone → the recipient's browser opens your profile page automatically.
- **NFC Writer Tool** for admins and corporate leads to program cards directly from the dashboard.

### 🏢 Corporate Team Management
- **Corporate Plan** supports 10+ team members with expandable capacity (expansion packs of 10).
- Corporate admins manage team profiles, visibility settings, and NFC cards from a centralized dashboard.
- Team members inherit company branding (name, logo, scope, speciality) from the admin account.
- Public corporate profile pages display the full team roster with connect buttons.

### 💳 Subscription & Payments
- **Personal Plan**: 1 user, 2 cards, basic analytics, contact management.
- **Corporate Plan**: 10 base users, admin dashboard, NFC writer tool, team expansion.
- Flexible durations: Monthly, 6 Months, or Yearly.
- Integrated **Midtrans** payment gateway (Snap checkout) with real-time webhook processing.
- Promo code system with percentage and fixed-amount discounts.

### 📊 Analytics & History
- Dashboard stats: scans made, scans received, contacts saved, conversion rate.
- Full scan history with two views: "Scanned by Me" and "Scanned by Others."
- Recent activity feed showing the latest profile interactions.

### 🤝 Networking
- **Connections**: One-tap connect with other NFC Konekt users via their card slug.
- **Contacts**: Personal address book — add contacts manually or auto-fill from NFC card scans.
- Search and filter connections by name, email, company, or job title.

### 🎨 Theming
- 4 built-in themes: Light, Dark, Custom (Teal), and Pastel (Purple).
- Theme-aware design across all pages using `next-themes`.

### 🛡️ Admin Dashboard
- User management: view, lock/unlock accounts.
- Plan & pricing management.
- Transaction tracking with shipment status updates and tracking links.
- Promo code CRUD (create, toggle, edit, delete).
- Global NFC writer tool for programming any card in the system.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.1 (App Router, React 19, TypeScript 5) |
| Styling | Tailwind CSS v4.1 via `@tailwindcss/postcss` |
| Database | MySQL via Prisma ORM v6.4 |
| Auth | JWT (`jose`) — httpOnly cookie + Bearer token |
| Payments | Midtrans Snap + Core API |
| Icons | Font Awesome v7.1 |
| AI | OpenAI SDK v6 |
| Package Manager | pnpm v10 (workspace mode) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10
- **MySQL** database

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/nfc_konekt.git
cd nfc_konekt

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, JWT secret, Midtrans keys, etc.

# Generate Prisma client & run migrations
pnpm dlx prisma generate
pnpm dlx prisma migrate dev

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET_KEY` | Secret for signing JWTs (use ≥32 bytes random) |
| `SESSION_SECRET` | Session encryption key |
| `CRON_SECRET` | Secret for cron endpoint protection |
| `MIDTRANS_SERVER_KEY` | Midtrans server key (sandbox or production) |
| `OPENAI_API_KEY` | OpenAI API key (optional, for AI features) |

---

## 📁 Project Structure

```
src/
├── app/           # Next.js App Router (pages + API routes)
├── features/      # Feature-scoped UI components (14 feature modules)
├── components/    # Reusable UI primitives & layout shells
├── actions/       # Server Actions (18 files)
├── services/      # Business logic layer (11 service classes)
├── lib/           # Infrastructure utilities (auth, prisma, midtrans, vcard)
├── config/        # App constants (plans, designs, card layouts)
└── types/         # TypeScript type declarations
```

> For a comprehensive architecture guide, see [CLAUDE.md](CLAUDE.md).

---

## 📜 Available Scripts

```bash
pnpm dev                        # Start development server
pnpm build                      # Production build
pnpm start                      # Start production server
pnpm lint                       # Run ESLint
pnpm dlx prisma generate        # Regenerate Prisma Client
pnpm dlx prisma migrate dev     # Run database migrations
pnpm dlx prisma studio          # Open Prisma Studio (DB GUI)
```

---

## 📄 License

This project is proprietary software developed for NFC Konekt.

---

<p align="center">
  Built with ❤️ using Next.js, Prisma, and NFC technology
</p>
