const mongoose = require('mongoose');

const check = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/time_tracker');
    console.log('DB Connected');
    
    // Find users
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log('Users:', users.map(u => ({ id: u._id, name: u.name, email: u.email })));

    // Find settings
    const settings = await db.collection('settings').find({}).toArray();
    console.log('Settings:', settings.map(s => ({ userId: s.userId, hrms: s.hrms, clockify: s.clockify })));

    // Find focus sessions
    const sessions = await db.collection('focus_sessions').find({}).toArray();
    console.log('Focus Sessions:', sessions.map(s => ({
      userId: s.userId,
      activityName: s.activityName,
      category: s.category,
      durationSeconds: s.durationSeconds,
      syncedToHrms: s.syncedToHrms,
      syncedToClockify: s.syncedToClockify
    })));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

check();
