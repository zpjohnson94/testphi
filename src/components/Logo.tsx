import logoSrc from "@/assets/logo.png";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <img
      src={logoSrc}
      width={size}
      height={size}
      alt="TestPhi logo"
      className={className}
      style={{ borderRadius: 8 }}
    />
  );
}
