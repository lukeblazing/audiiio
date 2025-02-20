/**
 * redditLeads.js
 */

import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import 'dotenv/config';

// ----------------------------------
// Configuration & Constants
// ----------------------------------
const TARGET_SUBREDDITS = [
  'warehousing', 'logistics', 'supplychain', 'manufacturing', 'operations', 
  'shipping', 'smallbusiness'
];

const SLEEP_BETWEEN_REQUESTS_MS = 2000;
const TIME_FILTER = 'week'; // Fetch posts from the last week
const MAX_LEADS = 10;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ----------------------------------
// Utility Functions
// ----------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ----------------------------------
// Reddit API Functions
// ----------------------------------
async function getRedditAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', process.env.REDDIT_USERNAME);
  params.append('password', process.env.REDDIT_PASSWORD);

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status} ${res.statusText}`);
  return (await res.json()).access_token;
}

async function searchReddit(accessToken, subreddit) {
  const url = new URL(`https://oauth.reddit.com/r/${subreddit}/search`);
  url.searchParams.set('q', "staffing OR warehouse OR hiring OR logistics");
  url.searchParams.set('restrict_sr', '1');
  url.searchParams.set('sort', 'new');
  url.searchParams.set('limit', '100');
  url.searchParams.set('t', TIME_FILTER);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'TrabaSalesLead/1.0' }
  });

  if (!res.ok) throw new Error(`Search failed for r/${subreddit}: ${res.status} ${res.statusText}`);
  return (await res.json()).data.children || [];
}

// ----------------------------------
// Lead Filtering & AI Scoring
// ----------------------------------
const seen_posts = new Set(); // Prevent duplicate leads

async function evaluatePostWithOpenAI(title, body) {
  const response = await openai.chat.completions.create({
    model: "chatgpt-4o-latest",
    messages: [
      { 
        role: "system", 
        content: "You are a sales expert specializing in staffing solutions for warehouses, manufacturing, and light industrial businesses. Your goal is to evaluate how strong a sales lead is for a company that provides temporary staffing solutions like Traba. Focus on identifying potential business opportunities where a company may have staffing needs. Only include posts that suggest the author is in a position to make decisions about staffing."
      },
      {
        role: "user", 
        content: `
        Title: "${title}"
        Body: "${body}"
        
        Question: On a scale of 0-100%, how strong of a sales lead is this for Traba's temporary staffing services? Avoid round numbers (e.g. 20% or 25%).
        - Focus on companies (not individuals looking for jobs).
        - Consider industries like warehouses, manufacturing, logistics, and light industrial.
        - Output a structured JSON response in the following format:

        {
          "lead_strength": X,  // Numeric value between 0-100, avoiding round numbers.
          "explanation": "Brief reason why this post could represent a possible lead for Traba, in a single detailed sentence."
        }
      `
      }
    ],
    max_tokens: 150,
    temperature: 0.3
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content?.trim());
  } catch (error) {
    return { lead_strength: 0, explanation: "Failed to parse response. No clear lead detected." };
  }
}

async function generateAIJoke() {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: "You are a witty assistant who provides jokes related to warehouse staffing." },
      { role: "user", content: "Give me a funny joke about warehouse staffing or logistics." }
    ],
    max_tokens: 50
  });

  return response.choices[0]?.message?.content?.trim() || "Why did the warehouse worker bring a ladder? To reach new heights in logistics!";
}

// ----------------------------------
// Email Results
// ----------------------------------
async function sendLeadEmail(leadPosts) {
  if (!leadPosts.length) return console.log("No leads to send.");

  const joke = await generateAIJoke();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
  });

  let emailBody = `
  <h1 style="color:#4A90E2;">🚀 Traba Lead Report</h1>
  <p><strong>🎭 Good morning! </strong> ${joke}</p>
  <p>🔍 <strong>Top 10 leads from the past 24 hours:</strong></p>
  <ul style="list-style-type: none; padding: 0;">`;

  leadPosts.forEach(lead => {
    // Determine emoji-based strength indicator
    let strengthIndicator = lead.lead_strength >= 80 ? "🟢 Excellent" : 
                            lead.lead_strength >= 50 ? "🟡 Moderate" : "🔴 Weak";
    
    emailBody += `
      <li style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <p><strong>🎯 Lead Strength:</strong> ${lead.lead_strength}% (${strengthIndicator})</p>
        <p><strong>📌 Subreddit:</strong> r/${lead.subreddit}</p>
        <p><strong>📝 Title:</strong> ${lead.title}</p>
        <p><strong>🔗 Link:</strong> <a href="https://www.reddit.com${lead.permalink}" target="_blank">View Post</a></p>
        <p><strong>💡 Why it matters:</strong> ${lead.explanation}</p>
      </li>`;
  });

  emailBody += `
    </ul>
    <p style="color:#4A90E2; font-size: 16px;">✨ Let’s close some deals!</p>
    <p>🤖 Sincerely, Your Friendly Traba Bot</p>`;

  await transporter.sendMail({
    from: `"Traba Sales Bot" <${process.env.GMAIL_USER}>`,
    to: process.env.RECIPIENT_LIST.split(',').map(r => r.trim()),
    subject: `Traba Potential Leads: ${new Date().toDateString()}`,
    html: emailBody
  });

  console.log("✅ Lead email sent.");
}

// ----------------------------------
// Run the Script
// ----------------------------------
export async function run() {
  try {
    const accessToken = await getRedditAccessToken();
    const rawPosts = [];

    console.log(`✨ Collecting data from ${TARGET_SUBREDDITS.length} subreddit communities.`)

    for (const subreddit of TARGET_SUBREDDITS) {
      await sleep(SLEEP_BETWEEN_REQUESTS_MS);
      const posts = await searchReddit(accessToken, subreddit);

      console.log(`🎯 Scoring ${posts.length} data points from r/${subreddit}.`)

      for (const postContainer of posts) {
        const post = postContainer.data;
        if (!seen_posts.has(post.id)) {
          seen_posts.add(post.id);
          rawPosts.push({
            id: post.id,
            subreddit: post.subreddit,
            title: post.title,
            selftext: post.selftext || '',
            permalink: post.permalink
          });
        }
      }
    }

    console.log(`🤖 Filtered ${rawPosts.length} unique posts by relevance.`);

    const scoredLeads = await Promise.all(rawPosts.map(async lead => ({
      ...lead,
      ...(await evaluatePostWithOpenAI(lead.title, lead.selftext)) // Now returns { lead_strength, explanation }
    })));

    console.log(`📝 Found ${scoredLeads.length} new potential leads!`)
    
    const finalLeads = scoredLeads
      .sort((a, b) => b.lead_strength - a.lead_strength) // Sort by lead_strength (0-100)
      .slice(0, MAX_LEADS);

    await sendLeadEmail(finalLeads);
  } catch (err) {
    console.error("Error in script:", err);
  }
}
