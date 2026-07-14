import { requireRole } from "@/lib/session";
import { getAgents, getAllRows } from "@/lib/queries";
import AdminApp from "@/components/AdminApp";

export default async function AdminPage() {
  const user = await requireRole("admin");
  const [rows, agentList] = await Promise.all([getAllRows(), getAgents()]);
  return <AdminApp rows={rows} agentList={agentList} adminName={user.name ?? "Admin"} />;
}
