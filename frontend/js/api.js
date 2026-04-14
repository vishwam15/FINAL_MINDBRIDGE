// js/api.js — Shared API utilities, auth helpers, sidebar renderer

const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('mhss_token');
const getUser  = () => JSON.parse(localStorage.getItem('mhss_user') || 'null');
const saveAuth = (token, user) => { localStorage.setItem('mhss_token', token); localStorage.setItem('mhss_user', JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem('mhss_token'); localStorage.removeItem('mhss_user'); };
const isLoggedIn = () => !!getToken();

const requireAuth = (allowedRoles = []) => {
  const user = getUser();
  if (!isLoggedIn() || !user) { window.location.href = '../index.html'; return false; }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) { window.location.href = '../index.html'; return false; }
  return user;
};

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const showToast = (message, type = 'default') => {
  let t = document.getElementById('global-toast');
  if (!t) { t = document.createElement('div'); t.id = 'global-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = message;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3200);
};

const logout = async () => {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.log('Logout API call completed (or failed gracefully)');
  }
  clearAuth();
  window.location.href = '../index.html';
};

// ── Validation Helpers ────────────────────────────────────────────
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => {
  // Min 8 chars, 1 number, 1 special char
  return password.length >= 8 && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password);
};

const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));

const sanitizeInput = (input) => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Status badge with proper labels
const statusBadge = (status) => {
  const statusMap = {
    'pending': { cls: 'warning', label: 'Pending' },
    'confirmed': { cls: 'success', label: 'Confirmed' },
    'completed': { cls: 'primary', label: 'Completed' },
    'cancelled': { cls: 'danger', label: 'Cancelled' }
  };
  const s = statusMap[status?.toLowerCase()] || { cls: 'default', label: status };
  return `<span class="badge badge-${s.cls}">${s.label}</span>`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const riskBadge = (level) => {
  const l = level?.toLowerCase();
  const cls = l === 'critical' ? 'danger' : l === 'high' ? 'high' : l === 'moderate' ? 'moderate' : 'low';
  return `<span class="badge badge-${cls}">${level || '—'}</span>`;
};

// ── Render Sidebar ────────────────────────────────────────────
const renderSidebar = (activePage) => {
  const user = getUser();
  if (!user) return;
  const initials = user.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || '?';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  let navItems = '';
  if (user.role === 'student') {
    navItems = `
      <div class="nav-section-label">Main</div>
      <a class="nav-item ${activePage==='dashboard'?'active':''}" href="dashboard.html"><span class="nav-icon">⊞</span> Dashboard</a>
      <a class="nav-item ${activePage==='assessment'?'active':''}" href="assessment.html"><span class="nav-icon">📋</span> Assessment</a>
      <a class="nav-item ${activePage==='appointment'?'active':''}" href="appointment.html"><span class="nav-icon">📅</span> Appointments</a>
      <div class="nav-section-label">Support</div>
      <a class="nav-item ${activePage==='resources'?'active':''}" href="resources.html"><span class="nav-icon">📚</span> Resources</a>
      <a class="nav-item ${activePage==='chatbot'?'active':''}" href="chatbot.html"><span class="nav-icon">💬</span> Chat Support</a>
      <a class="nav-item ${activePage==='crisis'?'active':''}" href="crisis.html"><span class="nav-icon">🆘</span> Emergency Help</a>`;
  } else if (user.role === 'counselor') {
    navItems = `
      <div class="nav-section-label">Counselor</div>
      <a class="nav-item ${activePage==='counselor'?'active':''}" href="counselor.html"><span class="nav-icon">📅</span> My Appointments</a>
      <a class="nav-item ${activePage==='notes'?'active':''}" href="notes.html"><span class="nav-icon">📝</span> Session Notes</a>
      <a class="nav-item ${activePage==='resources'?'active':''}" href="resources.html"><span class="nav-icon">📚</span> Resources</a>`;
  } else {
    navItems = `
      <div class="nav-section-label">Administration</div>
      <a class="nav-item ${activePage==='admin'?'active':''}" href="admin.html"><span class="nav-icon">⊞</span> Dashboard</a>`;
  }

  const sidebarEl = document.getElementById('app-sidebar');
  if (sidebarEl) {
    sidebarEl.innerHTML = `
      <div class="sidebar-brand">
        <a href="../index.html"><img src="../MindBridgeCanva.png" alt="MindBridge Logo" class="sidebar-logo-img" /></a>
        <div class="brand-text-wrap">
          <span class="brand-name">MindBridge</span>
        </div>
      </div>
      <nav class="sidebar-nav">${navItems}</nav>
      <div class="sidebar-user">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          <div class="user-role">${user.role}</div>
        </div>
        <button class="logout-btn" onclick="logout()" title="Sign out">⏻</button>
      </div>`;

    // ── Global Sidebar Toggle & Overlay Logic (Mobile) ─────────────
    let toggleBtn = document.getElementById('sidebar-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'sidebar-toggle';
      toggleBtn.className = 'sidebar-toggle';
      toggleBtn.innerHTML = '☰ Menu';
      document.body.appendChild(toggleBtn);
    }

    let overlay = document.getElementById('app-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'app-overlay';
      overlay.className = 'app-overlay';
      document.body.appendChild(overlay);
    }

    const closeSidebar = () => {
      sidebarEl.classList.remove('open');
      overlay.classList.remove('visible');
    };

    toggleBtn.onclick = () => {
      sidebarEl.classList.toggle('open');
      overlay.classList.toggle('visible');
    };

    overlay.onclick = closeSidebar;
    // Close on navigation to improve UX
    sidebarEl.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', closeSidebar);
    });
  }


  const topbar = document.querySelector('.topbar');
  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-left">
        <span class="topbar-brand-name">Dashboard</span>
      </div>
      <div class="topbar-right">
        <div class="topbar-notifications" id="notif-trigger">
          <span class="notif-bell">🔔</span>
          <span class="notif-count" id="notif-count" style="display:none;">0</span>
          <div class="notif-dropdown" id="notif-dropdown">
            <div class="notif-header"><span class="notif-title">Notifications</span></div>
            <div class="notif-list" id="notif-list"><div class="notif-empty">Loading...</div></div>
          </div>
        </div>
        <div class="topbar-user">
          <div class="user-avatar">${initials}</div>
          <span class="user-name">${user.name.split(' ')[0]}</span>
          <span class="dropdown-arrow">▾</span>
        </div>
      </div>`;

    // Notification dropdown toggle
    const trigger = document.getElementById('notif-trigger');
    const dropdown = document.getElementById('notif-dropdown');
    if (trigger && dropdown) {
      trigger.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) fetchNotifications();
      };
      document.addEventListener('click', () => dropdown.classList.remove('show'));
      dropdown.onclick = (e) => e.stopPropagation();
    }
  }

  const dateEl = document.getElementById('topbar-date');
  if (dateEl) dateEl.textContent = today;

  // Initial fetch for count
  fetchNotifications(true);
};

let notifications = [];
async function fetchNotifications(onlyCount = false) {
  try {
    const res = await apiFetch('/notifications');
    notifications = res.data;
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const countEl = document.getElementById('notif-count');
    if (countEl) {
      countEl.textContent = unreadCount;
      countEl.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    if (!onlyCount) renderNotifList();
  } catch (err) { console.error('Notif fetch failed:', err); }
}

function renderNotifList() {
  const el = document.getElementById('notif-list');
  if (!el) return;
  if (notifications.length === 0) {
    el.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    return;
  }
  el.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.is_read ? '' : 'unread'} ${n.type}" onclick="markRead(${n.notification_id})">
      <div class="notif-icon-box">${n.type === 'appointment' ? '📅' : n.type === 'assessment' ? '📋' : '⚙️'}</div>
      <div class="notif-content">
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${formatTimeAgo(n.created_at)}</div>
      </div>
    </div>
  `).join('');
}

async function markRead(id) {
  try {
    await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
    fetchNotifications();
  } catch (err) { console.error('Mark read failed:', err); }
}

function formatTimeAgo(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(dateStr);
}

const EMERGENCY_HELP_NUMBER = '112';
const EMERGENCY_SUPPORT_NUMBER = '+911234567890';
const EMERGENCY_HELP_NAME = 'Emergency Helpline';
let sosCountdownInterval;
let sosCountdownTimeout;

function openSOSModal(phone = EMERGENCY_HELP_NUMBER) {
  let modal = document.getElementById('sos-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'sos-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">SOS Emergency Call</div>
          <button class="modal-close" onclick="closeSOSModal()">✕</button>
        </div>
        <div class="modal-body">
          <p class="sos-modal-title">Calling emergency support</p>
          <p class="sos-message">Your call will be placed in <strong><span class="sos-countdown">3</span></strong> seconds.</p>
          <div class="sos-contact">
            <strong>Helpline</strong>
            <a href="tel:${phone}" class="sos-number">${phone}</a>
          </div>
          <div style="display:flex; justify-content:flex-end; gap: 10px; margin-top: 14px;">
            <button class="btn btn-ghost btn-sm" onclick="closeSOSModal()">Cancel</button>
            <button class="btn btn-danger btn-sm" onclick="executeSOSCall('${phone}')">Call Now</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  const countdownEl = modal.querySelector('.sos-countdown');
  const numberEl = modal.querySelector('.sos-number');
  const messageEl = modal.querySelector('.sos-message');

  if (countdownEl) countdownEl.textContent = '3';
  if (numberEl) numberEl.textContent = phone;
  if (messageEl) messageEl.textContent = `Your call will be placed in ${countdownEl.textContent} seconds.`;

  modal.classList.add('open');

  clearInterval(sosCountdownInterval);
  clearTimeout(sosCountdownTimeout);

  let counter = 3;
  sosCountdownInterval = setInterval(() => {
    counter -= 1;
    if (countdownEl) countdownEl.textContent = String(counter);
    if (counter <= 0) {
      clearInterval(sosCountdownInterval);
    }
  }, 1000);

  sosCountdownTimeout = setTimeout(() => {
    executeSOSCall(phone);
  }, 3000);
}

function executeSOSCall(phone = EMERGENCY_HELP_NUMBER) {
  closeSOSModal();
  window.location.href = `tel:${phone}`;
}

function closeSOSModal() {
  const modal = document.getElementById('sos-modal');
  if (!modal) return;
  modal.classList.remove('open');
  clearInterval(sosCountdownInterval);
  clearTimeout(sosCountdownTimeout);
}

function handleSOS(phone = EMERGENCY_HELP_NUMBER) {
  openSOSModal(phone);
}

