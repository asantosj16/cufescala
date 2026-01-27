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

```typescript
// Usar em componentes
import { storage } from './services/storageService';

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
```

### Garantias

✅ Dados salvos **instantaneamente** após alterações  
✅ **Sincronização offline** via localStorage  
✅ **Backup automático** via IndexedDB  
✅ **Recuperação automática** ao recarregar página  
✅ **Exportação manual** para backup seguro  

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2026
