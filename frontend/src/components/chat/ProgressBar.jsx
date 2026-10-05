export default function ProgressBar({ answered, total }) {
  const percent = total ? (answered / total) * 100 : 0;
  return (
    <div
      className="neu-inset h-1.5 overflow-hidden rounded-full bg-white/50"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={answered}
      aria-label={`${answered} de ${total} respondidas`}
    >
      <div className="h-full rounded-full bg-gradient-to-br from-accent to-[#409CFF] transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}
