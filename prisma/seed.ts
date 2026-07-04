import "dotenv/config";
import { PrismaClient, ProductStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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

  console.log("Seeding users...");
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
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
  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "Test Customer",
      email: "customer@example.com",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });

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
