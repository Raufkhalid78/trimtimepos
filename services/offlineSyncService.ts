import { openDB, IDBPDatabase } from 'idb';
import { OfflineQueueItem } from '../types';
import { supabase } from '../supabaseClient';
import { logger } from './logger';

const DB_NAME = 'TrimTimeOfflineDB';
const STORE_NAME = 'offline_queue';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineSyncService = {
  async enqueueAction(type: OfflineQueueItem['type'], payload: any): Promise<OfflineQueueItem> {
    const db = await getDB();
    const item: OfflineQueueItem = {
      id: Math.random().toString(36).substring(2, 9) + Date.now(),
      type,
      payload,
      createdAt: new Date().toISOString()
    };
    await db.put(STORE_NAME, item);
    logger.info(`Offline action queued: ${type}`, item.id);
    return item;
  },

  async getPendingQueue(): Promise<OfflineQueueItem[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async clearQueueItem(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  async syncQueue(): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) return { synced: 0, failed: 0 };
    const queue = await this.getPendingQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        if (item.type === 'sale') {
          const { error } = await supabase.from('sales').insert([item.payload]);
          if (error) throw error;
        } else if (item.type === 'expense') {
          const { error } = await supabase.from('expenses').insert([item.payload]);
          if (error) throw error;
        } else if (item.type === 'appointment') {
          const { error } = await supabase.from('appointments').insert([item.payload]);
          if (error) throw error;
        } else if (item.type === 'customer') {
          const { error } = await supabase.from('customers').insert([item.payload]);
          if (error) throw error;
        }
        await this.clearQueueItem(item.id);
        synced++;
      } catch (err) {
        logger.error(`Failed syncing offline item ${item.id}`, err);
        failed++;
      }
    }

    return { synced, failed };
  }
};
