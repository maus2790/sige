import NextAuth from "next-auth";
import { nextauthConfig } from "@/lib/nextauth.config";
import { NextRequest, NextResponse } from "next/server";

const handler = NextAuth(nextauthConfig);

async function safeHandler(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const url = new URL(req.url);

  if (url.pathname.endsWith("/_log")) {
    return NextResponse.json({ ok: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler as any)(req, ctx);
}

export { safeHandler as GET, safeHandler as POST };
