const VARIANTS = {
  default: 'neu-raised bg-white/60 text-text border border-white/50 hover:bg-white/80',
  primary: 'bg-accent  text-white border-transparent hover:brightness-110 shadow-md shadow-accent/25',
  success: 'bg-success text-white border-transparent hover:bg-success-hover shadow-md shadow-success/25',
  danger:  'bg-danger  text-white border-transparent hover:bg-danger-hover  shadow-md shadow-danger/25',
  warning: 'bg-warning text-white border-transparent hover:bg-warning-hover shadow-md shadow-warning/25',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
  lg: 'w-full px-4 py-3 text-sm font-semibold',
};

export default function Button({ as: Comp = 'button', variant = 'default', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <Comp
      {...(Comp === 'button' ? { type } : {})}
      className={`inline-flex items-center justify-center gap-1.5 rounded-control border font-medium transition-all active:scale-95
        disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100
        ${VARIANTS[variant] ?? `border-transparent ${variant}`} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
