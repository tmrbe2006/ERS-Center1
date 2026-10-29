const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered on Firestore when a new emergency is reported.
 * Sends native FCM push notifications to registered responder & admin devices.
 */
exports.sendEmergencyNotification = functions.firestore
  .document('emergencies/{emergencyId}')
  .onCreate(async (snap, context) => {
    const emergencyId = context.params.emergencyId;
    const emergency = snap.data();

    if (!emergency) {
      console.warn(`Emergency ${emergencyId} data is empty.`);
      return null;
    }

    // Deduplication check: verify if alert dispatch already recorded
    const dispatchLogRef = db.collection('notification_dispatch_logs').doc(emergencyId);
    const existingLog = await dispatchLogRef.get();
    if (existingLog.exists) {
      console.log(`Alert already dispatched for emergency: ${emergencyId}`);
      return null;
    }

    try {
      // 1. Query active registered devices for responders and admins
      const allowedRoles = ['responder', 'admin', 'super-admin'];
      const devicesSnapshot = await db.collection('user_devices')
        .where('isActive', '==', true)
        .where('notificationsEnabled', '==', true)
        .get();

      if (devicesSnapshot.empty) {
        console.log('No active devices registered for notification.');
        await dispatchLogRef.set({
          emergencyId,
          timestamp: Date.now(),
          totalRecipients: 0,
          successCount: 0,
          failureCount: 0,
          status: 'no_active_devices'
        });
        return null;
      }

      // Filter by role and collect valid tokens
      const eligibleTokens = [];
      const tokenToDocMap = new Map();

      devicesSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (allowedRoles.includes(data.userRole) && data.fcmToken) {
          eligibleTokens.push(data.fcmToken);
          tokenToDocMap.set(data.fcmToken, docSnap.ref);
        }
      });

      if (eligibleTokens.length === 0) {
        console.log('No eligible tokens found for roles:', allowedRoles);
        return null;
      }

      // Deduplicate tokens
      const uniqueTokens = Array.from(new Set(eligibleTokens));

      // 2. Prepare FCM payload with notification + high priority data
      // Lockscreen title & body are concise and non-sensitive
      const payload = {
        tokens: uniqueTokens,
        notification: {
          title: `🚨 إنذار طوارئ: ${emergency.typeName || 'حالة طارئة'}`,
          body: `الموقع: ${emergency.locationName || 'غير محدد'}. اضغط للاستجابة الفورية.`
        },
        data: {
          emergencyId: String(emergencyId),
          alertId: `${emergencyId}_${emergency.createdAt || Date.now()}`,
          typeName: String(emergency.typeName || 'طوارئ'),
          locationName: String(emergency.locationName || ''),
          locationId: String(emergency.locationId || ''),
          severity: String(emergency.severity || 'High'),
          url: `/#/alarm/${emergencyId}`,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: 'high',
          ttl: 14400, // 4 hours in seconds
          notification: {
            channelId: 'ers_emergency_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            visibility: 'public',
            icon: 'ic_stat_emergency'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert'
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true
            }
          }
        }
      };

      // 3. Send Multicast via Firebase Admin SDK
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`FCM Multicast accepted: ${response.successCount} success, ${response.failureCount} failure.`);

      // 4. Handle expired/invalid tokens
      const cleanupPromises = [];
      response.responses.forEach((res, idx) => {
        if (!res.success && res.error) {
          const errCode = res.error.code;
          const badToken = uniqueTokens[idx];
          const docRef = tokenToDocMap.get(badToken);

          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            console.log(`Deactivating obsolete FCM token: ${badToken}`);
            if (docRef) {
              cleanupPromises.push(
                docRef.update({
                  isActive: false,
                  fcmToken: '',
                  deactivatedReason: errCode,
                  updatedAt: Date.now()
                })
              );
            }
          }
        }
      });

      if (cleanupPromises.length > 0) {
        await Promise.all(cleanupPromises);
      }

      // 5. Log dispatch results (accepted by FCM)
      await dispatchLogRef.set({
        emergencyId,
        alertId: `${emergencyId}_${emergency.createdAt || Date.now()}`,
        timestamp: Date.now(),
        totalRecipients: uniqueTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
        acceptedByFCM: true,
        status: response.successCount > 0 ? 'sent' : 'failed'
      });

      return { success: true, count: response.successCount };
    } catch (error) {
      console.error('Fatal error during FCM dispatch:', error);
      await dispatchLogRef.set({
        emergencyId,
        timestamp: Date.now(),
        status: 'error',
        error: error.message
      });
      throw error;
    }
  });

/**
 * Callable function to test sending an FCM push notification directly to a specific device.
 * Used by Mobile Diagnostics screen to verify push functionality.
 */
exports.sendTestPushToDevice = functions.https.onCall(async (data, context) => {
  const { targetToken, userId } = data;
  if (!targetToken) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing targetToken');
  }

  const message = {
    token: targetToken,
    notification: {
      title: '🔔 اختبار نظام التنبيهات ERS',
      body: 'تم استلام إشعار الاختبار بنجاح على هذا الجهاز.'
    },
    data: {
      isTest: 'true',
      timestamp: String(Date.now()),
      alertId: `test_${Date.now()}`
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'ers_emergency_channel',
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true
      }
    }
  };

  try {
    const res = await admin.messaging().send(message);
    return { success: true, messageId: res };
  } catch (err) {
    console.error('Test push error:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});
