import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Passkey from "next-auth/providers/passkey"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Passkey({
            relayingParty: {
                id: process.env.NEXT_PUBLIC_WEBAUTHN_RPID || "localhost",
                name: "Rep Vault Config"
            }
        }),
    ],
    experimental: {
        enableWebAuthn: true,
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // When user first signs in, 'user' object is available from adapter
            if (user) {
                token.sub = user.id
                token.onboardingCompleted = user.onboardingCompleted ?? false;
            }
            // If we manually call server-side session update after onboarding finishes
            if (trigger === "update" && session?.user?.onboardingCompleted !== undefined) {
                token.onboardingCompleted = session.user.onboardingCompleted;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.onboardingCompleted = token.onboardingCompleted ?? false;
            }
            return session;
        }
    }
})
