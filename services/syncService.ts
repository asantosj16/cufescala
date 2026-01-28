/**
 * Serviço de Sincronização de Dados entre Dispositivos
 * Implementa:
 * 1. Storage Events para sincronização entre abas do mesmo navegador
 * 2. BroadcastChannel API para sincronização entre contextos do navegador
 * 3. Fallback para polling com timestamp para garantir sincronização
 */

import { CustomOverrides, StaffConfig, StaffName } from '../types';

export interface SyncData {
  overrides?: CustomOverrides;
  holidays?: string[];
  configs?: Record<StaffName, StaffConfig>;
  theme?: string;
  timestamp: number;
  deviceId: string;
}

type SyncCallback = (data: SyncData) => void;

class SyncService {
  private callbacks: SyncCallback[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private deviceId: string;
  private lastSyncTimestamps: Record<string, number> = {};
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Gera um ID único para este dispositivo
    this.deviceId = this.getOrCreateDeviceId();
    this.initBroadcastChannel();
    this.initStorageEventListener();
    this.startPolling();
  }

  /**
   * Obtém ou cria um ID único para o dispositivo
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('cuf-device-id');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cuf-device-id', deviceId);
    }
    return deviceId;
  }

  /**
   * Inicializa o BroadcastChannel para comunicação entre abas/contextos
   * BroadcastChannel funciona apenas entre contextos do mesmo navegador/origin
   */
  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel não suportado neste navegador');
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel('cufescala-sync');
      this.broadcastChannel.onmessage = (event) => {
        const data: SyncData = event.data;
        
        // Ignora mensagens do próprio dispositivo
        if (data.deviceId !== this.deviceId) {
          console.log('Sincronização recebida de outro contexto:', data);
          this.notifyCallbacks(data);
        }
      };
      console.log('BroadcastChannel inicializado');
    } catch (e) {
      console.warn('Erro ao inicializar BroadcastChannel:', e);
    }
  }

  /**
   * Inicializa listener para storage events (sincroniza entre abas)
   */
  private initStorageEventListener(): void {
    window.addEventListener('storage', (event) => {
      // Storage events são disparados apenas em OUTRAS abas/janelas
      // Não dispara na aba que fez a alteração
      if (event.storageArea !== localStorage) return;

      const key = event.key;
      if (!key || !key.startsWith('cuf-')) return;

      console.log('Storage event detectado:', key);

      const syncData: SyncData = {
        timestamp: Date.now(),
        deviceId: this.deviceId,
      };

      // Mapeia a chave do localStorage para os dados do sync
      if (key === 'cuf-overrides-v3') {
        syncData.overrides = event.newValue ? JSON.parse(event.newValue) : {};
      } else if (key === 'cuf-holidays-v3') {
        syncData.holidays = event.newValue ? JSON.parse(event.newValue) : [];
      } else if (key === 'cuf-roster-configs') {
        syncData.configs = event.newValue ? JSON.parse(event.newValue) : {};
      } else if (key === 'cuf-theme') {
        syncData.theme = event.newValue || 'light';
      }

      this.notifyCallbacks(syncData);
    });
  }

  /**
   * Inicia polling para verificar mudanças no localStorage
   * Útil para detectar mudanças feitas por outras abas/dispositivos mesmo sem events
   */
  private startPolling(): void {
    // Polling a cada 5 segundos para sincronizar dados
    this.pollInterval = setInterval(() => {
      this.checkForChanges();
    }, 5000);
  }

  /**
   * Verifica se há mudanças no localStorage desde a última sincronização
   */
  private checkForChanges(): void {
    const keys = ['cuf-overrides-v3', 'cuf-holidays-v3', 'cuf-roster-configs'];
    
    keys.forEach(key => {
      const currentValue = localStorage.getItem(key);
      const lastTimestamp = this.lastSyncTimestamps[key] || 0;
      const modificationTime = this.getLocalStorageModificationTime(key);

      // Se foi modificado após a última sincronização conhecida
      if (modificationTime > lastTimestamp) {
        console.log(`Mudança detectada via polling: ${key}`);
        
        const syncData: SyncData = {
          timestamp: modificationTime,
          deviceId: this.deviceId,
        };

        if (key === 'cuf-overrides-v3') {
          syncData.overrides = currentValue ? JSON.parse(currentValue) : {};
        } else if (key === 'cuf-holidays-v3') {
          syncData.holidays = currentValue ? JSON.parse(currentValue) : [];
        } else if (key === 'cuf-roster-configs') {
          syncData.configs = currentValue ? JSON.parse(currentValue) : {};
        }

        this.notifyCallbacks(syncData);
        this.lastSyncTimestamps[key] = modificationTime;
      }
    });
  }

  /**
   * Obtém o timestamp de modificação de uma chave localStorage
   * Usa um sistema de metadata para rastrear
   */
  private getLocalStorageModificationTime(key: string): number {
    try {
      const metadata = localStorage.getItem(`${key}__metadata`);
      if (metadata) {
        const parsed = JSON.parse(metadata);
        return parsed.lastModified || 0;
      }
    } catch (e) {
      console.warn('Erro ao ler metadata:', e);
    }
    return 0;
  }

  /**
   * Registra um callback para ser notificado sobre sincronizações
   */
  public onSync(callback: SyncCallback): () => void {
    this.callbacks.push(callback);
    
    // Retorna função para desregistrar
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica todos os callbacks sobre uma mudança sincronizada
   */
  private notifyCallbacks(data: SyncData): void {
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error('Erro ao executar callback de sincronização:', e);
      }
    });
  }

  /**
   * Publica uma mudança para ser sincronizada com outros dispositivos
   */
  public publishSync(data: SyncData): void {
    // Adiciona ID do dispositivo e timestamp
    const syncData: SyncData = {
      ...data,
      timestamp: Date.now(),
      deviceId: this.deviceId,
    };

    // Atualiza timestamp de última sincronização
    if (data.overrides !== undefined) {
      this.lastSyncTimestamps['cuf-overrides-v3'] = syncData.timestamp;
    }
    if (data.holidays !== undefined) {
      this.lastSyncTimestamps['cuf-holidays-v3'] = syncData.timestamp;
    }
    if (data.configs !== undefined) {
      this.lastSyncTimestamps['cuf-roster-configs'] = syncData.timestamp;
    }

    // Broadcast para outros contextos/abas
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(syncData);
      } catch (e) {
        console.warn('Erro ao enviar via BroadcastChannel:', e);
      }
    }
  }

  /**
   * Para o polling quando o serviço não é mais necessário
   */
  public destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }

  /**
   * Força uma sincronização manual
   */
  public forceSync(): void {
    console.log('Sincronização manual forçada');
    this.checkForChanges();
  }

  /**
   * Retorna o ID do dispositivo
   */
  public getDeviceId(): string {
    return this.deviceId;
  }
}

export const syncService = new SyncService();
