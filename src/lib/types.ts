export type Stage = "New" | "Interested" | "Reluctant" | "Absent" | "Won" | "Lost";
// Business types are admin-managed (stored in business_types), so this is just a name.
export type BizType = string;
export type AccountStatus = "Pending" | "Active" | "Paused" | "Churned";

/** A selectable business type (agent-facing dropdowns). */
export type TypeOption = { name: string; monthlyFee: number; icon: string };
/** A business type with admin fields (management view). */
export type TypeAdmin = TypeOption & { id: number; active: boolean; usage: number };

export type Account = {
  ownerName: string;
  email: string;
  personalPhone: string | null;
  status: AccountStatus;
} | null;

/** A business row shaped for the UI (mirrors the prototype's row objects). */
export type Row = {
  dbId: number;
  code: string; // GX-0001
  name: string;
  address: string | null;
  contactName: string | null; // owner / contact person
  contact: string;
  type: BizType;
  typeIcon: string | null; // lucide icon key for this business's type
  stage: Stage;
  objection: string | null;
  lostReason: string | null;
  nextAction: string | null;
  followUpDate: string | null; // YYYY-MM-DD
  agent: string; // agent's display name
  monthlyFee: number | null; // Le / month
  onboarded: boolean;
  account: Account;
};
