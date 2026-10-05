import Avatar from './Avatar.jsx';

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
