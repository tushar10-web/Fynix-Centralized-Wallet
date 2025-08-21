// server.js
const app = require('./app');
const sequelize = require('./db'); // import your Sequelize instance
const PORT = 3000;

sequelize.sync()
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
