import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import { Domain } from '../models/Domain.js';

export async function listDomains(req, res, next) {
  try {
    const domains = await Domain.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: domains });
  } catch (err) {
    next(err);
  }
}

export async function addDomain(req, res, next) {
  try {
    const { domain } = req.body;
    if (!domain || !domain.includes('.')) {
      return res.status(400).json({ success: false, error: 'A valid domain hostname (e.g. go.yourbrand.com) is required' });
    }

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const existing = await Domain.findOne({ domain: cleanDomain });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Domain already registered' });
    }

    const verificationToken = `snip-verify-${crypto.randomBytes(16).toString('hex')}`;
    const txtRecordName = `_snip-challenge.${cleanDomain}`;

    const newDomain = await Domain.create({
      userId: req.user._id,
      domain: cleanDomain,
      verificationToken,
      txtRecordName,
    });

    res.status(201).json({
      success: true,
      data: newDomain,
      message: 'Domain registered. Please add the DNS TXT record to verify ownership.',
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyDomain(req, res, next) {
  try {
    const domainDoc = await Domain.findOne({ _id: req.params.id, userId: req.user._id });
    if (!domainDoc) {
      return res.status(404).json({ success: false, error: 'Domain not found' });
    }

    let isVerified = false;
    try {
      const records = await dns.resolveTxt(domainDoc.txtRecordName);
      for (const chunk of records) {
        if (chunk.join('').includes(domainDoc.verificationToken)) {
          isVerified = true;
          break;
        }
      }
    } catch {}

    domainDoc.isVerified = isVerified;
    if (isVerified) {
      domainDoc.verifiedAt = new Date();
    }
    await domainDoc.save();

    res.json({
      success: true,
      data: domainDoc,
      message: isVerified ? 'Domain verified successfully!' : 'TXT record not detected yet. DNS propagation may take a few minutes.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDomain(req, res, next) {
  try {
    await Domain.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Domain removed successfully' });
  } catch (err) {
    next(err);
  }
}
