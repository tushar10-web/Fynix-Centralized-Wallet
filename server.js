const express = require('express');
const cors = require('cors');
const app = express();
const sequelize = require('./models/db'); // Your Sequelize instance
const PORT = 3000;

// Import your API routes
const apiRoutes = require('./api');

const allowedOrigins = [
  'http://127.0.0.1:8081',
  'http://192.168.1.2:8081',
  'http://192.168.1.2:3000',
  'https://tushar10-web.github.io',
  // other allowed origins
  'null', // explicitly allow null origin
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // allow if origin is empty (non-browser tools) or is in allowed list
      callback(null, true);
    } else {
      const msg = 'CORS policy does not allow access from this origin.';
      callback(new Error(msg), false);
    }
  },
  credentials: true,
}));


// Parse JSON request bodies
app.use(express.json());

// Mount API routes under /api path
app.use('/api', apiRoutes);

// Sync Sequelize models and start server
sequelize.sync()
  .then(() => {
    console.log('Database synced');
   app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://192.168.1.2:${PORT}`);
});

  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


module.exports = app;


