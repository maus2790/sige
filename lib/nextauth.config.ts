import { AuthOptions } from "next-auth"; // Cambiado de NextAuthConfig
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/db";
import { users, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const nextauthConfig: AuthOptions = { // Cambiado a AuthOptions
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Verificar si el usuario ya existe
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .get();

        if (!existingUser) {
          // Crear nuevo usuario
          const userId = randomUUID();
          await db.insert(users).values({
            id: userId,
            email: user.email,
            name: user.name!,
            provider: "google",
            role: "seller",
            createdAt: new Date(),
          });

          // Crear tienda automáticamente
          await db.insert(stores).values({
            id: randomUUID(),
            userId: userId,
            name: `Tienda de ${user.name}`,
            description: "Bienvenido a tu nueva tienda",
            verified: false,
            createdAt: new Date(),
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.select().from(users).where(eq(users.email, user.email!)).get();
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
