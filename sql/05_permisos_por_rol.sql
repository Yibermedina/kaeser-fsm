create or replace function visitas_restringir_columnas() returns trigger
language plpgsql security definer set search_path = public as $$
declare rol_actual rol_usuario;
begin
  rol_actual := mi_rol();
  if rol_actual is distinct from 'service_logistician' then return new; end if;
  if new.estado is distinct from old.estado or new.fecha_inicio is distinct from old.fecha_inicio
  or new.fecha_fin is distinct from old.fecha_fin or new.hora_inicio is distinct from old.hora_inicio
  or new.hora_fin is distinct from old.hora_fin or new.confirmacion is distinct from old.confirmacion
  or new.observaciones is distinct from old.observaciones or new.numero_visita is distinct from old.numero_visita
  or new.periodo is distinct from old.periodo or new.contrato_id is distinct from old.contrato_id
  or new.union_pendiente_periodo is distinct from old.union_pendiente_periodo then
    raise exception 'El Service Logistician solo puede modificar materiales y OS (visita %)', old.id using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

drop trigger if exists visitas_restringir on visitas;
create trigger visitas_restringir before update on visitas for each row execute function visitas_restringir_columnas();

drop policy if exists visitas_insertar on visitas;
create policy visitas_insertar on visitas for insert to authenticated with check (mi_rol() = 'coordinador' and exists (select 1 from contratos c where c.id = contrato_id and c.coordinador_id = mi_usuario_id()));

drop policy if exists vt_insertar on visita_tecnicos;
drop policy if exists vt_borrar on visita_tecnicos;
create policy vt_insertar on visita_tecnicos for insert to authenticated with check (mi_rol() = 'coordinador' and exists (select 1 from visitas v join contratos c on c.id = v.contrato_id where v.id = visita_id and c.coordinador_id = mi_usuario_id()));
create policy vt_borrar on visita_tecnicos for delete to authenticated using (mi_rol() = 'coordinador' and exists (select 1 from visitas v join contratos c on c.id = v.contrato_id where v.id = visita_id and c.coordinador_id = mi_usuario_id()));
