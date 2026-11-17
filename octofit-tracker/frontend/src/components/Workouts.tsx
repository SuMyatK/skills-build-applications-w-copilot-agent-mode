import { useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
// This component displays workout suggestions based on the user's email
export default function Workouts() {
  const [email, setEmail] = useState('mona@example.com');
  return (
    <>
      <label className="form-label" htmlFor="workout-user-email">User email</label>
      <input
        className="form-control mb-3"
        id="workout-user-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <CapabilityCard
        title="Workout suggestions"
        description="Recommend workouts from activity patterns."
        endpoint={`/api/workouts/suggestions/${encodeURIComponent(email)}`}
        dataKey="suggestions"
        emptyText="No workout suggestions yet."
        renderItem={(workout, index) => (
          <li key={String(workout._id ?? `${workout.title ?? 'workout'}-${index}`)}>
            <strong>{String(workout.title ?? 'Workout')}</strong>
            {typeof workout.focus === 'string' && ` — ${workout.focus}`}
            {typeof workout.reason === 'string' && `: ${workout.reason}`}
          </li>
        )}
      />
    </>
  );
}
