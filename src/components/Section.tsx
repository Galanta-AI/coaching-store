interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function Section({ children, className = "", id }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-14 md:py-[100px] ${id ? "scroll-mt-[var(--nav-height)]" : ""} ${className}`}
    >
      {children}
    </section>
  );
}
