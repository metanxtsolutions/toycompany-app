import "dotenv/config";
import { PrismaClient, ProductStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { markdownToSafeHtml } from "../src/lib/markdown";
import { ROBOTS_TXT_KEY, DEFAULT_ROBOTS_TXT } from "../src/lib/site-settings";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PLACEHOLDER_IMAGE = (seed: string) =>
  `https://placehold.co/800x800/f2621a/ffffff?text=${encodeURIComponent(seed)}`;

async function main() {
  console.log("Seeding categories...");

  const rcCars = await prisma.category.upsert({
    where: { slug: "rc-cars" },
    update: {},
    create: {
      name: "RC Cars",
      slug: "rc-cars",
      description: "Off-road, drift, and race-ready remote control cars.",
      sortOrder: 1,
    },
  });

  const rcDrift = await prisma.category.upsert({
    where: { slug: "rc-drift-cars" },
    update: {},
    create: {
      name: "RC Drift Cars",
      slug: "rc-drift-cars",
      description: "Precision drift-tuned RC cars.",
      parentId: rcCars.id,
      sortOrder: 1,
    },
  });

  const drones = await prisma.category.upsert({
    where: { slug: "drones" },
    update: {},
    create: {
      name: "Drones",
      slug: "drones",
      description: "Camera drones and racing quads.",
      sortOrder: 2,
    },
  });

  const modelKits = await prisma.category.upsert({
    where: { slug: "model-kits" },
    update: {},
    create: {
      name: "Model Kits",
      slug: "model-kits",
      description: "Build-it-yourself scale model kits.",
      sortOrder: 3,
    },
  });

  const collectibles = await prisma.category.upsert({
    where: { slug: "collectibles" },
    update: {},
    create: {
      name: "Collectibles",
      slug: "collectibles",
      description: "Limited-run figures and collector gear.",
      sortOrder: 4,
    },
  });

  console.log("Seeding products...");

  const products = [
    {
      name: "Thunder Raptor 1:16 RC Monster Truck",
      slug: "thunder-raptor-1-16-rc-monster-truck",
      description:
        "Full-throttle 1:16 scale monster truck with 4WD grip, shock-absorbing suspension, and a 30-minute runtime.",
      brand: "Raptor RC",
      categoryId: rcCars.id,
      basePrice: 349900,
      compareAtPrice: 399900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "TR-MT-RED", attributes: { color: "Red" }, stockQuantity: 24 },
        { sku: "TR-MT-BLU", attributes: { color: "Blue" }, stockQuantity: 18 },
      ],
    },
    {
      name: "Velocity X Drift RC Car 1:18",
      slug: "velocity-x-drift-rc-car-1-18",
      description:
        "Drift-tuned 1:18 scale RC car with adjustable steering angle and swappable drift tires.",
      brand: "Velocity",
      categoryId: rcDrift.id,
      basePrice: 279900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "VX-DR-WHT", attributes: { color: "White" }, stockQuantity: 15 },
        { sku: "VX-DR-BLK", attributes: { color: "Black" }, stockQuantity: 20 },
      ],
    },
    {
      name: "SkyEye 4K Camera Drone",
      slug: "skyeye-4k-camera-drone",
      description:
        "Foldable 4K camera drone with GPS return-to-home, 25-minute flight time, and obstacle avoidance.",
      brand: "SkyEye",
      categoryId: drones.id,
      basePrice: 899900,
      compareAtPrice: 999900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "SE-4K-STD", attributes: { edition: "Standard" }, stockQuantity: 10 },
        { sku: "SE-4K-PRO", attributes: { edition: "Pro Combo" }, stockQuantity: 6 },
      ],
    },
    {
      name: "Nova Racing FPV Drone",
      slug: "nova-racing-fpv-drone",
      description:
        "Lightweight FPV racing drone built for speed, with carbon-fiber frame and goggles included.",
      brand: "Nova",
      categoryId: drones.id,
      basePrice: 549900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "NV-FPV-STD", attributes: { edition: "Standard" }, stockQuantity: 12 },
      ],
    },
    {
      name: "Panda Mecha Gundam Model Kit",
      slug: "panda-mecha-gundam-model-kit",
      description:
        "High-grade 1:144 scale mecha model kit with snap-fit assembly and articulated joints.",
      brand: "PandaModels",
      categoryId: modelKits.id,
      basePrice: 199900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "PM-GK-144", attributes: { scale: "1:144" }, stockQuantity: 30 },
      ],
    },
    {
      name: "Retro Robot Transforming Kit",
      slug: "retro-robot-transforming-kit",
      description:
        "Retro-styled transforming robot kit that converts between vehicle and robot mode.",
      brand: "RetroWorks",
      categoryId: modelKits.id,
      basePrice: 149900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "RW-TR-STD", attributes: { edition: "Standard" }, stockQuantity: 25 },
      ],
    },
    {
      name: "Galaxy Warrior Collectible Figure",
      slug: "galaxy-warrior-collectible-figure",
      description:
        "Hand-painted 1:12 scale collectible figure with premium display base.",
      brand: "Galaxy Collectibles",
      categoryId: collectibles.id,
      basePrice: 89900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "GW-FIG-001", attributes: { edition: "Standard" }, stockQuantity: 40 },
        { sku: "GW-FIG-GLD", attributes: { edition: "Gold Variant" }, stockQuantity: 8 },
      ],
    },
    {
      name: "Blind Box Mystery Mini Series",
      slug: "blind-box-mystery-mini-series",
      description:
        "Surprise mystery mini figure from a curated 12-piece collectible series.",
      brand: "Galaxy Collectibles",
      categoryId: collectibles.id,
      basePrice: 49900,
      status: ProductStatus.ACTIVE,
      variants: [
        { sku: "GW-BOX-MINI", attributes: { edition: "Series 1" }, stockQuantity: 60 },
      ],
    },
  ];

  for (const p of products) {
    const { variants, ...productData } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...productData,
        images: {
          create: [
            { url: PLACEHOLDER_IMAGE(p.name), altText: p.name, sortOrder: 0 },
          ],
        },
        variants: {
          create: variants,
        },
      },
    });
    console.log(`  - ${product.name}`);
  }

  console.log("Seeding coupon...");
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrderValue: 100000,
      usageLimit: 500,
      isActive: true,
    },
  });

  console.log("Seeding banners...");
  await prisma.banner.upsert({
    where: { id: "seed-banner-hero" },
    update: {},
    create: {
      id: "seed-banner-hero",
      title: "Build. Race. Collect.",
      imageUrl: PLACEHOLDER_IMAGE("Hero Banner"),
      linkUrl: "/category/rc-cars",
      placement: "HOME_HERO",
      isActive: true,
      sortOrder: 0,
    },
  });

  console.log("Seeding site settings...");
  await prisma.siteSetting.upsert({
    where: { key: ROBOTS_TXT_KEY },
    update: {},
    create: { key: ROBOTS_TXT_KEY, value: DEFAULT_ROBOTS_TXT },
  });

  console.log("Seeding users...");
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@toycompany.store" },
    update: {},
    create: {
      name: "Toy Company Admin",
      email: "admin@toycompany.store",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });

  const customerPasswordHash = await bcrypt.hash("Customer@12345", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "Test Customer",
      email: "customer@example.com",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });

  const priya = await prisma.user.upsert({
    where: { email: "priya.reviewer@example.com" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "priya.reviewer@example.com",
      role: "CUSTOMER",
    },
  });

  const arjun = await prisma.user.upsert({
    where: { email: "arjun.reviewer@example.com" },
    update: {},
    create: {
      name: "Arjun Mehta",
      email: "arjun.reviewer@example.com",
      role: "CUSTOMER",
    },
  });

  console.log("Seeding reviews...");

  const reviewSeeds: {
    slug: string;
    userId: string;
    rating: number;
    title: string;
    body: string;
  }[] = [
    {
      slug: "thunder-raptor-1-16-rc-monster-truck",
      userId: priya.id,
      rating: 5,
      title: "Tears up the backyard",
      body: "The 4WD grip on this thing is incredible — handled gravel and grass without slowing down. Battery lasts the full 30 minutes as advertised.",
    },
    {
      slug: "thunder-raptor-1-16-rc-monster-truck",
      userId: arjun.id,
      rating: 4,
      title: "Great build quality",
      body: "Solid suspension and a tough shell. Only wish it came with a spare battery in the box.",
    },
    {
      slug: "skyeye-4k-camera-drone",
      userId: customer.id,
      rating: 5,
      title: "Footage is genuinely 4K",
      body: "Return-to-home worked perfectly on my first flight, and the video quality is way above what I expected at this price.",
    },
    {
      slug: "panda-mecha-gundam-model-kit",
      userId: priya.id,
      rating: 5,
      title: "Snap-fit is satisfying",
      body: "No glue needed, joints are sturdy, and the finished pose options are great for display.",
    },
    {
      slug: "galaxy-warrior-collectible-figure",
      userId: arjun.id,
      rating: 4,
      title: "Paint job is clean",
      body: "Hand-painted details are crisp and the display base feels premium. Shipping box could be sturdier.",
    },
    {
      slug: "galaxy-warrior-collectible-figure",
      userId: customer.id,
      rating: 5,
      title: "Centerpiece of my shelf now",
      body: "Better in person than in photos. Very happy with this one.",
    },
  ];

  for (const review of reviewSeeds) {
    const product = await prisma.product.findUnique({ where: { slug: review.slug } });
    if (!product) continue;

    const existing = await prisma.review.findFirst({
      where: { productId: product.id, userId: review.userId },
    });
    if (existing) continue;

    await prisma.review.create({
      data: {
        productId: product.id,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        body: review.body,
        status: "APPROVED",
      },
    });
  }

  console.log("Recalculating product ratings...");
  const reviewedSlugs = [...new Set(reviewSeeds.map((r) => r.slug))];
  for (const slug of reviewedSlugs) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) continue;

    const aggregate = await prisma.review.aggregate({
      where: { productId: product.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count,
      },
    });
  }

  console.log("Seeding blog posts...");

  const blogSeeds = [
    {
      slug: "choosing-your-first-rc-monster-truck",
      title: "Choosing Your First RC Monster Truck",
      excerpt: "A quick guide to scale, drivetrain, and battery life so your first RC truck doesn't end up in a drawer.",
      categoryTag: "Buying Guides",
      coverImage: PLACEHOLDER_IMAGE("RC Truck Guide"),
      markdown: `Getting into RC monster trucks is exciting, but the sheer number of specs can be overwhelming. Here's what actually matters.

## Scale

Most beginner-friendly trucks come in **1:16** or **1:10** scale. Smaller scales are cheaper and easier to store; larger scales are tougher and faster.

## Drivetrain

Look for **4WD** if you plan to drive off-road — it grips gravel, grass, and gravel far better than 2WD.

## Battery life

A 20-30 minute runtime is typical. Consider buying a spare battery on day one so you're never stuck waiting for a charge.

Ready to pick one out? Check our [RC Cars collection](/category/rc-cars) for current picks.`,
      publishedAt: new Date("2026-06-01"),
    },
    {
      slug: "fpv-drone-racing-101",
      title: "FPV Drone Racing 101",
      excerpt: "Everything a first-time pilot needs to know before their first FPV flight.",
      categoryTag: "Guides",
      coverImage: PLACEHOLDER_IMAGE("FPV Drone Guide"),
      markdown: `FPV (first-person view) racing drones are a different beast from camera drones — built for speed, not stability.

## Start in a simulator

Before you crash a real drone, practice in a flight simulator. It's the fastest way to build stick skills without buying replacement parts.

## Know your gear

- **Goggles** — first-person video feed from the drone's onboard camera
- **Controller** — dual-stick radio transmitter
- **Frame** — carbon fiber is light and durable

## Find a legal place to fly

Check local regulations before flying, especially near airports or crowded areas.

Browse our [Drones collection](/category/drones) to see current FPV kits.`,
      publishedAt: new Date("2026-06-15"),
    },
  ];

  for (const post of blogSeeds) {
    const contentHtml = markdownToSafeHtml(post.markdown);
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentMarkdown: post.markdown,
        contentHtml,
        coverImage: post.coverImage,
        categoryTag: post.categoryTag,
        authorId: admin.id,
        publishedAt: post.publishedAt,
      },
    });
    console.log(`  - ${post.title}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
