import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Passkey from "next-auth/providers/passkey"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    }
})
