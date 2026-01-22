import {
    calculateStickyHeaderTopPosition,
    calculateIsHeaderScrolled,
    calculateSpacerHeight,
    calculateShouldShowStickyHeader,
} from '../RecipeDetailScreen.utils';
import { STICKY_HEADER_ANIMATION } from '../RecipeDetailScreen.constants';

describe('RecipeDetailScreen Utils', () => {
    describe('calculateStickyHeaderTopPosition', () => {
        it('should return 0 when header height is 0 or negative', () => {
            expect(calculateStickyHeaderTopPosition(0, 100)).toBe(0);
            expect(calculateStickyHeaderTopPosition(-10, 100)).toBe(0);
        });

        it('should calculate correct top position based on headerY + headerHeight', () => {
            // If header is at y=50 and height is 100, bottom edge (and thus sticky top) is 150
            expect(calculateStickyHeaderTopPosition(100, 50)).toBe(150);
            expect(calculateStickyHeaderTopPosition(80, 0)).toBe(80);
            expect(calculateStickyHeaderTopPosition(100, -20)).toBe(80);
        });
    });

    describe('calculateIsHeaderScrolled', () => {
        it('should return false when scrollY is less than threshold', () => {
            // Threshold is headerHeight - offset
            const headerHeight = 200;
            const threshold = 200 - STICKY_HEADER_ANIMATION.SCROLL_THRESHOLD_OFFSET;
            expect(calculateIsHeaderScrolled(threshold - 1, headerHeight)).toBe(false);
        });

        it('should return true when scrollY is equal to or greater than threshold', () => {
            const headerHeight = 200;
            const threshold = 200 - STICKY_HEADER_ANIMATION.SCROLL_THRESHOLD_OFFSET;
            expect(calculateIsHeaderScrolled(threshold, headerHeight)).toBe(true);
            expect(calculateIsHeaderScrolled(threshold + 1, headerHeight)).toBe(true);
        });

        it('should handle small or zero header heights gracefully', () => {
            expect(calculateIsHeaderScrolled(100, 0)).toBe(false);
            // Small height that might result in negative threshold
            // The function implementation returns false if threshold <= 0
            // Assuming SCROLL_THRESHOLD_OFFSET is small (e.g. 1)
            expect(calculateIsHeaderScrolled(100, -10)).toBe(false);
        });
    });

    describe('calculateSpacerHeight', () => {
        it('should return 0 if header is not scrolled', () => {
            expect(calculateSpacerHeight(false, 50)).toBe(0);
        });

        it('should return content header height if header is scrolled', () => {
            expect(calculateSpacerHeight(true, 50)).toBe(50);
        });

        it('should return 0 if content header height is 0', () => {
            expect(calculateSpacerHeight(true, 0)).toBe(0);
        });
    });

    describe('calculateShouldShowStickyHeader', () => {
        it('should return true only when all conditions are met', () => {
            expect(calculateShouldShowStickyHeader(true, 50, 80)).toBe(true);
        });

        it('should return false if header not scrolled', () => {
            expect(calculateShouldShowStickyHeader(false, 50, 80)).toBe(false);
        });

        it('should return false if content header height is 0', () => {
            expect(calculateShouldShowStickyHeader(true, 0, 80)).toBe(false);
        });

        it('should return false if screen header height is 0', () => {
            expect(calculateShouldShowStickyHeader(true, 50, 0)).toBe(false);
        });
    });
});
