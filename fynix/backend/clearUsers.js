const sequelize = require('./db');
const User = require('./User');

async function clearUsers() {
  try {
    await sequelize.sync();
    await User.destroy({ where: {}, truncate: true });
    console.log('All users deleted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
}

clearUsers();
