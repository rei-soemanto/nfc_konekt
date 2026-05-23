# NFC Konekt — Digital Business Card Platform

<p align="center">
  <img src="src/app/NFC Konekt Logo.jfif" alt="NFC Konekt Logo" width="120" />
</p>

**NFC Konekt** is a full-stack digital business card platform that replaces traditional paper cards with NFC-powered smart cards. Users create rich online profiles, link them to physical NFC cards, and share contact information instantly with a single tap — no app required for the recipient.

---

## ✨ Key Features

### 🪪 Digital Profiles
- Create and customize professional profiles with contact info, bio, job title, company details, and social media links.
- Each user gets a unique shareable URL that works as a standalone digital business card.
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