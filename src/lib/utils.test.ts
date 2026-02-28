import { cn } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('merges tailwind classes correctly', () => {
            // Basic merge
            expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');

            // Override classes (tailwind-merge behavior)
            expect(cn('px-2 py-1', 'p-4')).toBe('p-4');

            // Handle conditional classes
            expect(cn('base-class', true && 'active-class', false && 'hidden-class')).toBe('base-class active-class');
        });
    });
});
