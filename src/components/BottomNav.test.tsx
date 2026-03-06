import { render, screen } from '@testing-library/react';
import { BottomNav } from './BottomNav';

const mockUsePathname = jest.fn();

jest.mock('@/app/auth/actions', () => ({
    logout: jest.fn(),
}));

// Mock the lucide-react icons since we just want to test rendering
jest.mock('lucide-react', () => ({
    Home: () => <div data-testid="icon-home" />,
    History: () => <div data-testid="icon-history" />,
    LineChart: () => <div data-testid="icon-linechart" />,
    LogOut: () => <div data-testid="icon-logout" />
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    usePathname: () => mockUsePathname(),
}));

describe('BottomNav', () => {
    beforeEach(() => {
        mockUsePathname.mockReturnValue('/');
    });

    it('renders the navigation links', () => {
        render(<BottomNav />);

        // Check that all three links are rendered
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('Progress')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();

        // Check icons
        expect(screen.getByTestId('icon-home')).toBeInTheDocument();
        expect(screen.getByTestId('icon-history')).toBeInTheDocument();
        expect(screen.getByTestId('icon-linechart')).toBeInTheDocument();
        expect(screen.getByTestId('icon-logout')).toBeInTheDocument();
    });

    it('does not render on login page', () => {
        mockUsePathname.mockReturnValue('/login');
        const { container } = render(<BottomNav />);
        expect(container.firstChild).toBeNull();
    });
});
