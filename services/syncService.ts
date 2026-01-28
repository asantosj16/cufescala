/**
 * Serviço de Sincronização de Dados entre Dispositivos
 * Implementa:
 * 1. Storage Events para sincronização entre abas do navegador
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
  private lastSyncTimestamps: Record<string, number | string> = {};
  private pollInterval: NodeJS.Timeout | null = null;
  private lastProcessedKeys: Set<string> = new Set();

  constructor() {
    // Gera um ID único para este dispositivo
    this.deviceId = this.getOrCreateDeviceId();
    console.log('📱 Inicializando SyncService com deviceId:', this.deviceId);
    
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
      console.log('✨ Novo deviceId criado:', deviceId);
    }
    return deviceId;
  }

  /**
   * Inicializa o BroadcastChannel para comunicação entre abas/contextos
   * BroadcastChannel funciona apenas entre contextos do mesmo navegador/origin
   */
  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('⚠️ BroadcastChannel não suportado neste navegador');
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel('cufescala-sync');
      this.broadcastChannel.onmessage = (event) => {
        const data: SyncData = event.data;
        
        // Ignora mensagens do próprio dispositivo
        if (data.deviceId !== this.deviceId) {
          console.log('📡 BroadcastChannel: Mensagem recebida de outro contexto:', data);
          this.notifyCallbacks(data);
        }
      };
      console.log('✅ BroadcastChannel inicializado com sucesso');
    } catch (e) {
      console.warn('⚠️ Erro ao inicializar BroadcastChannel:', e);
      this.broadcastChannel = null;
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
      if (!key || !key.startsWith('cuf-') || key.endsWith('__metadata') || key.endsWith('__hash')) return;

      console.log('💾 Storage Event detectado:', key, '- novo valor:', event.newValue ? '✓' : '✗');

      const syncData: SyncData = {
        timestamp: Date.now(),
        deviceId: this.deviceId,
      };

      // Mapeia a chave do localStorage para os dados do sync
      try {
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
      } catch (e) {
        console.error('❌ Erro ao processar Storage Event:', e);
      }
    });
    console.log('✅ Storage Event listener inicializado');
  }

  /**
   * Inicia polling para verificar mudanças no localStorage
   * Útil para detectar mudanças feitas por outras abas/dispositivos mesmo sem events
   */
  private startPolling(): void {
    console.log('🔍 Iniciando polling de sincronização (intervalo: 1s)...');
    
    // Faz uma verificação inicial imediatamente
    this.checkForChanges();
    
    // Polling a cada 1 segundo
    this.pollInterval = setInterval(() => {
      this.checkForChanges();
    }, 1000);
  }

  /**
   * Verifica se há mudanças no localStorage desde a última sincronização
   */
  private checkForChanges(): void {
    const keys = ['cuf-overrides-v3', 'cuf-holidays-v3', 'cuf-roster-configs'];
    let changesDetected = false;
    
    keys.forEach(key => {
      try {
        const currentValue = localStorage.getItem(key);
        const currentHash = this.hashString(currentValue || '');
        const lastKnownHash = this.lastSyncTimestamps[`${key}__hash`] as string | undefined;
        const lastTimestamp = (this.lastSyncTimestamps[key] as number) || 0;
        const modificationTime = this.getLocalStorageModificationTime(key);

        // Verifica se o hash mudou
        const hasValueChanged = lastKnownHash !== currentHash;
        const hasTimestampChanged = modificationTime > lastTimestamp;

        if (hasValueChanged || hasTimestampChanged) {
          changesDetected = true;
          console.log(`🔄 [POLLING] Mudança detectada em ${key}`);
          console.log(`   - Hash: ${lastKnownHash || 'inicial'} → ${currentHash}`);
          console.log(`   - Timestamp: ${lastTimestamp} → ${modificationTime}`);
          
          const syncData: SyncData = {
            timestamp: modificationTime || Date.now(),
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
          this.lastSyncTimestamps[key] = modificationTime || Date.now();
          this.lastSyncTimestamps[`${key}__hash`] = currentHash;
        }
      } catch (e) {
        console.error(`❌ Erro ao verificar mudanças em ${key}:`, e);
      }
    });
    
    if (!changesDetected) {
      // Não loga "nenhuma mudança" para reduzir ruído nos logs
    }
  }

  /**
   * Gera um hash simples de uma string para detectar mudanças rapidamente
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Obtém o timestamp de modificação de uma chave localStorage
   */
  private getLocalStorageModificationTime(key: string): number {
    try {
      const metadata = localStorage.getItem(`${key}__metadata`);
      if (metadata) {
        const parsed = JSON.parse(metadata);
        return parsed.lastModified || 0;
      }
    } catch (e) {
      // Silenciosamente ignorar erros de metadata
    }
    return 0;
  }

  /**
   * Registra um callback para ser notificado sobre sincronizações
   */
  public onSync(callback: SyncCallback): () => void {
    console.log('📝 Novo callback de sincronização registrado');
    this.callbacks.push(callback);
    
    // Retorna função para desregistrar
    return () => {
      console.log('🗑️ Callback de sincronização removido');
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica todos os callbacks sobre uma mudança sincronizada
   */
  private notifyCallbacks(data: SyncData): void {
    if (this.callbacks.length === 0) {
      console.warn('⚠️ Sincronização detectada mas NÃO HÁ CALLBACKS registrados!');
      return;
    }

    console.log(`📢 Notificando ${this.callbacks.length} callback(s) sobre sincronização`);
    
    this.callbacks.forEach((callback, index) => {
      try {
        console.log(`  [${index + 1}] Chamando callback...`);
        callback(data);
        console.log(`  [${index + 1}] ✅ Callback executado`);
      } catch (e) {
        console.error(`  [${index + 1}] ❌ Erro ao executar callback:`, e);
      }
    });
    
    // Atualiza os timestamps e hashes
    if (data.overrides !== undefined) {
      this.lastSyncTimestamps['cuf-overrides-v3'] = data.timestamp;
      this.lastSyncTimestamps['cuf-overrides-v3__hash'] = this.hashString(JSON.stringify(data.overrides));
    }
    if (data.holidays !== undefined) {
      this.lastSyncTimestamps['cuf-holidays-v3'] = data.timestamp;
      this.lastSyncTimestamps['cuf-holidays-v3__hash'] = this.hashString(JSON.stringify(data.holidays));
    }
    if (data.configs !== undefined) {
      this.lastSyncTimestamps['cuf-roster-configs'] = data.timestamp;
      this.lastSyncTimestamps['cuf-roster-configs__hash'] = this.hashString(JSON.stringify(data.configs));
    }
  }

  /**
   * Publica uma mudança para ser sincronizada com outros dispositivos
   */
  public publishSync(data: SyncData): void {
    const syncData: SyncData = {
      ...data,
      timestamp: Date.now(),
      deviceId: this.deviceId,
    };

    console.log('📤 publishSync() chamado com:');
    console.log('   - overrides:', !!syncData.overrides);
    console.log('   - holidays:', !!syncData.holidays);
    console.log('   - configs:', !!syncData.configs);

    // Notifica os callbacks locais (importante!)
    this.notifyCallbacks(syncData);

    // Atualiza timestamps
    if (data.overrides !== undefined) {
      this.lastSyncTimestamps['cuf-overrides-v3'] = syncData.timestamp;
    }
    if (data.holidays !== undefined) {
      this.lastSyncTimestamps['cuf-holidays-v3'] = syncData.timestamp;
    }
    if (data.configs !== undefined) {
      this.lastSyncTimestamps['cuf-roster-configs'] = syncData.timestamp;
    }

    // Broadcast para outros contextos/abas via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(syncData);
        console.log('✅ Mensagem enviada via BroadcastChannel');
      } catch (e) {
        console.warn('⚠️ Erro ao enviar via BroadcastChannel:', e);
      }
    } else {
      console.warn('⚠️ BroadcastChannel não disponível, usando fallback (polling)');
    }
  }

  /**
   * Para o polling quando o serviço não é mais necessário
   */
  public destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      console.log('🛑 Polling parado');
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      console.log('🛑 BroadcastChannel fechado');
    }
  }

  /**
   * Força uma sincronização manual
   */
  public forceSync(): void {
    console.log('🔄 Sincronização manual forçada!');
    this.checkForChanges();
  }

  /**
   * Retorna o ID do dispositivo
   */
  public getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Expõe o método startPolling publicamente
   */
  public startSyncCheck(): void {
    this.forceSync();
  }
}

export const syncService = new SyncService();
