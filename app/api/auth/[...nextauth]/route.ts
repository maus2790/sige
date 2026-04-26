import NextAuth from "next-auth";
import { nextauthConfig } from "@/lib/nextauth.config";

const handler = NextAuth(nextauthConfig);

export { handler as GET, handler as POST };