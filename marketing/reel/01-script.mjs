// Step 1: local LLM (Ollama qwen3:14b) drafts the Reel script from the website copy.
import fs from 'node:fs';
const brief = `
Company: PHG Labs (phglabs.in), a software company in Karad, Maharashtra, India.
Products: AyurOS - software for Ayurvedic clinics & hospitals (patient records, digital prescriptions, Panchakarma therapy scheduling, medicine stock & billing).
Shop Stock - simple stock and billing for shops (real-time stock, low-stock alerts, quick billing, sales & profit reports).
Custom Software - web, mobile, desktop apps, integrations, cloud hosting, maintenance.
Services: web development, mobile apps, cloud & devops, AI & automation.
Values: secure, fast, customisable, supported by our own team. Free demo. WhatsApp +91 74997 03345.
`;
const prompt = `${brief}
Write a 25-30 second Instagram Reel advert voiceover for PHG Labs. Audience: small business owners, clinic owners and shopkeepers in India.
Structure: a scroll-stopping hook question (first 2 seconds), the problem, AyurOS, Shop Stock, custom software, then a call to action to book a free demo at phglabs.in.
Keep it warm, confident and simple English. Max 75 words total. Each scene 1-2 short sentences.
Return ONLY JSON: {"scenes":[{"id":"hook|problem|ayuros|shopstock|custom|cta","vo":"voiceover text","headline":"2-5 word on-screen headline"}]}`;
const res = await fetch('http://127.0.0.1:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({ model: 'qwen3:14b', prompt, stream: false, format: 'json', think: false, options: { temperature: 0.7 } }),
});
const j = await res.json();
fs.writeFileSync(new URL('./build/script.llm.json', import.meta.url), j.response);
console.log(j.response);
