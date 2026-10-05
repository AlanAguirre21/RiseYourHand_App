const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('');

export default function UserAvatar({ user, size = 32, className = '' }) {
  const base = `shrink-0 rounded-full ring-1 ring-white/60 ${className}`;

  if (user.avatar) {
    return <img src={user.avatar} alt="" width={size} height={size} className={`object-cover ${base}`} style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center bg-accent-soft font-semibold text-accent ${base}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(user.name)}
    </span>
  );
}
