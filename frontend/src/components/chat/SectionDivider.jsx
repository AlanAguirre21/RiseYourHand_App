// Start of a section in the chat: its name between two lines, and its description (if any) below
export default function SectionDivider({ name, description }) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-3 text-[11px] font-medium text-text-muted">
        <span className="h-px flex-1 bg-white/60" />
        {name}
        <span className="h-px flex-1 bg-white/60" />
      </div>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-balance text-center text-[11px] leading-snug text-text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
