import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "./page";

const mockSignIn = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next-auth/webauthn", () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    }),
}));

jest.mock("lucide-react", () => ({
    Fingerprint: () => <div data-testid="icon-fingerprint" />,
    Loader2: () => <div data-testid="icon-loader" />,
}));

describe("LoginPage", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockSignIn.mockReset();
        mockPush.mockReset();
        mockRefresh.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("shows a generic error message for failed sign-in", async () => {
        mockSignIn.mockResolvedValue({ error: "AccessDenied" });
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText("Email Address"), {
            target: { value: "test@example.com" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Sign in with Passkey" }));

        jest.advanceTimersByTime(400);

        await waitFor(() =>
            expect(screen.getByText("Sign in failed. Check your details and try again.")).toBeInTheDocument()
        );
        expect(screen.queryByText(/AccessDenied/)).not.toBeInTheDocument();
    });
});
