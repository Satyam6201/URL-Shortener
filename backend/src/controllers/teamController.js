import { Team } from '../models/Team.js';
import { User } from '../models/User.js';

export async function getMyTeam(req, res, next) {
  try {
    let team = await Team.findOne({
      $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }],
    });

    if (!team) {
      team = await Team.create({
        name: `${req.user.name}'s Workspace`,
        ownerId: req.user._id,
        members: [{
          userId: req.user._id,
          role: 'owner',
          email: req.user.email,
        }],
      });
    }

    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
}

export async function inviteMember(req, res, next) {
  try {
    const { email, role = 'editor' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const team = await Team.findOne({ ownerId: req.user._id });
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team workspace not found' });
    }

    const alreadyMember = team.members.some((m) => m.email.toLowerCase() === email.toLowerCase());
    if (alreadyMember) {
      return res.status(409).json({ success: false, error: 'User is already a team member' });
    }

    let memberUser = await User.findOne({ email: email.toLowerCase() });
    if (!memberUser) {
      memberUser = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        passwordHash: 'pending_invitation_hash',
      });
    }

    team.members.push({
      userId: memberUser._id,
      email: memberUser.email,
      role,
      joinedAt: new Date(),
    });

    await team.save();

    res.status(201).json({
      success: true,
      data: team,
      message: `Invited ${email} to workspace as ${role}`,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { memberUserId } = req.params;
    const team = await Team.findOne({ ownerId: req.user._id });
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team workspace not found' });
    }

    team.members = team.members.filter((m) => m.userId.toString() !== memberUserId);
    await team.save();

    res.json({ success: true, data: team, message: 'Member removed from team' });
  } catch (err) {
    next(err);
  }
}
