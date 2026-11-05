import { lazy, Suspense, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { HashRouter, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
const PhaserGame = lazy(() => import("./components/PhaserGame"));
import { ACHIEVEMENTS, applyRun, getLevelProgress, currentLevel } from "./lib/progression";
import { claimMissionReward, getMissionBoard } from "./lib/missions";
import { loadProfile, saveProfile, xpToNextLevel } from "./lib/storage";
import type { GameId, PlayerProfile, RunResult } from "./types";

const games = [
  {
    id: "wakeboard-x" as const,
    name: "WAKEBOARD X",
    subtitle: "Own the ocean.",
    genre: "SPORTS / TRICK ARCADE",
    description: "Carve through turquoise water, catch the wake and land the cleanest tricks.",
    color: "ocean",
    icon: "〰",
    controls: "Arrow keys / WASD to move · Space to jump · Z or X for tricks",
  },
  {
    id: "neon-rush" as const,
    name: "NEON RUSH",
    subtitle: "Outrun the grid.",
    genre: "ENDLESS RUNNER",
    description: "Switch lanes, dodge the pulse barriers and collect data chips in a neon city.",
    color: "neon",
    icon: "✳",
    controls: "← → or A / D to change lanes · Space to jump",
  },
];

const shopItems = [
  { id: "aqua-trail", name: "Aqua Trail", category: "WAKEBOARD X", gameId: "wakeboard-x" as const, price: 120, symbol: "〰" },
  { id: "solar-board", name: "Solar Board", category: "WAKEBOARD X", gameId: "wakeboard-x" as const, price: 180, symbol: "▱" },
  { id: "synth-glow", name: "Synth Glow", category: "NEON RUSH", gameId: "neon-rush" as const, price: 150, symbol: "✦" },
  { id: "pixel-wings", name: "Pixel Wings", category: "NEON RUSH", gameId: "neon-rush" as const, price: 220, symbol: "⌁" },
];

function AppShell() {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  useEffect(() => saveProfile(profile), [profile]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const finishRun = (result: RunResult) => {
    setProfile((current) => {
      const next = applyRun(current, result);
      const unlocked = next.achievements.filter((id) => !current.achievements.includes(id));
      if (unlocked.length) {
        const titles = unlocked.map((id) => ACHIEVEMENTS.find((item) => item.id === id)?.title).filter(Boolean);
        notify("Achievement unlocked: " + titles.join(", "));
      } else {
        notify("Run saved · +" + Math.max(20, Math.floor(result.score / 8)) + " XP");
      }
      return next;
    });
  };

  const buyItem = (id: string, price: number, gameId: GameId) => {
    setProfile((current) => {
      if (current.ownedItems.includes(id)) {
        const isEquipped = current.equippedItems[gameId] === id;
        notify(isEquipped ? "Cosmetic unequipped." : "Cosmetic equipped!");
        return {
          ...current,
          equippedItems: {
            ...current.equippedItems,
            [gameId]: isEquipped ? undefined : id,
          },
        };
      }
      if (current.coins < price) {
        notify("Not enough coins yet. Play a run to earn more.");
        return current;
      }
      notify("Item unlocked and equipped!");
      return {
        ...current,
        coins: current.coins - price,
        ownedItems: [...current.ownedItems, id],
        equippedItems: { ...current.equippedItems, [gameId]: id },
      };
    });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="ARCADEVERSE home">
          <span className="brand-mark">A<span>.</span></span>
          <span className="brand-name">ARCADE<span>VERSE</span></span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/library">Game library</NavLink>
          <NavLink to="/missions">Missions</NavLink>
          <NavLink to="/achievements">Achievements</NavLink>
          <NavLink to="/shop">Shop</NavLink>
        </nav>
        <button className="profile-chip" onClick={() => navigate("/profile")}>
          <span className="avatar">✦</span>
          <span className="profile-chip-copy"><b>{profile.nickname}</b><small>LVL {currentLevel(profile.xp)}</small></span>
          <span className="coin-mini">◈ {profile.coins}</span>
        </button>
      </header>

      <main className="page-frame">
        <Routes>
          <Route path="/" element={<HomePage profile={profile} />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<ProfilePage profile={profile} setProfile={setProfile} />} />
          <Route path="/shop" element={<ShopPage profile={profile} buyItem={buyItem} />} />
          <Route path="/missions" element={<MissionsPage profile={profile} onClaim={(claimId) => {
            const result = claimMissionReward(profile, claimId);
            if (result.claimed) {
              setProfile(result.profile);
              notify("Mission complete · +" + result.rewardXp + " XP · +" + result.rewardCoins + " coins");
            } else {
              notify("Complete the mission before claiming its reward.");
            }
          }} />} />
          <Route path="/achievements" element={<AchievementsPage profile={profile} />} />
          <Route path="/settings" element={<SettingsPage profile={profile} setProfile={setProfile} />} />
          <Route path="/play/:gameId" element={<PlayPage onFinish={finishRun} profile={profile} />} />
          <Route path="*" element={<HomePage profile={profile} />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>ARCADEVERSE <i>© 2026</i></span>
        <span>TWO WORLDS. ENDLESS PLAY.</span>
        <NavLink to="/settings">Settings ⚙</NavLink>
      </footer>
      {toast && <div className="toast" role="status">✦ &nbsp;{toast}</div>}
    </div>
  );
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{detail && <p>{detail}</p>}</div>;
}

function GameCard({ game }: { game: typeof games[number] }) {
  const navigate = useNavigate();
  return (
    <article className={"game-card " + game.color}>
      <div className="game-art">
        <div className="art-grid" />
        <span className="game-art-icon">{game.icon}</span>
        <span className="art-kicker">{game.genre}</span>
        {game.id === "wakeboard-x" ? <><div className="wave wave-one" /><div className="wave wave-two" /><div className="wakeboarder">●</div><div className="sun-disc" /></> : <><div className="neon-city"><i /><i /><i /><i /><i /></div><div className="neon-runner">▲</div><div className="neon-track" /></>}
      </div>
      <div className="game-card-copy">
        <div className="game-title-line"><div><h3>{game.name}</h3><span>{game.subtitle}</span></div><span className="game-index">{game.id === "wakeboard-x" ? "01" : "02"}</span></div>
        <p>{game.description}</p>
        <button className="button button-primary card-play" onClick={() => navigate("/play/" + game.id)}>PLAY NOW <span>↗</span></button>
      </div>
    </article>
  );
}

function HomePage({ profile }: { profile: PlayerProfile }) {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot" /> YOUR NEXT HIGH SCORE STARTS HERE</span>
          <h1>PLAY BEYOND<br /><em>THE ORDINARY.</em></h1>
          <p>Two worlds. Two ways to play. One place to chase your next personal best.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => navigate("/library")}>EXPLORE GAMES <span>↗</span></button>
            <button className="button button-quiet" onClick={() => navigate("/profile")}>VIEW YOUR PROFILE</button>
          </div>
          <div className="hero-metrics">
            <div><b>{profile.gamesPlayed}</b><span>RUNS PLAYED</span></div>
            <div><b>{profile.coins}</b><span>COINS EARNED</span></div>
            <div><b>02</b><span>ARCADE WORLDS</span></div>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring ring-a" /><div className="orbit-ring ring-b" />
          <div className="orbit-core"><span>AV</span><small>PLAYER<br />ONE</small></div>
          <span className="orbit-label label-a">WAVE 01</span><span className="orbit-label label-b">NEON 02</span>
          <span className="orbit-spark spark-a">✦</span><span className="orbit-spark spark-b">✧</span>
        </div>
        <span className="hero-footnote">ARCADEVERSE / EST. 2026</span>
      </section>

      <section className="section-block">
        <SectionHeading eyebrow="CHOOSE YOUR WORLD" title="THE ARCADE" detail="Pick a game and make this run count." />
        <div className="game-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div>
      </section>

      <section className="quick-stats">
        <div><span className="stat-icon">✦</span><span><small>PLAYER LEVEL</small><b>{currentLevel(profile.xp)}</b></span></div>
        <div><span className="stat-icon">◈</span><span><small>TOTAL XP</small><b>{profile.xp.toLocaleString()}</b></span></div>
        <div><span className="stat-icon">🏆</span><span><small>UNLOCKED AWARDS</small><b>{profile.achievements.length}/{ACHIEVEMENTS.length}</b></span></div>
        <div><span className="stat-icon">⌁</span><span><small>PERSONAL RECORDS</small><b>{Object.values(profile.bestScores).filter((score) => score > 0).length}/2</b></span></div>
      </section>
    </div>
  );
}

function LibraryPage() {
  return <div className="content-page"><SectionHeading eyebrow="GAME LIBRARY / 02 TITLES" title="FIND YOUR NEXT RUN" detail="Every world has its own rhythm. Which one is yours?" /><div className="game-grid library-grid">{games.map((game) => <GameCard key={game.id} game={game} />)}</div></div>;
}

function PlayPage({ onFinish, profile }: { onFinish: (result: RunResult) => void; profile: PlayerProfile }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const selected = games.find((game) => game.id === gameId);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState(0);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);

  if (!selected) return <div className="content-page"><h2>Game not found.</h2><button className="button button-primary" onClick={() => navigate("/library")}>BACK TO LIBRARY</button></div>;

  const handleFinish = (result: RunResult) => {
    if (finished) return;
    setFinished(true);
    setLastResult(result);
    onFinish(result);
  };
  const replay = () => {
    setFinished(false);
    setLastResult(null);
    setSession((current) => current + 1);
  };

  return (
    <div className="play-page">
      <div className="play-topline"><button className="back-link" onClick={() => navigate("/library")}>← GAME LIBRARY</button><span className="eyebrow">ARCADE SESSION / {selected.id === "wakeboard-x" ? "01" : "02"}</span><span className="play-wallet">◈ {profile.coins} COINS</span></div>
      <div className={"play-heading " + selected.color}><div><span className="eyebrow">{selected.genre}</span><h1>{selected.name}</h1><p>{selected.description}</p></div><span className="session-badge"><i /> SESSION READY</span></div>
      <div className="game-stage"><Suspense fallback={<div className="game-loading"><span className="loading-pulse" /> LOADING ARCADE ENGINE</div>}><PhaserGame key={selected.id + "-" + session + "-" + (profile.equippedItems[selected.id] ?? "default")} gameId={selected.id as GameId} onFinish={handleFinish} equippedItem={profile.equippedItems[selected.id] ?? null} controlScheme={profile.settings.controlScheme} /></Suspense>
        {finished && lastResult && <div className="result-overlay"><div className="result-panel"><span className="eyebrow">SESSION COMPLETE</span><h2>RUN IT BACK.</h2><div className="result-score">{lastResult.score.toLocaleString()}<small>POINTS</small></div><div className="result-rewards"><span>+{Math.max(20, Math.floor(lastResult.score / 8))} XP</span><span>+{lastResult.coins + Math.floor(lastResult.score / 180)} COINS</span></div><button className="button button-primary" onClick={replay}>PLAY AGAIN ↗</button><button className="button button-quiet" onClick={() => navigate("/profile")}>VIEW PROGRESS</button></div></div>}
      </div>
      <div className="controls-line"><span>⌨ CONTROLS</span><p>{selected.controls}</p><span>ESC TO PAUSE</span></div>
    </div>
  );
}

function ProfilePage({ profile, setProfile }: { profile: PlayerProfile; setProfile: Dispatch<SetStateAction<PlayerProfile>> }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.nickname);
  const level = currentLevel(profile.xp);
  const progress = getLevelProgress(profile.xp);
  return <div className="content-page">
    <SectionHeading eyebrow="PLAYER / OVERVIEW" title="YOUR ARCADE ID" detail="Every run adds to your story. Your progress is saved on this device." />
    <div className="profile-hero"><div className="profile-avatar">✦</div><div className="profile-identity"><span className="eyebrow">PLAYER PROFILE</span>{editing ? <form className="name-edit" onSubmit={(event) => { event.preventDefault(); setProfile((current) => ({ ...current, nickname: name.trim() || "Rookie" })); setEditing(false); }}><input value={name} maxLength={18} onChange={(event) => setName(event.target.value)} aria-label="Player nickname" /><button className="button button-primary">SAVE</button></form> : <h2>{profile.nickname}</h2>}<button className="text-button" onClick={() => { setName(profile.nickname); setEditing(!editing); }}>{editing ? "CANCEL" : "EDIT NICKNAME ↗"}</button></div><div className="level-block"><span>LEVEL {level}</span><b>{profile.xp.toLocaleString()} <small>XP</small></b><div className="progress-track"><i style={{ width: progress + "%" }} /></div><small>{xpToNextLevel(profile.xp)} XP TO NEXT LEVEL</small></div></div>
    <div className="profile-stat-grid">
      <StatBox label="GAMES PLAYED" value={profile.gamesPlayed.toString()} />
      <StatBox label="COINS EARNED" value={profile.totalCoinsEarned.toLocaleString()} />
      <StatBox label="TRICKS LANDED" value={profile.totalTricks.toLocaleString()} />
      <StatBox label="PERFECT LANDINGS" value={profile.totalPerfectLandings.toLocaleString()} />
      <StatBox label="WAKEBOARD X BEST" value={profile.bestScores["wakeboard-x"].toLocaleString()} />
      <StatBox label="NEON RUSH BEST" value={profile.bestScores["neon-rush"].toLocaleString()} />
    </div>
    <div className="records-panel"><SectionHeading eyebrow="PERSONAL BESTS" title="YOUR RECORD BOARD" /><div className="record-row"><span className="record-icon ocean-icon">〰</span><span><b>WAKEBOARD X</b><small>Best score</small></span><strong>{profile.bestScores["wakeboard-x"].toLocaleString()}</strong></div><div className="record-row"><span className="record-icon neon-icon">✳</span><span><b>NEON RUSH</b><small>Best score</small></span><strong>{profile.bestScores["neon-rush"].toLocaleString()}</strong></div></div>
  </div>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return <div className="profile-stat"><span>{label}</span><b>{value}</b></div>;
}

function ShopPage({ profile, buyItem }: { profile: PlayerProfile; buyItem: (id: string, price: number, gameId: GameId) => void }) {
  return (
    <div className="content-page">
      <SectionHeading eyebrow="ARCADE STORE / COSMETICS" title="MAKE IT YOURS" detail="Unlock each look with coins earned in-game, then equip it to change your next run." />
      <div className="shop-wallet"><span>YOUR BALANCE</span><b>◈ {profile.coins}</b></div>
      <div className="shop-grid">
        {shopItems.map((item) => {
          const owned = profile.ownedItems.includes(item.id);
          const equipped = profile.equippedItems[item.gameId] === item.id;
          return (
            <article className="shop-item" key={item.id}>
              <div className="shop-art"><span>{item.symbol}</span><small>{item.category}</small></div>
              <div className="shop-item-info">
                <div><h3>{item.name}</h3><span>{item.price} COINS</span></div>
                <button
                  className={"button " + (equipped ? "button-owned" : "button-outline")}
                  disabled={equipped}
                  onClick={() => buyItem(item.id, item.price, item.gameId)}
                >
                  {equipped ? "EQUIPPED ✓" : owned ? "EQUIP" : "UNLOCK"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="subtle-note">Your equipped look appears inside its game. Cosmetics are saved locally and can be changed without losing progress.</p>
    </div>
  );
}

function MissionsPage({ profile, onClaim }: { profile: PlayerProfile; onClaim: (claimId: string) => void }) {
  const board = getMissionBoard(profile);
  const daily = board.filter((mission) => mission.period === "daily");
  const weekly = board.filter((mission) => mission.period === "weekly");
  const renderMission = (mission: typeof board[number]) => (
    <div className={"mission-card " + (mission.completed ? "mission-complete" : "")} key={mission.claimId}>
      <div className="mission-symbol">{mission.claimed ? "✓" : mission.completed ? "★" : "✧"}</div>
      <div className="mission-copy">
        <span className="eyebrow">{mission.period === "daily" ? "DAILY OBJECTIVE" : "WEEKLY CHALLENGE"}</span>
        <h3>{mission.title}</h3>
        <p>{mission.description}</p>
        <div className="progress-track"><i style={{ width: (mission.progress / mission.target * 100) + "%" }} /></div>
        <small>{mission.progress.toLocaleString()} / {mission.target.toLocaleString()} {mission.completed ? "COMPLETE" : "IN PROGRESS"}</small>
      </div>
      <div className="mission-reward">
        <small>REWARD</small>
        <b>+{mission.rewardXp} XP</b>
        <b>◈ {mission.rewardCoins}</b>
        <button
          className={"button " + (mission.claimed ? "button-owned" : "button-outline")}
          disabled={!mission.completed || mission.claimed}
          onClick={() => onClaim(mission.claimId)}
        >
          {mission.claimed ? "CLAIMED ✓" : mission.completed ? "CLAIM" : "IN PROGRESS"}
        </button>
      </div>
    </div>
  );
  return (
    <div className="content-page">
      <SectionHeading eyebrow="OBJECTIVES / PLAYER MISSIONS" title="THE NEXT MILESTONE" detail="Play, make progress and claim your rewards. Daily goals reset each day; weekly challenges reset on Monday." />
      <div className="mission-group">
        <SectionHeading eyebrow="RESETS EVERY DAY" title="DAILY MISSIONS" />
        <div className="mission-list">{daily.map(renderMission)}</div>
      </div>
      <div className="mission-group">
        <SectionHeading eyebrow="RESETS EVERY MONDAY" title="WEEKLY CHALLENGES" />
        <div className="mission-list">{weekly.map(renderMission)}</div>
      </div>
      <p className="subtle-note">Mission progress and claimed rewards are saved in your local player profile.</p>
    </div>
  );
}
function AchievementsPage({ profile }: { profile: PlayerProfile }) {
  return <div className="content-page"><SectionHeading eyebrow={"TROPHY ROOM / " + profile.achievements.length + " UNLOCKED"} title="PROOF OF PLAY" detail="Earn these through real gameplay milestones." /><div className="achievement-grid">{ACHIEVEMENTS.map((item, index) => { const unlocked = profile.achievements.includes(item.id); return <article className={"achievement-card " + (unlocked ? "unlocked" : "locked")} key={item.id}><div className="achievement-medal">{["✦", "⌁", "〰", "⚡", "◈", "☀", "✧"][index]}</div><div><span className="eyebrow">{unlocked ? "UNLOCKED" : "LOCKED"}</span><h3>{item.title}</h3><p>{item.detail}</p><small>{item.reward} COINS REWARD</small></div><span className="achievement-state">{unlocked ? "✓" : "—"}</span></article>; })}</div></div>;
}

function SettingsPage({ profile, setProfile }: { profile: PlayerProfile; setProfile: Dispatch<SetStateAction<PlayerProfile>> }) {
  const settings = profile.settings;
  const update = (changes: Partial<PlayerProfile["settings"]>) => setProfile((current) => ({ ...current, settings: { ...current.settings, ...changes } }));
  return <div className="content-page"><SectionHeading eyebrow="PREFERENCES / DEVICE" title="TUNE YOUR SETUP" detail="Your preferences are stored in this browser." /><div className="settings-panel"><div className="setting-row"><div><b>Sound effects</b><small>Game audio and feedback</small></div><button className={"toggle " + (settings.soundEnabled ? "is-on" : "")} aria-pressed={settings.soundEnabled} onClick={() => update({ soundEnabled: !settings.soundEnabled })}><span /></button></div><div className="setting-row"><div><b>Music volume</b><small>Background audio level</small></div><div className="range-control"><input type="range" min="0" max="100" value={settings.musicVolume} onChange={(event) => update({ musicVolume: Number(event.target.value) })} /><b>{settings.musicVolume}%</b></div></div><div className="setting-row"><div><b>Effects volume</b><small>Gameplay feedback level</small></div><div className="range-control"><input type="range" min="0" max="100" value={settings.sfxVolume} onChange={(event) => update({ sfxVolume: Number(event.target.value) })} /><b>{settings.sfxVolume}%</b></div></div><div className="setting-row"><div><b>Keyboard layout</b><small>Choose your preferred movement keys</small></div><select value={settings.controlScheme} onChange={(event) => update({ controlScheme: event.target.value as "arrows" | "wasd" })}><option value="arrows">Arrow keys</option><option value="wasd">WASD</option></select></div></div><p className="subtle-note">Keyboard layout is applied to both games. Audio preferences are saved, but sound playback is not connected yet in this build.</p></div>;
}

export default function App() {
  return <HashRouter><AppShell /></HashRouter>;
}