create or replace view vista_admin_avance as
select c.coordinador_id, u.nombre as coordinador_nombre, coalesce(nullif(u.sucursal, ''), 'Sin sucursal') as sucursal, u.activo as coordinador_activo, v.periodo, count(*)::int as total, count(*) filter (where v.estado = 'ejecutado')::int as ejecutadas, count(*) filter (where v.estado = 'programado')::int as programadas, count(*) filter (where v.estado = 'pendiente')::int as pendientes, count(*) filter (where v.estado = 'reprogramada')::int as reprogramadas
from visitas v join contratos c on c.id = v.contrato_id and c.activo join usuarios u on u.id = c.coordinador_id
group by c.coordinador_id, u.nombre, u.sucursal, u.activo, v.periodo;

alter view vista_admin_avance set (security_invoker = on);

create policy usuarios_admin_insertar on usuarios for insert to authenticated with check (mi_rol() = 'administrador');
create policy usuarios_admin_actualizar on usuarios for update to authenticated using (mi_rol() = 'administrador') with check (mi_rol() = 'administrador');

create or replace function usuarios_proteger_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.id = mi_usuario_id() and (new.rol is distinct from old.rol or new.activo is distinct from old.activo) then
    raise exception 'No puedes cambiar tu propio rol ni desactivarte' using errcode = 'insufficient_privilege';
  end if;
  if old.rol = 'administrador' and new.rol is distinct from 'administrador' and (select count(*) from usuarios where rol = 'administrador' and activo) <= 1 then
    raise exception 'Debe quedar al menos un administrador activo' using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

drop trigger if exists usuarios_proteger on usuarios;
create trigger usuarios_proteger before update on usuarios for each row execute function usuarios_proteger_admin();
