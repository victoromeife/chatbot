export default function TypingIndicator() {
  return (
    <div className="mb-4 flex justify-start">
      <div className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/70">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
}
