interface SplashLogoProps {
  compact?: boolean;
  className?: string;
}

export function SplashLogo({
  compact = false,
  className = "",
}: SplashLogoProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img
        alt="Splash"
        className={compact ? "h-8 w-8 object-contain" : "h-9 w-auto max-w-[132px] object-contain"}
        src="/splash.png"
      />
    </span>
  );
}
