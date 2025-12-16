import { GoogleGenAI, Type } from "@google/genai";
import { Student, ScanResult } from '../types';

// Initialize Gemini
// Note: In a real production app, this should be proxied through a backend to hide the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFrame = async (
  currentFrameBase64: string,
  registeredStudents: Student[]
): Promise<ScanResult> => {
  
  // Clean base64 strings (remove data:image/png;base64 prefix if present)
  const cleanFrame = currentFrameBase64.split(',')[1] || currentFrameBase64;

  if (registeredStudents.length === 0) {
     return {
        matchId: null,
        confidence: 0,
        isRealPerson: false,
        emotion: "No students registered",
        description: "Please register students first."
     };
  }

  // Construct the prompt
  // We send the current frame and the registered faces as reference.
  // Gemini 2.5 Flash is excellent at visual comparison.
  
  const studentDescriptions = registeredStudents.map(s => `ID: ${s.id}, Name: ${s.name}`).join('\n');
  
  const systemInstruction = `
    You are an AI Proctor and Face Recognition System.
    Your task is to compare the person in the 'Target Image' with the provided 'Reference Images'.
    
    1. Identification: Determine if the person in the Target Image matches ANY of the Reference Images.
    2. Liveness Check: Analyze the Target Image for signs of spoofing (e.g., holding a phone with a photo, pixelation patterns of a screen, flat 2D paper, extreme glare). 
    3. Emotion Analysis: Briefly describe the emotion/expression of the person in the Target Image.
    
    Return the result in JSON format.
  `;

  // Prepare parts: Target Image + Reference Images
  const parts: any[] = [];
  
  // 1. Target Image
  parts.push({ text: "TARGET IMAGE (Current Camera Feed):" });
  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: cleanFrame
    }
  });

  // 2. Reference Images (Limit to 5 for demo performance/token usage, usually you'd use a vector DB)
  // We will tell the model which ID belongs to which image via text context before the image
  parts.push({ text: "REFERENCE IMAGES (Registered Students):" });
  
  // Optimization: For a pure frontend demo, we might hit payload limits if we send too many images.
  // We will send up to 5 students for this demo.
  const activeStudents = registeredStudents.slice(0, 5); 
  
  for (const student of activeStudents) {
    parts.push({ text: `Student ID: ${student.id} - Name: ${student.name}` });
    const cleanRef = student.photoUrl.split(',')[1] || student.photoUrl;
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanRef
      }
    });
  }

  parts.push({ text: "Analyze the Target Image against the Reference Images. If a match is found with high confidence, return the ID. If strictly no match, return null." });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchId: { type: Type.STRING, nullable: true, description: "The ID of the matching student, or null if no match." },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." },
            isRealPerson: { type: Type.BOOLEAN, description: "True if it looks like a real person, False if it looks like a spoof/photo." },
            emotion: { type: Type.STRING, description: "Detected emotion (e.g., Focused, Happy, Tired)." },
            description: { type: Type.STRING, description: "Short reasoning for the match and liveness decision." }
          },
          required: ["confidence", "isRealPerson", "emotion", "description"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as ScanResult;

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Failed to analyze frame.");
  }
};