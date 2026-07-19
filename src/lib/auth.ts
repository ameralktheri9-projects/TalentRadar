import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";

const IMPERSONATE_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-secret"
);

export type UserType = "COMPANY" | "AGENCY" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  role?: string;
  entityId?: string; // company_id or agency_id
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { email, password, userType } = credentials;

        // Impersonation: password is a one-time JWT issued by /api/admin/impersonate/apply
        // JWT tokens start with "eyJ" (base64 encoded header)
        if (password.startsWith("eyJ")) {
          try {
            const { payload } = await jose.jwtVerify(password, IMPERSONATE_SECRET);
            const p = payload as { userId?: string; userType?: string; oneTime?: boolean };
            if (p.oneTime && p.userId && p.userType) {
              if (p.userType === "COMPANY") {
                const u = await prisma.companyUser.findUnique({
                  where: { id: p.userId }, include: { company: true },
                });
                if (u) return { id: u.id, email: u.email, name: u.full_name, userType: "COMPANY" as UserType, role: u.role, entityId: u.company_id };
              }
              if (p.userType === "AGENCY") {
                const u = await prisma.agencyUser.findUnique({
                  where: { id: p.userId }, include: { agency: true },
                });
                if (u) return { id: u.id, email: u.email, name: u.full_name, userType: "AGENCY" as UserType, role: u.role, entityId: u.agency_id };
              }
            }
          } catch {
            // not a valid impersonation token — fall through to normal auth
          }
        }

        if (userType === "ADMIN") {
          const admin = await prisma.adminUser.findUnique({ where: { email } });
          if (!admin) return null;
          const valid = await bcrypt.compare(password, admin.password_hash);
          if (!valid) return null;
          return {
            id: admin.id,
            email: admin.email,
            name: admin.full_name,
            userType: "ADMIN" as UserType,
          };
        }

        if (userType === "COMPANY") {
          const user = await prisma.companyUser.findUnique({
            where: { email },
            include: { company: true },
          });
          if (!user) return null;
          if (user.status !== "ACTIVE") return null;
          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            userType: "COMPANY" as UserType,
            role: user.role,
            entityId: user.company_id,
          };
        }

        if (userType === "AGENCY") {
          const user = await prisma.agencyUser.findUnique({
            where: { email },
            include: { agency: true },
          });
          if (!user) return null;
          if (user.status !== "ACTIVE") return null;
          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            userType: "AGENCY" as UserType,
            role: user.role,
            entityId: user.agency_id,
          };
        }

        // Try all user types if none specified
        const adminUser = await prisma.adminUser.findUnique({ where: { email } });
        if (adminUser && await bcrypt.compare(password, adminUser.password_hash)) {
          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.full_name,
            userType: "ADMIN" as UserType,
          };
        }

        const companyUser = await prisma.companyUser.findUnique({ where: { email } });
        if (companyUser && companyUser.status === "ACTIVE" && await bcrypt.compare(password, companyUser.password_hash)) {
          return {
            id: companyUser.id,
            email: companyUser.email,
            name: companyUser.full_name,
            userType: "COMPANY" as UserType,
            role: companyUser.role,
            entityId: companyUser.company_id,
          };
        }

        const agencyUser = await prisma.agencyUser.findUnique({ where: { email } });
        if (agencyUser && agencyUser.status === "ACTIVE" && await bcrypt.compare(password, agencyUser.password_hash)) {
          return {
            id: agencyUser.id,
            email: agencyUser.email,
            name: agencyUser.full_name,
            userType: "AGENCY" as UserType,
            role: agencyUser.role,
            entityId: agencyUser.agency_id,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as AuthUser;
        token.userType = authUser.userType;
        token.role = authUser.role;
        token.entityId = authUser.entityId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as AuthUser & { id: string }).id = token.sub as string;
        (session.user as AuthUser).userType = token.userType as UserType;
        (session.user as AuthUser).role = token.role as string;
        (session.user as AuthUser).entityId = token.entityId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
