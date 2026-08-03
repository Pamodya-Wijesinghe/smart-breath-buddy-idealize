# 🌬️ Smart Breath Buddy - IDEALIZE 2026 Submission

Smart Breath Buddy is an IoT-driven smart spacer system designed to address incorrect inhaler technique through real-time sensor monitoring, an intelligent AI Agent, and a web dashboard for clinical assessment.

---

## 🎯 Project Purpose
Incorrect inhaler technique is a common but often overlooked issue in respiratory care, leading to wasted medication and prolonged illness. Smart Breath Buddy solves this by attaching to standard medical spacers, collecting live sensor data, and evaluating the patient's performance.

This repository contains the web application prototype designed for the **IDEALIZE 2026** competition.

---

## 🚀 Core Features
- **Dashboard**: Real-time visual monitoring of device status, battery level, today's usage, and overall technique score.
- **Guided Training (Practice)**: Step-by-step breathing animation syncing with physical sensor inputs to guide patients.
- **Diary / History**: Longitudinal tracking of patient adherence.
- **Agentic AI Voice Coach (Open Category)**: A live AI agent that actively reasons over sensor data to correct patient technique mid-session.

---

## 🧠 AI Agent Workflow (Open Category)
Unlike simple rule-based voice prompts, Smart Breath Buddy integrates a **functioning AI Agent** powered by Google's Gemini 2.5 Flash model (`@google/genai`).

**How it works:**
1. **Sensors -> Frontend**: Simulated IoT sensor data (inhalation strength, hold duration, device orientation) flows into the React frontend during the Practice session.
2. **AI Reasoning**: The data is fed directly into the `AgenticCoach` (see `src/lib/AgenticCoach.ts`), which acts as an autonomous medical evaluator.
3. **Decision Making**: The AI reasons over the patient's performance against medical rules (e.g., "The angle is 45 degrees, which is > 30 degrees limit. The inhaler is tilted incorrectly.").
4. **Tool Use (Action Taking)**: Based on its reasoning, the AI autonomously calls the `speakToPatient` tool. This tool bridges the LLM output to the browser's native Web Speech API (TTS), providing real-time, low-latency, context-aware voice corrections without requiring pre-recorded clips.

---

## 🛠️ Tech Stack (Matching Proposal)
- **Frontend**: React 18, TypeScript, Vite
- **UI & Visualization**: Tailwind CSS, shadcn/ui, Recharts
- **Database & Auth**: Firebase (Firestore & Authentication)
- **AI Agent**: Google Gen AI SDK (`@google/genai` targeting `gemini-2.5-flash`)
- **Voice Output**: Browser-native Web Speech API for zero-latency Text-to-Speech

---

## ⚙️ Setup Instructions

To run this prototype locally for demonstration:

1. **Clone the repository**
   \`\`\`bash
   git clone <repo-url>
   cd smart-breath-buddy-competition
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure Environment Variables**
   Create a \`.env\` file in the root directory and add the following keys:
   \`\`\`env
   # Firebase Configuration (Create a free Firebase project and add your web app config)
   VITE_FIREBASE_API_KEY="your_firebase_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
   VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
   VITE_FIREBASE_APP_ID="your_firebase_app_id"
   
   # Google Gemini API Key (Get from Google AI Studio - Free Tier)
   VITE_GEMINI_API_KEY="your_gemini_api_key"
   \`\`\`

4. **Start the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

---

## 🔮 Future Plans
In the next phase of development, we plan to:
1. Complete the physical hardware integration using MQTT or WebSockets to stream live ESP32 data directly to the web dashboard, replacing the dummy data logic used in this early version.
2. Upgrade the AI Agent to retain memory of past sessions, allowing it to provide personalized encouragement (e.g., "You held your breath much better today than yesterday!").
3. Launch a specialized portal for healthcare professionals with role-based access.

*(Note: We pivoted slightly from ElevenLabs to the Web Speech API to ensure zero-latency feedback during live demos, and moved to Firebase + Local Storage mocking to satisfy the prototype stage without requiring a heavy backend setup).*
