import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── SUPABASE CONFIG ──────────────────────────────────────────
const SUPA_URL = "https://twoliotudbjxmbzddwzc.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b2xpb3R1ZGJqeG1iemRkd3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjEwOTAsImV4cCI6MjA5NjA5NzA5MH0.l-6sJOK8Dwc03dhMhwTlNj-ZDA9vxIsjfa33wk0VoxU";

const sb = async (path, opts = {}) => {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(opts.headers || {}),
      },
    });
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  } catch (e) {
    console.error("Supabase error:", e);
    return null;
  }
};

// ── CHECKLIST ────────────────────────────────────────────────
const CHECKLIST_CATS = [
  { id: 1, name: "Fachada e Vitrine", icon: "🏪", items: ["Fachada está limpa e visível?","Vitrine está organizada?","Promoção atual está bem exposta?","Loja está limpa?","Loja está cheirosa e agradável?","Armações estão organizadas?","Balcão está limpo e sem bagunça?","Iluminação está funcionando bem?","Materiais de marketing bem posicionados?"] },
  { id: 2, name: "Atendimento", icon: "🤝", items: ["Vendedores fazem abordagem padrão?","Vendedores fazem anamnese antes de vender?","Vendedores identificam a necessidade do cliente?","Vendedores criam conexão com o cliente?","Vendedores apresentam produtos com valor?","Vendedores explicam benefícios das lentes?","Vendedores oferecem upgrades?","Gerente participa das negociações?","Equipe conduz objeções de preço?","Equipe tenta aumentar ticket médio?"] },
  { id: 3, name: "Processos Operacionais", icon: "⚙️", items: ["Agenda de exame está organizada?","Clientes do WhatsApp estão sendo chamados?","Orçamentos não fechados acompanhados?","OS estão sendo lançadas corretamente?","Serviços atrasados acompanhados?","Pedidos de lentes conferidos?","Loja confere prazos de entrega?","Controle de clientes que faltaram?","Controle de retorno de clientes?"] },
  { id: 4, name: "Indicadores e Gestão", icon: "📊", items: ["Gerente sabe a meta do dia?","Equipe sabe a meta do dia?","Gerente acompanha venda por vendedor?","Loja acompanha ticket médio?","Loja acompanha conversão?","Loja acompanha agendamentos?","Loja acompanha comparecimento?","Loja tem plano para bater a meta?","Gerente cobra resultado no dia?"] },
  { id: 5, name: "Equipe e Cultura", icon: "👥", items: ["Equipe está uniformizada?","Equipe com postura profissional?","Ambiente da loja está positivo?","Gerente presente no salão?","Equipe demonstra energia?","Equipe trata clientes com respeito?","Equipe trata colegas com respeito?","Loja transmite o padrão Amigão?","Equipe conhece a promoção atual?","Equipe sabe explicar a campanha?"] },
  { id: 6, name: "Estoque e Exposição", icon: "👓", items: ["Armações estão bem expostas?","Produtos de maior valor posicionados?","Linhas White, Gold e Black organizadas?","Produtos suficientes na vitrine?","Etiquetas e preços visíveis?","Produtos danificados retirados?","Espelhos e displays limpos?","Exposição favorece maior ticket?"] },
  { id: 7, name: "Serviços e OS", icon: "🔧", items: ["Existem serviços atrasados?","Serviços atrasados têm responsável?","Clientes de serviços prontos avisados?","Serviços com problema tratados?","Há controle de retrabalho?","OS estão completas e legíveis?","Conferência final antes da entrega?","Cliente recebe info clara sobre prazo?"] },
  { id: 8, name: "Marketing e Campanhas", icon: "📣", items: ["Loja está usando a campanha atual?","Cartazes e materiais visíveis?","Equipe sabe explicar a promoção?","Vitrine comunica a oferta principal?","WhatsApp usando mensagem padrão?","Loja está divulgando a promoção?","Campanha alinhada com padrão da rede?"] },
];

// ── HELPERS ──────────────────────────────────────────────────
const scoreColor = (n) => n >= 90 ? "#16a34a" : n >= 80 ? "#65a30d" : n >= 70 ? "#d97706" : "#dc2626";
const scoreLabel = (n) => n >= 90 ? "Padrão Ouro ⭐" : n >= 80 ? "Boa, com ajustes" : n >= 70 ? "Atenção ⚠️" : "Crítica 🔴";
const statusColor = (s) => s === "verde" ? "#16a34a" : s === "amarelo" ? "#d97706" : "#dc2626";
const statusBg = (s) => s === "verde" ? "#052e16" : s === "amarelo" ? "#1c1200" : "#1c0000";
const priorityColor = (p) => p === "critica" ? "#dc2626" : p === "alta" ? "#f97316" : p === "media" ? "#d97706" : "#6b7280";
const pendStatusColor = (s) => s === "vencido" ? "#dc2626" : s === "em andamento" ? "#3b82f6" : s === "resolvido" ? "#16a34a" : "#d97706";

const today = new Date().toISOString().split("T")[0];
const daysAgo = (d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString().split("T")[0]; };
const monthName = (m) => ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][m];

export default function AmigaoCheck() {
  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Dashboard filters
  const [dashLoja, setDashLoja] = useState("todas");
  const [dashChart, setDashChart] = useState("nota");
  const [dashView, setDashView] = useState("lojas"); // lojas, dias, meses

  // Store history
  const [selectedStore, setSelectedStore] = useState(null);
  const [histFilter, setHistFilter] = useState("30");
  const [histFrom, setHistFrom] = useState("");
  const [histTo, setHistTo] = useState(today);

  // Checklist
  const [checklistStore, setChecklistStore] = useState(null);
  const [checklistStep, setChecklistStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitData, setVisitData] = useState({ sales: "", meta: "", agendamentos: "", comparecimentos: "", type: "Rotina", gerente: "Sim", obs: "" });
  const [checklistDone, setChecklistDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pendencias
  const [pendFilter, setPendFilter] = useState("todos");

  const userLojas = currentUser ? (currentUser.lojas_ids ? lojas.filter(l => currentUser.lojas_ids.includes(l.id)) : lojas) : [];
  const userVisitas = currentUser ? (currentUser.lojas_ids ? visitas.filter(v => currentUser.lojas_ids.includes(v.loja_id)) : visitas) : [];
  const userPendencias = currentUser ? (currentUser.lojas_ids ? pendencias.filter(p => currentUser.lojas_ids.includes(p.loja_id)) : pendencias) : [];

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const [lj, vis, pend] = await Promise.all([
      sb("lojas?select=*&order=nome"),
      sb("visitas?select=*&order=data_visita.desc"),
      sb("pendencias?select=*&order=created_at.desc"),
    ]);
    if (lj) setLojas(lj);
    if (vis) setVisitas(vis);
    if (pend) setPendencias(pend);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { if (currentUser) loadData(); }, [currentUser, loadData]);

  const handleLogin = async () => {
    setLoading(true);
    const users = await sb(`usuarios?email=eq.${encodeURIComponent(loginEmail)}&senha=eq.${loginPass}&select=*`);
    setLoading(false);
    if (users && users.length > 0) {
      setCurrentUser(users[0]);
      setPage("dashboard");
      setLoginError("");
    } else {
      setLoginError("E-mail ou senha incorretos");
    }
  };

  const calcScore = () => {
    const vals = Object.values(answers);
    if (!vals.length) return 0;
    const applicable = vals.filter(v => v !== "na");
    if (!applicable.length) return 0;
    const pts = applicable.reduce((a, v) => a + (v === "ok" ? 1 : v === "parcial" ? 0.5 : 0), 0);
    return Math.round((pts / applicable.length) * 100);
  };

  const getStatusFromScore = (score) => score >= 85 ? "verde" : score >= 70 ? "amarelo" : "vermelho";

  const handleSaveVisit = async () => {
    setSaving(true);
    const finalScore = calcScore();
    const statusLoja = getStatusFromScore(finalScore);
    const percMeta = visitData.sales && visitData.meta ? Math.round((parseFloat(visitData.sales) / parseFloat(visitData.meta)) * 100) : 0;
    const conversao = visitData.agendamentos && visitData.comparecimentos ? Math.round((parseFloat(visitData.comparecimentos) / parseFloat(visitData.agendamentos)) * 100) : 0;
    const ticketMedio = visitData.sales && visitData.comparecimentos && parseFloat(visitData.comparecimentos) > 0 ? Math.round(parseFloat(visitData.sales) / parseFloat(visitData.comparecimentos)) : 0;

    const visitPayload = {
      loja_id: checklistStore.id,
      loja_nome: checklistStore.nome,
      usuario_id: currentUser.id,
      supervisor_nome: currentUser.nome,
      data_visita: today,
      tipo_visita: visitData.type,
      gerente_presente: visitData.gerente,
      venda_dia: parseFloat(visitData.sales) || 0,
      meta_dia: parseFloat(visitData.meta) || 0,
      perc_meta: percMeta,
      agendamentos: parseInt(visitData.agendamentos) || 0,
      comparecimentos: parseInt(visitData.comparecimentos) || 0,
      conversao,
      ticket_medio: ticketMedio,
      obs_geral: visitData.obs,
      nota_final: finalScore,
      status_loja: statusLoja,
    };

    const [newVisit] = await sb("visitas", { method: "POST", body: JSON.stringify(visitPayload) });

    if (newVisit) {
      const respostas = [];
      CHECKLIST_CATS.forEach(cat => {
        cat.items.forEach((item, idx) => {
          const key = `${cat.id}_${idx}`;
          if (answers[key]) {
            respostas.push({
              visita_id: newVisit.id,
              categoria_id: cat.id,
              categoria_nome: cat.name,
              item_idx: idx,
              item_texto: item,
              resposta: answers[key],
              observacao: answers[`${key}_obs`] || null,
            });
          }
        });
      });
      if (respostas.length > 0) await sb("respostas_checklist", { method: "POST", body: JSON.stringify(respostas) });

      // Auto-create pendencias for "nao" answers
      const pendToCreate = [];
      CHECKLIST_CATS.forEach(cat => {
        cat.items.forEach((item, idx) => {
          const key = `${cat.id}_${idx}`;
          if (answers[key] === "nao") {
            pendToCreate.push({
              visita_id: newVisit.id,
              loja_id: checklistStore.id,
              loja_nome: checklistStore.nome,
              supervisor_nome: currentUser.nome,
              categoria: cat.name,
              problema: item,
              responsavel: checklistStore.gerente,
              prioridade: "alta",
              status: "pendente",
            });
          }
        });
      });
      if (pendToCreate.length > 0) await sb("pendencias", { method: "POST", body: JSON.stringify(pendToCreate) });
    }

    setSaving(false);
    setChecklistDone(true);
    loadData();
  };

  // ── FILTERED DATA FOR DASHBOARD ──────────────────────────────
  const filteredVisitas = dashLoja === "todas" ? userVisitas : userVisitas.filter(v => v.loja_nome === dashLoja);

  const chartData = (() => {
    if (dashView === "lojas") {
      return userLojas.map(loja => {
        const lojaVisits = userVisitas.filter(v => v.loja_id === loja.id);
        if (!lojaVisits.length) return null;
        const avg = (key) => Math.round(lojaVisits.reduce((a, v) => a + (v[key] || 0), 0) / lojaVisits.length);
        return { name: loja.nome.split(" ")[0], nota: avg("nota_final"), meta: avg("perc_meta"), ticket: avg("ticket_medio"), conversao: avg("conversao"), visitas: lojaVisits.length };
      }).filter(Boolean);
    }
    if (dashView === "dias") {
      const now = new Date();
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split("T")[0];
      });
      return days.map(day => {
        const dayVisits = filteredVisitas.filter(v => v.data_visita === day);
        if (!dayVisits.length) return { name: day.slice(8), nota: null, meta: null, ticket: null, conversao: null };
        const avg = (key) => Math.round(dayVisits.reduce((a, v) => a + (v[key] || 0), 0) / dayVisits.length);
        return { name: day.slice(8), nota: avg("nota_final"), meta: avg("perc_meta"), ticket: avg("ticket_medio"), conversao: avg("conversao") };
      }).filter(d => d.nota !== null);
    }
    if (dashView === "meses") {
      const now = new Date();
      return Array.from({ length: 12 }, (_, i) => {
        const month = (now.getMonth() - 11 + i + 12) % 12;
        const year = now.getFullYear() - (now.getMonth() - 11 + i < 0 ? 1 : 0);
        const monthVisits = filteredVisitas.filter(v => {
          const d = new Date(v.data_visita);
          return d.getMonth() === month && d.getFullYear() === year;
        });
        if (!monthVisits.length) return null;
        const avg = (key) => Math.round(monthVisits.reduce((a, v) => a + (v[key] || 0), 0) / monthVisits.length);
        return { name: monthName(month), nota: avg("nota_final"), meta: avg("perc_meta"), ticket: avg("ticket_medio"), conversao: avg("conversao") };
      }).filter(Boolean);
    }
    return [];
  })();

  // ── STORE HISTORY FILTERED ────────────────────────────────────
  const storeVisits = (() => {
    if (!selectedStore) return [];
    let filtered = visitas.filter(v => v.loja_id === selectedStore.id);
    if (histFilter === "custom") {
      filtered = filtered.filter(v => v.data_visita >= histFrom && v.data_visita <= histTo);
    } else {
      const from = daysAgo(parseInt(histFilter));
      filtered = filtered.filter(v => v.data_visita >= from);
    }
    return filtered.sort((a, b) => new Date(b.data_visita) - new Date(a.data_visita));
  })();

  // ── STYLES ────────────────────────────────────────────────────
  const S = {
    app: { minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: 80 },
    header: { background: "#111", borderBottom: "2px solid #f5c518", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 100 },
    nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#0f0f0f", borderTop: "1px solid #1f1f1f", display: "flex", zIndex: 100 },
    navBtn: (a) => ({ flex: 1, padding: "8px 4px 10px", background: a ? "#1a1200" : "transparent", border: "none", color: a ? "#f5c518" : "#555", cursor: "pointer", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, borderTop: a ? "2px solid #f5c518" : "2px solid transparent" }),
    card: { background: "#161616", border: "1px solid #222", borderRadius: 12, padding: 16, marginBottom: 10 },
    input: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, width: "100%", outline: "none", marginBottom: 10, boxSizing: "border-box" },
    select: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, width: "100%", outline: "none", marginBottom: 10, boxSizing: "border-box" },
    label: { fontSize: 11, color: "#888", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.5 },
    btnPrimary: { background: "#f5c518", color: "#000", border: "none", borderRadius: 8, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" },
    badge: (c, bg) => ({ display: "inline-block", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: c, background: bg }),
    section: { padding: "0 14px" },
    title: { fontSize: 17, fontWeight: 700, color: "#f5f5f5", marginBottom: 14, marginTop: 18, letterSpacing: -0.5 },
    filterBtn: (a) => ({ padding: "6px 12px", borderRadius: 20, border: a ? "1px solid #f5c518" : "1px solid #333", background: a ? "#1a1200" : "#161616", color: a ? "#f5c518" : "#888", fontSize: 12, cursor: "pointer" }),
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "ranking", label: "Ranking", icon: "🏆" },
    { id: "visita", label: "Nova Visita", icon: "✅" },
    { id: "pendencias", label: "Pendências", icon: "⚠️" },
    { id: "lojas", label: "Lojas", icon: "🏪" },
  ];

  const resetNav = () => { setSelectedStore(null); setChecklistDone(false); setAnswers({}); setChecklistStep(0); setChecklistStore(null); setVisitData({ sales: "", meta: "", agendamentos: "", comparecimentos: "", type: "Rotina", gerente: "Sim", obs: "" }); };

  // ── LOGIN ─────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 20, minHeight: "100vh" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #555; }`}</style>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ background: "#f5c518", borderRadius: 16, width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>👓</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#f5c518", letterSpacing: -1 }}>AMIGÃO CHECK</div>
          <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Supervisão Operacional</div>
        </div>
        <div style={S.card}>
          <label style={S.label}>E-mail</label>
          <input style={S.input} type="email" placeholder="seu@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          <label style={S.label}>Senha</label>
          <input style={S.input} type="password" placeholder="••••••••" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {loginError && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 8, textAlign: "center" }}>{loginError}</div>}
          <button style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── CHECKLIST ─────────────────────────────────────────────────
  if (page === "visita") {
    if (checklistDone) return (
      <div style={S.app}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={S.header}><div style={{ background: "#f5c518", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👓</div><div style={{ fontSize: 16, fontWeight: 900, color: "#f5c518" }}>AMIGÃO CHECK</div></div>
        <div style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#f5c518" }}>Visita Registrada!</div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>Loja: <strong style={{ color: "#f5f5f5" }}>{checklistStore?.nome}</strong></div>
          <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(calcScore()), marginTop: 12 }}>{calcScore()}</div>
          <div style={{ fontSize: 14, color: scoreColor(calcScore()) }}>{scoreLabel(calcScore())}</div>
          <div style={{ background: "#161616", borderRadius: 8, height: 8, marginTop: 12, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${calcScore()}%`, background: scoreColor(calcScore()), borderRadius: 8 }} />
          </div>
          <div style={{ ...S.card, textAlign: "left", marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c518", marginBottom: 12 }}>Por Categoria</div>
            {CHECKLIST_CATS.map(cat => {
              const catAns = cat.items.map((_, i) => answers[`${cat.id}_${i}`]).filter(a => a && a !== "na");
              const pts = catAns.reduce((a, v) => a + (v === "ok" ? 1 : v === "parcial" ? 0.5 : 0), 0);
              const cs = catAns.length ? Math.round((pts / catAns.length) * 100) : null;
              return <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1f1f1f" }}><span style={{ fontSize: 13 }}>{cat.icon} {cat.name}</span>{cs !== null ? <span style={{ fontWeight: 700, color: scoreColor(cs) }}>{cs}</span> : <span style={{ color: "#444" }}>—</span>}</div>;
            })}
          </div>
          <button style={S.btnPrimary} onClick={() => { resetNav(); setPage("dashboard"); }}>Voltar ao Dashboard</button>
        </div>
        <nav style={S.nav}>{navItems.map(n => <button key={n.id} style={S.navBtn(false)} onClick={() => { resetNav(); setPage(n.id); }}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );

    if (!checklistStore) return (
      <div style={S.app}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={S.header}><div style={{ background: "#f5c518", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👓</div><div style={{ fontSize: 16, fontWeight: 900, color: "#f5c518" }}>NOVA VISITA</div></div>
        <div style={{ padding: 16 }}>
          <div style={S.title}>Selecione a Loja</div>
          {userLojas.length === 0 ? <div style={{ textAlign: "center", color: "#666", padding: 40 }}>Carregando lojas...</div> : userLojas.map(l => (
            <div key={l.id} onClick={() => { setChecklistStore(l); setChecklistStep(0); }} style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 700 }}>{l.nome}</div><div style={{ fontSize: 12, color: "#666" }}>{l.cidade} · {l.gerente}</div></div>
              <div style={{ fontSize: 20, color: "#f5c518" }}>→</div>
            </div>
          ))}
        </div>
        <nav style={S.nav}>{navItems.map(n => <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => { resetNav(); setPage(n.id); }}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );

    if (checklistStep === 0) return (
      <div style={S.app}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={S.header}><button onClick={() => setChecklistStore(null)} style={{ background: "none", border: "none", color: "#f5c518", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button><div style={{ fontSize: 14, fontWeight: 700, color: "#f5c518" }}>Visita · {checklistStore.nome}</div></div>
        <div style={{ padding: 16 }}>
          <div style={S.title}>Dados da Visita</div>
          <div style={S.card}>
            <label style={S.label}>Tipo de Visita</label>
            <select style={S.select} value={visitData.type} onChange={e => setVisitData({ ...visitData, type: e.target.value })}>
              {["Rotina","Auditoria","Problema","Reforço Comercial"].map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={S.label}>Gerente Presente?</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {["Sim","Não"].map(v => <button key={v} onClick={() => setVisitData({ ...visitData, gerente: v })} style={{ flex: 1, padding: 10, borderRadius: 8, border: visitData.gerente === v ? "2px solid #f5c518" : "1px solid #333", background: visitData.gerente === v ? "#1a1200" : "#111", color: visitData.gerente === v ? "#f5c518" : "#888", cursor: "pointer", fontWeight: 700 }}>{v}</button>)}
            </div>
            <label style={S.label}>Venda do Dia (R$)</label>
            <input style={S.input} type="number" placeholder="Ex: 3500" value={visitData.sales} onChange={e => setVisitData({ ...visitData, sales: e.target.value })} />
            <label style={S.label}>Meta do Dia (R$)</label>
            <input style={S.input} type="number" placeholder="Ex: 4500" value={visitData.meta} onChange={e => setVisitData({ ...visitData, meta: e.target.value })} />
            <label style={S.label}>Agendamentos</label>
            <input style={S.input} type="number" placeholder="Ex: 12" value={visitData.agendamentos} onChange={e => setVisitData({ ...visitData, agendamentos: e.target.value })} />
            <label style={S.label}>Comparecimentos</label>
            <input style={S.input} type="number" placeholder="Ex: 9" value={visitData.comparecimentos} onChange={e => setVisitData({ ...visitData, comparecimentos: e.target.value })} />
            <label style={S.label}>Observações Gerais</label>
            <textarea style={{ ...S.input, height: 80, resize: "none", marginBottom: 0 }} placeholder="Observações sobre a visita..." value={visitData.obs} onChange={e => setVisitData({ ...visitData, obs: e.target.value })} />
            {visitData.sales && visitData.meta && (
              <div style={{ background: "#0a0a0a", borderRadius: 8, padding: 12, marginTop: 10, display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "#666" }}>% META</div><div style={{ fontSize: 20, fontWeight: 900, color: parseFloat(visitData.sales) >= parseFloat(visitData.meta) ? "#16a34a" : "#dc2626" }}>{Math.round((parseFloat(visitData.sales) / parseFloat(visitData.meta)) * 100)}%</div></div>
                {visitData.agendamentos && visitData.comparecimentos && <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "#666" }}>CONVERSÃO</div><div style={{ fontSize: 20, fontWeight: 900, color: "#f5c518" }}>{Math.round((parseFloat(visitData.comparecimentos) / parseFloat(visitData.agendamentos)) * 100)}%</div></div>}
              </div>
            )}
          </div>
          <button style={S.btnPrimary} onClick={() => setChecklistStep(1)}>Iniciar Checklist →</button>
        </div>
        <nav style={S.nav}>{navItems.map(n => <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => { resetNav(); setPage(n.id); }}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );

    const cat = CHECKLIST_CATS[checklistStep - 1];
    const totalItems = CHECKLIST_CATS.reduce((a, c) => a + c.items.length, 0);
    const answered = Object.keys(answers).length;
    return (
      <div style={S.app}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={S.header}>
          <button onClick={() => checklistStep > 1 ? setChecklistStep(s => s - 1) : setChecklistStep(0)} style={{ background: "none", border: "none", color: "#f5c518", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: "#888" }}>{checklistStore.nome} · {checklistStep}/{CHECKLIST_CATS.length}</div><div style={{ fontSize: 14, fontWeight: 700 }}>{cat.icon} {cat.name}</div></div>
          <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(calcScore()) }}>{calcScore()}</div>
        </div>
        <div style={{ background: "#111", height: 4 }}><div style={{ height: "100%", width: `${(checklistStep / CHECKLIST_CATS.length) * 100}%`, background: "#f5c518", transition: "width 0.3s" }} /></div>
        <div style={{ padding: "12px 14px" }}>
          {cat.items.map((item, idx) => {
            const key = `${cat.id}_${idx}`;
            const ans = answers[key];
            return (
              <div key={idx} style={{ ...S.card, borderLeft: `3px solid ${ans === "nao" ? "#dc2626" : ans === "parcial" ? "#d97706" : ans === "ok" ? "#16a34a" : "#222"}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>{item}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["ok","✅ OK","#16a34a","#052e16"],["parcial","⚡ Parcial","#d97706","#1c1200"],["nao","❌ Não OK","#dc2626","#1c0000"],["na","N/A","#555","#111"]].map(([val, label, color, bg]) => (
                    <button key={val} onClick={() => setAnswers({ ...answers, [key]: val })} style={{ flex: 1, padding: "8px 4px", borderRadius: 6, border: ans === val ? `2px solid ${color}` : "1px solid #2a2a2a", background: ans === val ? bg : "#0d0d0d", color: ans === val ? color : "#555", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{label}</button>
                  ))}
                </div>
                {ans === "nao" && <div style={{ marginTop: 8 }}><input style={{ ...S.input, fontSize: 12, marginBottom: 4 }} placeholder="📝 Descreva o problema..." onChange={e => setAnswers({ ...answers, [`${key}_obs`]: e.target.value })} /><div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>📷 Foto de evidência obrigatória</div><input type="file" accept="image/*" capture="environment" style={{ marginTop: 4, fontSize: 11, color: "#888", width: "100%" }} /></div>}
              </div>
            );
          })}
          <div style={{ marginTop: 4 }}>
            {checklistStep < CHECKLIST_CATS.length
              ? <button style={S.btnPrimary} onClick={() => setChecklistStep(s => s + 1)}>Próxima Categoria →</button>
              : <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSaveVisit} disabled={saving}>{saving ? "Salvando..." : "Finalizar e Salvar ✓"}</button>}
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#444" }}>{Math.round((answered / totalItems) * 100)}% respondido</div>
        </div>
        <nav style={S.nav}>{navItems.map(n => <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => { resetNav(); setPage(n.id); }}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
  }

  // ── MAIN LAYOUT ───────────────────────────────────────────────
  const avg = userVisitas.length ? Math.round(userVisitas.reduce((a, b) => a + (b.nota_final || 0), 0) / userVisitas.length) : 0;
  const best = [...userVisitas].sort((a, b) => b.nota_final - a.nota_final)[0];
  const worst = [...userVisitas].sort((a, b) => a.nota_final - b.nota_final)[0];

  const chartKey = dashChart === "nota" ? "nota" : dashChart === "meta" ? "meta" : dashChart === "ticket" ? "ticket" : "conversao";
  const chartLabel = dashChart === "nota" ? "Nota" : dashChart === "meta" ? "% Meta" : dashChart === "ticket" ? "Ticket Médio" : "Conversão";
  const chartColor = dashChart === "nota" ? "#f5c518" : dashChart === "meta" ? "#3b82f6" : dashChart === "ticket" ? "#16a34a" : "#a855f7";

  return (
    <div style={S.app}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #333; }`}</style>
      <div style={S.header}>
        <div style={{ background: "#f5c518", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👓</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 900, color: "#f5c518", letterSpacing: -0.5 }}>AMIGÃO CHECK</div><div style={{ fontSize: 10, color: "#666", letterSpacing: 1 }}>SUPERVISÃO OPERACIONAL</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#1a1a1a", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#f5c518" }}>{currentUser?.role?.includes("diretor") ? "👑" : "👤"} {currentUser?.nome?.split(" ")[0]}</div>
          <button onClick={() => { setCurrentUser(null); setPage("login"); setLojas([]); setVisitas([]); setPendencias([]); }} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 20, padding: "4px 10px", color: "#888", fontSize: 11, cursor: "pointer" }}>Sair</button>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 20, color: "#666", fontSize: 13 }}>Carregando...</div>}

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div>
          <div style={{ background: "#161200", border: "1px solid #2a2000", borderRadius: 12, margin: "14px 14px 0", padding: 16 }}>
            <div style={{ fontSize: 11, color: "#f5c518", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Média Geral · {currentUser?.nome}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(avg), lineHeight: 1 }}>{avg}<span style={{ fontSize: 18, color: "#888" }}>/100</span></div><div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{scoreLabel(avg)}</div></div>
              <div style={{ textAlign: "right", fontSize: 12 }}>
                <div style={{ marginBottom: 4 }}>🟢 {userVisitas.filter(v => v.status_loja === "verde").length} verde{userVisitas.filter(v => v.status_loja === "verde").length !== 1 ? "s" : ""}</div>
                <div style={{ marginBottom: 4 }}>🟡 {userVisitas.filter(v => v.status_loja === "amarelo").length} amarelo{userVisitas.filter(v => v.status_loja === "amarelo").length !== 1 ? "s" : ""}</div>
                <div>🔴 {userVisitas.filter(v => v.status_loja === "vermelho").length} vermelho{userVisitas.filter(v => v.status_loja === "vermelho").length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div style={{ background: "#0a0900", borderRadius: 6, height: 8, marginTop: 12, overflow: "hidden" }}><div style={{ height: "100%", width: `${avg}%`, background: "linear-gradient(90deg,#f5c518,#fbbf24)", borderRadius: 6, transition: "width 1s" }} /></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 14px 0" }}>
            {[
              { label: "Melhor Loja", value: best?.nota_final || 0, sub: best?.loja_nome || "-", color: "#16a34a" },
              { label: "Pior Loja", value: worst?.nota_final || 0, sub: worst?.loja_nome || "-", color: "#dc2626" },
              { label: "Pendências", value: userPendencias.filter(p => p.status !== "resolvido").length, sub: "abertas", color: "#f5c518" },
              { label: "Visitas", value: userVisitas.length, sub: "registradas", color: "#3b82f6" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#161616", border: `1px solid ${s.color}22`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 2 }}>{s.sub}</div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={S.section}>
            <div style={S.title}>Análise de Indicadores</div>

            {/* Filters */}
            <div style={{ ...S.card, padding: 12 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>FILTRAR POR LOJA</div>
                <select style={{ ...S.select, marginBottom: 0 }} value={dashLoja} onChange={e => setDashLoja(e.target.value)}>
                  <option value="todas">Todas as lojas</option>
                  {userLojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>VISUALIZAR POR</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["lojas","Por Loja"],["dias","Dias do Mês"],["meses","Meses do Ano"]].map(([v, l]) => (
                    <button key={v} style={S.filterBtn(dashView === v)} onClick={() => setDashView(v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>INDICADOR</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["nota","Nota"],["meta","% Meta"],["ticket","Ticket"],["conversao","Conversão"]].map(([v, l]) => (
                    <button key={v} style={S.filterBtn(dashChart === v)} onClick={() => setDashChart(v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div style={{ ...S.card, padding: "12px 4px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c518", marginBottom: 8, paddingLeft: 12 }}>{chartLabel} · {dashView === "lojas" ? "Por Loja" : dashView === "dias" ? "Últimos 30 dias" : "Últimos 12 meses"}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 9 }} interval={dashView === "dias" ? 4 : 0} angle={-35} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#f5f5f5" }} />
                    <Bar dataKey={chartKey} fill={chartColor} radius={[4,4,0,0]} name={chartLabel} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", color: "#555", padding: 32 }}>
                {userVisitas.length === 0 ? "Nenhuma visita registrada ainda" : "Sem dados para o filtro selecionado"}
              </div>
            )}

            {/* Comparison chart when filtering by store */}
            {dashLoja !== "todas" && chartData.length > 0 && (
              <div style={{ ...S.card, padding: "12px 4px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6", marginBottom: 8, paddingLeft: 12 }}>Evolução Completa · {dashLoja}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 9 }} />
                    <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#f5f5f5" }} />
                    <Legend />
                    <Line type="monotone" dataKey="nota" stroke="#f5c518" strokeWidth={2} dot={{ r: 3 }} name="Nota" />
                    <Line type="monotone" dataKey="meta" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="% Meta" />
                    <Line type="monotone" dataKey="conversao" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} name="Conversão" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RANKING */}
      {page === "ranking" && (
        <div style={S.section}>
          <div style={S.title}>🏆 Ranking das Lojas</div>
          {userLojas.map((loja, i) => {
            const lojaVisits = userVisitas.filter(v => v.loja_id === loja.id);
            const lastVisit = lojaVisits[0];
            const avgScore = lojaVisits.length ? Math.round(lojaVisits.reduce((a, v) => a + v.nota_final, 0) / lojaVisits.length) : 0;
            const pendCount = userPendencias.filter(p => p.loja_id === loja.id && p.status !== "resolvido").length;
            return (
              <div key={loja.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => { setSelectedStore(loja); setPage("lojas"); }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: i === 0 ? "#f5c518" : i === 1 ? "#9ca3af" : i === 2 ? "#d97706" : "#1f1f1f", color: i < 3 ? "#000" : "#555", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{loja.nome}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{loja.supervisor} · {pendCount} pendência{pendCount !== 1 ? "s" : ""}</div>
                    <div style={{ background: "#0d0d0d", borderRadius: 4, height: 5, marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${avgScore}%`, background: scoreColor(avgScore), borderRadius: 4 }} /></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(avgScore) }}>{avgScore || "—"}</div>
                    {lastVisit && <span style={S.badge(statusColor(lastVisit.status_loja), statusBg(lastVisit.status_loja))}>{lastVisit.status_loja?.toUpperCase()}</span>}
                  </div>
                </div>
                {lastVisit && (
                  <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #1f1f1f" }}>
                    <div><div style={{ fontSize: 10, color: "#666" }}>VISITAS</div><div style={{ fontSize: 13, fontWeight: 700 }}>{lojaVisits.length}</div></div>
                    <div><div style={{ fontSize: 10, color: "#666" }}>ÚLTIMA META</div><div style={{ fontSize: 13, fontWeight: 700, color: lastVisit.perc_meta >= 100 ? "#16a34a" : "#dc2626" }}>{lastVisit.perc_meta}%</div></div>
                    <div><div style={{ fontSize: 10, color: "#666" }}>TICKET</div><div style={{ fontSize: 13, fontWeight: 700 }}>R$ {lastVisit.ticket_medio}</div></div>
                  </div>
                )}
              </div>
            );
          })}
          {userLojas.length === 0 && <div style={{ textAlign: "center", color: "#555", padding: 40 }}>Carregando...</div>}
        </div>
      )}

      {/* PENDÊNCIAS */}
      {page === "pendencias" && (
        <div style={S.section}>
          <div style={S.title}>⚠️ Plano de Ação</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {["todos","pendente","em andamento","vencido","resolvido"].map(f => (
              <button key={f} style={S.filterBtn(pendFilter === f)} onClick={() => setPendFilter(f)}>{f}</button>
            ))}
          </div>
          {(pendFilter === "todos" ? userPendencias : userPendencias.filter(p => p.status === pendFilter)).map(p => (
            <div key={p.id} style={{ ...S.card, borderLeft: `3px solid ${priorityColor(p.prioridade)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={S.badge(priorityColor(p.prioridade), `${priorityColor(p.prioridade)}22`)}>{p.prioridade?.toUpperCase()}</span>
                <span style={S.badge(pendStatusColor(p.status), `${pendStatusColor(p.status)}22`)}>{p.status?.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{p.problema}</div>
              <div style={{ fontSize: 12, color: "#888" }}>🏪 {p.loja_nome} · 📂 {p.categoria}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #1f1f1f" }}>
                <div><div style={{ fontSize: 10, color: "#666" }}>RESPONSÁVEL</div><div style={{ fontSize: 12, fontWeight: 600 }}>{p.responsavel || "—"}</div></div>
                {p.prazo && <div><div style={{ fontSize: 10, color: "#666" }}>PRAZO</div><div style={{ fontSize: 12, fontWeight: 600 }}>{new Date(p.prazo).toLocaleDateString("pt-BR")}</div></div>}
              </div>
            </div>
          ))}
          {userPendencias.length === 0 && <div style={{ textAlign: "center", color: "#555", padding: 40 }}>Nenhuma pendência encontrada</div>}
        </div>
      )}

      {/* LOJAS */}
      {page === "lojas" && !selectedStore && (
        <div style={S.section}>
          <div style={S.title}>🏪 Lojas</div>
          {userLojas.map(loja => {
            const lojaVisits = userVisitas.filter(v => v.loja_id === loja.id);
            const lastVisit = lojaVisits[0];
            const avgScore = lojaVisits.length ? Math.round(lojaVisits.reduce((a, v) => a + v.nota_final, 0) / lojaVisits.length) : 0;
            return (
              <div key={loja.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => setSelectedStore(loja)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{loja.nome}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{loja.cidade} · {loja.gerente}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{lojaVisits.length} visita{lojaVisits.length !== 1 ? "s" : ""} registrada{lojaVisits.length !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor(avgScore) }}>{avgScore || "—"}</div>
                    {lastVisit && <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(lastVisit.status_loja), marginLeft: "auto", marginTop: 4 }} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {page === "lojas" && selectedStore && (
        <div style={S.section}>
          <button onClick={() => setSelectedStore(null)} style={{ background: "none", border: "none", color: "#f5c518", cursor: "pointer", fontSize: 14, marginTop: 14, padding: 0 }}>← Voltar</button>

          {/* Store Header */}
          <div style={{ background: "#161200", border: "1px solid #2a2000", borderRadius: 12, padding: 16, marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#f5c518", textTransform: "uppercase", letterSpacing: 1 }}>{selectedStore.nome}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{selectedStore.cidade} · Gerente: {selectedStore.gerente} · Supervisor: {selectedStore.supervisor}</div>
            {storeVisits.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor(storeVisits[0].nota_final), lineHeight: 1 }}>{storeVisits[0].nota_final}</div>
                <div>
                  <div style={{ fontSize: 13, color: scoreColor(storeVisits[0].nota_final) }}>{scoreLabel(storeVisits[0].nota_final)}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Última visita: {new Date(storeVisits[0].data_visita).toLocaleDateString("pt-BR")}</div>
                </div>
              </div>
            )}
          </div>

          {/* Evolution Chart */}
          {storeVisits.length > 1 && (
            <div style={{ ...S.card, padding: "12px 4px", marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c518", marginBottom: 8, paddingLeft: 12 }}>Evolução da Nota</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={[...storeVisits].reverse().map(v => ({ data: new Date(v.data_visita).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), nota: v.nota_final, meta: v.perc_meta }))} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="data" tick={{ fill: "#666", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#f5f5f5" }} />
                  <Line type="monotone" dataKey="nota" stroke="#f5c518" strokeWidth={2} dot={{ r: 4 }} name="Nota" />
                  <Line type="monotone" dataKey="meta" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="% Meta" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Date Filters */}
          <div style={{ ...S.card, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>FILTRAR HISTÓRICO</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: histFilter === "custom" ? 10 : 0 }}>
              {[["7","7 dias"],["15","15 dias"],["30","30 dias"],["90","90 dias"],["custom","Período"]].map(([v, l]) => (
                <button key={v} style={S.filterBtn(histFilter === v)} onClick={() => setHistFilter(v)}>{l}</button>
              ))}
            </div>
            {histFilter === "custom" && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1 }}><label style={S.label}>De</label><input type="date" style={{ ...S.input, marginBottom: 0 }} value={histFrom} onChange={e => setHistFrom(e.target.value)} /></div>
                <div style={{ flex: 1 }}><label style={S.label}>Até</label><input type="date" style={{ ...S.input, marginBottom: 0 }} value={histTo} onChange={e => setHistTo(e.target.value)} /></div>
              </div>
            )}
          </div>

          {/* Visit History */}
          <div style={S.title}>Histórico de Visitas ({storeVisits.length})</div>
          {storeVisits.length === 0 ? (
            <div style={{ textAlign: "center", color: "#555", padding: 32 }}>Nenhuma visita no período selecionado</div>
          ) : storeVisits.map(v => (
            <div key={v.id} style={{ ...S.card, borderLeft: `3px solid ${scoreColor(v.nota_final)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date(v.data_visita).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>👤 {v.supervisor_nome} · {v.tipo_visita}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor(v.nota_final) }}>{v.nota_final}</div>
                  <span style={S.badge(statusColor(v.status_loja), statusBg(v.status_loja))}>{v.status_loja?.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10, paddingTop: 10, borderTop: "1px solid #1f1f1f", flexWrap: "wrap" }}>
                {v.venda_dia > 0 && <div><div style={{ fontSize: 10, color: "#666" }}>VENDAS</div><div style={{ fontSize: 12, fontWeight: 700 }}>R$ {v.venda_dia?.toLocaleString("pt-BR")}</div></div>}
                {v.perc_meta > 0 && <div><div style={{ fontSize: 10, color: "#666" }}>META</div><div style={{ fontSize: 12, fontWeight: 700, color: v.perc_meta >= 100 ? "#16a34a" : "#dc2626" }}>{v.perc_meta}%</div></div>}
                {v.ticket_medio > 0 && <div><div style={{ fontSize: 10, color: "#666" }}>TICKET</div><div style={{ fontSize: 12, fontWeight: 700 }}>R$ {v.ticket_medio}</div></div>}
                {v.conversao > 0 && <div><div style={{ fontSize: 10, color: "#666" }}>CONV.</div><div style={{ fontSize: 12, fontWeight: 700 }}>{v.conversao}%</div></div>}
              </div>
              {v.obs_geral && <div style={{ fontSize: 12, color: "#888", marginTop: 8, fontStyle: "italic" }}>"{v.obs_geral}"</div>}
            </div>
          ))}

          <button style={S.btnPrimary} onClick={() => { setChecklistStore(selectedStore); setPage("visita"); setSelectedStore(null); setChecklistStep(0); }}>
            ✅ Nova Visita a Esta Loja
          </button>
        </div>
      )}

      <nav style={S.nav}>
        {navItems.map(n => (
          <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => { resetNav(); setPage(n.id); }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
