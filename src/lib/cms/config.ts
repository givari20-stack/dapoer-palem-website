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
  | "relation"
  | "repeatable";

export type CmsRepeatableItemField = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "url" | "number" | "checkbox" | "date";
  required?: boolean;
};

export type CmsField = {
  name: string;
  label: string;
  kind: CmsFieldKind;
  required?: boolean;
  options?: readonly string[];
  relationKey?: string;
  step?: string;
  min?: number;
  maxLength?: number;
  maxItems?: number;
  itemFields?: readonly CmsRepeatableItemField[];
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
    description: "Manage the fixed About page story, structured editorial sections, media, SEO, and call to action.",
    titleField: "heading",
    statusField: "status",
    statuses: generalStatuses,
    activeField: "active",
    fields: [
      { name: "eyebrow", label: "Eyebrow", kind: "text" },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea" },
      { name: "supporting_text", label: "Overview paragraphs", kind: "textarea" },
      { name: "overview_heading", label: "Overview heading", kind: "text" },
      { name: "story_heading", label: "Brand story heading", kind: "text" },
      { name: "story_description", label: "Brand story", kind: "textarea" },
      { name: "vision_heading", label: "Vision heading", kind: "text" },
      { name: "vision_description", label: "Vision description", kind: "textarea" },
      { name: "mission_heading", label: "Mission heading", kind: "text" },
      { name: "mission_items", label: "Mission items", kind: "repeatable", maxItems: 7, itemFields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
      ] },
      { name: "image_media_id", label: "Hero / overview media", kind: "media" },
      { name: "founder_heading", label: "Founder heading", kind: "text" },
      { name: "founder_name", label: "Founder name", kind: "text" },
      { name: "founder_role", label: "Founder role", kind: "text" },
      { name: "founder_description", label: "Founder description", kind: "textarea" },
      { name: "founder_image_media_id", label: "Founder media", kind: "media" },
      { name: "brand_identity_heading", label: "Brand Identity heading", kind: "text" },
      { name: "brand_identity_description", label: "Brand Identity description", kind: "textarea" },
      { name: "brand_identity_values", label: "Brand values", kind: "repeatable", itemFields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
      ] },
      { name: "audience_heading", label: "Audience heading", kind: "text" },
      { name: "audience_description", label: "Audience description", kind: "textarea" },
      { name: "audience_items", label: "Audience segments", kind: "repeatable", itemFields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
      ] },
      { name: "business_concept_heading", label: "Business concept heading", kind: "text" },
      { name: "business_concept_description", label: "Business concept description", kind: "textarea" },
      { name: "business_concept_items", label: "Business concept points", kind: "repeatable", itemFields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea" },
      ] },
      { name: "offerings_heading", label: "Offerings heading", kind: "text" },
      { name: "offerings_items", label: "Offering items", kind: "repeatable", itemFields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
      ] },
      { name: "service_channels_heading", label: "Service Channels heading", kind: "text" },
      { name: "service_channels_items", label: "Service channel items", kind: "repeatable", itemFields: [
        { name: "name", label: "Name", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
        { name: "url", label: "URL", kind: "url" },
      ] },
      { name: "journey_heading", label: "Business journey heading", kind: "text" },
      { name: "journey_items", label: "Confirmed journey milestones", kind: "repeatable", itemFields: [
        { name: "name", label: "Milestone", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
        { name: "date", label: "Date", kind: "date" },
      ] },
      { name: "operations_heading", label: "Operations heading", kind: "text" },
      { name: "operations_description", label: "Operations description", kind: "textarea" },
      { name: "production_flow_heading", label: "Production flow heading", kind: "text" },
      { name: "production_flow_items", label: "Verified production stages", kind: "repeatable", itemFields: [
        { name: "name", label: "Stage", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
        { name: "role", label: "Role / function", kind: "text" },
        { name: "order", label: "Order", kind: "number", required: true },
        { name: "active", label: "Active", kind: "checkbox" },
      ] },
      { name: "customer_flow_heading", label: "Product-to-customer flow heading", kind: "text" },
      { name: "customer_flow_items", label: "Verified customer-flow stages", kind: "repeatable", itemFields: [
        { name: "name", label: "Stage", kind: "text", required: true },
        { name: "description", label: "Description", kind: "textarea", required: true },
        { name: "role", label: "Role / function", kind: "text" },
        { name: "order", label: "Order", kind: "number", required: true },
        { name: "active", label: "Active", kind: "checkbox" },
      ] },
      { name: "location_heading", label: "Location and operations heading", kind: "text" },
      { name: "location_description", label: "Location and operations description", kind: "textarea" },
      { name: "cta_label", label: "CTA label", kind: "text" },
      { name: "cta_url", label: "CTA URL", kind: "text" },
      { name: "seo_title", label: "SEO title", kind: "text" },
      { name: "seo_description", label: "SEO description", kind: "textarea" },
      { name: "seo_image_media_id", label: "SEO Open Graph media", kind: "media" },
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
      { name: "name", label: "Name", kind: "text", required: true, maxLength: 160 },
      { name: "slug", label: "Slug", kind: "text", required: true, maxLength: 160 },
      { name: "description", label: "Description", kind: "textarea", maxLength: 2000 },
      { name: "image_media_id", label: "Selected media", kind: "media" },
      { name: "display_order", label: "Display order", kind: "number", required: true, min: 0 },
      { name: "active", label: "Active", kind: "checkbox" },
      { name: "status", label: "Status", kind: "select", required: true, options: generalStatuses },
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
