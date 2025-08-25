const API_BASE = "http://192.168.1.2:3000/api";

// Initialize dashboard: fetch balance and transactions if wallet exists
async function initializeDashboard() {
  const walletExists = await fetchBalance();
  if (walletExists) {
    await fetchTransactions();
  }
}

// Fetch wallet balance and update UI accordingly
async function fetchBalance() {
  try {
    const res = await fetch(`${API_BASE}/balance`, { credentials: 'include' });
    if (res.status === 404) {
      document.getElementById('balance-amount').textContent = 'No wallet found.';
      document.getElementById('action-buttons').style.display = 'none';
      document.getElementById('transactions').style.display = 'none';
      return false;
    }
    const data = await res.json();
    if (res.ok) {
      document.getElementById("balance-amount").textContent = `₹${parseFloat(data.balance).toFixed(2)}`;
      document.getElementById('action-buttons').style.display = 'block';
      document.getElementById('transactions').style.display = 'block';
      return true;
    }
  } catch (err) {
    console.error("Error fetching balance:", err);
  }
  return false;
}

// Fetch transaction history and populate the transaction list table body
async function fetchTransactions() {
  try {
    const res = await fetch(`${API_BASE}/transactions`, { credentials: 'include' });
    const data = await res.json();

    if (res.ok) {
      const tbody = document.getElementById("transaction-list");
      tbody.innerHTML = ""; // Clear existing rows

      data.transactions.forEach(tx => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${new Date(tx.date).toLocaleDateString()}</td>
          <td>${tx.type}</td>
          <td>₹${parseFloat(tx.amount).toFixed(2)}</td>
          <td>${tx.status}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      console.error("Failed to fetch transactions:", data.message);
    }
  } catch (err) {
    console.error("Error fetching transactions:", err);
  }
}

// Modal and form elements
document.addEventListener('DOMContentLoaded', () => {
  const createWalletBtn = document.getElementById('create-wallet-btn');
  const walletModal = document.getElementById('walletModal');
  const closeModalBtn = document.getElementById('closeModal');
  const walletForm = document.getElementById('walletForm');
  const formMessage = document.getElementById('formMessage');
  const loginBtn = document.getElementById('login-btn');

  // Optional login modal elements if you have them
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const loginFormMessage = document.getElementById('loginFormMessage');
  const closeLoginModalBtn = document.getElementById('closeLoginModal');

  // Open wallet creation modal on button click
  createWalletBtn.addEventListener('click', () => {
    formMessage.textContent = '';
    walletForm.reset();
    walletForm.querySelector('button').disabled = false;
    walletModal.style.display = 'flex';
  });

  // Login modal open (replace alert with modal open if login modal exists)
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (loginModal) {
        loginFormMessage.textContent = '';
        loginForm.reset();
        loginForm.querySelector('button').disabled = false;
        loginModal.style.display = 'flex';
      } else {
        alert('Login functionality is not implemented yet.');
      }
    });
  }

  // Close wallet modal on close button click
  closeModalBtn.addEventListener('click', () => {
    walletModal.style.display = 'none';
  });

  // Close login modal on close button click if login modal present
  if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
  }

  // Close modals when clicking outside modal content
  window.addEventListener('click', (e) => {
    if (e.target === walletModal) {
      walletModal.style.display = 'none';
    }
    if (loginModal && e.target === loginModal) {
      loginModal.style.display = 'none';
    }
  });

  // Handle wallet registration form submission
  walletForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = walletForm.email.value.trim();
    const password = walletForm.password.value.trim();

    formMessage.style.color = '#000';
    formMessage.textContent = 'Processing...';
    walletForm.querySelector('button').disabled = true;

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        formMessage.style.color = 'green';
        formMessage.textContent = `Wallet created! User Email: ${email}`;
        setTimeout(() => {
          walletModal.style.display = 'none';
          walletForm.querySelector('button').disabled = false;
          walletForm.reset();
        }, 2500);
        initializeDashboard(); // Refresh dashboard data after creation
      } else {
        formMessage.style.color = 'red';
        formMessage.textContent = data.message || 'Failed to create wallet.';
        walletForm.querySelector('button').disabled = false;
      }
    } catch (error) {
      formMessage.style.color = 'red';
      formMessage.textContent = 'Error: ' + error.message;
      walletForm.querySelector('button').disabled = false;
    }
  });

  // Handle login form submission if login modal exists
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();

      loginFormMessage.style.color = '#000';
      loginFormMessage.textContent = 'Logging in...';
      loginForm.querySelector('button').disabled = true;

      try {
        const response = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          loginFormMessage.style.color = 'green';
          loginFormMessage.textContent = 'Login successful!';
          setTimeout(() => {
            loginModal.style.display = 'none';
            loginForm.querySelector('button').disabled = false;
            loginForm.reset();
            initializeDashboard(); // Refresh wallet dashboard as logged in user
          }, 1500);
        } else {
          loginFormMessage.style.color = 'red';
          loginFormMessage.textContent = data.message || 'Login failed';
          loginForm.querySelector('button').disabled = false;
        }
      } catch (error) {
        loginFormMessage.style.color = 'red';
        loginFormMessage.textContent = `Error: ${error.message}`;
        loginForm.querySelector('button').disabled = false;
      }
    });
  }

  // Initialize dashboard on page load
  initializeDashboard();
});
