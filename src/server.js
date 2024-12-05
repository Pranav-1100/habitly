require('dotenv').config();
const app = require('./config/app');
const CalendarSyncService = require('./services/calendar/calendar-sync.service');

const PORT = process.env.PORT || 3001;
CalendarSyncService.initializeAutoSync();


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
