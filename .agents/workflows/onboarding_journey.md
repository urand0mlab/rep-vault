---
description: Definition of the User Onboarding Flow
---

# User Onboarding Journey

This document defines the expected behavior, required data, and UI steps for a user entering the application for the first time.

## Objective
To capture physical attributes, lifestyle choices, and attach a baseline workout program to a newly authenticated user before they reach the main dashboard.

## Trigger Condition
1. User logs in via Passkeys (WebAuthn).
2. The global `src/middleware.ts` intercepts the request.
3. If `user.onboardingCompleted` is `false`, they are redirected to `/onboarding`.
4. If `true`, they pass through to the dashboard (`/`).

## The Multi-Step UI Flow (`/onboarding`)

### Step 1: Training Selection
*   **Goal:** Determine the user's starting workout template.
*   **Options:**
    1.  **"Base Training" (Selectable):** The recommended starting point. Triggers backend seeding of Anatoly templates (e.g., Push/Pull/Legs).
    2.  **"Build Your Own" (Disabled/Greyed Out):** A visual placeholder for future functionality.

### Step 2: Physical Attributes
*   **Goal:** Capture baseline bodily metrics for BMI and progress tracking.
*   **Fields:**
    *   Height (cm)
    *   Weight (kg)
    *   Chest measurement (cm)
    *   Leg measurement (cm)
    *   Arm measurement (cm)
*   **Interactive Element:** A live, reactive BMI calculator that displays the current result and the formula: `BMI = Weight (kg) / (Height (m) * Height (m))`.

### Step 3: Lifestyle Assessment
*   **Goal:** Understand daily activity levels outside the gym.
*   **Options (Interactive Grid):**
    *   **Sedentary:** Minimal movement, typically a desk job.
    *   **Somewhat Active:** Light exercise 1-3 times a week, mostly sitting.
    *   **Active:** Moderate exercise 3-5 times a week, moving throughout the day.
    *   **Very Active:** Hard daily exercise or a physical labor job.

## Completion
Upon hitting "Finish" on Step 3:
1.  A Server Action (`completeOnboarding`) is invoked.
2.  The `UserProfile` row is created/updated in the database with the captured physical and lifestyle data.
3.  The `onboardingCompleted` flag on the `User` table is set to `true`.
4.  If "Base Training" was selected, the default templates are cloned and assigned to `userId`.
5.  The user is redirected to the main dashboard (`/`).
