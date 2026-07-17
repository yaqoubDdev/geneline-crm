import { requireRole } from "@/lib/session";
import { getProgressForAgent, getRowsForAgent } from "@/lib/queries";
import AgentApp from "@/components/AgentApp";

export default async function AgentPage() {
  const user = await requireRole("agent");
  const [rows, progress] = await Promise.all([
    getRowsForAgent(Number(user.id)),
    getProgressForAgent(Number(user.id)),
  ]);
  return <AgentApp rows={rows} progress={progress} agentName={user.name ?? "Agent"} />;
}
