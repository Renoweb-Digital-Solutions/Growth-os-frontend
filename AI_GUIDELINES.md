# AI & Vibe Coders Guidelines (Frontend)

This repository follows strict code quality and documentation standards. AI agents and vibe coders MUST adhere to the following rules:

## 1. Complex Logic & Architecture Documentation
Whenever implementing or modifying complex logic, you MUST include comments that break down the reasoning and the mechanism. 

**Format:**
```javascript
// Reason: [Why this approach was chosen or why this logic is necessary]
// How: [How the logic works under the hood]
```

## 2. Component Data Flow & State Management
You MUST explicitly document how data flows between components:
- **Props Passing:** When passing data, comment which component is receiving it and its file path.
- **Props Receiving:** When receiving data, comment which component passed it and its file path.
- **Central States:** Detail how central states (Context, Redux, Zustand, or lifted state) are responsible for data flow and how the whole architecture is working.

**Format Example:**
```javascript
// Receives `onSelect` from parent (frontend/app/onboarding/page.js)
// Passes `userRole` to child (frontend/components/onboarding/B2CFlow.js)
// Central State: `currentStep` in frontend/app/onboarding/page.js dictates the visible component in the onboarding flow.
```

## 3. Documentation Requirements for Changes
- **CHANGES_TIMELINE.md:** For every new implementation or significant change, you MUST add an entry to `CHANGES_TIMELINE.md`. This entry must include a detailed technical overview, data structures, and reasoning.
- **README.md:** Always update `README.md` when architectural changes happen. The README must act as the central technical doc and include markdown diagrams (e.g., Mermaid) visualizing the data flow and architecture.

## 4. Production Readiness
- Keep dependencies lean and only add packages when absolutely necessary.
