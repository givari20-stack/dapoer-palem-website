import { osModules, type OsModuleKey } from "./config.ts";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateOsValues(module: OsModuleKey, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false as const, message: "Invalid submission." };
  const source = input as Record<string, unknown>; const values: Record<string, unknown> = {};
  for (const field of osModules[module].fields) {
    const raw = source[field.name];
    if (field.kind === "checkbox") { values[field.name] = raw === true; continue; }
    if (field.kind === "relations") { const ids=Array.isArray(raw)?raw:[]; if(!ids.every((item):item is string=>typeof item==="string"&&uuid.test(item)))return {ok:false as const,message:`${field.label} is invalid.`}; values[field.name]=[...new Set(ids)]; continue; }
    if (field.kind === "tags") { values[field.name] = typeof raw === "string" ? raw.split(",").map((item)=>item.trim()).filter(Boolean) : Array.isArray(raw) ? raw.filter((item):item is string=>typeof item==="string") : []; continue; }
    if (field.kind === "number") { if (raw === "" || raw == null) { values[field.name]=null; continue; } const number=Number(raw); if(!Number.isFinite(number)||number<0)return {ok:false as const,message:`${field.label} is invalid.`}; values[field.name]=number; continue; }
    const text=typeof raw==="string"?raw.trim():""; if(field.required&&!text)return {ok:false as const,message:`${field.label} is required.`};
    if(!text){values[field.name]=null;continue;} if((field.kind==="relation"||field.kind==="media")&&!uuid.test(text))return {ok:false as const,message:`${field.label} is invalid.`}; if(field.options&&!field.options.includes(text))return {ok:false as const,message:`${field.label} is invalid.`};
    if(field.kind==="date"&&Number.isNaN(Date.parse(`${text}T00:00:00Z`)))return {ok:false as const,message:`${field.label} is invalid.`}; if(field.kind==="datetime-local"&&Number.isNaN(Date.parse(text)))return {ok:false as const,message:`${field.label} is invalid.`}; values[field.name]=field.kind==="datetime-local"?new Date(text).toISOString():text;
  }
  return {ok:true as const,values};
}
