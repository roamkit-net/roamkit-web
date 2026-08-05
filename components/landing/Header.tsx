import { AuthNav } from "@/components/AuthNav";
import { Logo } from "@/components/landing/Logo";

export function Header() {
  return (
    <header className="relative flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
      <Logo />
      <AuthNav variant="landing" />
    </header>
  );
}
