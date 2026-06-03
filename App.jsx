import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ── DADOS ────────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "Danilo Silva", email: "danilo@oticasamigao.com", role: "diretor", stores: "all", avatar: "DS" },
  { id: 2, name: "Michel", email: "michel@oticasamigao.com", role: "diretor_comercial", stores: "all", avatar: "MC" },
  { id: 3, name: "Amanda", email: "amanda@oticasamigao.com", role: "supervisora", stores: [1,2,3,4,5,6,7,8], avatar: "AM" },
  { id: 4, name: "Oberdan", email: "oberdan@oticasamigao.com", role: "supervisor", stores: [9,10,11], avatar: "OB" },
];

const STORES = [
  { id: 1, name: "Saracuruna", city: "Duque de Caxias", supervisor: "Amanda", manager: "Ana Lima", meta: 45000, status: "verde", score: 92 },
  { id: 2, name: "Lote XV", city: "Duque de Caxias", supervisor: "Amanda", manager: "João Silva", meta: 38000, status: "amarelo", score: 78 },
  { id: 3, name: "Vila São Luís", city: "Duque de Caxias", supervisor: "Amanda", manager: "Patrícia Souza", meta: 42000, status: "vermelho", score: 65 },
  { id: 4, name: "Piabetá", city: "Magé", supervisor: "Amanda", manager: "Roberto Nunes", meta: 28000, status: "verde", score: 88 },
  { id: 5, name: "Magé", city: "Magé", supervisor: "Amanda", manager: "Fernanda Costa", meta: 32000, status: "amarelo", score: 74 },
  { id: 6, name: "Ilha do Governador", city: "Rio de Janeiro", supervisor: "Amanda", manager: "Thiago Melo", meta: 55000, status: "verde", score: 95 },
  { id: 7, name: "Caxias", city: "Duque de Caxias", supervisor: "Amanda", manager: "Simone Reis", meta: 48000, status: "amarelo", score: 81 },
  { id: 8, name: "Austin", city: "Nova Iguaçu", supervisor: "Amanda", manager: "Diego Alves", meta: 35000, status: "vermelho", score: 58 },
  { id: 9, name: "Volta Redonda", city: "Volta Redonda", supervisor: "Oberdan", manager: "Larissa Pinto", meta: 52000, status: "verde", score: 90 },
  { id: 10, name: "Barra Mansa", city: "Barra Mansa", supervisor: "Oberdan", manager: "Marcelo Ramos", meta: 40000, status: "amarelo", score: 83 },
  { id: 11, name: "Retiro", city: "Volta Redonda", supervisor: "Oberdan", manager: "Cláudia Teixeira", meta: 30000, status: "amarelo", score: 70 },
];

const VISITS = [
  { id: 1, store: "Saracuruna", storeId: 1, supervisor: "Amanda", date: "27/05/2025", score: 92, sales: 4200, meta: 4500, percMeta: 93, tickets: 12, comparecimentos: 10, conversao: 83, ticketMedio: 525, servicosPendentes: 1, status: "verde", obs: "Loja bem organizada. Equipe motivada." },
  { id: 2, store: "Lote XV", storeId: 2, supervisor: "Amanda", date: "26/05/2025", score: 78, sales: 3100, meta: 3800, percMeta: 82, tickets: 9, comparecimentos: 7, conversao: 78, ticketMedio: 517, servicosPendentes: 3, status: "amarelo", obs: "WhatsApp não está sendo usado corretamente." },
  { id: 3, store: "Vila São Luís", storeId: 3, supervisor: "Amanda", date: "27/05/2025", score: 65, sales: 2800, meta: 4200, percMeta: 67, tickets: 8, comparecimentos: 5, conversao: 63, ticketMedio: 475, servicosPendentes: 8, status: "vermelho", obs: "Vitrine sem comunicação. Equipe sem uniforme." },
  { id: 4, store: "Piabetá", storeId: 4, supervisor: "Amanda", date: "24/05/2025", score: 88, sales: 2900, meta: 2800, percMeta: 104, tickets: 10, comparecimentos: 9, conversao: 90, ticketMedio: 414, servicosPendentes: 0, status: "verde", obs: "Loja acima da meta. Parabéns à equipe." },
  { id: 5, store: "Magé", storeId: 5, supervisor: "Amanda", date: "23/05/2025", score: 74, sales: 2600, meta: 3200, percMeta: 81, tickets: 7, comparecimentos: 6, conversao: 86, ticketMedio: 520, servicosPendentes: 2, status: "amarelo", obs: "Indicadores não são acompanhados pelo gerente." },
  { id: 6, store: "Ilha do Governador", storeId: 6, supervisor: "Amanda", date: "27/05/2025", score: 95, sales: 5800, meta: 5500, percMeta: 105, tickets: 15, comparecimentos: 13, conversao: 87, ticketMedio: 527, servicosPendentes: 0, status: "verde", obs: "Melhor loja da rede no momento." },
  { id: 7, store: "Caxias", storeId: 7, supervisor: "Amanda", date: "26/05/2025", score: 81, sales: 4100, meta: 4800, percMeta: 85, tickets: 11, comparecimentos: 8, conversao: 73, ticketMedio: 513, servicosPendentes: 2, status: "amarelo", obs: "Gerente ausente do salão." },
  { id: 8, store: "Austin", storeId: 8, supervisor: "Amanda", date: "22/05/2025", score: 58, sales: 1900, meta: 3500, percMeta: 54, tickets: 6, comparecimentos: 4, conversao: 67, ticketMedio: 475, servicosPendentes: 7, status: "vermelho", obs: "Situação crítica. Múltiplas pendências." },
  { id: 9, store: "Volta Redonda", storeId: 9, supervisor: "Oberdan", date: "27/05/2025", score: 90, sales: 5100, meta: 5200, percMeta: 98, tickets: 13, comparecimentos: 11, conversao: 85, ticketMedio: 510, servicosPendentes: 1, status: "verde", obs: "Loja muito bem executada." },
  { id: 10, store: "Barra Mansa", storeId: 10, supervisor: "Oberdan", date: "25/05/2025", score: 83, sales: 3700, meta: 4000, percMeta: 93, tickets: 10, comparecimentos: 8, conversao: 80, ticketMedio: 529, servicosPendentes: 1, status: "amarelo", obs: "Boa execução. Pequenos ajustes." },
  { id: 11, store: "Retiro", storeId: 11, supervisor: "Oberdan", date: "21/05/2025", score: 70, sales: 2100, meta: 3000, percMeta: 70, tickets: 7, comparecimentos: 5, conversao: 71, ticketMedio: 525, servicosPendentes: 3, status: "amarelo", obs: "Agenda de exames desorganizada." },
];

const PENDENCIAS = [
  { id: 1, store: "Vila São Luís", problem: "Vitrine sem comunicação de promoção vigente", priority: "alta", status: "pendente", responsible: "Patrícia Souza", deadline: "30/05/2025", category: "Fachada e Vitrine", diasAtraso: 0 },
  { id: 2, store: "Austin", problem: "Equipe sem uniforme completo", priority: "crítica", status: "vencido", responsible: "Diego Alves", deadline: "24/05/2025", category: "Equipe e Cultura", diasAtraso: 3 },
  { id: 3, store: "Austin", problem: "OS de serviços atrasados sem responsável definido", priority: "crítica", status: "pendente", responsible: "Diego Alves", deadline: "29/05/2025", category: "Serviços e OS", diasAtraso: 0 },
  { id: 4, store: "Lote XV", problem: "Clientes do WhatsApp não sendo contatados", priority: "média", status: "em andamento", responsible: "João Silva", deadline: "01/06/2025", category: "Processos", diasAtraso: 0 },
  { id: 5, store: "Vila São Luís", problem: "Iluminação com lâmpadas queimadas", priority: "alta", status: "em andamento", responsible: "Patrícia Souza", deadline: "31/05/2025", category: "Fachada e Vitrine", diasAtraso: 0 },
  { id: 6, store: "Magé", problem: "Gerente não acompanha venda por vendedor", priority: "média", status: "pendente", responsible: "Fernanda Costa", deadline: "03/06/2025", category: "Indicadores", diasAtraso: 0 },
  { id: 7, store: "Austin", problem: "Produtos danificados na exposição", priority: "alta", status: "pendente", responsible: "Diego Alves", deadline: "30/05/2025", category: "Estoque", diasAtraso: 0 },
  { id: 8, store: "Retiro", problem: "Agenda de exames desorganizada", priority: "média", status: "pendente", responsible: "Cláudia Teixeira", deadline: "05/06/2025", category: "Processos", diasAtraso: 0 },
];

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
const priorityColor = (p) => p === "crítica" ? "#dc2626" : p === "alta" ? "#f97316" : p === "média" ? "#d97706" : "#6b7280";
const pendStatusColor = (s) => s === "vencido" ? "#dc2626" : s === "em andamento" ? "#3b82f6" : s === "resolvido" ? "#16a34a" : "#d97706";

export default function AmigaoCheck() {
  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [checklistStore, setChecklistStore] = useState(null);
  const [checklistStep, setChecklistStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitData, setVisitData] = useState({ sales: "", meta: "", agendamentos: "", comparecimentos: "", type: "Rotina", obs: "" });
  const [checklistDone, setChecklistDone] = useState(false);
  const [pendFilter, setPendFilter] = useState("todos");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const userStores = currentUser
    ? (currentUser.stores === "all" ? STORES : STORES.filter(s => currentUser.stores.includes(s.id)))
    : [];

  const userVisits = currentUser
    ? (currentUser.stores === "all" ? VISITS : VISITS.filter(v => currentUser.stores.includes(v.storeId)))
    : [];

  const userPendencias = currentUser
    ? (currentUser.stores === "all" ? PENDENCIAS : PENDENCIAS.filter(p => userStores.some(s => s.name === p.store)))
    : [];

  const avg = userVisits.length ? Math.round(userVisits.reduce((a, b) => a + b.score, 0) / userVisits.length) : 0;
  const best = [...userVisits].sort((a, b) => b.score - a.score)[0];
  const worst = [...userVisits].sort((a, b) => a.score - b.score)[0];
  const totalItems = CHECKLIST_CATS.reduce((a, c) => a + c.items.length, 0);
  const answeredItems = Object.keys(answers).length;
  const progressPct = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;

  const calcScore = () => {
    const vals = Object.values(answers);
    if (!vals.length) return 0;
    const applicable = vals.filter(v => v !== "na");
    if (!applicable.length) return 0;
    const pts = applicable.reduce((a, v) => a + (v === "ok" ? 1 : v === "parcial" ? 0.5 : 0), 0);
    return Math.round((pts / applicable.length) * 100);
  };

  const handleLogin = () => {
    const user = USERS.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (user && loginPass === "amigao123") {
      setCurrentUser(user);
      setPage("dashboard");
      setLoginError("");
    } else {
      setLoginError("E-mail ou senha incorretos");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage("login");
    setLoginEmail("");
    setLoginPass("");
  };

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
    btnSecondary: { background: "#1f1f1f", color: "#f5f5f5", border: "1px solid #333", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
    badge: (c, bg) => ({ display: "inline-block", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: c, background: bg }),
    section: { padding: "0 14px" },
    title: { fontSize: 17, fontWeight: 700, color: "#f5f5f5", marginBottom: 14, marginTop: 18, letterSpacing: -0.5 },
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "ranking", label: "Ranking", icon: "🏆" },
    { id: "visita", label: "Nova Visita", icon: "✅" },
    { id: "pendencias", label: "Pendências", icon: "⚠️" },
    { id: "lojas", label: "Lojas", icon: "🏪" },
  ];

  // ── LOGIN ───────────────────────────────────────────────────
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
          <button style={S.btnPrimary} onClick={handleLogin}>Entrar</button>
        </div>
        <div style={{ marginTop: 16, background: "#111", borderRadius: 10, padding: 12, border: "1px solid #222" }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textAlign: "center" }}>USUÁRIOS DE TESTE</div>
          {USERS.map(u => (
            <div key={u.id} style={{ fontSize: 11, color: "#888", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#f5c518" }}>{u.email}</span>
              <span>amigao123</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── CHECKLIST FLOW ──────────────────────────────────────────
  if (page === "visita") {
    if (checklistDone) {
      const finalScore = calcScore();
      return (
        <div style={S.app}>
          <style>{`* { box-sizing: border-box; }`}</style>
          <div style={S.header}>
            <div style={{ background: "#f5c518", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👓</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#f5c518" }}>AMIGÃO CHECK</div>
          </div>
          <div style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#f5c518" }}>Visita Registrada!</div>
            <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>Loja: <strong style={{ color: "#f5f5f5" }}>{checklistStore?.name}</strong></div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor(finalScore) }}>{finalScore}</div>
              <div style={{ fontSize: 14, color: scoreColor(finalScore) }}>{scoreLabel(finalScore)}</div>
            </div>
            <div style={{ background: "#161616", borderRadius: 8, height: 8, marginTop: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${finalScore}%`, background: scoreColor(finalScore), borderRadius: 8, transition: "width 1s" }} />
            </div>
            <div style={{ ...S.card, textAlign: "left", marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c518", marginBottom: 12 }}>Resultado por Categoria</div>
              {CHECKLIST_CATS.map(cat => {
                const catAnswers = cat.items.map((_, i) => answers[`${cat.id}_${i}`]).filter(Boolean).filter(a => a !== "na");
                const pts = catAnswers.reduce((a, v) => a + (v === "ok" ? 1 : v === "parcial" ? 0.5 : 0), 0);
                const catScore = catAnswers.length ? Math.round((pts / catAnswers.length) * 100) : null;
                return (
                  <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1f1f1f" }}>
                    <div style={{ fontSize: 13 }}>{cat.icon} {cat.name}</div>
                    {catScore !== null ? <span style={{ fontWeight: 700, color: scoreColor(catScore), fontSize: 15 }}>{catScore}</span> : <span style={{ color: "#444" }}>—</span>}
                  </div>
                );
              })}
            </div>
            <button style={S.btnPrimary} onClick={() => { setChecklistDone(false); setAnswers({}); setChecklistStep(0); setChecklistStore(null); setPage("dashboard"); }}>
              Voltar ao Dashboard
            </button>
          </div>
          <nav style={S.nav}>
            {navItems.map(n => <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => { setPage(n.id); setChecklistDone(false); setAnswers({}); setChecklistStep(0); setChecklistStore(null); }}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}
          </nav>
        </div>
      );
    }

    if (!checklistStore) return (
      <div style={S.app}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={S.header}>
          <div style={{ background: "#f5c518", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👓</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#f5c518" }}>AMIGÃO CHECK</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={S.title}>Nova Visita</div>
          <div style={S.card}>
            <label style={S.label}>Supervisor</label>
            <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, marginBottom: 10 }}>{currentUser?.name}</div>
            <label style={S.label}>Selecione a Loja</label>
            {userStores.map(s => (
              <div key={s.id} onClick={() => setChecklistStore(s)} style={{ ...S.card, cursor: "pointer", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #2a2a2a" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{s.city} · {s.manager}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(s.score) }}>{s.score}</div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(s.status), marginLeft: "auto" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <nav style={S.nav}>{navItems.map(n => <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => setPage(n.id)}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );

    if (checklistStep === 0) return (
      <div style={S.app}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={S.header}>
          <button onClick={() => setChecklistStore(null)} style={{ background: "none", border: "none", color: "#f5c518", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f5c518" }}>Visita · {checklistStore.name}</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={S.title}>Dados Comerciais</div>
          <div style={S.card}>
            <label style={S.label}>Tipo de Visita</label>
            <select style={S.select} value={visitData.type} onChange={e => setVisitData({ ...visitData, type: e.target.value })}>
              {["Rotina", "Auditoria", "Problema", "Reforço Comercial"].map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={S.label}>Gerente Presente?</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {["Sim", "Não"].map(v => (
                <button key={v} onClick={() => setVisitData({ ...visitData, gerentePresente: v })} style={{ flex: 1, padding: "10px", borderRadius: 8, border: visitData.gerentePresente === v ? "2px solid #f5c518" : "1px solid #333", background: visitData.gerentePresente === v ? "#1a1200" : "#111", color: visitData.gerentePresente === v ? "#f5c518" : "#888", cursor: "pointer", fontWeight: 700 }}>{v}</button>
              ))}
            </div>
            <label style={S.label}>Venda do Dia (R$)</label>
            <input style={S.input} type="number" placeholder="Ex: 3500" value={visitData.sales} onChange={e => setVisitData({ ...visitData, sales: e.target.value })} />
            <label style={S.label}>Meta do Dia (R$)</label>
            <input style={S.input} type="number" placeholder="Ex: 4500" value={visitData.meta} onChange={e => setVisitData({ ...visitData, meta: e.target.value })} />
            <label style={S.label}>Agendamentos do Dia</label>
            <input style={S.input} type="number" placeholder="Ex: 12" value={visitData.agendamentos} onChange={e => setVisitData({ ...visitData, agendamentos: e.target.value })} />
            <label style={S.label}>Comparecimentos</label>
            <input style={S.input} type="number" placeholder="Ex: 9" value={visitData.comparecimentos} onChange={e => setVisitData({ ...visitData, comparecimentos: e.target.value })} />
            {visitData.sales && visitData.meta && (
              <div style={{ background: "#0a0a0a", borderRadius: 8, padding: 12, marginBottom: 10, display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#666" }}>% META</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: visitData.sales >= visitData.meta ? "#16a34a" : "#dc2626" }}>
                    {Math.round((visitData.sales / visitData.meta) * 100)}%
                  </div>
                </div>
                {visitData.agendamentos && visitData.comparecimentos && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#666" }}>CONVERSÃO</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#f5c518" }}>
                      {Math.round((visitData.comparecimentos / visitData.agendamentos) * 100)}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <button style={S.btnPrimary} onClick={() => setChecklistStep(1)}>Iniciar Checklist →</button>
        </div>
        <nav style={S.nav}>{navItems.map(n => <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => setPage(n.id)}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );

    const cat = CHECKLIST_CATS[checklistStep - 1];
    return (
      <div style={S.app}>
        <style>{`* { box-sizing: border-box; }`}</style>
        <div style={S.header}>
          <button onClick={() => checklistStep > 1 ? setChecklistStep(s => s - 1) : setChecklistStep(0)} style={{ background: "none", border: "none", color: "#f5c518", cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#888" }}>{checklistStore.name} · Cat. {checklistStep}/{CHECKLIST_CATS.length}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{cat.icon} {cat.name}</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: calcScore() >= 70 ? "#f5c518" : "#dc2626" }}>{calcScore()}</div>
        </div>
        <div style={{ background: "#111", height: 4 }}>
          <div style={{ height: "100%", width: `${(checklistStep / CHECKLIST_CATS.length) * 100}%`, background: "#f5c518", transition: "width 0.3s" }} />
        </div>
        <div style={{ padding: "12px 14px" }}>
          {cat.items.map((item, idx) => {
            const key = `${cat.id}_${idx}`;
            const ans = answers[key];
            return (
              <div key={idx} style={{ ...S.card, borderLeft: `3px solid ${ans === "nao" ? "#dc2626" : ans === "parcial" ? "#d97706" : ans === "ok" ? "#16a34a" : "#222"}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>{item}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["ok","✅ OK","#16a34a","#052e16"],["parcial","⚡ Parcial","#d97706","#1c1200"],["nao","❌ Não OK","#dc2626","#1c0000"],["na","N/A","#555","#111"]].map(([val, label, color, bg]) => (
                    <button key={val} onClick={() => setAnswers({ ...answers, [key]: val })}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 6, border: ans === val ? `2px solid ${color}` : "1px solid #2a2a2a", background: ans === val ? bg : "#0d0d0d", color: ans === val ? color : "#555", cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all 0.15s" }}>
                      {label}
                    </button>
                  ))}
                </div>
                {ans === "nao" && (
                  <div style={{ marginTop: 8 }}>
                    <input style={{ ...S.input, marginBottom: 6, fontSize: 13 }} placeholder="📝 Descreva o problema..." />
                    <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>📷 Foto de evidência obrigatória</div>
                    <input type="file" accept="image/*" capture="environment" style={{ marginTop: 6, fontSize: 11, color: "#888", width: "100%" }} />
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {checklistStep < CHECKLIST_CATS.length
              ? <button style={S.btnPrimary} onClick={() => setChecklistStep(s => s + 1)}>Próxima Categoria →</button>
              : <button style={S.btnPrimary} onClick={() => setChecklistDone(true)}>Finalizar Visita ✓</button>}
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#444" }}>{progressPct}% respondido · Nota parcial: {calcScore()}/100</div>
        </div>
        <nav style={S.nav}>{navItems.map(n => <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => setPage(n.id)}><span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
  }

  return (
    <div style={S.app}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }`}</style>

      <div style={S.header}>
        <div style={{ background: "#f5c518", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#f5c518", letterSpacing: -0.5 }}>AMIGÃO CHECK</div>
          <div style={{ fontSize: 10, color: "#666", letterSpacing: 1 }}>SUPERVISÃO OPERACIONAL</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#1a1a1a", borderRadius: 20, padding: "4px 10px", fontSize: 12 }}>
            <span style={{ color: currentUser?.role.includes("diretor") ? "#f5c518" : "#3b82f6" }}>
              {currentUser?.role === "diretor" ? "👑 Diretor" : currentUser?.role === "diretor_comercial" ? "💼 Dir. Comercial" : "👤 Supervisor"}
            </span>
          </div>
          <button onClick={handleLogout} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 20, padding: "4px 10px", color: "#888", fontSize: 12, cursor: "pointer" }}>Sair</button>
        </div>
      </div>

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div>
          <div style={{ background: "#161200", border: "1px solid #2a2000", borderRadius: 12, margin: "14px 14px 0", padding: 16 }}>
            <div style={{ fontSize: 11, color: "#f5c518", textTransform: "uppercase", letterSpacing: 1 }}>Média Geral · {currentUser?.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <div>
                <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(avg), lineHeight: 1 }}>{avg}<span style={{ fontSize: 18, color: "#888" }}>/100</span></div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{scoreLabel(avg)}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13 }}>
                <div style={{ marginBottom: 6 }}>🟢 {userVisits.filter(v => v.status === "verde").length} verde{userVisits.filter(v => v.status === "verde").length !== 1 ? "s" : ""}</div>
                <div style={{ marginBottom: 6 }}>🟡 {userVisits.filter(v => v.status === "amarelo").length} amarelo{userVisits.filter(v => v.status === "amarelo").length !== 1 ? "s" : ""}</div>
                <div>🔴 {userVisits.filter(v => v.status === "vermelho").length} vermelho{userVisits.filter(v => v.status === "vermelho").length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <div style={{ background: "#0a0900", borderRadius: 6, height: 8, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${avg}%`, background: "linear-gradient(90deg,#f5c518,#fbbf24)", borderRadius: 6, transition: "width 1s" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 14px 0" }}>
            {[
              { label: "Melhor Loja", value: best?.score, sub: best?.store, color: "#16a34a" },
              { label: "Pior Loja", value: worst?.score, sub: worst?.store, color: "#dc2626" },
              { label: "Pendências", value: userPendencias.length, sub: "abertas", color: "#f5c518" },
              { label: "Vencidas", value: userPendencias.filter(p => p.status === "vencido").length, sub: "em atraso", color: "#dc2626" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#161616", border: `1px solid ${s.color}22`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.color, fontWeight: 700, marginTop: 2 }}>{s.sub}</div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={S.section}>
            <div style={S.title}>Nota por Loja</div>
            <div style={{ ...S.card, padding: "12px 4px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...userVisits].sort((a,b) => b.score - a.score)} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="store" tick={{ fill: "#666", fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis domain={[0,100]} tick={{ fill: "#666", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#f5f5f5" }} />
                  <Bar dataKey="score" fill="#f5c518" radius={[4,4,0,0]} name="Nota" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={S.title}>% Meta Atingida</div>
            <div style={{ ...S.card, padding: "12px 4px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={userVisits} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="store" tick={{ fill: "#666", fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#f5f5f5" }} formatter={(v) => [`${v}%`, "% Meta"]} />
                  <Bar dataKey="percMeta" fill="#3b82f6" radius={[4,4,0,0]} name="% Meta" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={S.title}>Ticket Médio (R$)</div>
            <div style={{ ...S.card, padding: "12px 4px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={userVisits} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="store" tick={{ fill: "#666", fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#f5f5f5" }} formatter={(v) => [`R$ ${v}`, "Ticket Médio"]} />
                  <Bar dataKey="ticketMedio" fill="#16a34a" radius={[4,4,0,0]} name="Ticket Médio" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={S.title}>Conversão (%)</div>
            <div style={{ ...S.card, padding: "12px 4px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={userVisits} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="store" tick={{ fill: "#666", fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#f5f5f5" }} formatter={(v) => [`${v}%`, "Conversão"]} />
                  <Bar dataKey="conversao" fill="#a855f7" radius={[4,4,0,0]} name="Conversão" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={S.title}>Pendências Críticas</div>
            {userPendencias.filter(p => p.priority === "crítica" || p.status === "vencido").slice(0, 3).map(p => (
              <div key={p.id} style={{ ...S.card, borderLeft: `3px solid ${priorityColor(p.priority)}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: priorityColor(p.priority), fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{p.priority} · {p.category}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.problem}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>🏪 {p.store} · 👤 {p.responsible}</div>
                  </div>
                  <span style={S.badge(pendStatusColor(p.status), `${pendStatusColor(p.status)}22`)}>{p.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RANKING */}
      {page === "ranking" && (
        <div style={S.section}>
          <div style={S.title}>🏆 Ranking das Lojas</div>
          {[...userVisits].sort((a, b) => b.score - a.score).map((v, i) => (
            <div key={v.id} style={{ ...S.card, borderLeft: i === 0 ? "3px solid #f5c518" : "1px solid #222", cursor: "pointer" }} onClick={() => { setSelectedStore(v); setPage("lojas"); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: i === 0 ? "#f5c518" : i === 1 ? "#9ca3af" : i === 2 ? "#d97706" : "#1f1f1f", color: i < 3 ? "#000" : "#555", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{v.store}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{v.supervisor} · {v.pendencias || PENDENCIAS.filter(p => p.store === v.store).length} pendência(s)</div>
                  <div style={{ background: "#0d0d0d", borderRadius: 4, height: 5, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${v.score}%`, background: scoreColor(v.score), borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(v.score) }}>{v.score}</div>
                  <span style={S.badge(statusColor(v.status), statusBg(v.status))}>{v.status.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #1f1f1f" }}>
                <div><div style={{ fontSize: 10, color: "#666" }}>VENDAS</div><div style={{ fontSize: 13, fontWeight: 700 }}>R$ {v.sales.toLocaleString("pt-BR")}</div></div>
                <div><div style={{ fontSize: 10, color: "#666" }}>META</div><div style={{ fontSize: 13, color: v.percMeta >= 100 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{v.percMeta}%</div></div>
                <div><div style={{ fontSize: 10, color: "#666" }}>TICKET</div><div style={{ fontSize: 13, fontWeight: 700 }}>R$ {v.ticketMedio}</div></div>
                <div><div style={{ fontSize: 10, color: "#666" }}>CONV.</div><div style={{ fontSize: 13, fontWeight: 700 }}>{v.conversao}%</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PENDÊNCIAS */}
      {page === "pendencias" && (
        <div style={S.section}>
          <div style={S.title}>⚠️ Plano de Ação</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {["todos", "pendente", "em andamento", "vencido"].map(f => (
              <button key={f} onClick={() => setPendFilter(f)} style={{ padding: "5px 12px", borderRadius: 20, border: pendFilter === f ? "1px solid #f5c518" : "1px solid #333", background: pendFilter === f ? "#1a1200" : "#161616", color: pendFilter === f ? "#f5c518" : "#888", fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
            ))}
          </div>
          {(pendFilter === "todos" ? userPendencias : userPendencias.filter(p => p.status === pendFilter)).map(p => (
            <div key={p.id} style={{ ...S.card, borderLeft: `3px solid ${priorityColor(p.priority)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={S.badge(priorityColor(p.priority), `${priorityColor(p.priority)}22`)}>{p.priority.toUpperCase()}</span>
                <span style={S.badge(pendStatusColor(p.status), `${pendStatusColor(p.status)}22`)}>{p.status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{p.problem}</div>
              <div style={{ fontSize: 12, color: "#888" }}>🏪 {p.store} · 📂 {p.category}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #1f1f1f" }}>
                <div><div style={{ fontSize: 10, color: "#666" }}>RESPONSÁVEL</div><div style={{ fontSize: 12, fontWeight: 600 }}>{p.responsible}</div></div>
                <div><div style={{ fontSize: 10, color: "#666" }}>PRAZO</div><div style={{ fontSize: 12, fontWeight: 600, color: p.status === "vencido" ? "#dc2626" : "#f5f5f5" }}>{p.deadline}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LOJAS */}
      {page === "lojas" && !selectedStore && (
        <div style={S.section}>
          <div style={S.title}>🏪 Lojas</div>
          {userVisits.map(v => (
            <div key={v.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => setSelectedStore(v)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{v.store}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{userStores.find(s => s.name === v.store)?.city} · {v.supervisor}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor(v.score) }}>{v.score}</div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(v.status), marginLeft: "auto", marginTop: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {page === "lojas" && selectedStore && (
        <div style={S.section}>
          <button onClick={() => setSelectedStore(null)} style={{ background: "none", border: "none", color: "#f5c518", cursor: "pointer", fontSize: 14, marginTop: 14, padding: 0 }}>← Voltar</button>
          <div style={{ background: "#161200", border: "1px solid #2a2000", borderRadius: 12, padding: 16, marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#f5c518", textTransform: "uppercase", letterSpacing: 1 }}>{selectedStore.store}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor(selectedStore.score), lineHeight: 1 }}>{selectedStore.score}</div>
              <div style={{ textAlign: "right" }}>
                <span style={S.badge(statusColor(selectedStore.status), statusBg(selectedStore.status))}>{selectedStore.status.toUpperCase()}</span>
                <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{scoreLabel(selectedStore.score)}</div>
              </div>
            </div>
            <div style={{ background: "#0a0900", borderRadius: 4, height: 6, marginTop: 10 }}>
              <div style={{ height: "100%", width: `${selectedStore.score}%`, background: scoreColor(selectedStore.score), borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#3b82f6" }}>R$ {selectedStore.sales?.toLocaleString("pt-BR")}</div><div style={{ fontSize: 11, color: "#666" }}>VENDAS</div></div>
            <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: selectedStore.percMeta >= 100 ? "#16a34a" : "#dc2626" }}>{selectedStore.percMeta}%</div><div style={{ fontSize: 11, color: "#666" }}>DA META</div></div>
            <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>R$ {selectedStore.ticketMedio}</div><div style={{ fontSize: 11, color: "#666" }}>TICKET MÉDIO</div></div>
            <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 900, color: "#a855f7" }}>{selectedStore.conversao}%</div><div style={{ fontSize: 11, color: "#666" }}>CONVERSÃO</div></div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c518", marginBottom: 10 }}>Detalhes</div>
            {[
              ["Gerente", userStores.find(s => s.name === selectedStore.store)?.manager],
              ["Supervisor", selectedStore.supervisor],
              ["Última Visita", selectedStore.date],
              ["Observação", selectedStore.obs],
            ].map(([k, v]) => (
              <div key={k} style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>{k}: <span style={{ color: "#f5f5f5" }}>{v}</span></div>
            ))}
          </div>
          {userPendencias.filter(p => p.store === selectedStore.store).length > 0 && (
            <div>
              <div style={S.title}>Pendências</div>
              {userPendencias.filter(p => p.store === selectedStore.store).map(p => (
                <div key={p.id} style={{ ...S.card, borderLeft: `3px solid ${priorityColor(p.priority)}` }}>
                  <div style={{ fontSize: 11, color: priorityColor(p.priority), fontWeight: 700 }}>{p.priority.toUpperCase()}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{p.problem}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>👤 {p.responsible} · 📅 {p.deadline}</div>
                </div>
              ))}
            </div>
          )}
          <button style={S.btnPrimary} onClick={() => { setChecklistStore(userStores.find(s => s.name === selectedStore.store)); setPage("visita"); setChecklistStep(1); setSelectedStore(null); }}>
            ✅ Nova Visita a Esta Loja
          </button>
        </div>
      )}

      <nav style={S.nav}>
        {navItems.map(n => (
          <button key={n.id} style={S.navBtn(page === n.id)} onClick={() => { setPage(n.id); setSelectedStore(null); setChecklistDone(false); setAnswers({}); setChecklistStep(0); setChecklistStore(null); }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
