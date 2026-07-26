import { AppShell } from "@/components/shell/app-shell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="platform">{children}</AppShell>;
}
