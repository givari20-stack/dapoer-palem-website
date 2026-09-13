-- Extend About into a configurable company profile and production-flow presentation.
-- Only copy explicitly approved in the implementation brief is used; verified CMS values win.
begin;

create or replace function private.is_valid_about_profile_items(
  candidate jsonb,
  require_description boolean default true,
  allow_date boolean default false,
  allow_flow_fields boolean default false
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item jsonb;
begin
  if candidate is null or jsonb_typeof(candidate) <> 'array' then return false; end if;
  for item in select value from jsonb_array_elements(candidate) loop
    if jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item -> 'name') <> 'string'
      or btrim(item ->> 'name') = ''
      or (require_description and (jsonb_typeof(item -> 'description') <> 'string' or btrim(item ->> 'description') = ''))
      or (item ? 'description' and jsonb_typeof(item -> 'description') <> 'string')
      or (item ? 'date' and (not allow_date or jsonb_typeof(item -> 'date') <> 'string' or (item ->> 'date') !~ '^\d{4}-\d{2}-\d{2}$'))
      or (item ? 'role' and (not allow_flow_fields or jsonb_typeof(item -> 'role') <> 'string'))
      or (item ? 'order' and (not allow_flow_fields or jsonb_typeof(item -> 'order') <> 'number' or (item ->> 'order')::numeric < 0))
      or (allow_flow_fields and (not (item ? 'order') or jsonb_typeof(item -> 'order') <> 'number'))
      or (item ? 'active' and (not allow_flow_fields or jsonb_typeof(item -> 'active') <> 'boolean'))
    then return false;
    end if;
  end loop;
  return true;
end;
$$;

alter table public.about_content
  add column story_heading text,
  add column story_description text,
  add column business_concept_heading text,
  add column business_concept_description text,
  add column business_concept_items jsonb not null default '[]'::jsonb,
  add column brand_identity_values jsonb not null default '[]'::jsonb,
  add column audience_items jsonb not null default '[]'::jsonb,
  add column journey_heading text,
  add column journey_items jsonb not null default '[]'::jsonb,
  add column operations_heading text,
  add column operations_description text,
  add column production_flow_heading text,
  add column production_flow_items jsonb not null default '[]'::jsonb,
  add column customer_flow_heading text,
  add column customer_flow_items jsonb not null default '[]'::jsonb,
  add column location_heading text,
  add column location_description text,
  add constraint about_content_business_concept_items_valid check (private.is_valid_about_profile_items(business_concept_items, false, false, false)),
  add constraint about_content_brand_identity_values_valid check (private.is_valid_about_profile_items(brand_identity_values, true, false, false)),
  add constraint about_content_audience_items_valid check (private.is_valid_about_profile_items(audience_items, true, false, false)),
  add constraint about_content_journey_items_valid check (private.is_valid_about_profile_items(journey_items, true, true, false)),
  add constraint about_content_production_flow_items_valid check (private.is_valid_about_profile_items(production_flow_items, true, false, true)),
  add constraint about_content_customer_flow_items_valid check (private.is_valid_about_profile_items(customer_flow_items, true, false, true));

comment on column public.about_content.production_flow_items is
  'Configurable stages only; stages are not seeded or asserted as verified company SOP.';

comment on function private.is_valid_about_profile_items(jsonb,boolean,boolean,boolean) is
  'Validates structured About company-profile items and configurable workflow stages.';

insert into public.about_content (content_key,heading,status,active)
values ('about','Tempat untuk menikmati rasa dan suasana','draft',true)
on conflict (content_key) do nothing;

update public.about_content set
  eyebrow=coalesce(nullif(eyebrow,''),'Tentang Kami'),
  heading=coalesce(nullif(heading,''),'Tempat untuk menikmati rasa dan suasana'),
  description=coalesce(nullif(description,''),'Dapoer Palem hadir sebagai cafe dan resto yang memadukan cita rasa, suasana tropis, dan pengalaman bersantap yang hangat dan nyaman.'),
  overview_heading=coalesce(nullif(overview_heading,''),'Profil Perusahaan'),
  supporting_text=coalesce(nullif(supporting_text,''),E'Dapoer Palem adalah cafe dan resto yang tumbuh dari kawasan Palem Indah, Cikarang, dengan semangat menghadirkan pengalaman bersantap yang nyaman, hangat, dan dekat dengan alam.\n\nDapoer Palem mulai berdiri pada 17 Februari 2025 dan hadir sebagai tempat untuk menikmati makanan dan minuman, berbagi cerita, serta menghabiskan waktu bersama keluarga, teman, maupun orang-orang terdekat.\n\nKonsep Dapoer Palem memadukan unsur natural dan sentuhan modern untuk menghadirkan pengalaman yang nyaman, relevan, dan mudah dinikmati oleh berbagai kalangan.'),
  vision_heading=coalesce(nullif(vision_heading,''),'Visi Kami'),
  vision_description=coalesce(nullif(vision_description,''),'Menjadi brand restoran yang unggul dan inovatif dengan cita rasa yang autentik dan kompetitif, serta menghadirkan pengalaman bersantap yang nyaman.'),
  mission_heading=coalesce(nullif(mission_heading,''),'Misi Kami'),
  mission_items=case when jsonb_array_length(mission_items)=0 then $json$[
    {"name":"Keberlanjutan","description":"Mengembangkan usaha dengan memperhatikan keberlanjutan lingkungan dan penggunaan sumber daya secara bertanggung jawab."},
    {"name":"Inovasi","description":"Terus menghadirkan ide, produk, dan pengalaman baru yang relevan dengan kebutuhan pelanggan."},
    {"name":"Pengembangan Karyawan","description":"Mendorong pertumbuhan, kemampuan, dan perkembangan setiap anggota tim."},
    {"name":"Pengalaman Kuliner","description":"Menghadirkan cita rasa yang berkualitas dan pengalaman bersantap yang berkesan."},
    {"name":"Keterlibatan dengan Komunitas","description":"Membangun hubungan yang positif dan memberikan nilai bagi komunitas di sekitar Dapoer Palem."},
    {"name":"Berorientasi pada Pelanggan","description":"Menempatkan kebutuhan dan kepuasan pelanggan sebagai bagian penting dalam setiap pengalaman yang kami hadirkan."},
    {"name":"Dari Lokal ke Global","description":"Membangun brand yang berakar dari lokal dengan semangat untuk terus berkembang dan dikenal lebih luas."}
  ]$json$::jsonb else mission_items end,
  business_concept_heading=coalesce(nullif(business_concept_heading,''),'Konsep Usaha'),
  business_concept_items=case when jsonb_array_length(business_concept_items)=0 then $json$[
    {"name":"Nature-inspired"},{"name":"Tropical"},{"name":"Warm"},{"name":"Comfortable"},{"name":"Modern"},{"name":"Family-friendly"}
  ]$json$::jsonb else business_concept_items end,
  brand_identity_heading=coalesce(nullif(brand_identity_heading,''),'Identitas dan Karakter Brand'),
  brand_identity_description=coalesce(nullif(brand_identity_description,''),'Inspired by Nature menjadi dasar dari identitas Dapoer Palem, tercermin melalui nuansa natural, karakter tropis, komunikasi yang hangat, serta suasana yang santai dan nyaman.'),
  brand_identity_values=case when jsonb_array_length(brand_identity_values)=0 then $json$[
    {"name":"Natural","description":"Menghadirkan unsur alam sebagai bagian dari suasana dan identitas Dapoer Palem."},
    {"name":"Hangat","description":"Menciptakan pengalaman yang ramah, nyaman, dan menyenangkan."},
    {"name":"Tropis","description":"Mengangkat karakter lingkungan Palem Indah melalui suasana yang segar dan santai."},
    {"name":"Modern","description":"Menghadirkan pengalaman cafe dan resto dengan sentuhan yang relevan dan mudah diterima."},
    {"name":"Ramah Keluarga","description":"Menjadi tempat yang nyaman untuk dinikmati bersama berbagai kalangan dan kelompok usia."}
  ]$json$::jsonb else brand_identity_values end,
  audience_heading=coalesce(nullif(audience_heading,''),'Target dan Segmen Pelanggan'),
  audience_items=case when jsonb_array_length(audience_items)=0 then $json$[
    {"name":"Keluarga","description":"Tempat untuk menikmati makanan dan menghabiskan waktu bersama dalam suasana yang nyaman."},
    {"name":"Pengunjung Palem Indah","description":"Pilihan untuk menikmati makanan dan minuman saat beraktivitas di kawasan Palem Indah."},
    {"name":"Pelajar","description":"Ruang singgah yang santai untuk bertemu, berbincang, dan menikmati menu."}
  ]$json$::jsonb else audience_items end,
  offerings_heading=coalesce(nullif(offerings_heading,''),'Produk dan Penawaran'),
  offerings_items=case when jsonb_array_length(offerings_items)=0 then $json$[
    {"name":"Makanan","description":"Pilihan menu makanan untuk menemani berbagai momen dan waktu makan."},
    {"name":"Kopi","description":"Pilihan minuman kopi yang dapat dinikmati dalam suasana santai."},
    {"name":"Tea & Milk Series","description":"Pilihan minuman segar dan creamy dengan beragam varian rasa."},
    {"name":"Choco Berry","description":"Kreasi cokelat dan buah dengan beragam pilihan kombinasi dan tambahan."}
  ]$json$::jsonb else offerings_items end,
  location_heading=coalesce(nullif(location_heading,''),'Lokasi dan Operasional'),
  location_description=coalesce(nullif(location_description,''),'Dapoer Palem tumbuh dari kawasan Palem Indah, Cikarang.'),
  service_channels_heading=coalesce(nullif(service_channels_heading,''),'Cara Menikmati Dapoer Palem'),
  service_channels_items=case when jsonb_array_length(service_channels_items)=0 then $json$[
    {"name":"Dine-in","description":"Menikmati makanan dan minuman secara langsung dalam suasana Dapoer Palem."},
    {"name":"Takeaway","description":"Memesan menu favorit untuk dinikmati di tempat lain."},
    {"name":"GoFood","description":"Memesan makanan dan minuman secara online melalui GoFood.","url":"https://gofood.link/a/R9gTWhh"}
  ]$json$::jsonb else service_channels_items end
where content_key='about';

commit;
