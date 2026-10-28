export default function ChatMessage({ message, sender }) {
  const isUser = sender === 'user';

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[78%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-slate-900 text-white'
            : 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6">{message}</p>
      </div>
    </div>
  );
}
