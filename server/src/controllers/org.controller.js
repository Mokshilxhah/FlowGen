import Organization from '../models/Organization.js';
import Activity from '../models/Activity.js';
import { orgDashboardStats } from '../services/analyticsService.js';
import { AppError } from '../utils/AppError.js';
import { getPagination, paginatedResponse } from '../utils/paginate.js';

export async function getProfile(req, res) {
  const org = await Organization.findById(req.orgId);
  if (!org) throw new AppError('Organization not found', 404);
  res.json({ data: org.toJSON() });
}

export async function patchProfile(req, res) {
  const allowed = ['name', 'industry', 'logo', 'billingEmail', 'settings'];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  const org = await Organization.findByIdAndUpdate(req.orgId, updates, { new: true });
  res.json({ data: org.toJSON() });
}

export async function getStats(req, res) {
  const stats = await orgDashboardStats(req.orgId);
  const org = await Organization.findById(req.orgId);
  res.json({
    data: {
      ...stats,
      plan: org?.plan,
      orgName: org?.name,
    },
  });
}

export async function getActivity(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { orgId: req.orgId };
  const [items, total] = await Promise.all([
    Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Activity.countDocuments(filter),
  ]);
  res.json({ data: paginatedResponse(items, total, page, limit) });
}

export async function getBilling(req, res) {
  const org = await Organization.findById(req.orgId);
  res.json({
    data: {
      plan: org.plan,
      subscription: org.subscription,
      billingEmail: org.billingEmail,
    },
  });
}

export async function upgradeBilling(req, res) {
  const { plan, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  if (!['free', 'pro', 'enterprise'].includes(plan)) throw new AppError('Invalid plan', 400);

  if (process.env.BILLING_SIMULATE !== 'true' && plan !== 'free') {
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new AppError('Payment verification details are required', 400);
    }
    const crypto = await import('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new AppError('Razorpay secret is not configured', 500);
    }
    const generated = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated !== razorpay_signature) {
      throw new AppError('Payment signature verification failed', 400);
    }
  }

  const org = await Organization.findByIdAndUpdate(
    req.orgId,
    { plan, 'subscription.status': 'active' },
    { new: true }
  );
  res.json({ data: org.toJSON() });
}
