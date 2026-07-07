import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { COOKIE_REFRESH } from '../config/constants.js';

export async function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if it's the AI service API key
    if (process.env.NODE_BACKEND_API_KEY && token === process.env.NODE_BACKEND_API_KEY) {
      const headerOrgId = req.headers['x-org-id'];
      const headerUserId = req.headers['x-user-id'];
      if (!headerOrgId) {
        return res.status(400).json({ error: 'X-Org-Id header is required for service auth' });
      }
      req.orgId = headerOrgId;
      if (headerUserId) {
        req.user = await User.findById(headerUserId);
      } else {
        req.user = await User.findOne({ orgId: headerOrgId });
      }
      return next();
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.status === 'deactivated' || user.status === 'suspended') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    req.user = user;
    req.orgId = user.orgId;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.userId);
    if (user) {
      req.user = user;
      req.orgId = user.orgId;
    }
    next();
  } catch {
    next();
  }
}

export async function verifyCookieAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_REFRESH];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.status === 'deactivated' || user.status === 'suspended') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    req.user = user;
    req.orgId = user.orgId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
