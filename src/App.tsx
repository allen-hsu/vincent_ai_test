import { useState, ChangeEvent, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { SystemState, DEFAULT_PARAMS, INITIAL_STATE } from "./types";
import {
  buyMinerWithStar,
  buyMinerWithStarry,
  calculateMiningReward,
  removeMiner,
  addUser,
  calculateUserStats,
  updateSystemState,
  renewMiner,
  vote,
} from "./utils/mining";
import { Button } from "./components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Input } from "./components/ui/input";

function App() {
  const [state, setState] = useState<SystemState>(INITIAL_STATE);
  const [history, setHistory] = useState<
    Array<SystemState & { timestamp: number }>
  >([{ ...INITIAL_STATE, timestamp: Date.now() }]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const newState = updateSystemState(DEFAULT_PARAMS, state);
      setState(newState);
      setHistory([...history, { ...newState, timestamp: Date.now() }]);
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state, history]);

  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    const newState = addUser(state, newUserName.trim());
    setState(newState);
    setHistory([...history, { ...newState, timestamp: Date.now() }]);
    setNewUserName("");
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUserName(e.target.value);
  };

  const handleAddMinerWithStar = () => {
    if (!selectedUserId) return;
    const newState = buyMinerWithStar(DEFAULT_PARAMS, state, selectedUserId);
    setState(newState);
    setHistory([...history, { ...newState, timestamp: Date.now() }]);
  };

  const handleAddMinerWithStarry = () => {
    if (!selectedUserId) return;
    const newState = buyMinerWithStarry(DEFAULT_PARAMS, state, selectedUserId);
    setState(newState);
    setHistory([...history, { ...newState, timestamp: Date.now() }]);
  };

  const handleRenewMiner = (minerId: string) => {
    if (!selectedUserId) return;
    const newState = renewMiner(DEFAULT_PARAMS, state, selectedUserId, minerId);
    setState(newState);
    setHistory([...history, { ...newState, timestamp: Date.now() }]);
  };

  const handleVote = (success: boolean) => {
    if (!selectedUserId) return;
    const newState = vote(DEFAULT_PARAMS, state, selectedUserId, success);
    setState(newState);
    setHistory([...history, { ...newState, timestamp: Date.now() }]);
  };

  const handleRemoveMiner = (minerId: string) => {
    if (!selectedUserId) return;
    const newState = removeMiner(
      DEFAULT_PARAMS,
      state,
      selectedUserId,
      minerId
    );
    setState(newState);
    setHistory([...history, { ...newState, timestamp: Date.now() }]);
  };

  const estimatedReward = calculateMiningReward(
    DEFAULT_PARAMS,
    state,
    DEFAULT_PARAMS.INITIAL_ELO
  );

  const selectedUserStats = selectedUserId
    ? calculateUserStats(DEFAULT_PARAMS, state, selectedUserId)
    : null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Mining System Dashboard</h1>

        <div className="flex gap-4 items-center">
          <Input
            placeholder="Enter user name"
            value={newUserName}
            onChange={handleNameChange}
          />
          <Button onClick={handleAddUser}>Add User</Button>
        </div>

        <div className="flex gap-4">
          <select
            className="px-3 py-2 rounded-md border"
            value={selectedUserId || ""}
            onChange={(e) => setSelectedUserId(e.target.value || null)}
          >
            <option value="">Select User</option>
            {Object.values(state.users).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <Button onClick={handleAddMinerWithStar} disabled={!selectedUserId}>
            Add Miner (Star)
          </Button>
          <Button
            variant="secondary"
            onClick={handleAddMinerWithStarry}
            disabled={!selectedUserId}
          >
            Add Miner (Starry)
          </Button>
          <Button
            variant="outline"
            onClick={() => handleVote(true)}
            disabled={!selectedUserId}
          >
            Vote Success
          </Button>
          <Button
            variant="outline"
            onClick={() => handleVote(false)}
            disabled={!selectedUserId}
          >
            Vote Fail
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-xl font-semibold">System State</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Total Miners</TableCell>
                  <TableCell className="text-right">
                    {state.miner_total}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Star Pool</TableCell>
                  <TableCell className="text-right">
                    {state.star_pool.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Starry Pool</TableCell>
                  <TableCell className="text-right">
                    {state.starry_pool.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Starry Total</TableCell>
                  <TableCell className="text-right">
                    {state.starry_total.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mining Power</TableCell>
                  <TableCell className="text-right">
                    {state.mining_power_accumulated.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Platform Profit</TableCell>
                  <TableCell className="text-right">
                    {state.platform_profit.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Estimated Reward/Miner</TableCell>
                  <TableCell className="text-right">
                    {estimatedReward.toFixed(4)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {selectedUserId && selectedUserStats && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">
                  User Stats: {state.users[selectedUserId].name}
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Miners</TableCell>
                      <TableCell className="text-right">
                        {selectedUserStats.totalMiners}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Investment</TableCell>
                      <TableCell className="text-right">
                        {selectedUserStats.totalInvestment.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Reward</TableCell>
                      <TableCell className="text-right">
                        {selectedUserStats.totalReward.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average ROI</TableCell>
                      <TableCell className="text-right">
                        {(selectedUserStats.averageROI * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Estimated Daily Reward</TableCell>
                      <TableCell className="text-right">
                        {selectedUserStats.estimatedDailyReward.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 text-xl font-semibold">Voting Stats</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Votes</TableCell>
                      <TableCell className="text-right">
                        {selectedUserStats.votingStats.totalVotes}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Successful Votes</TableCell>
                      <TableCell className="text-right">
                        {selectedUserStats.votingStats.successfulVotes}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Success Rate</TableCell>
                      <TableCell className="text-right">
                        {(
                          selectedUserStats.votingStats.successRate * 100
                        ).toFixed(2)}
                        %
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Voting Rewards</TableCell>
                      <TableCell className="text-right">
                        {selectedUserStats.votingStats.totalVotingRewards.toFixed(
                          2
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Miner Details</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Age (Days)</TableHead>
                      <TableHead>Daily Reward</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Renewals</TableHead>
                      <TableHead>Time Until Renewal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedUserStats.minerStats.map((miner) => (
                      <TableRow key={miner.id}>
                        <TableCell>{miner.type}</TableCell>
                        <TableCell>{miner.age.toFixed(2)}</TableCell>
                        <TableCell>{miner.reward.toFixed(4)}</TableCell>
                        <TableCell>{(miner.roi * 100).toFixed(2)}%</TableCell>
                        <TableCell>{miner.renewalCount}</TableCell>
                        <TableCell>
                          {miner.timeUntilRenewal.toFixed(2)}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRenewMiner(miner.id)}
                            disabled={miner.timeUntilRenewal > 0}
                          >
                            Renew
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveMiner(miner.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">History Chart</h2>
          <LineChart width={800} height={400} data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={["auto", "auto"]}
              tickFormatter={(timestamp) =>
                new Date(timestamp).toLocaleTimeString()
              }
            />
            <YAxis />
            <Tooltip
              labelFormatter={(timestamp) =>
                new Date(timestamp).toLocaleString()
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="star_pool"
              stroke="#8884d8"
              name="Star Pool"
            />
            <Line
              type="monotone"
              dataKey="starry_pool"
              stroke="#82ca9d"
              name="Starry Pool"
            />
            <Line
              type="monotone"
              dataKey="mining_power_accumulated"
              stroke="#ffc658"
              name="Mining Power"
            />
            <Line
              type="monotone"
              dataKey="platform_profit"
              stroke="#ff7300"
              name="Platform Profit"
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
}

export default App;
