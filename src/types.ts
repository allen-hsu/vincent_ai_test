export interface SystemParams {
  TAKE_RATE: number;
  AFFILIATE: number;
  MINER_PRICE: number;
  MINING_PERIOD: number;
  RENEWAL_PRICE: number;
  EXCHANGE_RATE: number;
  INITIAL_ELO: number;
  MINING_FACTOR: number;
  EV: number;
  VOTING_REWARD: number;
  MINING_POWER_DECAY_RATE: number;
  VOTING_SUCCESS_THRESHOLD: number;
}

export interface Miner {
  id: string;
  elo: number;
  purchaseTime: number;
  purchaseType: "star" | "starry";
  purchasePrice: number;
  accumulatedReward: number;
  lastRenewalTime: number | null;
  renewalCount: number;
  miningPeriodReward: number;
  remainingReward: number;
}

export interface Vote {
  timestamp: number;
  success: boolean;
  reward: number;
}

export interface User {
  id: string;
  name: string;
  miners: Miner[];
  starBalance: number;
  starryBalance: number;
  totalInvestment: number;
  totalReward: number;
  votingHistory: Vote[];
  todayVoteCount: number;
  lastVoteTime: number | null;
}

export interface SystemState {
  miner_total: number;
  star_pool: number;
  starry_pool: number;
  starry_total: number;
  mining_power_accumulated: number;
  platform_profit: number;
  users: Record<string, User>;
  lastUpdateTime: number;
}

export const DEFAULT_PARAMS: SystemParams = {
  TAKE_RATE: 0.3,
  AFFILIATE: 0.21,
  MINER_PRICE: 500,
  MINING_PERIOD: 3,
  RENEWAL_PRICE: 10,
  EXCHANGE_RATE: 10,
  INITIAL_ELO: 1000,
  MINING_FACTOR: 1,
  EV: 0.1,
  VOTING_REWARD: 1,
  MINING_POWER_DECAY_RATE: 0.95,
  VOTING_SUCCESS_THRESHOLD: 0.7,
};

export const INITIAL_STATE: SystemState = {
  miner_total: 0,
  star_pool: 0,
  starry_pool: 0,
  starry_total: 0,
  mining_power_accumulated: 0,
  platform_profit: 0,
  users: {},
  lastUpdateTime: Date.now(),
};
