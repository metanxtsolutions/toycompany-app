import { prisma } from "@/lib/prisma";
import { ROBOTS_TXT_KEY, DEFAULT_ROBOTS_TXT } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: ROBOTS_TXT_KEY } });

  return new Response(setting?.value ?? DEFAULT_ROBOTS_TXT, {
    headers: { "Content-Type": "text/plain" },
  });
}
