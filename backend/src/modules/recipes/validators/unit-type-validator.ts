import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  UnitCode,
  UnitType,
  UNIT_TYPE_MAPPING,
} from '../constants/units.constants';

/**
 * When quantityAmount is present it must be a finite number.
 * Ensures count/unspecified unit types cannot send string amounts that would break Prisma.
 * Applied on another property (e.g. name) so it is not gated by ValidateIf on quantityAmount.
 */
@ValidatorConstraint({
  name: 'quantityAmountNumericWhenPresent',
  async: false,
})
export class QuantityAmountNumericWhenPresentConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    const amount = obj.quantityAmount;
    if (amount === undefined || amount === null) {
      return true;
    }
    return typeof amount === 'number' && Number.isFinite(amount);
  }

  defaultMessage(): string {
    return 'quantityAmount must be a number when provided';
  }
}

/** Returns true if unit type is weight or volume and amount is a positive number; otherwise true (skip). */
function isPositiveAmountRequiredForMeasuredType(
  unitType: UnitType | undefined,
  amount: unknown,
): boolean {
  if (unitType !== UnitType.WEIGHT && unitType !== UnitType.VOLUME) {
    return true;
  }
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
}

@ValidatorConstraint({ name: 'isValidUnitTypeMatch', async: false })
export class IsValidUnitTypeMatchConstraint implements ValidatorConstraintInterface {
  validate(unit: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    if (!unit || !obj.quantityUnitType) {
      return true;
    }

    const expectedType = UNIT_TYPE_MAPPING[unit as UnitCode];
    if (expectedType === undefined) {
      return false;
    }
    return expectedType === obj.quantityUnitType;
  }

  defaultMessage(): string {
    return 'Unit does not match the specified unit type';
  }
}

export function IsValidUnitTypeMatch(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidUnitTypeMatchConstraint,
    });
  };
}

/** Validates that weight/volume unit types have a positive quantityAmount. */
@ValidatorConstraint({ name: 'hasPositiveAmountWhenMeasured', async: false })
export class HasPositiveAmountWhenMeasuredConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    const unitType = obj.quantityUnitType as UnitType | undefined;
    const amount = obj.quantityAmount;
    return isPositiveAmountRequiredForMeasuredType(unitType, amount);
  }

  defaultMessage(): string {
    return 'Amount must be a positive number when unit type is weight or volume';
  }
}

export function HasPositiveAmountWhenMeasured(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: HasPositiveAmountWhenMeasuredConstraint,
    });
  };
}

/** Class-level: when unitType is weight or volume, quantityAmount must be present and positive. */
@ValidatorConstraint({
  name: 'ingredientAmountRequiredForMeasured',
  async: false,
})
export class IngredientAmountRequiredForMeasuredConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    const unitType = obj.quantityUnitType as UnitType | undefined;
    const amount = obj.quantityAmount;
    return isPositiveAmountRequiredForMeasuredType(unitType, amount);
  }

  defaultMessage(): string {
    return 'Amount must be a positive number when unit type is weight or volume';
  }
}
