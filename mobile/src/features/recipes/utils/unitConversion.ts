
import { UnitCode, UnitType, UNITS_BY_TYPE } from '../constants/units.constants';

// Base units for each type
const BASE_UNITS: Record<UnitType, UnitCode> = {
    weight: 'g',
    volume: 'ml',
    count: 'piece',
};

// Conversion factors to base unit (e.g., 1 kg = 1000 g)
const CONVERSION_FACTORS: Partial<Record<UnitCode, number>> = {
    // Weight (to g)
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,

    // Volume (to ml)
    ml: 1,
    l: 1000,
    tsp: 5,       // Metric teaspoon
    tbsp: 15,     // Metric tablespoon
    cup: 240,     // Metric cup
};

/**
 * Gets the type of a unit (weight, volume, count).
 */
export function getUnitType(unit: string): UnitType | null {
    if (!unit) return 'count'; // Default to count/dimensionless if empty

    for (const [type, units] of Object.entries(UNITS_BY_TYPE)) {
        if (units.includes(unit as UnitCode)) {
            return type as UnitType;
        }
    }
    return null;
}

/**
 * Checks if two units are compatible for conversion.
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
    const typeA = getUnitType(unitA);
    const typeB = getUnitType(unitB);

    // If either is null/unknown, we can't safely convert
    if (!typeA || !typeB) return false;

    return typeA === typeB;
}

/**
 * Converts an amount from one unit to another.
 * Returns null if conversion is not possible.
 */
export function convertUnit(amount: number, fromUnit: string, toUnit: string): number | null {
    if (fromUnit === toUnit) return amount;

    const typeA = getUnitType(fromUnit);
    const typeB = getUnitType(toUnit);

    if (!typeA || !typeB || typeA !== typeB) {
        return null; // Incompatible types
    }

    // Count types typically can't be converted (e.g. piece to bunch)
    // unless we're just normalizing names, but for now returned null
    if (typeA === 'count') {
        return null;
    }

    const fromFactor = CONVERSION_FACTORS[fromUnit as UnitCode];
    const toFactor = CONVERSION_FACTORS[toUnit as UnitCode];

    if (fromFactor === undefined || toFactor === undefined) {
        return null;
    }

    // Convert to base, then to target
    const amountInBase = amount * fromFactor;
    return amountInBase / toFactor;
}

/**
 * Smartly adds two quantities.
 * If compatible, returns sum in the `targetUnit`.
 * If incompatible, returns null.
 */
export function addQuantities(
    amountA: number, unitA: string,
    amountB: number, unitB: string,
    targetUnit: string = unitA
): number | null {
    const convertedB = convertUnit(amountB, unitB, targetUnit);

    if (convertedB === null) {
        // Try reverse just in case, but usually means incompatible
        return null;
    }

    const convertedA = convertUnit(amountA, unitA, targetUnit);
    if (convertedA === null) return null;

    return convertedA + convertedB;
}

/**
 * Normalizes a quantity to its standard base unit (kg for weight, l for volume).
 * Used for the "General Count" strategy where we accumulate small amounts into larger standard units.
 */
export function normalizeToStandardUnit(amount: number, unit: string): { quantity: number; unit: string } {
    const type = getUnitType(unit);

    if (!type) {
        return { quantity: amount, unit };
    }

    // Define standard units for normalization
    const STANDARD_UNITS: Partial<Record<UnitType, string>> = {
        weight: 'kg',
        volume: 'l',
    };

    const targetUnit = STANDARD_UNITS[type];

    if (!targetUnit) {
        return { quantity: amount, unit };
    }

    const convertedAmount = convertUnit(amount, unit, targetUnit);

    if (convertedAmount === null) {
        return { quantity: amount, unit };
    }

    return { quantity: convertedAmount, unit: targetUnit };
}
