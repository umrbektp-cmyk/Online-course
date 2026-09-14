import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ============================================================
//  INGLIZ TILI KURSI — production
//  Admin: real Supabase Auth login
//  Students: secure signup/login via database functions (RPC)
//  so the student table is never exposed to the public.
// ============================================================

const LESSONS = [
  { id: 1, title: "1-dars: Alifbo va tovushlar", duration: "12:40", bunny: "" },
  { id: 2, title: "2-dars: Salomlashish", duration: "09:15", bunny: "" },
  { id: 3, title: "3-dars: O'zingiz haqingizda", duration: "14:20", bunny: "" },
  { id: 4, title: "4-dars: Raqamlar 1-20", duration: "08:05", bunny: "" },
  { id: 5, title: "5-dars: Kundalik so'zlar", duration: "16:30", bunny: "" },
];

// Bunny library id — fill in once your Bunny Stream library exists.
const BUNNY_LIBRARY_ID = "";

function getDeviceId() {
  let id = localStorage.getItem("kurs_device");
  if (!id) { id = "dev-" + Math.random().toString(36).slice(2, 12); localStorage.setItem("kurs_device", id); }
  return id;
}
const DEVICE = getDeviceId();

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);        // logged-in student
  const [session, setSession] = useState(null);  // admin auth session
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(null), 4000); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signup = async (name, phone) => {
    setBusy(true);
    const { error } = await supabase.rpc("student_signup", { p_name: name, p_phone: phone.replace(/\s/g, "") });
    setBusy(false);
    if (error) return flash(error.message.includes("duplicate") ? "Bu raqam allaqachon ro'yxatdan o'tgan." : "Xatolik: " + error.message);
    flash("So'rov yuborildi. Admin tasdiqlashini kuting.");
    setScreen("login");
  };

  const login = async (phone) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("student_login", { p_phone: phone.replace(/\s/g, ""), p_device: DEVICE });
    setBusy(false);
    if (error) return flash("Xatolik: " + error.message);
    if (!data || data.length === 0) return flash("Raqam topilmadi. Avval ro'yxatdan o'ting.");
    const r = data[0];
    if (r.result === "pending") return flash("Hisob hali tasdiqlanmagan.");
    if (r.result === "wrong_device") return flash("Bu hisob boshqa qurilmaga bog'langan. Adminga murojaat qiling.");
    if (r.result === "ok") { setUser({ name: r.s_name, phone: r.s_phone }); setScreen("student"); }
  };

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      {notice && <div style={S.toast}>{notice}</div>}
      <header style={S.header}>
        <div style={S.logo} onClick={() => setScreen("landing")}>Level Up</div>
        <nav style={S.nav}>
          {screen !== "admin" && <button className="ghost" onClick={() => setScreen("admin")}>Admin panel</button>}
          {user
            ? <button className="ghost" onClick={() => { setUser(null); setScreen("landing"); }}>Chiqish</button>
            : screen !== "login" && <button className="ghost" onClick={() => setScreen("login")}>Kirish</button>}
        </nav>
      </header>
      <main style={S.main}>
        {screen === "landing" && <Landing onStart={() => setScreen("signup")} onLogin={() => setScreen("login")} />}
        {screen === "signup" && <Signup onSubmit={signup} onBack={() => setScreen("landing")} busy={busy} />}
        {screen === "login" && <Login onSubmit={login} onSignup={() => setScreen("signup")} busy={busy} />}
        {screen === "student" && user && <Student user={user} />}
        {screen === "admin" && <Admin session={session} onExit={() => setScreen("landing")} flash={flash} />}
      </main>
      <footer style={S.footer}>Premier · Ingliz tili kursi</footer>
    </div>
  );
}

function Landing({ onStart, onLogin }) {
  return (
    <div style={S.wrap}>
      <section style={S.hero}>
        <h1 style={S.bigTitle}>Level<br />Up<span style={{ color: "#e24b4a" }}>.</span></h1>
        <p style={S.lead}>Hech qanday bilim talab qilinmaydi. Alifbodan kundalik suhbatgacha — bosqichma-bosqich darslar.</p>
        <div style={S.ctaRow}>
          <button className="primary" onClick={onStart}>Ro'yxatdan o'tish</button>
          <button className="ghost" onClick={onLogin}>Kirish</button>
        </div>
        <p style={S.microcopy}>Har bir o'quvchi admin tomonidan tasdiqlanadi. Bir hisob — bir qurilma.</p>
      </section>
      <section style={S.lessonsPreview}>
        <h3 style={S.h3}>Kurs dasturi</h3>
        <ul style={S.lessonList}>
          {LESSONS.map((l) => (
            <li key={l.id} style={S.lessonRow}><span>{l.title}</span><span style={S.muted}>{l.duration}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Signup({ onSubmit, onBack, busy }) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  return (
    <div style={S.formCard}>
      <h2 style={S.h2}>Ro'yxatdan o'tish</h2>
      <p style={S.muted}>Admin tasdiqlagach kirishingiz mumkin.</p>
      <label style={S.label}>Ism familiya</label>
      <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Aziz Karimov" />
      <label style={S.label}>Telefon raqam</label>
      <input style={S.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
      <button className="primary" style={{ marginTop: 16, width: "100%" }} disabled={busy}
        onClick={() => (name && phone ? onSubmit(name, phone) : null)}>{busy ? "Yuborilmoqda..." : "So'rov yuborish"}</button>
      <button className="link" onClick={onBack}>← Orqaga</button>
    </div>
  );
}

function Login({ onSubmit, onSignup, busy }) {
  const [phone, setPhone] = useState("");
  return (
    <div style={S.formCard}>
      <h2 style={S.h2}>Kirish</h2>
      <label style={S.label}>Telefon raqam</label>
      <input style={S.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
      <button className="primary" style={{ marginTop: 16, width: "100%" }} disabled={busy}
        onClick={() => (phone ? onSubmit(phone) : null)}>{busy ? "Tekshirilmoqda..." : "Kirish"}</button>
      <p style={{ ...S.muted, marginTop: 14 }}>Hisobingiz yo'qmi? <button className="link inline" onClick={onSignup}>Ro'yxatdan o'ting</button></p>
    </div>
  );
}

function Student({ user }) {
  const [active, setActive] = useState(LESSONS[0]);
  const src = active.bunny && BUNNY_LIBRARY_ID
    ? `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${active.bunny}`
    : "";
  return (
    <div style={S.studentWrap}>
      <aside style={S.sidebar}>
        <div style={S.welcome}>Salom, {user.name.split(" ")[0]}</div>
        <ul style={S.navList}>
          {LESSONS.map((l) => (
            <li key={l.id}>
              <button className={"lessonBtn" + (active.id === l.id ? " on" : "")} onClick={() => setActive(l)}>
                <span>{l.title}</span><span style={S.muted}>{l.duration}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section style={S.player}>
        <div style={S.videoBox}>
          {src ? (
            <iframe title={active.title} src={src} loading="lazy" style={{ width: "100%", height: "100%", border: 0 }}
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen />
          ) : (
            <div style={S.videoPlaceholder}>
              <div style={{ fontSize: 40 }}>▶</div><p>{active.title}</p>
              <p style={{ fontSize: 12, opacity: .6 }}>Video hali qo'shilmagan</p>
              <div style={S.watermark}>{user.name} · {user.phone}</div>
            </div>
          )}
        </div>
        <h2 style={S.h2}>{active.title}</h2>
        <p style={S.muted}>Ismingiz videoda ko'rinadi — bu tarqatishni oldini oladi.</p>
      </section>
    </div>
  );
}

function Admin({ session, onExit, flash }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (error) flash("Xatolik: " + error.message);
    setUsers(data || []); setLoading(false);
  };
  useEffect(() => { if (session) load(); }, [session]);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) flash("Kirish xatosi: " + error.message);
  };
  const signOut = async () => { await supabase.auth.signOut(); };
  const approve = async (id) => { await supabase.from("students").update({ status: "approved" }).eq("id", id); load(); };
  const reject = async (id) => { await supabase.from("students").delete().eq("id", id); load(); };
  const resetDevice = async (id) => { await supabase.from("students").update({ device_id: null }).eq("id", id); load(); };

  if (!session) {
    return (
      <div style={S.formCard}>
        <h2 style={S.h2}>Admin panel</h2>
        <p style={S.muted}>Admin hisobi bilan kiring.</p>
        <label style={S.label}>Email</label>
        <input style={S.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@..." />
        <label style={S.label}>Parol</label>
        <input style={S.input} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="primary" style={{ marginTop: 16, width: "100%" }} onClick={signIn}>Kirish</button>
        <button className="link" onClick={onExit}>← Saytga qaytish</button>
      </div>
    );
  }

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  return (
    <div style={S.wrap}>
      <div style={S.adminHead}>
        <h2 style={S.h2}>Admin panel</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ghost small" onClick={load}>Yangilash</button>
          <button className="ghost small" onClick={signOut}>Chiqish</button>
          <button className="ghost" onClick={onExit}>← Sayt</button>
        </div>
      </div>
      {loading && <p style={S.muted}>Yuklanmoqda...</p>}
      <h3 style={S.h3}>Yangi so'rovlar ({pending.length})</h3>
      {pending.length === 0 && <p style={S.muted}>Yangi so'rov yo'q.</p>}
      {pending.map((u) => (
        <div key={u.id} style={S.adminRow}>
          <div><b>{u.name}</b><br /><span style={S.muted}>{u.phone}</span></div>
          <div style={S.rowActions}>
            <button className="primary small" onClick={() => approve(u.id)}>Tasdiqlash</button>
            <button className="danger small" onClick={() => reject(u.id)}>Rad etish</button>
          </div>
        </div>
      ))}
      <h3 style={{ ...S.h3, marginTop: 28 }}>Tasdiqlangan ({approved.length})</h3>
      {approved.map((u) => (
        <div key={u.id} style={S.adminRow}>
          <div><b>{u.name}</b><br /><span style={S.muted}>{u.phone} · {u.device_id ? "Qurilma bog'langan" : "Qurilma yo'q"}</span></div>
          <div style={S.rowActions}>
            <button className="ghost small" disabled={!u.device_id} onClick={() => resetDevice(u.id)}>Qurilmani almashtirish</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const INK = "#141414", MUT = "#6b7280", LINE = "#e6e6e6", BG = "#fff", ACC = "#111827";
const S = {
  app: { minHeight: "100vh", background: BG, color: INK, fontFamily: "'Inter',system-ui,sans-serif", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 28px", borderBottom: `1px solid ${LINE}` },
  logo: { fontWeight: 700, fontSize: 18, cursor: "pointer", letterSpacing: "-.02em" },
  nav: { display: "flex", gap: 10 },
  main: { flex: 1, padding: "40px 28px", maxWidth: 1000, margin: "0 auto", width: "100%", boxSizing: "border-box" },
  footer: { borderTop: `1px solid ${LINE}`, padding: "14px 28px", fontSize: 12, color: MUT, textAlign: "center" },
  toast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 50, maxWidth: "90%" },
  wrap: { display: "flex", flexDirection: "column", gap: 40 },
  hero: { textAlign: "center", padding: "60px 0 40px" },
  bigTitle: { fontSize: 92, lineHeight: .88, margin: "0 0 28px", letterSpacing: "-4px", fontWeight: 800, color: "#111" },
  kicker: { color: MUT, fontSize: 14, margin: 0, fontWeight: 500 },
  h1: { fontSize: 46, lineHeight: 1.05, margin: "10px 0 16px", letterSpacing: "-.03em", fontWeight: 800 },
  lead: { color: MUT, fontSize: 18, maxWidth: 540, margin: "0 auto 26px", lineHeight: 1.6 },
  ctaRow: { display: "flex", gap: 12, justifyContent: "center" },
  microcopy: { color: MUT, fontSize: 13, marginTop: 18 },
  lessonsPreview: { borderTop: `1px solid ${LINE}`, paddingTop: 28 },
  h3: { fontSize: 15, fontWeight: 700, margin: "0 0 14px", color: MUT },
  lessonList: { listStyle: "none", padding: 0, margin: 0 },
  lessonRow: { display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${LINE}`, fontSize: 15 },
  muted: { color: MUT, fontSize: 14 },
  formCard: { maxWidth: 420, margin: "10px auto", padding: 32, border: `1px solid ${LINE}`, borderRadius: 16 },
  h2: { fontSize: 26, margin: "0 0 6px", letterSpacing: "-.02em", fontWeight: 800 },
  label: { display: "block", fontSize: 13, fontWeight: 600, margin: "16px 0 6px" },
  input: { width: "100%", padding: "12px 14px", border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 15, boxSizing: "border-box", outline: "none" },
  studentWrap: { display: "flex", gap: 28, alignItems: "flex-start" },
  sidebar: { width: 280, flexShrink: 0 },
  welcome: { fontWeight: 700, marginBottom: 14, fontSize: 16 },
  navList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 },
  player: { flex: 1 },
  videoBox: { aspectRatio: "16/9", background: "#0d0d0f", borderRadius: 14, overflow: "hidden", marginBottom: 18, position: "relative" },
  videoPlaceholder: { width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 8, position: "relative" },
  watermark: { position: "absolute", bottom: 14, right: 16, fontSize: 12, color: "rgba(255,255,255,.45)" },
  adminHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  adminRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", border: `1px solid ${LINE}`, borderRadius: 12, marginBottom: 10 },
  rowActions: { display: "flex", gap: 8 },
};
const CSS = `
* { box-sizing: border-box; } body { margin: 0; }
button { font-family: inherit; cursor: pointer; border-radius: 10px; font-size: 14px; font-weight: 600; transition: .15s; }
button.primary { background: ${ACC}; color: #fff; border: none; padding: 12px 22px; }
button.primary:hover { opacity: .88; } button.primary:disabled { opacity: .5; cursor: default; }
button.primary.small { padding: 8px 14px; }
button.ghost { background: #fff; color: ${INK}; border: 1px solid ${LINE}; padding: 10px 18px; }
button.ghost:hover { background: #f7f7f8; } button.ghost.small { padding: 8px 14px; } button.ghost:disabled { opacity: .4; cursor: not-allowed; }
button.danger { background: #fff; color: #b91c1c; border: 1px solid #f0caca; } button.danger.small { padding: 8px 14px; } button.danger:hover { background: #fef2f2; }
button.link { background: none; border: none; color: ${MUT}; margin-top: 16px; padding: 0; text-decoration: underline; }
button.link.inline { margin: 0; color: ${INK}; }
.lessonBtn { width: 100%; text-align: left; background: #fff; border: 1px solid ${LINE}; padding: 12px 14px; display: flex; justify-content: space-between; gap: 8px; color: ${INK}; }
.lessonBtn:hover { background: #f7f7f8; } .lessonBtn.on { border-color: ${ACC}; background: #f3f4f6; }
input:focus { border-color: ${ACC}; }
@media (max-width: 720px) { .studentWrap { flex-direction: column !important; } }
`;
