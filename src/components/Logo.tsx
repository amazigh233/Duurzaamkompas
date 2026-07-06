export function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 72 72" aria-hidden="true">
      <path className="logo-frame" d="M36 5 61 19.4v33.2L36 67 11 52.6V19.4Z" />
      <path className="logo-roof" d="M18 31 36 17l18 14" />
      <path className="logo-house" d="M22.5 31.5v19.8L36 59l13.5-7.7V31.5" />
      <path className="logo-window" d="M30.5 27.5h5.8v5.8h-5.8zM38.8 27.5h5.8v5.8h-5.8zM30.5 36h5.8v5.8h-5.8zM38.8 36h5.8v5.8h-5.8z" />
      <path className="logo-needle-shadow" d="M17 61 34.2 35.7 56 16 42 42.6Z" />
      <path className="logo-needle" d="M17 61 33.8 34.7 56 16 42.3 42.3Z" />
      <path className="logo-needle-fold" d="M33.8 34.7 42.3 42.3 17 61Z" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <LogoMark />
      <span className="brand-text">
        <strong>
          <span className="brand-word-main">DuurzaamWoning</span>
          <span className="brand-word-accent">Kompas</span>
        </strong>
        <small>Onafhankelijk woningadvies</small>
      </span>
    </span>
  );
}
