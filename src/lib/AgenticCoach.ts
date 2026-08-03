import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client using the API key from environment variables
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// System prompt that dictates the agent's behavior and personality
const SYSTEM_PROMPT = `
You are the "Smart Breath Buddy", an advanced AI Agent medical coach designed to help patients use their asthma inhalers correctly.
You will receive real-time sensor data (dummy data for this prototype) regarding the patient's breathing cycle (inhalation strength, duration, holding time, and device orientation).
Your job is to analyze this data, reason about the patient's performance, and decide what verbal instructions or feedback to give them.

You have access to a tool called 'speakToPatient'. You MUST use this tool to communicate with the patient. DO NOT reply with normal text. Only use the tool.

Medical Rules:
- The inhaler must be held upright (orientation angle should be close to 0). If the angle is > 30 degrees, it is incorrect.
- The patient should inhale for 3-5 seconds.
- The patient should hold their breath for 10 seconds.
- Inhalation strength should be steady.

Be encouraging, concise, and professional. The messages you generate will be spoken out loud by a text-to-speech engine.
`;

export class AgenticCoach {
  private chat: any;
  private onSpeakCommand: (message: string) => void;

  constructor(onSpeakCommand: (message: string) => void) {
    this.onSpeakCommand = onSpeakCommand;
  }

  public async initialize() {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      console.error("VITE_GEMINI_API_KEY is missing. AI Agent cannot run.");
      return;
    }

    try {
      this.chat = await ai.chats.create({
        model: 'gemini-flash-latest',
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{
            functionDeclarations: [{
              name: 'speakToPatient',
              description: 'Speak a message aloud to the patient using text-to-speech to guide them or correct their technique.',
              parameters: {
                type: 'OBJECT',
                properties: {
                  message: {
                    type: 'STRING',
                    description: 'The exact phrase to speak out loud. Should be short and clear.'
                  }
                },
                required: ['message']
              }
            }]
          }]
        }
      });
      console.log("Agentic Coach initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize Agentic Coach:", error);
    }
  }

  public async processSensorData(sensorData: any) {
    if (!this.chat) {
      console.warn("Agentic Coach is not initialized. Using fallback.");
      return;
    }

    const prompt = `Current Sensor Data: ${JSON.stringify(sensorData)}. Please evaluate and speak to the patient.`;
    
    try {
      console.log("Sending sensor data to AI Agent...", sensorData);
      const response = await this.chat.sendMessage({ message: prompt });
      console.log("AI Agent response:", response);
      
      let spoke = false;
      // Check if the model called a function
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'speakToPatient') {
            const message = (call.args as any).message;
            console.log("AI Agent called speakToPatient:", message);
            this.onSpeakCommand(message);
            spoke = true;
          }
        }
      }
      
      // Fallback: if it didn't call the tool but returned text
      if (!spoke && response.text) {
        console.log("AI Agent returned text instead of tool:", response.text);
        this.onSpeakCommand(response.text);
      }
    } catch (error) {
      console.error("Error processing sensor data with AI Agent:", error);
    }
  }
}

