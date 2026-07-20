import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditAction =
  | "create_business"
  | "update_business"
  | "onboard_business"
  | "account_status_change"
  | "create_user"
  | "change_password"
  | "reset_password"
  | "delete_user";

type AuditEntry = {
  userId: number | null;
  actorName: string;
  action: AuditAction;
  businessId?: number | null;
  businessCode?: string | null;
  businessName?: string | null;
  details?: string | null;
};

/**
 * Append a row to the audit trail. Never throws into the caller — a failed log
 * must not roll back the user's actual action.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      actorName: entry.actorName,
      action: entry.action,
      businessId: entry.businessId ?? null,
      businessCode: entry.businessCode ?? null,
      businessName: entry.businessName ?? null,
      details: entry.details ?? null,
    });
  } catch (err) {
    console.error("audit log failed:", err);
  }
}
