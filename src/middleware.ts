import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isLoginPage = req.nextUrl.pathname === "/login";
    const isOnboardingPage = req.nextUrl.pathname === "/onboarding";

    // 1. Unauthenticated users get sent to Login
    if (!isLoggedIn && !isLoginPage) {
        const newUrl = new URL("/login", req.nextUrl.origin)
        return Response.redirect(newUrl)
    }

    // 2. Authenticated users who haven't finished onboarding MUST go to Onboarding
    if (isLoggedIn) {
        // @ts-ignore - session type extension
        const hasFinishedOnboarding = req.auth?.user?.onboardingCompleted;

        if (!hasFinishedOnboarding && !isOnboardingPage && !isLoginPage) {
            return Response.redirect(new URL("/onboarding", req.nextUrl.origin));
        }

        // 3. Authenticated users who finished onboarding shouldn't see onboarding again
        if (hasFinishedOnboarding && (isOnboardingPage || isLoginPage)) {
            return Response.redirect(new URL("/", req.nextUrl.origin));
        }
    }
})

export const config = {
    matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.png).*)"],
}
