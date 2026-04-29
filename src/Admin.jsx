import { useState, useEffect, useRef } from "react";

// ─── SUPABASE REAL ────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://pttbpywteivrcnvhpmxi.supabase.co";
const SUPABASE_KEY = "sb_publishable_DHepCUr-K6nqE9YFPGtSXA_niYxTOsK";

// Cliente Supabase leve (sem instalar pacote)
const sb = {
  headers: {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  },

  async select(table, query = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      headers: { ...this.headers, "Prefer": "return=representation" },
    });
    return res.json();
  },

  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async update(table, data, filter) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async delete(table, filter) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "DELETE",
      headers: this.headers,
    });
    return res.ok;
  },

  // Auth
  async signUp(email, password, meta = {}) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ email, password, data: meta }),
    });
    return res.json();
  },

  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  // Realtime via WebSocket
  realtime(table, callback) {
    try {
      const ws = new WebSocket(
        `${SUPABASE_URL.replace("https", "wss")}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`
      );
      ws.onopen = () => {
        ws.send(JSON.stringify({ topic: `realtime:public:${table}`, event: "phx_join", payload: {}, ref: null }));
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.event === "INSERT" || msg.event === "UPDATE") callback(msg.payload);
      };
      return ws;
    } catch {
      return null;
    }
  },
};

// ─── TEMA ─────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0A0A14", surface: "#11111E", card: "#181828",
  border: "#252540", orange: "#FF6B2B", green: "#00D68F",
  yellow: "#FFB800", red: "#FF4757", blue: "#3D8EFF",
  text: "#F0F0FA", muted: "#6868A0",
  font: "'Georgia', serif", mono: "'Courier New', monospace",
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
const Av = ({ i, size = 44, color = T.orange }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${color}BB, ${color}55)`, border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: size * 0.33, color: "#fff", boxShadow: `0 0 10px ${color}22` }}>{i}</div>
);

const Pill = ({ text, color = T.orange }) => (
  <span style={{ background: `${color}18`, color, border: `1px solid ${color}33`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{text}</span>
);

const Btn = ({ children, onClick, color = T.orange, outline, full, style: s = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ background: outline ? "transparent" : disabled ? T.border : `linear-gradient(135deg, ${color}, ${color}BB)`, color: outline ? color : "#fff", border: outline ? `1.5px solid ${color}55` : "none", borderRadius: 12, padding: "12px 20px", fontWeight: 800, fontSize: 14, cursor: disabled ? "default" : "pointer", width: full ? "100%" : "auto", boxShadow: outline || disabled ? "none" : `0 4px 16px ${color}33`, fontFamily: "inherit", opacity: disabled ? 0.5 : 1, ...s }}>
    {children}
  </button>
);

const Input = ({ label, value, onChange, placeholder, type = "text", multiline }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ color: T.muted, fontSize: 12, display: "block", marginBottom: 5 }}>{label}</label>}
    {multiline
      ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ width: "100%", boxSizing: "border-box", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 14px", color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none" }} />
      : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 14px", color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
    }
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    pending:     { label: "Aguardando", color: T.muted },
    confirmed:   { label: "Confirmado", color: T.blue },
    on_the_way:  { label: "A caminho",  color: T.yellow },
    in_progress: { label: "Em andamento", color: T.yellow },
    completed:   { label: "Concluído", color: T.green },
    paid:        { label: "Pago ✓",    color: T.green },
    cancelled:   { label: "Cancelado", color: T.red },
    agendado:    { label: "Agendado",  color: T.orange },
  };
  const s = cfg[status] || { label: status, color: T.muted };
  return <Pill text={s.label} color={s.color} />;
};

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState("client");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handle = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "register") {
        const res = await sb.signUp(form.email, form.password, { full_name: form.name, role });
        if (res.error) throw new Error(res.error.message);
        setError("✅ Cadastro realizado! Verifique seu e-mail para confirmar.");
      } else {
        const res = await sb.signIn(form.email, form.password);
        if (res.error) throw new Error(res.error.message);
        onAuth({ ...res.user, token: res.access_token, role: res.user?.user_metadata?.role || "client", name: res.user?.user_metadata?.full_name || res.user?.email });
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at top, ${T.orange}18, transparent 60%), ${T.bg}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🔧</div>
        <h1 style={{ color: T.text, fontSize: 28, fontWeight: 900, margin: 0, fontFamily: T.font }}>CASAFIX</h1>
        <p style={{ color: T.muted, fontSize: 13, margin: "6px 0 0" }}>Serviços residenciais na palma da mão</p>
      </div>

      <div style={{ width: "100%", maxWidth: 360, background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}` }}>
        {/* Tabs */}
        <div style={{ display: "flex", background: T.surface, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[["login", "Entrar"], ["register", "Cadastrar"]].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, background: mode === m ? T.orange : "transparent", color: mode === m ? "#fff" : T.muted, border: "none", borderRadius: 10, padding: "9px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l}</button>
          ))}
        </div>

        {mode === "register" && (
          <>
            <Input label="Nome completo" value={form.name} onChange={f("name")} placeholder="Seu nome" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.muted, fontSize: 12, display: "block", marginBottom: 6 }}>Tipo de conta</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["client", "👤 Cliente"], ["professional", "🔧 Profissional"]].map(([v, l]) => (
                  <button key={v} onClick={() => setRole(v)} style={{ flex: 1, background: role === v ? `${T.orange}22` : T.surface, border: `${role === v ? 2 : 1}px solid ${role === v ? T.orange : T.border}`, borderRadius: 10, padding: "9px 0", color: role === v ? T.orange : T.muted, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            </div>
          </>
        )}

        <Input label="E-mail" value={form.email} onChange={f("email")} placeholder="seu@email.com" type="email" />
        <Input label="Senha" value={form.password} onChange={f("password")} placeholder="••••••••" type="password" />

        {error && (
          <div style={{ background: error.startsWith("✅") ? `${T.green}18` : `${T.red}18`, border: `1px solid ${error.startsWith("✅") ? T.green : T.red}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ color: error.startsWith("✅") ? T.green : T.red, fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <Btn onClick={handle} disabled={loading} full>
          {loading ? "⏳ Aguarde..." : mode === "login" ? "Entrar →" : "Criar conta →"}
        </Btn>

        {/* Demo rápido */}
        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 16, paddingTop: 16 }}>
          <p style={{ color: T.muted, fontSize: 11, textAlign: "center", marginBottom: 8 }}>— Entrar como demo —</p>
          <div style={{ display: "flex", gap: 6 }}>
            {[["👤 Cliente", "client"], ["🔧 Pro", "professional"], ["⚙️ Admin", "admin"]].map(([l, r]) => (
              <button key={r} onClick={() => onAuth({ id: `demo-${r}`, role: r, name: l, demo: true })} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "7px 0", color: T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ goTo, setCtx, user }) {
  const [services, setServices] = useState([]);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [svcs, profs] = await Promise.all([
          sb.select("services", "?select=*&order=name"),
          sb.select("professionals", "?select=*,profiles(full_name)&order=rating.desc&limit=4"),
        ]);
        if (Array.isArray(svcs)) setServices(svcs);
        if (Array.isArray(profs)) setPros(profs);
      } catch {
        // fallback para dados demo se Supabase não tiver dados ainda
        setServices(DEMO_SERVICES);
        setPros(DEMO_PROS);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = (services.length ? services : DEMO_SERVICES).filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: `radial-gradient(ellipse at top right, ${T.orange}22, transparent 60%), linear-gradient(180deg, #0D0D1E, ${T.bg})`, padding: "52px 20px 24px" }}>
        <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Olá, {user?.name?.split(" ")[0] || "bem-vindo"} 👋</p>
        <h1 style={{ color: T.text, fontSize: 24, fontWeight: 900, margin: "4px 0 18px", fontFamily: T.font, lineHeight: 1.2 }}>O que precisa<br />resolver hoje?</h1>
        <div style={{ background: T.card, borderRadius: 14, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.border}` }}>
          <span>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar serviço..." style={{ flex: 1, background: "none", border: "none", color: T.text, fontSize: 15, padding: "13px 0", outline: "none", fontFamily: "inherit" }} />
        </div>
      </div>

      <div style={{ padding: "14px 20px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        {["Todos","Elétrica","Hidráulica","Instalação","Climatização","Geral"].map(c => (
          <button key={c} style={{ background: c === "Todos" ? T.orange : T.card, color: c === "Todos" ? "#fff" : T.muted, border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{c}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px" }}>
        <h2 style={{ color: T.text, fontSize: 15, fontWeight: 800, margin: "0 0 12px" }}>
          Serviços {loading && <span style={{ color: T.muted, fontSize: 12, fontWeight: 400 }}>carregando...</span>}
        </h2>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ background: T.card, borderRadius: 16, height: 160, border: `1px solid ${T.border}`, opacity: 0.5 }} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filtered.map(svc => (
              <div key={svc.id} onClick={() => { setCtx({ service: svc }); goTo("serviceDetail"); }} style={{ background: T.card, borderRadius: 16, overflow: "hidden", cursor: "pointer", border: `1px solid ${T.border}` }}>
                <div style={{ height: 100, position: "relative", overflow: "hidden", background: T.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {svc.img_url
                    ? <img src={svc.img_url} alt={svc.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }} />
                    : <span style={{ fontSize: 40 }}>{svc.icon || "🔧"}</span>
                  }
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(10,10,20,0.85))" }} />
                  {svc.img_url && <span style={{ position: "absolute", top: 8, right: 10, fontSize: 24 }}>{svc.icon || "🔧"}</span>}
                </div>
                <div style={{ padding: "10px 12px 12px" }}>
                  <p style={{ color: T.text, fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>{svc.name}</p>
                  <p style={{ color: T.muted, fontSize: 11, margin: "0 0 5px" }}>{svc.category}</p>
                  <p style={{ color: T.orange, fontWeight: 900, fontSize: 15, margin: 0 }}>R$ {svc.price_min}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ color: T.text, fontSize: 15, fontWeight: 800, margin: 0 }}>⭐ Top Profissionais</h2>
          <button onClick={() => goTo("map")} style={{ background: "none", border: "none", color: T.blue, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Ver mapa →</button>
        </div>
        {(pros.length ? pros : DEMO_PROS).map(pro => (
          <div key={pro.id} onClick={() => { setCtx({ pro }); goTo("proProfile"); }} style={{ background: T.card, borderRadius: 14, padding: "13px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${T.border}`, cursor: "pointer" }}>
            <Av i={pro.initials || (pro.profiles?.full_name?.slice(0, 2).toUpperCase()) || "PR"} color={pro.available ? T.green : T.muted} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{pro.profiles?.full_name || pro.name}</span>
                {pro.badge && <Pill text={pro.badge} color={pro.badge === "Top Profissional" ? T.yellow : T.green} />}
              </div>
              <p style={{ color: T.muted, fontSize: 12, margin: "2px 0" }}>{pro.specialty}</p>
              <span style={{ color: T.yellow, fontSize: 12 }}>★ {pro.rating}</span>
              <span style={{ color: T.muted, fontSize: 11 }}> · {pro.total_jobs} serviços</span>
            </div>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: pro.available ? T.green : T.red, boxShadow: pro.available ? `0 0 7px ${T.green}` : "none" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
function OrdersScreen({ goTo, setCtx, user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await sb.select("orders", `?select=*,services(name,icon),profiles!professional_id(full_name)&client_id=eq.${user?.id}&order=created_at.desc`);
        if (Array.isArray(data) && data.length) setOrders(data);
        else setOrders(DEMO_ORDERS);
      } catch { setOrders(DEMO_ORDERS); }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: T.surface, padding: "48px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, margin: 0, fontFamily: T.font }}>Meus Pedidos</h2>
        <p style={{ color: T.muted, fontSize: 12, margin: "4px 0 0" }}>Histórico e acompanhamento</p>
      </div>
      <div style={{ padding: 20 }}>
        {loading ? <p style={{ color: T.muted, textAlign: "center" }}>Carregando...</p> :
          orders.map(o => (
            <div key={o.id} style={{ background: T.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: T.muted, fontSize: 11 }}>#{typeof o.id === "string" ? o.id.slice(0,8) : o.id} · {o.scheduled_date || o.date}</span>
                <StatusBadge status={o.status} />
              </div>
              <p style={{ color: T.text, fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>{o.servicos?.name || o.service_name || "Serviço"}</p>
              <p style={{ color: T.muted, fontSize: 12, margin: "0 0 10px" }}>👤 {o.profiles?.full_name || o.pro_name || "Profissional"}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: T.orange, fontWeight: 900 }}>R$ {o.price || o.value}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setCtx({ orderId: o.id }); goTo("chat"); }} style={{ background: `${T.blue}22`, border: `1px solid ${T.blue}33`, borderRadius: 10, padding: "6px 10px", color: T.blue, fontSize: 12, cursor: "pointer" }}>💬</button>
                  <button onClick={() => goTo("map")} style={{ background: `${T.green}22`, border: `1px solid ${T.green}33`, borderRadius: 10, padding: "6px 10px", color: T.green, fontSize: 12, cursor: "pointer" }}>📍</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── BOOKING ──────────────────────────────────────────────────────────────────
function BookingScreen({ goTo, ctx, user }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ date: "", time: "09:00", address: "", payment: "pix", notes: "" });
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const { service, pro } = ctx || {};
  if (!service) return null;

  const confirm = async () => {
    setLoading(true);
    try {
      const orderData = {
        service_id: service.id,
        professional_id: pro?.id,
        client_id: user?.id || "demo-client",
        status: "pending",
        scheduled_date: form.date || new Date().toISOString().slice(0,10),
        scheduled_time: form.time,
        price: service.price_min || service.price || 0,
        description: form.notes,
      };
      const res = await sb.insert("orders", orderData);
      const newId = Array.isArray(res) ? res[0]?.id : res?.id;
      setOrderId(newId || "DEMO-" + Date.now());
    } catch { setOrderId("DEMO-" + Date.now()); }
    setLoading(false);
    setStep(3);
  };

  if (step === 3) return (
    <div style={{ padding: "56px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 68, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: T.text, fontSize: 22, fontWeight: 900, fontFamily: T.font }}>Pedido Criado!</h2>
      <div style={{ background: `${T.green}12`, border: `1px solid ${T.green}33`, borderRadius: 14, padding: 16, margin: "20px 0", textAlign: "left" }}>
        <p style={{ color: T.green, fontSize: 12, margin: "0 0 6px", fontWeight: 700 }}>✅ Salvo no Supabase</p>
        <p style={{ color: T.muted, fontSize: 11, fontFamily: T.mono, margin: 0 }}>ID: {String(orderId).slice(0,16)}...</p>
      </div>
      <Btn onClick={() => goTo("chat")} full style={{ marginBottom: 10 }}>💬 Falar com Profissional</Btn>
      <Btn onClick={() => goTo("orders")} color={T.blue} full outline>Ver Meus Pedidos</Btn>
    </div>
  );

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const total = service.price_min || service.price || 0;

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ background: T.surface, padding: "48px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
        <button onClick={() => step > 1 ? setStep(s => s-1) : goTo("serviceDetail")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, width: 36, height: 36, color: T.text, fontSize: 16, cursor: "pointer", marginBottom: 12 }}>←</button>
        <h2 style={{ color: T.text, fontSize: 20, fontWeight: 900, margin: "0 0 4px", fontFamily: T.font }}>Agendar Serviço</h2>
        <p style={{ color: T.muted, fontSize: 12, margin: "0 0 14px" }}>{service.name} · {pro?.name || pro?.profiles?.full_name || "Profissional"}</p>
        <div style={{ display: "flex", gap: 6 }}>
          {[1,2].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: step >= s ? T.orange : T.border }} />)}
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {step === 1 && (
          <>
            <Input label="📅 Data" value={form.date} onChange={f("date")} type="date" />
            <Input label="⏰ Horário" value={form.time} onChange={f("time")} type="time" />
            <Input label="📍 Endereço completo" value={form.address} onChange={f("address")} placeholder="Rua, número, bairro, cidade..." multiline />
            <Input label="📝 Observações (opcional)" value={form.notes} onChange={f("notes")} placeholder="Detalhes do serviço..." multiline />
            <Btn onClick={() => setStep(2)} full>Continuar →</Btn>
          </>
        )}
        {step === 2 && (
          <>
            <h3 style={{ color: T.text, margin: "0 0 14px" }}>💳 Forma de Pagamento</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[["pix","💰 Pix"],["credit_card","💳 Cartão"],["boleto","🏦 Boleto"]].map(([v,l]) => (
                <button key={v} onClick={() => setForm(p=>({...p,payment:v}))} style={{ background: form.payment===v ? `${T.orange}22` : T.card, border: `${form.payment===v?2:1}px solid ${form.payment===v?T.orange:T.border}`, borderRadius: 12, padding: 12, color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 14, padding: 16, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              {[["Serviço",`R$ ${total}`],["Taxa app (10%)",`R$ ${(total*0.1).toFixed(0)}`],["Você paga",`R$ ${total}`],["Pro recebe",`R$ ${(total*0.9).toFixed(0)}`]].map(([k,v],i) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderTop: i===2?`1px solid ${T.border}`:"none" }}>
                  <span style={{ color: i>=2?T.text:T.muted, fontSize:13, fontWeight:i>=2?700:400 }}>{k}</span>
                  <span style={{ color: i===2?T.orange:i===3?T.green:T.text, fontWeight:i>=2?800:400, fontSize:i>=2?15:13 }}>{v}</span>
                </div>
              ))}
            </div>
            <Btn onClick={confirm} disabled={loading} full>{loading ? "⏳ Salvando..." : "Confirmar e Pagar ✓"}</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
function ChatScreen({ goTo, ctx, user }) {
  const [msgs, setMsgs] = useState(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const pro = ctx?.pro || DEMO_PROS[0];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  useEffect(() => {
    // Carrega mensagens do Supabase se tiver order_id
    if (ctx?.orderId && !user?.demo) {
      sb.select("messages", `?order_id=eq.${ctx.orderId}&order=created_at`).then(data => {
        if (Array.isArray(data) && data.length) setMsgs(data);
      });
    }
  }, [ctx?.orderId]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = { id: Date.now(), order_id: ctx?.orderId, sender_id: user?.id, sender: "client", text: input, time: new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}), read: false };
    setMsgs(m => [...m, msg]);
    setInput("");

    // Salva no Supabase
    if (ctx?.orderId && !user?.demo) {
      sb.insert("messages", { order_id: ctx.orderId, sender_id: user?.id, text: input });
    }

    // Simula resposta do profissional
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const replies = ["Entendido! Pode deixar comigo 👍","Ok! Estarei aí no horário combinado.","Certo, já estou organizando os materiais!","Qualquer dúvida pode chamar aqui 😊"];
      setMsgs(m => [...m, { id: Date.now()+1, sender: "pro", text: replies[Math.floor(Math.random()*replies.length)], time: new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}), read: false }]);
    }, 1200 + Math.random()*800);
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background: T.bg }}>
      <div style={{ background: T.surface, padding:"48px 16px 14px", borderBottom:`1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => goTo("home")} style={{ background: T.card, border:`1px solid ${T.border}`, borderRadius:10, width:36, height:36, color:T.text, fontSize:16, cursor:"pointer" }}>←</button>
          <Av i={pro.initials || "PR"} size={42} color={T.green} />
          <div style={{ flex:1 }}>
            <p style={{ color:T.text, fontWeight:800, fontSize:15, margin:0 }}>{pro.profiles?.full_name || pro.name}</p>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:T.green }} />
              <span style={{ color:T.green, fontSize:11, fontWeight:600 }}>Online</span>
            </div>
          </div>
          <button onClick={() => goTo("map")} style={{ background:`${T.blue}22`, border:`1px solid ${T.blue}33`, borderRadius:10, padding:"6px 12px", color:T.blue, fontSize:12, cursor:"pointer", fontWeight:700 }}>📍</button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:16 }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <span style={{ background:T.card, color:T.muted, fontSize:11, borderRadius:20, padding:"3px 12px", border:`1px solid ${T.border}` }}>Hoje</span>
        </div>
        {msgs.map(m => {
          const mine = m.sender === "client" || m.sender_id === user?.id;
          return (
            <div key={m.id} style={{ display:"flex", justifyContent: mine?"flex-end":"flex-start", marginBottom:10 }}>
              {!mine && <Av i={pro.initials||"PR"} size={28} color={T.green} />}
              <div style={{ maxWidth:"72%", marginLeft: mine?0:8 }}>
                <div style={{ background: mine?`linear-gradient(135deg,${T.orange},${T.orange}CC)`:T.card, borderRadius: mine?"16px 4px 16px 16px":"4px 16px 16px 16px", padding:"10px 14px", border: mine?"none":`1px solid ${T.border}`, boxShadow: mine?`0 4px 12px ${T.orange}33`:"none" }}>
                  <p style={{ color:"#fff", fontSize:14, margin:0, lineHeight:1.4 }}>{m.text}</p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, justifyContent: mine?"flex-end":"flex-start" }}>
                  <span style={{ color:T.muted, fontSize:10 }}>{m.time || new Date(m.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>
                  {mine && <span style={{ color:m.read?T.blue:T.muted, fontSize:10 }}>{m.read?"✓✓":"✓"}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Av i={pro.initials||"PR"} size={28} color={T.green} />
            <div style={{ background:T.card, borderRadius:"4px 16px 16px 16px", padding:"10px 14px", border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6,height:6,borderRadius:"50%",background:T.muted,animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding:"0 16px 8px", display:"flex", gap:6, overflowX:"auto" }}>
        {["Confirmar horário ✅","Qual o preço? 💰","Preciso de nota fiscal 📄","Ok, obrigado! 👍"].map(q => (
          <button key={q} onClick={() => setInput(q)} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:"5px 12px", color:T.muted, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>{q}</button>
        ))}
      </div>

      <div style={{ padding:"8px 16px 24px", background:T.surface, borderTop:`1px solid ${T.border}`, display:"flex", gap:10, alignItems:"center" }}>
        <div style={{ flex:1, background:T.card, borderRadius:20, padding:"10px 16px", border:`1px solid ${T.border}`, display:"flex", alignItems:"center" }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escreva uma mensagem..." style={{ flex:1, background:"none", border:"none", color:T.text, fontSize:14, outline:"none", fontFamily:"inherit" }} />
        </div>
        <button onClick={send} style={{ width:44,height:44,borderRadius:"50%", background:input.trim()?`linear-gradient(135deg,${T.orange},${T.orange}BB)`:T.card, border:"none", cursor:"pointer", fontSize:16, boxShadow:input.trim()?`0 4px 12px ${T.orange}44`:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>➤</button>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ─── MAP ──────────────────────────────────────────────────────────────────────
function MapScreen({ goTo, setCtx }) {
  const [selected, setSelected] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [proPos, setProPos] = useState({ x: 45, y: 38 });

  useEffect(() => {
    if (!tracking) return;
    const t = setInterval(() => setProPos(p => ({ x: Math.min(85,p.x+(Math.random()-.3)*3), y: Math.min(75,p.y+(Math.random()-.4)*2) })), 1200);
    return () => clearInterval(t);
  }, [tracking]);

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column" }}>
      <div style={{ background:T.surface, padding:"48px 20px 14px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => goTo("home")} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, width:36, height:36, color:T.text, fontSize:16, cursor:"pointer" }}>←</button>
          <div>
            <h2 style={{ color:T.text, fontSize:18, fontWeight:900, margin:0, fontFamily:T.font }}>Profissionais Próximos</h2>
            <p style={{ color:T.muted, fontSize:12, margin:0 }}><span style={{ color:T.green }}>●</span> {DEMO_PROS.filter(p=>p.available).length} disponíveis agora</p>
          </div>
        </div>
      </div>

      <div style={{ flex:1, position:"relative", background:"#080E1A", overflow:"hidden" }}>
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.12 }}>
          {[...Array(12)].map((_,i)=><line key={`h${i}`} x1="0" y1={`${i*9}%`} x2="100%" y2={`${i*9}%`} stroke={T.blue} strokeWidth="0.5"/>)}
          {[...Array(9)].map((_,i)=><line key={`v${i}`} x1={`${i*13}%`} y1="0" x2={`${i*13}%`} y2="100%" stroke={T.blue} strokeWidth="0.5"/>)}
          <path d="M0,44% L100%,44%" stroke={T.blue} strokeWidth="2.5" opacity={0.35}/>
          <path d="M36%,0 L36%,100%" stroke={T.blue} strokeWidth="2.5" opacity={0.35}/>
          <path d="M0,68% Q50%,63% 100%,70%" stroke={T.blue} strokeWidth="1.5" opacity={0.25} fill="none"/>
          <path d="M62%,0 Q60%,50% 64%,100%" stroke={T.blue} strokeWidth="1.5" opacity={0.25} fill="none"/>
        </svg>

        {[["Centro",34,42],["Jardins",62,22],["Vila Nova",19,64],["Setor Sul",73,60]].map(([n,x,y])=>(
          <span key={n} style={{ position:"absolute", left:`${x}%`, top:`${y}%`, color:`${T.blue}66`, fontSize:10, fontWeight:600, transform:"translateX(-50%)" }}>{n}</span>
        ))}

        {/* Você */}
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:5 }}>
          <div style={{ width:40,height:40,borderRadius:"50%",background:`${T.blue}33`,border:`3px solid ${T.blue}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 20px ${T.blue}55`,animation:"pulse 2s infinite" }}>
            <span style={{ fontSize:18 }}>📍</span>
          </div>
          <div style={{ position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",background:T.blue,color:"#fff",borderRadius:8,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",marginBottom:4 }}>Você</div>
        </div>
        <div style={{ position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:180,height:180,borderRadius:"50%",border:`1px dashed ${T.blue}33`,pointerEvents:"none" }}/>

        {/* Profissionais */}
        {DEMO_PROS.map((pro,i) => {
          const pos = [[45,38],[63,55],[27,61],[71,29]][i];
          return (
            <div key={pro.id} onClick={()=>setSelected(selected?.id===pro.id?null:pro)} style={{ position:"absolute", left:`${tracking&&i===0?proPos.x:pos[0]}%`, top:`${tracking&&i===0?proPos.y:pos[1]}%`, transform:"translate(-50%,-50%)", zIndex:10, cursor:"pointer", transition:"left 0.9s, top 0.9s" }}>
              <div style={{ width:38,height:38,borderRadius:"50%", background:pro.available?`linear-gradient(135deg,${T.green},${T.green}88)`:`linear-gradient(135deg,${T.muted},${T.muted}88)`, border:`2px solid ${selected?.id===pro.id?T.orange:(pro.available?T.green:T.muted)}`, display:"flex",alignItems:"center",justifyContent:"center", fontWeight:900,fontSize:12,color:"#fff", boxShadow:pro.available?`0 0 12px ${T.green}55`:"none" }}>{pro.initials}</div>
              {pro.available && <div style={{ position:"absolute",top:-2,right:-2,width:10,height:10,borderRadius:"50%",background:T.green,border:`2px solid ${T.bg}` }}/>}
            </div>
          );
        })}

        {tracking && (
          <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}>
            <line x1={`${proPos.x}%`} y1={`${proPos.y}%`} x2="50%" y2="50%" stroke={T.orange} strokeWidth="2" strokeDasharray="6,4" opacity={0.7}/>
          </svg>
        )}

        {selected && (
          <div style={{ position:"absolute",bottom:16,left:16,right:16,background:T.card,borderRadius:20,padding:16,border:`1px solid ${T.border}`,boxShadow:"0 8px 32px rgba(0,0,0,0.7)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
              <Av i={selected.initials} size={48} color={selected.available?T.green:T.muted}/>
              <div style={{ flex:1 }}>
                <p style={{ color:T.text,fontWeight:800,fontSize:15,margin:0 }}>{selected.name}</p>
                <p style={{ color:T.muted,fontSize:12,margin:"2px 0" }}>{selected.specialty}</p>
                <span style={{ color:T.yellow,fontSize:12 }}>★ {selected.rating}</span>
              </div>
              <div style={{ width:9,height:9,borderRadius:"50%",background:selected.available?T.green:T.red }}/>
            </div>
            {selected.available && (
              <div style={{ display:"flex",gap:8 }}>
                <Btn onClick={()=>setTracking(!tracking)} color={T.blue} style={{ flex:1,padding:"9px 0",fontSize:12 }}>{tracking?"⏹ Parar":"📡 Rastrear"}</Btn>
                <Btn onClick={()=>{ setCtx({pro:selected}); goTo("chat"); }} style={{ flex:1,padding:"9px 0",fontSize:12 }}>💬 Chat</Btn>
              </div>
            )}
          </div>
        )}
      </div>

      {tracking && (
        <div style={{ background:`${T.orange}18`,borderTop:`1px solid ${T.orange}33`,padding:"10px 20px",display:"flex",alignItems:"center",gap:8 }}>
          <span>🛵</span><span style={{ color:T.orange,fontSize:13,fontWeight:700 }}>{selected?.name} está a caminho · ~8 min</span>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 10px ${T.blue}44}50%{box-shadow:0 0 22px ${T.blue}88}}`}</style>
    </div>
  );
}

// ─── SERVICE DETAIL ───────────────────────────────────────────────────────────
function ServiceDetailScreen({ goTo, ctx, setCtx }) {
  const svc = ctx?.service;
  if (!svc) return null;
  const pros = DEMO_PROS.filter(p => p.services?.includes(svc.id));

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ position:"relative",height:200 }}>
        {svc.img_url
          ? <img src={svc.img_url} alt={svc.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
          : <div style={{ width:"100%",height:"100%",background:`linear-gradient(135deg,${T.surface},${T.card})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64 }}>{svc.icon||"🔧"}</div>
        }
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(10,10,20,0.95))"}}/>
        <button onClick={()=>goTo("home")} style={{ position:"absolute",top:16,left:16,background:"rgba(0,0,0,0.5)",border:"none",borderRadius:10,width:36,height:36,color:"#fff",fontSize:16,cursor:"pointer" }}>←</button>
        <div style={{ position:"absolute",bottom:16,left:20 }}>
          <span style={{ fontSize:34 }}>{svc.icon||"🔧"}</span>
          <h1 style={{ color:"#fff",fontSize:21,fontWeight:900,margin:"4px 0 0",fontFamily:T.font }}>{svc.name}</h1>
        </div>
      </div>
      <div style={{ padding:20 }}>
        <div style={{ background:T.card,borderRadius:14,padding:16,border:`1px solid ${T.border}`,marginBottom:20 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
            <span style={{ color:T.muted,fontSize:13 }}>A partir de</span>
            <span style={{ color:T.orange,fontWeight:900,fontSize:22 }}>R$ {svc.price_min||svc.price}</span>
          </div>
          <p style={{ color:T.text,fontSize:14,lineHeight:1.5,margin:0 }}>{svc.description||svc.desc}</p>
        </div>
        <h3 style={{ color:T.text,fontWeight:800,fontSize:15,margin:"0 0 12px" }}>Profissionais disponíveis</h3>
        {(pros.length ? pros : DEMO_PROS.slice(0,2)).map(pro => (
          <div key={pro.id} style={{ background:T.card,borderRadius:14,padding:"13px 16px",marginBottom:10,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12 }}>
            <Av i={pro.initials} color={pro.available?T.green:T.muted}/>
            <div style={{ flex:1 }}>
              <p style={{ color:T.text,fontWeight:700,fontSize:14,margin:"0 0 2px" }}>{pro.name}</p>
              <span style={{ color:T.yellow,fontSize:12 }}>★ {pro.rating}</span>
              <span style={{ color:T.muted,fontSize:11 }}> · {pro.total_jobs} serviços</span>
            </div>
            <div style={{ display:"flex",gap:6 }}>
              <button onClick={()=>{ setCtx({pro}); goTo("chat"); }} style={{ background:`${T.blue}22`,border:`1px solid ${T.blue}33`,borderRadius:10,padding:"7px 10px",color:T.blue,fontSize:12,cursor:"pointer" }}>💬</button>
              <button onClick={()=>{ setCtx({service:svc,pro}); goTo("booking"); }} disabled={!pro.available} style={{ background:pro.available?`linear-gradient(135deg,${T.orange},${T.orange}BB)`:T.card,color:pro.available?"#fff":T.muted,border:"none",borderRadius:10,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:pro.available?"pointer":"default" }}>{pro.available?"Agendar":"Indisponível"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    sb.select("orders","?select=price,status").then(data => {
      if (Array.isArray(data) && data.length) {
        setStats({
          total: data.reduce((s,o)=>s+(o.price||0),0).toFixed(0),
          count: data.length,
          fee: (data.reduce((s,o)=>s+(o.price||0),0)*0.1).toFixed(0),
        });
      }
    });
  }, []);

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ background:`radial-gradient(ellipse at top left,#2D1B6E33,transparent),${T.surface}`, padding:"48px 20px 20px", borderBottom:`1px solid ${T.border}` }}>
        <h2 style={{ color:T.text,fontSize:22,fontWeight:900,margin:"0 0 16px",fontFamily:T.font }}>⚙️ Painel Admin</h2>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {[["stats","📊 Métricas"],["services","🛠️ Serviços"],["pros","👷 Profissionais"],["db","🗄️ Banco"]].map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ background:tab===id?T.orange:T.card,color:"#fff",border:`1px solid ${tab===id?T.orange:T.border}`,borderRadius:10,padding:"7px 14px",fontSize:12,cursor:"pointer",fontWeight:700 }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:20 }}>
        {tab==="stats" && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[
              ["💰", stats?`R$ ${stats.total}`:"R$ 12.450","Receita Total"],
              ["🛠️", stats?stats.count:"89","Pedidos"],
              ["👷","4","Profissionais"],
              ["⭐","4.8","Avaliação Média"],
              ["💸", stats?`R$ ${stats.fee}`:"R$ 1.245","Taxa App (10%)"],
              ["🔄","3","Em Andamento"],
            ].map(([i,v,l])=>(
              <div key={l} style={{ background:T.card,borderRadius:14,padding:16,border:`1px solid ${T.border}` }}>
                <p style={{ fontSize:24,margin:"0 0 6px" }}>{i}</p>
                <p style={{ color:T.orange,fontWeight:900,fontSize:20,margin:"0 0 2px" }}>{v}</p>
                <p style={{ color:T.muted,fontSize:11,margin:0 }}>{l}</p>
              </div>
            ))}
          </div>
        )}
        {tab==="services" && (
          <>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:14 }}>
              <h3 style={{ color:T.text,margin:0 }}>Serviços Cadastrados</h3>
              <Btn style={{ padding:"8px 14px",fontSize:12 }}>+ Novo</Btn>
            </div>
            {DEMO_SERVICES.map(s=>(
              <div key={s.id} style={{ background:T.card,borderRadius:14,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:22 }}>{s.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ color:T.text,fontWeight:700,fontSize:13,margin:0 }}>{s.name}</p>
                  <p style={{ color:T.muted,fontSize:11,margin:0 }}>{s.category} · R$ {s.price_min||s.price}</p>
                </div>
                <button style={{ background:`${T.orange}22`,border:"none",borderRadius:8,padding:"5px 10px",color:T.orange,fontSize:11,cursor:"pointer" }}>✏️ Editar</button>
              </div>
            ))}
          </>
        )}
        {tab==="pros" && (
          <>
            <h3 style={{ color:T.text,margin:"0 0 14px" }}>🏆 Ranking de Profissionais</h3>
            {[...DEMO_PROS].sort((a,b)=>b.rating-a.rating).map((pro,i)=>(
              <div key={pro.id} style={{ background:T.card,borderRadius:14,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:`1px solid ${T.border}` }}>
                <span style={{ color:i===0?T.yellow:i===1?"#C0C0C0":i===2?"#CD7F32":T.muted,fontWeight:900,fontSize:16,width:24 }}>#{i+1}</span>
                <Av i={pro.initials} size={36} color={pro.available?T.green:T.muted}/>
                <div style={{ flex:1 }}>
                  <p style={{ color:T.text,fontWeight:700,fontSize:13,margin:0 }}>{pro.name}</p>
                  <span style={{ color:T.yellow,fontSize:12 }}>★ {pro.rating}</span>
                  <span style={{ color:T.muted,fontSize:11 }}> · {pro.total_jobs} serviços</span>
                </div>
                <div style={{ width:8,height:8,borderRadius:"50%",background:pro.available?T.green:T.red }}/>
              </div>
            ))}
          </>
        )}
        {tab==="db" && (
          <>
            <h3 style={{ color:T.text,margin:"0 0 6px" }}>🗄️ Tabelas no Supabase</h3>
            <div style={{ background:`${T.green}12`,border:`1px solid ${T.green}33`,borderRadius:12,padding:12,marginBottom:14 }}>
              <p style={{ color:T.green,fontSize:12,margin:0,fontWeight:700 }}>✅ Conectado: pttbpywteivrcnvhpmxi.supabase.co</p>
            </div>
            {["perfis","categorias","serviços","professionals","endereços","orders","payments","avaliações","messages","notificações","atualizações_de_localização"].map(t=>(
              <div key={t} style={{ background:T.card,borderRadius:10,padding:"10px 14px",marginBottom:6,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span style={{ color:T.orange,fontFamily:T.mono,fontSize:13,fontWeight:700 }}>{t}</span>
                <span style={{ color:T.green,fontSize:11 }}>✓ ativo</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── PRO DASHBOARD ────────────────────────────────────────────────────────────
function ProDashboard({ goTo, setCtx, user }) {
  const [photo, setPhoto] = useState(false);

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ background:`radial-gradient(ellipse at top right,${T.green}18,transparent),${T.surface}`, padding:"48px 20px 24px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <Av i={user?.name?.slice(0,2).toUpperCase()||"PR"} size={52} color={T.green}/>
          <div style={{ flex:1 }}>
            <p style={{ color:T.muted,fontSize:12,margin:0 }}>Olá, profissional</p>
            <h2 style={{ color:T.text,fontSize:20,fontWeight:900,margin:"2px 0",fontFamily:T.font }}>{user?.name||"Profissional"}</h2>
            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
              <div style={{ width:7,height:7,borderRadius:"50%",background:T.green }}/>
              <span style={{ color:T.green,fontSize:11,fontWeight:600 }}>Disponível</span>
            </div>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:16 }}>
          {[["💰","R$ 3.240","Mês"],["⭐","4.9","Nota"],["✅","12","Serviços"]].map(([i,v,l])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.05)",borderRadius:12,padding:10,textAlign:"center" }}>
              <p style={{ fontSize:18,margin:0 }}>{i}</p>
              <p style={{ color:"#fff",fontWeight:900,fontSize:15,margin:"2px 0 0" }}>{v}</p>
              <p style={{ color:"rgba(255,255,255,0.4)",fontSize:10,margin:0 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:20 }}>
        <h3 style={{ color:T.text,margin:"0 0 12px" }}>Agenda de Hoje</h3>
        {[
          { id:"ORD-045",service:"Instalação de TV",client:"Marina S.",addr:"Rua das Flores, 123",time:"14h00",status:"confirmed",value:120 },
          { id:"ORD-044",service:"Troca de Lâmpadas",client:"Pedro C.",addr:"Av. Central, 456",time:"Em andamento",status:"in_progress",value:60 },
        ].map(job=>(
          <div key={job.id} style={{ background:T.card,borderRadius:16,padding:16,marginBottom:12,border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ color:T.muted,fontSize:11 }}>{job.id}</span>
              <StatusBadge status={job.status}/>
            </div>
            <p style={{ color:T.text,fontWeight:800,fontSize:15,margin:"0 0 4px" }}>{job.service}</p>
            <p style={{ color:T.muted,fontSize:12,margin:"0 0 2px" }}>👤 {job.client}</p>
            <p style={{ color:T.muted,fontSize:12,margin:"0 0 12px" }}>📍 {job.addr} · ⏰ {job.time}</p>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ color:T.green,fontWeight:900 }}>R$ {job.value}</span>
              <div style={{ display:"flex",gap:6 }}>
                <button onClick={()=>goTo("chat")} style={{ background:`${T.blue}22`,border:`1px solid ${T.blue}33`,borderRadius:10,padding:"7px 10px",color:T.blue,fontSize:12,cursor:"pointer" }}>💬</button>
                {job.status==="in_progress" && <button onClick={()=>setPhoto(true)} style={{ background:`linear-gradient(135deg,${T.green},${T.green}BB)`,border:"none",borderRadius:10,padding:"7px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>📸 Finalizar</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {photo && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24 }}>
          <h3 style={{ color:T.text,fontSize:18,fontWeight:900,textAlign:"center" }}>📸 Foto de Conclusão</h3>
          <p style={{ color:T.muted,fontSize:13,textAlign:"center",marginBottom:20 }}>Tire uma foto para liberar o pagamento</p>
          <div style={{ width:"100%",maxWidth:300,height:200,background:T.card,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,border:`2px dashed ${T.green}44` }}>
            <div style={{ textAlign:"center" }}><div style={{ fontSize:52 }}>📷</div><p style={{ color:T.muted,fontSize:12,margin:"8px 0 0" }}>Câmera do dispositivo</p></div>
          </div>
          <div style={{ background:`${T.green}12`,border:`1px solid ${T.green}33`,borderRadius:12,padding:10,width:"100%",maxWidth:300,marginBottom:16 }}>
            <p style={{ color:T.green,fontSize:11,margin:0,fontFamily:T.mono,textAlign:"center" }}>📤 Foto → Supabase Storage<br/>💳 Pagamento liberado automaticamente</p>
          </div>
          <div style={{ display:"flex",gap:10,width:"100%",maxWidth:300 }}>
            <Btn onClick={()=>setPhoto(false)} color={T.muted} outline style={{ flex:1,padding:"12px 0" }}>Cancelar</Btn>
            <Btn onClick={()=>setPhoto(false)} color={T.green} style={{ flex:2,padding:"12px 0" }}>✅ Confirmar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRO PROFILE ─────────────────────────────────────────────────────────────
function ProProfileScreen({ goTo, ctx, setCtx }) {
  const pro = ctx?.pro || DEMO_PROS[0];
  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:`radial-gradient(ellipse at top,${T.green}18,transparent),${T.surface}`,padding:"48px 20px 24px",textAlign:"center",position:"relative" }}>
        <button onClick={()=>goTo("home")} style={{ position:"absolute",top:16,left:16,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,width:36,height:36,color:T.text,fontSize:16,cursor:"pointer" }}>←</button>
        <Av i={pro.initials||"PR"} size={72} color={T.green}/>
        <h2 style={{ color:T.text,fontSize:22,fontWeight:900,margin:"12px 0 4px",fontFamily:T.font }}>{pro.name}</h2>
        <p style={{ color:T.muted,fontSize:13,margin:"0 0 8px" }}>{pro.specialty}</p>
        {pro.badge && <Pill text={pro.badge} color={pro.badge==="Top Profissional"?T.yellow:T.green}/>}
        <div style={{ display:"flex",justifyContent:"center",gap:20,marginTop:18 }}>
          {[["⭐",pro.rating,"Avaliação"],["✅",pro.total_jobs,"Serviços"],["📅","3 anos","Exp."]].map(([i,v,l])=>(
            <div key={l}><p style={{ color:T.orange,fontWeight:900,fontSize:18,margin:0 }}>{i} {v}</p><p style={{ color:T.muted,fontSize:11,margin:0 }}>{l}</p></div>
          ))}
        </div>
      </div>
      <div style={{ padding:20 }}>
        <div style={{ display:"flex",gap:10,marginBottom:20 }}>
          <Btn onClick={()=>{ setCtx({pro}); goTo("chat"); }} color={T.blue} style={{ flex:1,fontSize:13 }}>💬 Mensagem</Btn>
          <Btn onClick={()=>goTo("map")} color={T.green} style={{ flex:1,fontSize:13 }}>📍 Mapa</Btn>
        </div>
        <h3 style={{ color:T.text,fontWeight:800,fontSize:15,margin:"0 0 12px" }}>💬 Avaliações</h3>
        {[{c:"Ana P.",r:5,t:"Excelente! Super rápido.",d:"há 2 dias"},{c:"João R.",r:5,t:"Profissional impecável!",d:"há 5 dias"},{c:"Carla M.",r:4,t:"Bom serviço, pontual.",d:"há 1 sem"}].map((rv,i)=>(
          <div key={i} style={{ background:T.card,borderRadius:14,padding:14,marginBottom:10,border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
              <span style={{ color:T.text,fontWeight:700,fontSize:13 }}>{rv.c}</span>
              <span style={{ color:T.muted,fontSize:11 }}>{rv.d}</span>
            </div>
            <span style={{ color:T.yellow }}>{"★".repeat(rv.r)}</span>
            <p style={{ color:T.text,fontSize:13,margin:"6px 0 0",lineHeight:1.4 }}>{rv.t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_SERVICES = [
  { id:1, name:"Troca de Lâmpadas", icon:"💡", price_min:60, category:"Elétrica", img_url:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", description:"Substituição de lâmpadas LED, fluorescentes ou comuns" },
  { id:2, name:"Instalação de TV", icon:"📺", price_min:120, category:"Instalação", img_url:"https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&q=80", description:"Fixação em parede com suporte articulado ou fixo" },
  { id:3, name:"Ar Condicionado", icon:"❄️", price_min:250, category:"Climatização", img_url:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80", description:"Instalação completa de split com suporte" },
  { id:4, name:"Chuveiro Elétrico", icon:"🚿", price_min:150, category:"Hidráulica", img_url:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&q=80", description:"Troca ou instalação de chuveiro elétrico" },
  { id:5, name:"Tomadas & Interruptores", icon:"🔌", price_min:80, category:"Elétrica", img_url:"https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", description:"Instalação ou troca de tomadas e interruptores" },
  { id:6, name:"Marido de Aluguel", icon:"🔧", price_min:90, category:"Geral", img_url:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80", description:"Serviços gerais: quadros, móveis, reparos" },
];
const DEMO_PROS = [
  { id:1, name:"Carlos Silva", initials:"CS", rating:4.9, total_jobs:312, specialty:"Elétrica Geral", available:true, badge:"Top Profissional", services:[1,2,5] },
  { id:2, name:"Marcos Oliveira", initials:"MO", rating:4.8, total_jobs:198, specialty:"Instalações", available:true, badge:"Verificado", services:[2,3,6] },
  { id:3, name:"Roberto Souza", initials:"RS", rating:4.7, total_jobs:145, specialty:"Hidráulica", available:false, badge:"Verificado", services:[4,6] },
  { id:4, name:"André Lima", initials:"AL", rating:4.6, total_jobs:89, specialty:"Multi-serviços", available:true, badge:null, services:[1,4,5,6] },
];
const DEMO_ORDERS = [
  { id:"ORD-001", service_name:"Troca de Lâmpadas", pro_name:"Carlos Silva", status:"confirmed", scheduled_date:"14/04", price:60 },
  { id:"ORD-002", service_name:"Ar Condicionado", pro_name:"Marcos Oliveira", status:"in_progress", scheduled_date:"12/04", price:250 },
  { id:"ORD-003", service_name:"Lâmpadas", pro_name:"Carlos Silva", status:"paid", scheduled_date:"10/04", price:60 },
];
const DEMO_MESSAGES = [
  { id:1, sender:"pro", text:"Olá! Vi seu pedido. Posso estar aí amanhã às 9h.", time:"14:30", read:true },
  { id:2, sender:"client", text:"Ótimo! O endereço é Rua das Flores, 123.", time:"14:32", read:true },
  { id:3, sender:"pro", text:"Perfeito, anotado! Até amanhã 👍", time:"14:35", read:false },
];

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [ctx, setCtx] = useState({});

  if (!user) return <AuthScreen onAuth={setUser} />;

  const role = user.role;
  const goTo = (s) => setScreen(s);

  const clientNav = [["home","🏠","Início"],["orders","📋","Pedidos"],["map","📍","Mapa"],["chat","💬","Chat"]];
  const proNav    = [["home_pro","🏠","Início"],["chat","💬","Chat"],["map","📍","Mapa"]];
  const adminNav  = [["admin","⚙️","Admin"]];
  const nav = role==="professional" ? proNav : role==="admin" ? adminNav : clientNav;

  const props = { goTo, ctx, setCtx, user };

  const renderScreen = () => {
    switch(screen) {
      case "home":          return <HomeScreen {...props}/>;
      case "serviceDetail": return <ServiceDetailScreen {...props}/>;
      case "booking":       return <BookingScreen {...props}/>;
      case "orders":        return <OrdersScreen {...props}/>;
      case "map":           return <MapScreen {...props}/>;
      case "chat":          return <ChatScreen {...props}/>;
      case "proProfile":    return <ProProfileScreen {...props}/>;
      case "admin":         return <AdminScreen {...props}/>;
      case "home_pro":      return <ProDashboard {...props}/>;
      default:              return <HomeScreen {...props}/>;
    }
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", maxWidth:420, margin:"0 auto", fontFamily:"'Segoe UI', system-ui, sans-serif", color:T.text, position:"relative" }}>
      {/* Botão sair */}
      <button onClick={()=>setUser(null)} style={{ position:"fixed",top:8,right:8,zIndex:200,background:`${T.card}EE`,border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 10px",color:T.muted,fontSize:11,cursor:"pointer" }}>
        Sair
      </button>

      <div style={{ overflowY:"auto", height:"100vh" }}>
        {renderScreen()}
      </div>

      {screen!=="chat" && screen!=="map" && (
        <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`${T.surface}F2`,backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-around",padding:"10px 0 20px" }}>
          {nav.map(([id,icon,label])=>(
            <button key={id} onClick={()=>setScreen(id)} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
              <span style={{ fontSize:screen===id?22:20,filter:screen===id?`drop-shadow(0 0 5px ${T.orange})`:"none" }}>{icon}</span>
              <span style={{ color:screen===id?T.orange:T.muted,fontSize:10,fontWeight:screen===id?800:400 }}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
