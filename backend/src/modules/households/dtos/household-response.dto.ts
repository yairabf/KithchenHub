export class HouseholdMemberDto {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role: string;
}

export class HouseholdResponseDto {
  id: string;
  name: string;
  members: HouseholdMemberDto[];
}
