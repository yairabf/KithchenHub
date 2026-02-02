import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateHouseholdDto } from './update-household.dto';

describe('UpdateHouseholdDto', () => {
  describe('name validation', () => {
    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
      ['single space', ' '],
    ])(
      'should fail when name is %s (reject empty/whitespace)',
      async (_description, name) => {
        const dto = plainToInstance(UpdateHouseholdDto, { name });
        const errors = await validate(dto);
        const nameErrors = errors.filter((e) => e.property === 'name');
        expect(nameErrors.length).toBeGreaterThan(0);
        expect(
          nameErrors.some(
            (e) =>
              e.constraints?.minLength?.includes('non-empty') ?? false,
          ),
        ).toBe(true);
      },
    );

    it('should pass when name is valid non-empty string', async () => {
      const dto = plainToInstance(UpdateHouseholdDto, {
        name: 'My Cool Household',
      });
      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors).toHaveLength(0);
    });

    it('should pass when name is omitted (optional)', async () => {
      const dto = plainToInstance(UpdateHouseholdDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail when name exceeds 200 characters', async () => {
      const dto = plainToInstance(UpdateHouseholdDto, {
        name: 'a'.repeat(201),
      });
      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'name');
      expect(nameErrors.length).toBeGreaterThan(0);
      expect(
        nameErrors.some(
          (e) =>
            e.constraints?.maxLength?.includes('200') ?? false,
        ),
      ).toBe(true);
    });
  });
});
