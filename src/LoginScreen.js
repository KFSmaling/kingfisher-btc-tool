import { useState } from "react";
import { useAuth } from "./services/authContext";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode]       = useState("login");   // "login" | "register"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn({ email, password });
        if (error) setError(error.message);
      } else {
        const { error } = await signUp({ email, password });
        if (error) {
          setError(error.message);
        } else {
          setInfo("Registratie gelukt! Controleer je e-mail om je account te bevestigen.");
          setMode("login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col">

      {/* Header — zelfde stijl als app */}
      <header className="h-20 bg-[#001f33] text-white flex items-center shadow-xl border-b-2 border-[#00AEEF]/50">
        <div className="bg-white px-4 flex items-center h-full border-r border-slate-200/20">
          <img src="/kf-logo.png" alt="Kingfisher & Partners" className="h-9 object-contain" />
        </div>
        <div className="px-6">
          <h1 className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/90 leading-none">Business Transformation Canvas</h1>
          <p className="text-[9px] tracking-[0.2em] text-[#00AEEF]/70 mt-1 uppercase font-light">From strategy to execution</p>
        </div>
      </header>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="bg-white rounded-sm shadow-xl border-t-4 border-[#00AEEF] overflow-hidden">

            {/* Card header */}
            <div className="px-8 py-7 bg-[#001f33]">
              <h2 className="text-white font-black text-base uppercase tracking-widest">
                {mode === "login" ? "Inloggen" : "Account aanmaken"}
              </h2>
              <p className="text-white/40 text-[10px] mt-1 uppercase tracking-wider">
                Kingfisher &amp; Partners — intern gebruik
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3">
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              {info && (
                <div className="bg-green-50 border border-green-200 rounded-sm px-4 py-3">
                  <p className="text-green-700 text-xs">{info}</p>
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="naam@kingfisher.nl"
                  className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#00AEEF] transition-colors bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Wachtwoord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimaal 6 tekens"
                  className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#00AEEF] transition-colors bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#001f33] hover:bg-[#00AEEF] text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Bezig…" : mode === "login" ? "Inloggen" : "Account aanmaken"}
              </button>

            </form>

            {/* Mode toggle */}
            <div className="px-8 pb-7 border-t border-slate-100 pt-5">
              {mode === "login" ? (
                <p className="text-[10px] text-slate-400 text-center">
                  Nog geen account?{" "}
                  <button
                    onClick={() => { setMode("register"); setError(null); setInfo(null); }}
                    className="text-[#00AEEF] font-bold hover:text-orange-500 transition-colors"
                  >
                    Aanmaken
                  </button>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 text-center">
                  Al een account?{" "}
                  <button
                    onClick={() => { setMode("login"); setError(null); setInfo(null); }}
                    className="text-[#00AEEF] font-bold hover:text-orange-500 transition-colors"
                  >
                    Inloggen
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-400 mt-6 uppercase tracking-widest">
            Kingfisher &amp; Partners · Vertrouwelijk
          </p>
        </div>
      </div>
    </div>
  );
}
