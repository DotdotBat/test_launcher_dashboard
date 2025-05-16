# QA Test Launcher & Dashboard

A web application to centrally run Playwright tests, view live shared output, and access the latest test reports. Eliminates local setup for each team member and prevents multiple simultaneous test runs.

## Key Features

-   **Centralized Test Execution:** Run Playwright tests from a web interface.
-   **Live Shared Output:** All users see the same real-time test output via Server-Sent Events.
-   **Singleton Test Runs:** Prevents multiple instances of the test suite from running concurrently.
-   **Report Access:** Serves the latest test report (Allure or Monocart).
-   **Basic Authentication:** Secures dashboard access.
-   **Auto-Connect:** Joins ongoing test sessions automatically.

## Prerequisites

-   Node.js (e.g., v16+)
-   npm or yarn
-   Playwright test suite in the project.
-   Allure (optional)

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
    (Ensure `playwright` is a dev dependency if tests are local).

2.  **Configure Credentials & Reporter:**
    Create a `.env` file in the project root:
    ```env
    # Required: Credentials for dashboard access
    QA_DASHBOARD_USERNAME="your_username"
    QA_DASHBOARD_PASSWORD="your_password"

    # Optional: Set to "allure" for Allure reports. Defaults to Monocart.
    # REPORTER="allure"
    ```
    If credentials are not set, defaults to `user`/`pass`.

## Running

1.  **Start the Server:**
    ```bash
    node app.js
    ```

2.  **Access Dashboard:**
    Open `http://localhost:3000` in your browser. Log in with credentials from `.env`.

## Usage

-   **Run Tests:** Click "Run Tests". Output appears live. The button is disabled during a run.
-   **View Report:** Click "View Report" to open the latest report in a new tab.
    -   Allure: `allure-report/index.html`
    -   Monocart: `monocart-report/index.html`
-   If tests are already running when you open the dashboard, you'll automatically see the live output.