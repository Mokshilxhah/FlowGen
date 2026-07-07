import mongoose from 'mongoose';
import { getTenantId } from '../../utils/tenantContext.js';

export function tenantPlugin(schema) {
  // Methods to intercept
  const methods = [
    'find',
    'findOne',
    'countDocuments',
    'findOneAndUpdate',
    'updateMany',
    'updateOne',
    'deleteOne',
    'deleteMany',
  ];

  methods.forEach((method) => {
    schema.pre(method, function (next) {
      const orgId = getTenantId();
      // Only enforce if we have an orgId in context and the query doesn't explicitly bypass it
      if (orgId && !this.getOptions().bypassTenant) {
        // We cast it to ObjectId in case it's string, although Mongoose usually handles this.
        this.where({ orgId });
      }
      next();
    });
  });

  // Aggregate
  schema.pre('aggregate', function (next) {
    const orgId = getTenantId();
    if (orgId && !this.options.bypassTenant) {
      this.pipeline().unshift({ $match: { orgId: new mongoose.Types.ObjectId(orgId) } });
    }
    next();
  });
}
