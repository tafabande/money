const STATIC_GOALS = {
  "Stand": 10000,
  "Maroro": 500,
  "Other": 0
};

let goals = Object.entries(STATIC_GOALS).map(([name, target]) => ({
  name,
  target,
  saved: 0
}));
let activities = [];
let activePartner = "Taah";

const activityFeed = document.getElementById("activity-feed");
const goalGrid = document.getElementById("goal-grid");
const totalBalance = document.getElementById("total-balance");
const celebrate = document.getElementById("celebrate");
const heroTitle = document.getElementById("hero-title");
const goalSelect = document.getElementById("goal-select");

const formatMoney = (value) => `$ ${value.toLocaleString()}`;

const initFirebase = () => {
  if (typeof firebase === "undefined") {
    console.warn("Firebase SDK not loaded.");
    return null;
  }

  // PLACEHOLDER: User should replace this with their own config
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  };

  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("Please configure your Firebase settings in app.js");
    return null;
  }

  const app = firebase.initializeApp(firebaseConfig);
  return firebase.firestore(app);
};

const db = initFirebase();

const updateTotals = () => {
  const total = goals.reduce((sum, goal) => sum + goal.saved, 0);
  totalBalance.textContent = formatMoney(total);
};

const renderGoals = () => {
  goalGrid.innerHTML = "";
  goalSelect.innerHTML = '<option value="" disabled selected>Select a goal</option>';

  goals.forEach((goal) => {
    // Populate select
    const option = document.createElement("option");
    option.value = goal.name;
    option.textContent = goal.name;
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
      <div class="goal-progress"><span style="width:${progress}%"></span></div>
      <div class="goal-meta">
        <span>${formatMoney(goal.saved)} saved</span>
        <span>Goal ${formatMoney(goal.target)}</span>
      </div>
      ${completionUI}
    `;
    goalGrid.appendChild(card);

    if (progress >= 90) {
      celebrate.classList.add("active");
    }
  });
};

const renderActivity = () => {
  activityFeed.innerHTML = "";
  activities.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    const prefix = activity.amount < 0 ? "💸" : "💌";
    item.innerHTML = `
      <span>${prefix} ${activity.partner} ${activity.amount < 0 ? 'deducted' : 'added'} ${formatMoney(Math.abs(activity.amount))} ${activity.amount < 0 ? 'from' : 'to'} ${activity.goal}</span>
      <span>${activity.note || "Love deposit"}</span>
    `;
    activityFeed.appendChild(item);
  });
};

const updatePartnerTag = () => {
  document.querySelectorAll(".tag").forEach((tag) => {
    tag.classList.toggle("active", tag.dataset.partner === activePartner);
  });
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
      partner: activePartner,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    event.target.reset();
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
  if (!heroTitle || typeof TypeIt === "undefined") return;

  new TypeIt(heroTitle, {
    speed: 50,
    waitUntilVisible: true,
  })
    .delete(5)
    .type("Vault")
    .pause(600)
    .go();
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
