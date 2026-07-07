import User from '../models/User.js';

export async function requirePro(req, res, next) {
  try {
    if (!req.orgId) {
      return res.status(403).json({ error: 'Organization ID missing' });
    }

    // Load user's organization to get the plan field
    const user = await User.findById(req.user?._id).populate('orgId');
    const org = user?.orgId;

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.plan === 'free') {
      return res.status(403).json({
        error: 'Forbidden: This feature requires a Pro or Enterprise subscription.',
        code: 'PLAN_LIMIT_REACHED'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify subscription plan' });
  }
}
