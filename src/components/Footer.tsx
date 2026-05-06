import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer
      className="w-full px-5 py-4 text-center text-[11px]"
      style={{ color: "rgba(246,240,250,0.4)" }}
    >
      © {new Date().getFullYear()} TestPhi ·{" "}
      <Link
        to={"/privacy" as any}
        className="hover:underline"
        style={{ color: "rgba(246,240,250,0.55)" }}
      >
        Privacy
      </Link>
    </footer>
  );
}
