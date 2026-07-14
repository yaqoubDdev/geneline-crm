export type Stage = "New" | "Interested" | "Reluctant" | "Absent" | "Won" | "Lost";
export type BizType = "Salon" | "Restaurant" | "Corporate";

export type Account = {
  ownerName: string;
  email: string;
  personalPhone: string | null;
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
  agent: string; // agent's display name
  price: number | null;
  onboarded: boolean;
  account: Account;
};
