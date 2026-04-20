/**
 * ErrorBoundary — voorkomt wit scherm bij onverwachte crashes
 *
 * React vereist een class component voor error boundaries.
 * Toont een Kingfisher-huisstijl fallback met hersteloptie.
 */

import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Hier later eventueel Sentry o.i.d. koppelen
    console.error("[ErrorBoundary] Onverwachte fout:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#1a365d] flex items-center justify-center p-8">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full p-10 text-center space-y-6">

            {/* Logo */}
            <img
              src="/kf-logo.png"
              alt="Kingfisher & Partners"
              className="h-10 w-auto mx-auto object-contain"
              onError={e => { e.target.style.display = "none"; }}
            />

            {/* Foutmelding */}
            <div className="flex items-center justify-center gap-3 text-red-500">
              <AlertOctagon size={24} />
              <h2 className="text-lg font-bold text-[#1a365d]">Er is iets misgegaan</h2>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">
              De applicatie is tegen een onverwachte fout aangelopen.
              Je data is veilig opgeslagen in Supabase.
            </p>

            {/* Foutdetail (alleen in development) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs bg-slate-50 border border-slate-200 rounded p-3 overflow-auto max-h-32 text-red-600">
                {this.state.error.toString()}
              </pre>
            )}

            {/* Herstel-knop */}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 mx-auto bg-[#8dc63f] hover:bg-[#7ab52e] text-[#1a365d] px-6 py-3 rounded-sm font-bold text-sm uppercase tracking-widest transition-colors shadow-sm"
            >
              <RefreshCw size={14} /> Pagina herladen
            </button>

            <p className="text-[10px] text-slate-300 uppercase tracking-widest">
              Kingfisher & Partners · Business Transformation Canvas
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
