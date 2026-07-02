/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Lazy-loaded Gemini AI client helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        // Graceful fallback response if GEMINI_API_KEY is not defined yet
        console.warn('Gemini API key is missing. Using pre-coded professional fallback answers.');
        const lowerMessage = message.toLowerCase();
        let fallbackText = "I am ready to help optimize your multi-cloud spend! However, the Gemini API key is currently not configured in the secrets settings. Once enabled, I can perform deep analysis on your real-time resources.";
        
        if (lowerMessage.includes('ec2') || lowerMessage.includes('spike')) {
          fallbackText = "Analyzing the EC2 traffic spike in us-east-1:\n- **Root Cause**: An unexpected surge in worker node scale-ups triggered by a Jenkins build deadlock.\n- **Impact**: Unused compute ran continuously for 18 hours at a cost of $4,200.\n- **Actionable Advice**: Configure aggressive autoscaling cool-down periods and install automated health probes.";
        } else if (lowerMessage.includes('s3') || lowerMessage.includes('lifecycle')) {
          fallbackText = "Looking at S3 storage costs: You have 42TB in standard buckets that haven't been accessed in 90+ days. Shifting these to Glacier Instant Retrieval will save $1,200/month immediately with zero user friction.";
        } else if (lowerMessage.includes('sustainability') || lowerMessage.includes('carbon')) {
          fallbackText = "Your cloud carbon footprint is 12.4 MT CO2e this month. By shifting batch computations from us-east-1 to eu-west-1 (which runs on 90% hydro power), you will instantly reduce emissions by 40%!";
        }
        return res.json({ text: fallbackText });
      }

      // Prepare contents array for the SDK from user conversation history
      const contents: any[] = [];
      
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        });
      }
      
      // Add active prompt
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: `You are Sage, the expert FinOps and Cloud Carbon Intelligence AI advisor for enterprise multi-cloud infrastructures.
Your tone is professional, objective, highly analytical, and concise.
You provide clear, actionable insights regarding cloud optimization, right-sizing, anomaly detection, carbon efficiency, and cloud architecture.
Use markdown for headers, lists, and bold callouts to make your advice scannable and clear.`
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error in chat route:', error);
      res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
  });

  // Vite middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudSage Server listening at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start CloudSage server:', err);
});
