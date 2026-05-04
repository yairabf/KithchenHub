import { Platform } from 'react-native';
import { createRevenueCatSdk } from './revenueCatNativeAdapter';

export type PurchaseProvider = 'revenuecat';
export type PurchasePackageId = 'monthly' | 'yearly' | string;
export type PurchasePackagePeriod = 'monthly' | 'yearly';

export interface SubscriptionPurchasePackage {
  id: PurchasePackageId;
  productId: string;
  title: string;
  priceText: string;
  period: PurchasePackagePeriod;
  hasFreeTrial: boolean;
}

export interface SubscriptionOfferings {
  provider: PurchaseProvider;
  offeringId: string;
  packages: SubscriptionPurchasePackage[];
}

export interface SubscriptionCustomerState {
  appUserId: string | null;
  originalAppUserId: string | null;
  activeEntitlementIds: string[];
  activeSubscriptionProductIds: string[];
  latestExpirationDate: string | null;
}

export interface SubscriptionPurchaseResult {
  provider: PurchaseProvider;
  purchasedProductId: string;
  customerState: SubscriptionCustomerState;
}

export interface SubscriptionRestoreResult {
  provider: PurchaseProvider;
  restoredProductIds: string[];
  customerState: SubscriptionCustomerState;
}

export interface PurchaseService {
  isAvailable(): boolean;
  getOfferings(): Promise<SubscriptionOfferings | null>;
  purchasePackage(packageId: PurchasePackageId): Promise<SubscriptionPurchaseResult>;
  restorePurchases(): Promise<SubscriptionRestoreResult>;
}

export class PurchaseServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PurchaseServiceUnavailableError';
  }
}

interface RevenueCatOfferingProduct {
  identifier: string;
  title: string;
  priceString: string;
  subscriptionPeriod?: string | null;
  introductoryPrice?: { identifier?: string } | null;
}

interface RevenueCatPackage {
  identifier: string;
  packageType?: string | null;
  product: RevenueCatOfferingProduct;
}

interface RevenueCatOffering {
  identifier: string;
  availablePackages: RevenueCatPackage[];
}

interface RevenueCatEntitlementInfo {
  identifier?: string | null;
}

interface RevenueCatCustomerInfo {
  appUserID?: string | null;
  originalAppUserId?: string | null;
  latestExpirationDate?: string | null;
  activeSubscriptions?: string[] | null;
  entitlements?: {
    active?: Record<string, RevenueCatEntitlementInfo> | null;
  } | null;
}

interface RevenueCatOfferingsResult {
  current?: RevenueCatOffering | null;
}

interface RevenueCatPurchaseResult {
  productIdentifier?: string | null;
  customerInfo: RevenueCatCustomerInfo;
}

interface RevenueCatRestoreResult {
  customerInfo: RevenueCatCustomerInfo;
}

export interface RevenueCatSdk {
  getOfferings(): Promise<RevenueCatOfferingsResult>;
  purchasePackage(pkg: RevenueCatPackage): Promise<RevenueCatPurchaseResult>;
  restorePurchases(): Promise<RevenueCatRestoreResult>;
}

interface CreatePurchaseServiceOptions {
  platformOs?: string;
  revenueCatSdk?: RevenueCatSdk | null;
  revenueCatApiKey?: string;
  revenueCatSdkFactory?: (apiKey: string) => RevenueCatSdk | null;
}

class UnsupportedPurchaseService implements PurchaseService {
  constructor(private readonly reason: string) {}

  isAvailable(): boolean {
    return false;
  }

  async getOfferings(): Promise<SubscriptionOfferings | null> {
    return null;
  }

  async purchasePackage(): Promise<SubscriptionPurchaseResult> {
    throw new PurchaseServiceUnavailableError(this.reason);
  }

  async restorePurchases(): Promise<SubscriptionRestoreResult> {
    throw new PurchaseServiceUnavailableError(this.reason);
  }
}

export class RevenueCatPurchaseService implements PurchaseService {
  constructor(private readonly sdk: RevenueCatSdk) {}

  isAvailable(): boolean {
    return true;
  }

  async getOfferings(): Promise<SubscriptionOfferings | null> {
    const offerings = await this.sdk.getOfferings();
    const currentOffering = offerings.current;

    if (!currentOffering) {
      return null;
    }

    return {
      provider: 'revenuecat',
      offeringId: currentOffering.identifier,
      packages: currentOffering.availablePackages.map((pkg) =>
        this.normalizePackage(pkg),
      ),
    };
  }

  async purchasePackage(
    packageId: PurchasePackageId,
  ): Promise<SubscriptionPurchaseResult> {
    const pkg = await this.getRequiredPackage(packageId);
    const result = await this.sdk.purchasePackage(pkg);

    return {
      provider: 'revenuecat',
      purchasedProductId: result.productIdentifier ?? pkg.product.identifier,
      customerState: normalizeCustomerState(result.customerInfo),
    };
  }

  async restorePurchases(): Promise<SubscriptionRestoreResult> {
    const result = await this.sdk.restorePurchases();
    const customerState = normalizeCustomerState(result.customerInfo);

    return {
      provider: 'revenuecat',
      restoredProductIds: customerState.activeSubscriptionProductIds,
      customerState,
    };
  }

  private async getRequiredPackage(
    packageId: PurchasePackageId,
  ): Promise<RevenueCatPackage> {
    const offerings = await this.sdk.getOfferings();
    const currentOffering = offerings.current;

    const pkg = currentOffering?.availablePackages.find(
      (entry) => this.normalizePackageId(entry) === packageId,
    );

    if (!pkg) {
      throw new Error(`No purchase package found for id: ${packageId}`);
    }

    return pkg;
  }

  private normalizePackage(pkg: RevenueCatPackage): SubscriptionPurchasePackage {
    return {
      id: this.normalizePackageId(pkg),
      productId: pkg.product.identifier,
      title: pkg.product.title,
      priceText: pkg.product.priceString,
      period: this.normalizePeriod(pkg),
      hasFreeTrial: Boolean(pkg.product.introductoryPrice),
    };
  }

  private normalizePackageId(pkg: RevenueCatPackage): PurchasePackageId {
    const rawIdentifier = pkg.identifier.trim().toLowerCase();

    if (rawIdentifier.includes('month')) {
      return 'monthly';
    }

    if (rawIdentifier.includes('year') || rawIdentifier.includes('annual')) {
      return 'yearly';
    }

    return rawIdentifier;
  }

  private normalizePeriod(pkg: RevenueCatPackage): PurchasePackagePeriod {
    const period = pkg.product.subscriptionPeriod?.toUpperCase();

    if (period === 'P1Y' || pkg.packageType?.toUpperCase() === 'ANNUAL') {
      return 'yearly';
    }

    return 'monthly';
  }
}

function normalizeCustomerState(
  customerInfo: RevenueCatCustomerInfo,
): SubscriptionCustomerState {
  const activeEntitlements = customerInfo.entitlements?.active ?? {};

  return {
    appUserId: customerInfo.appUserID ?? null,
    originalAppUserId: customerInfo.originalAppUserId ?? null,
    activeEntitlementIds: Object.entries(activeEntitlements)
      .map(([key, value]) => value.identifier ?? key)
      .filter((value): value is string => Boolean(value)),
    activeSubscriptionProductIds: customerInfo.activeSubscriptions ?? [],
    latestExpirationDate: customerInfo.latestExpirationDate ?? null,
  };
}

export function resolveRevenueCatApiKey(platformOs: string): string | null {
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();

  if (platformOs === 'ios') {
    return iosKey || null;
  }

  if (platformOs === 'android') {
    return androidKey || null;
  }

  return null;
}

export function createPurchaseService(
  options: CreatePurchaseServiceOptions = {},
): PurchaseService {
  const platformOs = options.platformOs ?? Platform.OS;

  if (platformOs === 'web') {
    return new UnsupportedPurchaseService(
      'In-app purchases are not available on web.',
    );
  }

  if (options.revenueCatSdk) {
    return new RevenueCatPurchaseService(options.revenueCatSdk);
  }

  const revenueCatApiKey =
    options.revenueCatApiKey ?? resolveRevenueCatApiKey(platformOs);

  if (!revenueCatApiKey) {
    return new UnsupportedPurchaseService(
      'Purchase service is not configured for this app build.',
    );
  }

  const sdkFactory = options.revenueCatSdkFactory ?? createRevenueCatSdk;
  const sdk = sdkFactory(revenueCatApiKey);

  if (sdk) {
    return new RevenueCatPurchaseService(sdk);
  }

  return new UnsupportedPurchaseService(
    'Purchase service is not configured for this app build.',
  );
}

export const purchaseService = createPurchaseService();
