import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity details are required');

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !mongoose.isValidObjectId(userId) ||
    typeof teamId !== 'string' ||
    !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw badRequest('A valid user, team, activity type, and positive duration are required');
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw badRequest('Activity user and team must exist');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team details are required');
  const { name, mascot, members = [] } = input;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member): member is string => typeof member === 'string' && mongoose.isValidObjectId(member))
  ) {
    throw badRequest('A team name, mascot, and valid member IDs are required');
  }

  const memberIds = [...new Set(members)];
  if (memberIds.length && (await User.countDocuments({ _id: { $in: memberIds } })) !== memberIds.length) {
    throw badRequest('All team members must exist');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);
  return totals.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const activity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const focuses = [...new Set([user.fitnessGoal, activity?.type].filter((focus): focus is string => typeof focus === 'string' && !!focus))];
  const workouts = focuses.length ? await Workout.find({ focus: { $in: focuses } }).lean() : [];
  const reason = activity
    ? `Recommended for your ${user.fitnessGoal} goal and ${activity.type} activity.`
    : `Recommended for your ${user.fitnessGoal} goal.`;
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
