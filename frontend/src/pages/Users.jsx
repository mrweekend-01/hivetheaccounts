import { useEffect, useState } from "react";
import api from "../api/client";

const empty = { username: "", full_name: "", password: "", role: "operador", is_active: true };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);

  function load() { api.get("/users").then((r) => setUsers(r.data)); }
  useEffect(load, []);

  async function save() {
    try {
      if (form.id) {
        const body = { full_name: form.full_name, role: form.role, is_active: form.is_active };
        if (form.password) body.password = form.password;
        await api.put(`/users/${form.id}`, body);
      } else {
        await api.post("/users", form);
      }
      setForm(null); load();
    } catch (e) { alert(e.response?.data?.detail || "Error"); }
  }

  async function del(u) {
    if (!confirm(`¿Eliminar a ${u.username}?`)) return;
    await api.delete(`/users/${u.id}`); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Usuarios</h1>
        <button className="btn-primary" onClick={() => setForm({ ...empty })}>+ Usuario</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-hive-panel2 text-hive-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Usuario</th>
              <th className="text-left px-4 py-2.5">Nombre</th>
              <th className="text-left px-4 py-2.5">Rol</th>
              <th className="text-left px-4 py-2.5">Activo</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-hive-border">
                <td className="px-4 py-3 font-mono">{u.username}</td>
                <td className="px-4 py-3">{u.full_name || "—"}</td>
                <td className="px-4 py-3"><span className="chip bg-hive-panel2 text-hive-accent uppercase">{u.role}</span></td>
                <td className="px-4 py-3">{u.is_active ? "sí" : "no"}</td>
                <td className="px-4 py-3 text-right">
                  <button className="btn-ghost text-xs mr-2" onClick={() => setForm({
                    id: u.id, username: u.username, full_name: u.full_name || "",
                    password: "", role: u.role, is_active: u.is_active })}>Editar</button>
                  <button className="btn-danger text-xs" onClick={() => del(u)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={() => setForm(null)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{form.id ? "Editar usuario" : "Nuevo usuario"}</h3>
            {!form.id && (
              <>
                <label className="label">Usuario</label>
                <input className="input mb-3" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </>
            )}
            <label className="label">Nombre completo</label>
            <input className="input mb-3" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <label className="label">Contraseña {form.id && "(vacío = no cambiar)"}</label>
            <input className="input mb-3" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <label className="label">Rol</label>
            <select className="input mb-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">admin (todo)</option>
              <option value="editor">editor (CRUD + ver contraseñas)</option>
              <option value="operador">operador (ver, estado y notas)</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Usuario activo
            </label>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button className="btn-primary" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
