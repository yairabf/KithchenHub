import type { RevenueCatSdk } from './purchaseService';

type PurchasesModuleShape = {
  configure: (options: { apiKey: string }) => void;
  getOfferings: () => Promise<unknown>;
  purchasePackage: (pkg: unknown) => Promise<unknown>;
  restorePurchases: () => Promise<unknown>;
};

type PurchasesRequireResult = PurchasesModuleShape | { default?: PurchasesModuleShape };

function resolvePurchasesModule(
  moduleValue: PurchasesRequireResult,
): PurchasesModuleShape | null {
  if ('configure' in moduleValue) {
    return moduleValue;
  }

  if (moduleValue.default && 'configure' in moduleValue.default) {
    return moduleValue.default;
  }

  return null;
}

export function createRevenueCatSdk(apiKey: string): RevenueCatSdk | null {
  try {
    // Dynamic require keeps tests/web builds safe when native module is unavailable.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const purchasesModule = require('react-native-purchases') as PurchasesRequireResult;

    const purchases = resolvePurchasesModule(purchasesModule);

    if (!purchases) {
      return null;
    }

    purchases.configure({ apiKey });

    return {
      getOfferings: () => purchases.getOfferings() as ReturnType<RevenueCatSdk['getOfferings']>,
      purchasePackage: (pkg) =>
        purchases.purchasePackage(pkg) as ReturnType<RevenueCatSdk['purchasePackage']>,
      restorePurchases: () =>
        purchases.restorePurchases() as ReturnType<RevenueCatSdk['restorePurchases']>,
    };
  } catch {
    return null;
  }
}
