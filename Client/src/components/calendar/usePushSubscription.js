// src/hooks/usePushSubscription.js
import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array(rawData.split('').map(char => char.charCodeAt(0)));
}

async function getCurrentSubscription() {
  if (!('serviceWorker' in navigator && 'PushManager' in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function subscribeUser(registration) {
  let subscription = await registration.pushManager.getSubscription();
  
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
  
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/subscribe`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });

  return subscription;
}

async function unsubscribeUser(registration) {
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/unsubscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check current subscription on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const subscription = await getCurrentSubscription();
      if (isMounted) setIsSubscribed(!!subscription && Notification.permission === 'granted');
    })();
    return () => { isMounted = false; }
  }, []);

  // Enable notifications (subscribe)
  const enablePushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      console.warn("Push messaging is not supported in this browser.");
      return false;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      if (Notification.permission === 'granted') {
        await subscribeUser(registration);
        setIsSubscribed(true);
        return true;
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeUser(registration);
          setIsSubscribed(true);
          return true;
        }
      }
      // If denied or not granted
      setIsSubscribed(false);
      return false;
    } catch (error) {
      console.error("Error during push subscription process:", error);
      setIsSubscribed(false);
      return false;
    }
  }, []);

  // Disable notifications (unsubscribe)
  const disablePushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      setIsSubscribed(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      await unsubscribeUser(registration);
      setIsSubscribed(false);
    } catch (error) {
      console.error("Error during push unsubscription process:", error);
      setIsSubscribed(false);
    }
  }, []);

  return { isSubscribed, enablePushSubscription, disablePushSubscription };
}

export default usePushSubscription;
