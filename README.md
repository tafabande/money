### Couple Goals Vault - Setup Guide

This project is a playful dashboard for couples to track their savings goals. It uses **Firebase Firestore** for real-time data synchronization and can be easily deployed to **Vercel**.

---

### 1. Firebase Setup

To get the real-time database working, follow these steps:

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the prompts.
2.  **Enable Firestore:**
    *   In the left sidebar, click **Build** > **Firestore Database**.
    *   Click **Create database**.
    *   Choose a location and start in **Production mode** (you will need to update rules) or **Test mode** (for immediate access, but less secure).
    *   *Note: If you choose production mode, make sure your security rules allow read/write access to `goals` and `activities` collections.*
3.  **Register your Web App:**
    *   On the Project Overview page, click the **Web** icon (`</>`).
    *   Register your app (e.g., "Couple Vault").
    *   Copy the `firebaseConfig` object provided in the setup instructions.
4.  **Configure `js/config.js`:**
    *   Open `js/config.js` in your editor.
    *   Replace the placeholder `firebaseConfig` with the config you copied from Firebase.

---

### 2. Vercel Deployment

Deploying to Vercel is straightforward:

1.  **Push your code to GitHub:**
    *   Create a new repository on GitHub.
    *   Push all project files (including your updated `app.js`) to the repository.
2.  **Import to Vercel:**
    *   Go to [Vercel](https://vercel.com/) and log in with GitHub.
    *   Click **Add New** > **Project**.
    *   Import your repository.
3.  **Configure and Deploy:**
    *   Vercel will automatically detect the static files.
    *   Click **Deploy**.
    *   Once finished, you'll receive a production URL for your vault!

---

### 3. Using the App

*   **Inbuilt Goals:** "maroro" ($5,000), "stand" ($10,000), and "aniversary" ($5,000) are preconfigured.
*   **Progress Tracker:** A line graph at the top tracks your progress towards completion for each goal.
*   **Sassy Comments:** Stay motivated (or roasted) by the sassy comments that evolve for every 10% of progress you reach towards your total goals.
*   **Useful Footer:** Track your overall success with a dynamic footer showing completed goals, active ones, and the current top contributor.
*   **Animated UI:** Enjoy a lively experience with TypeIt.js animations across the dashboard.
*   **Custom Goals:** Use the "Goal Garden" section to add new customized goals.
*   **Deposits:** Enter the amount, select a goal (defaults to maroro), specify who is depositing, and the date.
*   **Deductions:** To record spending, select the **Other** goal and enter a negative amount (e.g., `-50`). Deductions are only allowed from the "Other" category.
*   **Completion:** When a goal reaches 100%, a "Complete" button will appear. Clicking it will automatically record a deduction from the "Other" goal and reset the progress of that goal.
*   **Timeline:** The activity feed shows the last 10 transactions in real-time.

---

### Units
All amounts are in **USD ($)**.
