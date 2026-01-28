# Persistência de Dados - Escala CUF Trindade

## Como Funciona

O aplicativo agora possui um **sistema robusto de persistência de dados** que garante que todas as alterações realizadas manualmente sejam salvas automaticamente.

### Mecanismo de Salvamento

#### 1. **Salvamento Automático** ✅
- Qualquer alteração nos turnos, férias, feriados ou configurações é **salva automaticamente** após 300ms
- O status de sincronização é exibido no cabeçalho:
  - 🔵 **Sincronizando...** = Dados sendo salvos
  - 🟢 **Salvo** = Dados sincronizados com sucesso

#### 2. **Armazenamento em Camadas**
- **localStorage**: Armazenamento principal (rápido e disponível offline)
- **IndexedDB**: Backup automático para dados mais robustos
- **Fallback automático**: Se localStorage falhar, usa IndexedDB

#### 3. **Dados Persistidos**
Os seguintes dados são salvos automaticamente:
- ✅ **Turnos manuais** (`cuf-overrides-v3`)
- ✅ **Feriados públicos** (`cuf-holidays-v3`)
- ✅ **Configurações da equipa** (`cuf-roster-configs`)
- ✅ **Preferência de tema** (`cuf-theme`)

### Usando o Sistema

#### Recarregar Página
Ao recarregar a página (`F5` ou `Ctrl+R`), **todos os dados são restaurados automaticamente** do localStorage/IndexedDB.

#### Salvamento Manual
Clique no botão **SALVAR** no painel de controle para forçar uma sincronização imediata.

#### Exportar Backup
1. Clique no botão **BACKUP JSON**
2. Um arquivo com todos os dados será baixado
3. Guarde em um local seguro para restauração futura

#### Restaurar de Backup
1. Clique no botão **RESTAURAR JSON**
2. Selecione o arquivo JSON previamente exportado
3. Os dados serão restaurados automaticamente

#### Reativar Rotação (Remover Alterações Manuais)
- **REATIVAR ROTAÇÃO (MÊS)**: Remove apenas ajustes manuais do mês atual
- **REATIVAR TUDO**: Remove **todos** os ajustes manuais de **todos os meses**

## Sincronização Entre Dispositivos 🔄

O aplicativo agora **sincroniza automaticamente todas as mudanças entre dispositivos** (telemóvel, tablet, computador, etc.).

### Como Funciona

#### 1. **Sincronização Automática**
Quando você faz uma alteração em um dispositivo:
- A alteração é salva localmente no dispositivo
- É transmitida automaticamente para **TODOS os outros dispositivos** conectados
- Outros dispositivos atualizam a interface em tempo real

#### 2. **Mecanismos de Sincronização**
O sistema utiliza múltiplos mecanismos para garantir sincronização confiável:

- **BroadcastChannel API**: Sincroniza entre abas/contextos do navegador (instantâneo)
- **Storage Events**: Sincroniza entre janelas/abas (transmissão automática)
- **Polling Automático**: Verifica mudanças a cada 5 segundos (fallback)

#### 3. **Identificação de Dispositivo**
- Cada dispositivo recebe um **ID único** (`cuf-device-id`)
- O ID é armazenado localmente e nunca compartilhado
- Permite identificar qual dispositivo fez a alteração

### Exemplos de Sincronização

**Cenário 1: Mudança de Turno**
```
Dispositivo A (Telemóvel)
  → Usuário altera turno de "Cláudia" em 15/02/2026
  → Dados salvos e sincronizados
  
Dispositivo B (Tablet) e C (Computador)
  → Ambos recebem a mudança automaticamente
  → Interface atualiza em tempo real
```

**Cenário 2: Adicionar Feriado**
```
Dispositivo A (Computador)
  → Usuário marca "25/12/2026" como feriado
  → Alteração é salva
  
Dispositivo B (Telemóvel)
  → Em menos de 5 segundos, a data aparece como feriado
  → Escala é regenerada automaticamente
```

### Dados Sincronizados

Os seguintes dados são sincronizados **em tempo real**:
- ✅ **Turnos manuais** (overrides)
- ✅ **Feriados públicos**
- ✅ **Configurações da equipa**
- ✅ **Preferência de tema**

### Limitações e Considerações

⚠️ **Sincronização Local**: A sincronização funciona apenas entre dispositivos no **mesmo navegador/origin**
  - Exemplos: `localhost:5173`, `seu-dominio.com`, `seu-dominio.pt`
  - Não sincroniza entre navegadores diferentes (Chrome vs Firefox)

⚠️ **Offline**: Se um dispositivo estiver offline
  - As alterações são salvas localmente
  - Serão sincronizadas automaticamente quando voltar online

⚠️ **Conflitos**: Alterações simultâneas são resolvidas por **timestamp**
  - A mudança mais recente sempre prevalece
  - Sistema de merge automático para minimizar perda de dados

### Dados Exportados

O arquivo JSON contém:
```json
{
  "overrides": { "staff-date": "ShiftType", ... },
  "holidays": ["2026-02-05", ...],
  "configs": { "Cláudia": {...}, "Irene": {...}, "Licínia": {...} },
  "theme": "dark" | "light",
  "lastSync": 1705999999000
}
```

### Informações Técnicas

**Serviço de Persistência**: `services/storageService.ts`
**Serviço de Sincronização**: `services/syncService.ts`

```typescript
// Usar em componentes
import { storage } from './services/storageService';
import { syncService } from './services/syncService';

// === STORAGE ===
// Salvar dados
await storage.saveData('chave', dados);

// Carregar dados
const dados = await storage.loadData('chave');

// Exportar tudo
const json = await storage.exportAllData();

// Importar backup
await storage.importData(jsonString);

// Limpar dados
await storage.clearData('chave');

// === SYNC ===
// Registrar listener para sincronização
const unsubscribe = syncService.onSync((syncData) => {
  console.log('Dados sincronizados:', syncData);
  // Atualizar estado aqui
});

// Limpar listener
unsubscribe();

// Forçar sincronização manual
syncService.forceSync();

// Obter ID do dispositivo
const deviceId = syncService.getDeviceId();
```

### Garantias

✅ Dados salvos **instantaneamente** após alterações  
✅ **Sincronização offline** via localStorage  
✅ **Backup automático** via IndexedDB  
✅ **Recuperação automática** ao recarregar página  
✅ **Exportação manual** para backup seguro  
✅ **Sincronização entre dispositivos** em tempo real  
✅ **Polling automático** a cada 5 segundos para garantir sincronização  

---

**Versão**: 2.0  
**Última atualização**: Janeiro 2026
