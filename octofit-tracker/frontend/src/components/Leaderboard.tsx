import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      dataKey="leaderboard"
      emptyText="No leaderboard scores yet."
      renderItem={(team, index) => (
        <li key={String(team._id ?? `${team.teamName ?? 'team'}-${index}`)}>
          #{String(team.rank ?? index + 1)} {String(team.teamName ?? 'Team')}: {String(team.totalPoints ?? 0)} points
        </li>
      )}
    />
  );
}
