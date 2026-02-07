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
4.  **Configure `app.js`:**
    *   Open `app.js` in your editor.
    *   Replace the placeholder `firebaseConfig` (lines 31-38) with the config you copied from Firebase.
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID",
    };
    ```

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

*   **Goals:** "Stand" ($10,000) and "Maroro" ($500) are preconfigured with hardcoded, static target values. They are created automatically and cannot be modified.
*   **Custom Goals:** Use the "Goal Garden" section to add new customized goals.
*   **Deposits:** Select a goal and enter an amount.
*   **Deductions:** To record spending, select the **Other** goal and enter a negative amount (e.g., `-50`). Deductions are only allowed from the "Other" category.
*   **Completion:** When a goal reaches 100%, a "Complete" button will appear. Clicking it will automatically record a deduction from the "Other" goal and reset the progress of that goal.
*   **Timeline:** The activity feed shows the last 10 transactions in real-time.

---

### Units
All amounts are in **USD ($)**.
