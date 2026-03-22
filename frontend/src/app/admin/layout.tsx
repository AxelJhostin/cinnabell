import { AdminGate } from "@/components/auth/admin-gate";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminGate>{children}</AdminGate>;
}
