"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("passkey", {
                email,
                redirect: false,
                callbackUrl: "/",
            });

            if (result?.error) {
                // "AccessDenied" or other specific Auth.js errors
                setError("Sign in failed: " + result.error);
            } else if (result?.ok) {
                router.push(result.url || "/");
                router.refresh();
            }
            // If successful, next-auth handles the redirect to callbackUrl
        } catch (err) {
            setError("An unexpected error occurred during sign in.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center -mx-4">
            <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm text-center">

                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Fingerprint className="h-8 w-8 text-primary" />
                </div>

                <h1 className="mb-2 text-2xl font-bold tracking-tight">Welcome to Rep Vault</h1>
                <p className="mb-8 text-sm text-muted-foreground">
                    Sign in safely using your biometric passkey.
                </p>

                <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                    <div className="space-y-2 text-left">
                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="cristiano.corrado@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm rounded bg-red-500/10 text-red-500 border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign in with Passkey"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-xs text-muted-foreground">
                    Passkeys are bound to this device and fully encrypted.
                </div>
            </div>
        </div>
    );
}
