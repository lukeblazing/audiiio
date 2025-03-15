// src/hooks/usePushSubscription.js
import { useCallback } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array(rawData.split('').map(char => char.charCodeAt(0)));
}

async function subscribeUser(registration) {
  console.log("MADE IT zero");
  let subscription = await registration.pushManager.getSubscription();
  console.log("MADE IT one", subscription);
  
  if (!subscription) {
    const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error("VAPID public key is not defined in the environment.");
    }
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  }
  
  console.log("MADE IT HERE", subscription);
  
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/subscribe`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscription }),
  });
  
  const data = await response.json();
  console.log('Push subscription saved:', data);
}

async function unsubscribeUser(registration) {
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/unsubscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('User unsubscribed and subscription record removed.');
  }
}

function usePushSubscription() {
  // This function must be called from a user-generated event handler.
  const enablePushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      console.warn("Push messaging is not supported in this browser.");
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (Notification.permission === 'granted') {
        await subscribeUser(registration);
      } else if (Notification.permission === 'default') {
        // Request permission from a user gesture
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeUser(registration);
        } else if (permission === 'denied') {
          await unsubscribeUser(registration);
          console.log('Notification permission denied. Unsubscribing...');
        }
      } else if (Notification.permission === 'denied') {
        await unsubscribeUser(registration);
        console.log('Notification permission has been denied.');
      }
    } catch (error) {
      console.error("Error during push subscription process:", error);
    }
  }, []);

  return { enablePushSubscription };
}

export default usePushSubscription;
