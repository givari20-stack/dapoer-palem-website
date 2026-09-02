-- Atomic menu CSV import and bulk updates. Existing RLS and revision/audit functions remain authoritative.
begin;

create or replace function public.bulk_import_menu_items(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entry jsonb;
  values_json jsonb;
  target_id uuid;
  expected_updated_at timestamptz;
  saved public.menu_items;
  created_count integer := 0;
  updated_count integer := 0;
  result_items jsonb := '[]'::jsonb;
  snapshot jsonb;
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin','content_manager']::text[]) then
    raise exception using errcode = '42501', message = 'MENU_BULK_PERMISSION_DENIED';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_MENU_IMPORT';
  end if;

  for entry in select value from jsonb_array_elements(p_rows)
  loop
    values_json := entry->'values';
    target_id := nullif(entry->>'id','')::uuid;
    expected_updated_at := nullif(entry->>'expected_updated_at','')::timestamptz;
    if values_json is null or jsonb_typeof(values_json) <> 'object' then
      raise exception using errcode = '22023', message = 'INVALID_MENU_IMPORT_ROW';
    end if;

    if target_id is null then
      insert into public.menu_items (
        category_id,name,slug,description,price,original_price,sku,badge,
        featured,availability,status,display_order
      ) values (
        (values_json->>'category_id')::uuid,
        values_json->>'name',
        values_json->>'slug',
        nullif(values_json->>'description',''),
        (values_json->>'price')::numeric,
        nullif(values_json->>'original_price','')::numeric,
        nullif(values_json->>'sku',''),
        nullif(values_json->>'badge',''),
        (values_json->>'featured')::boolean,
        values_json->>'availability',
        values_json->>'status',
        (values_json->>'display_order')::integer
      ) returning * into saved;
      created_count := created_count + 1;
    else
      update public.menu_items set
        category_id = (values_json->>'category_id')::uuid,
        name = values_json->>'name',
        slug = values_json->>'slug',
        description = nullif(values_json->>'description',''),
        price = (values_json->>'price')::numeric,
        original_price = nullif(values_json->>'original_price','')::numeric,
        sku = nullif(values_json->>'sku',''),
        badge = nullif(values_json->>'badge',''),
        featured = (values_json->>'featured')::boolean,
        availability = values_json->>'availability',
        status = values_json->>'status',
        display_order = (values_json->>'display_order')::integer
      where id = target_id and expected_updated_at is not null and updated_at = expected_updated_at
      returning * into saved;
      if not found then raise exception using errcode = '40001', message = 'BULK_MENU_CONFLICT'; end if;
      updated_count := updated_count + 1;
    end if;

    snapshot := jsonb_build_object(
      'name',saved.name,'slug',saved.slug,'category_id',saved.category_id,
      'description',saved.description,'price',saved.price,'original_price',saved.original_price,
      'image_media_id',saved.image_media_id,'badge',saved.badge,'sku',saved.sku,
      'display_order',saved.display_order,'featured',saved.featured,
      'availability',saved.availability,'status',saved.status
    );
    perform public.record_cms_revision(
      'menu_items', saved.id, snapshot,
      case when target_id is null then 'Created menu item by CSV import' else 'Updated menu item by confirmed CSV import' end,
      case when target_id is null then 'create' else 'update' end
    );
    result_items := result_items || jsonb_build_array(to_jsonb(saved));
  end loop;

  return jsonb_build_object('created',created_count,'updated',updated_count,'items',result_items);
end;
$$;

create or replace function public.bulk_update_menu_items(
  p_ids uuid[], p_changes jsonb, p_action text default 'update'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_id uuid;
  saved public.menu_items;
  changed_count integer := 0;
  result_items jsonb := '[]'::jsonb;
  snapshot jsonb;
begin
  if auth.uid() is null or not private.has_any_role(array['super_admin','content_manager']::text[]) then
    raise exception using errcode = '42501', message = 'MENU_BULK_PERMISSION_DENIED';
  end if;
  if p_ids is null or cardinality(p_ids) < 1 or cardinality(p_ids) > 500 or p_changes is null or jsonb_typeof(p_changes) <> 'object'
    or p_changes = '{}'::jsonb or p_action not in ('update','archive','restore')
    or exists (select 1 from jsonb_object_keys(p_changes) as keys(key_name) where key_name not in ('category_id','featured','availability','status','display_order')) then
    raise exception using errcode = '22023', message = 'INVALID_MENU_BULK_UPDATE';
  end if;

  foreach target_id in array p_ids
  loop
    update public.menu_items set
      category_id = case when p_changes ? 'category_id' then (p_changes->>'category_id')::uuid else category_id end,
      featured = case when p_changes ? 'featured' then (p_changes->>'featured')::boolean else featured end,
      availability = case when p_changes ? 'availability' then p_changes->>'availability' else availability end,
      status = case when p_changes ? 'status' then p_changes->>'status' else status end,
      display_order = case when p_changes ? 'display_order' then (p_changes->>'display_order')::integer else display_order end
    where id = target_id
    returning * into saved;
    if not found then raise exception using errcode = 'P0002', message = 'MENU_ITEM_NOT_FOUND'; end if;

    snapshot := jsonb_build_object(
      'name',saved.name,'slug',saved.slug,'category_id',saved.category_id,
      'description',saved.description,'price',saved.price,'original_price',saved.original_price,
      'image_media_id',saved.image_media_id,'badge',saved.badge,'sku',saved.sku,
      'display_order',saved.display_order,'featured',saved.featured,
      'availability',saved.availability,'status',saved.status
    );
    perform public.record_cms_revision(
      'menu_items', saved.id, snapshot,
      case p_action when 'archive' then 'Bulk archived menu item' when 'restore' then 'Bulk restored menu item as draft' else 'Bulk edited menu item' end,
      p_action
    );
    changed_count := changed_count + 1;
    result_items := result_items || jsonb_build_array(to_jsonb(saved));
  end loop;

  return jsonb_build_object('updated',changed_count,'items',result_items);
end;
$$;

revoke all on function public.bulk_import_menu_items(jsonb) from public,anon,authenticated;
revoke all on function public.bulk_update_menu_items(uuid[],jsonb,text) from public,anon,authenticated;
grant execute on function public.bulk_import_menu_items(jsonb) to authenticated;
grant execute on function public.bulk_update_menu_items(uuid[],jsonb,text) to authenticated;

comment on function public.bulk_import_menu_items(jsonb) is 'Atomically imports server-validated menu items through existing RLS, revision, and audit controls.';
comment on function public.bulk_update_menu_items(uuid[],jsonb,text) is 'Atomically updates only selected menu fields through existing RLS, revision, and audit controls.';
commit;
