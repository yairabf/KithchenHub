import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ENTITLEMENTS_KEY = 'require_entitlements';

export type EntitlementKey = 'premium';

export const RequireEntitlement = (...entitlements: EntitlementKey[]) =>
  SetMetadata(REQUIRE_ENTITLEMENTS_KEY, entitlements);
