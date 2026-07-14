export type Stage = "New" | "Interested" | "Reluctant" | "Absent" | "Won" | "Lost";
export type BizType = "Salon" | "Restaurant" | "Corporate";
export type AccountStatus = "Pending" | "Active" | "Paused" | "Churned";

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
  contact: string;
  type: BizType;
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
