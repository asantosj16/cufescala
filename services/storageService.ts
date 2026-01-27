/**
 * Serviço de persistência de dados com suporte a localStorage e IndexedDB
 */

interface StorageData {
  overrides: Record<string, string>;
  holidays: string[];
  configs: Record<string, any>;
  theme: string;
  lastSync: number;
}

const DB_NAME = 'cufescala-db';
const DB_VERSION = 1;
const STORE_NAME = 'data';

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });

    return this.initPromise;
  }

  async saveData(key: string, data: any): Promise<void> {
    try {
      // Sempre salva no localStorage primeiro (mais rápido)
      localStorage.setItem(key, JSON.stringify(data));

      // Tenta salvar no IndexedDB como backup
      try {
        await this.initDB();
        if (this.db) {
          const transaction = this.db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          store.put(data, key);
        }
      } catch (e) {
        console.warn('IndexedDB não disponível, usando apenas localStorage', e);
      }
    } catch (e) {
      console.error('Erro ao salvar dados:', e);
      throw e;
    }
  }

  async loadData(key: string): Promise<any> {
    try {
      // Primeiro tenta localStorage (mais rápido)
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }

      // Se não estiver no localStorage, tenta IndexedDB
      try {
        await this.initDB();
        if (this.db) {
          return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
        }
      } catch (e) {
        console.warn('IndexedDB não disponível', e);
      }

      return null;
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      return null;
    }
  }

  async clearData(key?: string): Promise<void> {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        localStorage.clear();
      }

      // Limpa IndexedDB também
      try {
        await this.initDB();
        if (this.db) {
          const transaction = this.db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          if (key) {
            store.delete(key);
          } else {
            store.clear();
          }
        }
      } catch (e) {
        console.warn('Erro ao limpar IndexedDB', e);
      }
    } catch (e) {
      console.error('Erro ao limpar dados:', e);
    }
  }

  async exportAllData(): Promise<string> {
    try {
      const data: StorageData = {
        overrides: JSON.parse(localStorage.getItem('cuf-overrides-v3') || '{}'),
        holidays: JSON.parse(localStorage.getItem('cuf-holidays-v3') || '[]'),
        configs: JSON.parse(localStorage.getItem('cuf-roster-configs') || '{}'),
        theme: localStorage.getItem('cuf-theme') || 'light',
        lastSync: Date.now(),
      };
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error('Erro ao exportar dados:', e);
      throw e;
    }
  }

  async importData(jsonString: string): Promise<void> {
    try {
      const data: StorageData = JSON.parse(jsonString);
      
      await this.saveData('cuf-overrides-v3', data.overrides);
      await this.saveData('cuf-holidays-v3', data.holidays);
      await this.saveData('cuf-roster-configs', data.configs);
      await this.saveData('cuf-theme', data.theme);
    } catch (e) {
      console.error('Erro ao importar dados:', e);
      throw e;
    }
  }
}

export const storage = new StorageService();
