import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      dataKey="teams"
      emptyText="No teams yet."
      renderItem={(team, index) => (
        <li key={String(team._id ?? `${team.name ?? 'team'}-${index}`)}>
          {String(team.name ?? 'Team')} — {Array.isArray(team.members) ? team.members.length : 0} members
        </li>
      )}
    />
  );
}
