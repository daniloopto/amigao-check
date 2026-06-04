import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";




// Indicadores diários (preenchidos pelos supervisores)







// ── SUPABASE ──────────────────────────────────────────────────
const SUPA_URL = "https://twoliotudbjxmbzddwzc.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b2xpb3R1ZGJqeG1iemRkd3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjEwOTAsImV4cCI6MjA5NjA5NzA5MH0.l-6sJOK8Dwc03dhMhwTlNj-ZDA9vxIsjfa33wk0VoxU";
const sb = async (path, opts = {}) => {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
      ...opts,
      headers: { apikey:SUPA_KEY, Authorization:`Bearer ${SUPA_KEY}`, "Content-Type":"application/json", Prefer:"return=representation", ...(opts.headers||{}) },
    });
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  } catch(e) { console.error("Supabase error:", e); return null; }
};

const CHECKLIST_CATS = [
  { id:1, name:"Fachada e Vitrine", icon:"🏪", items:["Fachada está limpa e visível?","Vitrine está organizada?","Promoção atual está bem exposta?","Loja está limpa?","Armações estão organizadas?","Balcão está limpo e sem bagunça?","Iluminação está funcionando bem?"] },
  { id:2, name:"Atendimento", icon:"🤝", items:["Vendedores fazem abordagem padrão?","Vendedores fazem anamnese antes de vender?","Vendedores criam conexão com o cliente?","Vendedores explicam benefícios das lentes?","Gerente participa das negociações?","Equipe conduz objeções de preço?","Cliente recebe info clara sobre prazo?"] },
  { id:3, name:"Processos Operacionais", icon:"⚙️", items:["Clientes do WhatsApp estão sendo respondidos?","Orçamentos não fechados acompanhados?","OS estão sendo lançadas corretamente?","Loja confere prazos de entrega?","Controle de clientes que faltaram?"] },
  { id:4, name:"Indicadores e Gestão", icon:"📊", items:["Gerente sabe a meta do dia?","Equipe sabe a meta do dia?","Gerente acompanha vendas por vendedor?","Loja acompanha ticket médio?","Loja acompanha conversão?","Gerente cobra resultado no dia?"] },
  { id:5, name:"Equipe e Cultura", icon:"👥", items:["Equipe está uniformizada?","Equipe com postura profissional?","Equipe demonstra energia?","Equipe trata clientes com respeito?","Equipe trata colegas com respeito?","Equipe conhece a promoção atual?"] },
  { id:6, name:"Estoque e Exposição", icon:"👓", items:["Armações estão bem expostas?","Linhas White, Gold e Black organizadas?","Produtos suficientes na vitrine?","Produtos danificados retirados?","Espelhos e displays limpos?"] },
  { id:7, name:"Serviços e OS", icon:"🔧", items:["Serviços atrasados acompanhados?","Clientes de serviços prontos avisados?","Serviços com problema tratados?","Conferência final antes da entrega?"] },
];

const sc = (n) => n>=90?"#16a34a":n>=80?"#65a30d":n>=70?"#d97706":"#dc2626";
const sl = (n) => n>=90?"Padrão Ouro ⭐":n>=80?"Boa, com ajustes":n>=70?"Atenção ⚠️":"Crítica 🔴";
const stc = (s) => s==="verde"?"#16a34a":s==="amarelo"?"#d97706":"#dc2626";
const stb = (s) => s==="verde"?"#052e16":s==="amarelo"?"#1c1200":"#1c0000";
const pc = (p) => p==="critica"?"#dc2626":p==="alta"?"#f97316":p==="media"?"#d97706":"#6b7280";
const psc = (s) => s==="vencido"?"#dc2626":s==="em andamento"?"#3b82f6":s==="resolvido"?"#16a34a":"#d97706";
const getToday = () => new Date().toISOString().split("T")[0];
const today = getToday();
const daysAgo = (d) => { const dt=new Date(); dt.setDate(dt.getDate()-d); return dt.toISOString().split("T")[0]; };
const yesterday = daysAgo(1);
const getPeriod = (p, f, t) => {
  if (p==="hoje") return { from:today, to:today, days:1 };
  if (p==="ontem") return { from:yesterday, to:yesterday, days:1 };
  if (p==="mes") { const d=new Date(); const from=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; const days=d.getDate(); return {from,to:today,days}; }
  if (p==="7") return { from:daysAgo(7), to:today, days:7 };
  if (p==="30") return { from:daysAgo(30), to:today, days:30 };
  if (p==="6m") { const d=new Date(); d.setMonth(d.getMonth()-6); const from=d.toISOString().split("T")[0]; return {from,to:today,days:180}; }
  if (p==="custom"&&f&&t) { const d=Math.max(1,Math.round((new Date(t)-new Date(f))/86400000)+1); return {from:f,to:t,days:d}; }
  return { from:daysAgo(30), to:today, days:30 };
};
const metaPeriodo = (metaMensal, dias, du) => Math.round((metaMensal/(du||26))*dias);

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [lojas, setLojas] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [metas, setMetas] = useState({});
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [indVendedor, setIndVendedor] = useState([]);
  const mesAtual = today.slice(0,7); // "YYYY-MM"
  const [diasUteisPorMes, setDiasUteisPorMes] = useState({ [mesAtual]: 26 });
  const diasUteis = diasUteisPorMes[mesAtual] || 26;
  const getDiasUteis = (anoMes) => diasUteisPorMes[anoMes] || 26;

  // Login
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [loginErr, setLoginErr] = useState("");

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoja, setSettingsLoja] = useState(null);
  const [settingsLojaForm, setSettingsLojaForm] = useState({});
  const [newVendedor, setNewVendedor] = useState("");
  // Gerente indicators
  const [gerenteIndDate, setGerenteIndDate] = useState(getToday());
  const [gerenteIndForm, setGerenteIndForm] = useState({});
  const [gerenteIndDone, setGerenteIndDone] = useState(false);

  // Dashboard
  const [dashLoja, setDashLoja] = useState("todas"); const [dashChart, setDashChart] = useState("meta");
  const [dashPeriod, setDashPeriod] = useState("mes");
  const [dashFrom, setDashFrom] = useState(""); const [dashTo, setDashTo] = useState(today);

  // Ranking
  const [rankBy, setRankBy] = useState("geral"); const [rankPeriod, setRankPeriod] = useState("30"); const [rankFrom, setRankFrom] = useState(""); const [rankTo, setRankTo] = useState(today);

  // Indicadores form
  const [indLoja, setIndLoja] = useState(null); const [indForm, setIndForm] = useState({ data:today, vendas:"", receita:"", atendimentos:"", vendas_realizadas:"", obs:"" }); const [indDone, setIndDone] = useState(false);
  const [indFilter, setIndFilter] = useState("7"); const [indFilterLoja, setIndFilterLoja] = useState("todas");

  // Visita/Checklist
  const [clLoja, setClLoja] = useState(null); const [clStep, setClStep] = useState(0); const [answers, setAnswers] = useState({}); const [vForm, setVForm] = useState({ data:getToday(), vendas:"", atendimentos:"", vendas_realizadas:"", type:"Rotina", gerente:"Sim", obs:"" }); const [clDone, setClDone] = useState(false);

  // Pendencias
  const [pendFilter, setPendFilter] = useState("todos");
  const [pendTipo, setPendTipo] = useState("processo");
  const [selPendStore, setSelPendStore] = useState(null);
  const [editingPend, setEditingPend] = useState(null);
  const [newPend, setNewPend] = useState(false);
  const [newPendForm, setNewPendForm] = useState({ loja_id:"", problema:"", categoria:"", responsavel:"", prazo:"", prioridade:"alta", obs:"", tipo:"processo" });

  // Lojas
  const [selStore, setSelStore] = useState(null); const [histFilter, setHistFilter] = useState("30"); const [histFrom, setHistFrom] = useState(""); const [histTo, setHistTo] = useState(today);
  const [viewingVisit, setViewingVisit] = useState(null);
  const [visitAnswers, setVisitAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [editingVisitMode, setEditingVisitMode] = useState(false);
  const [visitEditForm, setVisitEditForm] = useState({});
  const [editingInd, setEditingInd] = useState(null);
  const [indEditForm, setIndEditForm] = useState({});

  const uLojas = user ? (user.lojas_ids ? lojas.filter(l=>user.lojas_ids.includes(l.id)) : lojas) : [];
  const uVendedores = user ? (user.lojas_ids ? vendedores.filter(v=>user.lojas_ids.includes(v.loja_id)) : vendedores) : [];
  const uIndV = user ? (user.lojas_ids ? indVendedor.filter(i=>user.lojas_ids.includes(i.loja_id)) : indVendedor) : [];
  const uVisitas = user ? (user.lojas_ids ? visitas.filter(v=>user.lojas_ids.includes(v.loja_id)) : visitas) : [];
  const uInd = user ? (user.lojas_ids ? indicadores.filter(i=>user.lojas_ids.includes(i.loja_id)) : indicadores) : [];
  const uPend = user ? (
    user.role === "manutencao"
      ? pendencias.filter(p => p.tipo === "manutencao")
      : user.lojas_ids
        ? pendencias.filter(p => user.lojas_ids.includes(p.loja_id))
        : pendencias
  ) : [];

  const calcScore = () => { const v=Object.values(answers).filter(x=>["ok","parcial","nao","na"].includes(x)); const a=v.filter(x=>x!=="na"); if(!a.length) return 0; return Math.round(a.reduce((s,x)=>s+(x==="ok"?1:x==="parcial"?0.5:0),0)/a.length*100); };

  const openVisitDetail = async (visit) => {
    setViewingVisit(visit);
    setVisitEditForm({ nota_final:visit.nota_final, status_loja:visit.status_loja, obs_geral:visit.obs_geral||"", vendas:visit.vendas||0, atendimentos:visit.atendimentos||0, vendas_realizadas:visit.vendas_realizadas||0 });
    setEditingVisitMode(false);
    setLoadingAnswers(true);
    const res = await sb(`respostas_checklist?visita_id=eq.${visit.id}&select=*&order=categoria_id,item_idx`);
    setVisitAnswers(res || []);
    setLoadingAnswers(false);
  };

  const saveVisitEdit = async () => {
    await sb(`visitas?id=eq.${viewingVisit.id}`, { method:"PATCH", body:JSON.stringify({ nota_final:parseInt(visitEditForm.nota_final)||0, status_loja:visitEditForm.status_loja, obs_geral:visitEditForm.obs_geral, vendas:parseFloat(visitEditForm.vendas)||0, atendimentos:parseInt(visitEditForm.atendimentos)||0, vendas_realizadas:parseInt(visitEditForm.vendas_realizadas)||0 }) });
    setVisitas(prev=>prev.map(v=>v.id===viewingVisit.id?{...v,...visitEditForm}:v));
    setViewingVisit(prev=>({...prev,...visitEditForm}));
    setEditingVisitMode(false);
  };

  const saveIndEdit = async () => {
    const v=parseFloat(indEditForm.vendas)||0; const rec=parseFloat(indEditForm.receita)||0;
    const a=parseInt(indEditForm.atendimentos)||0; const vr=parseInt(indEditForm.vendas_realizadas)||0;
    const conv=a>0?Math.round((vr/a)*100):0; const ticket=vr>0?Math.round(v/vr):0;
    const percReceita=v>0?Math.round((rec/v)*100):0;
    const payload = { vendas:v, receita:rec, perc_receita:percReceita, atendimentos:a, vendas_realizadas:vr, conversao:conv, ticket_medio:ticket, obs:indEditForm.obs||"", data:indEditForm.data };
    await sb(`indicadores?id=eq.${editingInd.id}`, { method:"PATCH", body:JSON.stringify(payload) });
    setIndicadores(prev=>prev.map(i=>i.id===editingInd.id?{...i,...payload}:i));
    setEditingInd(null);
  };

  const deleteInd = async (ind) => {
    if(!window.confirm(`Excluir o lançamento de ${new Date(ind.data).toLocaleDateString("pt-BR")}?`)) return;
    await sb(`indicadores?id=eq.${ind.id}`, { method:"DELETE" });
    setIndicadores(prev=>prev.filter(i=>i.id!==ind.id));
  };

  const saveGerenteInd = async () => {
    const lojaId = uLojas[0]?.id;
    if(!lojaId) return;
    const entries = Object.entries(gerenteIndForm).filter(([k]) => k.match(/^\d+$/));
    const toSave = entries.map(([vendId, vals]) => {
      const a = parseInt(vals.atendimentos)||0; const vr = parseInt(vals.vendas_realizadas)||0; const v = parseFloat(vals.vendas)||0;
      return { vendedor_id:parseInt(vendId), vendedor_nome:vendedores.find(vd=>vd.id===parseInt(vendId))?.nome||"", loja_id:lojaId, loja_nome:uLojas[0]?.nome||"", usuario_id:user.id, gerente_nome:user.nome, data:gerenteIndDate, vendas:v, atendimentos:a, vendas_realizadas:vr, conversao:a>0?Math.round((vr/a)*100):0, ticket_medio:vr>0?Math.round(v/vr):0, obs:vals.obs||"" };
    }).filter(e => e.vendas>0||e.atendimentos>0);
    if(!toSave.length) return alert("Preencha os dados de pelo menos um vendedor.");
    const result = await sb("indicadores_vendedor", { method:"POST", body:JSON.stringify(toSave) });
    if(result) { setIndVendedor(prev=>[...(Array.isArray(result)?result:[result]),...prev]); setGerenteIndDone(true); setGerenteIndForm({}); }
  };

  const saveSettingsLoja = async () => {
    await sb(`lojas?id=eq.${settingsLoja.id}`, { method:"PATCH", body:JSON.stringify({ gerente:settingsLojaForm.gerente, meta_mensal:parseInt(settingsLojaForm.meta_mensal)||0 }) });
    setLojas(prev=>prev.map(l=>l.id===settingsLoja.id?{...l,...settingsLojaForm}:l));
    setMetas(prev=>({...prev,[settingsLoja.id]:parseInt(settingsLojaForm.meta_mensal)||0}));
    setSettingsLoja(null);
  };

  const addVendedor = async () => {
    if(!newVendedor.trim()) return;
    const result = await sb("vendedores", { method:"POST", body:JSON.stringify({ nome:newVendedor.trim(), loja_id:settingsLoja.id, loja_nome:settingsLoja.nome, ativo:true }) });
    if(result) { const v = Array.isArray(result)?result[0]:result; setVendedores(prev=>[...prev,v]); setNewVendedor(""); }
  };

  const toggleVendedor = async (v) => {
    await sb(`vendedores?id=eq.${v.id}`, { method:"PATCH", body:JSON.stringify({ ativo:!v.ativo }) });
    setVendedores(prev=>prev.map(vd=>vd.id===v.id?{...vd,ativo:!vd.ativo}:vd));
  };

  const deleteVisit = async () => {
    if(!window.confirm(`Excluir a visita de ${new Date(viewingVisit.data_visita).toLocaleDateString("pt-BR")} da loja ${viewingVisit.loja_nome}? Esta ação não pode ser desfeita.`)) return;
    await sb(`respostas_checklist?visita_id=eq.${viewingVisit.id}`, { method:"DELETE" });
    await sb(`visitas?id=eq.${viewingVisit.id}`, { method:"DELETE" });
    setVisitas(prev=>prev.filter(v=>v.id!==viewingVisit.id));
    setViewingVisit(null);
    setVisitAnswers([]);
  };

  const loadData = useCallback(async (currentUser) => {
    if(!currentUser) return;
    setLoading(true);
    try {
      const [lj, vis, ind, pend, du, vend, indV] = await Promise.all([
        sb("lojas?select=*&order=nome"),
        sb("visitas?select=*&order=data_visita.desc"),
        sb("indicadores?select=*&order=data.desc"),
        sb("pendencias?select=*&order=created_at.desc"),
        sb("dias_uteis?select=*"),
        sb("vendedores?select=*&order=nome"),
        sb("indicadores_vendedor?select=*&order=data.desc"),
      ]);
      if(lj) { setLojas(lj); setMetas(Object.fromEntries(lj.map(l=>[l.id, l.meta_mensal||0]))); }
      if(vis) setVisitas(vis);
      if(ind) setIndicadores(ind);
      if(pend) setPendencias(pend);
      if(du) { const duObj = {}; du.forEach(d => { duObj[d.ano_mes] = d.dias; }); setDiasUteisPorMes(prev=>({...prev,...duObj})); }
      if(vend) setVendedores(vend);
      if(indV) setIndVendedor(indV);
    } catch(e) { console.error("Erro ao carregar dados:", e); }
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const users = await sb(`usuarios?email=eq.${encodeURIComponent(email)}&senha=eq.${encodeURIComponent(pass)}&select=*`);
    setLoading(false);
    if(users && users.length > 0) {
      const u = users[0];
      setUser(u);
      setPage(u.role==="manutencao" ? "pendencias" : u.role==="gerente" ? "gerente_ind" : "dashboard");
      setLoginErr("");
      loadData(u);
    } else {
      setLoginErr("E-mail ou senha incorretos");
    }
  };

  const handleSaveInd = async () => {
    const v=parseFloat(indForm.vendas)||0; const rec=parseFloat(indForm.receita)||0;
    const a=parseInt(indForm.atendimentos)||0; const vr=parseInt(indForm.vendas_realizadas)||0;
    const conv=a>0?Math.round((vr/a)*100):0; const ticket=vr>0?Math.round(v/vr):0;
    const percReceita=v>0?Math.round((rec/v)*100):0;
    const metaDia=Math.round((metas[indLoja.id]||indLoja.meta_mensal||0)/diasUteis);
    const dataLancamento=indForm.data||today;
    const payload = { loja_id:indLoja.id, loja_nome:indLoja.nome, usuario_id:user.id, supervisor_nome:user.nome, data:dataLancamento, vendas:v, receita:rec, perc_receita:percReceita, meta_dia:metaDia, atendimentos:a, vendas_realizadas:vr, conversao:conv, ticket_medio:ticket, obs:indForm.obs||"" };
    const result = await sb("indicadores", { method:"POST", body:JSON.stringify(payload) });
    if(result) { setIndicadores(prev=>[...(Array.isArray(result)?result:[result]), ...prev]); setIndDone(true); }
    else alert("Erro ao salvar indicadores. Tente novamente.");
  };

  const handleSaveVisit = async () => {
    try {
    const score=calcScore(); const status=score>=85?"verde":score>=70?"amarelo":"vermelho";
    const a=parseInt(vForm.atendimentos)||0; const vr=parseInt(vForm.vendas_realizadas)||0;
    const conv=a>0?Math.round((vr/a)*100):0; const ticket=vr>0?Math.round((parseFloat(vForm.vendas)||0)/vr):0;
    const visitPayload = { loja_id:clLoja.id, loja_nome:clLoja.nome, usuario_id:user.id, supervisor_nome:user.nome, data_visita:vForm.data||getToday(), tipo_visita:vForm.type, gerente_presente:vForm.gerente, vendas:parseFloat(vForm.vendas)||0, atendimentos:a, vendas_realizadas:vr, conversao:conv, ticket_medio:ticket, obs_geral:vForm.obs||"", nota_final:score, status_loja:status };
    const visitResult = await sb("visitas", { method:"POST", body:JSON.stringify(visitPayload) });
    if(!visitResult) { alert("Erro ao salvar visita."); return; }
    const newVisit = Array.isArray(visitResult) ? visitResult[0] : visitResult;
    setVisitas(prev=>[newVisit, ...prev]);
    // Save checklist answers
    const respostas = CHECKLIST_CATS.flatMap(cat=>cat.items.map((item,idx)=>answers[`${cat.id}_${idx}`]?{ visita_id:newVisit.id, categoria_id:cat.id, categoria_nome:cat.name, item_idx:idx, item_texto:item, resposta:answers[`${cat.id}_${idx}`], observacao:answers[`${cat.id}_${idx}_obs`]||null }:null).filter(Boolean));
    if(respostas.length) await sb("respostas_checklist", { method:"POST", body:JSON.stringify(respostas) });
    // Save pendencias
    const np = CHECKLIST_CATS.flatMap(cat=>cat.items.map((item,idx)=>answers[`${cat.id}_${idx}`]==="nao"?{ visita_id:newVisit.id, loja_id:clLoja.id, loja_nome:clLoja.nome, supervisor_nome:user.nome, categoria:cat.name, problema:item, responsavel:clLoja.gerente||"", prazo:answers[`${cat.id}_${idx}_prazo`]||null, prioridade:answers[`${cat.id}_${idx}_pri`]||"alta", status:"pendente", obs_responsavel:answers[`${cat.id}_${idx}_obs`]||"", tipo:answers[`${cat.id}_${idx}_tipo`]||"processo" }:null).filter(Boolean));
    if(np.length) { const pendResult = await sb("pendencias", { method:"POST", body:JSON.stringify(np) }); if(pendResult) setPendencias(prev=>[...(Array.isArray(pendResult)?pendResult:[pendResult]),...prev]); }
    setClDone(true);
    } catch(err) { console.error("Erro ao salvar visita:", err); alert("Erro ao salvar: " + err.message); }
  };

  const reset = () => { setSelStore(null); setClDone(false); setAnswers({}); setClStep(0); setClLoja(null); setVForm({data:getToday(),vendas:"",atendimentos:"",vendas_realizadas:"",type:"Rotina",gerente:"Sim",obs:""}); setIndDone(false); setIndLoja(null); setIndForm({data:getToday(),vendas:"",receita:"",atendimentos:"",vendas_realizadas:"",obs:""}); };

  const S = {
    app:{minHeight:"100vh",background:"#0a0a0a",color:"#f5f5f5",fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:120},
    hdr:{background:"#111",borderBottom:"2px solid #f5c518",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:100},
    nav:{position:"fixed",bottom:0,left:0,right:0,background:"#0f0f0f",borderTop:"1px solid #1f1f1f",display:"flex",zIndex:100},
    nb:(a)=>({flex:1,padding:"6px 2px 8px",background:a?"#1a1200":"transparent",border:"none",color:a?"#f5c518":"#555",cursor:"pointer",fontSize:9,display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:a?"2px solid #f5c518":"2px solid transparent"}),
    card:{background:"#161616",border:"1px solid #222",borderRadius:12,padding:16,marginBottom:10},
    inp:{background:"#1a1a1a",border:"1px solid #333",borderRadius:8,padding:"10px 12px",color:"#f5f5f5",fontSize:14,width:"100%",outline:"none",marginBottom:10,boxSizing:"border-box"},
    sel:{background:"#1a1a1a",border:"1px solid #333",borderRadius:8,padding:"10px 12px",color:"#f5f5f5",fontSize:14,width:"100%",outline:"none",marginBottom:10,boxSizing:"border-box"},
    lbl:{fontSize:11,color:"#888",marginBottom:4,display:"block",textTransform:"uppercase",letterSpacing:0.5},
    bp:{background:"#f5c518",color:"#000",border:"none",borderRadius:8,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",width:"100%"},
    bdg:(c,bg)=>({display:"inline-block",padding:"3px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:c,background:bg}),
    sec:{padding:"0 14px"},
    ttl:{fontSize:17,fontWeight:700,color:"#f5f5f5",marginBottom:14,marginTop:18,letterSpacing:-0.5},
    fb:(a)=>({padding:"6px 12px",borderRadius:20,border:a?"1px solid #f5c518":"1px solid #333",background:a?"#1a1200":"#161616",color:a?"#f5c518":"#888",fontSize:12,cursor:"pointer"}),
  };

  const allNavItems = [{id:"dashboard",label:"Dashboard",icon:"📊"},{id:"indicadores",label:"Indicadores",icon:"📈"},{id:"ranking",label:"Ranking",icon:"🏆"},{id:"visita",label:"Visita",icon:"✅"},{id:"pendencias",label:"Pendências",icon:"⚠️"},{id:"lojas",label:"Lojas",icon:"🏪"}];
  const navItems = user?.role==="manutencao" ? [{id:"pendencias",label:"Pendências",icon:"⚠️"}] : user?.role==="gerente" ? [{id:"gerente_ind",label:"Indicadores",icon:"📈"}] : allNavItems;
  const FOOTER = <div style={{textAlign:"center",padding:"20px 0 8px",borderTop:"1px solid #1a1a1a",marginTop:16}}><div style={{fontSize:12,color:"#2a2a2a",fontWeight:700,letterSpacing:2}}>👓 AMIGÃO CHECK</div><div style={{fontSize:10,color:"#222",letterSpacing:1,marginTop:2}}>SUPERVISÃO OPERACIONAL · ÓTICAS AMIGÃO</div></div>;

  // ── LOGIN ─────────────────────────────────────────────────────
  if(page==="login") return(
    <div style={{...S.app,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:20,minHeight:"100vh"}}>
      <style>{`*{box-sizing:border-box}input::placeholder{color:#555}textarea::placeholder{color:#555}`}</style>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{background:"#f5c518",borderRadius:16,width:64,height:64,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px"}}>👓</div>
          <div style={{fontSize:28,fontWeight:900,color:"#f5c518",letterSpacing:-1}}>AMIGÃO CHECK</div>
          <div style={{fontSize:12,color:"#666",letterSpacing:2,textTransform:"uppercase",marginTop:4}}>Supervisão Operacional</div>
        </div>
        <div style={S.card}>
          <label style={S.lbl}>E-mail</label>
          <input style={S.inp} type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
          <label style={S.lbl}>Senha</label>
          <input style={S.inp} type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
          {loginErr&&<div style={{color:"#dc2626",fontSize:12,marginBottom:8,textAlign:"center"}}>{loginErr}</div>}
          <button style={{...S.bp,opacity:loading?0.7:1}} disabled={loading} onClick={handleLogin}>{loading?"Entrando...":"Entrar"}</button>
        </div>

      </div>
    </div>
  );

  // ── INDICADORES FORM ──────────────────────────────────────────
  if(page==="indicadores") {
    if(indDone) return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}><div style={{background:"#f5c518",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👓</div><div style={{fontSize:16,fontWeight:900,color:"#f5c518"}}>INDICADORES</div></div>
        <div style={{padding:16,textAlign:"center"}}>
          <div style={{fontSize:56,marginBottom:12}}>📈</div>
          <div style={{fontSize:22,fontWeight:900,color:"#f5c518"}}>Indicadores Salvos!</div>
          <div style={{fontSize:14,color:"#888",marginTop:8}}>Loja: <strong style={{color:"#f5f5f5"}}>{indLoja?.nome}</strong> · {new Date(indForm.data).toLocaleDateString("pt-BR")}</div>
          <div style={{...S.card,textAlign:"left",marginTop:20}}>
            {[["Data",new Date(indForm.data).toLocaleDateString("pt-BR"),"#888"],["Vendas",`R$ ${parseFloat(indForm.vendas).toLocaleString("pt-BR")}`,"#3b82f6"],["Receita",`R$ ${parseFloat(indForm.receita||0).toLocaleString("pt-BR")}`,"#16a34a"],["Receita / Vendas",`${parseFloat(indForm.vendas)>0?Math.round((parseFloat(indForm.receita||0)/parseFloat(indForm.vendas))*100):0}%`,"#f5c518"],["Atendimentos",indForm.atendimentos,"#f5c518"],["Vendas Realizadas",indForm.vendas_realizadas,"#16a34a"],["Conversão",`${parseInt(indForm.atendimentos)>0?Math.round((parseInt(indForm.vendas_realizadas)/parseInt(indForm.atendimentos))*100):0}%`,"#a855f7"],["Ticket Médio",`R$ ${parseInt(indForm.vendas_realizadas)>0?Math.round(parseFloat(indForm.vendas)/parseInt(indForm.vendas_realizadas)):0}`,"#f97316"]].map(([k,v,c])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1f1f1f"}}>
                <span style={{fontSize:13,color:"#888"}}>{k}</span>
                <span style={{fontSize:15,fontWeight:700,color:c}}>{v}</span>
              </div>
            ))}
          </div>
          <button style={S.bp} onClick={()=>{reset();setPage("indicadores");}}>Lançar Outro</button>
          <div style={{height:12}}/>
          <button style={{...S.bp,background:"#1a1a1a",color:"#f5f5f5"}} onClick={()=>{reset();setPage("dashboard");}}>Voltar ao Dashboard</button>
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(false)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );

    if(!indLoja) return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}><div style={{background:"#f5c518",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👓</div><div style={{fontSize:16,fontWeight:900,color:"#f5c518"}}>LANÇAR INDICADORES</div></div>
        <div style={{padding:16}}>
          <div style={S.ttl}>Selecione a Loja</div>
          {/* Filtro histórico */}
          <div style={{...S.card,padding:12,marginBottom:14}}>
            <div style={{fontSize:11,color:"#888",marginBottom:8}}>VER HISTÓRICO POR PERÍODO</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {[["hoje","Hoje"],["mes","Este mês"],["7","7 dias"],["30","30 dias"]].map(([v,l])=><button key={v} style={S.fb(indFilter===v)} onClick={()=>setIndFilter(v)}>{l}</button>)}
            </div>
            <select style={{...S.sel,marginBottom:0}} value={indFilterLoja} onChange={e=>setIndFilterLoja(e.target.value)}>
              <option value="todas">Todas as lojas</option>
              {uLojas.map(l=><option key={l.id} value={l.nome}>{l.nome}</option>)}
            </select>
          </div>
          {/* Lista de lojas para lançar */}
          <div style={S.ttl}>Nova Entrada</div>
          {uLojas.map(l=>{
            const { from, to } = getPeriod(indFilter,"","");
            const lojaInd = uInd.filter(i=>i.loja_id===l.id&&i.data>=from&&i.data<=to);
            const jaLancou = uInd.some(i=>i.loja_id===l.id&&i.data===today);
            return(
              <div key={l.id} onClick={()=>setIndLoja(l)} style={{...S.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderLeft:jaLancou?"3px solid #16a34a":"1px solid #222"}}>
                <div>
                  <div style={{fontWeight:700}}>{l.nome}</div>
                  <div style={{fontSize:11,color:"#666",marginTop:2}}>{l.gerente} · {lojaInd.length} lançamento{lojaInd.length!==1?"s":""} no período</div>
                </div>
                <div style={{textAlign:"right"}}>
                  {jaLancou?<span style={S.bdg("#16a34a","#052e16")}>✓ HOJE</span>:<span style={S.bdg("#f5c518","#1a1200")}>LANÇAR →</span>}
                </div>
              </div>
            );
          })}
          {FOOTER}
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(page===n.id)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );

    const metaDia = Math.round((metas[indLoja.id]||indLoja.meta_mensal)/diasUteis);
    const v=parseFloat(indForm.vendas)||0; const rec=parseFloat(indForm.receita)||0;
    const a=parseInt(indForm.atendimentos)||0; const vr=parseInt(indForm.vendas_realizadas)||0;
    const conv=a>0?Math.round((vr/a)*100):0; const ticket=vr>0?Math.round(v/vr):0;
    const percMeta=metaDia>0?Math.round((v/metaDia)*100):0;
    const percReceita=v>0?Math.round((rec/v)*100):0;
    return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}><button onClick={()=>setIndLoja(null)} style={{background:"none",border:"none",color:"#f5c518",cursor:"pointer",fontSize:20,padding:0}}>←</button><div style={{fontSize:14,fontWeight:700,color:"#f5c518"}}>Indicadores · {indLoja.nome}</div></div>
        <div style={{padding:16}}>
          <div style={{...S.card,background:"#0f0f0f",padding:12,marginBottom:4}}>
            <div style={{fontSize:11,color:"#888"}}>Meta do dia (calculada automaticamente)</div>
            <div style={{fontSize:20,fontWeight:900,color:"#f5c518",marginTop:4}}>R$ {metaDia.toLocaleString("pt-BR")}</div>
            <div style={{fontSize:11,color:"#555"}}>Meta mensal R$ {(metas[indLoja.id]||indLoja.meta_mensal).toLocaleString("pt-BR")} ÷ {diasUteis} dias úteis</div>
          </div>
          <div style={S.card}>
            <label style={S.lbl}>Data de Referência</label>
            <input style={{...S.inp,colorScheme:"dark"}} type="date" value={indForm.data} onChange={e=>setIndForm({...indForm,data:e.target.value})} />
            <label style={S.lbl}>Vendas do Dia (R$)</label>
            <input style={S.inp} type="number" onWheel={e=>e.target.blur()} placeholder="Valor total das vendas" value={indForm.vendas} onChange={e=>setIndForm({...indForm,vendas:e.target.value})} />
            <label style={S.lbl}>Receita do Dia (R$)</label>
            <input style={S.inp} type="number" onWheel={e=>e.target.blur()} placeholder="Valor efetivamente recebido" value={indForm.receita} onChange={e=>setIndForm({...indForm,receita:e.target.value})} />
            <label style={S.lbl}>Atendimentos</label>
            <input style={S.inp} type="number" onWheel={e=>e.target.blur()} placeholder="Qtd de clientes atendidos" value={indForm.atendimentos} onChange={e=>setIndForm({...indForm,atendimentos:e.target.value})} />
            <label style={S.lbl}>Vendas Realizadas</label>
            <input style={S.inp} type="number" onWheel={e=>e.target.blur()} placeholder="Qtd de vendas fechadas" value={indForm.vendas_realizadas} onChange={e=>setIndForm({...indForm,vendas_realizadas:e.target.value})} />
            <label style={S.lbl}>Observações</label>
            <textarea style={{...S.inp,height:60,resize:"none",marginBottom:0}} placeholder="Alguma observação do dia..." value={indForm.obs} onChange={e=>setIndForm({...indForm,obs:e.target.value})} />
          </div>
          {/* Auto-calculated indicators */}
          {(v>0||a>0)&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {[
                {label:"% META",value:`${percMeta}%`,color:percMeta>=100?"#16a34a":"#dc2626"},
                {label:"RECEITA/VENDAS",value:`${percReceita}%`,color:percReceita>=90?"#16a34a":percReceita>=70?"#d97706":"#dc2626",show:rec>0},
                {label:"CONVERSÃO",value:`${conv}% (${vr}v)`,color:conv>=70?"#16a34a":conv>=50?"#d97706":"#dc2626"},
                {label:"TICKET MÉDIO",value:`R$ ${ticket}`,color:"#a855f7"},
              ].filter(x=>x.show!==false).map(({label,value,color})=>(
                <div key={label} style={{background:"#0f0f0f",borderRadius:10,padding:12,textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,color}}>{value}</div>
                  <div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>
          )}
          <button style={{...S.bp,opacity:v>0&&a>0&&vr>0?1:0.5}} disabled={!(v>0&&a>0&&vr>0)} onClick={handleSaveInd}>Salvar Indicadores ✓</button>
          {/* Recent history for this store */}
          {uInd.filter(i=>i.loja_id===indLoja.id).slice(0,5).length>0&&(
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#888",marginTop:20,marginBottom:8}}>ÚLTIMAS ENTRADAS</div>
              {uInd.filter(i=>i.loja_id===indLoja.id).slice(0,5).map(i=>(
                <div key={i.id} style={{...S.card,padding:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:700}}>{new Date(i.data).toLocaleDateString("pt-BR")}</div>
                    <span style={S.bdg(i.perc_meta>=100||i.vendas>=i.meta_dia?"#16a34a":"#dc2626",i.vendas>=i.meta_dia?"#052e16":"#1c0000")}>{Math.round((i.vendas/(i.meta_dia||1))*100)}% meta</span>
                  </div>
                  <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                    <div><div style={{fontSize:10,color:"#666"}}>VENDAS</div><div style={{fontSize:12,fontWeight:700,color:"#3b82f6"}}>R$ {i.vendas.toLocaleString("pt-BR")}</div></div>
                    {i.receita>0&&<div><div style={{fontSize:10,color:"#666"}}>RECEITA</div><div style={{fontSize:12,fontWeight:700,color:"#16a34a"}}>R$ {i.receita.toLocaleString("pt-BR")} <span style={{fontSize:10,color:i.receita/i.vendas>=0.9?"#16a34a":"#d97706"}}>({Math.round((i.receita/i.vendas)*100)}%)</span></div></div>}
                    <div><div style={{fontSize:10,color:"#666"}}>ATEND.</div><div style={{fontSize:12,fontWeight:700}}>{i.atendimentos}</div></div>
                    <div><div style={{fontSize:10,color:"#666"}}>CONV.</div><div style={{fontSize:12,fontWeight:700,color:"#a855f7"}}>{i.conversao}% <span style={{fontSize:10,color:"#888"}}>({i.vendas_realizadas}v)</span></div></div>
                    <div><div style={{fontSize:10,color:"#666"}}>TICKET</div><div style={{fontSize:12,fontWeight:700}}>R$ {i.ticket_medio}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(page===n.id)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
  }

  // ── CHECKLIST/VISITA ──────────────────────────────────────────
  if(page==="visita") {
    if(clDone) return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}><div style={{background:"#f5c518",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👓</div><div style={{fontSize:16,fontWeight:900,color:"#f5c518"}}>VISITA REGISTRADA</div></div>
        <div style={{padding:16,textAlign:"center"}}>
          <div style={{fontSize:56,marginBottom:12}}>✅</div>
          <div style={{fontSize:22,fontWeight:900,color:"#f5c518"}}>Visita Registrada!</div>
          <div style={{fontSize:14,color:"#888",marginTop:8}}>Loja: <strong style={{color:"#f5f5f5"}}>{clLoja?.nome}</strong></div>
          <div style={{fontSize:52,fontWeight:900,color:sc(calcScore()),marginTop:12}}>{calcScore()}</div>
          <div style={{fontSize:14,color:sc(calcScore())}}>{sl(calcScore())}</div>
          <div style={{background:"#161616",borderRadius:8,height:8,marginTop:12,overflow:"hidden"}}><div style={{height:"100%",width:`${calcScore()}%`,background:sc(calcScore()),borderRadius:8}}/></div>
          <div style={{...S.card,textAlign:"left",marginTop:20}}>
            {CHECKLIST_CATS.map(cat=>{const ca=cat.items.map((_,i)=>answers[`${cat.id}_${i}`]).filter(a=>a&&a!=="na");const pts=ca.reduce((a,v)=>a+(v==="ok"?1:v==="parcial"?0.5:0),0);const cs=ca.length?Math.round((pts/ca.length)*100):null;return<div key={cat.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1f1f1f"}}><span style={{fontSize:13}}>{cat.icon} {cat.name}</span>{cs!==null?<span style={{fontWeight:700,color:sc(cs)}}>{cs}</span>:<span style={{color:"#444"}}>—</span>}</div>;})}
          </div>
          <button style={S.bp} onClick={()=>{reset();setPage("dashboard");}}>Voltar ao Dashboard</button>
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(false)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
    if(!clLoja) return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}><div style={{background:"#f5c518",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👓</div><div style={{fontSize:16,fontWeight:900,color:"#f5c518"}}>NOVA VISITA</div></div>
        <div style={{padding:16}}>
          <div style={S.ttl}>Selecione a Loja</div>
          {uLojas.map(l=><div key={l.id} onClick={()=>{setClLoja(l);setClStep(0);}} style={{...S.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700}}>{l.nome}</div><div style={{fontSize:12,color:"#666"}}>{l.cidade} · {l.gerente}</div></div><div style={{fontSize:20,color:"#f5c518"}}>→</div></div>)}
          {FOOTER}
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(page===n.id)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
    if(clStep===0) return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}><button onClick={()=>setClLoja(null)} style={{background:"none",border:"none",color:"#f5c518",cursor:"pointer",fontSize:20,padding:0}}>←</button><div style={{fontSize:14,fontWeight:700,color:"#f5c518"}}>Visita · {clLoja.nome}</div></div>
        <div style={{padding:16}}>
          <div style={S.ttl}>Dados da Visita</div>
          <div style={S.card}>
            <label style={S.lbl}>Data da Visita</label>
            <input style={{...S.inp,colorScheme:"dark"}} type="date" value={vForm.data} onChange={e=>setVForm({...vForm,data:e.target.value})} />
            <label style={S.lbl}>Tipo de Visita</label>
            <select style={S.sel} value={vForm.type} onChange={e=>setVForm({...vForm,type:e.target.value})}>
              {["Rotina","Auditoria","Problema","Reforço Comercial"].map(t=><option key={t}>{t}</option>)}
            </select>
            <label style={S.lbl}>Gerente Presente?</label>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {["Sim","Não"].map(v=><button key={v} onClick={()=>setVForm({...vForm,gerente:v})} style={{flex:1,padding:10,borderRadius:8,border:vForm.gerente===v?"2px solid #f5c518":"1px solid #333",background:vForm.gerente===v?"#1a1200":"#111",color:vForm.gerente===v?"#f5c518":"#888",cursor:"pointer",fontWeight:700}}>{v}</button>)}
            </div>
            <label style={S.lbl}>Vendas do Dia (R$)</label>
            <input style={S.inp} type="number" onWheel={e=>e.target.blur()} placeholder="Ex: 3500" value={vForm.vendas} onChange={e=>setVForm({...vForm,vendas:e.target.value})} />
            <label style={S.lbl}>Atendimentos</label>
            <input style={S.inp} type="number" onWheel={e=>e.target.blur()} placeholder="Qtd de clientes atendidos" value={vForm.atendimentos} onChange={e=>setVForm({...vForm,atendimentos:e.target.value})} />
            <label style={S.lbl}>Vendas Realizadas</label>
            <input style={S.inp} type="number" onWheel={e=>e.target.blur()} placeholder="Qtd de vendas fechadas" value={vForm.vendas_realizadas} onChange={e=>setVForm({...vForm,vendas_realizadas:e.target.value})} />
            <label style={S.lbl}>Observações</label>
            <textarea style={{...S.inp,height:60,resize:"none",marginBottom:0}} placeholder="Observações gerais da visita..." value={vForm.obs} onChange={e=>setVForm({...vForm,obs:e.target.value})} />
            {vForm.atendimentos&&vForm.vendas_realizadas&&(
              <div style={{background:"#0a0a0a",borderRadius:8,padding:12,marginTop:10,display:"flex",gap:16}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#666"}}>CONVERSÃO</div><div style={{fontSize:20,fontWeight:900,color:"#a855f7"}}>{Math.round((parseInt(vForm.vendas_realizadas)/parseInt(vForm.atendimentos))*100)}%</div><div style={{fontSize:11,color:"#888"}}>{parseInt(vForm.vendas_realizadas)} vendas</div></div>
                {vForm.vendas&&<div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#666"}}>TICKET</div><div style={{fontSize:20,fontWeight:900,color:"#16a34a"}}>R$ {Math.round(parseFloat(vForm.vendas)/parseInt(vForm.vendas_realizadas))}</div></div>}
              </div>
            )}
          </div>
          <button style={S.bp} onClick={()=>setClStep(1)}>Iniciar Checklist →</button>
          {FOOTER}
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(page===n.id)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
    const cat=CHECKLIST_CATS[clStep-1];
    return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}>
          <button onClick={()=>clStep>1?setClStep(s=>s-1):setClStep(0)} style={{background:"none",border:"none",color:"#f5c518",cursor:"pointer",fontSize:20,padding:0}}>←</button>
          <div style={{flex:1}}><div style={{fontSize:12,color:"#888"}}>{clLoja.nome} · {clStep}/{CHECKLIST_CATS.length}</div><div style={{fontSize:14,fontWeight:700}}>{cat.icon} {cat.name}</div></div>
          <div style={{fontSize:22,fontWeight:900,color:sc(calcScore())}}>{calcScore()}</div>
        </div>
        <div style={{background:"#111",height:4}}><div style={{height:"100%",width:`${(clStep/CHECKLIST_CATS.length)*100}%`,background:"#f5c518",transition:"width 0.3s"}}/></div>
        <div style={{padding:"12px 14px"}}>
          {cat.items.map((item,idx)=>{
            const key=`${cat.id}_${idx}`;const ans=answers[key];
            return(
              <div key={idx} style={{...S.card,borderLeft:`3px solid ${ans==="nao"?"#dc2626":ans==="parcial"?"#d97706":ans==="ok"?"#16a34a":"#222"}`}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10,lineHeight:1.4}}>{item}</div>
                <div style={{display:"flex",gap:6}}>
                  {[["ok","✅ OK","#16a34a","#052e16"],["parcial","⚡ Parcial","#d97706","#1c1200"],["nao","❌ Não OK","#dc2626","#1c0000"],["na","N/A","#555","#111"]].map(([val,label,color,bg])=>(
                    <button key={val} onClick={()=>setAnswers({...answers,[key]:val})} style={{flex:1,padding:"8px 4px",borderRadius:6,border:ans===val?`2px solid ${color}`:"1px solid #2a2a2a",background:ans===val?bg:"#0d0d0d",color:ans===val?color:"#555",cursor:"pointer",fontSize:11,fontWeight:700}}>{label}</button>
                  ))}
                </div>
                {ans==="nao"&&<div style={{marginTop:8}}>
                  <input style={{...S.inp,fontSize:12,marginBottom:6}} placeholder="📝 Descreva o problema..." onChange={e=>setAnswers({...answers,[`${key}_obs`]:e.target.value})}/>
                  <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                    {[["baixa","#6b7280"],["media","#d97706"],["alta","#f97316"],["critica","#dc2626"]].map(([v,c])=>(
                      <button key={v} onClick={()=>setAnswers({...answers,[`${key}_pri`]:v})} style={{padding:"4px 10px",borderRadius:20,border:answers[`${key}_pri`]===v?`2px solid ${c}`:`1px solid #333`,background:answers[`${key}_pri`]===v?`${c}22`:"#0d0d0d",color:answers[`${key}_pri`]===v?c:"#555",cursor:"pointer",fontSize:11,fontWeight:700,textTransform:"capitalize"}}>{v}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    {[["processo","🏪 Processo"],["manutencao","🔧 Manutenção"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setAnswers({...answers,[`${key}_tipo`]:v})} style={{flex:1,padding:"6px 8px",borderRadius:8,border:answers[`${key}_tipo`]===v?"1px solid #f5c518":"1px solid #333",background:answers[`${key}_tipo`]===v?"#1a1200":"#0d0d0d",color:answers[`${key}_tipo`]===v?"#f5c518":"#555",cursor:"pointer",fontSize:11,fontWeight:700}}>{l}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#666",whiteSpace:"nowrap"}}>Prazo:</span>
                    <input type="date" style={{...S.inp,marginBottom:0,fontSize:12,colorScheme:"dark",flex:1}} onChange={e=>setAnswers({...answers,[`${key}_prazo`]:e.target.value})}/>
                  </div>
                  <div style={{fontSize:11,color:"#888"}}>📷 Foto de evidência (opcional)</div>
                  <input type="file" accept="image/*" capture="environment" style={{marginTop:4,fontSize:11,color:"#888",width:"100%"}}/>
                </div>}
              </div>
            );
          })}
          {clStep<CHECKLIST_CATS.length?<button style={S.bp} onClick={()=>setClStep(s=>s+1)}>Próxima Categoria →</button>:<button style={S.bp} onClick={handleSaveVisit}>Finalizar e Salvar ✓</button>}
          {FOOTER}
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(page===n.id)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
  }

  // ── MAIN PAGES ────────────────────────────────────────────────
  // ── GERENTE PAGE ─────────────────────────────────────────────
  if(page==="gerente_ind") {
    const lojaGerente = uLojas[0];
    const lojaVendedores = vendedores.filter(v=>v.loja_id===lojaGerente?.id&&v.ativo);
    const jaLancou = lojaVendedores.some(v=>uIndV.some(i=>i.vendedor_id===v.id&&i.data===gerenteIndDate));
    return(
      <div style={S.app}>
        <style>{`*{box-sizing:border-box}`}</style>
        <div style={S.hdr}>
          <div style={{background:"#f5c518",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👓</div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:900,color:"#f5c518"}}>INDICADORES</div><div style={{fontSize:10,color:"#666"}}>{lojaGerente?.nome||""} · {user?.nome}</div></div>
          <button onClick={()=>{setUser(null);setPage("login");}} style={{background:"#1a1a1a",border:"1px solid #333",borderRadius:20,padding:"4px 8px",color:"#888",fontSize:11,cursor:"pointer"}}>Sair</button>
        </div>

        <div style={{padding:16}}>
          {gerenteIndDone&&(
            <div style={{...S.card,background:"#052e16",border:"1px solid #16a34a",textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:24,marginBottom:4}}>✅</div>
              <div style={{fontSize:15,fontWeight:700,color:"#16a34a"}}>Indicadores salvos!</div>
              <button style={{...S.bp,marginTop:10,background:"#1a1a1a",color:"#f5c518",border:"1px solid #f5c518"}} onClick={()=>{setGerenteIndDone(false);setGerenteIndDate(getToday());}}>Lançar Outro Dia</button>
            </div>
          )}

          <div style={S.card}>
            <label style={S.lbl}>Data de Referência</label>
            <input style={{...S.inp,colorScheme:"dark"}} type="date" value={gerenteIndDate} onChange={e=>setGerenteIndDate(e.target.value)} />
          </div>

          {lojaVendedores.length===0&&(
            <div style={{...S.card,textAlign:"center",color:"#666",padding:24}}>Nenhum vendedor cadastrado. Solicite ao diretor que cadastre os vendedores.</div>
          )}

          {lojaVendedores.map(v=>{
            const form = gerenteIndForm[v.id]||{};
            const a=parseInt(form.atendimentos)||0; const vr=parseInt(form.vendas_realizadas)||0; const venda=parseFloat(form.vendas)||0;
            const conv=a>0?Math.round((vr/a)*100):0; const ticket=vr>0?Math.round(venda/vr):0;
            return(
              <div key={v.id} style={{...S.card,marginBottom:10}}>
                <div style={{fontSize:15,fontWeight:700,color:"#f5c518",marginBottom:12}}>👤 {v.nome}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div>
                    <label style={S.lbl}>Vendas (R$)</label>
                    <input style={{...S.inp,marginBottom:0}} type="number" onWheel={e=>e.target.blur()} placeholder="0" value={form.vendas||""} onChange={e=>setGerenteIndForm(prev=>({...prev,[v.id]:{...form,vendas:e.target.value}}))} />
                  </div>
                  <div>
                    <label style={S.lbl}>Atendimentos</label>
                    <input style={{...S.inp,marginBottom:0}} type="number" onWheel={e=>e.target.blur()} placeholder="0" value={form.atendimentos||""} onChange={e=>setGerenteIndForm(prev=>({...prev,[v.id]:{...form,atendimentos:e.target.value}}))} />
                  </div>
                  <div>
                    <label style={S.lbl}>Vendas Realizadas</label>
                    <input style={{...S.inp,marginBottom:0}} type="number" onWheel={e=>e.target.blur()} placeholder="0" value={form.vendas_realizadas||""} onChange={e=>setGerenteIndForm(prev=>({...prev,[v.id]:{...form,vendas_realizadas:e.target.value}}))} />
                  </div>
                  <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                    {(venda>0||a>0)&&(
                      <div style={{background:"#0a0a0a",borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                        <div style={{fontSize:15,fontWeight:900,color:"#a855f7"}}>{conv}%</div>
                        <div style={{fontSize:9,color:"#666"}}>CONVERSÃO</div>
                        <div style={{fontSize:13,fontWeight:700,color:"#16a34a",marginTop:2}}>R$ {ticket}</div>
                        <div style={{fontSize:9,color:"#666"}}>TICKET</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {lojaVendedores.length>0&&!gerenteIndDone&&(
            <button style={S.bp} onClick={saveGerenteInd}>Salvar Indicadores ✓</button>
          )}

          {/* Histórico recente */}
          {uIndV.filter(i=>i.data===gerenteIndDate).length>0&&(
            <div style={{marginTop:16}}>
              <div style={{fontSize:14,fontWeight:700,color:"#888",marginBottom:8}}>JÁ LANÇADO HOJE</div>
              {uIndV.filter(i=>i.loja_id===lojaGerente?.id&&i.data===gerenteIndDate).map(i=>(
                <div key={i.id} style={{...S.card,padding:12,display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontSize:13,fontWeight:700}}>{i.vendedor_nome}</div>
                  <div style={{display:"flex",gap:12,fontSize:11}}>
                    <span style={{color:"#3b82f6"}}>R$ {i.vendas}</span>
                    <span style={{color:"#a855f7"}}>{i.conversao}%</span>
                    <span style={{color:"#16a34a"}}>R$ {i.ticket_medio}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {FOOTER}
        </div>
        <nav style={S.nav}>{navItems.map(n=><button key={n.id} style={S.nb(true)}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}</nav>
      </div>
    );
  }

  const avgNota = uVisitas.length?Math.round(uVisitas.reduce((a,b)=>a+(b.nota_final||0),0)/uVisitas.length):0;

  // Dashboard chart data
  const filtV = dashLoja==="todas"?uInd:uInd.filter(i=>i.loja_nome===dashLoja);
  const mn6 = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const dashPeriodRange = getPeriod(dashPeriod, dashFrom, dashTo);

  // Helper: calcula meta total do período para uma loja
  const calcMetaTotal = (lojaId, from, to, days, period) => {
    const metaMensal = metas[lojaId] || lojas.find(l=>l.id===lojaId)?.meta_mensal || 0;
    if(period==="mes") return metaMensal;
    if(period==="6m") return metaMensal * 6;
    // Para períodos em dias (7, 30) ou custom: proporcional por dias úteis
    const fromDate = new Date(from); const toDate = new Date(to);
    let total = 0;
    const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    while(cur <= toDate) {
      const monthStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const monthEnd = new Date(cur.getFullYear(), cur.getMonth()+1, 0);
      const isFullMonth = fromDate <= monthStart && monthEnd <= toDate;
      if(isFullMonth) {
        total += metaMensal;
      } else {
        const actualStart = monthStart < fromDate ? fromDate : monthStart;
        const actualEnd = monthEnd > toDate ? toDate : monthEnd;
        const daysInPeriod = Math.round((actualEnd - actualStart) / 86400000) + 1;
        const du = getDiasUteis(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}`);
        total += Math.round((metaMensal / du) * daysInPeriod);
      }
      cur.setMonth(cur.getMonth() + 1);
    }
    return total;
  };

  // Single store → line chart por mês, totais acumulados no mês
  const singleStoreData = (() => {
    if(dashLoja==="todas") return null;
    const {from, to} = dashPeriodRange;
    const lojaObj = uLojas.find(l=>l.nome===dashLoja);
    const fromDate = new Date(from); const toDate = new Date(to);
    const months = [];
    const cur = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    while(cur <= toDate && months.length < 6) {
      months.push({ m: cur.getMonth(), y: cur.getFullYear(), name: mn6[cur.getMonth()] });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months.map(({m, y, name}) => {
      const ym = `${y}-${String(m+1).padStart(2,"0")}`;
      const mFrom = new Date(y,m,1).toISOString().split("T")[0];
      const mTo = new Date(y,m+1,0).toISOString().split("T")[0];
      const periodFrom = mFrom < from ? from : mFrom;
      const periodTo = mTo > to ? to : mTo;
      const mi = filtV.filter(i=>i.data>=periodFrom&&i.data<=periodTo);
      const lv = uVisitas.filter(v=>{ const d=new Date(v.data_visita); return d.getMonth()===m&&d.getFullYear()===y&&v.loja_nome===dashLoja; });
      if(!mi.length && !lv.length) return { name, meta:null, conversao:null, ticket:null, nota:null };
      const totalV = mi.reduce((a,i)=>a+i.vendas,0);
      const totalVR = mi.reduce((a,i)=>a+i.vendas_realizadas,0);
      const totalAt = mi.reduce((a,i)=>a+i.atendimentos,0);
      const metaMensal = metas[lojaObj?.id] || lojaObj?.meta_mensal || 0;
      const du = getDiasUteis(ym);
      const daysInPeriod = Math.round((new Date(periodTo)-new Date(periodFrom))/86400000)+1;
      // Mês completo = meta mensal inteira; mês parcial = proporcional
      const isFullMonth = periodFrom===mFrom && periodTo===mTo;
      const metaMes = isFullMonth || dashPeriod==="6m" ? metaMensal : Math.round((metaMensal/du)*daysInPeriod);
      const percMeta = metaMes>0 ? Math.round((totalV/metaMes)*100) : 0;
      const conv = totalAt>0 ? Math.round((totalVR/totalAt)*100) : 0;
      const ticket = totalVR>0 ? Math.round(totalV/totalVR) : 0;
      const avgNota = lv.length ? Math.round(lv.reduce((a,v)=>a+v.nota_final,0)/lv.length) : null;
      return { name, meta:mi.length?percMeta:null, conversao:mi.length?conv:null, ticket:mi.length?ticket:null, nota:avgNota, totalVR:mi.length?totalVR:null, totalAt:mi.length?totalAt:null };
    });
  })();

  // All stores → bar chart, totais acumulados no período
  const chartData = (() => {
    const {from, to, days} = dashPeriodRange;
    const periodInd = uInd.filter(i=>i.data>=from&&i.data<=to);
    return uLojas.map(l => {
      const li = periodInd.filter(i=>i.loja_id===l.id);
      if(!li.length) return null;
      const totalV = li.reduce((a,i)=>a+i.vendas,0);
      const totalVR = li.reduce((a,i)=>a+i.vendas_realizadas,0);
      const totalAt = li.reduce((a,i)=>a+i.atendimentos,0);
      const metaTotal = calcMetaTotal(l.id, from, to, days, dashPeriod);
      const percMeta = metaTotal>0 ? Math.round((totalV/metaTotal)*100) : 0;
      const conv = totalAt>0 ? Math.round((totalVR/totalAt)*100) : 0;
      const ticket = totalVR>0 ? Math.round(totalV/totalVR) : 0;
      const lv = uVisitas.filter(v=>v.loja_id===l.id);
      const avgNota = lv.length ? Math.round(lv.reduce((a,v)=>a+v.nota_final,0)/lv.length) : 0;
      return { name:l.nome.split(" ")[0], meta:percMeta, conversao:conv, ticket, nota:avgNota, vendas:totalV, metaTotal, totalVR, totalAt };
    }).filter(Boolean);
  })();
  const ck=dashChart==="meta"?"meta":dashChart==="conversao"?"conversao":dashChart==="ticket"?"ticket":"nota";
  const cl=dashChart==="meta"?"% Meta":dashChart==="conversao"?"Conversão":dashChart==="ticket"?"Ticket Médio":"Nota Supervisão";
  const cc=dashChart==="meta"?"#3b82f6":dashChart==="conversao"?"#a855f7":dashChart==="ticket"?"#16a34a":"#f5c518";

  return(
    <div style={S.app}>
      {loading&&<div style={{position:'fixed',top:0,left:0,right:0,zIndex:999,background:'#f5c518',height:3,animation:'none'}}><div style={{height:'100%',width:'60%',background:'#000',borderRadius:2}}/></div>}
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#333}`}</style>

      {/* SETTINGS MODAL */}
      {showSettings&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#000000cc",zIndex:200,display:"flex",alignItems:"flex-end"}}>
          <div style={{background:"#111",borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"90vh",overflow:"auto",padding:20}}>

            {/* Store detail view */}
            {settingsLoja ? (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <button onClick={()=>setSettingsLoja(null)} style={{background:"none",border:"none",color:"#f5c518",cursor:"pointer",fontSize:13,padding:0,marginBottom:4}}>← Voltar</button>
                    <div style={{fontSize:16,fontWeight:700,color:"#f5c518"}}>🏪 {settingsLoja.nome}</div>
                  </div>
                  <button onClick={()=>setShowSettings(false)} style={{background:"#222",border:"none",color:"#888",fontSize:18,cursor:"pointer",borderRadius:20,width:32,height:32}}>✕</button>
                </div>

                {/* Gerente and meta */}
                <div style={{background:"#0a0a0a",borderRadius:12,padding:14,marginBottom:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f5c518",marginBottom:12}}>📋 Dados da Loja</div>
                  <label style={S.lbl}>Nome do Gerente</label>
                  <input style={S.inp} placeholder="Nome do gerente" value={settingsLojaForm.gerente||""} onChange={e=>setSettingsLojaForm({...settingsLojaForm,gerente:e.target.value})} />
                  <label style={S.lbl}>Meta Mensal (R$)</label>
                  <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={settingsLojaForm.meta_mensal||0} onChange={e=>setSettingsLojaForm({...settingsLojaForm,meta_mensal:e.target.value})} />
                  <div style={{fontSize:11,color:"#666",marginBottom:8}}>Meta diária: R$ {Math.round((parseInt(settingsLojaForm.meta_mensal)||0)/diasUteis).toLocaleString("pt-BR")}</div>
                  <button style={S.bp} onClick={saveSettingsLoja}>Salvar Dados ✓</button>
                </div>

                {/* Vendedores */}
                <div style={{background:"#0a0a0a",borderRadius:12,padding:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f5c518",marginBottom:12}}>👥 Vendedores</div>
                  {vendedores.filter(v=>v.loja_id===settingsLoja.id).map(v=>(
                    <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1a1a1a"}}>
                      <div style={{fontSize:14,color:v.ativo?"#f5f5f5":"#555",fontWeight:v.ativo?600:400}}>{v.nome}</div>
                      <button onClick={()=>toggleVendedor(v)} style={{background:v.ativo?"#052e16":"#1a1a1a",border:`1px solid ${v.ativo?"#16a34a":"#333"}`,borderRadius:20,padding:"4px 12px",color:v.ativo?"#16a34a":"#666",fontSize:11,cursor:"pointer",fontWeight:700}}>
                        {v.ativo?"✓ Ativo":"Inativo"}
                      </button>
                    </div>
                  ))}
                  {vendedores.filter(v=>v.loja_id===settingsLoja.id).length===0&&(
                    <div style={{fontSize:12,color:"#555",marginBottom:12}}>Nenhum vendedor cadastrado ainda.</div>
                  )}
                  <div style={{display:"flex",gap:8,marginTop:14}}>
                    <input style={{...S.inp,marginBottom:0,flex:1}} placeholder="Nome do novo vendedor" value={newVendedor} onChange={e=>setNewVendedor(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addVendedor()} />
                    <button onClick={addVendedor} style={{background:"#f5c518",color:"#000",border:"none",borderRadius:8,padding:"0 16px",fontWeight:700,cursor:"pointer",flexShrink:0}}>+ Add</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontSize:17,fontWeight:700,color:"#f5c518"}}>⚙️ Configurações</div>
                  <button onClick={()=>setShowSettings(false)} style={{background:"#222",border:"none",color:"#888",fontSize:18,cursor:"pointer",borderRadius:20,width:32,height:32}}>✕</button>
                </div>

                {/* Dias úteis */}
                <div style={{background:"#0a0a0a",borderRadius:12,padding:14,marginBottom:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f5c518",marginBottom:2}}>📅 Dias Úteis por Mês</div>
                  <div style={{fontSize:12,color:"#888",marginBottom:12}}>Configure considerando feriados do mês.</div>
                  {[0,1,2].map(offset=>{
                    const d=new Date(); d.setMonth(d.getMonth()+offset);
                    const ym=d.toISOString().slice(0,7);
                    const nomeMes=d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
                    const du=diasUteisPorMes[ym]||26;
                    return(
                      <div key={ym} style={{marginBottom:10,padding:10,background:"#111",borderRadius:10,border:offset===0?"1px solid #f5c51833":"1px solid #1f1f1f"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <div style={{fontSize:13,fontWeight:700,color:offset===0?"#f5c518":"#f5f5f5",textTransform:"capitalize"}}>{nomeMes} {offset===0&&<span style={{fontSize:10,color:"#f5c518"}}> · VIGENTE</span>}</div>
                          <div style={{fontSize:20,fontWeight:900,color:offset===0?"#f5c518":"#888"}}>{du}d</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <button onClick={()=>setDiasUteisPorMes(prev=>({...prev,[ym]:Math.max(1,(prev[ym]||26)-1)}))} style={{background:"#222",border:"1px solid #333",borderRadius:8,width:30,height:30,color:"#f5f5f5",fontSize:16,cursor:"pointer",fontWeight:700}}>−</button>
                          <div style={{display:"flex",gap:4,flex:1,flexWrap:"wrap"}}>
                            {[18,19,20,21,22,23,24,25,26].map(n=>(
                              <button key={n} onClick={()=>setDiasUteisPorMes(prev=>({...prev,[ym]:n}))} style={{padding:"3px 6px",borderRadius:14,border:du===n?"1px solid #f5c518":"1px solid #222",background:du===n?"#1a1200":"#0a0a0a",color:du===n?"#f5c518":"#555",fontSize:11,cursor:"pointer"}}>{n}</button>
                            ))}
                          </div>
                          <button onClick={()=>setDiasUteisPorMes(prev=>({...prev,[ym]:Math.min(31,(prev[ym]||26)+1)}))} style={{background:"#222",border:"1px solid #333",borderRadius:8,width:30,height:30,color:"#f5f5f5",fontSize:16,cursor:"pointer",fontWeight:700}}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lojas */}
                <div style={{fontSize:13,fontWeight:700,color:"#f5c518",marginBottom:10}}>🏪 Gerenciar Lojas</div>
                <div style={{fontSize:12,color:"#888",marginBottom:12}}>Clique em uma loja para editar gerente, meta e vendedores.</div>
                {uLojas.map(l=>{
                  const vendCount = vendedores.filter(v=>v.loja_id===l.id&&v.ativo).length;
                  return(
                    <div key={l.id} onClick={()=>{setSettingsLoja(l);setSettingsLojaForm({gerente:l.gerente||"",meta_mensal:l.meta_mensal||0});}} style={{...S.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",padding:14}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{l.nome}</div>
                        <div style={{fontSize:12,color:"#888",marginTop:2}}>👤 {l.gerente||"Sem gerente"} · {vendCount} vendedor{vendCount!==1?"es":""}</div>
                        <div style={{fontSize:11,color:"#666",marginTop:2}}>Meta: R$ {(l.meta_mensal||0).toLocaleString("pt-BR")}/mês</div>
                      </div>
                      <div style={{fontSize:18,color:"#f5c518"}}>→</div>
                    </div>
                  );
                })}

                <button style={{...S.bp,marginTop:12}} onClick={async()=>{
                  const duEntries = Object.entries(diasUteisPorMes).map(([ano_mes,dias])=>({ano_mes,dias}));
                  if(duEntries.length) await sb("dias_uteis",{method:"POST",headers:{Prefer:"resolution=merge-duplicates"},body:JSON.stringify(duEntries)});
                  setShowSettings(false);
                }}>Salvar Dias Úteis ✓</button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={S.hdr}>
        <div style={{background:"#f5c518",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👓</div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:900,color:"#f5c518",letterSpacing:-0.5}}>AMIGÃO CHECK</div><div style={{fontSize:10,color:"#666",letterSpacing:1}}>SUPERVISÃO OPERACIONAL</div></div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {user?.role==="diretor"&&<button onClick={()=>setShowSettings(true)} style={{background:"#1a1a1a",border:"1px solid #333",borderRadius:20,padding:"5px 9px",color:"#f5c518",fontSize:15,cursor:"pointer",lineHeight:1}}>⚙️</button>}
          <div style={{background:"#1a1a1a",borderRadius:20,padding:"4px 8px",fontSize:11,color:"#f5c518",whiteSpace:"nowrap"}}>{user?.role?.includes("diretor")?"👑":"👤"} {user?.nome?.split(" ")[0]}</div>
          <button onClick={()=>{setUser(null);setPage("login");}} style={{background:"#1a1a1a",border:"1px solid #333",borderRadius:20,padding:"4px 8px",color:"#888",fontSize:11,cursor:"pointer"}}>Sair</button>
        </div>
      </div>

      {/* DASHBOARD */}
      {page==="dashboard"&&(
        <div>
          <div style={{background:"#161200",border:"1px solid #2a2000",borderRadius:12,margin:"14px 14px 0",padding:16}}>
            <div style={{fontSize:11,color:"#f5c518",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Média Geral · {user?.nome}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:52,fontWeight:900,color:sc(avgNota),lineHeight:1}}>{avgNota}<span style={{fontSize:18,color:"#888"}}>/100</span></div><div style={{fontSize:12,color:"#888",marginTop:4}}>Nota média de supervisão</div></div>
              <div style={{textAlign:"right",fontSize:12}}>
                <div style={{marginBottom:4}}>🟢 {uVisitas.filter(v=>v.status_loja==="verde").length} verdes</div>
                <div style={{marginBottom:4}}>🟡 {uVisitas.filter(v=>v.status_loja==="amarelo").length} amarelos</div>
                <div>🔴 {uVisitas.filter(v=>v.status_loja==="vermelho").length} vermelhos</div>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"12px 14px 0"}}>
            {[
              {label:"Lançamentos Hoje",value:uInd.filter(i=>i.data===today).length,sub:`de ${uLojas.length} lojas`,color:"#f5c518"},
              {label:"Pendências",value:uPend.filter(p=>p.status!=="resolvido").length,sub:"abertas",color:"#dc2626"},
              {label:"Melhor Conversão",value:`${Math.max(0,...uInd.filter(i=>i.data===today).map(i=>i.conversao))}%`,sub:uInd.filter(i=>i.data===today).sort((a,b)=>b.conversao-a.conversao)[0]?.loja_nome||"-",color:"#a855f7"},
              {label:"Melhor Meta",value:`${Math.max(0,...uInd.filter(i=>i.data===today).map(i=>Math.round((i.vendas/i.meta_dia)*100)))}%`,sub:"hoje",color:"#16a34a"},
            ].map((s,i)=>(
              <div key={i} style={{background:"#161616",border:`1px solid ${s.color}22`,borderRadius:10,padding:14,textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:11,color:s.color,fontWeight:700,marginTop:2}}>{s.sub}</div>
                <div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={S.sec}>
            <div style={S.ttl}>Análise de Indicadores</div>
            <div style={{...S.card,padding:12}}>
              {/* Loja filter */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"#888",marginBottom:6}}>LOJA</div>
                <select style={{...S.sel,marginBottom:0}} value={dashLoja} onChange={e=>setDashLoja(e.target.value)}>
                  <option value="todas">Todas as lojas</option>
                  {uLojas.map(l=><option key={l.id} value={l.nome}>{l.nome}</option>)}
                </select>
              </div>

              {/* Period filter */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"#888",marginBottom:6}}>
                  PERÍODO {dashLoja!=="todas"&&<span style={{color:"#555"}}>(máx. 6 meses)</span>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:dashPeriod==="custom"?10:0}}>
                  {[["hoje","Hoje"],["ontem","Ontem"],["7","7 dias"],["mes","Este mês"],["6m","6 meses"],["custom","Período"]].map(([v,l])=>(
                    <button key={v} style={S.fb(dashPeriod===v)} onClick={()=>setDashPeriod(v)}>{l}</button>
                  ))}
                </div>
                {dashPeriod==="custom"&&(
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <div style={{flex:1}}><label style={S.lbl}>De</label><input type="date" style={{...S.inp,marginBottom:0,colorScheme:"dark"}} value={dashFrom} onChange={e=>{
                      // Enforce 6-month max
                      if(dashTo){ const diff=(new Date(dashTo)-new Date(e.target.value))/86400000/30; if(diff>6) return; }
                      setDashFrom(e.target.value);
                    }}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Até</label><input type="date" style={{...S.inp,marginBottom:0,colorScheme:"dark"}} value={dashTo} onChange={e=>{
                      if(dashFrom){ const diff=(new Date(e.target.value)-new Date(dashFrom))/86400000/30; if(diff>6) return; }
                      setDashTo(e.target.value);
                    }}/></div>
                  </div>
                )}
              </div>

              {/* Indicator filter */}
              <div>
                <div style={{fontSize:11,color:"#888",marginBottom:6}}>INDICADOR</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[["meta","% Meta"],["conversao","Conversão"],["ticket","Ticket"],["nota","Nota"]].map(([v,l])=>(
                    <button key={v} style={S.fb(dashChart===v)} onClick={()=>setDashChart(v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Single store → line chart evolution */}
            {dashLoja!=="todas" && singleStoreData ? (
              <>
              <div style={{...S.card,padding:"12px 4px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,paddingLeft:12,paddingRight:12}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f5c518"}}>Evolução · {dashLoja}</div>
                  <div style={{fontSize:11,color:"#888"}}>{cl}</div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={singleStoreData.filter(d=>d[ck]!==null)} margin={{left:-10,right:16}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f"/>
                    <XAxis dataKey="name" tick={{fill:"#ccc",fontSize:11}}/>
                    <YAxis tick={{fill:"#666",fontSize:10}}/>
                    <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #333",borderRadius:8,color:"#f5f5f5"}} formatter={(v,n,p)=>{
                      if(dashChart==="ticket") return [`R$ ${v}`, "Ticket Médio"];
                      if(dashChart==="conversao") return [`${v}% (${p.payload.totalVR||0} vendas)`, "Conversão"];
                      return [`${v}%`, cl];
                    }}/>
                    <Line type="monotone" dataKey={ck} stroke={cc} strokeWidth={3} dot={{r:5,fill:cc,stroke:"#0a0a0a",strokeWidth:2}} activeDot={{r:7}} connectNulls/>
                  </LineChart>
                </ResponsiveContainer>
                {(()=>{
                  const valid=singleStoreData.filter(d=>d[ck]!==null);
                  if(!valid.length) return null;
                  const vals=valid.map(d=>d[ck]);
                  const max=Math.max(...vals); const last=vals[vals.length-1]; const prev=vals[vals.length-2];
                  const trend=prev!=null?last-prev:null;
                  const fmt=v=>dashChart==="ticket"?`R$ ${v}`:`${v}%`;
                  return(
                    <div style={{display:"flex",gap:8,padding:"10px 12px 4px"}}>
                      <div style={{background:"#0a0a0a",borderRadius:8,padding:"8px 12px",flex:1,textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:cc}}>{fmt(last)}</div><div style={{fontSize:10,color:"#666"}}>ÚLTIMO MÊS</div></div>
                      <div style={{background:"#0a0a0a",borderRadius:8,padding:"8px 12px",flex:1,textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:"#16a34a"}}>{fmt(max)}</div><div style={{fontSize:10,color:"#666"}}>MELHOR</div></div>
                      <div style={{background:"#0a0a0a",borderRadius:8,padding:"8px 12px",flex:1,textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:trend!=null&&trend>=0?"#16a34a":"#dc2626"}}>{trend!=null?(trend>=0?`+${trend}`:trend):"-"}{dashChart==="ticket"?"":"%"}</div><div style={{fontSize:10,color:"#666"}}>VS ANT.</div></div>
                    </div>
                  );
                })()}
              </div>

              {/* Breakdown por vendedor */}
              {(()=>{
                const lojaObj = uLojas.find(l=>l.nome===dashLoja);
                if(!lojaObj) return null;
                const {from, to} = dashPeriodRange;
                const vendedoresLoja = vendedores.filter(v=>v.loja_id===lojaObj.id&&v.ativo);
                if(!vendedoresLoja.length) return null;
                const vendData = vendedoresLoja.map(v=>{
                  const vi = uIndV.filter(i=>i.vendedor_id===v.id&&i.data>=from&&i.data<=to);
                  if(!vi.length) return null;
                  const totalV=vi.reduce((a,i)=>a+i.vendas,0);
                  const totalVR=vi.reduce((a,i)=>a+i.vendas_realizadas,0);
                  const totalAt=vi.reduce((a,i)=>a+i.atendimentos,0);
                  return { name:v.nome.split(" ")[0], meta:0, conversao:totalAt>0?Math.round((totalVR/totalAt)*100):0, ticket:totalVR>0?Math.round(totalV/totalVR):0, vendas:totalV, totalVR, totalAt };
                }).filter(Boolean);
                if(!vendData.length) return null;
                return(
                  <div style={{...S.card,padding:"12px 4px",marginTop:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#a855f7",marginBottom:8,paddingLeft:12}}>👥 Por Vendedor · {dashLoja}</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={vendData.sort((a,b)=>b[ck==="meta"?"vendas":ck]-a[ck==="meta"?"vendas":ck])} margin={{left:-10,right:10,bottom:40}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f"/>
                        <XAxis dataKey="name" tick={{fill:"#ccc",fontSize:10}} interval={0} angle={-35} textAnchor="end" height={60}/>
                        <YAxis tick={{fill:"#666",fontSize:10}}/>
                        <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #333",borderRadius:8,color:"#f5f5f5"}} formatter={(v,n,p)=>{ if(ck==="ticket") return [`R$ ${v}`,"Ticket"]; if(ck==="conversao") return [`${v}% (${p.payload.totalVR}v)`,"Conversão"]; return [`R$ ${p.payload.vendas?.toLocaleString("pt-BR")}`,"Vendas"]; }}/>
                        <Bar dataKey={ck==="meta"?"vendas":ck} fill="#a855f7" radius={[4,4,0,0]} name={cl}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
              </>
            ) : chartData.length>0 ? (
              /* All stores → bar chart by store for selected period */
              <div style={{...S.card,padding:"12px 4px"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#f5c518",marginBottom:8,paddingLeft:12}}>
                  {cl} · Por Loja · {dashPeriod==="hoje"?"Hoje":dashPeriod==="ontem"?"Ontem":dashPeriod==="7"?"7 dias":dashPeriod==="mes"?"Este mês":dashPeriod==="6m"?"Últimos 6 meses":"Período selecionado"}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{left:-10,right:10,bottom:40}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f"/>
                    <XAxis dataKey="name" tick={{fill:"#ccc",fontSize:10}} interval={0} angle={-35} textAnchor="end" height={70}/>
                    <YAxis tick={{fill:"#666",fontSize:10}}/>
                    <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #333",borderRadius:8,color:"#f5f5f5"}}
                      formatter={(value,name,props)=>{
                        if(dashChart==="meta") return [`${value}% (R$ ${(props.payload.vendas||0).toLocaleString("pt-BR")} / R$ ${(props.payload.metaTotal||0).toLocaleString("pt-BR")})`, "% Meta"];
                        if(dashChart==="conversao") return [`${value}% (${props.payload.totalVR||0} vendas / ${props.payload.totalAt||0} atend.)`, "Conversão"];
                        if(dashChart==="ticket") return [`R$ ${value}`, "Ticket Médio"];
                        return [`${value}`, name];
                      }}
                    />
                    <Bar dataKey={ck} fill={cc} radius={[4,4,0,0]} name={cl}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={{...S.card,textAlign:"center",color:"#555",padding:32}}>Sem dados para o período selecionado</div>}
            {FOOTER}
          </div>
        </div>
      )}

      {/* RANKING */}
      {page==="ranking"&&(
        <div style={S.sec}>
          <div style={S.ttl}>🏆 Ranking das Lojas</div>
          <div style={{...S.card,padding:12}}>
            <div style={{fontSize:11,color:"#888",marginBottom:8}}>PERÍODO</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:rankPeriod==="custom"?10:0}}>
              {[["hoje","Hoje"],["ontem","Ontem"],["mes","Este mês"],["7","7 dias"],["30","30 dias"],["custom","Período"]].map(([v,l])=><button key={v} style={S.fb(rankPeriod===v)} onClick={()=>setRankPeriod(v)}>{l}</button>)}
            </div>
            {rankPeriod==="custom"&&(
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <div style={{flex:1}}><label style={S.lbl}>De</label><input type="date" style={{...S.inp,marginBottom:0,colorScheme:"dark"}} value={rankFrom} onChange={e=>setRankFrom(e.target.value)}/></div>
                <div style={{flex:1}}><label style={S.lbl}>Até</label><input type="date" style={{...S.inp,marginBottom:0,colorScheme:"dark"}} value={rankTo} onChange={e=>setRankTo(e.target.value)}/></div>
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {[["geral","⭐ Geral"],["meta","💰 % Meta"],["conversao","🎯 Conversão"],["ticket","💵 Ticket"],["nota","📋 Nota"]].map(([v,l])=><button key={v} style={S.fb(rankBy===v)} onClick={()=>setRankBy(v)}>{l}</button>)}
          </div>
          {(()=>{
            const {from,to,days}=getPeriod(rankPeriod,rankFrom,rankTo);
            const scores=uLojas.map(loja=>{
              const li=uInd.filter(i=>i.loja_id===loja.id&&i.data>=from&&i.data<=to);
              const lv=uVisitas.filter(v=>v.loja_id===loja.id);
              const last=uVisitas.filter(v=>v.loja_id===loja.id)[0];
              const avgNota=lv.length?Math.round(lv.reduce((a,v)=>a+v.nota_final,0)/lv.length):0;
              const totalVendas=li.reduce((a,i)=>a+i.vendas,0);
              const totalVendasRealizadas=li.reduce((a,i)=>a+i.vendas_realizadas,0);
              const metaMensal=metas[loja.id]||loja.meta_mensal;
              const mp=rankPeriod==="mes" ? metaMensal : metaPeriodo(metaMensal,days,getDiasUteis(from.slice(0,7)));
              const percMeta=mp>0?Math.round((totalVendas/mp)*100):0;
              const totalAtendimentos=li.reduce((a,i)=>a+i.atendimentos,0);
              const avgConv=totalAtendimentos>0?Math.round((totalVendasRealizadas/totalAtendimentos)*100):0;
              const avgTicket=totalVendasRealizadas>0?Math.round(totalVendas/totalVendasRealizadas):0;
              const geral=li.length?Math.round((Math.min(percMeta,100)+avgConv+(avgNota||0))/3):avgNota;
              const pendC=uPend.filter(p=>p.loja_id===loja.id&&p.status!=="resolvido").length;
              return {loja,li,last,avgNota,totalVendas,mp,percMeta,avgConv,avgTicket,geral,pendC,totalVendasRealizadas,totalAtendimentos};
            });
            const sorted=[...scores].sort((a,b)=>{
              if(rankBy==="meta") return b.percMeta-a.percMeta;
              if(rankBy==="conversao") return b.avgConv-a.avgConv;
              if(rankBy==="ticket") return b.avgTicket-a.avgTicket;
              if(rankBy==="nota") return b.avgNota-a.avgNota;
              return b.geral-a.geral;
            });
            const getMain=(s)=>rankBy==="meta"?`${s.percMeta}%`:rankBy==="conversao"?`${s.avgConv}%`:rankBy==="ticket"?`R$${s.avgTicket}`:rankBy==="nota"?`${s.avgNota}`:`${s.geral}`;
            const getColor=(s)=>rankBy==="ticket"?"#16a34a":rankBy==="nota"?sc(s.avgNota):sc(Math.min(rankBy==="meta"?s.percMeta:rankBy==="conversao"?s.avgConv:s.geral,100));
            return sorted.map(({loja,li,last,pendC,...s},i)=>(
              <div key={loja.id} style={{...S.card,cursor:"pointer",borderLeft:i===0?"3px solid #f5c518":"1px solid #222"}} onClick={()=>{setSelStore(loja);setPage("lojas");}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:i===0?"#f5c518":i===1?"#9ca3af":i===2?"#d97706":"#1f1f1f",color:i<3?"#000":"#555",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:15}}>{loja.nome}</div>
                    <div style={{fontSize:11,color:"#666",marginTop:2}}>{loja.supervisor} · {li.length} lançamento{li.length!==1?"s":""} · {pendC} pendência{pendC!==1?"s":""}</div>
                    <div style={{background:"#0d0d0d",borderRadius:4,height:5,marginTop:6,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(rankBy==="ticket"?Math.min(Math.round(s.avgTicket/5),100):rankBy==="nota"?s.avgNota:rankBy==="meta"?Math.min(s.percMeta,100):rankBy==="conversao"?s.avgConv:s.geral,100)}%`,background:getColor({...s}),borderRadius:4}}/></div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:26,fontWeight:900,color:getColor({...s})}}>{li.length?getMain({...s}):"—"}</div>
                    {last&&<span style={S.bdg(stc(last.status_loja),stb(last.status_loja))}>{last.status_loja?.toUpperCase()}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:"1px solid #1f1f1f",flexWrap:"wrap"}}>
                  <div style={{background:rankBy==="meta"?"#1a1200":"#0a0900",borderRadius:6,padding:"4px 8px",flex:1}}>
                    <div style={{fontSize:10,color:"#666"}}>VENDAS</div>
                    <div style={{fontSize:12,fontWeight:700,color:"#3b82f6"}}>R$ {s.totalVendas.toLocaleString("pt-BR")}</div>
                    <div style={{fontSize:10,color:s.percMeta>=100?"#16a34a":"#dc2626"}}>{s.percMeta}% de R$ {s.mp.toLocaleString("pt-BR")}</div>
                  </div>
                  {li.length>0&&<>
                    <div style={{background:rankBy==="conversao"?"#1a1200":"#0a0900",borderRadius:6,padding:"4px 8px",flex:1}}><div style={{fontSize:10,color:"#666"}}>CONV.</div><div style={{fontSize:12,fontWeight:700,color:"#a855f7"}}>{s.avgConv}% <span style={{fontSize:10,color:"#888"}}>({s.totalVendasRealizadas}v)</span></div></div>
                    <div style={{background:rankBy==="ticket"?"#1a1200":"#0a0900",borderRadius:6,padding:"4px 8px",flex:1}}><div style={{fontSize:10,color:"#666"}}>TICKET</div><div style={{fontSize:12,fontWeight:700,color:"#16a34a"}}>R$ {s.avgTicket}</div></div>
                    <div style={{background:rankBy==="nota"?"#1a1200":"#0a0900",borderRadius:6,padding:"4px 8px",flex:1}}><div style={{fontSize:10,color:"#666"}}>NOTA</div><div style={{fontSize:12,fontWeight:700,color:sc(s.avgNota)}}>{s.avgNota||"—"}</div></div>
                  </>}
                </div>
                {li.length===0&&<div style={{fontSize:11,color:"#555",marginTop:8,textAlign:"center"}}>Sem lançamentos no período</div>}
              </div>
            ));
          })()}
          {FOOTER}
        </div>
      )}

      {/* PENDÊNCIAS */}
      {page==="pendencias"&&(
        <div style={S.sec}>

          {/* Edit Modal */}
          {editingPend&&(
            <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#000000dd",zIndex:200,display:"flex",alignItems:"flex-end"}}>
              <div style={{background:"#111",borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"90vh",overflow:"auto",padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#f5c518"}}>✏️ Editar Pendência</div>
                  <button onClick={()=>setEditingPend(null)} style={{background:"#222",border:"none",color:"#888",fontSize:18,cursor:"pointer",borderRadius:20,width:32,height:32}}>✕</button>
                </div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:16,color:"#f5f5f5"}}>{editingPend.problema}</div>
                <div style={{fontSize:11,color:"#888",marginBottom:16}}>🏪 {editingPend.loja_nome} · 📂 {editingPend.categoria}</div>

                <label style={S.lbl}>Prioridade</label>
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  {[["baixa","#6b7280"],["media","#d97706"],["alta","#f97316"],["critica","#dc2626"]].map(([v,c])=>(
                    <button key={v} onClick={()=>setEditingPend({...editingPend,prioridade:v})} style={{padding:"6px 14px",borderRadius:20,border:editingPend.prioridade===v?`2px solid ${c}`:`1px solid #333`,background:editingPend.prioridade===v?`${c}22`:"#111",color:editingPend.prioridade===v?c:"#888",cursor:"pointer",fontWeight:700,fontSize:12,textTransform:"capitalize"}}>{v}</button>
                  ))}
                </div>

                <label style={S.lbl}>Status</label>
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  {[["pendente","#d97706"],["em andamento","#3b82f6"],["resolvido","#16a34a"],["vencido","#dc2626"]].map(([v,c])=>(
                    <button key={v} onClick={()=>setEditingPend({...editingPend,status:v})} style={{padding:"6px 14px",borderRadius:20,border:editingPend.status===v?`2px solid ${c}`:`1px solid #333`,background:editingPend.status===v?`${c}22`:"#111",color:editingPend.status===v?c:"#888",cursor:"pointer",fontWeight:700,fontSize:12,textTransform:"capitalize"}}>{v}</button>
                  ))}
                </div>

                <label style={S.lbl}>Prazo para Conclusão</label>
                <input style={{...S.inp,colorScheme:"dark"}} type="date" value={editingPend.prazo||""} onChange={e=>setEditingPend({...editingPend,prazo:e.target.value})} />

                <label style={S.lbl}>Responsável</label>
                <input style={S.inp} placeholder="Nome do responsável" value={editingPend.responsavel||""} onChange={e=>setEditingPend({...editingPend,responsavel:e.target.value})} />

                <label style={S.lbl}>Observação / Ação tomada</label>
                <textarea style={{...S.inp,height:70,resize:"none"}} placeholder="Descreva a ação tomada ou andamento..." value={editingPend.obs_responsavel||""} onChange={e=>setEditingPend({...editingPend,obs_responsavel:e.target.value})} />

                <label style={S.lbl}>📷 Foto de Abertura</label>
                <input type="file" accept="image/*" capture="environment" style={{...S.inp,padding:8,fontSize:12,color:"#888"}} />

                {editingPend.status==="resolvido"&&(
                  <>
                    <label style={S.lbl}>📷 Foto de Conclusão</label>
                    <input type="file" accept="image/*" capture="environment" style={{...S.inp,padding:8,fontSize:12,color:"#888"}} />
                  </>
                )}

                <button style={S.bp} onClick={async()=>{
                  await sb(`pendencias?id=eq.${editingPend.id}`,{method:"PATCH",body:JSON.stringify({prioridade:updated.prioridade,status:updated.status,prazo:updated.prazo||null,responsavel:updated.responsavel,obs_responsavel:updated.obs_responsavel,data_conclusao:updated.data_conclusao})});
                  setPendencias(prev=>prev.map(p=>p.id===editingPend.id?updated:p));
                  setEditingPend(null);
                }}>Salvar Alterações ✓</button>
              </div>
            </div>
          )}

          {/* New Pendencia Modal */}
          {newPend&&(
            <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#000000dd",zIndex:200,display:"flex",alignItems:"flex-end"}}>
              <div style={{background:"#111",borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"90vh",overflow:"auto",padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#f5c518"}}>➕ Nova Pendência</div>
                  <button onClick={()=>setNewPend(false)} style={{background:"#222",border:"none",color:"#888",fontSize:18,cursor:"pointer",borderRadius:20,width:32,height:32}}>✕</button>
                </div>

                <label style={S.lbl}>Tipo de Pendência</label>
                <div style={{display:"flex",gap:0,marginBottom:12,background:"#0a0a0a",borderRadius:10,padding:4}}>
                  {[["processo","🏪 Processo da Loja"],["manutencao","🔧 Manutenção"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setNewPendForm({...newPendForm,tipo:v,categoria:""})} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:newPendForm.tipo===v?"#f5c518":"transparent",color:newPendForm.tipo===v?"#000":"#888",cursor:"pointer",fontWeight:700,fontSize:12}}>{l}</button>
                  ))}
                </div>

                <label style={S.lbl}>Loja</label>
                <select style={S.sel} value={newPendForm.loja_id} onChange={e=>setNewPendForm({...newPendForm,loja_id:e.target.value})}>
                  <option value="">Selecione a loja...</option>
                  {uLojas.map(l=><option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>

                <label style={S.lbl}>Problema Identificado</label>
                <textarea style={{...S.inp,height:70,resize:"none"}} placeholder="Descreva o problema..." value={newPendForm.problema} onChange={e=>setNewPendForm({...newPendForm,problema:e.target.value})} />

                <label style={S.lbl}>Categoria</label>
                <select style={S.sel} value={newPendForm.categoria} onChange={e=>setNewPendForm({...newPendForm,categoria:e.target.value})}>
                  <option value="">Selecione...</option>
                  {newPendForm.tipo==="manutencao"
                    ? ["Iluminação","Ar Condicionado","Equipamentos","Estrutura/Obra","Elétrica","Hidráulica","Móveis e Displays","Segurança","Outros"].map(c=><option key={c}>{c}</option>)
                    : ["Fachada e Vitrine","Atendimento","Processos Operacionais","Indicadores e Gestão","Equipe e Cultura","Estoque e Exposição","Serviços e OS","Marketing e Campanhas","Comercial"].map(c=><option key={c}>{c}</option>)
                  }
                </select>

                <label style={S.lbl}>Responsável</label>
                <input style={S.inp} placeholder="Nome do responsável" value={newPendForm.responsavel} onChange={e=>setNewPendForm({...newPendForm,responsavel:e.target.value})} />

                <label style={S.lbl}>Prazo para Conclusão</label>
                <input style={{...S.inp,colorScheme:"dark"}} type="date" value={newPendForm.prazo} onChange={e=>setNewPendForm({...newPendForm,prazo:e.target.value})} />

                <label style={S.lbl}>Prioridade</label>
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  {[["baixa","#6b7280"],["media","#d97706"],["alta","#f97316"],["critica","#dc2626"]].map(([v,c])=>(
                    <button key={v} onClick={()=>setNewPendForm({...newPendForm,prioridade:v})} style={{padding:"6px 14px",borderRadius:20,border:newPendForm.prioridade===v?`2px solid ${c}`:`1px solid #333`,background:newPendForm.prioridade===v?`${c}22`:"#111",color:newPendForm.prioridade===v?c:"#888",cursor:"pointer",fontWeight:700,fontSize:12,textTransform:"capitalize"}}>{v}</button>
                  ))}
                </div>

                <label style={S.lbl}>📷 Foto de Abertura</label>
                <input type="file" accept="image/*" capture="environment" style={{...S.inp,padding:8,fontSize:12,color:"#888"}} />

                <label style={S.lbl}>Observação</label>
                <textarea style={{...S.inp,height:60,resize:"none"}} placeholder="Observações adicionais..." value={newPendForm.obs} onChange={e=>setNewPendForm({...newPendForm,obs:e.target.value})} />

                <button style={{...S.bp,opacity:newPendForm.loja_id&&newPendForm.problema?1:0.5}}
                  disabled={!(newPendForm.loja_id&&newPendForm.problema)}
                  onClick={async()=>{
                    const payload = {loja_id:parseInt(newPendForm.loja_id),loja_nome:loja?.nome||"",supervisor_nome:user.nome,categoria:newPendForm.categoria,problema:newPendForm.problema,responsavel:newPendForm.responsavel,prazo:newPendForm.prazo||null,prioridade:newPendForm.prioridade,status:"pendente",obs_responsavel:newPendForm.obs,tipo:newPendForm.tipo};
                    const result = await sb("pendencias",{method:"POST",body:JSON.stringify(payload)});
                    if(result) setPendencias(prev=>[...(Array.isArray(result)?result:[result]),...prev]);
                    setNewPend(false);
                    setNewPendForm({loja_id:"",problema:"",categoria:"",responsavel:"",prazo:"",prioridade:"alta",obs:"",tipo:"processo"});
                  }}>Criar Pendência ✓</button>
              </div>
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={S.ttl}>⚠️ Plano de Ação</div>
            {user?.role!=="manutencao"&&<button onClick={()=>setNewPend(true)} style={{background:"#f5c518",color:"#000",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>➕ Nova</button>}
          </div>

          {/* Tipo tabs */}
          {user?.role!=="manutencao"&&(
            <div style={{display:"flex",gap:0,marginBottom:14,background:"#161616",borderRadius:10,padding:4}}>
              {[["processo","🏪 Processos"],["manutencao","🔧 Manutenção"]].map(([v,l])=>{
                const cnt = uPend.filter(p=>p.tipo===v&&p.status!=="resolvido").length;
                return(
                  <button key={v} onClick={()=>{setPendTipo(v);setSelPendStore(null);}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:pendTipo===v?"#f5c518":"transparent",color:pendTipo===v?"#000":"#888",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {l}
                    {cnt>0&&<span style={{background:pendTipo===v?"#000":"#dc2626",color:"#fff",borderRadius:20,fontSize:11,fontWeight:900,minWidth:20,height:20,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0 5px"}}>{cnt}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {(()=>{
            const tipoFiltrado = user?.role==="manutencao" ? uPend : uPend.filter(p=>p.tipo===pendTipo);

            // Store list view
            if(!selPendStore) {
              // Get stores that have pendências (open only)
              const storesWithPend = uLojas.filter(loja =>
                tipoFiltrado.some(p=>p.loja_id===loja.id&&p.status!=="resolvido")
              );
              if(storesWithPend.length===0) return(
                <div style={{textAlign:"center",color:"#555",padding:40}}>
                  <div style={{fontSize:32,marginBottom:8}}>✅</div>
                  <div>Nenhuma pendência aberta!</div>
                </div>
              );
              return storesWithPend.map(loja=>{
                const lojaPend = tipoFiltrado.filter(p=>p.loja_id===loja.id&&p.status!=="resolvido");
                const criticas = lojaPend.filter(p=>p.prioridade==="critica").length;
                const altas = lojaPend.filter(p=>p.prioridade==="alta").length;
                const vencidas = lojaPend.filter(p=>p.status==="vencido").length;
                return(
                  <div key={loja.id} onClick={()=>setSelPendStore(loja)} style={{...S.card,cursor:"pointer",borderLeft:`3px solid ${criticas>0?"#dc2626":altas>0?"#f97316":"#d97706"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15}}>{loja.nome}</div>
                        <div style={{fontSize:11,color:"#666",marginTop:2}}>{loja.cidade} · {loja.gerente}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:28,fontWeight:900,color:criticas>0?"#dc2626":altas>0?"#f97316":"#d97706"}}>{lojaPend.length}</div>
                        <div style={{fontSize:10,color:"#666"}}>pendência{lojaPend.length!==1?"s":""}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                      {criticas>0&&<span style={S.bdg("#dc2626","#1c000022")}>🔴 {criticas} crítica{criticas!==1?"s":""}</span>}
                      {altas>0&&<span style={S.bdg("#f97316","#1c060022")}>🟠 {altas} alta{altas!==1?"s":""}</span>}
                      {vencidas>0&&<span style={S.bdg("#dc2626","#1c000022")}>⏰ {vencidas} vencida{vencidas!==1?"s":""}</span>}
                    </div>
                  </div>
                );
              });
            }

            // Store detail view — pendências da loja selecionada
            const storePend = tipoFiltrado.filter(p=>p.loja_id===selPendStore.id);
            const statusFiltrado = pendFilter==="todos" ? storePend : storePend.filter(p=>p.status===pendFilter);
            return(
              <div>
                <button onClick={()=>setSelPendStore(null)} style={{background:"none",border:"none",color:"#f5c518",cursor:"pointer",fontSize:14,marginBottom:12,padding:0}}>← Voltar</button>
                <div style={{...S.card,background:"#161200",border:"1px solid #2a2000",padding:12,marginBottom:12}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#f5c518"}}>{selPendStore.nome}</div>
                  <div style={{fontSize:12,color:"#888"}}>{selPendStore.cidade} · {selPendStore.gerente}</div>
                  <div style={{fontSize:12,color:"#f5c518",marginTop:4}}>{storePend.filter(p=>p.status!=="resolvido").length} pendência{storePend.filter(p=>p.status!=="resolvido").length!==1?"s":""} abertas</div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {["todos","pendente","em andamento","vencido","resolvido"].map(f=><button key={f} style={S.fb(pendFilter===f)} onClick={()=>setPendFilter(f)}>{f}</button>)}
                </div>
                {statusFiltrado.length===0&&<div style={{textAlign:"center",color:"#555",padding:32}}>Nenhuma pendência com este status</div>}
                {statusFiltrado.map(p=>(
                  <div key={p.id} style={{...S.card,borderLeft:`3px solid ${pc(p.prioridade)}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={S.bdg(pc(p.prioridade),`${pc(p.prioridade)}22`)}>{p.prioridade?.toUpperCase()}</span>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={S.bdg(psc(p.status),`${psc(p.status)}22`)}>{p.status?.toUpperCase()}</span>
                        <button onClick={()=>setEditingPend({...p})} style={{background:"#1a1a1a",border:"1px solid #333",borderRadius:6,padding:"3px 8px",color:"#888",fontSize:11,cursor:"pointer"}}>✏️ Editar</button>
                      </div>
                    </div>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{p.problema}</div>
                    <div style={{fontSize:12,color:"#888"}}>📂 {p.categoria} · <span style={{color:p.tipo==="manutencao"?"#3b82f6":"#888"}}>{p.tipo==="manutencao"?"🔧 Manutenção":"🏪 Processo"}</span></div>
                    <div style={{display:"flex",gap:16,marginTop:10,paddingTop:10,borderTop:"1px solid #1f1f1f",flexWrap:"wrap"}}>
                      <div><div style={{fontSize:10,color:"#666"}}>RESPONSÁVEL</div><div style={{fontSize:12,fontWeight:600}}>{p.responsavel||"—"}</div></div>
                      {p.prazo&&<div><div style={{fontSize:10,color:"#666"}}>PRAZO</div><div style={{fontSize:12,fontWeight:600,color:p.status==="vencido"?"#dc2626":"#f5f5f5"}}>{new Date(p.prazo).toLocaleDateString("pt-BR")}</div></div>}
                      {p.data_conclusao&&<div><div style={{fontSize:10,color:"#666"}}>CONCLUÍDO</div><div style={{fontSize:12,fontWeight:600,color:"#16a34a"}}>{new Date(p.data_conclusao).toLocaleDateString("pt-BR")}</div></div>}
                    </div>
                    {p.obs_responsavel&&<div style={{fontSize:12,color:"#888",marginTop:8,fontStyle:"italic"}}>💬 "{p.obs_responsavel}"</div>}
                  </div>
                ))}
              </div>
            );
          })()}
          {FOOTER}
        </div>
      )}

      {/* LOJAS */}
      {page==="lojas"&&!selStore&&(
        <div style={S.sec}>
          <div style={S.ttl}>🏪 Lojas</div>
          {uLojas.map(loja=>{
            const lv=uVisitas.filter(v=>v.loja_id===loja.id);
            const li=uInd.filter(i=>i.loja_id===loja.id);
            const last=lv[0]; const avgNota=lv.length?Math.round(lv.reduce((a,v)=>a+v.nota_final,0)/lv.length):0;
            const jaLancou=uInd.some(i=>i.loja_id===loja.id&&i.data===today);
            return(
              <div key={loja.id} style={{...S.card,cursor:"pointer"}} onClick={()=>setSelStore(loja)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15}}>{loja.nome}</div>
                    <div style={{fontSize:12,color:"#666",marginTop:2}}>{loja.cidade} · {loja.gerente}</div>
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      <span style={{fontSize:11,color:"#555"}}>{lv.length} visita{lv.length!==1?"s":""}</span>
                      <span style={{fontSize:11,color:"#555"}}>·</span>
                      <span style={{fontSize:11,color:"#555"}}>{li.length} indicadores</span>
                      {jaLancou&&<span style={S.bdg("#16a34a","#052e16")}>✓ hoje</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:26,fontWeight:900,color:sc(avgNota)}}>{avgNota||"—"}</div>
                    {last&&<div style={{width:8,height:8,borderRadius:"50%",background:stc(last.status_loja),marginLeft:"auto",marginTop:4}}/>}
                  </div>
                </div>
              </div>
            );
          })}
          {FOOTER}
        </div>
      )}

      {page==="lojas"&&selStore&&(()=>{
        const lv=visitas.filter(v=>v.loja_id===selStore.id);
        const li=indicadores.filter(i=>i.loja_id===selStore.id);
        const storeVisits=(() => {
          let f=lv;
          if(histFilter==="custom") f=f.filter(v=>v.data_visita>=histFrom&&v.data_visita<=histTo);
          else if(histFilter==="mes") { const {from,to}=getPeriod("mes","",""); f=f.filter(v=>v.data_visita>=from&&v.data_visita<=to); }
          else f=f.filter(v=>v.data_visita>=daysAgo(parseInt(histFilter)));
          return f.sort((a,b)=>new Date(b.data_visita)-new Date(a.data_visita));
        })();
        const storeInd=(() => {
          let f=li;
          if(histFilter==="custom") f=f.filter(i=>i.data>=histFrom&&i.data<=histTo);
          else if(histFilter==="mes") { const {from,to}=getPeriod("mes","",""); f=f.filter(i=>i.data>=from&&i.data<=to); }
          else f=f.filter(i=>i.data>=daysAgo(parseInt(histFilter)));
          return f.sort((a,b)=>new Date(b.data)-new Date(a.data));
        })();
        const avgNota=lv.length?Math.round(lv.reduce((a,v)=>a+v.nota_final,0)/lv.length):0;
        const lastV=lv[0];
        return(
          <div style={S.sec}>
            <button onClick={()=>setSelStore(null)} style={{background:"none",border:"none",color:"#f5c518",cursor:"pointer",fontSize:14,marginTop:14,padding:0}}>← Voltar</button>
            <div style={{background:"#161200",border:"1px solid #2a2000",borderRadius:12,padding:16,marginTop:10}}>
              <div style={{fontSize:12,color:"#f5c518",textTransform:"uppercase",letterSpacing:1}}>{selStore.nome}</div>
              <div style={{fontSize:12,color:"#888",marginTop:4}}>{selStore.cidade} · {selStore.gerente} · {selStore.supervisor}</div>
              {lastV&&<div style={{display:"flex",alignItems:"center",gap:16,marginTop:10}}>
                <div style={{fontSize:48,fontWeight:900,color:sc(avgNota),lineHeight:1}}>{avgNota}</div>
                <div><div style={{fontSize:13,color:sc(avgNota)}}>{sl(avgNota)}</div><div style={{fontSize:11,color:"#888"}}>Nota média de supervisão</div></div>
              </div>}
            </div>

            {storeVisits.length>1&&(
              <div style={{...S.card,padding:"12px 4px",marginTop:10}}>
                <div style={{fontSize:13,fontWeight:700,color:"#f5c518",marginBottom:8,paddingLeft:12}}>Evolução da Nota</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={[...storeVisits].reverse().map(v=>({data:new Date(v.data_visita).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),nota:v.nota_final}))} margin={{left:-10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f"/>
                    <XAxis dataKey="data" tick={{fill:"#666",fontSize:9}}/>
                    <YAxis domain={[0,100]} tick={{fill:"#666",fontSize:10}}/>
                    <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #333",borderRadius:8,color:"#f5f5f5"}}/>
                    <Line type="monotone" dataKey="nota" stroke="#f5c518" strokeWidth={2} dot={{r:4}} name="Nota"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {storeInd.length>1&&(
              <div style={{...S.card,padding:"12px 4px"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#3b82f6",marginBottom:8,paddingLeft:12}}>Evolução Comercial</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={[...storeInd].reverse().map(i=>({data:new Date(i.data).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),meta:Math.round((i.vendas/i.meta_dia)*100),conversao:i.conversao}))} margin={{left:-10,right:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f"/>
                    <XAxis dataKey="data" tick={{fill:"#666",fontSize:9}}/>
                    <YAxis tick={{fill:"#666",fontSize:10}}/>
                    <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #333",borderRadius:8,color:"#f5f5f5"}}/>
                    <Legend/>
                    <Line type="monotone" dataKey="meta" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} name="% Meta"/>
                    <Line type="monotone" dataKey="conversao" stroke="#a855f7" strokeWidth={2} dot={{r:3}} name="Conversão"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{...S.card,padding:12}}>
              <div style={{fontSize:11,color:"#888",marginBottom:8}}>FILTRAR HISTÓRICO</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:histFilter==="custom"?10:0}}>
                {[["7","7 dias"],["15","15 dias"],["mes","Este mês"],["30","30 dias"],["90","90 dias"],["custom","Período"]].map(([v,l])=><button key={v} style={S.fb(histFilter===v)} onClick={()=>setHistFilter(v)}>{l}</button>)}
              </div>
              {histFilter==="custom"&&<div style={{display:"flex",gap:8,marginTop:8}}><div style={{flex:1}}><label style={S.lbl}>De</label><input type="date" style={{...S.inp,marginBottom:0,colorScheme:"dark"}} value={histFrom} onChange={e=>setHistFrom(e.target.value)}/></div><div style={{flex:1}}><label style={S.lbl}>Até</label><input type="date" style={{...S.inp,marginBottom:0,colorScheme:"dark"}} value={histTo} onChange={e=>setHistTo(e.target.value)}/></div></div>}
            </div>

            {/* Indicadores history */}
            {storeInd.length>0&&<>
              <div style={S.ttl}>Indicadores ({storeInd.length})</div>

              {/* Edit Indicador Modal */}
              {editingInd&&(
                <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#000000ee",zIndex:200,display:"flex",alignItems:"flex-end"}}>
                  <div style={{background:"#111",borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"85vh",overflow:"auto",padding:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <div style={{fontSize:16,fontWeight:700,color:"#f5c518"}}>✏️ Editar Indicadores</div>
                      <button onClick={()=>setEditingInd(null)} style={{background:"#222",border:"none",color:"#888",fontSize:18,cursor:"pointer",borderRadius:20,width:32,height:32}}>✕</button>
                    </div>
                    <label style={S.lbl}>Data de Referência</label>
                    <input style={{...S.inp,colorScheme:"dark"}} type="date" value={indEditForm.data} onChange={e=>setIndEditForm({...indEditForm,data:e.target.value})} />
                    <label style={S.lbl}>Vendas do Dia (R$)</label>
                    <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={indEditForm.vendas} onChange={e=>setIndEditForm({...indEditForm,vendas:e.target.value})} />
                    <label style={S.lbl}>Receita do Dia (R$)</label>
                    <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={indEditForm.receita} onChange={e=>setIndEditForm({...indEditForm,receita:e.target.value})} />
                    <label style={S.lbl}>Atendimentos</label>
                    <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={indEditForm.atendimentos} onChange={e=>setIndEditForm({...indEditForm,atendimentos:e.target.value})} />
                    <label style={S.lbl}>Vendas Realizadas</label>
                    <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={indEditForm.vendas_realizadas} onChange={e=>setIndEditForm({...indEditForm,vendas_realizadas:e.target.value})} />
                    <label style={S.lbl}>Observações</label>
                    <textarea style={{...S.inp,height:60,resize:"none"}} value={indEditForm.obs||""} onChange={e=>setIndEditForm({...indEditForm,obs:e.target.value})} />
                    {/* Preview calc */}
                    {indEditForm.vendas&&indEditForm.atendimentos&&(
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                        {[["CONVERSÃO",`${parseInt(indEditForm.atendimentos)>0?Math.round((parseInt(indEditForm.vendas_realizadas)/parseInt(indEditForm.atendimentos))*100):0}%`,"#a855f7"],["TICKET",`R$ ${parseInt(indEditForm.vendas_realizadas)>0?Math.round(parseFloat(indEditForm.vendas)/parseInt(indEditForm.vendas_realizadas)):0}`,"#16a34a"]].map(([k,v,c])=>(
                          <div key={k} style={{background:"#0a0a0a",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
                            <div style={{fontSize:16,fontWeight:900,color:c}}>{v}</div>
                            <div style={{fontSize:10,color:"#666"}}>{k}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button style={S.bp} onClick={saveIndEdit}>Salvar Alterações ✓</button>
                  </div>
                </div>
              )}

              {storeInd.map(i=>(
                <div key={i.id} style={{...S.card,borderLeft:`3px solid ${i.vendas>=i.meta_dia?"#16a34a":"#dc2626"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:13,fontWeight:700}}>{new Date(i.data).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"})}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={S.bdg(i.vendas>=i.meta_dia?"#16a34a":"#dc2626",i.vendas>=i.meta_dia?"#052e16":"#1c0000")}>{Math.round((i.vendas/(i.meta_dia||1))*100)}% meta</span>
                      {user?.role==="diretor"&&<>
                        <button onClick={()=>{setEditingInd(i);setIndEditForm({data:i.data,vendas:i.vendas,receita:i.receita||0,atendimentos:i.atendimentos,vendas_realizadas:i.vendas_realizadas,obs:i.obs||""});}} style={{background:"#1a1a1a",border:"1px solid #333",borderRadius:6,padding:"3px 7px",color:"#f5c518",fontSize:11,cursor:"pointer"}}>✏️</button>
                        <button onClick={()=>deleteInd(i)} style={{background:"#1c0000",border:"1px solid #333",borderRadius:6,padding:"3px 7px",color:"#dc2626",fontSize:11,cursor:"pointer"}}>🗑️</button>
                      </>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
                    <div><div style={{fontSize:10,color:"#666"}}>VENDAS</div><div style={{fontSize:12,fontWeight:700,color:"#3b82f6"}}>R$ {i.vendas.toLocaleString("pt-BR")}</div></div>
                    {i.receita>0&&<div><div style={{fontSize:10,color:"#666"}}>RECEITA</div><div style={{fontSize:12,fontWeight:700,color:"#16a34a"}}>R$ {i.receita.toLocaleString("pt-BR")} <span style={{fontSize:10,color:i.receita/i.vendas>=0.9?"#16a34a":"#d97706"}}>({Math.round((i.receita/i.vendas)*100)}%)</span></div></div>}
                    <div><div style={{fontSize:10,color:"#666"}}>ATEND.</div><div style={{fontSize:12,fontWeight:700}}>{i.atendimentos}</div></div>
                    <div><div style={{fontSize:10,color:"#666"}}>V.REAIS</div><div style={{fontSize:12,fontWeight:700}}>{i.vendas_realizadas}</div></div>
                    <div><div style={{fontSize:10,color:"#666"}}>CONV.</div><div style={{fontSize:12,fontWeight:700,color:"#a855f7"}}>{i.conversao}% <span style={{fontSize:10,color:"#888"}}>({i.vendas_realizadas}v)</span></div></div>
                    <div><div style={{fontSize:10,color:"#666"}}>TICKET</div><div style={{fontSize:12,fontWeight:700}}>R$ {i.ticket_medio}</div></div>
                  </div>
                </div>
              ))}
            </>}

            {/* Visits history */}
            {storeVisits.length>0&&<>
              <div style={S.ttl}>Visitas de Supervisão ({storeVisits.length})</div>
              {storeVisits.map(v=>(
                <div key={v.id} style={{...S.card,borderLeft:`3px solid ${sc(v.nota_final)}`}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div><div style={{fontSize:13,fontWeight:700}}>{new Date(v.data_visita).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"})}</div><div style={{fontSize:11,color:"#666"}}>{v.supervisor_nome} · {v.tipo_visita}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:26,fontWeight:900,color:sc(v.nota_final)}}>{v.nota_final}</div><span style={S.bdg(stc(v.status_loja),stb(v.status_loja))}>{v.status_loja?.toUpperCase()}</span></div>
                  </div>
                  {v.obs_geral&&<div style={{fontSize:12,color:"#888",marginTop:8,fontStyle:"italic"}}>"{v.obs_geral}"</div>}
                  <button onClick={()=>openVisitDetail(v)} style={{marginTop:10,background:"#1a1a1a",border:"1px solid #333",borderRadius:8,padding:"6px 14px",color:"#f5c518",fontSize:12,cursor:"pointer",width:"100%"}}>📋 Ver respostas do checklist</button>
                </div>
              ))}
            </>}

            {/* Visit Detail Modal */}
            {viewingVisit&&(
              <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#000000ee",zIndex:200,display:"flex",alignItems:"flex-end"}}>
                <div style={{background:"#111",borderRadius:"16px 16px 0 0",width:"100%",maxHeight:"92vh",overflow:"auto",padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,color:"#f5c518"}}>📋 Visita · {viewingVisit.loja_nome}</div>
                      <div style={{fontSize:12,color:"#888"}}>{new Date(viewingVisit.data_visita).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"})} · {viewingVisit.supervisor_nome}</div>
                    </div>
                    <button onClick={()=>{setViewingVisit(null);setVisitAnswers([]);setEditingVisitMode(false);}} style={{background:"#222",border:"none",color:"#888",fontSize:18,cursor:"pointer",borderRadius:20,width:32,height:32}}>✕</button>
                  </div>

                  {/* Visit summary */}
                  <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                    {[["NOTA",viewingVisit.nota_final,sc(viewingVisit.nota_final)],["STATUS",viewingVisit.status_loja?.toUpperCase(),stc(viewingVisit.status_loja)],["TIPO",viewingVisit.tipo_visita,"#888"]].map(([k,v,c])=>(
                      <div key={k} style={{background:"#0a0a0a",borderRadius:8,padding:"8px 12px",flex:1,textAlign:"center"}}>
                        <div style={{fontSize:14,fontWeight:900,color:c}}>{v}</div>
                        <div style={{fontSize:10,color:"#666"}}>{k}</div>
                      </div>
                    ))}
                  </div>

                  {/* Edit/Delete — somente diretor */}
                  {user?.role==="diretor"&&(
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      <button onClick={()=>setEditingVisitMode(e=>!e)} style={{...S.bp,flex:1,background:editingVisitMode?"#333":"#1a1a1a",color:editingVisitMode?"#fff":"#f5c518",border:"1px solid #f5c518"}}>
                        {editingVisitMode?"❌ Cancelar":"✏️ Editar"}
                      </button>
                      <button onClick={deleteVisit} style={{...S.bp,flex:1,background:"#1c0000",color:"#dc2626",border:"1px solid #dc2626"}}>
                        🗑️ Excluir
                      </button>
                    </div>
                  )}

                  {editingVisitMode&&(
                    <div style={{...S.card,marginBottom:12}}>
                      <label style={S.lbl}>Nota Final</label>
                      <input style={S.inp} type="number" onWheel={e=>e.target.blur()} min="0" max="100" value={visitEditForm.nota_final} onChange={e=>setVisitEditForm({...visitEditForm,nota_final:e.target.value})} />
                      <label style={S.lbl}>Status da Loja</label>
                      <div style={{display:"flex",gap:6,marginBottom:10}}>
                        {[["verde","🟢 Verde"],["amarelo","🟡 Amarelo"],["vermelho","🔴 Vermelho"]].map(([v,l])=>(
                          <button key={v} onClick={()=>setVisitEditForm({...visitEditForm,status_loja:v})} style={{flex:1,padding:8,borderRadius:8,border:visitEditForm.status_loja===v?`2px solid ${stc(v)}`:"1px solid #333",background:visitEditForm.status_loja===v?stb(v):"#111",color:visitEditForm.status_loja===v?stc(v):"#888",cursor:"pointer",fontSize:12,fontWeight:700}}>{l}</button>
                        ))}
                      </div>
                      <label style={S.lbl}>Vendas (R$)</label>
                      <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={visitEditForm.vendas} onChange={e=>setVisitEditForm({...visitEditForm,vendas:e.target.value})} />
                      <label style={S.lbl}>Atendimentos</label>
                      <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={visitEditForm.atendimentos} onChange={e=>setVisitEditForm({...visitEditForm,atendimentos:e.target.value})} />
                      <label style={S.lbl}>Vendas Realizadas</label>
                      <input style={S.inp} type="number" onWheel={e=>e.target.blur()} value={visitEditForm.vendas_realizadas} onChange={e=>setVisitEditForm({...visitEditForm,vendas_realizadas:e.target.value})} />
                      <label style={S.lbl}>Observações</label>
                      <textarea style={{...S.inp,height:70,resize:"none"}} value={visitEditForm.obs_geral} onChange={e=>setVisitEditForm({...visitEditForm,obs_geral:e.target.value})} />
                      <button style={S.bp} onClick={saveVisitEdit}>Salvar Alterações ✓</button>
                    </div>
                  )}

                  {/* Checklist answers */}
                  <div style={{fontSize:14,fontWeight:700,color:"#f5c518",marginBottom:12}}>Respostas do Checklist</div>
                  {loadingAnswers&&<div style={{textAlign:"center",color:"#666",padding:20}}>Carregando respostas...</div>}
                  {!loadingAnswers&&visitAnswers.length===0&&<div style={{textAlign:"center",color:"#555",padding:20}}>Nenhuma resposta registrada</div>}
                  {!loadingAnswers&&(()=>{
                    const cats = [...new Set(visitAnswers.map(a=>a.categoria_nome))];
                    return cats.map(cat=>{
                      const catAnswers = visitAnswers.filter(a=>a.categoria_nome===cat);
                      const ok = catAnswers.filter(a=>a.resposta==="ok").length;
                      const total = catAnswers.filter(a=>a.resposta!=="na").length;
                      const score = total>0?Math.round(((ok+catAnswers.filter(a=>a.resposta==="parcial").length*0.5)/total)*100):null;
                      return(
                        <div key={cat} style={{...S.card,marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                            <div style={{fontWeight:700,fontSize:14}}>{cat}</div>
                            {score!==null&&<span style={{fontWeight:900,color:sc(score),fontSize:16}}>{score}</span>}
                          </div>
                          {catAnswers.map((a,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"6px 0",borderTop:"1px solid #1f1f1f"}}>
                              <div style={{fontSize:12,color:"#ccc",flex:1,paddingRight:8}}>{a.item_texto}</div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <span style={{fontSize:11,fontWeight:700,color:a.resposta==="ok"?"#16a34a":a.resposta==="parcial"?"#d97706":a.resposta==="nao"?"#dc2626":"#555"}}>
                                  {a.resposta==="ok"?"✅ OK":a.resposta==="parcial"?"⚡ Parcial":a.resposta==="nao"?"❌ Não OK":"N/A"}
                                </span>
                                {a.observacao&&<div style={{fontSize:10,color:"#888",marginTop:2}}>{a.observacao}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            <button style={S.bp} onClick={()=>{setClLoja(selStore);setPage("visita");setSelStore(null);setClStep(0);}}>✅ Nova Visita</button>
            <div style={{height:8}}/>
            <button style={{...S.bp,background:"#1a1200",color:"#f5c518"}} onClick={()=>{setIndLoja(selStore);setPage("indicadores");}}>📈 Lançar Indicadores</button>
            {FOOTER}
          </div>
        );
      })()}

      <nav style={S.nav}>
        {navItems.map(n=><button key={n.id} style={S.nb(page===n.id)} onClick={()=>{reset();setPage(n.id);}}><span style={{fontSize:16}}>{n.icon}</span><span>{n.label}</span></button>)}
      </nav>
    </div>
  );
}
