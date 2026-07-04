# Toy Company

Storefront for Toy Company (toycompany.store) — trending RC cars, drones,
model kits, and collectibles for hobbyists. Built with Next.js 16 (App
Router), Prisma 7 + Postgres, Auth.js, Tailwind v4, and shadcn/ui.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19.2)
- **Database**: PostgreSQL via Prisma ORM 7 (driver adapter: `@prisma/adapter-pg`)
- **Auth**: Auth.js v5 — email/password (credentials) + Google OAuth
- **Styling**: Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- **Payments**: Razorpay (wired in Phase 3)
- **Images**: Cloudinary (wired in Phase 4)
- **Email**: Resend (wired in Phase 6)
- **Hosting**: Vercel + Neon Postgres

## Prerequisites

- Node.js 20+ (LTS)
- A Postgres database — [Neon](https://neon.tech) is the recommended free
  option and matches our production target

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example file and fill in real values:

   ```bash
   cp .env.example .env
   ```

   At minimum for local dev you need:
   - `DATABASE_URL` — from your Neon project (use the **pooled connection**
     string, Project → Connection Details)
   - `AUTH_SECRET` — generate with `npx auth secret`

   Razorpay, Cloudinary, and Resend keys aren't required until their
   respective phases (checkout, image upload, email) are implemented, but
   the env var names are reserved now so config doesn't change later.

3. **Run database migrations**

   ```bash
   npx prisma migrate dev --name init
   ```

   This creates all tables (users, products, orders, categories, etc.) per
   `prisma/schema.prisma`.

4. **Seed sample data**

   ```bash
   npx prisma db seed
   ```

   This creates:
   - 5 categories (RC Cars, RC Drift Cars, Drones, Model Kits, Collectibles)
   - 8 sample products with variants and placeholder images
   - A `WELCOME10` coupon and one homepage banner
   - Two test accounts:
     - **Admin**: `admin@toycompany.store` / `Admin@12345` (role `SUPER_ADMIN`)
     - **Customer**: `customer@example.com` / `Customer@12345` (role `CUSTOMER`)

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Useful commands

| Command                      | Purpose                                    |
| ----------------------------- | ------------------------------------------- |
| `npm run dev`                 | Start dev server (Turbopack)                |
| `npm run build`               | Production build + type check               |
| `npx prisma studio`           | Browse/edit database in a GUI               |
| `npx prisma migrate dev`      | Create + apply a new migration              |
| `npx prisma generate`         | Regenerate the Prisma client after schema changes |
| `npx prisma db seed`          | Re-run the seed script                      |

## Project structure

```
prisma/schema.prisma       Database schema (source of truth)
prisma/seed.ts             Sample data for local development
prisma.config.ts           Prisma 7 CLI config (datasource URL, migrations)
src/app/(storefront)/      Public site — home, login, register, etc.
src/app/admin/             Role-gated admin dashboard
src/app/api/               Route handlers (auth, webhooks)
src/components/ui/         shadcn/ui primitives
src/components/storefront/ Storefront-specific components (header, footer, forms)
src/lib/                   Prisma client, Auth.js config, validation schemas
src/server/actions/        Server actions (mutations), grouped by domain
src/proxy.ts               Next.js 16 middleware equivalent — gates /admin/*
```

## Notes on the stack

- **Prisma 7** requires a driver adapter (`@prisma/adapter-pg`) and moved
  the datasource `url` out of `schema.prisma` into `prisma.config.ts`. The
  generated client lives at `src/generated/prisma` (gitignored) — always
  run `npx prisma generate` after pulling schema changes.
- **Next.js 16** renamed `middleware.ts` to `proxy.ts` (`src/proxy.ts` here)
  and its default export to `proxy`. It gates `/admin/*` routes by role.
- **shadcn/ui** in this project is generated on Base UI, not Radix. Use the
  `render` prop instead of `asChild` for polymorphic components (e.g.
  `<Button render={<Link href="/x" />}>Text</Button>`).

## Deployment

Target is Vercel (frontend) + Neon (Postgres). Set the same environment
variables from `.env.example` in the Vercel project settings, and point
`DATABASE_URL` at your Neon production branch.
