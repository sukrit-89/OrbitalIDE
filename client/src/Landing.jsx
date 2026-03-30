import { ArrowRight, Code2, Rocket, Zap, Bot, Shield, Eye } from 'lucide-react';

const FEATURES = [
  { icon: Code2, title: 'Monaco Editor', desc: 'Full IDE editing with syntax highlighting, inline completions, and AI shortcuts.' },
  { icon: Rocket, title: 'One-Click Deploy', desc: 'Compile Rust to WASM and deploy to Stellar testnet with per-step progress.' },
  { icon: Zap, title: 'Function Discovery', desc: 'Auto-parse on-chain contract spec to discover callable functions with typed params.' },
  { icon: Bot, title: 'AI Assistant', desc: 'Generate, explain, debug, and improve Soroban contracts using LLaMA 3 via Groq.' },
  { icon: Shield, title: 'Multi-Wallet', desc: 'Freighter, Albedo, WalletConnect, and LOBSTR with typed error categorization.' },
  { icon: Eye, title: 'Event Sync', desc: 'Live event polling with cursor persistence and real-time transaction history.' },
];

function Landing({ onEnterIDE }) {
  return (
    <div className="landing">
      {/* Logo */}
      <div className="landing-logo">
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="9" stroke="white" strokeWidth="2.5" fill="none" />
          <circle cx="19" cy="4" r="2.5" fill="white" />
          <circle cx="19" cy="34" r="2.5" fill="white" />
          <circle cx="4" cy="19" r="2.5" fill="white" />
          <circle cx="34" cy="19" r="2.5" fill="white" />
          <circle cx="8.5" cy="8.5" r="2" fill="white" opacity="0.5" />
          <circle cx="29.5" cy="29.5" r="2" fill="white" opacity="0.5" />
          <circle cx="29.5" cy="8.5" r="2" fill="white" opacity="0.5" />
          <circle cx="8.5" cy="29.5" r="2" fill="white" opacity="0.5" />
        </svg>
      </div>

      {/* Badge */}
      <div className="landing-badge">
        <span>⬡</span> Stellar Testnet · Soroban
      </div>

      {/* Title */}
      <h1 className="landing-title">
        Orbital IDE
      </h1>
      <p className="landing-subtitle">
        A premium browser development environment for Soroban smart contracts.
        Write, compile, deploy, and interact — no local toolchain required.
      </p>

      {/* Feature chips */}
      <div className="landing-features">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div className="landing-feature" key={title} title={desc}>
            <Icon size={14} className="icon" />
            <span>{title}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button className="btn-launch" onClick={onEnterIDE}>
        Launch IDE <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default Landing;
