import type { NextAuthConfig } from "next-auth";
import Passkey from "next-auth/providers/passkey";

const authConfig = {
    providers: [
        Passkey({
            relayingParty: {
                id: process.env.NEXT_PUBLIC_WEBAUTHN_RPID || "localhost",
                name: "Rep Vault Config",
            },
        }),
    ],
    experimental: {
        enableWebAuthn: true,
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // When user first signs in, 'user' object is available from adapter
            if (user) {
                token.sub = user.id;
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
        },
    },
} satisfies NextAuthConfig;

export default authConfig;
