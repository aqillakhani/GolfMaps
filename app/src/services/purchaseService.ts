/**
 * RevenueCat purchase service.
 *
 * Install the Capacitor plugin when ready:
 *   npm install @revenuecat/purchases-capacitor
 *
 * For now this module provides a typed interface with a mock fallback
 * so the rest of the app can be wired up before RevenueCat keys are configured.
 */

import { ENV } from "@/config/env";

// Product IDs configured in App Store Connect / Google Play Console
export const PRODUCTS = {
  WEEKLY: "golfmaps_weekly",
  ANNUAL: "golfmaps_annual",
} as const;

export const ENTITLEMENT_ID = "premium";

interface PurchaseResult {
  success: boolean;
  entitlementActive: boolean;
  error?: string;
}

let _isConfigured = false;
let _Purchases: any = null;

// Use a variable to prevent Vite from statically analyzing the import
const RC_MODULE = "@revenuecat/purchases-capacitor";

async function getPurchases(): Promise<any> {
  if (_Purchases) return _Purchases;
  try {
    const mod = await import(/* @vite-ignore */ RC_MODULE);
    _Purchases = mod.Purchases;
    return _Purchases;
  } catch {
    return null;
  }
}

export async function configurePurchases(): Promise<void> {
  if (_isConfigured) return;
  const apiKey = ENV.REVENUECAT_API_KEY;
  if (!apiKey) {
    console.warn("RevenueCat API key not set — purchases will use mock mode.");
    return;
  }

  const Purchases = await getPurchases();
  if (!Purchases) {
    console.warn("RevenueCat not available (web or not installed).");
    return;
  }

  try {
    await Purchases.configure({ apiKey });
    _isConfigured = true;
  } catch (e) {
    console.warn("RevenueCat configure failed:", e);
  }
}

export async function purchasePackage(productId: string): Promise<PurchaseResult> {
  if (!_isConfigured) {
    console.log(`[mock] Purchasing ${productId}`);
    return { success: true, entitlementActive: true };
  }

  try {
    const Purchases = await getPurchases();
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (p: any) => p.product.identifier === productId
    );
    if (!pkg) return { success: false, entitlementActive: false, error: "Package not found" };

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: true, entitlementActive: active };
  } catch (e: any) {
    if (e.userCancelled) return { success: false, entitlementActive: false, error: "cancelled" };
    return { success: false, entitlementActive: false, error: e.message };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!_isConfigured) {
    return { success: true, entitlementActive: false };
  }

  try {
    const Purchases = await getPurchases();
    const { customerInfo } = await Purchases.restorePurchases();
    const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: true, entitlementActive: active };
  } catch (e: any) {
    return { success: false, entitlementActive: false, error: e.message };
  }
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  if (!_isConfigured) return false;

  try {
    const Purchases = await getPurchases();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
