export default function AccentLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mb-4 h-[3px] w-16 bg-accent-500 ${className}`}
      aria-hidden="true"
    />
  );
}
