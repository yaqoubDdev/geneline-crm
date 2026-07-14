import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Require any authenticated user, else send to login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Require a specific role; wrong role is bounced to their own home. */
export async function requireRole(role: "agent" | "admin") {
  const user = await requireUser();
  if (user.role !== role) {
    redirect(user.role === "admin" ? "/admin" : "/agent");
  }
  return user;
}
