import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  invitationCodes,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "stefano.russello@gmail.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/en/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Check if user already exists in DB
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        if (!existingUser) {
          // New user via Google: require invitation code cookie
          const cookieStore = await cookies();
          const invCode = cookieStore.get("invitation_code")?.value;
          const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

          if (!invCode) {
            // No invitation code -> redirect to register with error
            return `/${locale}/auth/register?error=notRegistered`;
          }

          // Validate the invitation code
          const found = await db.query.invitationCodes.findFirst({
            where: and(
              eq(invitationCodes.code, invCode),
              eq(invitationCodes.isActive, true)
            ),
          });

          if (!found || found.currentUses >= found.maxUses) {
            cookieStore.delete("invitation_code");
            return `/${locale}/auth/register?error=invalidInvitationCode`;
          }

          // Consume the invitation code
          await db
            .update(invitationCodes)
            .set({ currentUses: found.currentUses + 1 })
            .where(eq(invitationCodes.id, found.id));

          cookieStore.delete("invitation_code");
        }

        // Auto-assign admin role
        if (user.email === ADMIN_EMAIL) {
          await db
            .update(users)
            .set({ role: "admin" })
            .where(eq(users.email, ADMIN_EMAIL));
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // Track credentials vs OAuth (only set on first login)
      if (account) {
        token.isCredentials = account.provider === "credentials";
      }

      // Fetch latest user data
      if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });
        if (dbUser) {
          // Auto-assign admin role if email matches (ensures it's always correct)
          if (dbUser.email === ADMIN_EMAIL && dbUser.role !== "admin") {
            await db
              .update(users)
              .set({ role: "admin" })
              .where(eq(users.id, dbUser.id));
            token.role = "admin";
          } else {
            token.role = dbUser.role;
          }

          token.nickname = dbUser.nickname;
          token.picture = dbUser.image;

          // Determine isCredentials from DB if not set (existing sessions)
          if (token.isCredentials === undefined) {
            token.isCredentials = !!dbUser.passwordHash;
          }

          // Email verification status
          if (!token.isCredentials) {
            // Google/OAuth users are always verified
            token.isEmailVerified = true;
          } else {
            token.isEmailVerified = !!dbUser.emailVerified;
          }

          // Auto-set nickname from name for Google users who don't have one
          if (!dbUser.nickname && dbUser.name) {
            // Check if the nickname is already taken
            const existingNickname = await db.query.users.findFirst({
              where: eq(users.nickname, dbUser.name),
            });
            const nickname = existingNickname
              ? `${dbUser.name}-${dbUser.id.slice(0, 4)}`
              : dbUser.name;
            await db
              .update(users)
              .set({ nickname })
              .where(eq(users.id, dbUser.id));
            token.nickname = nickname;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.nickname = token.nickname as string;
        session.user.image = (token.picture as string) || null;
        session.user.isEmailVerified = (token.isEmailVerified as boolean) ?? true;
        session.user.isCredentials = (token.isCredentials as boolean) ?? false;
      }
      return session;
    },
  },
});
