import { AppShell } from "@/components/shell/app-shell";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="tenant">{children}</AppShell>;
}
