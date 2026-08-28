drop policy if exists usuarios_leer on usuarios;
create policy usuarios_leer on usuarios for select to authenticated using (correo = (auth.jwt() ->> 'email') or mi_rol() = 'administrador' or id in (select coordinadores_visibles()));

create or replace view vista_calendario as
select v.id as visita_id, v.contrato_id, v.periodo, v.numero_visita, v.estado, v.fecha_inicio, v.fecha_fin, v.hora_inicio, v.hora_fin, v.os, v.confirmacion, v.estado_materiales, v.observaciones, v.union_pendiente_periodo, c.numero as contrato_numero, c.coordinador_id, cli.nombre as cliente_nombre, cli.ciudad, cli.direccion,
coalesce(array_agg(t.nombre order by t.nombre) filter (where t.id is not null), '{}') as tecnicos_nombres,
coalesce(array_agg(t.id order by t.nombre) filter (where t.id is not null), '{}') as tecnicos_ids,
v.detalle_materiales, u.nombre as coordinador_nombre
from visitas v join contratos c on c.id = v.contrato_id join clientes cli on cli.id = c.cliente_id
left join usuarios u on u.id = c.coordinador_id left join visita_tecnicos vt on vt.visita_id = v.id left join tecnicos t on t.id = vt.tecnico_id
where c.activo group by v.id, c.numero, c.coordinador_id, cli.nombre, cli.ciudad, cli.direccion, u.nombre;

alter view vista_calendario set (security_invoker = on);
create index if not exists visitas_periodo_material_idx on visitas (periodo, estado_materiales);
