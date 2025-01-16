import { SystemParams, SystemState, Miner } from "../types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// 更新系統狀態（衰減算力、釋放收益等）
export function updateSystemState(
  params: SystemParams,
  state: SystemState
): SystemState {
  const now = Date.now();
  const hoursPassed = (now - state.lastUpdateTime) / (1000 * 60 * 60);

  if (hoursPassed < 1) return state;

  // 算力衰減
  const decayFactor = Math.pow(params.MINING_POWER_DECAY_RATE, hoursPassed);
  let newMiningPower = state.mining_power_accumulated * decayFactor;

  // 更新用戶的礦機狀態
  const updatedUsers = { ...state.users };
  Object.values(updatedUsers).forEach((user) => {
    user.miners = user.miners.map((miner) => {
      // 計算釋放的收益
      const releasedReward =
        (miner.remainingReward * hoursPassed) / (params.MINING_PERIOD * 24);

      return {
        ...miner,
        accumulatedReward: miner.accumulatedReward + releasedReward,
        remainingReward: miner.remainingReward - releasedReward,
      };
    });
  });

  return {
    ...state,
    mining_power_accumulated: newMiningPower,
    users: updatedUsers,
    lastUpdateTime: now,
  };
}

export function addUser(state: SystemState, name: string): SystemState {
  const userId = generateId();
  return {
    ...state,
    users: {
      ...state.users,
      [userId]: {
        id: userId,
        name,
        miners: [],
        starBalance: 0,
        starryBalance: 0,
        totalInvestment: 0,
        totalReward: 0,
        votingHistory: [],
        todayVoteCount: 0,
        lastVoteTime: null,
      },
    },
  };
}

export function buyMinerWithStar(
  params: SystemParams,
  state: SystemState,
  userId: string
): SystemState {
  const user = state.users[userId];
  if (!user) return state;

  const star_added = params.MINER_PRICE * (1 - params.TAKE_RATE);
  const platform_profit = params.MINER_PRICE * params.TAKE_RATE;

  // 更新系統資金池
  const newState = {
    ...state,
    miner_total: state.miner_total + 1,
    star_pool: state.star_pool + star_added,
    starry_pool: state.starry_pool + star_added * params.EXCHANGE_RATE,
    starry_total: state.starry_total + star_added * params.EXCHANGE_RATE,
    mining_power_accumulated:
      state.mining_power_accumulated + params.INITIAL_ELO,
    platform_profit: state.platform_profit + platform_profit,
  };

  // 計算這台礦機的預期收益
  const miningReward = calculateMiningReward(
    params,
    newState,
    params.INITIAL_ELO
  );
  const totalReward = miningReward * params.MINING_PERIOD * 24; // 總收益

  const miner: Miner = {
    id: generateId(),
    elo: params.INITIAL_ELO,
    purchaseTime: Date.now(),
    purchaseType: "star",
    purchasePrice: params.MINER_PRICE,
    accumulatedReward: 0,
    lastRenewalTime: null,
    renewalCount: 0,
    miningPeriodReward: totalReward,
    remainingReward: totalReward,
  };

  return {
    ...newState,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        miners: [...user.miners, miner],
        totalInvestment: user.totalInvestment + params.MINER_PRICE,
      },
    },
  };
}

export function buyMinerWithStarry(
  params: SystemParams,
  state: SystemState,
  userId: string
): SystemState {
  const user = state.users[userId];
  if (!user) return state;

  const star_reduced = params.MINER_PRICE * params.TAKE_RATE;
  const platform_profit = params.MINER_PRICE * params.TAKE_RATE;

  // 更新系統資金池
  const newState = {
    ...state,
    miner_total: state.miner_total + 1,
    star_pool: state.star_pool - star_reduced,
    starry_pool:
      state.starry_pool +
      params.MINER_PRICE * (1 - params.TAKE_RATE) * params.EXCHANGE_RATE,
    starry_total: state.starry_total - star_reduced * params.EXCHANGE_RATE,
    mining_power_accumulated:
      state.mining_power_accumulated + params.INITIAL_ELO,
    platform_profit: state.platform_profit + platform_profit,
  };

  // 計算這台礦機的預期收益
  const miningReward = calculateMiningReward(
    params,
    newState,
    params.INITIAL_ELO
  );
  const totalReward = miningReward * params.MINING_PERIOD * 24; // 總收益

  const miner: Miner = {
    id: generateId(),
    elo: params.INITIAL_ELO,
    purchaseTime: Date.now(),
    purchaseType: "starry",
    purchasePrice: params.MINER_PRICE * params.EXCHANGE_RATE,
    accumulatedReward: 0,
    lastRenewalTime: null,
    renewalCount: 0,
    miningPeriodReward: totalReward,
    remainingReward: totalReward,
  };

  return {
    ...newState,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        miners: [...user.miners, miner],
        totalInvestment:
          user.totalInvestment + params.MINER_PRICE * params.EXCHANGE_RATE,
      },
    },
  };
}

export function renewMiner(
  params: SystemParams,
  state: SystemState,
  userId: string,
  minerId: string
): SystemState {
  const user = state.users[userId];
  if (!user) return state;

  const minerIndex = user.miners.findIndex((m) => m.id === minerId);
  if (minerIndex === -1) return state;

  const miner = user.miners[minerIndex];
  if (
    !miner.lastRenewalTime ||
    Date.now() - miner.lastRenewalTime <
      params.MINING_PERIOD * 24 * 60 * 60 * 1000
  ) {
    return state;
  }

  const platform_profit = params.RENEWAL_PRICE * params.TAKE_RATE;
  const star_added = params.RENEWAL_PRICE * (1 - params.TAKE_RATE);

  const updatedMiner = {
    ...miner,
    lastRenewalTime: Date.now(),
    renewalCount: miner.renewalCount + 1,
    miningPeriodReward:
      calculateMiningReward(params, state, miner.elo) *
      params.MINING_PERIOD *
      24,
    remainingReward:
      calculateMiningReward(params, state, miner.elo) *
      params.MINING_PERIOD *
      24,
  };

  const updatedMiners = [...user.miners];
  updatedMiners[minerIndex] = updatedMiner;

  return {
    ...state,
    star_pool: state.star_pool + star_added,
    starry_pool: state.starry_pool + star_added * params.EXCHANGE_RATE,
    starry_total: state.starry_total + star_added * params.EXCHANGE_RATE,
    platform_profit: state.platform_profit + platform_profit,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        miners: updatedMiners,
        totalInvestment: user.totalInvestment + params.RENEWAL_PRICE,
      },
    },
  };
}

export function vote(
  params: SystemParams,
  state: SystemState,
  userId: string,
  voteSuccess: boolean
): SystemState {
  const user = state.users[userId];
  if (!user) return state;

  // 檢查是否已經投過票
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  if (user.lastVoteTime && user.lastVoteTime >= today) {
    return state;
  }

  // 只有投票成功且成功率達到閾值時才發放獎勵
  const reward =
    voteSuccess &&
    user.todayVoteCount / Math.max(1, user.votingHistory.length) >=
      params.VOTING_SUCCESS_THRESHOLD
      ? params.VOTING_REWARD * params.EXCHANGE_RATE
      : 0;

  const vote = {
    timestamp: Date.now(),
    success: voteSuccess,
    reward,
  };

  return {
    ...state,
    starry_pool: state.starry_pool - reward,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        votingHistory: [...user.votingHistory, vote],
        todayVoteCount: voteSuccess
          ? user.todayVoteCount + 1
          : user.todayVoteCount,
        lastVoteTime: Date.now(),
        starryBalance: user.starryBalance + reward,
      },
    },
  };
}

export function removeMiner(
  params: SystemParams,
  state: SystemState,
  userId: string,
  minerId: string
): SystemState {
  const user = state.users[userId];
  if (!user) return state;

  const minerIndex = user.miners.findIndex((m) => m.id === minerId);
  if (minerIndex === -1) return state;

  const updatedMiners = [...user.miners];
  updatedMiners.splice(minerIndex, 1);

  return {
    ...state,
    miner_total: state.miner_total - 1,
    mining_power_accumulated:
      state.mining_power_accumulated - params.INITIAL_ELO,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        miners: updatedMiners,
      },
    },
  };
}

export function calculateMiningReward(
  params: SystemParams,
  state: SystemState,
  minerElo: number
): number {
  return (
    (params.EV * state.starry_pool * minerElo) /
    (state.mining_power_accumulated * params.MINING_FACTOR +
      state.miner_total * params.INITIAL_ELO)
  );
}

export function calculateUserStats(
  params: SystemParams,
  state: SystemState,
  userId: string
): {
  totalMiners: number;
  totalInvestment: number;
  totalReward: number;
  averageROI: number;
  estimatedDailyReward: number;
  votingStats: {
    totalVotes: number;
    successfulVotes: number;
    successRate: number;
    totalVotingRewards: number;
  };
  minerStats: Array<{
    id: string;
    type: "star" | "starry";
    age: number;
    reward: number;
    roi: number;
    renewalCount: number;
    timeUntilRenewal: number;
  }>;
} {
  const user = state.users[userId];
  if (!user) {
    return {
      totalMiners: 0,
      totalInvestment: 0,
      totalReward: 0,
      averageROI: 0,
      estimatedDailyReward: 0,
      votingStats: {
        totalVotes: 0,
        successfulVotes: 0,
        successRate: 0,
        totalVotingRewards: 0,
      },
      minerStats: [],
    };
  }

  const now = Date.now();
  const minerStats = user.miners.map((miner) => {
    const age = (now - miner.purchaseTime) / (1000 * 60 * 60 * 24); // days
    const timeUntilRenewal = miner.lastRenewalTime
      ? params.MINING_PERIOD -
        (now - miner.lastRenewalTime) / (1000 * 60 * 60 * 24)
      : params.MINING_PERIOD - age;

    return {
      id: miner.id,
      type: miner.purchaseType,
      age,
      reward:
        miner.accumulatedReward +
        miner.remainingReward / (params.MINING_PERIOD * 24),
      roi:
        (miner.accumulatedReward + miner.remainingReward) / miner.purchasePrice,
      renewalCount: miner.renewalCount,
      timeUntilRenewal: Math.max(0, timeUntilRenewal),
    };
  });

  const votingStats = {
    totalVotes: user.votingHistory.length,
    successfulVotes: user.votingHistory.filter((v) => v.success).length,
    successRate:
      user.votingHistory.length > 0
        ? user.votingHistory.filter((v) => v.success).length /
          user.votingHistory.length
        : 0,
    totalVotingRewards: user.votingHistory.reduce(
      (sum, v) => sum + v.reward,
      0
    ),
  };

  const estimatedDailyReward = minerStats.reduce(
    (sum, stat) => sum + stat.reward,
    0
  );

  const totalReward =
    user.miners.reduce(
      (sum, miner) => sum + miner.accumulatedReward + miner.remainingReward,
      0
    ) + votingStats.totalVotingRewards;

  return {
    totalMiners: user.miners.length,
    totalInvestment: user.totalInvestment,
    totalReward,
    averageROI: totalReward / user.totalInvestment,
    estimatedDailyReward,
    votingStats,
    minerStats,
  };
}
