create extension if not exists pgcrypto;

alter table if exists tecnicos
  add column if not exists sucursal text;

create table if not exists agenda_actividades (
  id uuid primary key default gen_random_uuid(),
  coordinador_id uuid not null references usuarios(id) on delete cascade,
  sucursal text not null,
  tipo text not null check (tipo in (
    'Reunión',
    'Capacitación',
    'Permiso',
    'Cita médica',
    'Actividades personales',
    'Vacaciones',
    'Incapacidad',
    'Servicio puntual'
  )),
  fecha_inicio date not null,
  fecha_fin date,
  nota text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists agenda_actividad_tecnicos (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references agenda_actividades(id) on delete cascade,
  tecnico_id uuid not null references tecnicos(id) on delete cascade,
  unique (actividad_id, tecnico_id)
);

create or replace function agenda_mi_sucursal()
returns text
language sql
security definer
set search_path = public
as $$
  select sucursal from usuarios where id = auth.uid();
$$;

create or replace function agenda_tecnico_pertenece_mi_sucursal(p_tecnico_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from tecnicos t
    join usuarios u on u.id = auth.uid()
    where t.id = p_tecnico_id
      and t.sucursal = u.sucursal
      and coalesce(t.activo, true)
  );
$$;

alter table agenda_actividades enable row level security;
alter table agenda_actividad_tecnicos enable row level security;

drop policy if exists agenda_actividades_select on agenda_actividades;
create policy agenda_actividades_select
on agenda_actividades for select to authenticated
using (
  mi_rol() = 'administrador'
  or (
    mi_rol() = 'coordinador'
    and sucursal = agenda_mi_sucursal()
  )
);

drop policy if exists agenda_actividades_insert on agenda_actividades;
create policy agenda_actividades_insert
on agenda_actividades for insert to authenticated
with check (
  coordinador_id = auth.uid()
  and (
    mi_rol() = 'administrador'
    or (
      mi_rol() = 'coordinador'
      and sucursal = agenda_mi_sucursal()
    )
  )
);

drop policy if exists agenda_actividades_update on agenda_actividades;
create policy agenda_actividades_update
on agenda_actividades for update to authenticated
using (
  coordinador_id = auth.uid()
  and (
    mi_rol() = 'administrador'
    or (
      mi_rol() = 'coordinador'
      and sucursal = agenda_mi_sucursal()
    )
  )
)
with check (
  coordinador_id = auth.uid()
  and (
    mi_rol() = 'administrador'
    or (
      mi_rol() = 'coordinador'
      and sucursal = agenda_mi_sucursal()
    )
  )
);

drop policy if exists agenda_actividades_delete on agenda_actividades;
create policy agenda_actividades_delete
on agenda_actividades for delete to authenticated
using (
  coordinador_id = auth.uid()
  and (
    mi_rol() = 'administrador'
    or (
      mi_rol() = 'coordinador'
      and sucursal = agenda_mi_sucursal()
    )
  )
);

drop policy if exists agenda_actividad_tecnicos_select on agenda_actividad_tecnicos;
create policy agenda_actividad_tecnicos_select
on agenda_actividad_tecnicos for select to authenticated
using (
  mi_rol() = 'administrador'
  or exists (
    select 1
    from agenda_actividades a
    where a.id = actividad_id
      and a.sucursal = agenda_mi_sucursal()
  )
);

drop policy if exists agenda_actividad_tecnicos_insert on agenda_actividad_tecnicos;
create policy agenda_actividad_tecnicos_insert
on agenda_actividad_tecnicos for insert to authenticated
with check (
  (
    mi_rol() = 'administrador'
    or (
      mi_rol() = 'coordinador'
      and exists (
        select 1
        from agenda_actividades a
        where a.id = actividad_id
          and a.coordinador_id = auth.uid()
          and a.sucursal = agenda_mi_sucursal()
      )
      and agenda_tecnico_pertenece_mi_sucursal(tecnico_id)
    )
  )
);

drop policy if exists agenda_actividad_tecnicos_delete on agenda_actividad_tecnicos;
create policy agenda_actividad_tecnicos_delete
on agenda_actividad_tecnicos for delete to authenticated
using (
  mi_rol() = 'administrador'
  or exists (
    select 1
    from agenda_actividades a
    where a.id = actividad_id
      and a.coordinador_id = auth.uid()
      and a.sucursal = agenda_mi_sucursal()
  )
);

create index if not exists agenda_actividades_sucursal_fecha_idx
  on agenda_actividades (sucursal, fecha_inicio, fecha_fin);

create index if not exists agenda_actividad_tecnicos_actividad_idx
  on agenda_actividad_tecnicos (actividad_id);

create index if not exists agenda_actividad_tecnicos_tecnico_idx
  on agenda_actividad_tecnicos (tecnico_id);
