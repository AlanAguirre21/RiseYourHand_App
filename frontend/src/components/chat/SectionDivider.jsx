export default function SectionDivider({ name }) {
  return (
    <div className="flex items-center gap-3 py-1 text-[11px] font-medium text-text-muted">
      <span className="h-px flex-1 bg-white/60" />
      {name}
      <span className="h-px flex-1 bg-white/60" />
    </div>
  );
}
