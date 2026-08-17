export const settingGroups = [
  { key: "general", label: "General" },
  { key: "contact", label: "Contact" },
  { key: "social", label: "Social" },
  { key: "location", label: "Location" },
  { key: "operations", label: "Operations" },
  { key: "seo", label: "SEO" },
] as const;

export type SettingGroup = (typeof settingGroups)[number]["key"];
export type SettingKind = "text" | "email" | "url" | "number" | "boolean" | "hours" | "media" | "textarea" | "whatsapp";
export type SettingDefinition = { key: string; label: string; group: SettingGroup; kind: SettingKind; description?: string };

export const settingDefinitions: SettingDefinition[] = [
  { key: "brand_name", label: "Brand name", group: "general", kind: "text" },
  { key: "tagline", label: "Tagline", group: "general", kind: "text" },
  { key: "phone", label: "Phone", group: "contact", kind: "text" },
  { key: "whatsapp_number", label: "WhatsApp number", group: "contact", kind: "whatsapp", description: "Country code is not added automatically." },
  { key: "email", label: "Email", group: "contact", kind: "email" },
  { key: "instagram", label: "Instagram URL", group: "social", kind: "url" },
  { key: "tiktok", label: "TikTok URL", group: "social", kind: "url" },
  { key: "facebook", label: "Facebook URL", group: "social", kind: "url" },
  { key: "address", label: "Address", group: "location", kind: "textarea" },
  { key: "google_maps_url", label: "Google Maps URL", group: "location", kind: "url" },
  { key: "latitude", label: "Latitude", group: "location", kind: "number" },
  { key: "longitude", label: "Longitude", group: "location", kind: "number" },
  { key: "opening_hours", label: "Opening hours", group: "operations", kind: "hours", description: "JSON object using day names with {\"open\":\"HH:mm\",\"close\":\"HH:mm\"} or {\"closed\":true}." },
  { key: "reservation_enabled", label: "Accept reservations", group: "operations", kind: "boolean" },
  { key: "site_title", label: "Site title", group: "seo", kind: "text" },
  { key: "meta_description", label: "Meta description", group: "seo", kind: "textarea" },
  { key: "og_title", label: "Open Graph title", group: "seo", kind: "text" },
  { key: "og_description", label: "Open Graph description", group: "seo", kind: "textarea" },
  { key: "og_image", label: "Open Graph image", group: "seo", kind: "media" },
  { key: "favicon_media_id", label: "Favicon", group: "seo", kind: "media" },
];

export const settingDefinitionMap = new Map(settingDefinitions.map((item) => [item.key, item]));
