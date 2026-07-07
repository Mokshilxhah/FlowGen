import { orgAnalyticsCharts } from '../services/analyticsService.js';

export async function getOverview(req, res) {
  const hrId = req.user.role === 'hr' ? req.user._id : null;
  const data = await orgAnalyticsCharts(req.orgId, hrId);
  res.json({ data });
}
