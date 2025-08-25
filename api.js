const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Wallet, Transaction, User } = require('./models'); // Import User model
const bcrypt = require('bcrypt');
const session = require('express-session');

// Session setup (configure as needed)
router.use(session({
  secret: 'b14db6ca67dbc5e272790b8bff86ede0715841e028315663514f538667fc7acca7d4caa934bdd24c70173f4ee8a625d0a43bcfa6fffeeabfc428d944c2ff4c31', // Change to strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 3600000 } // 1 hour
}));

// Authentication middleware to check logged-in user from session
router.use((req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    next();
  } else {
    // For now allow only login and register without auth
    // Block access to wallet and transactions APIs if not logged in
    if (req.path === '/login' || req.path === '/register') {
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
  }
});

// User login API
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    console.log('Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    console.log('User found:', user ? user.email : 'No user');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    req.session.userId = user.user_id;
    res.json({ message: 'Login successful' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// User logout API (optional but recommended)
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout error' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get wallet balance
router.get('/balance', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.userId } });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching balance', error });
  }
});

// Create a new wallet
router.post('/wallet', async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
const password = req.body.password;
    const existing = await Wallet.findOne({ where: { userId: req.userId } });
    if (existing) return res.status(400).json({ message: 'Wallet already exists' });

    const newWallet = await Wallet.create({
      walletId: uuidv4(),
      userId: req.userId,
      balance: 0,
    });

    res.status(201).json(newWallet);
  } catch (error) {
    res.status(500).json({ message: 'Error creating wallet', error });
  }
});

// Get recent transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      order: [['date', 'DESC']],
      limit: 20,
    });
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
});

// User registration API
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Register request:', req.body); // Log entire request body
    console.log('Raw password:', password);    // Log the raw password received

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password to save:', hashedPassword);

    // Save new user with hashed password
    const newUser = await User.create({ email, password: hashedPassword });
    console.log('Saved user:', newUser.email, newUser.password);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
});


module.exports = router;
