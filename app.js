let chart;
let sassyTypeIt;

const updateSassyComment = (total) => {
  const totalTarget = goals.reduce((sum, goal) => sum + (goal.name !== 'Other' ? goal.target : 0), 0);
  const percentage = totalTarget > 0 ? (total / totalTarget) * 100 : 0;
  const index = Math.min(Math.floor(percentage / 10), SASSY_COMMENTS.length - 1);
  const comment = SASSY_COMMENTS[index];
  
  const commentEl = document.getElementById('sassy-comment');
  if (!commentEl) return;

  if (commentEl.dataset.lastComment === comment) return;
  commentEl.dataset.lastComment = comment;

  commentEl.innerHTML = "";
  new TypeIt("#sassy-comment", {
    strings: comment,
    speed: 20,
    waitUntilVisible: true,
  }).go();
};

const renderGraphs = () => {
  const chartCanvas = document.getElementById('progressChart');
  if (!chartCanvas) return;
  
  const ctx = chartCanvas.getContext('2d');
  
  // Filter out 'Other' and prepare goals for datasets
  const filteredGoals = goals.filter(g => g.name !== 'Other');
  
  // Sort activities by timestamp to ensure chronological order
  const sortedActivities = [...activities]
    .filter(a => a.timestamp)
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

  if (sortedActivities.length === 0) {
      if (chart) {
          chart.destroy();
          chart = null;
      }
      return;
  }

  // Create labels: unique dates/times from activities
  const labels = sortedActivities.map(a => {
      const date = a.timestamp.toDate();
      return date.toLocaleString(); // Show both date and time
  });

  const datasets = filteredGoals.map((goal, index) => {
      let currentSaved = 0;
      const dataPoints = sortedActivities.map(activity => {
          if (activity.goal === goal.name) {
              currentSaved += activity.amount;
          }
          // Also handle when goal is completed - if there was an activity for resetting the goal?
          // completeGoal adds an activity for "Other" with negative amount, and resets goal saved to 0.
          // The reset to 0 isn't captured in an activity!
          // We need to fix that or handle it.
          
          return goal.target > 0 ? Math.min(Math.max((currentSaved / goal.target) * 100, 0), 100) : 0;
      });

      const colors = [
          '#7b4dff', '#ff4fb0', '#4facfe', '#00f2fe', '#f093fb', '#f5576c'
      ];
      const color = colors[index % colors.length];

      return {
          label: goal.name,
          data: dataPoints,
          borderColor: color,
          backgroundColor: color + '33', // 20% opacity
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
      };
  });

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
                display: true,
                text: 'Progress (%)'
            },
            ticks: {
              callback: (value) => value + '%'
            }
          },
          x: {
              title: {
                  display: true,
                  text: 'Timeline'
              }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 20
            }
          },
          tooltip: {
              mode: 'index',
              intersect: false
          }
        }
      }
    });
  }
};

let goals = Object.entries(STATIC_GOALS).map(([name, target]) => ({
  name,
  target,
  saved: 0
}));
let activities = [];
let activePartner = "Taah";

const activityFeed = document.getElementById("activity-feed");
const goalList = document.getElementById("goal-list");
const totalBalance = document.getElementById("total-balance");
const celebrate = document.getElementById("celebrate");
const heroTitle = document.getElementById("hero-title");
const goalSelect = document.getElementById("goal-select");
const whoInput = document.getElementById("who-input");
const whenInput = document.getElementById("when-input");

// Check if celebrate exists before using it
const showCelebration = () => {
  if (celebrate) {
    celebrate.classList.add("active");
  }
};

// Set default date to today
if (whenInput) {
  whenInput.valueAsDate = new Date();
}

const formatMoney = (value) => `$ ${value.toLocaleString()}`;

const initFirebase = () => {
  if (typeof firebase === "undefined" || typeof firebaseConfig === "undefined") {
    console.warn("Firebase SDK or config not loaded.");
    return null;
  }

  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("Please configure your Firebase settings in js/config.js");
    return null;
  }

  const app = firebase.initializeApp(firebaseConfig);
  return firebase.firestore(app);
};

// const db = initFirebase(); // Removed to avoid double initialization

const updateFooterStats = () => {
    const completed = goals.filter(g => g.target > 0 && g.saved >= g.target && g.name !== 'Other').length;
    const active = goals.filter(g => g.name !== 'Other' && (g.saved < g.target || g.target === 0)).length;
    
    const goalsCompletedEl = document.getElementById('footer-goals-completed');
    const goalsActiveEl = document.getElementById('footer-goals-active');
    const topContributorEl = document.getElementById('footer-top-contributor');

    if (goalsCompletedEl) goalsCompletedEl.textContent = completed;
    if (goalsActiveEl) goalsActiveEl.textContent = active;
    
    if (topContributorEl) {
        const contributionMap = new Map();
        activities.forEach(a => {
            if (a.amount > 0) {
                contributionMap.set(a.partner, (contributionMap.get(a.partner) || 0) + a.amount);
            }
        });
        let topPartner = "-";
        let maxAmount = 0;
        contributionMap.forEach((amt, partner) => {
            if (amt > maxAmount) {
                maxAmount = amt;
                topPartner = partner;
            }
        });
        topContributorEl.textContent = topPartner;
    }
};

const updateTotals = () => {
  const total = goals.reduce((sum, goal) => sum + goal.saved, 0);
  if (totalBalance) totalBalance.textContent = formatMoney(total);
  updateSassyComment(total);
  updateFooterStats();
};

const renderGoals = () => {
  if (goalList) goalList.innerHTML = "";
  if (goalSelect) {
    const currentValue = goalSelect.value;
    goalSelect.innerHTML = '<option value="" disabled selected>Select a goal</option>';
    goals.forEach(goal => {
      const option = document.createElement("option");
      option.value = goal.name;
      option.textContent = goal.name;
      goalSelect.appendChild(option);
    });
    if (currentValue) goalSelect.value = currentValue;
  }

  goals.forEach((goal) => {
    // Render card
    const progress = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
    const card = document.createElement("div");
    card.className = "goal-card";
    
    let completionUI = "";
    if (progress >= 100 && goal.name !== "Other") {
      completionUI = `<button class="primary" style="font-size: 0.7rem; padding: 4px 8px; margin-top: 5px;" onclick="completeGoal('${goal.name}', ${goal.target})">Complete & Deduct from Other</button>`;
    }

    card.innerHTML = `
      <div class="goal-title">
        <span>${goal.name}</span>
        <span>${Math.round(progress)}%</span>
      </div>
      <div class="goal-progress"><span style="width: ${progress}%;"></span></div>
      <div class="goal-meta">
        <span>${formatMoney(goal.saved)} saved</span>
        <span>Goal ${formatMoney(goal.target)}</span>
      </div>
      ${completionUI}
    `;
    if (goalList) goalList.appendChild(card);

    if (progress >= 90) {
      showCelebration();
    }
  });
  renderGraphs();
};

const renderActivity = () => {
  if (activityFeed) activityFeed.innerHTML = "";
  // Sort descending for display in feed
  const displayActivities = [...activities].sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return b.timestamp.toMillis() - a.timestamp.toMillis();
  });
  displayActivities.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    const prefix = activity.amount < 0 ? "📉" : "✨";
    const dateStr = activity.date ? new Date(activity.date).toLocaleDateString() : (activity.timestamp ? activity.timestamp.toDate().toLocaleDateString() : "");
    
    item.innerHTML = `
      <span>${prefix} <strong>${activity.partner}</strong> ${activity.amount < 0 ? 'spent' : 'added'} ${formatMoney(Math.abs(activity.amount))} for ${activity.goal}</span>
      <span class="muted" style="font-size: 0.8rem;">${dateStr} - ${activity.note || "Saving contribution"}</span>
    `;
    if (activityFeed) activityFeed.appendChild(item);
  });
};

const updatePartnerTag = () => {
  document.querySelectorAll(".tag").forEach((tag) => {
    tag.classList.toggle("active", tag.dataset.partner === activePartner);
  });
  if (whoInput) {
    whoInput.value = activePartner;
  }
};

const handleDeposit = async (event) => {
  event.preventDefault();
  if (!db) {
    alert("Please configure Firebase first!");
    return;
  }

  const formData = new FormData(event.target);
  const amount = Number(formData.get("amount"));
  const goalName = formData.get("goal");
  const note = formData.get("note");
  const who = formData.get("who");
  const when = formData.get("when");

  if (Number.isNaN(amount)) return;
  
  // Requirement: deduct only others
  if (amount < 0 && goalName !== "Other") {
    alert("Deductions can only be made from the 'Other' category.");
    return;
  }

  const goal = goals.find((item) => item.name === goalName);
  if (!goal) return;

  try {
    // 1. Send data to local server (if available)
    try {
      await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, goal: goalName, note, who, when })
      });
    } catch (e) {
      console.warn("Local database update failed or not available:", e);
    }

    // 2. Update goal in Firestore
    const goalRef = db.collection("goals").doc(goalName);
    await goalRef.update({
      saved: firebase.firestore.FieldValue.increment(amount)
    });

    // Add activity in Firestore
    await db.collection("activities").add({
      amount,
      note,
      goal: goalName,
      partner: who,
      date: when,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    event.target.reset();
    if (whenInput) whenInput.valueAsDate = new Date();
    if (whoInput) whoInput.value = activePartner;
  } catch (error) {
    console.error("Error updating deposit:", error);
  }
};

const handleAddGoal = async (event) => {
  event.preventDefault();
  if (!db) {
    alert("Please configure Firebase first!");
    return;
  }

  const formData = new FormData(event.target);
  const name = formData.get("newGoalName");
  const target = Number(formData.get("newGoalTarget"));

  if (!name || Number.isNaN(target)) return;

  if (STATIC_GOALS.hasOwnProperty(name)) {
    alert(`The goal "${name}" is preconfigured and cannot be modified.`);
    return;
  }

  try {
    await db.collection("goals").doc(name).set({
      name,
      target,
      saved: 0
    });
    event.target.reset();
  } catch (error) {
    console.error("Error adding goal:", error);
  }
};

window.completeGoal = async (goalName, amount) => {
  if (!db) return;
  if (!confirm(`Complete ${goalName} and deduct ${formatMoney(amount)} from Other?`)) return;

  try {
    // 0. Send to local database
    try {
      await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: -amount, 
          goal: "Other", 
          note: `Completed ${goalName}`, 
          who: activePartner, 
          when: new Date().toISOString().split('T')[0] 
        })
      });
    } catch (e) {
      console.warn("Local database update failed or not available:", e);
    }

    // 1. Deduct from Other
    const otherRef = db.collection("goals").doc("Other");
    const otherDoc = await otherRef.get();
    if (!otherDoc.exists) {
        await otherRef.set({ name: "Other", target: 0, saved: -amount });
    } else {
        await otherRef.update({
            saved: firebase.firestore.FieldValue.increment(-amount)
        });
    }

    // 2. Add activity
    await db.collection("activities").add({
      amount: -amount,
      note: `Completed ${goalName}`,
      goal: "Other",
      partner: activePartner,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 3. Reset the goal's saved amount to 0
    await db.collection("goals").doc(goalName).update({
        saved: 0
    });

    // 4. Add activity for reset
    await db.collection("activities").add({
      amount: -amount,
      note: `Reset ${goalName} after completion`,
      goal: goalName,
      partner: activePartner,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`${goalName} completed! ${formatMoney(amount)} deducted from Other.`);
  } catch (error) {
    console.error("Error completing goal:", error);
    alert("Make sure 'Other' goal exists!");
  }
};

const syncData = () => {
  if (!db) {
    console.error("syncData called but db is not available");
    return;
  }

  // Sync Goals
  db.collection("goals").onSnapshot((snapshot) => {
    if (snapshot.empty) {
      console.warn("Goals collection is empty in Firestore. Initializing static goals...");
    }
    const fetched = snapshot.docs.map(doc => doc.data());
    const fetchedMap = new Map(fetched.map(g => [g.name, g]));

    // 1. Process Static Goals (force hardcoded targets)
    const combinedGoals = Object.entries(STATIC_GOALS).map(([name, target]) => {
      const f = fetchedMap.get(name);
      if (!f) {
        // Missing in DB, create it
        db.collection("goals").doc(name).set({ name, target, saved: 0 });
        return { name, target, saved: 0 };
      } else {
        // Exists in DB, force target if it differs
        if (f.target !== target) {
          db.collection("goals").doc(name).update({ target });
        }
        return { ...f, target };
      }
    });

    // 2. Add other non-static goals from DB
    fetched.forEach(g => {
      if (!STATIC_GOALS.hasOwnProperty(g.name)) {
        combinedGoals.push(g);
      }
    });

    goals = combinedGoals;
    renderGoals();
    updateTotals();
  });

  // Sync Activities
  db.collection("activities").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
    if (snapshot.empty) {
      console.warn("Activities collection is empty in Firestore.");
    }
    activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    // Always render activity and graphs even if validActivities is empty (to clear them)
    renderActivity();
    renderGraphs(); 
    
    // Trigger local sync
    syncToLocal(goals, activities);
  });
};

const syncToLocal = async (goals, activities) => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, activities })
    });
    console.log("Local sync successful");
  } catch (e) {
    console.warn("Local sync failed:", e);
  }
};

const initTypeIt = () => {
  if (typeof TypeIt === "undefined") return;

  const typeConfig = (speed = 50, delay = 0) => ({
    speed,
    startDelay: delay,
    waitUntilVisible: true,
    cursor: false
  });

  const elementsToType = [
    { id: "#name-taah", speed: 40, delay: 0 },
    { id: "#name-panah", speed: 40, delay: 100 },
    { id: "#hero-title", speed: 50, delay: 300 },
  ];

  elementsToType.forEach(item => {
    const el = document.querySelector(item.id);
    if (el) {
      const text = el.innerText;
      el.innerText = "";
      new TypeIt(item.id, {
        strings: text,
        ...typeConfig(item.speed, item.delay)
      }).go();
    }
  });

  // Footer Branding
  const footerTypeItEl = document.getElementById("footer-typeit");
  if (footerTypeItEl) {
    new TypeIt("#footer-typeit", {
      strings: [
        "Building our future, one cent at a time. 🏡 💍", 
        "Together is a wonderful place to be. ❤️", 
        "Stacking coins, sharing dreams. ✨",
        "Every dollar is a step closer to us. 🥂"
      ],
      speed: 30,
      breakLines: false,
      loop: true,
      nextStringDelay: 2000,
      startDelay: 1000,
      waitUntilVisible: true
    }).go();
  }
};

document.getElementById("deposit-form").addEventListener("submit", handleDeposit);
document.getElementById("goal-form").addEventListener("submit", handleAddGoal);

document.querySelectorAll(".tag").forEach((tag) => {
  tag.addEventListener("click", () => {
    activePartner = tag.dataset.partner;
    updatePartnerTag();
  });
});

const initHearts = () => {
  const container = document.getElementById('hearts-container');
  if (!container) return;

  const icons = ['❤️', '💖', '🌹', '✨', '💕'];
  
  for (let i = 0; i < 15; i++) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerText = icons[Math.floor(Math.random() * icons.length)];
    heart.style.left = Math.random() * 100 + '%';
    heart.style.animationDelay = Math.random() * 10 + 's';
    heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
    container.appendChild(heart);
  }
};

// syncData(); // Moved initialization check to window.onload to ensure Firebase is ready
window.onload = () => {
  if (db) {
    syncData();
  } else {
    console.error("Firestore 'db' not initialized. Check your config.js and network.");
  }
  renderGoals();
  updatePartnerTag();
  initTypeIt();
  initHearts();
};
