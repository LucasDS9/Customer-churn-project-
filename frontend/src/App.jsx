import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg: "#000004",
  card: "#0a0014",
  border: "#3b0f70",
  cream: "#fcfdbf",
  purple: "#3b0f70",
  pink: "#e04d7a",
  deepPink: "#6b1040",
  black: "#000004",
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width: 18, height: 18, borderRadius: "50%", background: C.purple,
          color: C.cream, fontSize: 10, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", fontWeight: 700,
          border: `0.5px solid ${C.pink}`, userSelect: "none",
        }}
      >?</div>
      {show && (
        <div style={{
          position: "absolute", right: 0, top: 24, background: "#130026",
          border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "10px 12px",
          width: 240, fontSize: 11, color: C.cream, lineHeight: 1.6, zIndex: 99,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>{text}</div>
      )}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.card, borderRadius: 12, padding: 18,
      position: "relative", ...style,
    }}>{children}</div>
  );
}

function CardTitle({ children }) {
  return (
    <div style={{ color: C.cream, fontSize: 13, fontWeight: 500, marginBottom: 12, opacity: 0.85, letterSpacing: 0.3 }}>
      {children}
    </div>
  );
}

function AnimatedNumber({ target, duration = 1200, decimals = 0, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(+(target * ease).toFixed(decimals));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{decimals > 0 ? val.toFixed(decimals) : val.toLocaleString("pt-BR")}{suffix}</>;
}

function AnimatedBar({ width, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(width), delay + 100); }, [width, delay]);
  return (
    <div style={{
      height: "100%", width: `${w}%`, background: color, borderRadius: 6,
      transition: `width 1s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`,
    }} />
  );
}

// ─── DONUT CHART ──────────────────────────────────────────────────
function DonutChart({ segments, centerLabel, centerSub, size = 120, stroke = 20 }) {
  const r = size / 2 - stroke / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);

  let offset = 0;
  const slices = segments.map((seg) => {
    const len = animated ? circ * seg.pct / 100 : 0;
    const slice = { ...seg, dasharray: `${len} ${circ}`, dashoffset: -offset * circ / 100 };
    offset += seg.pct;
    return slice;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a0030" strokeWidth={stroke} />
        {slices.map((s, i) => (
          <circle key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
        ))}
        <text x={size/2} y={size/2 - 6} textAnchor="middle" fill={C.cream} fontSize={14} fontWeight={500}>{centerLabel}</text>
        <text x={size/2} y={size/2 + 8} textAnchor="middle" fill={C.cream} fontSize={8} opacity={0.5}>{centerSub}</text>
      </svg>
      <div>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", fontSize: 12, color: C.cream, opacity: 0.85, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block", marginRight: 7, flexShrink: 0 }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HEATMAP ──────────────────────────────────────────────────────
const heatmapData = [
  { sat: "Baixa", cols: [
    { x: "0 | 0", val: 0.10 },
    { x: "0 | 1", val: 0.05 },
    { x: "1 | 0", val: 0.44 },
    { x: "1 | 1", val: 0.32 },
  ]},
  { sat: "Média", cols: [
    { x: "0 | 0", val: 0.00 },
    { x: "0 | 1", val: 0.00 },
    { x: "1 | 0", val: 0.00 },
    { x: "1 | 1", val: 0.07 },
  ]},
  { sat: "Alta", cols: [
    { x: "0 | 0", val: 0.00 },
    { x: "0 | 1", val: 0.00 },
    { x: "1 | 0", val: 0.00 },
    { x: "1 | 1", val: 0.03 },
  ]},
];

function getHeatColor(val) {
  if (val === 0) return "#0d001a";
  if (val < 0.05) return "#1a0050";
  if (val < 0.1) return "#3b0f70";
  if (val < 0.2) return "#6b1040";
  if (val < 0.35) return "#e04d7a";
  return "#fcfdbf";
}

function HeatmapChart() {
  const cols = ["0 | 0", "0 | 1", "1 | 0", "1 | 1"];
  return (
    <div>
      <div style={{ fontSize: 13, color: C.cream, fontWeight: 500, marginBottom: 14, opacity: 0.85 }}>
        Churn por Satisfação, Reclamação e Atividade
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(4, 1fr)", gap: 4 }}>
        <div />
        {cols.map(c => (
          <div key={c} style={{ fontSize: 10, color: C.cream, opacity: 0.45, textAlign: "center", paddingBottom: 4 }}>{c}</div>
        ))}
        {heatmapData.map((row) => (
          <>
            <div key={row.sat + "_label"} style={{ fontSize: 11, color: C.cream, opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>{row.sat}</div>
            {row.cols.map((cell) => (
              <div key={row.sat + cell.x} style={{
                background: getHeatColor(cell.val), borderRadius: 6, padding: "18px 4px",
                textAlign: "center", fontSize: 12, fontWeight: 500,
                color: cell.val > 0.3 ? C.black : C.cream,
                transition: "background 0.3s",
              }}>
                {cell.val.toFixed(2)}
              </div>
            ))}
          </>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10, color: C.cream, opacity: 0.35, marginBottom: 4 }}>Eixo X: Complain | IsActiveMember (0=Não/Inativo, 1=Sim/Ativo)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: C.cream, opacity: 0.35 }}>0.00</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#0d001a,#3b0f70,#e04d7a,#fcfdbf)" }} />
          <span style={{ fontSize: 10, color: C.cream, opacity: 0.35 }}>0.44</span>
        </div>
        <div style={{ fontSize: 10, color: C.cream, opacity: 0.25, marginTop: 2 }}>Taxa de Churn</div>
      </div>
    </div>
  );
}

// ─── TENURE DONUT (3 segments) ────────────────────────────────────
const tenureSegments = [
  { pct: 20.2, color: "#fcfdbf", label: "0-3 anos — 20,2%" },
  { pct: 48.7, color: C.purple, label: "4-7 anos — 48,7%" },
  { pct: 31.1, color: "#1a0a2e", label: "8+ anos — 31,1%" },
];

// ─── CORRELATION BAR ──────────────────────────────────────────────
const corrData = [
  { label: "risco_composto",     value:  0.590, positive: true },
  { label: "Complain",           value:  0.335, positive: true },
  { label: "risco_cliente",      value:  0.289, positive: true },
  { label: "Age",                value:  0.127, positive: true },
  { label: "Satisfaction Score", value: -0.511, positive: false },
];
const maxCorr = 0.59;

function CorrelationBar({ item, delay }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), delay + 100); }, [delay]);
  const pct = Math.abs(item.value) / maxCorr * 100;
  const posGrad = "linear-gradient(90deg,#000004 0%,#3b0f70 30%,#e04d7a 70%,#fcfdbf 100%)";
  const negGrad = "linear-gradient(90deg,#fcfdbf 0%,#e04d7a 30%,#3b0f70 70%,#000004 100%)";
  return (
    <div style={{ width: "90%", display: "flex", alignItems: "center", gap: 12, margin: "0 auto" }}>
      <div style={{ width: 150, textAlign: "right", fontSize: 12, color: C.cream, opacity: 0.8, flexShrink: 0 }}>{item.label}</div>
      <div style={{ flex: 1, height: 22, borderRadius: 5, overflow: "hidden", background: C.black, display: "flex", justifyContent: item.positive ? "flex-start" : "flex-end" }}>
        <div style={{
          height: "100%", width: animated ? `${pct}%` : "0%",
          background: item.positive ? posGrad : negGrad, borderRadius: 5,
          transition: `width 1s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`,
        }} />
      </div>
      <div style={{ width: 50, fontSize: 12, color: C.cream, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {item.positive ? "+" : ""}{item.value.toFixed(3)}
      </div>
    </div>
  );
}

// ─── SHAP DATA ────────────────────────────────────────────────────
const shapData = [
  { label: "Satisfaction Score", neg: 80, pos: 0,  color: C.deepPink },
  { label: "risco_composto",     neg: 0,  pos: 65, color: C.pink },
  { label: "Complain",           neg: 0,  pos: 50, color: C.pink },
  { label: "Tenure",             neg: 25, pos: 0,  color: C.purple },
  { label: "IsActiveMember",     neg: 20, pos: 0,  color: C.purple },
  { label: "risco_cliente",      neg: 0,  pos: 38, color: C.deepPink },
  { label: "Gender",             neg: 0,  pos: 28, color: C.deepPink },
  { label: "Age",                neg: 0,  pos: 22, color: C.deepPink },
];

function ShapBar({ s, delay }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), delay + 100); }, [delay]);
  const isNeg = s.neg > 0;
  const pct = isNeg ? s.neg : s.pos;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 160, textAlign: "right", fontSize: 12, color: C.cream, opacity: 0.75, flexShrink: 0 }}>{s.label}</div>
      <div style={{ flex: 1, height: 14, background: "#0d0018", borderRadius: 3, display: "flex", justifyContent: isNeg ? "flex-start" : "flex-end" }}>
        <div style={{
          height: "100%", width: animated ? `${pct}%` : "0%", background: s.color, borderRadius: 3,
          transition: `width 1s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`,
        }} />
      </div>
      <div style={{ width: 16, fontSize: 10, color: C.cream, opacity: 0.35 }}>{isNeg ? "←" : "→"}</div>
    </div>
  );
}

// ─── SECTION DIVIDER ─────────────────────────────────────────────
function SectionDivider({ num, label, refProp }) {
  return (
    <div ref={refProp} style={{ display: "flex", alignItems: "center", gap: 16, padding: "28px 28px 0" }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%", border: `0.5px solid ${C.pink}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: C.pink, flexShrink: 0,
      }}>{num}</div>
      <div style={{ fontSize: 13, color: C.pink, letterSpacing: 2, textTransform: "uppercase", opacity: 0.9, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

// ─── INTRO BANNER ─────────────────────────────────────────────────
function IntroBanner() {
  return (
    <div style={{
      margin: "0 28px 8px",
      padding: "22px 28px",
      background: "linear-gradient(135deg, #0d001a 0%, #130026 60%, #1a0030 100%)",
      borderRadius: 14,
      border: `0.5px solid ${C.border}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 120, height: 120, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.deepPink}22 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: `radial-gradient(circle, ${C.pink} 0%, ${C.deepPink} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, marginTop: 2,
        }}>⚠</div>
        <div>
          <div style={{ fontSize: 13, color: C.pink, fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
            Sobre este dashboard
          </div>
          <div style={{ fontSize: 13, color: C.cream, opacity: 0.75, lineHeight: 1.8, maxWidth: 860 }}>
            Este painel foi desenvolvido para <span style={{ color: C.cream, opacity: 1, fontWeight: 500 }}>identificar padrões comportamentais e perfis de clientes com maior propensão ao cancelamento (churn)</span>, fornecendo ao time de retenção um mapa de risco fundamentado em dados reais. O modelo XGBoost — calibrado com alta sensibilidade — sinaliza clientes em situação de alerta <span style={{ color: C.pink, fontWeight: 500 }}>antes</span> que a saída ocorra, abrindo uma janela estratégica para ações preventivas como contato proativo, ofertas personalizadas e programas de fidelização.
          </div>
          <div style={{ fontSize: 12, color: C.cream, opacity: 0.45, marginTop: 10, lineHeight: 1.6, fontStyle: "italic" }}>
            Importante: as sinalizações geradas não representam certezas absolutas, mas probabilidades estatísticas. A finalidade é orientar decisões de retenção com inteligência e antecedência — não substituir o julgamento humano. Cada cliente sinalizado merece atenção individualizada.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 };
  const [activeTab, setActiveTab] = useState(0);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = C.bg;
    document.body.style.overflowX = "hidden";
  }, []);

  const handleTabClick = (idx) => {
    setActiveTab(idx);
    if (idx === 1 && section2Ref.current) {
      section2Ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (idx === 2 && section3Ref.current) {
      section3Ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (idx === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif", margin: 0, padding: 0 }}>

      {/* ── HEADER ── */}
      <div style={{
        background: C.bg,
        padding: "28px 36px 22px", display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.pink, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6, opacity: 0.9 }}>
            Bank Customer Analytics
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.cream, letterSpacing: -0.5 }}>
            Churn Intelligence Report
          </div>
          <div style={{ fontSize: 14, color: C.cream, opacity: 0.4, marginTop: 4 }}>
            10.000 clientes · XGBoost · ROC-AUC 0.9932
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["2025", C.border], ["Classificação Binária", C.border], ["Churn: 7%", C.pink]].map(([t, bc]) => (
            <div key={t} style={{
              fontSize: 12, padding: "5px 14px", borderRadius: 20,
              border: `0.5px solid ${bc}`, color: bc === C.pink ? C.pink : C.cream,
              opacity: bc === C.pink ? 1 : 0.65,
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* ── NAV TABS ── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 36px", background: C.bg }}>
        {["Análise Bivariada", "Análise Multivariada", "Modelo XGBoost"].map((t, i) => (
          <div
            key={t}
            onClick={() => handleTabClick(i)}
            style={{
              fontSize: 15, color: C.cream, padding: "14px 32px", cursor: "pointer",
              opacity: activeTab === i ? 1 : 0.4,
              borderBottom: activeTab === i ? `2px solid ${C.pink}` : "2px solid transparent",
              transition: "opacity 0.2s",
              userSelect: "none",
            }}
          >{t}</div>
        ))}
      </div>

      {/* ── INTRO BANNER ── */}
      <div style={{ padding: "20px 0 4px" }}>
        <IntroBanner />
      </div>

      {/* ══════════════════════════════════════
          SECTION 1 — ANÁLISE BIVARIADA
      ══════════════════════════════════════ */}
      <SectionDivider num="1" label="Análise Bivariada" />

      <div style={{ padding: "20px 28px" }}>

        {/* Row 1: Churn geral + Gênero */}
        <div style={grid2}>
          <Card>
            <CardTitle>Visão geral do churn</CardTitle>
            <Tooltip text="7% dos clientes saíram (700 de 10.000). Os 93% restantes permaneceram na base. A taxa é baixa mas representa impacto significativo na receita." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[["10.000", "Total clientes", C.purple], ["700", "Churned", C.deepPink]].map(([v, l, bg]) => (
                <div key={l} style={{ background: bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: C.cream }}>{v}</div>
                  <div style={{ fontSize: 10, color: C.cream, opacity: 0.6, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <DonutChart
              segments={[
                { pct: 93, color: C.cream, label: "Não churn — 93%" },
                { pct: 7,  color: C.purple, label: "Churn — 7%" },
              ]}
              centerLabel="93%"
              centerSub="não churn"
            />
          </Card>

          <Card>
            <CardTitle>Distribuição por gênero</CardTitle>
            <Tooltip text="Base com ligeira maioria masculina (5.457 vs 4.543). Porém mulheres têm maior churn absoluto: 400 vs 300, indicando maior vulnerabilidade de saída." />
            <div style={{ marginTop: 4 }}>
              {[
                { label: "Masculino", count: 5457, pct: 54.57, color: C.cream },
                { label: "Feminino",  count: 4543, pct: 45.43, color: C.pink },
              ].map((g, i) => (
                <div key={g.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.cream, opacity: 0.7 }}>{g.label}</span>
                    <span style={{ fontSize: 12, color: C.cream }}>{g.count.toLocaleString("pt-BR")}</span>
                  </div>
                  <div style={{ height: 26, background: "#0d0018", borderRadius: 6, overflow: "hidden" }}>
                    <AnimatedBar width={g.pct} color={g.color} delay={i * 150} />
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 10, marginTop: 2 }}>
                <div style={{ fontSize: 11, color: C.cream, opacity: 0.45, marginBottom: 8 }}>Churn por gênero</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["Masculino", 300, C.purple], ["Feminino", 400, C.deepPink]].map(([l, v, bg]) => (
                    <div key={l} style={{ flex: 1, background: bg, borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 600, color: C.cream }}>{v}</div>
                      <div style={{ fontSize: 10, color: C.cream, opacity: 0.6 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Row 2: Atividade + Reclamações */}
        <div style={grid2}>
          <Card>
            <CardTitle>Saídas por atividade de membro</CardTitle>
            <Tooltip text="67,7% das saídas vieram de clientes não ativos. A taxa de churn entre inativos é mais que o dobro dos ativos. Ativos: 5.390 | Inativos: 4.610." />
            <DonutChart
              segments={[
                { pct: 67.7, color: C.purple, label: "Não ativo — 67,7%" },
                { pct: 32.3, color: C.cream,  label: "Ativo — 32,3%" },
              ]}
              centerLabel="67,7%"
              centerSub="não ativos"
              size={130} stroke={22}
            />
            <div style={{ marginTop: 10, display: "flex", gap: 16, justifyContent: "center" }}>
              {[["5.390", "Ativos"], ["4.610", "Inativos"]].map(([v, l]) => (
                <div key={l} style={{ fontSize: 11, color: C.cream, opacity: 0.4 }}>
                  <span style={{ opacity: 0.9, fontWeight: 500 }}>{v}</span> {l}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Churn com base em reclamações</CardTitle>
            <Tooltip text="61% das saídas vieram de clientes que reclamaram. Reclamação é um dos mais fortes preditores de churn nos dados brutos." />
            <DonutChart
              segments={[
                { pct: 61, color: C.cream,  label: "Reclamou & saiu — 61%" },
                { pct: 39, color: C.purple, label: "Não reclamou — 39%" },
              ]}
              centerLabel="61%"
              centerSub="reclamou"
              size={130} stroke={22}
            />
          </Card>
        </div>

        {/* Row 3: Score de Satisfação + Tenure */}
        <div style={grid2}>
          <Card>
            <CardTitle>Churn por Score de Satisfação</CardTitle>
            <Tooltip text="Score 1 concentra 66,1% do churn. Clientes mais insatisfeitos têm probabilidade dramaticamente maior de sair." />
            <div style={{ marginTop: 4 }}>
              {[
                { label: "Score 1", pct: 66.1, color: C.cream },
                { label: "Score 2", pct: 18.1, color: C.pink },
                { label: "Score 3", pct: 13.4, color: C.pink },
                { label: "Score 4", pct: 1.6,  color: C.purple },
                { label: "Score 5", pct: 0.7,  color: C.purple },
              ].map((s, i) => (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.cream, opacity: 0.7 }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: C.cream, opacity: 0.7 }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 18, background: "#0d0018", borderRadius: 5, overflow: "hidden" }}>
                    <AnimatedBar width={s.pct} color={s.color} delay={i * 100} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Distribuição de Tenure dos Clientes</CardTitle>
            <Tooltip text="48,7% dos clientes têm entre 4-7 anos de relacionamento. Clientes de longa data (8+ anos) representam 31,1% e tendem a ser mais fiéis." />
            <DonutChart
              segments={tenureSegments}
              centerLabel="48,7%"
              centerSub="4-7 anos"
              size={130} stroke={22}
            />
            <div style={{ marginTop: 12, padding: "10px 12px", background: "#130026", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.cream, opacity: 0.5, lineHeight: 1.6 }}>
                Clientes de longa data (8+ anos) representam 31% da base, enquanto novos clientes (0-3 anos) são 20%.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SECTION 2 — ANÁLISE MULTIVARIADA
      ══════════════════════════════════════ */}
      <SectionDivider num="2" label="Análise Multivariada" refProp={section2Ref} />

      <div style={{ padding: "20px 28px" }}>

        {/* Heatmap */}
        <Card style={{ marginBottom: 16 }}>
          <Tooltip text="Combinação de satisfação baixa + reclamação + atividade ativa gera o maior risco de churn (44%). Alta satisfação reduz quase a zero independente dos outros fatores." />
          <HeatmapChart />
        </Card>

        {/* Correlação */}
        <Card>
          <CardTitle>Correlação das variáveis com churn — top 5</CardTitle>
          <Tooltip text="As 5 variáveis com maior correlação com churn. Gradiente branco→rosa→roxo→preto representa intensidade. Satisfaction Score é o maior preditor negativo." />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {corrData.map((item, i) => <CorrelationBar key={item.label} item={item} delay={i * 120} />)}
            <div style={{ width: "90%", display: "flex", alignItems: "center", gap: 8, margin: "6px auto 0" }}>
              <div style={{ width: 150 }} />
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.cream, opacity: 0.35 }}>negativo</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: "linear-gradient(90deg,#000004,#3b0f70,#e04d7a,#fcfdbf)" }} />
                <span style={{ fontSize: 10, color: C.cream, opacity: 0.35 }}>positivo</span>
              </div>
              <div style={{ width: 50 }} />
            </div>
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════
          SECTION 3 — MODELO XGBOOST
      ══════════════════════════════════════ */}
      <SectionDivider num="3" label="Modelo XGBoost" refProp={section3Ref} />

      <div style={{ padding: "20px 28px" }}>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Acurácia",     val: 96,     suffix: "%", dec: 0, tip: "O modelo acerta 96% de todas as previsões no conjunto de teste." },
            { label: "ROC-AUC",      val: 0.9932, suffix: "",  dec: 4, tip: "Capacidade de separar churns de não-churns. Próximo de 1 = quase perfeito." },
            { label: "Recall Churn", val: 97,     suffix: "%", dec: 0, tip: "O modelo captura 97% de todos os clientes que realmente saem.", highlight: true },
            { label: "F1 Classe 1",  val: 0.78,   suffix: "",  dec: 2, tip: "Equilíbrio entre precisão e recall na classe churn." },
          ].map((m) => (
            <div key={m.label} style={{
              background: m.highlight ? C.deepPink : C.purple,
              borderRadius: 10, padding: "14px 12px", textAlign: "center",
              border: m.highlight ? `0.5px solid ${C.pink}` : "none",
              position: "relative",
            }}>
              <Tooltip text={m.tip} />
              <div style={{ fontSize: 26, fontWeight: 600, color: C.cream }}>
                <AnimatedNumber target={m.val} decimals={m.dec} suffix={m.suffix} />
              </div>
              <div style={{ fontSize: 11, color: C.cream, opacity: 0.55, marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Report + Confusion */}
        <div style={grid2}>
          <Card>
            <CardTitle>Relatório de classificação</CardTitle>
            <Tooltip text="Recall de 97% na classe churn: identifica quase todos os clientes que vão sair — crucial para ações preventivas." />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{["Classe","Precision","Recall","F1","Suporte"].map(h => (
                  <th key={h} style={{ color: C.cream, opacity: 0.4, fontWeight: 400, textAlign: h === "Classe" ? "left" : "center", padding: "4px 6px", borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {[
                  { cls: "0 — Ficou", bg: C.cream,      txt: C.black, prec:"1.00", rec:"0.96", f1:"0.98", sup:"2.765", hi: false },
                  { cls: "1 — Churn", bg: C.pink,       txt: C.cream, prec:"0.65", rec:"0.97", f1:"0.78", sup:"235",   hi: true  },
                  { cls: "Weighted",  bg:"transparent", txt: C.cream, prec:"0.97", rec:"0.96", f1:"0.96", sup:"3.000", hi: false, dim: true },
                ].map(r => (
                  <tr key={r.cls} style={{ opacity: r.dim ? 0.4 : 1 }}>
                    <td style={{ padding: "7px 6px" }}>
                      <span style={{ background: r.bg, color: r.txt, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 500, border: r.bg === "transparent" ? `0.5px solid ${C.border}` : "none" }}>{r.cls}</span>
                    </td>
                    {[r.prec, r.rec, r.f1, r.sup].map((v, j) => (
                      <td key={j} style={{ padding: "7px 6px", textAlign: "center", color: r.hi && j === 1 ? C.pink : C.cream, fontWeight: r.hi && j === 1 ? 600 : 400, fontSize: r.hi && j === 1 ? 13 : 12 }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 14, padding: "10px 12px", background: "#130026", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: C.pink, fontWeight: 500, marginBottom: 4 }}>Threshold adaptável</div>
              <div style={{ fontSize: 11, color: C.cream, opacity: 0.6, lineHeight: 1.6 }}>
                Valores menores (ex: 0.3) aumentam a sensibilidade — ideais para capturar o máximo de churns em estratégias preventivas.
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Matriz de confusão</CardTitle>
            <Tooltip text="2642 corretamente identificados como não-churn. 228 churns capturados. Apenas 7 churns perdidos — recall altíssimo." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
              {[
                { val: 2642, label: "Verdadeiro Neg.", bg: C.cream,   txt: C.black },
                { val: 123,  label: "Falso Positivo",  bg: C.purple,  txt: C.cream },
                { val: 7,    label: "Falso Negativo",  bg: "#0a0014", txt: C.pink, border: `0.5px solid ${C.pink}` },
                { val: 228,  label: "Verdadeiro Pos.", bg: C.pink,    txt: C.cream },
              ].map((c) => (
                <div key={c.label} style={{ background: c.bg, borderRadius: 8, padding: "14px 10px", textAlign: "center", border: c.border || "none" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: c.txt }}>{c.val.toLocaleString("pt-BR")}</div>
                  <div style={{ fontSize: 10, color: c.txt, opacity: 0.6, marginTop: 3 }}>{c.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: 10, color: C.cream, opacity: 0.35, textAlign: "center", marginTop: 5 }}>
              <div>Previsto: 0</div><div>Previsto: 1</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {[["96,3%","Especificidade",C.border],["97,0%","Sensibilidade",C.pink],["3,0%","FPR",C.border]].map(([v,l,bc]) => (
                <div key={l} style={{ flex: 1, background: "#130026", borderRadius: 6, padding: "6px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: bc === C.pink ? C.pink : C.cream }}>{v}</div>
                  <div style={{ fontSize: 10, color: C.cream, opacity: 0.45 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* SHAP */}
        <Card>
          <CardTitle>SHAP — Importância das variáveis (top 8)</CardTitle>
          <Tooltip text="Valores positivos aumentam a probabilidade de churn. Negativos reduzem. Satisfaction Score é o maior protetor — alta satisfação reduz fortemente o risco." />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {shapData.map((s, i) => <ShapBar key={s.label} s={s} delay={i * 80} />)}
            <div style={{ display: "flex", gap: 16, marginTop: 6, paddingLeft: 172 }}>
              {[[C.deepPink,"Reduz churn"],[C.pink,"Aumenta churn"],[C.purple,"Protetor moderado"]].map(([c,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.cream, opacity: 0.65 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: C.cream, opacity: 0.2, letterSpacing: 1 }}>CHURN ANALYTICS · XGBOOST · 2025</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[C.pink, C.purple, C.cream].map((c, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c, opacity: i === 2 ? 0.3 : 0.7 }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.cream, opacity: 0.2, letterSpacing: 1 }}>Bank Customer Analytics</div>
      </div>
    </div>
  );
}