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

    cron.schedule('35 13 * * *', () => {
        sendCustomMessage("Hint #3", "A vanished path of fire and iron... became a ribbon for silent wheels. Here, alchemists of grain and bloom... pour amber light that never sets. What house is this?").catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    cron.schedule('45 13 * * *', () => {
        sendCustomMessage("Hint #4", "Blade skims glass, each stroke nearer the shore where feathered spheres fly on lined ground. What path links Parker's calm to the clash of paddles and balls?").catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    cron.schedule('0 14 * * *', () => {
        sendCustomMessage("Hint #5", "Across mirrored waters I glide back, then trade blade for wheels. Soon iron's ghostly ribbon guides me where hops and barley bloom. What is my route?").catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    cron.schedule('15 14 * * *', () => {
        sendCustomMessage("Hint #6", "In our haven, roots long gone cradle flame; sparks climb where once rings grew. What hollow heart in our yard warms the night we share and love?").catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    cron.schedule('30 14 * * *', () => {
        sendCustomMessage("Hint #7", "Glide glass to paddle's beat, chase feathered spheres, wheel the iron ghost to golden brews, then end where a stump-fire glows and bunnies, squirrels, chipmunks watch.").catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    cron.schedule('45 14 * * *', () => {
        sendCustomMessage("DATE NIGHT!", "By now you have hopefully figured out that tonight is date night!! :) I will be waiting for you outside the house at 5pm for some exercise and fun activities! I love you!").catch(err => console.error(err));
    }, { timezone: 'America/Chicago' });

    cron.schedule('0 15 * * *', () => {
        sendCustomMessage("Final Message", "P.S. -- wear waterproof shoes and bring tennis shoes and socks in a bag!").catch(err => console.error(err));
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
                        title: 'Good Morning',
                        body: poem,
                    });

                    await webpush.sendNotification(subscription, notificationPayload);
                } catch (error) {
                    console.warn(`Failed to send notification to ${user_email}:`, error.message);
                }
            }
        }
    } catch (notifyError) {
        console.error("Failed to notify users for Good Morning:", notifyError);
    }
}

export async function sendCustomMessage(title, body) {
    try {
        const subsResult = await db.query('SELECT user_email, subscription FROM push_subscriptions');
        const subscriptions = subsResult.rows;
        for (const { user_email, subscription } of subscriptions) {

            if ((user_email == "lukeblazing@yahoo.com") || user_email == "chelsyjohnson1234@gmail.com") {
                try {
                    let notificationPayload = JSON.stringify({
                        title: title,
                        body: body
                    });

                    await webpush.sendNotification(subscription, notificationPayload);
                } catch (error) {
                    console.warn(`Failed to send notification to ${user_email}:`, error.message);
                }
            }
        }
    } catch (notifyError) {
        console.error("Failed to notify users for custom message:", notifyError);
    }
}
