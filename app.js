const goals = [
  { name: "Stand", target: 1800, saved: 620 },
  { name: "Maroro", target: 2500, saved: 980 },
  { name: "Event", target: 3200, saved: 1450 },
  { name: "Other", target: 1200, saved: 260 },
];

const activityFeed = document.getElementById("activity-feed");
const goalGrid = document.getElementById("goal-grid");
const totalBalance = document.getElementById("total-balance");
const celebrate = document.getElementById("celebrate");
const heroTitle = document.getElementById("hero-title");

let activePartner = "Taah";
let activities = [
  { amount: 220, note: "Movie night snacks", goal: "Event", partner: "Panah" },
  { amount: 140, note: "Market stroll", goal: "Stand", partner: "Taah" },
];

const formatMoney = (value) => `R ${value.toLocaleString()}`;

const initFirebase = () => {
  if (typeof firebase === "undefined") {
    console.warn("Firebase SDK not loaded.");
    return;
  }

  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  };

  const app = firebase.initializeApp(firebaseConfig);
  return firebase.firestore(app);
};

const updateTotals = () => {
  const total = goals.reduce((sum, goal) => sum + goal.saved, 0);
  totalBalance.textContent = formatMoney(total);
};

const renderGoals = () => {
  goalGrid.innerHTML = "";

  goals.forEach((goal) => {
    const progress = Math.min((goal.saved / goal.target) * 100, 100);
    const card = document.createElement("div");
    card.className = "goal-card";
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
    `;
    goalGrid.appendChild(card);

    if (progress >= 90) {
      celebrate.classList.add("active");
    }
  });
};

const renderActivity = () => {
  activityFeed.innerHTML = "";
  activities.slice(0, 4).forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <span>💌 ${activity.partner} added ${formatMoney(activity.amount)} to ${activity.goal}</span>
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

const handleDeposit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const amount = Number(formData.get("amount"));
  const goalName = formData.get("goal");
  const note = formData.get("note");

  const goal = goals.find((item) => item.name === goalName);
  if (!goal || Number.isNaN(amount)) return;

  goal.saved += amount;
  activities.unshift({ amount, note, goal: goalName, partner: activePartner });

  event.target.reset();
  renderGoals();
  renderActivity();
  updateTotals();
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

updateTotals();
renderGoals();
renderActivity();
updatePartnerTag();
initTypeIt();
const db = initFirebase();

document.getElementById("deposit-form").addEventListener("submit", handleDeposit);

document.querySelectorAll(".tag").forEach((tag) => {
  tag.addEventListener("click", () => {
    activePartner = tag.dataset.partner;
    updatePartnerTag();
  });
});
