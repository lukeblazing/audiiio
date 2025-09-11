import db from '../database/db.js';
import webpush from 'web-push';
import { generateDailyMorningPoem } from '../openai_api/openai_transcription.js';
import cron from 'node-cron';

// START ALL CRON JOBS
export function startCronJobs() {
    console.log('Starting cron jobs...');

    // 9:00 AM every day
    cron.schedule('0 9 * * *', () => {
        sendMorningMessage().catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });
}


export async function sendMorningMessage() {
    try {
        const subsResult = await db.query('SELECT user_email, subscription FROM push_subscriptions');
        const subscriptions = subsResult.rows;
        let poem = await generateDailyMorningPoem()
        for (const { user_email, subscription } of subscriptions) {

            if ((user_email == "lukeblazing@yahoo.com") || user_email == "chelsyjohnson1234@gmail.com") {
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
