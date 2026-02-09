import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that at least one of `id` or `name` is present and non-empty.
 * Used for UserCreationHouseholdDto: either existing (id only) or new (name, id optional).
 */
function AtLeastOneOfIdOrName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneOfIdOrName',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const dto = args.object as UserCreationHouseholdDto;
          const hasId =
            dto.id != null &&
            typeof dto.id === 'string' &&
            dto.id.trim().length > 0;
          const hasName =
            dto.name != null &&
            typeof dto.name === 'string' &&
            dto.name.trim().length > 0;
          return hasId || hasName;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by class-validator
        defaultMessage(args: ValidationArguments) {
          return 'Household must be either existing (id only) or new (name required, id optional). At least one of id or name must be set.';
        },
      },
    });
  };
}

/**
 * Optional household payload for user creation (Google auth).
 * - New household: provide `name` (required), `id` optional (backend generates CUID if omitted).
 * - Existing household: provide `id` only (no `name`).
 * When present, at least one of `id` or `name` must be set; empty object is invalid.
 */
export class UserCreationHouseholdDto {
  @IsOptional()
  @IsString()
  @MinLength(1, {
    message: 'Household id must be non-empty when joining existing household',
  })
  id?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Invite code must be at least 8 characters' })
  inviteCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, {
    message: 'Household name is required for new household',
  })
  @MaxLength(200, { message: 'Household name must be at most 200 characters' })
  @AtLeastOneOfIdOrName()
  name?: string;
}
