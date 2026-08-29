export type CmsModuleKey =
  | "about-content"
  | "homepage-content"
  | "homepage-experiences"
  | "menu-categories"
  | "menu-items"
  | "promos"
  | "events"
  | "gallery";

export type CmsFieldKind =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "date"
  | "time"
  | "datetime-local"
  | "media"
  | "relation";

export type CmsField = {
  name: string;
  label: string;
  kind: CmsFieldKind;
  required?: boolean;
  options?: readonly string[];
  relationKey?: string;
  step?: string;
  min?: number;
};

export type CmsModuleConfig = {
  key: CmsModuleKey;
  table: string;
  title: string;
  singular: string;
  description: string;
  titleField: string;
  statusField?: "status";
  statuses?: readonly string[];
  activeField?: "active";
  fields: readonly CmsField[];
};

const generalStatuses = ["draft", "published", "archived"] as const;

export const cmsModules: Record<CmsModuleKey, CmsModuleConfig> = {
  "about-content": {
    key: "about-content",
    table: "about_content",
    title: "About Page",
    singular: "about page",
    description: "Manage the fixed About page story, image, and call to action.",
    titleField: "heading",
    statusField: "status",
    statuses: generalStatuses,
    activeField: "active",
    fields: [
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "supporting_text", label: "Supporting text", kind: "textarea" },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "cta_label", label: "CTA label", kind: "text" },
      { name: "cta_url", label: "CTA URL", kind: "text" },
      { name: "active", label: "Active", kind: "checkbox" },
      { name: "status", label: "Status", kind: "select", required: true, options: generalStatuses },
    ],
  },
  "homepage-content": {
    key: "homepage-content",
    table: "homepage_content",
    title: "Homepage Sections",
    singular: "homepage section",
    description: "Edit copy and calls to action without changing page structure.",
    titleField: "section_key",
    statusField: "status",
    statuses: generalStatuses,
    activeField: "active",
    fields: [
      { name: "section_key", label: "Section", kind: "select", required: true, options: ["hero", "introduction", "menu_cta", "venue", "reservation_cta", "location"] },
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "heading", label: "Heading", kind: "text" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "primary_button_label", label: "Primary button label", kind: "text" },
      { name: "primary_button_url", label: "Primary button URL", kind: "text" },
      { name: "secondary_button_label", label: "Secondary button label", kind: "text" },
      { name: "secondary_button_url", label: "Secondary button URL", kind: "text" },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "active", label: "Active", kind: "checkbox" },
      { name: "status", label: "Status", kind: "select", required: true, options: generalStatuses },
    ],
  },
  "homepage-experiences": {
    key: "homepage-experiences",
    table: "homepage_experiences",
    title: "Homepage Experiences",
    singular: "experience",
    description: "Manage the fixed experience cards displayed on the homepage.",
    titleField: "title",
    statusField: "status",
    statuses: generalStatuses,
    activeField: "active",
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "link_url", label: "Link URL", kind: "text" },
      { name: "display_order", label: "Display order", kind: "number", required: true, min: 0 },
      { name: "active", label: "Active", kind: "checkbox" },
      { name: "status", label: "Status", kind: "select", required: true, options: generalStatuses },
    ],
  },
  "menu-categories": {
    key: "menu-categories",
    table: "menu_categories",
    title: "Menu Categories",
    singular: "category",
    description: "Organize menu items into active public categories.",
    titleField: "name",
    statusField: "status",
    statuses: generalStatuses,
    activeField: "active",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "display_order", label: "Display order", kind: "number", required: true, min: 0 },
      { name: "active", label: "Active", kind: "checkbox" },
    ],
  },
  "menu-items": {
    key: "menu-items",
    table: "menu_items",
    title: "Menu Items",
    singular: "menu item",
    description: "Create, price, publish, and organize menu items.",
    titleField: "name",
    statusField: "status",
    statuses: generalStatuses,
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "category_id", label: "Category", kind: "relation", required: true, relationKey: "categories" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "price", label: "Price (IDR)", kind: "number", required: true, min: 0, step: "1" },
      { name: "original_price", label: "Original price (IDR)", kind: "number", min: 0, step: "1" },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "badge", label: "Badge", kind: "text" },
      { name: "sku", label: "SKU", kind: "text" },
      { name: "display_order", label: "Display order", kind: "number", required: true, min: 0 },
      { name: "featured", label: "Featured", kind: "checkbox" },
      { name: "availability", label: "Availability", kind: "select", required: true, options: ["available", "unavailable"] },
      { name: "status", label: "Status", kind: "select", required: true, options: generalStatuses },
    ],
  },
  promos: {
    key: "promos",
    table: "promos",
    title: "Promos",
    singular: "promo",
    description: "Manage time-bound offers and their public visibility.",
    titleField: "title",
    statusField: "status",
    statuses: ["draft", "scheduled", "published", "expired", "archived"],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "short_description", label: "Short description", kind: "textarea" },
      { name: "full_description", label: "Full description", kind: "textarea" },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "start_date", label: "Start date", kind: "datetime-local" },
      { name: "end_date", label: "End date", kind: "datetime-local" },
      { name: "terms", label: "Terms", kind: "textarea" },
      { name: "cta_label", label: "CTA label", kind: "text" },
      { name: "cta_url", label: "CTA URL", kind: "text" },
      { name: "display_order", label: "Display order", kind: "number", required: true, min: 0 },
      { name: "status", label: "Status", kind: "select", required: true, options: ["draft", "scheduled", "published", "expired", "archived"] },
    ],
  },
  events: {
    key: "events",
    table: "events",
    title: "Events",
    singular: "event",
    description: "Manage event dates, details, and publication state.",
    titleField: "title",
    statusField: "status",
    statuses: ["draft", "scheduled", "published", "completed", "cancelled", "archived"],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "event_date", label: "Event date", kind: "date", required: true },
      { name: "start_time", label: "Start time", kind: "time" },
      { name: "end_time", label: "End time", kind: "time" },
      { name: "location", label: "Location", kind: "text" },
      { name: "cta_label", label: "CTA label", kind: "text" },
      { name: "cta_url", label: "CTA URL", kind: "text" },
      { name: "display_order", label: "Display order", kind: "number", required: true, min: 0 },
      { name: "status", label: "Status", kind: "select", required: true, options: ["draft", "scheduled", "published", "completed", "cancelled", "archived"] },
    ],
  },
  gallery: {
    key: "gallery",
    table: "gallery_items",
    title: "Gallery",
    singular: "gallery item",
    description: "Reference existing media without creating duplicate files.",
    titleField: "title",
    statusField: "status",
    statuses: generalStatuses,
    activeField: "active",
    fields: [
      { name: "media_id", label: "Selected media", kind: "media", required: true },
      { name: "title", label: "Title", kind: "text" },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "category", label: "Category", kind: "select", required: true, options: ["food", "drinks", "interior", "outdoor", "atmosphere", "events", "other"] },
      { name: "alt_text", label: "Alt text", kind: "text" },
      { name: "display_order", label: "Display order", kind: "number", required: true, min: 0 },
      { name: "active", label: "Active", kind: "checkbox" },
      { name: "status", label: "Status", kind: "select", required: true, options: generalStatuses },
    ],
  },
};

export function isCmsModuleKey(value: string): value is CmsModuleKey {
  return Object.hasOwn(cmsModules, value);
}
