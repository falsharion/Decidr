export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface2: #1a1a26;
    --border: rgba(255,255,255,0.07);
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --cream: #f0e6cc;
    --muted: rgba(240,230,204,0.4);
    --glow: rgba(201,168,76,0.15);
    --error: rgba(255, 100, 100, 0.15);
    --error-border: rgba(255, 100, 100, 0.3);
    --error-text: #ff9090;
  }

  body {
    background: var(--bg);
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 80% 80%, rgba(124,92,191,0.06) 0%, transparent 50%),
      var(--bg);
    position: relative;
    overflow-x: hidden;
  }

  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  .container { max-width: 720px; margin: 0 auto; padding: 40px 20px 80px; position: relative; z-index: 1; }

  /* HEADER */
  .header { text-align: center; margin-bottom: 48px; }
  .header-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.25em; color: var(--gold); text-transform: uppercase; margin-bottom: 16px; opacity: 0.8; }
  .header h1 { font-family: 'Playfair Display', serif; font-size: clamp(42px, 8vw, 72px); font-weight: 700; line-height: 1.0; color: var(--cream); margin-bottom: 16px; }
  .header h1 em { font-style: italic; color: var(--gold-light); }
  .header p { color: var(--muted); font-size: 15px; font-weight: 300; line-height: 1.6; max-width: 440px; margin: 0 auto; }

  /* CARD */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 28px; margin-bottom: 16px; position: relative; overflow: hidden; }
  .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent); }
  .card-title { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; opacity: 0.7; }

  /* MODE TABS */
  .mode-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
  .mode-tab { flex: 1; padding: 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; text-align: center; }
  .mode-tab.active { background: var(--glow); border-color: rgba(201,168,76,0.3); color: var(--gold-light); }

  /* OPTIONS */
  .options-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .option-row { display: flex; gap: 10px; align-items: center; animation: slideIn 0.3s ease; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  .option-num { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--gold); opacity: 0.5; width: 20px; flex-shrink: 0; text-align: right; }
  .option-input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; color: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
  .option-input::placeholder { color: rgba(240,230,204,0.2); }
  .option-input:focus { border-color: rgba(201,168,76,0.4); box-shadow: 0 0 0 3px rgba(201,168,76,0.05); }
  .remove-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; flex-shrink: 0; }
  .remove-btn:hover { border-color: rgba(255,80,80,0.3); color: #ff8080; background: rgba(255,80,80,0.05); }
  .add-option-btn { background: transparent; border: 1px dashed rgba(201,168,76,0.25); border-radius: 10px; padding: 10px 16px; color: var(--gold); font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.1em; cursor: pointer; width: 100%; transition: all 0.2s; text-transform: uppercase; }
  .add-option-btn:hover { border-color: var(--gold); background: var(--glow); }

  /* CONTEXT */
  .context-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; color: var(--cream); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; outline: none; resize: none; min-height: 80px; transition: border-color 0.2s, box-shadow 0.2s; line-height: 1.6; }
  .context-input::placeholder { color: rgba(240,230,204,0.2); }
  .context-input:focus { border-color: rgba(201,168,76,0.4); box-shadow: 0 0 0 3px rgba(201,168,76,0.05); }

  /* DECIDE BUTTON */
  .decide-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #c9a84c, #a07830); border: none; border-radius: 14px; color: #1a1208; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; font-style: italic; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; margin-bottom: 16px; box-shadow: 0 4px 30px rgba(201,168,76,0.2); }
  .decide-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); opacity: 0; transition: opacity 0.3s; }
  .decide-btn:hover:not(:disabled)::after { opacity: 1; }
  .decide-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(201,168,76,0.35); }
  .decide-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* SPINNER */
  .spinner-wrap { display: flex; justify-content: center; margin: 12px 0 24px; }
  .spinner-ring { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--gold); animation: spin 0.8s linear infinite; position: relative; }
  .spinner-ring::after { content: '✦'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--gold); animation: spin 0.8s linear infinite reverse; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* RESULT */
  .result-card { background: var(--surface); border: 1px solid rgba(201,168,76,0.2); border-radius: 20px; padding: 32px 28px; margin-bottom: 16px; position: relative; overflow: hidden; animation: resultReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes resultReveal { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .result-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
  .result-glow { position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 200px; height: 200px; background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%); pointer-events: none; }
  .result-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.25em; color: var(--gold); text-transform: uppercase; margin-bottom: 16px; opacity: 0.7; display: flex; align-items: center; gap: 10px; }
  .result-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(201,168,76,0.2), transparent); }
  .result-chosen { font-family: 'Playfair Display', serif; font-size: clamp(28px, 6vw, 48px); font-weight: 700; color: var(--gold-light); line-height: 1.1; margin-bottom: 8px; }
  .result-sublabel { font-size: 13px; color: var(--muted); font-weight: 300; margin-bottom: 24px; }

  /* AI */
  .ai-section { border-top: 1px solid var(--border); padding-top: 20px; margin-top: 4px; }
  .ai-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .ai-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; background: linear-gradient(135deg, rgba(124,92,191,0.2), rgba(124,92,191,0.1)); border: 1px solid rgba(124,92,191,0.3); color: #a585e8; padding: 4px 10px; border-radius: 20px; }
  .ai-thinking { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
  .dots { display: flex; gap: 4px; }
  .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--gold); animation: pulse 1.2s ease-in-out infinite; }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
  .ai-text { font-size: 14px; font-weight: 300; line-height: 1.7; color: rgba(240,230,204,0.75); }
  .ai-error { font-size: 13px; color: var(--error-text); background: var(--error); border: 1px solid var(--error-border); border-radius: 10px; padding: 12px 14px; font-family: 'DM Mono', monospace; }

  /* RESET */
  .reset-btn { width: 100%; padding: 13px; background: transparent; border: 1px solid var(--border); border-radius: 12px; color: var(--muted); font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .reset-btn:hover { border-color: rgba(240,230,204,0.2); color: var(--cream); }

  @media (max-width: 480px) {
    .container { padding: 24px 16px 60px; }
    .card { padding: 20px 16px; }
    .result-card { padding: 24px 20px; }
  }
`;