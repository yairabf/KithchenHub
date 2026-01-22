/**
 * Test file for RecipeDetailScreen utility functions
 * 
 * These tests validate the pure calculation functions used for sticky header
 * positioning, scroll detection, and layout spacing.
 * 
 * Setup required:
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @types/jest
 * 
 * 2. Add to package.json:
 *    "jest": {
 *      "preset": "jest-expo",
 *      "transformIgnorePatterns": [
 *        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
 *      ]
 *    }
 */

import {
    calculateStickyHeaderTopPosition,
    calculateIsHeaderScrolled,
    calculateSpacerHeight,
    calculateShouldShowStickyHeader,
} from './RecipeDetailScreen.utils';
import { STICKY_HEADER_ANIMATION } from './RecipeDetailScreen.constants';

describe('RecipeDetailScreen.utils', () => {
    describe('calculateStickyHeaderTopPosition', () => {
        describe.each([
            ['valid header with positive Y', 100, 50, 150],
            ['valid header with zero Y', 100, 0, 100],
            ['zero height header', 0, 50, 0],
            ['negative height header', -10, 50, 0],
            ['negative Y position', 100, -20, 80],
            ['large values', 200, 150, 350],
            ['small values', 10, 5, 15],
        ])('with %s', (description, headerHeight, headerY, expected) => {
            it(`should return ${expected}`, () => {
                expect(calculateStickyHeaderTopPosition(headerHeight, headerY)).toBe(expected);
            });
        });
    });

    describe('calculateIsHeaderScrolled', () => {
        const scrollThresholdOffset = STICKY_HEADER_ANIMATION.SCROLL_THRESHOLD_OFFSET;

        describe.each([
            ['scrolled past threshold', 100, 50, 50 - scrollThresholdOffset, true],
            ['scrolled exactly at threshold', 100, 50, 50 - scrollThresholdOffset, true],
            ['scrolled before threshold', 100, 50, 50 - scrollThresholdOffset - 1, false],
            ['zero header height', 0, 50, 0, false],
            ['negative header height', -10, 50, 0, false],
            ['zero scroll position', 100, 0, 0, false],
            ['negative scroll position', 100, -10, 0, false],
            ['large header, scrolled past', 500, 250, 250 - scrollThresholdOffset, true],
            ['small header, scrolled past', 10, 5, 5 - scrollThresholdOffset, true],
        ])('with %s', (description, headerHeight, scrollY, expectedThreshold, expectedResult) => {
            it(`should return ${expectedResult}`, () => {
                const result = calculateIsHeaderScrolled(scrollY, headerHeight);
                expect(result).toBe(expectedResult);
            });
        });

        it('should use correct threshold calculation', () => {
            const headerHeight = 100;
            const threshold = headerHeight - scrollThresholdOffset;
            const scrollYJustBelow = threshold - 0.1;
            const scrollYJustAbove = threshold + 0.1;

            expect(calculateIsHeaderScrolled(scrollYJustBelow, headerHeight)).toBe(false);
            expect(calculateIsHeaderScrolled(scrollYJustAbove, headerHeight)).toBe(true);
        });
    });

    describe('calculateSpacerHeight', () => {
        describe.each([
            ['header scrolled with valid height', true, 100, 100],
            ['header scrolled with zero height', true, 0, 0],
            ['header not scrolled with valid height', false, 100, 0],
            ['header not scrolled with zero height', false, 0, 0],
            ['header scrolled with negative height', true, -10, 0],
            ['header not scrolled with negative height', false, -10, 0],
            ['large header height', true, 500, 500],
            ['small header height', true, 10, 10],
        ])('with %s', (description, headerScrolled, contentHeaderHeight, expected) => {
            it(`should return ${expected}`, () => {
                expect(calculateSpacerHeight(headerScrolled, contentHeaderHeight)).toBe(expected);
            });
        });
    });

    describe('calculateShouldShowStickyHeader', () => {
        describe.each([
            ['all conditions met', true, 100, 50, true],
            ['header not scrolled', false, 100, 50, false],
            ['content header zero height', true, 0, 50, false],
            ['screen header zero height', true, 100, 0, false],
            ['content header negative', true, -10, 50, false],
            ['screen header negative', true, 100, -10, false],
            ['all conditions false', false, 0, 0, false],
            ['header scrolled but both heights zero', true, 0, 0, false],
            ['large values', true, 500, 300, true],
            ['small values', true, 10, 5, true],
        ])('with %s', (description, headerScrolled, contentHeaderHeight, screenHeaderHeight, expected) => {
            it(`should return ${expected}`, () => {
                expect(calculateShouldShowStickyHeader(headerScrolled, contentHeaderHeight, screenHeaderHeight)).toBe(expected);
            });
        });
    });
});
