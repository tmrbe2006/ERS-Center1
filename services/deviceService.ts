import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '../types';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export interface DeviceRecord {
  deviceId: string;
  userId: string;
  userName: string;
  userRole: string;
  department?: string;
  fcmToken: string;
  platform: 'android' | 'ios' | 'web';
  deviceModel?: string;
  osVersion?: string;
  appVersion: string;
  notificationsEnabled: boolean;
  registeredAt: number;
  lastSeen: number;
  isActive: boolean;
}

// Generate or retrieve persistent local device ID
export const getLocalDeviceId = async (): Promise<string> => {
  let deviceId = localStorage.getItem('ers_device_id');
  if (!deviceId) {
    if (Capacitor.isNativePlatform()) {
      try {
        const idInfo = await Device.getId();
        deviceId = idInfo.identifier || `android_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      } catch (e) {
        deviceId = `native_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
    } else {
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    localStorage.setItem('ers_device_id', deviceId);
  }
  return deviceId;
};

// Register or update device token in Firestore
export const registerDeviceToken = async (
  user: User,
  token: string,
  notificationsEnabled: boolean = true
): Promise<DeviceRecord | null> => {
  if (!token || !user?.id) return null;

  try {
    const deviceId = await getLocalDeviceId();
    let platform: 'android' | 'ios' | 'web' = 'web';
    let deviceModel = 'Web Browser';
    let osVersion = navigator.userAgent;

    if (Capacitor.isNativePlatform()) {
      const capPlatform = Capacitor.getPlatform();
      platform = capPlatform === 'android' ? 'android' : capPlatform === 'ios' ? 'ios' : 'web';
      try {
        const info = await Device.getInfo();
        deviceModel = `${info.manufacturer || ''} ${info.model || ''}`.trim();
        osVersion = `${info.operatingSystem} ${info.osVersion}`;
      } catch (err) {
        console.warn('Could not read native device info:', err);
      }
    }

    const deviceDocRef = doc(db, 'user_devices', `${user.id}_${deviceId}`);
    const record: DeviceRecord = {
      deviceId,
      userId: user.id,
      userName: user.name || user.username,
      userRole: user.role,
      department: user.department || 'عام',
      fcmToken: token,
      platform,
      deviceModel,
      osVersion,
      appVersion: '1.0.0',
      notificationsEnabled,
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      isActive: true,
    };

    await setDoc(deviceDocRef, {
      ...record,
      serverUpdatedAt: serverTimestamp()
    }, { merge: true });

    // Store active token in localStorage for instant offline access
    localStorage.setItem('ers_fcm_token', token);
    return record;
  } catch (error) {
    console.error('Failed to register device in Firestore:', error);
    return null;
  }
};

// De-register device on logout so this device stops receiving user's alerts
export const unregisterDeviceOnLogout = async (userId: string): Promise<void> => {
  try {
    const deviceId = await getLocalDeviceId();
    const deviceDocRef = doc(db, 'user_devices', `${userId}_${deviceId}`);
    
    // Check if doc exists before updating
    const snap = await getDoc(deviceDocRef);
    if (snap.exists()) {
      await updateDoc(deviceDocRef, {
        isActive: false,
        fcmToken: '',
        unregisteredAt: Date.now(),
        serverUpdatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.warn('Failed to unregister device on logout:', error);
  }
};
