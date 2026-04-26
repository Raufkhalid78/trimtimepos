import { logger } from './logger';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';
  // Lazy-initialized so we don't fire a network request on app start
  private audio: HTMLAudioElement | null = null;

  private constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /** Lazy-load the notification sound only on first use */
  private getAudio(): HTMLAudioElement {
    if (!this.audio) {
      // Hosted locally in /public/sounds/ — no external dependency
      this.audio = new Audio('/sounds/notification.mp3');
      this.audio.preload = 'none';
    }
    return this.audio;
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  public refreshPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public async show(title: string, options?: NotificationOptions) {
    if (this.permission !== 'granted') return;

    const registration = await navigator.serviceWorker.getRegistration().catch(() => null);

    const defaultOptions: NotificationOptions & { vibrate?: number[]; badge?: string } = {
      icon: '/icon.svg',
      badge: '/icon.svg',
      ...options,
    };

    // Play sound lazily — only allocate the Audio element now
    this.getAudio().play().catch(e => logger.warn('Sound play blocked by browser:', e));

    const useSW =
      registration != null &&
      'showNotification' in registration &&
      document.visibilityState !== 'visible';

    if (useSW) {
      logger.log('Showing notification via ServiceWorker (Background Mode)');
      return (registration as ServiceWorkerRegistration).showNotification(title, defaultOptions).catch(() => {
        return new Notification(title, defaultOptions);
      });
    } else {
      logger.log('Showing notification via Window API (Foreground Mode)');
      try {
        const notification = new Notification(title, defaultOptions);
        notification.onerror = (err) => logger.error('Notification display error:', err);
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        return notification;
      } catch (err) {
        logger.error('Window Notification Failed:', err);
      }
    }
  }

  public async test() {
    return this.show('🔔 Test Notification', {
      body: 'If you can see this, notifications are working correctly!',
      tag: 'test-notification',
    });
  }

  public hasPermission(): boolean {
    return this.permission === 'granted';
  }
}

export const notificationService = NotificationService.getInstance();
