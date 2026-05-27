import Link from "next/link";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function Button({
  children,
  href,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-7 py-3.5 text-sm font-medium uppercase tracking-[0.1em] transition-all duration-200";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-accent-500 text-white hover:bg-accent-600 hover:shadow-[0_0_20px_rgba(130,189,102,0.2)] active:bg-accent-700 active:shadow-none",
    ghost:
      "border border-neutral-600 text-neutral-200 hover:border-neutral-400 hover:text-white",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
