const COLORS = {
  accent:  "text-accent  hover:bg-accent/10",
  success: "text-success hover:bg-success/10",
  danger:  "text-danger  hover:bg-danger/10",
};

export default function MenuOption({ icon, children, color = "accent", onClick, disabled }) {
  return (
    <button
      type="button"
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
