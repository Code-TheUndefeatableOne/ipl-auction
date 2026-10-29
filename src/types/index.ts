export type PlayerRole = string;

export type PlayerStatus = 'draft' | 'in_auction' | 'sold' | 'unsold';

export interface Player {
  id: string;
  code: string; // 3-digit code e.g. "101", "205"
  name: string;
  nation: string; // Player country (visible in international auction)
  isOverseas?: boolean;
  style: string; // e.g. "Right-hand bat / Right-arm fast"
  role: PlayerRole;
  basePrice: number; // in Lakhs
  currentBid?: number; // in Lakhs
  currentBidderTeamId?: string | null;
  status: PlayerStatus;
  soldTo?: string | null; // Team ID
  soldPrice?: number | null; // in Lakhs
  bidSteps?: BidStep[]; // Stack of bids for undo raise
}

export interface BidStep {
  price: number;
  bidderTeamId: string | null;
  timestamp: number;
}

export interface BidRecord {
  id: string;
  timestamp: number;
  type: 'base' | 'raise' | 'undo_raise' | 'sold' | 'unsold' | 'undo';
  price: number; // in Lakhs
  increment?: number; // in Lakhs
  teamId?: string | null;
  message: string;
}

export type TeamId = 'SRH' | 'MI' | 'CSK' | 'RCB' | 'KKR' | 'RR' | 'LSG' | 'GT' | 'PBKS' | 'DC';

export interface Team {
  id: TeamId;
  name: string;
  shortName: TeamId;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  startingPurse: number; // in Lakhs (e.g. 10000 = 100 Cr)
  remainingPurse: number; // in Lakhs
  squad: string[]; // array of player IDs
  maxSquadSize: number; // typically 25
}

export interface SaleHistoryItem {
  id: string;
  player: Player;
  teamId: TeamId;
  price: number;
  timestamp: number;
}
