//lib/nextauth.config.ts
import { AuthOptions } from "next-auth"; // Cambiado de NextAuthConfig
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export const nextauthConfig: AuthOptions = { // Cambiado a AuthOptions
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .get();

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        // Obtener la imagen de Google del perfil
        const googleImage = user.image || (profile as any)?.picture || null;

        // Verificar si el usuario ya existe
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .get();

        if (!existingUser) {
          // Crear nuevo usuario con imagen de Google
          const userId = randomUUID();
          await db.insert(users).values({
            id: userId,
            email: user.email,
            name: user.name!,
            provider: "google",
            image: googleImage,
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
        } else if (googleImage && !existingUser.image) {
          // Si el usuario ya existe pero no tiene imagen, actualizar con la de Google
          await db
            .update(users)
            .set({ image: googleImage })
            .where(eq(users.id, existingUser.id));
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Siempre buscamos la información más fresca de la base de datos
      const userEmail = user?.email || token.email;
      
      if (userEmail) {
        const dbUser = await db.select().from(users).where(eq(users.email, userEmail)).get();
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          // Prioridad: 1. Imagen en DB (Cloudflare), 2. Imagen de Google/token, 3. Null
          token.picture = dbUser.image || token.picture;
          token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session.user as any).image = token.picture;
      (session.user as any).name = token.name;
      (session.user as any).email = token.email;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
