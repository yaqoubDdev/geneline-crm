import { requireRole } from "@/lib/session";
import {
  getAgentDailyProgress,
  getAgents,
  getAllBusinessTypes,
  getAllRows,
  getRecentAudit,
} from "@/lib/queries";
import AdminApp from "@/components/AdminApp";

export default async function AdminPage() {
  const user = await requireRole("admin");
  const [rows, agentList, progress, audit, types] = await Promise.all([
    getAllRows(),
    getAgents(),
    getAgentDailyProgress(),
    getRecentAudit(),
    getAllBusinessTypes(),
  ]);
  return (
    <AdminApp
      rows={rows}
      agentList={agentList}
      progress={progress}
      audit={audit}
      types={types}
      adminName={user.name ?? "Admin"}
    />
  );
}
