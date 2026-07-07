// FlowGen Backend — Phase 2
// Entry point — to be implemented in Phase 2

import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { registerCronJobs } from './utils/cronJobs.js';
import { createServer } from 'http';

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);

connectDB().then(() => {
  registerCronJobs();
  httpServer.listen(PORT, () => {
    console.log(`🚀 FlowGen server running on port ${PORT}`);
  });
});
