export class UserResponseDto {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  householdId?: string | null;
}

export class HouseholdSummaryDto {
  id: string;
  name: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: UserResponseDto;
  householdId?: string | null;
  isNewUser?: boolean;
  isNewHousehold?: boolean;
  household?: HouseholdSummaryDto;
}
