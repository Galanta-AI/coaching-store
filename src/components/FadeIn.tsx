interface FadeInProps {
  children: React.ReactNode;
  /** Retained for API compatibility with existing callers; no longer animated. */
  delay?: number;
  className?: string;
}

export default function FadeIn({ children, className = "" }: FadeInProps) {
  return <div className={className}>{children}</div>;
}
