import React, { useState, useEffect, useRef } from "react";
import { Sprout, TrendingUp, Wallet, Coins, Plus, Flame, Award, Heart, X, Sparkles, Leaf, Target, Pencil } from "lucide-react";

const STORAGE_KEY = "money-garden-v1";

const WISDOM = [
  "A penny saved is a tree planted.",
  "Your future self is watching.",
  "Small drops fill the ocean.",
  "Compound interest is the eighth wonder.",
  "Spend on needs, invest in dreams.",
  "Patience pays dividends.",
  "Wealth whispers, debt shouts.",
  "Every save is a vote for tomorrow.",
];

const SPEND_PROMPTS = [
  "Will this matter in a month?",
  "Your garden is thriving — sure?",
  "Could this become an investment instead?",
  "Want vs. need — which is it?",
  "Your plant is watching...",
];

export default function MoneyGarden() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type, ... }
  const [celebration, setCelebration] = useState(null);
  const [wisdom, setWisdom] = useState(WISDOM[0]);
  const [breath, setBreath] = useState(0);

  // Load from persistent storage
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          setData(ensureGoals(JSON.parse(res.value)));
        } else {
          setData(initialData());
        }
      } catch {
        setData(initialData());
      }
      setLoading(false);
    })();
  }, []);

  // Rotate wisdom slowly so it's readable
  useEffect(() => {
    const i = setInterval(() => {
      setWisdom(WISDOM[Math.floor(Math.random() * WISDOM.length)]);
    }, 28000);
    return () => clearInterval(i);
  }, []);

  // Breathing animation for plant
  useEffect(() => {
    const i = setInterval(() => setBreath((b) => (b + 1) % 360), 50);
    return () => clearInterval(i);
  }, []);

  function initialData() {
    return {
      wallet: 0,
      savings: 0,
      investments: 0,
      totalIncome: 0,
      totalSpent: 0,
      transactions: [],
      streak: 0,
      lastSaveDate: null,
      achievements: [],
      goals: { income: null, savings: null, investments: null, expenses: null },
    };
  }

  function ensureGoals(d) {
    // backfill for previously-saved data without goals
    if (!d.goals) d.goals = { income: null, savings: null, investments: null, expenses: null };
    return d;
  }

  async function persist(newData) {
    setData(newData);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("Save failed", e);
    }
  }

  function checkAchievements(d) {
    const earned = [...d.achievements];
    const add = (id, name, emoji) => {
      if (!earned.find((a) => a.id === id)) {
        earned.push({ id, name, emoji, date: new Date().toISOString() });
        setCelebration({ type: "achievement", name, emoji });
        setTimeout(() => setCelebration(null), 3500);
      }
    };
    if (d.savings >= 100) add("save-100", "First Sprout", "🌱");
    if (d.savings >= 1000) add("save-1k", "Green Thumb", "🌿");
    if (d.savings >= 10000) add("save-10k", "Forest Keeper", "🌳");
    if (d.investments >= 500) add("inv-500", "Seed Investor", "🌰");
    if (d.investments >= 5000) add("inv-5k", "Tree Tycoon", "🍎");
    if (d.streak >= 7) add("streak-7", "Week Warrior", "🔥");
    if (d.streak >= 30) add("streak-30", "Month Master", "👑");

    // Goal-based achievements
    const goalChecks = [
      { key: "income", current: d.totalIncome, label: "Income Goal", emoji: "☀️" },
      { key: "savings", current: d.savings, label: "Savings Goal", emoji: "🎯" },
      { key: "investments", current: d.investments, label: "Investment Goal", emoji: "🌟" },
    ];
    for (const c of goalChecks) {
      const g = d.goals?.[c.key];
      if (g && g.amount > 0 && c.current >= g.amount && !g.achievedAt) {
        g.achievedAt = new Date().toISOString();
        add(`goal-${c.key}-${g.amount}`, `${c.label} Hit!`, c.emoji);
      }
    }
    return earned;
  }

  async function setGoal(type, amount) {
    const d = ensureGoals({ ...data });
    const amt = parseFloat(amount);
    d.goals = { ...d.goals };
    d.goals[type] = amt > 0 ? { amount: amt, achievedAt: null } : null;
    d.achievements = checkAchievements(d);
    await persist(d);
    setModal(null);
  }

  function submitTransaction(type, amount, description) {
    if (!amount || amount <= 0) return;
    const amt = parseFloat(amount);
    const today = new Date().toDateString();
    let d = { ...data };
    d.transactions = [
      { id: Date.now(), type, amount: amt, description: description || labelFor(type), date: new Date().toISOString() },
      ...d.transactions,
    ].slice(0, 50);

    if (type === "income") {
      d.wallet += amt;
      d.totalIncome += amt;
      setCelebration({ type: "income", amount: amt });
    } else if (type === "savings") {
      d.wallet -= amt;
      d.savings += amt;
      if (d.lastSaveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        d.streak = d.lastSaveDate === yesterday ? d.streak + 1 : 1;
        d.lastSaveDate = today;
      }
      setCelebration({ type: "savings", amount: amt });
    } else if (type === "investment") {
      d.wallet -= amt;
      d.investments += amt;
      setCelebration({ type: "investment", amount: amt });
    } else if (type === "expense") {
      d.wallet -= amt;
      d.totalSpent += amt;
      setCelebration({ type: "expense", amount: amt });
    }

    d.achievements = checkAchievements(d);
    persist(d);
    setModal(null);
    setTimeout(() => setCelebration((c) => (c?.type === "achievement" ? c : null)), 2200);
  }

  function labelFor(type) {
    return { income: "Income", savings: "Saved", investment: "Invested", expense: "Spent" }[type];
  }

  async function resetGarden() {
    if (confirm("Reset your garden? All data will be lost.")) {
      await persist(initialData());
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF6EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#2C5F2D" }}>growing your garden...</div>
      </div>
    );
  }

  const netWorth = data.wallet + data.savings + data.investments;
  const totalGrowth = data.savings + data.investments;
  // Growth level 0-10 based on savings + investments
  const growthLevel = Math.min(10, Math.floor(Math.log10(totalGrowth + 1) * 2.5));
  const savingsRate = data.totalIncome > 0 ? ((data.savings + data.investments) / data.totalIncome) * 100 : 0;

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,500&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes float-up { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-120px) scale(1.2); opacity: 0; } }
        @keyframes float-down { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(140px) rotate(360deg); opacity: 0; } }
        @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes ray-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pop-in { 0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @keyframes slide-in { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse-soft { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        .swaying { animation: sway 4s ease-in-out infinite; transform-origin: bottom center; }
        .sparkle { animation: sparkle 1.5s ease-in-out infinite; }
        .pulse-soft { animation: pulse-soft 2.5s ease-in-out infinite; }
        button { font-family: 'Nunito', sans-serif; cursor: pointer; border: none; transition: all 0.2s ease; }
        button:hover { transform: translateY(-2px); }
        button:active { transform: translateY(0); }
        .grain::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>

      <div style={styles.container}>
        {/* HEADER */}
        <header style={styles.header}>
          <div>
            <div style={styles.logo}>
              <Sprout size={28} strokeWidth={2.5} color="#2C5F2D" />
              <h1 style={styles.title}>Money Garden</h1>
            </div>
            <p style={styles.tagline}>{wisdom}</p>
          </div>
          <button onClick={resetGarden} style={styles.resetBtn}>reset</button>
        </header>

        {/* STATS BAR */}
        <div style={styles.statsBar}>
          <StatCard label="net worth" value={`R${netWorth.toFixed(2)}`} icon={<Coins size={18} />} color="#2C5F2D" big />
          <StatCard label="wallet" value={`R${data.wallet.toFixed(2)}`} icon={<Wallet size={16} />} color="#8B7355" />
          <StatCard label="savings" value={`R${data.savings.toFixed(2)}`} icon={<Sprout size={16} />} color="#97BC62" />
          <StatCard label="investments" value={`R${data.investments.toFixed(2)}`} icon={<TrendingUp size={16} />} color="#D49A4F" />
          <StatCard label="streak" value={`${data.streak} day${data.streak !== 1 ? "s" : ""}`} icon={<Flame size={16} />} color="#C65D2E" />
        </div>

        {/* MAIN GRID */}
        <div style={styles.mainGrid}>
          {/* GARDEN */}
          <div style={styles.gardenCard} className="grain">
            <Garden level={growthLevel} investments={data.investments} breath={breath} celebration={celebration} />

            <div style={styles.gardenFooter}>
              <div style={styles.growthLabel}>
                <Leaf size={14} color="#2C5F2D" />
                <span>growth level {growthLevel}/10</span>
                <span style={{ color: "#8B7355", marginLeft: 12 }}>· save rate {savingsRate.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={styles.sidebar}>
            {/* ACTIONS */}
            <div style={styles.actionsCard}>
              <h3 style={styles.cardTitle}>move money</h3>
              <div style={styles.actionGrid}>
                <ActionBtn label="income" sub="money in" color="#F5E6C8" textColor="#8B6914" onClick={() => setModal({ type: "income" })} />
                <ActionBtn label="save" sub="grow it" color="#D4E4B8" textColor="#2C5F2D" onClick={() => setModal({ type: "savings" })} primary />
                <ActionBtn label="invest" sub="plant it" color="#F0D9A8" textColor="#8B5A1F" onClick={() => setModal({ type: "investment" })} primary />
                <ActionBtn label="spend" sub="money out" color="#EBD4CC" textColor="#8B3A1F" onClick={() => setModal({ type: "expense" })} />
              </div>
            </div>

            {/* GOALS */}
            <GoalsCard
              goals={data.goals}
              current={{
                income: data.totalIncome,
                savings: data.savings,
                investments: data.investments,
                expenses: data.totalSpent,
              }}
              onEdit={(goalType) => setModal({ type: "goal", goalType })}
            />

            {/* ACHIEVEMENTS */}
            {data.achievements.length > 0 && (
              <div style={styles.achievementsCard}>
                <h3 style={styles.cardTitle}><Award size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />badges</h3>
                <div style={styles.achievementsGrid}>
                  {data.achievements.map((a) => (
                    <div key={a.id} style={styles.badge} title={a.name}>
                      <span style={{ fontSize: 22 }}>{a.emoji}</span>
                      <span style={styles.badgeName}>{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RECENT */}
            <div style={styles.recentCard}>
              <h3 style={styles.cardTitle}>recent activity</h3>
              {data.transactions.length === 0 ? (
                <p style={styles.empty}>no transactions yet — plant your first seed</p>
              ) : (
                <div style={styles.transactionList}>
                  {data.transactions.slice(0, 8).map((t) => (
                    <div key={t.id} style={styles.transaction}>
                      <div style={{ ...styles.txnDot, background: txnColor(t.type) }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.txnDesc}>{t.description}</div>
                        <div style={styles.txnDate}>{formatDate(t.date)}</div>
                      </div>
                      <div style={{ ...styles.txnAmount, color: txnColor(t.type) }}>
                        {t.type === "expense" || t.type === "savings" || t.type === "investment" ? "−" : "+"}R{t.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal?.type === "goal" && (
        <GoalModal
          goalType={modal.goalType}
          currentGoal={data.goals?.[modal.goalType]?.amount || ""}
          onSave={setGoal}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal.type !== "goal" && (
        <TransactionModal type={modal.type} onSubmit={submitTransaction} onClose={() => setModal(null)} wallet={data.wallet} />
      )}
      {celebration && celebration.type !== "achievement" && <FloatingFeedback celebration={celebration} />}
      {celebration?.type === "achievement" && <AchievementPopup achievement={celebration} />}
    </div>
  );
}

function txnColor(type) {
  return { income: "#8B6914", savings: "#2C5F2D", investment: "#8B5A1F", expense: "#8B3A1F" }[type];
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatCard({ label, value, icon, color, big }) {
  return (
    <div style={{ ...styles.statCard, ...(big ? styles.statCardBig : {}) }}>
      <div style={{ ...styles.statIcon, color }}>{icon}</div>
      <div>
        <div style={{ ...styles.statLabel, color }}>{label}</div>
        <div style={{ ...styles.statValue, fontSize: big ? 26 : 18, color: "#1A2B1A" }}>{value}</div>
      </div>
    </div>
  );
}

function ActionBtn({ label, sub, color, textColor, onClick, primary }) {
  return (
    <button onClick={onClick} style={{ ...styles.actionBtn, background: color, color: textColor, boxShadow: primary ? `0 4px 0 ${shade(color, -10)}` : `0 3px 0 ${shade(color, -10)}` }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, lineHeight: 1 }}>{label}</div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, letterSpacing: 0.3 }}>{sub}</div>
    </button>
  );
}

function shade(hex, percent) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (n & 0xff) + percent));
  return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
}

// === GARDEN VISUALIZATION ===
function Garden({ level, investments, breath, celebration }) {
  const breathScale = 1 + Math.sin((breath * Math.PI) / 180) * 0.012;
  const treeCount = Math.min(5, Math.floor(investments / 500));

  return (
    <div style={{ position: "relative", width: "100%", height: 420, overflow: "hidden", borderRadius: 18 }}>
      {/* Sky gradient */}
      <svg viewBox="0 0 800 420" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4E5C1" />
            <stop offset="60%" stopColor="#F8DCC0" />
            <stop offset="100%" stopColor="#E8C9A8" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8B87A" />
            <stop offset="100%" stopColor="#7A8B5A" />
          </linearGradient>
          <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#F9D77E" />
            <stop offset="70%" stopColor="#E8B864" />
            <stop offset="100%" stopColor="#D49A4F" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="800" height="420" fill="url(#sky)" />

        {/* Sun */}
        <g style={{ animation: "ray-spin 60s linear infinite", transformOrigin: "650px 90px" }}>
          {[...Array(8)].map((_, i) => (
            <line key={i} x1="650" y1="90" x2={650 + Math.cos((i * Math.PI) / 4) * 65} y2={90 + Math.sin((i * Math.PI) / 4) * 65} stroke="#E8B864" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          ))}
        </g>
        <circle cx="650" cy="90" r="38" fill="url(#sun)" />
        <circle cx="650" cy="90" r="28" fill="#F9D77E" opacity="0.9" />

        {/* Distant hills */}
        <ellipse cx="200" cy="340" rx="280" ry="60" fill="#9BA876" opacity="0.5" />
        <ellipse cx="600" cy="345" rx="320" ry="55" fill="#8B9866" opacity="0.6" />

        {/* Investment trees in background */}
        {[...Array(treeCount)].map((_, i) => {
          const x = 80 + i * 140 + (i % 2) * 30;
          const y = 320;
          const size = 0.7 + (i % 3) * 0.15;
          return <Tree key={i} x={x} y={y} size={size} />;
        })}

        {/* Ground */}
        <path d="M 0 340 Q 400 320 800 340 L 800 420 L 0 420 Z" fill="url(#ground)" />

        {/* Grass tufts */}
        {[...Array(12)].map((_, i) => {
          const x = 30 + i * 65;
          const grassHeight = 4 + (i % 3) * 2;
          return (
            <g key={i}>
              <line x1={x} y1="345" x2={x} y2={345 - grassHeight} stroke="#5C7240" strokeWidth="1.5" strokeLinecap="round" />
              <line x1={x + 3} y1="345" x2={x + 3} y2={345 - grassHeight + 1} stroke="#5C7240" strokeWidth="1.5" strokeLinecap="round" />
              <line x1={x - 3} y1="345" x2={x - 3} y2={345 - grassHeight + 1} stroke="#5C7240" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Main plant in pot */}
        <g transform={`translate(400, 345) scale(${breathScale})`}>
          <MainPlant level={level} />
        </g>

        {/* Pot */}
        <g transform="translate(400, 340)">
          <path d="M -45 0 L 45 0 L 38 55 L -38 55 Z" fill="#A0612C" />
          <path d="M -45 0 L 45 0 L 42 8 L -42 8 Z" fill="#8B4513" />
          <ellipse cx="0" cy="0" rx="45" ry="6" fill="#6B3410" />
          {/* Pot highlight */}
          <path d="M -35 5 L -32 50" stroke="#B8753A" strokeWidth="2" opacity="0.6" />
        </g>

        {/* Floating leaves animation when celebration is expense */}
        {celebration?.type === "expense" && [...Array(6)].map((_, i) => (
          <circle key={i} cx={380 + i * 8} cy={200 + i * 5} r="4" fill="#8B7355" style={{ animation: `float-down ${1.5 + i * 0.2}s ease-in forwards`, animationDelay: `${i * 0.1}s`, transformOrigin: `${380 + i * 8}px ${200 + i * 5}px` }} />
        ))}
      </svg>
    </div>
  );
}

function MainPlant({ level }) {
  // level 0-10 controls how grown the plant is
  // Build plant in stages
  if (level === 0) {
    // Just a seed in the dirt
    return (
      <g>
        <ellipse cx="0" cy="-2" rx="6" ry="4" fill="#6B4423" />
        <ellipse cx="0" cy="-3" rx="4" ry="2" fill="#8B5A2B" />
      </g>
    );
  }

  const stemHeight = 20 + level * 15; // up to 170
  const stemTop = -stemHeight;

  return (
    <g className="swaying">
      {/* Stem */}
      <path d={`M -3 0 Q ${-1 + level * 0.3} ${-stemHeight / 2} 0 ${stemTop} Q ${1 - level * 0.3} ${-stemHeight / 2} 3 0 Z`} fill="#5C7240" />

      {/* Leaves - add more as level grows */}
      {level >= 1 && <Leaf2 x={0} y={stemTop + 15} rot={-25} size={0.8} />}
      {level >= 2 && <Leaf2 x={0} y={stemTop + 25} rot={30} size={1} flip />}
      {level >= 3 && <Leaf2 x={0} y={stemTop + 45} rot={-35} size={1.1} />}
      {level >= 4 && <Leaf2 x={0} y={stemTop + 60} rot={35} size={1.2} flip />}
      {level >= 5 && <Leaf2 x={0} y={stemTop + 80} rot={-30} size={1.3} />}
      {level >= 6 && <Leaf2 x={0} y={stemTop + 100} rot={32} size={1.4} flip />}

      {/* Flowers/fruits at higher levels */}
      {level >= 4 && (
        <g transform={`translate(0, ${stemTop - 5})`}>
          <Flower color="#E8A1A1" />
        </g>
      )}
      {level >= 6 && (
        <>
          <g transform={`translate(-18, ${stemTop + 10})`}>
            <Flower color="#F4C28E" small />
          </g>
          <g transform={`translate(18, ${stemTop + 10})`}>
            <Flower color="#D49A4F" small />
          </g>
        </>
      )}
      {level >= 8 && (
        <>
          <g transform={`translate(-25, ${stemTop + 35})`}>
            <Flower color="#E8B4A6" small />
          </g>
          <g transform={`translate(25, ${stemTop + 35})`}>
            <Flower color="#C9A88E" small />
          </g>
        </>
      )}
      {/* Sparkles at max level */}
      {level >= 9 && (
        <>
          <g transform={`translate(-40, ${stemTop + 20})`} className="sparkle">
            <Sparkle />
          </g>
          <g transform={`translate(40, ${stemTop - 10})`} className="sparkle" style={{ animationDelay: "0.5s" }}>
            <Sparkle />
          </g>
          <g transform={`translate(0, ${stemTop - 25})`} className="sparkle" style={{ animationDelay: "1s" }}>
            <Sparkle />
          </g>
        </>
      )}
    </g>
  );
}

function Leaf2({ x, y, rot, size, flip }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${size}${flip ? ", " + size : ""})`}>
      <path d="M 0 0 Q 15 -8 25 0 Q 15 8 0 0 Z" fill="#7AA055" />
      <path d="M 0 0 Q 12 -5 22 0" stroke="#5C7240" strokeWidth="0.8" fill="none" />
    </g>
  );
}

function Flower({ color, small }) {
  const r = small ? 5 : 8;
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * 72 - 90) * (Math.PI / 180);
        return <circle key={i} cx={Math.cos(angle) * r} cy={Math.sin(angle) * r} r={r * 0.8} fill={color} opacity="0.9" />;
      })}
      <circle cx="0" cy="0" r={r * 0.6} fill="#F9D77E" />
    </g>
  );
}

function Sparkle() {
  return (
    <g>
      <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#F9D77E" />
    </g>
  );
}

function Tree({ x, y, size }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${size})`}>
      <rect x="-4" y="-30" width="8" height="35" fill="#6B4423" rx="2" />
      <circle cx="0" cy="-45" r="22" fill="#7AA055" />
      <circle cx="-12" cy="-38" r="15" fill="#8AB565" />
      <circle cx="12" cy="-38" r="15" fill="#8AB565" />
      <circle cx="0" cy="-55" r="14" fill="#8AB565" />
      {/* Fruits */}
      <circle cx="-8" cy="-45" r="3" fill="#D49A4F" />
      <circle cx="10" cy="-50" r="3" fill="#C65D2E" />
      <circle cx="5" cy="-38" r="3" fill="#D49A4F" />
    </g>
  );
}

// === TRANSACTION MODAL ===
function TransactionModal({ type, onSubmit, onClose, wallet }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const config = {
    income: { title: "Money in", emoji: "☀️", color: "#F5E6C8", border: "#D49A4F", text: "#8B6914", placeholder: "salary, gift, sale..." },
    savings: { title: "Move to savings", emoji: "🌱", color: "#D4E4B8", border: "#5C7240", text: "#2C5F2D", placeholder: "rainy day, future me..." },
    investment: { title: "Plant an investment", emoji: "🌳", color: "#F0D9A8", border: "#A0612C", text: "#8B5A1F", placeholder: "stocks, index fund, ETF..." },
    expense: { title: "Spend money", emoji: "💸", color: "#EBD4CC", border: "#8B3A1F", text: "#8B3A1F", placeholder: "groceries, coffee, bill..." },
  }[type];

  const amt = parseFloat(amount) || 0;
  const isLargeExpense = type === "expense" && amt > 50;
  const exceedsWallet = (type === "expense" || type === "savings" || type === "investment") && amt > wallet;

  function handleSubmit() {
    if (isLargeExpense && !confirming) {
      setConfirming(true);
      return;
    }
    onSubmit(type, amount, description);
  }

  const projection = type === "expense" && amt > 0 ? Math.round(amt * Math.pow(1.07, 10)) : 0;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, borderColor: config.border, animation: "pop-in 0.3s ease-out" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        <div style={{ fontSize: 44, textAlign: "center", marginBottom: 8 }}>{config.emoji}</div>
        <h2 style={{ ...styles.modalTitle, color: config.text }}>{config.title}</h2>

        <div style={styles.inputGroup}>
          <label style={styles.label}>amount</label>
          <div style={styles.amountWrap}>
            <span style={styles.dollarSign}>R</span>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setConfirming(false); }}
              placeholder="0.00"
              style={{ ...styles.amountInput, borderColor: config.border }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>what for? (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={config.placeholder}
            style={{ ...styles.textInput, borderColor: config.border }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {exceedsWallet && (
          <div style={styles.warning}>
            ⚠️ this exceeds your wallet (R{wallet.toFixed(2)})
          </div>
        )}

        {isLargeExpense && (
          <div style={styles.spendPrompt}>
            <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, marginBottom: 8 }}>
              "{SPEND_PROMPTS[Math.floor(Math.random() * SPEND_PROMPTS.length)]}"
            </div>
            {projection > amt && (
              <div style={styles.projection}>
                <Sparkles size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                if invested instead, this R{amt.toFixed(0)} could grow to <strong>~R{projection.toLocaleString()}</strong> in 10 years (at 7%)
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!amt || exceedsWallet}
          style={{
            ...styles.submitBtn,
            background: !amt || exceedsWallet ? "#D8D0C0" : config.border,
            cursor: !amt || exceedsWallet ? "not-allowed" : "pointer",
          }}
        >
          {confirming ? "yes, I'm sure — spend it" : type === "income" ? "add income" : type === "savings" ? "grow my garden" : type === "investment" ? "plant the seed" : "confirm spend"}
        </button>
      </div>
    </div>
  );
}

// === GOALS CARD ===
const GOAL_CONFIG = {
  income:      { label: "income",      emoji: "☀️", color: "#D49A4F", track: "#F5E6C8", direction: "up", help: "money you want to earn" },
  savings:     { label: "savings",     emoji: "🌱", color: "#5C7240", track: "#D4E4B8", direction: "up", help: "money you want to grow" },
  investments: { label: "investments", emoji: "🌳", color: "#8B5A1F", track: "#F0D9A8", direction: "up", help: "money you want to plant" },
  expenses:    { label: "spending cap", emoji: "🍂", color: "#8B3A1F", track: "#EBD4CC", direction: "down", help: "stay below this amount" },
};

function GoalsCard({ goals, current, onEdit }) {
  const types = ["savings", "investments", "income", "expenses"];
  return (
    <div style={styles.actionsCard}>
      <h3 style={styles.cardTitle}>
        <Target size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
        your targets
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {types.map((type) => {
          const cfg = GOAL_CONFIG[type];
          const g = goals?.[type];
          const cur = current[type] || 0;
          return (
            <GoalRow key={type} type={type} cfg={cfg} goal={g} current={cur} onEdit={() => onEdit(type)} />
          );
        })}
      </div>
    </div>
  );
}

function GoalRow({ type, cfg, goal, current, onEdit }) {
  const hasGoal = goal && goal.amount > 0;
  const pct = hasGoal ? Math.min(100, (current / goal.amount) * 100) : 0;
  const isExpenseOver = cfg.direction === "down" && hasGoal && current > goal.amount;
  const isAchieved = cfg.direction === "up" && hasGoal && current >= goal.amount;
  const barColor = isExpenseOver ? "#C65D2E" : isAchieved ? "#5C7240" : cfg.color;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A2B1A", letterSpacing: 0.2 }}>{cfg.label}</span>
          {isAchieved && <span style={{ fontSize: 10, color: "#5C7240", fontWeight: 800, letterSpacing: 0.8 }}>✓ HIT</span>}
          {isExpenseOver && <span style={{ fontSize: 10, color: "#C65D2E", fontWeight: 800, letterSpacing: 0.8 }}>! OVER</span>}
        </div>
        <button onClick={onEdit} style={styles.editGoalBtn} title="edit goal">
          <Pencil size={11} />
        </button>
      </div>
      {hasGoal ? (
        <>
          <div style={{ ...styles.progressTrack, background: cfg.track }}>
            <div style={{ ...styles.progressFill, width: `${pct}%`, background: barColor }} />
          </div>
          <div style={styles.progressLabel}>
            <span style={{ color: barColor, fontWeight: 700 }}>R{formatMoney(current)}</span>
            <span style={{ color: "#A89B7C" }}> / R{formatMoney(goal.amount)}</span>
            <span style={{ color: "#A89B7C", marginLeft: 6 }}>· {pct.toFixed(0)}%</span>
          </div>
        </>
      ) : (
        <button onClick={onEdit} style={styles.setGoalBtn}>+ set a goal — {cfg.help}</button>
      )}
    </div>
  );
}

function formatMoney(n) {
  if (n >= 10000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toFixed(2);
}

// === GOAL MODAL ===
function GoalModal({ goalType, currentGoal, onSave, onClose }) {
  const [amount, setAmount] = useState(currentGoal ? String(currentGoal) : "");
  const inputRef = useRef(null);
  const cfg = GOAL_CONFIG[goalType];

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  function handleSave() {
    onSave(goalType, amount);
  }

  function handleClear() {
    onSave(goalType, 0);
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, borderColor: cfg.color, animation: "pop-in 0.3s ease-out" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        <div style={{ fontSize: 44, textAlign: "center", marginBottom: 8 }}>{cfg.emoji}</div>
        <h2 style={{ ...styles.modalTitle, color: cfg.color }}>
          {cfg.direction === "down" ? "set a spending cap" : `${cfg.label} goal`}
        </h2>
        <p style={{ textAlign: "center", color: "#7A8B5A", fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 14, marginTop: -8, marginBottom: 18 }}>
          {cfg.direction === "down" ? "we'll warn you when you're getting close" : "we'll celebrate when you reach it"}
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>target amount</label>
          <div style={styles.amountWrap}>
            <span style={styles.dollarSign}>R</span>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{ ...styles.amountInput, borderColor: cfg.color }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!amount || parseFloat(amount) <= 0}
          style={{
            ...styles.submitBtn,
            background: !amount || parseFloat(amount) <= 0 ? "#D8D0C0" : cfg.color,
            cursor: !amount || parseFloat(amount) <= 0 ? "not-allowed" : "pointer",
          }}
        >
          {currentGoal ? "update goal" : "set goal"}
        </button>

        {currentGoal > 0 && (
          <button onClick={handleClear} style={styles.clearGoalBtn}>
            remove this goal
          </button>
        )}
      </div>
    </div>
  );
}

// === FLOATING FEEDBACK ===
function FloatingFeedback({ celebration }) {
  const config = {
    income: { emoji: "☀️", text: `+R${celebration.amount?.toFixed(2)}`, color: "#8B6914" },
    savings: { emoji: "🌱", text: `saved R${celebration.amount?.toFixed(2)}`, color: "#2C5F2D" },
    investment: { emoji: "🌳", text: `planted R${celebration.amount?.toFixed(2)}`, color: "#8B5A1F" },
    expense: { emoji: "🍂", text: `spent R${celebration.amount?.toFixed(2)}`, color: "#8B3A1F" },
  }[celebration.type];
  if (!config) return null;
  return (
    <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)", zIndex: 100, animation: "float-up 2s ease-out forwards", pointerEvents: "none" }}>
      <div style={{ background: "white", padding: "16px 28px", borderRadius: 999, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: config.color, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 32 }}>{config.emoji}</span>
        {config.text}
      </div>
    </div>
  );
}

function AchievementPopup({ achievement }) {
  return (
    <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 100, animation: "slide-in 0.4s ease-out", background: "linear-gradient(135deg, #F9D77E, #E8B864)", padding: "16px 24px", borderRadius: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 16, border: "2px solid #D49A4F" }}>
      <span style={{ fontSize: 40 }}>{achievement.emoji}</span>
      <div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, letterSpacing: 1.5, color: "#8B6914", fontWeight: 700, textTransform: "uppercase" }}>badge earned</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#5C4A1A" }}>{achievement.name}</div>
      </div>
    </div>
  );
}

// === STYLES ===
const styles = {
  app: { minHeight: "100vh", background: "linear-gradient(180deg, #FAF6EC 0%, #F4EBD8 100%)", fontFamily: "'Nunito', sans-serif", color: "#1A2B1A", padding: "24px 20px", position: "relative" },
  container: { maxWidth: 1180, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  title: { fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 800, color: "#2C5F2D", margin: 0, letterSpacing: -1 },
  tagline: { fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, color: "#7A8B5A", margin: 0, marginTop: 4 },
  resetBtn: { background: "transparent", border: "1px solid #C9BEA0", color: "#8B7355", padding: "8px 14px", borderRadius: 999, fontSize: 12, letterSpacing: 0.5 },
  statsBar: { display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 },
  statCard: { background: "white", padding: "14px 18px", borderRadius: 14, display: "flex", alignItems: "center", gap: 12, border: "1px solid #EFE6D2", boxShadow: "0 1px 0 rgba(0,0,0,0.02)" },
  statCardBig: { background: "linear-gradient(135deg, #F4E5C1, #E8D4A0)", border: "1px solid #D49A4F" },
  statIcon: { display: "flex", alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 2 },
  statValue: { fontFamily: "'Fraunces', serif", fontWeight: 700, letterSpacing: -0.5 },
  mainGrid: { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 },
  gardenCard: { background: "white", borderRadius: 22, padding: 16, border: "1px solid #EFE6D2", position: "relative", overflow: "hidden" },
  gardenFooter: { marginTop: 14, padding: "0 8px" },
  growthLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5C7240", fontWeight: 600, letterSpacing: 0.3 },
  sidebar: { display: "flex", flexDirection: "column", gap: 16 },
  actionsCard: { background: "white", padding: 18, borderRadius: 18, border: "1px solid #EFE6D2" },
  cardTitle: { fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600, color: "#2C5F2D", margin: 0, marginBottom: 12, letterSpacing: -0.3 },
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  actionBtn: { padding: "14px 12px", borderRadius: 12, textAlign: "left", fontWeight: 700 },
  achievementsCard: { background: "white", padding: 18, borderRadius: 18, border: "1px solid #EFE6D2" },
  achievementsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 8 },
  badge: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px", background: "#FAF6EC", borderRadius: 10, border: "1px solid #EFE6D2" },
  badgeName: { fontSize: 9, textAlign: "center", color: "#5C7240", fontWeight: 700, letterSpacing: 0.3 },
  recentCard: { background: "white", padding: 18, borderRadius: 18, border: "1px solid #EFE6D2", flex: 1 },
  empty: { fontFamily: "'Fraunces', serif", fontStyle: "italic", color: "#A89B7C", fontSize: 14, margin: 0, textAlign: "center", padding: "20px 0" },
  transactionList: { display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" },
  transaction: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px dashed #EFE6D2" },
  txnDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  txnDesc: { fontSize: 13, fontWeight: 600, color: "#1A2B1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  txnDate: { fontSize: 10, color: "#A89B7C", marginTop: 1, letterSpacing: 0.3 },
  txnAmount: { fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700 },
  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(26, 43, 26, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#FAF6EC", borderRadius: 24, padding: 32, maxWidth: 420, width: "100%", border: "2px solid", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalClose: { position: "absolute", top: 16, right: 16, background: "transparent", padding: 6, borderRadius: "50%", color: "#8B7355" },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, textAlign: "center", margin: 0, marginBottom: 20, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 14 },
  label: { display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#5C7240", fontWeight: 700, marginBottom: 6 },
  amountWrap: { position: "relative" },
  dollarSign: { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "'Fraunces', serif", fontSize: 22, color: "#8B7355", fontWeight: 600 },
  amountInput: { width: "100%", padding: "16px 16px 16px 36px", fontSize: 24, fontFamily: "'Fraunces', serif", fontWeight: 700, border: "2px solid", borderRadius: 12, background: "white", color: "#1A2B1A", outline: "none" },
  textInput: { width: "100%", padding: "12px 16px", fontSize: 15, fontFamily: "'Nunito', sans-serif", border: "2px solid", borderRadius: 12, background: "white", color: "#1A2B1A", outline: "none" },
  warning: { background: "#FCE4DC", padding: 12, borderRadius: 10, fontSize: 13, color: "#8B3A1F", marginBottom: 12, fontWeight: 600 },
  spendPrompt: { background: "#FFF8E8", padding: 14, borderRadius: 12, marginBottom: 14, border: "1px dashed #D49A4F" },
  projection: { fontSize: 12, color: "#8B5A1F", lineHeight: 1.5 },
  submitBtn: { width: "100%", padding: "14px", color: "white", fontSize: 15, fontWeight: 700, borderRadius: 12, marginTop: 6, letterSpacing: 0.3, boxShadow: "0 4px 0 rgba(0,0,0,0.1)" },
  // Goal styles
  editGoalBtn: { background: "transparent", padding: 4, borderRadius: 6, color: "#A89B7C", display: "flex", alignItems: "center", justifyContent: "center" },
  setGoalBtn: { background: "#FAF6EC", border: "1px dashed #C9BEA0", borderRadius: 8, padding: "8px 10px", color: "#8B7355", fontSize: 11, fontStyle: "italic", width: "100%", textAlign: "left", letterSpacing: 0.2 },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 999, transition: "width 0.6s cubic-bezier(0.25, 1, 0.5, 1)" },
  progressLabel: { fontSize: 11, fontFamily: "'Nunito', sans-serif", letterSpacing: 0.2 },
  clearGoalBtn: { width: "100%", padding: "8px", marginTop: 8, background: "transparent", color: "#A89B7C", fontSize: 12, fontWeight: 600, borderRadius: 8, letterSpacing: 0.3, border: "none" },
};
