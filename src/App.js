import { useState } from "react";

const LEVELS = [
  { label: "Explorer", emoji: "🌱", desc: "Ages 6–8 · Easy puzzles" },
  { label: "Adventurer", emoji: "⚔️", desc: "Ages 9–11 · Trickier logic" },
  { label: "Champion", emoji: "🏆", desc: "Ages 12+ · Real brain teasers" },
];

const ZONES = [
  { name: "Whispering Woods", emoji: "🌲", color: "#1D9E75", bg: "#E1F5EE" },
  { name: "Crystal Caves", emoji: "💎", color: "#534AB7", bg: "#EEEDFE" },
  { name: "Sky Citadel", emoji: "☁️", color: "#185FA5", bg: "#E6F1FB" },
  { name: "Lava Peaks", emoji: "🌋", color: "#993C1D", bg: "#FAECE7" },
];

function LoadingDots({ color }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "2rem 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: "50%", background: color || "#7F77DD",
          animation: `bounce 1s ${i * 0.2}s infinite ease-in-out`,
        }} />
      ))}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [level, setLevel] = useState(1);
  const [zone, setZone] = useState(ZONES[0]);
  const [puzzle, setPuzzle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const TOTAL = 5;

  async function fetchPuzzle(lvl, z) {
    setLoading(true);
    setPuzzle(null);
    setSelected(null);
    setFeedback(null);
    setShowHint(false);
    const diff = lvl <= 1 ? "easy (ages 6-8)" : lvl <= 2 ? "medium (ages 9-11)" : "hard (ages 12+)";
    const prompt = `You are a fun quest game master for kids. Generate a logic puzzle for a fantasy adventure game set in ${z.name}. Difficulty: ${diff}. The puzzle must be solvable with pure logic. Make it short and fun. Respond ONLY with a JSON object (no markdown, no backticks): {"question":"...","options":["A","B","C","D"],"answer":0,"hint":"...","explanation":"..."}. The answer field is the index (0-3) of the correct option.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content.map(b => b.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      setPuzzle(JSON.parse(clean));
    } catch {
      setPuzzle({
        question: "A wizard has 3 potions: red, blue, and green. The blue potion is not last. The red potion is before the green one. What is the order?",
        options: ["Red, Blue, Green", "Blue, Red, Green", "Red, Green, Blue", "Green, Blue, Red"],
        answer: 0,
        hint: "Think about where blue can go if it's not last.",
        explanation: "Red must come before green, and blue is not last — so the order is Red, Blue, Green!"
      });
    }
    setLoading(false);
  }

  function startGame(lvl) {
    const z = ZONES[Math.floor(Math.random() * ZONES.length)];
    setLevel(lvl); setZone(z); setScore(0); setRound(1);
    setScreen("game");
    fetchPuzzle(lvl, z);
  }

  function handleAnswer(idx) {
    if (feedback) return;
    setSelected(idx);
    setFeedback(idx === puzzle.answer ? "correct" : "wrong");
    if (idx === puzzle.answer) setScore(s => s + 1);
  }

  function nextRound() {
    if (round >= TOTAL) { setScreen("result"); return; }
    setRound(r => r + 1);
    fetchPuzzle(level, zone);
  }

  const letters = ["A", "B", "C", "D"];

  const styles = {
    page: { minHeight: "100vh", background: "#f9f9f7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "1rem" },
    card: { background: "#fff", borderRadius: 16, padding: "2rem", maxWidth: 520, width: "100%", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" },
  };

  if (screen === "home") return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 52 }}>🗺️</div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "8px 0 4px" }}>Logic Quest</h1>
          <p style={{ color: "#666", fontSize: 15, margin: 0 }}>Solve puzzles, explore magical lands, become a legend!</p>
        </div>
        <p style={{ fontWeight: 500, fontSize: 14, color: "#888", marginBottom: 10 }}>Choose your rank</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LEVELS.map((l, i) => (
            <button key={i} onClick={() => startGame(i + 1)} style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
              <span style={{ fontSize: 28 }}>{l.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{l.label}</div>
                <div style={{ fontSize: 13, color: "#888" }}>{l.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#aaa", fontSize: 13, marginTop: 20 }}>5 puzzles per quest · Earn your rank!</p>
      </div>
    </div>
  );

  if (screen === "result") {
    const pct = Math.round((score / TOTAL) * 100);
    const trophy = pct === 100 ? "🏆" : pct >= 60 ? "⭐" : "🌱";
    const msg = pct === 100 ? "Perfect score! You're a true champion!" : pct >= 60 ? "Great job, adventurer!" : "Keep practicing, brave explorer!";
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 8 }}>{trophy}</div>
          <h2 style={{ fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>{msg}</h2>
          <p style={{ color: "#666", marginBottom: 20 }}>You scored <strong>{score}</strong> out of <strong>{TOTAL}</strong> in {zone.name} {zone.emoji}</p>
          <div style={{ background: "#f5f5f3", borderRadius: 12, padding: "1rem", marginBottom: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: zone.color }}>{pct}%</div>
            <div style={{ fontSize: 13, color: "#888" }}>accuracy</div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => startGame(level)} style={{ background: zone.color, color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 15, cursor: "pointer", fontWeight: 500 }}>Play Again</button>
            <button onClick={() => setScreen("home")} style={{ background: "#fff", border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "12px 22px", fontSize: 15, cursor: "pointer" }}>Change Rank</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{zone.emoji}</span>
            <span style={{ fontSize: 14, color: "#666" }}>{zone.name}</span>
          </div>
          <span style={{ fontSize: 14, color: "#666" }}>Puzzle {round}/{TOTAL} · {score} correct</span>
        </div>
        <div style={{ background: "#f0f0ee", borderRadius: 6, height: 6, marginBottom: 20 }}>
          <div style={{ background: zone.color, height: 6, borderRadius: 6, width: `${((round - 1) / TOTAL) * 100}%`, transition: "width 0.4s" }} />
        </div>
        {loading ? <LoadingDots color={zone.color} /> : puzzle && (
          <>
            <div style={{ background: zone.bg, borderRadius: 12, padding: 16, marginBottom: 18, border: `1.5px solid ${zone.color}33` }}>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>{puzzle.question}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {puzzle.options.map((opt, idx) => {
                let bg = "#fff", border = "1.5px solid #e0e0e0", color = "#222";
                if (feedback && idx === puzzle.answer) { bg = "#E1F5EE"; border = "2px solid #1D9E75"; color = "#085041"; }
                else if (feedback === "wrong" && idx === selected) { bg = "#FAECE7"; border = "2px solid #993C1D"; color = "#4A1B0C"; }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} style={{ background: bg, border, color, borderRadius: 10, padding: "12px 16px", cursor: feedback ? "default" : "pointer", display: "flex", gap: 12, alignItems: "center", textAlign: "left", fontSize: 15 }}>
                    <span style={{ minWidth: 26, height: 26, borderRadius: "50%", background: zone.bg, color: zone.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{letters[idx]}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {!feedback && (
              <button onClick={() => setShowHint(true)} style={{ background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer", padding: "4px 0" }}>
                {showHint ? `Hint: ${puzzle.hint}` : "Need a hint?"}
              </button>
            )}
            {feedback && (
              <div style={{ borderRadius: 10, padding: "14px 16px", background: feedback === "correct" ? "#E1F5EE" : "#FAECE7", border: `1.5px solid ${feedback === "correct" ? "#1D9E75" : "#993C1D"}` }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: feedback === "correct" ? "#085041" : "#4A1B0C", marginBottom: 4 }}>
                  {feedback === "correct" ? "Correct! Well done!" : "Not quite — but great try!"}
                </div>
                <p style={{ margin: 0, fontSize: 14, color: feedback === "correct" ? "#0F6E56" : "#712B13", lineHeight: 1.5 }}>{puzzle.explanation}</p>
                <button onClick={nextRound} style={{ marginTop: 12, background: feedback === "correct" ? "#1D9E75" : "#993C1D", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
                  {round >= TOTAL ? "See Results" : "Next Puzzle →"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}