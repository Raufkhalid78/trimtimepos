
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
      return (registration as any).showNotification(title, defaultOptions);
    } else {
      return new Notification(title, defaultOptions);
    }
  }

  public hasPermission(): boolean {
    return this.permission === 'granted';
  }
}

export const notificationService = NotificationService.getInstance();
