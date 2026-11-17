# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep rendering and user interaction in React; use the shared API client with relative `/api` paths, and provide accessible loading, empty, and error states without embedding persistence or business rules in components.
- Logic tier decision: Keep request validation, business rules, and response shaping in Express routes/services. Validate identifier format and referenced-record existence before database operations, returning deliberate 4xx responses for invalid or unknown resources.
- Data tier decision: Define required fields, defaults, and references in the Mongoose models. Keep seed data representative and idempotent, preserving unrelated existing records.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate both IDs and their referenced records; persist user/team references and the submitted activity details with server-computed points and `occurredAt`.
- Team management approach: Require a name, preserve the submitted name and mascot, and default members to an empty array when omitted. Persist and return member references for teams that specify them.
- Leaderboard approach: Aggregate activity points by team, sort totals highest-first, and return each entry with its team name, total points, and 1-based rank.
- Workout suggestions approach: Find the user by email, use their goal and recent activity to prioritize matching workouts, and include a reason for the top suggestion. Return a deliberate 4xx response when no user matches.

## Test plan

- `npm run test:data --prefix octofit-tracker/backend` — **4 failed, 1 passed.** The failures indicate missing required user, team, activity, and workout model validation; the idempotent seed contract passes.
- `npm run test:api --prefix octofit-tracker/backend` — **4 failed.** Invalid activity/team requests currently return `501` instead of `400`, the leaderboard is empty, and the first suggestion does not match the user's activity pattern. These identify incomplete endpoint behavior and response logic.
- `npm test --prefix octofit-tracker/frontend` — **15 failed.** The presentation contract is not met: data rendering and user-specific workout requests fail, as do loading, empty, and accessible API-error states on all four routes.
- `npm run build --prefix octofit-tracker/backend` — **passed.** A failure here indicates a backend TypeScript compile/type-check problem.
- `npm run build --prefix octofit-tracker/frontend` — **passed.** A failure here indicates a frontend TypeScript or production-bundling problem.
- Implementation order: establish the data contracts first, implement and verify the API behavior next, then connect the presentation tier and its accessible request states. Re-run the focused tier tests after each layer and both builds before considering the exercise complete.
