interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto max-w-[1200px] px-6 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}
