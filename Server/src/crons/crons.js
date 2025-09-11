import db from '../database/db.js';
import webpush from 'web-push';
import { generateDailyMorningPoem } from '../openai_api/openai_transcription.js';
import cron from 'node-cron';

// START ALL CRON JOBS
export function startCronJobs() {
    console.log('Starting cron jobs...');

    // 3:30–3:55 PM every 5 min
    cron.schedule('30-59/5 15 * * *', () => {
        sendMorningMessage().catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    // 4:00–4:30 PM every 5 min
    cron.schedule('0-30/5 16 * * *', () => {
        sendMorningMessage().catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    // Optional: also run once at startup
    sendMorningMessage().catch(err => console.error(err));
}


export async function sendMorningMessage() {
    try {
        const subsResult = await db.query('SELECT user_email, subscription FROM push_subscriptions');
        const subscriptions = subsResult.rows;
        let poem = await generateDailyMorningPoem()
        for (const { user_email, subscription } of subscriptions) {

            if (user_email == "lukeblazing@yahoo.com") {
                try {
                    let notificationPayload = JSON.stringify({
                        title: 'A Poem',
                        body: poem,
                    });

                    await webpush.sendNotification(subscription, notificationPayload);
                } catch (error) {
                    console.warn(`Failed to send notification to ${user_email}:`, error.message);
                }
            }
        }
    } catch (notifyError) {
        console.error("Failed to notify users about new event:", notifyError);
    }
}
