import { useState, useEffect } from "react";

// Poppins font
const poppinsLink = document.createElement("link");
poppinsLink.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap";
poppinsLink.rel = "stylesheet";
document.head.appendChild(poppinsLink);

const SUPA_URL = "https://pttbpywteivrcnvhpmxi.supabase.co";
const SUPA_KEY = "sb_publishable_DHepCUr-K6nqE9YFPGtSXA_niYxTOsK";
const ADMIN_EMAIL = "carloseduardodemelogonzaga@gmail.com";

const api = async (path, opts = {}) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    ...opts,
  });
  if (!res.ok) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const C = {
  purple: "#6B21E8",
  purpleDark: "#4C0FBE",
  purpleLight: "#8B47F0",
  purpleBg: "#F5F0FF",
  white: "#FFFFFF",
  gray: "#F7F7F8",
  grayMid: "#E5E5EA",
  text: "#1A1A2E",
  muted: "#8B8FA8",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#F59E0B",
  sidebar: "#1A0A3C",
  sidebarHover: "#2D1560",
};

const FONT = "'Poppins', 'Segoe UI', sans-serif";

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginMsg, setLoginMsg] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [svcForm, setSvcForm] = useState({ id: null, name: "", icon: "🔧", category: "Geral", price_min: "", description: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("ela_admin");
    if (saved) setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadAll = async () => {
    setLoading(true);
    const [svcs, pros, ords] = await Promise.all([
      api("services?select=*&order=name"),
      api("professionals?select=*&order=name"),
      api("orders?select=*&order=id.desc&limit=20"),
    ]);
    setServices(svcs || []);
    setProfessionals(pros || []);
    setOrders(ords || []);
    setLoading(false);
  };

  const doLogin = async () => {
    setLoginLoading(true);
    setLoginMsg("");
    try {
      const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPA_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (data.access_token && loginForm.email === ADMIN_EMAIL) {
        sessionStorage.setItem("ela_admin", "1");
        setAuthed(true);
      } else if (data.access_token) {
        setLoginMsg("Acesso negado. Apenas administradores.");
      } else {
        setLoginMsg("E-mail ou senha incorretos.");
      }
    } catch { setLoginMsg("Erro de conexão."); }
    setLoginLoading(false);
  };

  const saveService = async () => {
    const isNew = !svcForm.id || String(svcForm.id) === "novo";
    if (isNew) {
      const { id, ...rest } = svcForm;
      await api("services", { method: "POST", body: JSON.stringify({ ...rest, price_min: Number(rest.price_min) }) });
    } else {
      await api(`services?id=eq.${svcForm.id}`, { method: "PATCH", body: JSON.stringify({ ...svcForm, price_min: Number(svcForm.price_min) }) });
    }
    await loadAll();
    setModal(null);
    showToast(isNew ? "Serviço criado!" : "Serviço atualizado!");
  };

  const deleteService = async (id) => {
    if (!window.confirm("Excluir este serviço?")) return;
    await api(`services?id=eq.${id}`, { method: "DELETE" });
    await loadAll();
    showToast("Serviço excluído.");
  };

  const updateProfessional = async (id, data) => {
    await api(`professionals?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) });
    await loadAll();
    showToast("Profissional atualizado!");
  };

  const updateOrder = async (id, status) => {
    await api(`orders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await loadAll();
    showToast("Pedido atualizado!");
  };

  const revenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const fee = Math.round(revenue * 0.1);

  const s = {
    app: { display: "flex", minHeight: "100vh", fontFamily: FONT, background: C.gray },
    sidebar: { width: 240, background: C.sidebar, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200 },
    sidebarLogo: { padding: "28px 24px 20px", borderBottom: "1px solid #ffffff15" },
    sidebarLogoTitle: { color: C.white, fontWeight: 800, fontSize: 22, fontFamily: FONT },
    sidebarLogoSub: { color: "#ffffff55", fontSize: 12, fontWeight: 300, fontFamily: FONT },
    sidebarNav: { flex: 1, padding: "16px 12px" },
    sidebarBtn: (active) => ({ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", border: "none", borderRadius: 12, background: active ? C.purple : "transparent", color: active ? C.white : "#ffffff88", fontWeight: active ? 700 : 400, fontSize: 14, cursor: "pointer", marginBottom: 4, fontFamily: FONT, textAlign: "left" }),
    main: { marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" },
    header: { background: C.white, borderBottom: `1px solid ${C.grayMid}`, padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    headerTitle: { fontWeight: 800, fontSize: 20, color: C.text, fontFamily: FONT },
    content: { padding: 32 },
    card: { background: C.white, borderRadius: 16, padding: 24, boxShadow: "0 2px 12px #0000000a", marginBottom: 24 },
    statCard: { background: C.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px #0000000a", flex: 1 },
    btn: (bg = C.purple, color = C.white) => ({ background: bg, color, border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: FONT }),
    input: { background: C.gray, border: `1.5px solid ${C.grayMid}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: FONT },
    th: { padding: "12px 16px", color: C.muted, fontWeight: 600, fontSize: 13, textAlign: "left", borderBottom: `1px solid ${C.grayMid}` },
    td: { padding: "14px 16px", fontSize: 14, borderBottom: `1px solid ${C.grayMid}` },
    badge: (color) => ({ background: color + "18", color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
  };

  // LOGIN
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.purpleDark} 0%, ${C.purple} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        {toast && <div style={{ position: "fixed", top: 24, right: 24, background: C.green, color: C.white, borderRadius: 12, padding: "12px 24px", fontWeight: 700, zIndex: 999 }}>{toast}</div>}
        <div style={{ background: C.white, borderRadius: 24, padding: 40, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px #00000030" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
            <div style={{ fontWeight: 800, fontSize: 26, color: C.purple, fontFamily: FONT }}>ElaResolve</div>
            <div style={{ color: C.muted, fontSize: 13, fontWeight: 300, fontFamily: FONT }}>Painel Administrativo</div>
          </div>
          {loginMsg && <div style={{ background: C.red + "18", color: C.red, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{loginMsg}</div>}
          <input style={{ ...s.input, marginBottom: 12 }} placeholder="E-mail admin" type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
          <input style={{ ...s.input, marginBottom: 20 }} placeholder="Senha" type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={e => e.key === "Enter" && doLogin()} />
          <button style={{ ...s.btn(), width: "100%", padding: "14px", fontSize: 15 }} onClick={doLogin} disabled={loginLoading}>
            {loginLoading ? "Entrando..." : "Entrar no painel"}
          </button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "services", icon: "🛠️", label: "Serviços" },
    { id: "professionals", icon: "👷", label: "Profissionais" },
    { id: "orders", icon: "📋", label: "Pedidos" },
  ];

  return (
    <div style={s.app}>
      {toast && <div style={{ position: "fixed", top: 24, right: 24, background: C.green, color: C.white, borderRadius: 12, padding: "12px 24px", fontWeight: 700, zIndex: 999, fontFamily: FONT }}>{toast}</div>}

      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.sidebarLogoTitle}>🏠 ElaResolve</div>
          <div style={s.sidebarLogoSub}>Cuidado & Confiança</div>
        </div>
        <nav style={s.sidebarNav}>
          {TABS.map(t => (
            <button key={t.id} style={s.sidebarBtn(tab === t.id)} onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #ffffff15" }}>
          <div style={{ color: "#ffffff66", fontSize: 12, marginBottom: 8, fontFamily: FONT }}>Admin</div>
          <div style={{ color: C.white, fontSize: 13, fontWeight: 600, fontFamily: FONT, marginBottom: 12 }}>Carlos Eduardo</div>
          <button style={{ ...s.btn("#ffffff18", "#ffffff88"), width: "100%", fontSize: 13 }} onClick={() => { sessionStorage.removeItem("ela_admin"); setAuthed(false); }}>
            Sair
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        <header style={s.header}>
          <div style={s.headerTitle}>{TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={s.btn()} onClick={loadAll} disabled={loading}>{loading ? "Carregando..." : "↻ Atualizar"}</button>
          </div>
        </header>

        <div style={s.content}>

          {/* DASHBOARD */}
          {tab === "dashboard" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Receita Total", value: `R$${revenue.toLocaleString()}`, icon: "💰", color: C.purple },
                  { label: "Taxa da Plataforma", value: `R$${fee.toLocaleString()}`, icon: "📈", color: C.green },
                  { label: "Total de Pedidos", value: orders.length, icon: "📋", color: C.yellow },
                  { label: "Profissionais", value: professionals.length, icon: "👷", color: C.purpleLight },
                ].map(stat => (
                  <div key={stat.label} style={s.statCard}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                    <div style={{ color: C.muted, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ color: stat.color, fontWeight: 800, fontSize: 24, fontFamily: FONT }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={s.card}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, fontFamily: FONT }}>📋 Pedidos Recentes</div>
                  {orders.length === 0 ? (
                    <div style={{ color: C.muted, textAlign: "center", padding: 24 }}>Nenhum pedido ainda</div>
                  ) : orders.slice(0, 5).map((o, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.grayMid}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{o.service_name || "Serviço"}</div>
                        <div style={{ color: C.muted, fontSize: 12 }}>{o.user_email || "—"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: C.purple }}>R${o.total || 0}</div>
                        <span style={s.badge(o.status === "completed" ? C.green : o.status === "cancelled" ? C.red : C.yellow)}>
                          {o.status === "completed" ? "Concluído" : o.status === "cancelled" ? "Cancelado" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={s.card}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, fontFamily: FONT }}>🛠️ Serviços Cadastrados</div>
                  {services.length === 0 ? (
                    <div style={{ color: C.muted, textAlign: "center", padding: 24 }}>Nenhum serviço cadastrado</div>
                  ) : services.slice(0, 6).map(sv => (
                    <div key={sv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.grayMid}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{sv.icon || "🔧"}</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{sv.name}</span>
                      </div>
                      <span style={{ color: C.purple, fontWeight: 700 }}>R${sv.price_min}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SERVICES */}
          {tab === "services" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ color: C.muted, fontSize: 14 }}>{services.length} serviço(s) cadastrado(s)</div>
                <button style={s.btn()} onClick={() => { setSvcForm({ id: null, name: "", icon: "🔧", category: "Geral", price_min: "", description: "" }); setModal("service"); }}>
                  + Novo Serviço
                </button>
              </div>
              <div style={s.card}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Ícone", "Nome", "Categoria", "Preço mín.", "Ações"].map(h => <th key={h} style={s.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {services.length === 0 ? (
                      <tr><td colSpan={5} style={{ ...s.td, textAlign: "center", color: C.muted, padding: 40 }}>Nenhum serviço cadastrado</td></tr>
                    ) : services.map(sv => (
                      <tr key={sv.id}>
                        <td style={s.td}><span style={{ fontSize: 24 }}>{sv.icon || "🔧"}</span></td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{sv.name}</td>
                        <td style={s.td}><span style={{ background: C.purpleBg, color: C.purple, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{sv.category}</span></td>
                        <td style={{ ...s.td, fontWeight: 700, color: C.purple }}>R${sv.price_min}</td>
                        <td style={s.td}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={s.btn(C.purpleBg, C.purple)} onClick={() => { setSvcForm({ id: sv.id, name: sv.name, icon: sv.icon || "🔧", category: sv.category || "Geral", price_min: sv.price_min, description: sv.description || "" }); setModal("service"); }}>Editar</button>
                            <button style={s.btn(C.red + "18", C.red)} onClick={() => deleteService(sv.id)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROFESSIONALS */}
          {tab === "professionals" && (
            <div>
              <div style={{ color: C.muted, fontSize: 14, marginBottom: 16 }}>{professionals.length} profissional(is) cadastrado(s)</div>
              {professionals.length === 0 ? (
                <div style={{ ...s.card, textAlign: "center", padding: 40, color: C.muted }}>Nenhum profissional cadastrado ainda.</div>
              ) : professionals.map(p => (
                <div key={p.id} style={{ ...s.card, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    {/* Foto de perfil */}
                    <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: C.purpleBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                      {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                    </div>
                    {/* Dados */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 800, fontSize: 17, fontFamily: FONT }}>{p.name}</div>
                      <div style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>{p.specialty} {p.city ? `• ${p.city}` : ""}</div>
                      {p.phone && <div style={{ color: C.muted, fontSize: 13 }}>📱 {p.phone}</div>}
                      {p.cpf && <div style={{ color: C.muted, fontSize: 13 }}>📋 CPF: {p.cpf}</div>}
                      {p.bio && <div style={{ color: C.text, fontSize: 13, marginTop: 6, fontStyle: "italic" }}>"{p.bio}"</div>}
                    </div>
                    {/* Status */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <span style={s.badge(p.verification_status === "approved" ? C.green : p.verification_status === "rejected" ? C.red : C.yellow)}>
                        {p.verification_status === "approved" ? "✓ Aprovado" : p.verification_status === "rejected" ? "✗ Rejeitado" : "⏳ Pendente"}
                      </span>
                      <span style={s.badge(p.available ? C.green : C.muted)}>
                        {p.available ? "● Disponível" : "● Indisponível"}
                      </span>
                    </div>
                  </div>

                  {/* Documento */}
                  {p.doc_url && (
                    <div style={{ marginTop: 16, padding: 12, background: C.gray, borderRadius: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.muted, marginBottom: 8 }}>📄 Documento enviado</div>
                      {p.doc_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={p.doc_url} alt="Documento" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "contain" }} />
                      ) : (
                        <a href={p.doc_url} target="_blank" rel="noopener noreferrer" style={{ color: C.purple, fontWeight: 600, fontSize: 14 }}>
                          📎 Ver documento anexado
                        </a>
                      )}
                    </div>
                  )}

                  {!p.doc_url && (
                    <div style={{ marginTop: 12, padding: 10, background: C.yellow + "18", borderRadius: 10, color: C.yellow, fontSize: 13, fontWeight: 600 }}>
                      ⚠️ Nenhum documento enviado
                    </div>
                  )}

                  {/* Ações */}
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button style={{ ...s.btn(C.green), flex: 1 }} onClick={() => updateProfessional(p.id, { verification_status: "approved", available: true })}>
                      ✓ Aprovar profissional
                    </button>
                    <button style={{ ...s.btn(C.red + "18", C.red), flex: 1 }} onClick={() => updateProfessional(p.id, { verification_status: "rejected", available: false })}>
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ORDERS */}
          {tab === "orders" && (
            <div style={s.card}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Serviço", "Cliente", "Data", "Total", "Status", "Ações"].map(h => <th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: C.muted, padding: 40 }}>Nenhum pedido ainda</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{o.service_name || "—"}</td>
                      <td style={{ ...s.td, color: C.muted, fontSize: 13 }}>{o.user_email || "—"}</td>
                      <td style={s.td}>{o.date ? `${o.date} ${o.time || ""}` : "—"}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: C.purple }}>R${o.total || 0}</td>
                      <td style={s.td}>
                        <span style={s.badge(o.status === "completed" ? C.green : o.status === "cancelled" ? C.red : C.yellow)}>
                          {o.status === "completed" ? "Concluído" : o.status === "cancelled" ? "Cancelado" : "Pendente"}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={s.btn(C.green + "18", C.green)} onClick={() => updateOrder(o.id, "completed")}>Concluir</button>
                          <button style={s.btn(C.red + "18", C.red)} onClick={() => updateOrder(o.id, "cancelled")}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

      {/* MODAL SERVIÇO */}
      {modal === "service" && (
        <div style={{ position: "fixed", inset: 0, background: "#00000055", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
          <div style={{ background: C.white, borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px #00000030" }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 24, fontFamily: FONT }}>{svcForm.id ? "Editar Serviço" : "Novo Serviço"}</div>
            {[
              ["Nome do serviço", "name", "text"],
              ["Ícone (emoji)", "icon", "text"],
              ["Categoria", "category", "text"],
              ["Preço mínimo (R$)", "price_min", "number"],
              ["Descrição", "description", "text"],
            ].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: C.muted, marginBottom: 6, fontFamily: FONT }}>{label}</label>
                <input style={s.input} type={type} value={svcForm[key]} onChange={e => setSvcForm({ ...svcForm, [key]: e.target.value })} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button style={{ ...s.btn(C.gray, C.text), flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.btn(), flex: 1 }} onClick={saveService}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// deploy: Fri May 15 23:45:42 UTC 2026
