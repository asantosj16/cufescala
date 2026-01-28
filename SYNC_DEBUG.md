# 🔍 Debug da Sincronização

## 🆘 A sincronização não está funcionando?

Use este guia para debugar o problema.

## 📋 Checklist Rápido

Abra o DevTools (F12) e execute no Console:

```javascript
// 1. Verificar se syncService está carregado
console.log('syncService:', window.syncService);

// 2. Verificar device ID
console.log('Device ID:', window.syncService.getDeviceId());

// 3. Verificar localStorage
console.log('Overrides:', localStorage.getItem('cuf-overrides-v3'));
console.log('Metadata:', localStorage.getItem('cuf-overrides-v3__metadata'));

// 4. Forçar sincronização
window.syncService.forceSync();

// 5. Ver logs no console
// Procure por: "Mudança detectada via polling"
```

## 🔧 Testes de Diagnóstico

### Teste 1: localStorage está sendo salvo?

```javascript
// Abra em 2 abas
// Na Aba 1, execute:
localStorage.setItem('test-sync', 'valor123');

// Na Aba 2, execute:
localStorage.getItem('test-sync');
// Deve retornar: "valor123"
```

**Esperado**: localStorage é compartilhado entre abas ✅

### Teste 2: Metadata está sendo salvo?

```javascript
// Na Aba 1, execute:
localStorage.setItem('cuf-overrides-v3', JSON.stringify({test: true}));

// Na Aba 2, execute:
localStorage.getItem('cuf-overrides-v3__metadata');
// Deve retornar algo como: {"lastModified":1705999999000,"version":1}
```

**Esperado**: Metadata com timestamp foi criado ✅

### Teste 3: Storage events estão disparando?

```javascript
// Na Aba 1, execute:
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e.key, e.newValue);
});

// Na Aba 2, altere algo na escala
// Na Aba 1 console, deve aparecer:
// "Storage event: cuf-overrides-v3 ..."
```

**Esperado**: Storage events disparam ao mudar em outra aba ✅

### Teste 4: Polling está funcionando?

```javascript
// Execute em qualquer aba:
window.syncService.forceSync();

// Verifique o console para logs como:
// "Mudança de timestamp detectada via polling: cuf-overrides-v3"
// "Sincronização recebida: {overrides: {...}, ...}"
```

**Esperado**: Polling detecta mudanças ✅

### Teste 5: Callbacks estão sendo chamados?

```javascript
// Na Aba 1, registre um listener manual:
const unsubscribe = window.syncService.onSync((data) => {
  console.log('Callback chamado:', data);
});

// Na Aba 2, altere algo na escala
// Na Aba 1 console, deve aparecer:
// "Callback chamado: {overrides: {...}, timestamp: ..., deviceId: '...'}"
```

**Esperado**: Callback é chamado ao receber sincronização ✅

## 🐛 Problemas Comuns

### Problema 1: "syncService is undefined"

**Causa**: O serviço não foi carregado

**Solução**:
```javascript
// Verifique se o arquivo foi importado em index.tsx
// Procure por:
import { syncService } from './services/syncService';
(window as any).syncService = syncService;
```

**Ação**: Reconstrua a aplicação (`npm run build`)

### Problema 2: "Storage events não disparam"

**Causa**: BroadcastChannel não suportado ou Storage events configurado errado

**Solução 1**: Use 2 abas diferentes
```javascript
// Storage events só dispara em OUTRAS abas
// Não dispara na aba que fez a alteração
```

**Solução 2**: Verifique o navegador
```javascript
// BroadcastChannel funciona em:
// ✅ Chrome/Edge: sim
// ✅ Firefox: sim  
// ✅ Safari: sim (a partir de v15)
// ❌ IE: não
```

### Problema 3: "Dados não sincronizam entre dispositivos"

**Causa 1**: Não está na mesma origin
```javascript
// Ambos devem estar em:
// http://localhost:5173 OU
// http://192.168.1.100:5173 OU
// http://seu-dominio.com
// MAS NÃO em diferentes domínios/portas
```

**Causa 2**: Polling não está em tempo real (5-3 segundos de delay)
```javascript
// O polling é intencionalmente lento para economizar recursos
// Mudanças aparecem em até 3 segundos
// Para testes, use forceSync():
window.syncService.forceSync();
```

### Problema 4: "Mudanças não aparecem após salvar"

**Verificação**:
```javascript
// 1. Verifique se os dados foram salvos
console.log(localStorage.getItem('cuf-overrides-v3'));

// 2. Verifique o metadata
console.log(localStorage.getItem('cuf-overrides-v3__metadata'));

// 3. Force uma sincronização
window.syncService.forceSync();

// 4. Veja se o callback foi chamado
// (veja "Teste 5" acima)
```

## 📊 Logs Esperados

Quando uma mudança é sincronizada, você deve ver no console:

```
[syncService] Storage event detectado: cuf-overrides-v3
[syncService] Mudança de valor detectada via polling: cuf-overrides-v3
[App] Sincronização recebida: {overrides: {...}, timestamp: 1705999999000, deviceId: 'device-...'}
```

Se não ver logs, o problema está em uma das etapas acima.

## 🔄 Fluxo Completo de Debug

```
1. Usuário altera um turno na Aba 1
        ↓
2. React state atualiza (setOverrides)
        ↓
3. useEffect de salvamento executa (300ms debounce)
        ↓
4. storage.saveData() salva em localStorage
        ↓
5. localStorage.setItem('cuf-overrides-v3', ...)
        ↓
6. localStorage.setItem('cuf-overrides-v3__metadata', ...) [COM TIMESTAMP]
        ↓
7. syncService.publishSync() é chamado
        ↓
8. BroadcastChannel envia mensagem para outros contextos
        ↓
9. Aba 2 recebe o storage event (se em outra aba)
        ↓
10. Storage event listener do syncService dispara
        ↓
11. syncService.notifyCallbacks() é chamado
        ↓
12. App.tsx onSync callback recebe os dados
        ↓
13. setOverrides/setHolidays/setConfigs atualiza state
        ↓
14. React re-renderiza com novos dados
        ↓
15. Usuário vê a mudança em tempo real! ✅
```

Se quebrar em qualquer passo acima:

| Passo | Verificar | Comando |
|-------|-----------|---------|
| 1-3 | React state | Abra DevTools > React Developer Tools |
| 4-6 | localStorage | `localStorage.getItem('cuf-overrides-v3')` |
| 7 | publishSync | `console.log('Publicando...', data)` |
| 8 | BroadcastChannel | `console.log('BC enviado')` |
| 9 | Storage event | `window.addEventListener('storage', e => console.log('Storage:', e))` |
| 10 | Sync listener | `window.syncService.onSync(data => console.log('Sync:', data))` |
| 11-15 | App callback | Ver se "Sincronização recebida:" aparece |

## ✅ Como Saber que Funciona

Se ao fazer uma mudança em um dispositivo você vê TODOS estes logs:

1. ✅ "Storage event detectado: cuf-overrides-v3"
2. ✅ "Sincronização recebida: {overrides: {...}}"
3. ✅ A interface atualiza automaticamente

**Então a sincronização está funcionando!** 🎉

## 📞 Relatando um Bug

Se ainda não funciona, descreva:

1. Qual navegador está usando? (Chrome, Firefox, Safari, etc.)
2. O que fez? (Alterou turno, feriado, etc.)
3. O que esperava ver? (Mudança aparece em outro dispositivo)
4. O que viu? (Mudança não apareceu, erro, etc.)
5. Qual é o resultado de:
   ```javascript
   window.syncService.getDeviceId()
   localStorage.getItem('cuf-overrides-v3__metadata')
   ```

Com essas informações, será fácil debugar o problema!

---

**Última atualização**: 28 de Janeiro de 2026
