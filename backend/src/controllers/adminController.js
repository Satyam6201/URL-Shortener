import { User } from '../models/User.js';
import { Url } from '../models/Url.js';
import { Click } from '../models/Click.js';
import { ReportAbuse } from '../models/ReportAbuse.js';
import { AuditLog } from '../models/AuditLog.js';
import { invalidateUrl } from '../services/redisService.js';

export async function getAdminStats(req, res, next) {
  try {
    const [totalUsers, totalLinks, totalClicks, flaggedLinks, pendingAbuse] = await Promise.all([
      User.countDocuments(),
      Url.countDocuments(),
      Click.countDocuments(),
      Url.countDocuments({ isFlagged: true }),
      ReportAbuse.countDocuments({ status: 'pending' }),
    ]);

    const activeLinks = await Url.countDocuments({ isActive: true, isFlagged: false });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalLinks,
        activeLinks,
        totalClicks,
        flaggedLinks,
        pendingAbuse,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users.map((u) => u.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: user.isActive ? 'user.activated' : 'user.suspended',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: { targetEmail: user.email },
      ip: req.ip,
    });

    res.json({
      success: true,
      data: user.toJSON(),
      message: `User ${user.email} is now ${user.isActive ? 'active' : 'suspended'}`,
    });
  } catch (err) {
    next(err);
  }
}

export async function reportAbuseHandler(req, res, next) {
  try {
    const { shortCode, reason = 'spam', description = '' } = req.body;
    if (!shortCode) {
      return res.status(400).json({ success: false, error: 'shortCode is required' });
    }

    const urlDoc = await Url.findOne({ shortCode });
    const originalUrl = urlDoc ? urlDoc.originalUrl : '';

    const report = await ReportAbuse.create({
      shortCode,
      originalUrl,
      reason,
      description,
      reporterIp: req.ip || req.socket.remoteAddress,
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Abuse report submitted for administrative review',
    });
  } catch (err) {
    next(err);
  }
}

export async function listAbuseReports(req, res, next) {
  try {
    const reports = await ReportAbuse.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

export async function actionAbuseReport(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const report = await ReportAbuse.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (action === 'ban') {
      await Url.updateOne({ shortCode: report.shortCode }, { isActive: false, isFlagged: true });
      await invalidateUrl(report.shortCode);
      report.status = 'banned';
    } else {
      report.status = 'dismissed';
    }

    await report.save();

    await AuditLog.create({
      userId: req.user._id,
      action: `abuse.${action}`,
      resourceType: 'ReportAbuse',
      resourceId: report._id.toString(),
      details: { shortCode: report.shortCode, action },
      ip: req.ip,
    });

    res.json({ success: true, data: report, message: `Report marked as ${report.status}` });
  } catch (err) {
    next(err);
  }
}
