import type { RevenueCatSdk } from './purchaseService';

type PurchasesModuleShape = {
  configure: (options: { apiKey: string }) => void;
  getOfferings: () => Promise<unknown>;
  purchasePackage: (pkg: unknown) => Promise<unknown>;
  restorePurchases: () => Promise<unknown>;
};

export function createRevenueCatSdk(apiKey: string): RevenueCatSdk | null {
  try {
    // Dynamic require keeps tests/web builds safe when native module is unavailable.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const purchasesModule = require('react-native-purchases') as
      | PurchasesModuleShape
      | { default?: PurchasesModuleShape };

    const purchases =
      'default' in purchasesModule && purchasesModule.default
        ? purchasesModule.default
        : purchasesModule;

    purchases.configure({ apiKey });

    return {
      getOfferings: () => purchases.getOfferings(),
      purchasePackage: (pkg) => purchases.purchasePackage(pkg),
      restorePurchases: () => purchases.restorePurchases(),
    };
  } catch {
    return null;
  }
}
