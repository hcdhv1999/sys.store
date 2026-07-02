import type { CampaignPlatform, StorePlatform } from "@/types";

export const adPlatformNames: Record<CampaignPlatform, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  tiktok: "TikTok Ads",
  snapchat: "Snapchat Ads",
  linkedin: "LinkedIn Ads",
};

export const storePlatformNames: Record<StorePlatform, string> = {
  salla: "سلة Salla",
  zid: "زد Zid",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};
