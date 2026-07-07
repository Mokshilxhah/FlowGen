import { tenantContext } from '../utils/tenantContext.js';

export function tenantMiddleware(req, res, next) {
  tenantContext.run({ req }, () => {
    next();
  });
}
