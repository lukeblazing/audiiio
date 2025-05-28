// notifyUsersAboutEvent.js

import db from '../database/db.js';
import webpush from 'web-push';

export async function notifyUsersAboutEvent(event, user) {
  try {
    const subsResult = await db.query('SELECT user_email, subscription FROM push_subscriptions');
    const subscriptions = subsResult.rows;
    const eventDate = new Date(event.start);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
    const notificationPayload = JSON.stringify({
      title: `${user.name}`,
      body: `${event.title} on ${formattedDate}`,
    });
    for (const { user_email, subscription } of subscriptions) {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
      } catch (error) {
        console.warn(`Failed to send notification to ${user_email}:`, error.message);
      }
    }
  } catch (notifyError) {
    console.error("Failed to notify users about new event:", notifyError);
  }
}
