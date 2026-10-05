---
name: reference-bot-styles
description: "Sistema de diseño completo del chatbot (glass morphism + neumorphism Apple light) — tokens CSS, utilidades y componentes React copiables"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 9def810f-35f1-48b2-8a94-e4621106c233
---

# Bot UI — Design System (Glass + Neumorphism)

Fuente: `C:\Development\33_eScalation\eScalation_ESL\frontend\src\`
Stack: React + Tailwind v4 (`@import "tailwindcss"`)

---

## 1. `index.css` — Tokens y utilidades globales

```css
@import "tailwindcss";

@theme {
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable Display",
    "Segoe UI", ui-sans-serif, sans-serif;

  /* Superficies */
  --color-surface:       #eef1f6;
  --color-panel:         #ffffff;
  --color-border:        #e5e5ea;
  --color-border-strong: #d1d1d6;

  /* Texto */
  --color-text:          #1d1d1f;
  --color-text-muted:    #6e6e73;
  --color-text-faint:    #aeaeb2;

  /* Acento / marca */
  --color-accent:        #007aff;
  --color-zf-blue:       #0057b7;
  --color-accent-soft:   #ebf4ff;

  /* Semánticos */
  --color-success:       #34c759;
  --color-success-hover: #30d158;
  --color-danger:        #ff3b30;
  --color-danger-hover:  #ff5247;
  --color-warning:       #ff9f0a;
  --color-warning-hover: #ffad2e;

  --radius-panel:   18px;
  --radius-control: 12px;
}

html { background-color: #eef1f6; }

body {
  color: var(--color-text);
  font-family: var(--font-sans);
  min-height: 100vh;
  background:
    radial-gradient(at 15% 15%, hsla(212,100%,88%,0.55) 0, transparent 50%),
    radial-gradient(at 85% 10%, hsla(280,100%,90%,0.45) 0, transparent 50%),
    radial-gradient(at 10% 85%, hsla(340,100%,90%,0.40) 0, transparent 50%),
    radial-gradient(at 90% 90%, hsla(190,100%,88%,0.45) 0, transparent 50%),
    #eef1f6;
  background-attachment: fixed;
}

/* Glass morphism */
@supports (backdrop-filter: blur(1px)) {
  .glass {
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
  }
}

/* Neumorphism elevado */
.neu-raised {
  box-shadow:
     7px  7px 16px rgba(163,177,198,0.35),
    -7px -7px 16px rgba(255,255,255,0.85);
}

/* Neumorphism hundido (inputs) */
.neu-inset {
  box-shadow:
    inset  4px  4px 10px rgba(163,177,198,0.30),
    inset -4px -4px 10px rgba(255,255,255,0.75);
}
```

---

## 2. Componentes React

### `ChatBubble.jsx`
```jsx
// Requiere: Avatar, Tailwind tokens
export default function ChatBubble({ from, children }) {
  const isBot = from === "bot";
  return (
    <div className={`flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && <Avatar size={26} />}
      <div className={`glass max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${
        isBot
          ? "bg-white/65 text-text border border-white/60 rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          : "bg-gradient-to-br from-accent to-[#409CFF] text-white rounded-br-sm shadow-lg shadow-accent/25"
      }`}>
        {children}
      </div>
    </div>
  );
}
```

### `Avatar.jsx`
```jsx
// Reemplaza EscalateIcon con el ícono SVG del bot de tu app
export default function Avatar({ size = 36 }) {
  return (
    <div
      className="neu-raised flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#5AC8FA] shrink-0 ring-1 ring-white/50"
      style={{ width: size, height: size }}
    >
      <YourBotIcon className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}
```

### `Button.jsx`
```jsx
const VARIANTS = {
  default: "neu-raised bg-white/60 text-text border border-white/50 hover:bg-white/80",
  primary: "bg-accent  text-white border-transparent hover:brightness-110 shadow-md shadow-accent/25",
  success: "bg-success text-white border-transparent hover:bg-success-hover shadow-md shadow-success/25",
  danger:  "bg-danger  text-white border-transparent hover:bg-danger-hover  shadow-md shadow-danger/25",
  warning: "bg-warning text-white border-transparent hover:bg-warning-hover shadow-md shadow-warning/25",
};

export default function Button({ variant = "default", className = "", ...props }) {
  return (
    <button
      className={`rounded-control px-4 py-1.5 font-medium text-sm transition-all active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
```

### `MenuOption.jsx` — quick replies (Sí/No, listas)
```jsx
const COLORS = {
  accent:  "text-accent  hover:bg-accent/10",
  success: "text-success hover:bg-success/10",
  danger:  "text-danger  hover:bg-danger/10",
};

export default function MenuOption({ icon, children, color = "accent", onClick, disabled }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
        transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
        ${COLORS[color]}`}
    >
      <span className="w-4 h-4 shrink-0">{icon}</span>
      {children}
    </button>
  );
}
```

### `Input.jsx`
```jsx
export function Input(props) {
  return (
    <input {...props}
      className={`neu-inset w-full bg-white/60 border border-white/50 rounded-control px-3 py-1.5
        text-sm text-text placeholder:text-text-faint
        focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-shadow
        ${props.className || ""}`}
    />
  );
}

export function Label({ children }) {
  return <label className="block text-xs font-medium text-text-muted mb-1">{children}</label>;
}
```

---

## 3. Estructura del chat container

```jsx
{/* Tarjeta principal del chat */}
<div className="glass neu-raised rounded-[28px] overflow-hidden border border-white/50 bg-white/40
  flex flex-col h-[calc(100vh-8.5rem)] min-h-[420px] max-h-[880px] w-full max-w-2xl">

  {/* Header */}
  <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/40">
    <div className="flex items-center gap-3">
      <Avatar size={42} />
      <div>
        <p className="text-sm font-semibold text-zf-blue leading-tight">Bot Name</p>
        <p className="text-xs text-text-muted leading-tight">Subtítulo o estado</p>
      </div>
    </div>
    {/* Badge "En línea" */}
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(52,199,89,0.7)]" />
      <span className="text-xs font-medium text-success">En línea</span>
    </div>
  </div>

  {/* Área de mensajes */}
  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
    {/* Separador de fecha */}
    <div className="flex items-center gap-3 text-[11px] text-text-muted capitalize">
      <span className="flex-1 h-px bg-white/60" />
      Lunes 22 de septiembre
      <span className="flex-1 h-px bg-white/60" />
    </div>

    {/* Burbujas */}
    <ChatBubble from="bot">Mensaje del bot</ChatBubble>
    <ChatBubble from="user">Respuesta del usuario</ChatBubble>

    {/* Quick replies */}
    <div className="flex items-end gap-2 justify-start">
      <Avatar size={26} />
      <div className="glass neu-raised bg-white/65 border border-white/60 rounded-2xl rounded-bl-sm p-1.5 min-w-[180px]">
        <MenuOption icon={<CheckCircleIcon />} color="success">Sí</MenuOption>
        <MenuOption icon={<XCircleIcon />}    color="danger" >No</MenuOption>
      </div>
    </div>
  </div>

  {/* Input bar */}
  <form className="shrink-0 flex items-center gap-2 px-4 py-3.5 border-t border-white/40">
    <input
      className="neu-inset flex-1 bg-white/50 border border-white/50 rounded-full px-4 py-2
        text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
      placeholder="Escribe tu respuesta..."
    />
    <button
      type="submit"
      className="neu-raised w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-accent to-[#409CFF]
        text-white flex items-center justify-center hover:brightness-110 active:scale-95
        transition-all disabled:opacity-40 disabled:active:scale-100"
    >
      <SendIcon className="w-4 h-4" />
    </button>
  </form>

  {/* Status bar inferior */}
  <p className="shrink-0 px-5 pb-3 text-[11px] text-text-muted">Esperando respuesta...</p>
</div>
```

---

## Tabla resumen visual

| Elemento            | Receta Tailwind                                                           |
|---------------------|---------------------------------------------------------------------------|
| Fondo app           | 4× `radial-gradient` pastel + `background-attachment: fixed` + `#eef1f6` |
| Tarjeta chat        | `glass` + `neu-raised` + `bg-white/40` + `border-white/50` + `rounded-[28px]` |
| Burbuja bot         | `glass bg-white/65 border-white/60 rounded-bl-sm`                        |
| Burbuja usuario     | `bg-gradient-to-br from-accent to-[#409CFF] rounded-br-sm`               |
| Avatar bot          | Gradiente `accent → #5AC8FA` + `neu-raised` + `ring-white/50`            |
| Quick replies panel | `glass neu-raised bg-white/65 border-white/60 rounded-2xl rounded-bl-sm` |
| Input text          | `neu-inset bg-white/50 border-white/50 rounded-full`                     |
| Botón enviar        | Gradiente accent + `rounded-full` + `active:scale-95`                    |
| Badge online        | `bg-success shadow-[0_0_6px_rgba(52,199,89,0.7)]`                        |
| Separador fecha     | `h-px bg-white/60` flanqueando texto `text-text-muted capitalize`        |
