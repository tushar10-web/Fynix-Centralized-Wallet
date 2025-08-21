// app.js
const express = require('express');
const sequelize = require('./db');
const Wallet = require('./Wallet');
const User = require('./User');
const Transaction = require('./Transaction');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'c4e9f3d6a2b84f7d9e5c1b7a3d9f8e7c0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d'; // Replace with strong secret in production

// Model associations
Wallet.hasMany(Transaction, { foreignKey: 'wallet_id' });
Transaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Basic route to test server
app.get('/', (req, res) => {
  res.send('Fynix Wallet Backend is running!');
});

// User signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({ user_id: user.user_id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

/* Protected Wallet Routes Below - Use authenticateToken middleware */

// Get wallet balance by wallet_id
app.get('/wallets/:walletId/balance', authenticateToken, async (req, res) => {
  const { walletId } = req.params;

  try {
    const wallet = await Wallet.findByPk(walletId);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json({ wallet_id: wallet.wallet_id, balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new wallet
app.post('/wallets', authenticateToken, async (req, res) => {
  const { user_id, balance } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  try {
    const wallet = await Wallet.create({
      wallet_id: uuidv4(),
      user_id,
      balance: balance || 0.00,
    });

    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// Top-up wallet balance
app.post('/wallets/:walletId/top-up', authenticateToken, async (req, res) => {
  const { walletId } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

  try {
    const wallet = await Wallet.findByPk(walletId);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    await wallet.save();

    await Transaction.create({
      wallet_id: walletId,
      type: 'top-up',
      amount,
    });

    res.json({ wallet_id: wallet.wallet_id, new_balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to top-up wallet' });
  }
});

// Withdraw from wallet balance
app.post('/wallets/:walletId/withdraw', authenticateToken, async (req, res) => {
  const { walletId } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

  try {
    const wallet = await Wallet.findByPk(walletId);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
    await wallet.save();

    await Transaction.create({
      wallet_id: walletId,
      type: 'withdraw',
      amount,
    });

    res.json({ wallet_id: wallet.wallet_id, new_balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to withdraw from wallet' });
  }
});

// Get all wallets for a user
app.get('/users/:userId/wallets', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const wallets = await Wallet.findAll({ where: { user_id: userId } });
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallets for user' });
  }
});

// Delete a wallet by walletId
app.delete('/wallets/:walletId', authenticateToken, async (req, res) => {
  const { walletId } = req.params;

  try {
    const deleted = await Wallet.destroy({ where: { wallet_id: walletId } });
    if (deleted) {
      res.json({ message: 'Wallet deleted successfully' });
    } else {
      res.status(404).json({ error: 'Wallet not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete wallet' });
  }
});

// Transfer balance between wallets
app.post('/wallets/transfer', authenticateToken, async (req, res) => {
  const { fromWalletId, toWalletId, amount } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero' });

  const t = await sequelize.transaction();

  try {
    const fromWallet = await Wallet.findByPk(fromWalletId, { transaction: t });
    const toWallet = await Wallet.findByPk(toWalletId, { transaction: t });

    if (!fromWallet || !toWallet) {
      await t.rollback();
      return res.status(404).json({ error: 'One or both wallets not found' });
    }

    if (parseFloat(fromWallet.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({ error: 'Insufficient balance in fromWallet' });
    }

    fromWallet.balance = parseFloat(fromWallet.balance) - parseFloat(amount);
    toWallet.balance = parseFloat(toWallet.balance) + parseFloat(amount);

    await fromWallet.save({ transaction: t });
    await toWallet.save({ transaction: t });

    // Record transfer-out and transfer-in transactions
    await Transaction.create({
      wallet_id: fromWalletId,
      type: 'transfer-out',
      amount,
      related_wallet_id: toWalletId,
    }, { transaction: t });

    await Transaction.create({
      wallet_id: toWalletId,
      type: 'transfer-in',
      amount,
      related_wallet_id: fromWalletId,
    }, { transaction: t });

    await t.commit();

    res.json({ message: 'Transfer successful', fromWallet, toWallet });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Transfer failed' });
  }
});

// Get transaction history for a wallet
app.get('/wallets/:walletId/transactions', authenticateToken, async (req, res) => {
  const { walletId } = req.params;

  try {
    const transactions = await Transaction.findAll({
      where: { wallet_id: walletId },
      order: [['createdAt', 'DESC']],
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = app;
