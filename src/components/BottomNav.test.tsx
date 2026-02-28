import { render, screen } from '@testing-library/react';
import { BottomNav } from './BottomNav';

// Mock the lucide-react icons since we just want to test rendering
jest.mock('lucide-react', () => ({
    Home: () => <div data-testid="icon-home" />,
    History: () => <div data-testid="icon-history" />,
    LineChart: () => <div data-testid="icon-linechart" />
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    usePathname: () => '/',
}));

describe('BottomNav', () => {
    it('renders the navigation links', () => {
        render(<BottomNav />);

        // Check that all three links are rendered
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('Progress')).toBeInTheDocument();

        // Check icons
        expect(screen.getByTestId('icon-home')).toBeInTheDocument();
        expect(screen.getByTestId('icon-history')).toBeInTheDocument();
        expect(screen.getByTestId('icon-linechart')).toBeInTheDocument();
    });
});
