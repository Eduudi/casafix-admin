import { useState, useEffect } from "react";

// ─── SUPABASE ────────────────────────────────────────────────
const SUPABASE_URL = "https://pttbpywteivrcnvhpmxi.supabase.co";
const SUPABASE_KEY = "sb_publishable_DHepCUr-K6nqE9YFPGtSXA_niYxTOsK";
const ADMIN_EMAIL  = "carloseduardodemelogonzaga@gmail.com";

const api = async (path, opts = {}) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!r.ok) return null;
  const text = await r.text();
  return text ? JSON.parse(text) : null;
};

const signIn = async (email, password) => {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ email, password }),
  });
  return r.json();
};

// ─── TEMA ────────────────────────────────────────────────────
const T = {
  bg: "#0A0A14", surface: "#11111E", card: "#181828",
  border: "#252540", orange: "#FF6B2B", green: "#00D68F",
  yellow: "#FFB800", red: "#FF4757", blue: "#3D8EFF",
  purple: "#A855F7", text: "#F0F0FA", muted: "#6868A0",
  font: "'Georgia', serif",
};

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.text}; font-family: 'Segoe UI', system-ui, sans-serif; }
  input, textarea, select { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; } 
  ::-webkit-scrollbar-track { background: ${T.surface}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

// ─── COMPONENTES BASE ─────────────────────────────────────────
const Btn = ({ children, onClick, color = T.orange, outline, style: s = {}, disabled, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? "transparent" : disabled ? T.border : `linear-gradient(135deg, ${color}, ${color}CC)`,
    color: outline ? color : "#fff",
    border: outline ? `1.5px solid ${color}55` : "none",
    borderRadius: 10, padding: small ? "6px 14px" : "10px 20px",
    fontWeight: 700, fontSize: small ? 12 : 14,
    cursor: disabled ? "default" : "pointer",
    boxShadow: outline || disabled ? "none" : `0 4px 14px ${color}33`,
    fontFamily: "inherit", opacity: disabled ? 0.5 : 1,
    transition: "opacity 0.15s", ...s,
  }}>{children}</button>
);

const Badge = ({ text, color = T.orange }) => (
  <span style={{ background: `${color}18`, color, border: `1px solid ${color}33`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{text}</span>
);

const Card = ({ children, style: s = {} }) => (
  <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, ...s }}>{children}</div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto", animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
        <h3 style={{ color: T.text, fontWeight: 800, fontSize: 16 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20 }}>✕</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", placeholder, options, multiline }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ color: T.muted, fontSize: 12, display: "block", marginBottom: 5 }}>{label}</label>
    {multiline ? (
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3}
        style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14, outline: "none", resize: "vertical" }} />
    ) : options ? (
      <select value={value} onChange={onChange}
        style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14, outline: "none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14, outline: "none" }} />
    )}
  </div>
);

// ─── LOGIN ADMIN ──────────────────────────────────────────────
function LoginAdmin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!email || !pass) { setError("Preencha todos os campos"); return; }
    if (email !== ADMIN_EMAIL) { setError("Acesso negado. Apenas administradores."); return; }
    setLoading(true); setError("");
    const res = await signIn(email, pass);
    if (res.error) { setError("E-mail ou senha incorretos"); setLoading(false); return; }
    onLogin({ email, token: res.access_token });
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at top, ${T.orange}15, transparent 60%), ${T.bg}`, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>⚙️</div>
          <h1 style={{ color: T.text, fontSize: 26, fontWeight: 900, fontFamily: T.font }}>CASAFIX Admin</h1>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>Painel de Administração</p>
        </div>
        <Card>
          <div style={{ background: `${T.orange}12`, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ color: T.orange, fontSize: 12, fontWeight: 600 }}>🔐 Acesso restrito a administradores</p>
          </div>
          <Field label="E-mail administrativo" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@casafix.com" />
          <Field label="Senha" value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" />
          {error && <div style={{ background: `${T.red}18`, border: `1px solid ${T.red}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}><p style={{ color: T.red, fontSize: 13 }}>{error}</p></div>}
          <Btn onClick={handle} disabled={loading} style={{ width: "100%", marginTop: 4 }}>
            {loading ? "⏳ Verificando..." : "Entrar no Painel →"}
          </Btn>
        </Card>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, pros: 0, services: 0, revenue: 0, fee: 0, pending: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [orders, pros, svcs] = await Promise.all([
        api("orders?select=price,status"),
        api("professionals?select=id,available"),
        api("services?select=id"),
      ]);
      const o = orders || [];
      const revenue = o.reduce((s, x) => s + (x.price || 0), 0);
      setStats({
        orders: o.length, pros: (pros || []).length,
        services: (svcs || []).length,
        revenue, fee: revenue * 0.1,
        pending: o.filter(x => x.status === "pending").length,
      });
      const rec = await api("orders?select=*,services(name),profiles!client_id(full_name)&order=created_at.desc&limit=5");
      setRecent(rec || DEMO_ORDERS);
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { icon: "💰", label: "Receita Total", value: `R$ ${stats.revenue.toFixed(0)}`, color: T.orange },
    { icon: "💸", label: "Taxa App (10%)", value: `R$ ${stats.fee.toFixed(0)}`, color: T.green },
    { icon: "🛠️", label: "Total de Pedidos", value: stats.orders, color: T.blue },
    { icon: "⏳", label: "Pendentes", value: stats.pending, color: T.yellow },
    { icon: "👷", label: "Profissionais", value: stats.pros, color: T.purple },
    { icon: "📋", label: "Serviços", value: stats.services, color: T.orange },
  ];

  const statusCfg = {
    pending: { label: "Pendente", color: T.muted },
    confirmed: { label: "Confirmado", color: T.blue },
    in_progress: { label: "Em andamento", color: T.yellow },
    completed: { label: "Concluído", color: T.green },
    paid: { label: "Pago", color: T.green },
    cancelled: { label: "Cancelado", color: T.red },
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, fontFamily: T.font }}>📊 Dashboard</h2>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Visão geral do CASAFIX em tempo real</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: T.muted }}>Carregando dados...</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            {statCards.map(s => (
              <Card key={s.label} style={{ padding: 16 }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</p>
                <p style={{ color: s.color, fontWeight: 900, fontSize: 22, marginBottom: 4 }}>{s.value}</p>
                <p style={{ color: T.muted, fontSize: 11 }}>{s.label}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 style={{ color: T.text, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>📋 Pedidos Recentes</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["ID", "Serviço", "Cliente", "Valor", "Status"].map(h => (
                    <th key={h} style={{ color: T.muted, fontSize: 11, fontWeight: 600, textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recent.length ? recent : DEMO_ORDERS).map((o, i) => {
                  const st = statusCfg[o.status] || { label: o.status, color: T.muted };
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 12px", color: T.muted, fontSize: 12 }}>#{String(o.id || i).slice(0, 8)}</td>
                      <td style={{ padding: "10px 12px", color: T.text, fontSize: 13 }}>{o.servicos?.name || o.service_name || "—"}</td>
                      <td style={{ padding: "10px 12px", color: T.text, fontSize: 13 }}>{o.profiles?.full_name || o.client_name || "—"}</td>
                      <td style={{ padding: "10px 12px", color: T.orange, fontWeight: 700, fontSize: 13 }}>R$ {o.price || o.value || 0}</td>
                      <td style={{ padding: "10px 12px" }}><Badge text={st.label} color={st.color} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── PROFISSIONAIS ────────────────────────────────────────────
function Profissionais() {
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  const load = async () => {
    setLoading(true);
    const data = await api("professionals?select=*,profiles(full_name,email,phone)&order=rating.desc");
    setPros(data?.length ? data : DEMO_PROS);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAvailable = async (pro) => {
    await api(`professionals?id=eq.${pro.id}`, {
      method: "PATCH", body: JSON.stringify({ available: !pro.available }),
    });
    setPros(prev => prev.map(p => p.id === pro.id ? { ...p, available: !p.available } : p));
  };

  const savePro = async (pro) => {
    if (pro.id && !String(pro.id).startsWith("demo")) {
      await api(`professionals?id=eq.${pro.id}`, {
        method: "PATCH",
        body: JSON.stringify({ specialty: pro.specialty, badge: pro.badge, available: pro.available }),
      });
    }
    setPros(prev => prev.map(p => p.id === pro.id ? pro : p));
    setModal(null);
  };

  const filtered = pros.filter(p => {
    const name = p.profiles?.full_name || p.name || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "todos" || (filter === "ativos" && p.available) || (filter === "inativos" && !p.available) || (filter === "pendentes" && !p.badge);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, fontFamily: T.font }}>👷 Profissionais</h2>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Gerencie e libere profissionais</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar profissional..." style={{ flex: 1, minWidth: 200, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 14px", color: T.text, fontSize: 13, outline: "none" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[["todos", "Todos"], ["ativos", "🟢 Ativos"], ["inativos", "🔴 Inativos"], ["pendentes", "⏳ Pendentes"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? T.orange : T.card, color: filter === v ? "#fff" : T.muted, border: `1px solid ${filter === v ? T.orange : T.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        </div>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["Profissional", "Especialidade", "Avaliação", "Serviços", "Badge", "Status", "Ações"].map(h => (
                  <th key={h} style={{ color: T.muted, fontSize: 11, fontWeight: 600, textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pro, i) => (
                <tr key={pro.id || i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${pro.available ? T.green : T.muted}BB, ${pro.available ? T.green : T.muted}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0 }}>
                        {(pro.profiles?.full_name || pro.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>{pro.profiles?.full_name || pro.name || "—"}</p>
                        <p style={{ color: T.muted, fontSize: 11 }}>{pro.profiles?.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: T.text, fontSize: 13 }}>{pro.specialty || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ color: T.yellow, fontSize: 13, fontWeight: 700 }}>★ {pro.rating || "0"}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: T.text, fontSize: 13 }}>{pro.total_jobs || 0}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {pro.badge ? <Badge text={pro.badge} color={pro.badge === "Top Profissional" ? T.yellow : T.green} /> : <span style={{ color: T.muted, fontSize: 12 }}>Sem badge</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => toggleAvailable(pro)} style={{ background: pro.available ? `${T.green}18` : `${T.red}18`, color: pro.available ? T.green : T.red, border: `1px solid ${pro.available ? T.green : T.red}33`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      {pro.available ? "🟢 Ativo" : "🔴 Inativo"}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn onClick={() => setModal({ ...pro })} small color={T.blue} outline>✏️ Editar</Btn>
                      <Btn onClick={() => toggleAvailable(pro)} small color={pro.available ? T.red : T.green} outline>
                        {pro.available ? "Bloquear" : "Liberar"}
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modal && (
        <Modal title="✏️ Editar Profissional" onClose={() => setModal(null)}>
          <Field label="Nome" value={modal.profiles?.full_name || modal.name || ""} onChange={() => {}} />
          <Field label="Especialidade" value={modal.specialty || ""} onChange={e => setModal(m => ({ ...m, specialty: e.target.value }))} placeholder="Ex: Elétrica Geral" />
          <Field label="Badge" value={modal.badge || ""} onChange={e => setModal(m => ({ ...m, badge: e.target.value }))}
            options={[{ value: "", label: "Sem badge" }, { value: "Verificado", label: "✅ Verificado" }, { value: "Top Profissional", label: "⭐ Top Profissional" }]} />
          <Field label="Status" value={modal.available ? "true" : "false"} onChange={e => setModal(m => ({ ...m, available: e.target.value === "true" }))}
            options={[{ value: "true", label: "🟢 Ativo / Disponível" }, { value: "false", label: "🔴 Inativo / Bloqueado" }]} />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setModal(null)} outline color={T.muted} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn onClick={() => savePro(modal)} style={{ flex: 2 }}>💾 Salvar Alterações</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SERVIÇOS ─────────────────────────────────────────────────
function Servicos() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const EMPTY = { name: "", icon: "🔧", category: "Elétrica", price_min: "", price_max: "", description: "", img_url: "", active: true };

  const load = async () => {
    setLoading(true);
    const data = await api("services?select=*&order=name");
    setServices(data?.length ? data : DEMO_SERVICES);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (svc) => {
    if (svc.id && !String(svc.id).startsWith("demo")) {
      await api(`services?id=eq.${svc.id}`, { method: "PATCH", body: JSON.stringify(svc) });
    } else {
      const { id, ...rest } = svc;
      await api("services", { method: "POST", body: JSON.stringify(rest) });
    }
    await load();
    setModal(null);
  };

  const remove = async (id) => {
    if (!String(id).startsWith("demo")) {
      await api(`services?id=eq.${id}`, { method: "DELETE" });
    }
    setServices(prev => prev.filter(s => s.id !== id));
    setConfirmDelete(null);
  };

  const toggleActive = async (svc) => {
    if (!String(svc.id).startsWith("demo")) {
      await api(`services?id=eq.${svc.id}`, { method: "PATCH", body: JSON.stringify({ active: !svc.active }) });
    }
    setServices(prev => prev.map(s => s.id === svc.id ? { ...s, active: !s.active } : s));
  };

  const categories = ["Elétrica", "Hidráulica", "Instalação", "Climatização", "Geral", "Pintura", "Marcenaria"];

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, fontFamily: T.font }}>🛠️ Serviços</h2>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Adicione, edite e gerencie serviços</p>
        </div>
        <Btn onClick={() => setModal({ ...EMPTY, id: "novo" })}>+ Novo Serviço</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {services.map(svc => (
            <Card key={svc.id} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 120, background: T.surface, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {svc.img_url
                  ? <img src={svc.img_url} alt={svc.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                  : <span style={{ fontSize: 48 }}>{svc.icon || "🔧"}</span>}
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                  <button onClick={() => toggleActive(svc)} style={{ background: svc.active !== false ? `${T.green}CC` : `${T.red}CC`, border: "none", borderRadius: 20, padding: "3px 10px", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                    {svc.active !== false ? "Ativo" : "Inativo"}
                  </button>
                </div>
                <div style={{ position: "absolute", bottom: 8, left: 12 }}>
                  <Badge text={svc.category} color={T.blue} />
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h3 style={{ color: T.text, fontWeight: 800, fontSize: 15 }}>{svc.name}</h3>
                  <span style={{ color: T.orange, fontWeight: 900, fontSize: 16 }}>R$ {svc.price_min}</span>
                </div>
                <p style={{ color: T.muted, fontSize: 12, lineHeight: 1.4, marginBottom: 14 }}>{svc.description?.slice(0, 80)}...</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={() => setModal({ ...svc })} small color={T.blue} outline style={{ flex: 1 }}>✏️ Editar</Btn>
                  <Btn onClick={() => setConfirmDelete(svc)} small color={T.red} outline>🗑️</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal editar/criar serviço */}
      {modal && (
        <Modal title={String(modal.id) === "novo" ? "➕ Novo Serviço" : "✏️ Editar Serviço"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Nome do Serviço" value={modal.name} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} placeholder="Ex: Troca de Lâmpadas" />
            </div>
            <Field label="Ícone (emoji)" value={modal.icon} onChange={e => setModal(m => ({ ...m, icon: e.target.value }))} placeholder="💡" />
            <Field label="Categoria" value={modal.category} onChange={e => setModal(m => ({ ...m, category: e.target.value }))}
              options={categories.map(c => ({ value: c, label: c }))} />
            <Field label="Preço Mínimo (R$)" value={modal.price_min} onChange={e => setModal(m => ({ ...m, price_min: e.target.value }))} type="number" placeholder="60" />
            <Field label="Preço Máximo (R$)" value={modal.price_max || ""} onChange={e => setModal(m => ({ ...m, price_max: e.target.value }))} type="number" placeholder="200" />
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Descrição" value={modal.description} onChange={e => setModal(m => ({ ...m, description: e.target.value }))} placeholder="Descreva o serviço..." multiline />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="URL da Imagem (opcional)" value={modal.img_url || ""} onChange={e => setModal(m => ({ ...m, img_url: e.target.value }))} placeholder="https://..." />
            </div>
            <Field label="Status" value={modal.active !== false ? "true" : "false"} onChange={e => setModal(m => ({ ...m, active: e.target.value === "true" }))}
              options={[{ value: "true", label: "✅ Ativo" }, { value: "false", label: "❌ Inativo" }]} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn onClick={() => setModal(null)} outline color={T.muted} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn onClick={() => save(modal)} style={{ flex: 2 }}>💾 Salvar Serviço</Btn>
          </div>
        </Modal>
      )}

      {/* Confirmar exclusão */}
      {confirmDelete && (
        <Modal title="🗑️ Confirmar Exclusão" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: T.text, marginBottom: 8 }}>Tem certeza que deseja excluir o serviço:</p>
          <p style={{ color: T.orange, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>{confirmDelete.icon} {confirmDelete.name}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setConfirmDelete(null)} outline color={T.muted} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn onClick={() => remove(confirmDelete.id)} color={T.red} style={{ flex: 1 }}>Sim, excluir</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PEDIDOS ──────────────────────────────────────────────────
function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todos");

  useEffect(() => {
    const load = async () => {
      const data = await api("orders?select=*,services(name,icon),profiles!client_id(full_name,email)&order=created_at.desc");
      setOrders(data?.length ? data : DEMO_ORDERS);
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api(`orders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const statusCfg = {
    pending:     { label: "Pendente",     color: T.muted },
    confirmed:   { label: "Confirmado",   color: T.blue },
    on_the_way:  { label: "A caminho",    color: T.yellow },
    in_progress: { label: "Em andamento", color: T.yellow },
    completed:   { label: "Concluído",    color: T.green },
    paid:        { label: "Pago ✓",       color: T.green },
    cancelled:   { label: "Cancelado",    color: T.red },
  };

  const filtered = filter === "todos" ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, fontFamily: T.font }}>📋 Pedidos</h2>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Gerencie todos os pedidos da plataforma</p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[["todos", "Todos"], ["pending", "⏳ Pendentes"], ["confirmed", "✅ Confirmados"], ["in_progress", "🔄 Em andamento"], ["completed", "🏁 Concluídos"], ["cancelled", "❌ Cancelados"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? T.orange : T.card, color: filter === v ? "#fff" : T.muted, border: `1px solid ${filter === v ? T.orange : T.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        </div>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["ID", "Serviço", "Cliente", "Data", "Valor", "Status", "Ação"].map(h => (
                  <th key={h} style={{ color: T.muted, fontSize: 11, fontWeight: 600, textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const st = statusCfg[o.status] || { label: o.status, color: T.muted };
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "12px 16px", color: T.muted, fontSize: 11 }}>#{String(o.id || i).slice(0, 8)}</td>
                    <td style={{ padding: "12px 16px", color: T.text, fontSize: 13 }}>
                      {o.servicos?.icon || ""} {o.servicos?.name || o.service_name || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ color: T.text, fontSize: 13 }}>{o.profiles?.full_name || o.client_name || "—"}</p>
                      <p style={{ color: T.muted, fontSize: 11 }}>{o.profiles?.email || ""}</p>
                    </td>
                    <td style={{ padding: "12px 16px", color: T.muted, fontSize: 12 }}>{o.scheduled_date || o.date || "—"}</td>
                    <td style={{ padding: "12px 16px", color: T.orange, fontWeight: 700 }}>R$ {o.price || o.value || 0}</td>
                    <td style={{ padding: "12px 16px" }}><Badge text={st.label} color={st.color} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 10px", color: T.text, fontSize: 11, cursor: "pointer", outline: "none" }}>
                        {Object.entries(statusCfg).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ─── FINANCEIRO ───────────────────────────────────────────────
function Financeiro() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ gross: 0, fee: 0, payout: 0, count: 0 });

  useEffect(() => {
    const load = async () => {
      const payments = await api("payments?select=*,orders(service_id,services(name)),profiles!client_id(full_name)&order=created_at.desc") || [];
      const orders = await api("orders?select=price,status") || [];
      const gross = orders.reduce((s, o) => s + (o.price || 0), 0);
      setTotals({ gross, fee: gross * 0.1, payout: gross * 0.9, count: orders.length });
      setData(payments.length ? payments : DEMO_PAYMENTS);
      setLoading(false);
    };
    load();
  }, []);

  const statusCfg = { pending: { label: "Pendente", color: T.yellow }, paid: { label: "Pago", color: T.green }, failed: { label: "Falhou", color: T.red }, refunded: { label: "Reembolsado", color: T.muted } };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, fontFamily: T.font }}>💰 Financeiro</h2>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Receita, taxas e repasses</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { icon: "💰", label: "Receita Bruta", value: `R$ ${totals.gross.toFixed(2)}`, color: T.orange },
          { icon: "💸", label: "Taxa App (10%)", value: `R$ ${totals.fee.toFixed(2)}`, color: T.green },
          { icon: "👷", label: "Repasse Pros (90%)", value: `R$ ${totals.payout.toFixed(2)}`, color: T.blue },
          { icon: "🛠️", label: "Total Pedidos", value: totals.count, color: T.purple },
        ].map(s => (
          <Card key={s.label} style={{ padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</p>
            <p style={{ color: s.color, fontWeight: 900, fontSize: 20, marginBottom: 4 }}>{s.value}</p>
            <p style={{ color: T.muted, fontSize: 11 }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.text, fontWeight: 800 }}>Histórico de Pagamentos</h3>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["ID", "Cliente", "Serviço", "Valor", "Taxa App", "Pro Recebe", "Método", "Status"].map(h => (
                  <th key={h} style={{ color: T.muted, fontSize: 11, fontWeight: 600, textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => {
                const st = statusCfg[p.status] || { label: p.status, color: T.muted };
                const fee = (p.amount || 0) * 0.1;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "12px 16px", color: T.muted, fontSize: 11 }}>#{String(p.id || i).slice(0, 8)}</td>
                    <td style={{ padding: "12px 16px", color: T.text, fontSize: 13 }}>{p.profiles?.full_name || p.client_name || "—"}</td>
                    <td style={{ padding: "12px 16px", color: T.text, fontSize: 13 }}>{p.pedidos?.servicos?.name || p.service_name || "—"}</td>
                    <td style={{ padding: "12px 16px", color: T.orange, fontWeight: 700 }}>R$ {p.amount || p.value || 0}</td>
                    <td style={{ padding: "12px 16px", color: T.green, fontWeight: 600 }}>R$ {fee.toFixed(2)}</td>
                    <td style={{ padding: "12px 16px", color: T.blue, fontWeight: 600 }}>R$ {((p.amount || 0) - fee).toFixed(2)}</td>
                    <td style={{ padding: "12px 16px" }}><Badge text={p.method || "pix"} color={T.purple} /></td>
                    <td style={{ padding: "12px 16px" }}><Badge text={st.label} color={st.color} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── CONFIGURAÇÕES ────────────────────────────────────────────
function Configuracoes({ onLogout }) {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    appName: "CASAFIX",
    appFee: "10",
    supportEmail: ADMIN_EMAIL,
    welcomeMsg: "Serviços residenciais na palma da mão",
    maxRadius: "10",
  });

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const f = k => e => setConfig(c => ({ ...c, [k]: e.target.value }));

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, fontFamily: T.font }}>⚙️ Configurações</h2>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Configurações gerais da plataforma</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: T.text, fontWeight: 800, marginBottom: 16 }}>🔧 Configurações Gerais</h3>
        <Field label="Nome do App" value={config.appName} onChange={f("appName")} />
        <Field label="Slogan / Mensagem de boas-vindas" value={config.welcomeMsg} onChange={f("welcomeMsg")} />
        <Field label="E-mail de suporte" value={config.supportEmail} onChange={f("supportEmail")} type="email" />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: T.text, fontWeight: 800, marginBottom: 16 }}>💰 Configurações Financeiras</h3>
        <Field label="Taxa do App (%)" value={config.appFee} onChange={f("appFee")} type="number" />
        <div style={{ background: `${T.orange}12`, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: 12 }}>
          <p style={{ color: T.orange, fontSize: 12 }}>💡 A taxa atual é de <strong>{config.appFee}%</strong> sobre cada serviço. O profissional recebe <strong>{100 - parseInt(config.appFee)}%</strong>.</p>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: T.text, fontWeight: 800, marginBottom: 16 }}>📍 Configurações de Localização</h3>
        <Field label="Raio máximo de busca (km)" value={config.maxRadius} onChange={f("maxRadius")} type="number" />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ color: T.text, fontWeight: 800, marginBottom: 16 }}>🗄️ Banco de Dados</h3>
        <div style={{ background: `${T.green}12`, border: `1px solid ${T.green}33`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <p style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>✅ Conectado ao Supabase</p>
          <p style={{ color: T.muted, fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>pttbpywteivrcnvhpmxi.supabase.co</p>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={save} style={{ flex: 1 }}>
          {saved ? "✅ Salvo!" : "💾 Salvar Configurações"}
        </Btn>
        <Btn onClick={onLogout} color={T.red} outline>🚪 Sair</Btn>
      </div>
    </div>
  );
}

// ─── DEMO DATA ────────────────────────────────────────────────
const DEMO_PROS = [
  { id: "demo-1", name: "Carlos Silva", specialty: "Elétrica Geral", rating: 4.9, total_jobs: 312, available: true, badge: "Top Profissional", profiles: { full_name: "Carlos Silva", email: "carlos@email.com" } },
  { id: "demo-2", name: "Marcos Oliveira", specialty: "Instalações", rating: 4.8, total_jobs: 198, available: true, badge: "Verificado", profiles: { full_name: "Marcos Oliveira", email: "marcos@email.com" } },
  { id: "demo-3", name: "Roberto Souza", specialty: "Hidráulica", rating: 4.7, total_jobs: 145, available: false, badge: null, profiles: { full_name: "Roberto Souza", email: "roberto@email.com" } },
];
const DEMO_SERVICES = [
  { id: "demo-1", name: "Troca de Lâmpadas", icon: "💡", price_min: 60, category: "Elétrica", description: "Substituição de lâmpadas LED, fluorescentes ou comuns", active: true },
  { id: "demo-2", name: "Instalação de TV", icon: "📺", price_min: 120, category: "Instalação", description: "Fixação em parede com suporte articulado ou fixo", active: true },
  { id: "demo-3", name: "Ar Condicionado", icon: "❄️", price_min: 250, category: "Climatização", description: "Instalação completa de split com suporte", active: true },
  { id: "demo-4", name: "Chuveiro Elétrico", icon: "🚿", price_min: 150, category: "Hidráulica", description: "Troca ou instalação de chuveiro elétrico", active: true },
  { id: "demo-5", name: "Tomadas & Interruptores", icon: "🔌", price_min: 80, category: "Elétrica", description: "Instalação ou troca de tomadas e interruptores", active: true },
  { id: "demo-6", name: "Marido de Aluguel", icon: "🔧", price_min: 90, category: "Geral", description: "Serviços gerais: quadros, móveis, reparos", active: true },
];
const DEMO_ORDERS = [
  { id: "demo-1", service_name: "Troca de Lâmpadas", client_name: "Ana Paula", scheduled_date: "14/04", price: 60, status: "confirmed", servicos: { name: "Troca de Lâmpadas", icon: "💡" }, profiles: { full_name: "Ana Paula", email: "ana@email.com" } },
  { id: "demo-2", service_name: "Ar Condicionado", client_name: "João R.", scheduled_date: "12/04", price: 250, status: "in_progress", servicos: { name: "Ar Condicionado", icon: "❄️" }, profiles: { full_name: "João R.", email: "joao@email.com" } },
  { id: "demo-3", service_name: "Lâmpadas", client_name: "Maria S.", scheduled_date: "10/04", price: 60, status: "paid", servicos: { name: "Lâmpadas", icon: "💡" }, profiles: { full_name: "Maria S.", email: "maria@email.com" } },
];
const DEMO_PAYMENTS = [
  { id: "demo-1", client_name: "Ana Paula", service_name: "Troca de Lâmpadas", amount: 60, method: "pix", status: "paid" },
  { id: "demo-2", client_name: "João R.", service_name: "Ar Condicionado", amount: 250, method: "credit_card", status: "pending" },
];

// ─── APP PRINCIPAL ────────────────────────────────────────────
export default function Admin() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");

  const navItems = [
    { id: "dashboard",    icon: "📊", label: "Dashboard" },
    { id: "professionals", icon: "👷", label: "Profissionais" },
    { id: "services",     icon: "🛠️", label: "Serviços" },
    { id: "orders",      icon: "📋", label: "Pedidos" },
    { id: "financeiro",   icon: "💰", label: "Financeiro" },
    { id: "config",       icon: "⚙️", label: "Config" },
  ];

  if (!user) return <LoginAdmin onLogin={setUser} />;

  const renderTab = () => {
    switch(tab) {
      case "dashboard":     return <Dashboard />;
      case "professionals": return <Profissionais />;
      case "services":      return <Servicos />;
      case "orders":       return <Pedidos />;
      case "financeiro":    return <Financeiro />;
      case "config":        return <Configuracoes onLogout={() => setUser(null)} />;
      default:              return <Dashboard />;
    }
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 }}>
          <div style={{ padding: "24px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>⚙️</span>
              <div>
                <h1 style={{ color: T.text, fontSize: 16, fontWeight: 900, fontFamily: T.font }}>CASAFIX</h1>
                <p style={{ color: T.orange, fontSize: 11, fontWeight: 700 }}>Admin Panel</p>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "16px 12px" }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                background: tab === item.id ? `${T.orange}18` : "transparent",
                color: tab === item.id ? T.orange : T.muted,
                border: tab === item.id ? `1px solid ${T.orange}33` : "1px solid transparent",
                borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: tab === item.id ? 700 : 500,
                cursor: "pointer", marginBottom: 4, textAlign: "left", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${T.orange}BB, ${T.orange}55)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>AD</div>
              <div>
                <p style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>Admin</p>
                <p style={{ color: T.muted, fontSize: 10 }}>carloseduardo...</p>
              </div>
            </div>
            <button onClick={() => setUser(null)} style={{ width: "100%", background: `${T.red}18`, color: T.red, border: `1px solid ${T.red}33`, borderRadius: 8, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🚪 Sair</button>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ marginLeft: 220, flex: 1, padding: 32, minHeight: "100vh" }}>
          {renderTab()}
        </div>
      </div>
    </>
  );
}
