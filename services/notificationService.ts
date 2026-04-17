
export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
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

    // Use service worker for notifications if available (better PWA support)
    const registration = await navigator.serviceWorker.getRegistration();

    const defaultOptions: any = {
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      ...options
    };

    if (registration && 'showNotification' in registration) {
      console.log('📲 Showing notification via ServiceWorker');
      return (registration as any).showNotification(title, defaultOptions).catch((err: any) => {
        console.error('❌ SW Notification Failed:', err);
        return new Notification(title, defaultOptions);
      });
    } else {
      console.log('💻 Showing notification via Window API');
      try {
        const notification = new Notification(title, defaultOptions);
        notification.onerror = (err) => console.error('❌ Notification display error:', err);
        return notification;
      } catch (err) {
        console.error('❌ Window Notification Failed:', err);
      }
    }
  }

  public async test() {
    return this.show('🔔 Test Notification', {
      body: 'If you can see this, notifications are working correctly!',
      tag: 'test-notification'
    });
  }

  public hasPermission(): boolean {
    return this.permission === 'granted';
  }
}

export const notificationService = NotificationService.getInstance();
