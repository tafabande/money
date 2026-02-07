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
  sassyTypeIt = new TypeIt("#sassy-comment", {
    strings: comment,
    speed: 50,
    waitUntilVisible: true,
  }).go();
};

const renderGraphs = () => {
  const chartCanvas = document.getElementById('progressChart');
  if (!chartCanvas) return;
  
  const ctx = chartCanvas.getContext('2d');
  const filteredGoals = goals.filter(g => g.name !== 'Other');
  const labels = filteredGoals.map(g => g.name);
  const data = filteredGoals.map(g => {
    return g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
  });

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Progress (%)',
          data: data,
          borderColor: '#7b4dff',
          backgroundColor: 'rgba(123, 77, 255, 0.2)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff4fb0',
          pointBorderColor: '#fff',
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => value + '%'
            }
          }
        },
        plugins: {
          legend: {
            display: false
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

const db = initFirebase();

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
  totalBalance.textContent = formatMoney(total);
  updateSassyComment(total);
  updateFooterStats();
};

const renderGoals = () => {
  goalList.innerHTML = "";
  goalSelect.innerHTML = '<option value="" disabled>Select a goal</option>';

  goals.forEach((goal) => {
    // Populate select
    const option = document.createElement("option");
    option.value = goal.name;
    option.textContent = goal.name;
    if (goal.name === "maroro") {
      option.selected = true;
    }
    goalSelect.appendChild(option);

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
    goalList.appendChild(card);

    if (progress >= 90) {
      celebrate.classList.add("active");
    }
  });
  renderGraphs();
};

const renderActivity = () => {
  activityFeed.innerHTML = "";
  activities.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    const prefix = activity.amount < 0 ? "📉" : "✨";
    const dateStr = activity.date ? new Date(activity.date).toLocaleDateString() : (activity.timestamp ? activity.timestamp.toDate().toLocaleDateString() : "");
    
    item.innerHTML = `
      <span>${prefix} <strong>${activity.partner}</strong> ${activity.amount < 0 ? 'spent' : 'added'} ${formatMoney(Math.abs(activity.amount))} for ${activity.goal}</span>
      <span class="muted" style="font-size: 0.8rem;">${dateStr} - ${activity.note || "Saving contribution"}</span>
    `;
    activityFeed.appendChild(item);
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
    // Update goal in Firestore
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

    alert(`${goalName} completed! ${formatMoney(amount)} deducted from Other.`);
  } catch (error) {
    console.error("Error completing goal:", error);
    alert("Make sure 'Other' goal exists!");
  }
};

const syncData = () => {
  if (!db) return;

  // Sync Goals
  db.collection("goals").onSnapshot((snapshot) => {
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
  db.collection("activities").orderBy("timestamp", "desc").limit(10).onSnapshot((snapshot) => {
    activities = snapshot.docs.map(doc => doc.data());
    renderActivity();
  });
};

const initTypeIt = () => {
  if (typeof TypeIt === "undefined") return;

  // Hero Title
  const titleEl = document.getElementById("hero-title");
  if (titleEl) {
    new TypeIt("#hero-title", {
      speed: 100,
      startDelay: 500,
      waitUntilVisible: true
    })
    .empty()
    .type("Couple Goals Vault ✨")
    .go();
  }

  // Subhead
  const subheadEl = document.querySelector(".subhead");
  if (subheadEl) {
    const originalText = subheadEl.textContent;
    subheadEl.textContent = "";
    new TypeIt(".subhead", {
      strings: originalText,
      speed: 20,
      startDelay: 1500,
      waitUntilVisible: true
    }).go();
  }

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
      speed: 60,
      breakLines: false,
      loop: true,
      nextStringDelay: 3000,
      startDelay: 2000,
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

syncData();
updatePartnerTag();
initTypeIt();
