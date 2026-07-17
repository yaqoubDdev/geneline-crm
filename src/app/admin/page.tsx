import { requireRole } from "@/lib/session";
import {
  getAgentDailyProgress,
  getAgents,
  getAllRows,
  getRecentAudit,
} from "@/lib/queries";
import AdminApp from "@/components/AdminApp";

export default async function AdminPage() {
  const user = await requireRole("admin");
  const [rows, agentList, progress, audit] = await Promise.all([
    getAllRows(),
    getAgents(),
    getAgentDailyProgress(),
    getRecentAudit(),
  ]);
  return (
    <AdminApp
      rows={rows}
      agentList={agentList}
      progress={progress}
      audit={audit}
      adminName={user.name ?? "Admin"}
    />
  );
}
