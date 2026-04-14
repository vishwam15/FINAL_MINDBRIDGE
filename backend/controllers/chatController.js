// controllers/chatController.js - AI Chatbot with persistent history
const db = require('../config/db');
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey && apiKey !== 'your_gemini_api_key') {
    ai = new GoogleGenAI({ apiKey });
}

// POST /api/chat/message - Save user message and get chatbot response
// System Instruction for the AI Personality
const systemInstruction = `
    You are "MindBridge Digital Companion," a friendly, empathetic, and professional mental health support AI for students.
    
    GUIDELINES:
    1. Listen empathetically and acknowledge student feelings (anxiety, stress, loneliness, etc.).
    2. Provide VARIETY in your responses. Don't be too repetitive.
    3. MOOD BOOSTING: If a student feels down, you are allowed to tell a lighthearted, safe, and clean joke to lift their spirits.
    4. PROACTIVE SUGGESTIONS: Suggest "Quick Wellness Actions" when appropriate:
       - Physical: 2-minute stretching, a short walk, or simple yoga poses.
       - Mental: Box breathing (4-4-4-4), the 5-4-3-2-1 grounding technique, or a 1-minute mindfulness pause.
    5. BOUNDARIES: Do NOT provide medical diagnoses. If a student mentions self-harm, crisis, or extreme distress, GENTLY but FIRMLY guide them to use the "Emergency SOS" button or book a counselor session.
    6. TONE: Professional yet warm, clinical yet human. Keep responses between 2-4 sentences unless explaining an exercise.
`;

const handleChat = async (req, res) => {
    try {
        const { message, student_id } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message text is required.' });
        }

        // Save user message to database
        if (student_id) {
            try {
                await db.query(
                    'INSERT INTO chat_message (student_id, sender, message) VALUES (?, ?, ?)',
                    [student_id, 'student', message]
                );
            } catch (dbErr) {
                console.error('DB save error:', dbErr);
            }
        }

        let botResponse = '';
        
        try {
            if (!ai) {
                throw new Error("Gemini AI not initialized (check API Key)");
            }

            // ── AI Generation (Unified SDK Pattern) ─────────────────────
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                systemInstruction: systemInstruction,
                contents: [{ role: 'user', parts: [{ text: message }] }],
                config: {
                    temperature: 0.8, // Slightly higher for more variety
                    topP: 0.95
                }
            });

            botResponse = response.text || "I'm listening. Could you tell me more about that?";

        } catch (aiErr) {
            console.error('❌ AI API error:', aiErr.message);
            
            // Smarter fallback if API fails
            const fallbacks = [
                "I'm here to listen. It sounds like you're going through a lot. Have you considered talking to one of our campus counselors?",
                "I'm experiencing a brief connection hiccup, but I'm still here for you. Remember to take a deep breath.",
                "I value what you're sharing. If this feels overwhelming, please remember our Emergency SOS tools are always available."
            ];
            botResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            
            // Critical safety check even in fallback
            if (message.toLowerCase().includes('kill') || message.toLowerCase().includes('die') || message.toLowerCase().includes('harm')) {
                botResponse = "I'm very concerned about what you're sharing. Please, reach out to a professional immediately. You can use the 'Emergency Help' tab in your dashboard or call the national crisis hotline at 988.";
            }
        }

        // Save bot response to database
        if (student_id) {
            try {
                await db.query(
                    'INSERT INTO chat_message (student_id, sender, message) VALUES (?, ?, ?)',
                    [student_id, 'bot', botResponse]
                );
            } catch (dbErr) {
                console.error('DB save error:', dbErr);
            }
        }

        res.json({ success: true, reply: botResponse });
    } catch (err) {
        console.error('Chat Error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to process chat.' });
    }
};

// GET /api/chat/history/:studentId - Get chat history
const getHistory = async (req, res) => {
    try {
        const [messages] = await db.query(
            'SELECT message_id, sender, message, created_at FROM chat_message WHERE student_id = ? ORDER BY created_at ASC LIMIT 150',
            [req.params.studentId]
        );
        res.json({ success: true, data: messages });
    } catch (err) {
        console.error('Get history error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch chat history.' });
    }
};

// DELETE /api/chat/clear/:studentId - Clear chat history
const clearHistory = async (req, res) => {
    try {
        await db.query('DELETE FROM chat_message WHERE student_id = ?', [req.params.studentId]);
        res.json({ success: true, message: 'Chat history cleared.' });
    } catch (err) {
        console.error('Clear history error:', err);
        res.status(500).json({ success: false, message: 'Failed to clear chat history.' });
    }
};

module.exports = { handleChat, getHistory, clearHistory };
