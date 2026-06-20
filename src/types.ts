export interface PartyVotes {
  APC: number;
  PDP: number;
  ADC: number;
  LP: number;
  ACCORD: number;
  SDP: number;
}

export type PartyName = keyof PartyVotes;

export interface PollingUnitResult {
  id: string;
  lga: string;
  ward: string;
  wardCode: string;
  puName: string;
  puCode: string;
  registeredVoters: number;
  accreditedVoters: number;
  votes: PartyVotes;
  isEntered: boolean; // flag to distinguish unentered templates from entered results
  updatedAt: string;
}

export interface WardSummary {
  wardName: string;
  wardCode: string;
  lgaName: string;
  puCount: number;
  pusEntered: number;
  registeredVoters: number;
  accreditedVoters: number;
  votes: PartyVotes;
  totalVotes: number;
  turnoutRate: number; // percentage
}

export interface LgaSummary {
  lgaName: string;
  totalPUs: number;
  pusEntered: number;
  wardCount: number;
  registeredVoters: number;
  accreditedVoters: number;
  votes: PartyVotes;
  totalVotes: number;
  turnoutRate: number; // percentage
}

export interface GlobalStats {
  totalRegistered: number;
  totalAccredited: number;
  overallTurnout: number; // %
  totalVotes: number;
  leaderboard: { party: string; votes: number; percentage: number; color: string }[];
  reportingProgress: { entered: number; total: number; percentage: number };
}

export interface LgaMetadata {
  name: string;
  totalPUs: number;
}

export const PARTIES: PartyName[] = ["APC", "PDP", "ADC", "LP", "ACCORD", "SDP"];

export const EKITI_LGAS: LgaMetadata[] = [
  { name: "ADO EKITI", totalPUs: 344 },
  { name: "EFON", totalPUs: 119 },
  { name: "EKITI EAST", totalPUs: 112 },
  { name: "EKITI SOUTH WEST", totalPUs: 188 },
  { name: "EKITI WEST", totalPUs: 184 },
  { name: "EMURE", totalPUs: 94 },
  { name: "GBONYIN", totalPUs: 115 },
  { name: "IDO / OSI", totalPUs: 144 },
  { name: "IJERO", totalPUs: 145 },
  { name: "IKERE", totalPUs: 125 },
  { name: "IKOLE", totalPUs: 189 },
  { name: "ILEJEMEJE", totalPUs: 91 },
  { name: "IREPODUN/IFELODUN", totalPUs: 174 },
  { name: "ISE /ORUN", totalPUs: 114 },
  { name: "MOBA", totalPUs: 116 },
  { name: "OYE", totalPUs: 191 }
];

export const PARTY_COLORS: Record<PartyName, string> = {
  APC: "#1E3A8A", // dark blue
  PDP: "#DC2626", // red
  ADC: "#F59E0B", // amber
  LP: "#10B981",  // green
  ACCORD: "#8B5CF6", // purple
  SDP: "#EC4899"  // pink
};
