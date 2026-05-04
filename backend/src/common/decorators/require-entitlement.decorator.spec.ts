import { REQUIRE_ENTITLEMENTS_KEY, RequireEntitlement } from './require-entitlement.decorator';

describe('RequireEntitlement', () => {
  it('stores required entitlement keys metadata', () => {
    class TestController {
      @RequireEntitlement('premium')
      premiumEndpoint() {
        return true;
      }
    }

    const metadata = Reflect.getMetadata(
      REQUIRE_ENTITLEMENTS_KEY,
      TestController.prototype.premiumEndpoint,
    );

    expect(metadata).toEqual(['premium']);
  });
});
