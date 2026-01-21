export class UserResponseDto {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  isGuest: boolean;
  householdId?: string | null;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: UserResponseDto;
  householdId?: string | null;
}
