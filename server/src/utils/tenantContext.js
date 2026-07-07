import { AsyncLocalStorage } from 'async_hooks';

export const tenantContext = new AsyncLocalStorage();

export function getTenantId() {
  const store = tenantContext.getStore();
  return store?.req?.orgId || null;
}
