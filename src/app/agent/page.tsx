import { requireRole } from "@/lib/session";
import { getRowsForAgent } from "@/lib/queries";
import AgentApp from "@/components/AgentApp";

export default async function AgentPage() {
  const user = await requireRole("agent");
  const rows = await getRowsForAgent(Number(user.id));
  return <AgentApp rows={rows} agentName={user.name ?? "Agent"} />;
}
