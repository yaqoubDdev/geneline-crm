import { requireRole } from "@/lib/session";
import { getActiveBusinessTypes, getProgressForAgent, getRowsForAgent } from "@/lib/queries";
import AgentApp from "@/components/AgentApp";

export default async function AgentPage() {
  const user = await requireRole("agent");
  const [rows, progress, types] = await Promise.all([
    getRowsForAgent(Number(user.id)),
    getProgressForAgent(Number(user.id)),
    getActiveBusinessTypes(),
  ]);
  return <AgentApp rows={rows} progress={progress} types={types} agentName={user.name ?? "Agent"} />;
}
