import { useEffect, useState } from "react";
import api from "../api/client";
import CopyField from "./CopyField";
import StatusBadge from "./StatusBadge";
import { useAuth } from "../context/AuthContext";

// Pop de detalle: muestra la info y permite copiar cada recuadro a un click
export default function AccountModal({ accountId, onClose, onEdit }) {
  const { can } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const url = can.reveal ? `/accounts/${accountId}?reveal=true` : `/accounts/${accountId}`;
    api.get(url).then((r) => setData(r.data));
  }, [accountId, can.reveal]);

  if (!data)
    return (
      <div className="fixed inset-0 bg-black/70 grid place-items-center z-50" onClick={onClose}>
        <div className="text-hive-muted">Cargando…</div>
      </div>
    );

  const proxy = data.proxy;

  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{data.profile_name}</h3>
            {data.corporate_email && <p className="text-hive-muted text-sm font-mono">{data.corporate_email}</p>}
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={data.status} />
              {data.device_name && <span className="chip bg-hive-panel2 text-hive-muted">{data.device_name}</span>}
              {data.birth_date && <span className="chip bg-hive-panel2 text-hive-muted">nac. {data.birth_date}</span>}
            </div>
          </div>
          <button className="text-hive-muted hover:text-hive-text text-xl leading-none" onClick={onClose}>×</button>
        </div>

        {!can.reveal && (
          <p className="text-warn text-xs mb-3">Tu rol no puede ver contraseñas. Solo datos básicos.</p>
        )}

        <div className="space-y-4">
          {data.corporate_email && (
            <div>
              <div className="text-xs font-semibold text-hive-accent uppercase mb-2">Correo de respaldo</div>
              <div className="grid grid-cols-2 gap-3">
                <CopyField label="Correo" value={data.corporate_email} />
                {can.reveal && <CopyField label="Contraseña" value={data.corp_password} />}
              </div>
            </div>
          )}

          {data.socials.map((s) => (
            <div key={s.id}>
              <div className="text-xs font-semibold text-hive-accent uppercase mb-2 flex items-center gap-2">
                {s.platform} <StatusBadge status={s.status} />
                {!s.username && <span className="plate work normal-case"><span className="dot" />pendiente de credenciales</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CopyField label="Correo" value={s.username} />
                {can.reveal && <CopyField label="Contraseña" value={s.password} />}
                {s.profile_url && <CopyField label="Link del perfil" value={s.profile_url} mono={false} />}
              </div>
            </div>
          ))}

          {proxy && (
            <div>
              <div className="text-xs font-semibold text-hive-accent uppercase mb-2">Proxy del celular</div>
              <div className="grid grid-cols-2 gap-3">
                <CopyField label="IP" value={proxy.ip} />
                <CopyField label="Puerto" value={String(proxy.port)} />
                <CopyField label="Usuario" value={proxy.username} />
                {can.reveal && <CopyField label="Contraseña" value={proxy.password} />}
              </div>
            </div>
          )}

          {data.notes && (
            <div>
              <div className="label">Notas internas</div>
              <p className="text-sm text-hive-text bg-hive-bg border border-hive-border rounded-md p-3">{data.notes}</p>
            </div>
          )}
        </div>

        {can.reveal && (
          <div className="flex justify-end mt-6">
            <button className="btn-primary" onClick={() => onEdit(data)}>Editar</button>
          </div>
        )}
      </div>
    </div>
  );
}
