/**
 * Local Data Store — replaces backend entirely.
 * All data lives in arrays, persisted to localStorage.
 */

const STORAGE_KEYS = {
  USERS: 'cca_users',
  APPLICATIONS: 'cca_applications',
  CREDIT_SCORES: 'cca_credit_scores',
  CURRENT_USER: 'cca_current_user',
};

// --- Helpers ---
function load(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return `CCA-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function getAge(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function generateCreditScore(pan) {
  let seed = 0;
  for (let i = 0; i < pan.length; i++) {
    seed += pan.charCodeAt(i) * (i + 1);
  }
  return 300 + (seed % 601); // 300–900
}

function calculateCreditLimit(income) {
  if (income <= 200000) return 50000;
  if (income <= 300000) return 75000;
  if (income <= 500000) return 1000000;
  return Math.min(income * 2, 5000000);
}

function determineCardType(creditLimit) {
  if (creditLimit <= 50000) return 'basic';
  if (creditLimit <= 100000) return 'silver';
  if (creditLimit <= 500000) return 'gold';
  return 'platinum';
}

// --- Seed default admin & approver on first load ---
function seedDefaults() {
  const users = load(STORAGE_KEYS.USERS);
  if (users.length === 0) {
    const defaults = [
      {
        id: 'user-admin-001',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@creditcardpro.com',
        password: 'Admin@123456',
        phone: '9876543210',
        dateOfBirth: '1990-01-15',
        pan: 'ADMIN1234A',
        role: 'admin',
        address: { street: '123 Admin St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user-approver-001',
        firstName: 'Credit',
        lastName: 'Approver',
        email: 'approver@creditcardpro.com',
        password: 'Approver@123456',
        phone: '9876543211',
        dateOfBirth: '1988-06-20',
        pan: 'APPRO1234B',
        role: 'approver',
        address: { street: '456 Approver Ave', city: 'Delhi', state: 'Delhi', pincode: '110001' },
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    save(STORAGE_KEYS.USERS, defaults);
  }
}

seedDefaults();

// ===================== AUTH =====================

export const authStore = {
  register(userData) {
    const users = load(STORAGE_KEYS.USERS);

    // Duplicate email check
    if (users.find((u) => u.email === userData.email)) {
      throw new Error('An account with this email already exists');
    }
    // Duplicate PAN check
    if (users.find((u) => u.pan === userData.pan.toUpperCase())) {
      throw new Error('An account with this PAN already exists');
    }
    // Age check
    if (getAge(userData.dateOfBirth) < 18) {
      throw new Error('Applicant must be at least 18 years old');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      pan: userData.pan.toUpperCase(),
      role: 'applicant',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    save(STORAGE_KEYS.USERS, users);

    const safeUser = { ...newUser };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    return safeUser;
  },

  login(email, password) {
    const users = load(STORAGE_KEYS.USERS);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    if (!user.isActive) throw new Error('Account has been deactivated');

    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    return safeUser;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
};

// ===================== APPLICATIONS =====================

export const applicationStore = {
  submit(userId, applicationData) {
    const users = load(STORAGE_KEYS.USERS);
    const applications = load(STORAGE_KEYS.APPLICATIONS);

    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    // Age validation
    if (getAge(user.dateOfBirth) < 18) {
      throw new Error('Applicant must be at least 18 years old');
    }

    // 6-month duplicate check
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentApp = applications.find(
      (a) =>
        a.applicantDetails.pan === user.pan &&
        new Date(a.createdAt) >= sixMonthsAgo &&
        ['APPROVED', 'REJECTED', 'PENDING', 'UNDER_REVIEW', 'DISPATCHED'].includes(a.status)
    );
    if (recentApp) {
      throw new Error(
        `You already have an application (${recentApp.applicationId}) submitted in the last 6 months with status: ${recentApp.status}. Please wait before reapplying.`
      );
    }

    // Credit score
    const creditScore = generateCreditScore(user.pan);

    // Save credit score
    const scores = load(STORAGE_KEYS.CREDIT_SCORES);
    scores.push({ pan: user.pan, score: creditScore, fetchedAt: new Date().toISOString() });
    save(STORAGE_KEYS.CREDIT_SCORES, scores);

    // Decision
    const THRESHOLD = 800;
    const isApproved = creditScore > THRESHOLD;
    const income = Number(applicationData.income);
    const creditLimit = isApproved ? calculateCreditLimit(income) : null;
    const cardType = isApproved ? determineCardType(creditLimit) : null;
    const status = isApproved ? 'APPROVED' : 'REJECTED';
    const decisionReason = isApproved
      ? `Application approved. Credit score: ${creditScore} (threshold: ${THRESHOLD}). Credit limit: ₹${creditLimit?.toLocaleString('en-IN')}.`
      : `Application rejected. Credit score: ${creditScore} is below threshold of ${THRESHOLD}.`;

    const applicationId = generateId();
    const now = new Date().toISOString();

    const statusHistory = [
      { status: 'PENDING', comment: 'Application submitted', timestamp: now },
      { status, comment: decisionReason, timestamp: now },
    ];

    let dispatchDetails = null;
    if (isApproved) {
      const expectedDelivery = new Date();
      expectedDelivery.setDate(expectedDelivery.getDate() + 7);
      dispatchDetails = {
        dispatchedAt: now,
        trackingNumber: `TRK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        expectedDelivery: expectedDelivery.toISOString(),
        carrier: 'BlueDart Express',
      };
      statusHistory.push({
        status: 'DISPATCHED',
        comment: `Card dispatched. Tracking: ${dispatchDetails.trackingNumber}. Expected delivery: ${expectedDelivery.toDateString()}.`,
        timestamp: now,
      });
    }

    const finalStatus = isApproved ? 'DISPATCHED' : 'REJECTED';

    const application = {
      applicationId,
      applicantId: userId,
      applicantDetails: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        pan: user.pan,
        address: user.address,
      },
      income,
      employmentType: applicationData.employmentType,
      employer: applicationData.employer || '',
      creditScore,
      status: finalStatus,
      creditLimit,
      cardType,
      decisionReason,
      statusHistory,
      dispatchDetails,
      createdAt: now,
      updatedAt: now,
    };

    applications.push(application);
    save(STORAGE_KEYS.APPLICATIONS, applications);
    return application;
  },

  getByApplicationId(applicationId) {
    const applications = load(STORAGE_KEYS.APPLICATIONS);
    return applications.find((a) => a.applicationId === applicationId) || null;
  },

  getByUserId(userId) {
    const applications = load(STORAGE_KEYS.APPLICATIONS);
    return applications
      .filter((a) => a.applicantId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getAll(statusFilter) {
    const applications = load(STORAGE_KEYS.APPLICATIONS);
    let filtered = [...applications];
    if (statusFilter) {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  review(applicationId, decision, comment, reviewerId) {
    const applications = load(STORAGE_KEYS.APPLICATIONS);
    const idx = applications.findIndex((a) => a.applicationId === applicationId);
    if (idx === -1) throw new Error('Application not found');

    const app = applications[idx];
    if (!['PENDING', 'UNDER_REVIEW'].includes(app.status)) {
      throw new Error(`Cannot review application with status: ${app.status}`);
    }

    const income = app.income;
    const creditLimit = decision === 'APPROVED' ? calculateCreditLimit(income) : null;
    const cardType = decision === 'APPROVED' ? determineCardType(creditLimit) : null;
    const now = new Date().toISOString();

    app.status = decision;
    app.creditLimit = creditLimit;
    app.cardType = cardType;
    app.decisionReason = comment || `Manually ${decision.toLowerCase()} by approver`;
    app.reviewedBy = reviewerId;
    app.reviewedAt = now;
    app.updatedAt = now;
    app.statusHistory.push({
      status: decision,
      comment: comment || `Manually ${decision.toLowerCase()} by approver`,
      timestamp: now,
    });

    if (decision === 'APPROVED') {
      const expectedDelivery = new Date();
      expectedDelivery.setDate(expectedDelivery.getDate() + 7);
      app.dispatchDetails = {
        dispatchedAt: now,
        trackingNumber: `TRK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        expectedDelivery: expectedDelivery.toISOString(),
        carrier: 'BlueDart Express',
      };
      app.status = 'DISPATCHED';
      app.statusHistory.push({
        status: 'DISPATCHED',
        comment: `Card dispatched. Tracking: ${app.dispatchDetails.trackingNumber}.`,
        timestamp: now,
      });
    }

    applications[idx] = app;
    save(STORAGE_KEYS.APPLICATIONS, applications);
    return app;
  },

  getAnalytics() {
    const applications = load(STORAGE_KEYS.APPLICATIONS);
    const total = applications.length;
    const byStatus = {};
    applications.forEach((a) => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    const approved = (byStatus.APPROVED || 0) + (byStatus.DISPATCHED || 0);
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;

    // Monthly trend (last 6 months)
    const monthlyMap = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    applications
      .filter((a) => new Date(a.createdAt) >= sixMonthsAgo)
      .forEach((a) => {
        const d = new Date(a.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (!monthlyMap[key]) {
          monthlyMap[key] = { year: d.getFullYear(), month: d.getMonth() + 1, count: 0, approved: 0, rejected: 0 };
        }
        monthlyMap[key].count++;
        if (['APPROVED', 'DISPATCHED'].includes(a.status)) monthlyMap[key].approved++;
        if (a.status === 'REJECTED') monthlyMap[key].rejected++;
      });

    const monthlyTrend = Object.values(monthlyMap).sort(
      (a, b) => a.year - b.year || a.month - b.month
    );

    return { total, byStatus, approvalRate, monthlyTrend };
  },
};
