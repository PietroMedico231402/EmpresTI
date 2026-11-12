-- Publicação manual de dados iniciais sem fotos.
-- Execute no SQL Editor do Supabase remoto somente após revisar este arquivo.
-- É idempotente: categorias e patrimônios existentes são preservados/atualizados.

begin;

insert into public.equipment_categories (tenant_id, name)
select tenant.id, category.name
from public.tenants tenant
cross join (values ('Notebook'), ('Monitor'), ('Cabo'), ('Câmera')) as category(name)
where tenant.slug = 'suporte_ti'
  and not exists (
    select 1 from public.equipment_categories existing
    where existing.tenant_id = tenant.id and existing.name = category.name
  );

with equipment_seed(asset_tag, name, category_name, status) as (
  values
    ('TI-0001', 'Notebook 14 polegadas', 'Notebook', 'AVAILABLE'::public.equipment_status),
    ('TI-0002', 'Notebook 15 polegadas', 'Notebook', 'AVAILABLE'::public.equipment_status),
    ('TI-0003', 'Notebook 13 polegadas', 'Notebook', 'AVAILABLE'::public.equipment_status),
    ('TI-0004', 'Notebook 15 polegadas', 'Notebook', 'MAINTENANCE'::public.equipment_status),
    ('TI-0005', 'Monitor 24 polegadas', 'Monitor', 'AVAILABLE'::public.equipment_status),
    ('TI-0006', 'Monitor 27 polegadas', 'Monitor', 'AVAILABLE'::public.equipment_status),
    ('TI-0007', 'Monitor 22 polegadas', 'Monitor', 'MAINTENANCE'::public.equipment_status),
    ('TI-0008', 'Cabo HDMI 2 m', 'Cabo', 'AVAILABLE'::public.equipment_status),
    ('TI-0009', 'Cabo USB-C 1 m', 'Cabo', 'AVAILABLE'::public.equipment_status),
    ('TI-0010', 'Cabo de rede 3 m', 'Cabo', 'AVAILABLE'::public.equipment_status),
    ('TI-0011', 'Webcam Full HD', 'Câmera', 'AVAILABLE'::public.equipment_status),
    ('TI-0012', 'Câmera compacta', 'Câmera', 'AVAILABLE'::public.equipment_status)
)
insert into public.equipment (tenant_id, category_id, asset_tag, name, pickup_location, status)
select tenant.id, category.id, seed.asset_tag, seed.name, 'Help Desk', seed.status
from equipment_seed seed
join public.tenants tenant on tenant.slug = 'suporte_ti'
join public.equipment_categories category on category.tenant_id = tenant.id and category.name = seed.category_name
on conflict (tenant_id, asset_tag) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  pickup_location = excluded.pickup_location,
  status = excluded.status,
  updated_at = now();

do $$
declare
  equipment_count integer;
begin
  select count(*) into equipment_count
  from public.equipment equipment
  join public.tenants tenant on tenant.id = equipment.tenant_id
  where tenant.slug = 'suporte_ti';
  if equipment_count <> 12 then
    raise exception 'Esperados 12 equipamentos em suporte_ti; encontrados %.', equipment_count;
  end if;
end $$;

commit;
