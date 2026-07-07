import cron from 'node-cron';

/** Placeholder: wire deadline reminders (Phase 2 stub) */
export function registerCronJobs() {
  cron.schedule('0 9 * * *', () => {
    console.log('[cron] Daily digest placeholder — configure SMTP + Task query for reminders');
  });
}
