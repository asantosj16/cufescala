# 🧪 TESTE RÁPIDO DA SINCRONIZAÇÃO

## ✅ Passos para Testar

### 1️⃣ **Abra duas abas do navegador**

- **Aba 1**: http://localhost:3000
- **Aba 2**: http://localhost:3000 (abra em nova aba com Ctrl+T ou Cmd+T)

### 2️⃣ **Abra o Console em AMBAS as abas**

Pressione `F12` (Windows/Linux) ou `Cmd+Option+I` (Mac)

Procure ver mensagens como:
```
📱 Inicializando SyncService com deviceId: device-...
✅ BroadcastChannel inicializado com sucesso
✅ Storage Event listener inicializado
🔍 Iniciando polling de sincronização (intervalo: 1s)...
📝 Novo callback de sincronização registrado
```

### 3️⃣ **Na Aba 1: Faça uma alteração**

1. Clique em um turno para editá-lo
2. Mude o turno (ex: T6 → M56)
3. Clique em "Salvar" ou saia do modal

Você deve ver nos console logs:
```
💾 Dados salvos, publicando sincronização...
📤 publishSync() chamado com:
   - overrides: true
   - holidays: false
   - configs: false
📢 Notificando 1 callback(s) sobre sincronização
  [1] Chamando callback...
  [1] ✅ Callback executado
✅ Mensagem enviada via BroadcastChannel
```

### 4️⃣ **Na Aba 2: Verifique a mudança**

A mudança deve aparecer automaticamente!

Você deve ver nos console logs da Aba 2:
```
📡 BroadcastChannel: Mensagem recebida de outro contexto: {...}
📢 Notificando 1 callback(s) sobre sincronização
  [1] Chamando callback...
  📝 Atualizando overrides
  [1] ✅ Callback executado
```

### 5️⃣ **Teste inverso: Altere na Aba 2**

Repita os passos 3-4 mas invertendo as abas.

## 🐛 Debugging no Console

Se não funcionar, abra o console e execute:

```javascript
// Ver se o sync service está inicializado
window.syncService

// Ver callbacks registrados
window.syncService.callbacks.length

// Ver dados salvos em localStorage
localStorage.getItem('cuf-overrides-v3')
localStorage.getItem('cuf-overrides-v3__metadata')

// Forçar uma verificação manual
window.syncService.forceSync()

// Ver device ID
window.syncService.getDeviceId()
```

## ✅ Checklist

- [ ] Vejo "BroadcastChannel inicializado" no console
- [ ] Vejo "Storage Event listener inicializado" no console
- [ ] Vejo "Novo callback de sincronização registrado" no console
- [ ] Quando faço alteração, vejo "publishSync() chamado"
- [ ] Na outra aba, vejo "BroadcastChannel: Mensagem recebida"
- [ ] As mudanças aparecem automaticamente na outra aba

## ❌ Se Não Funcionar

1. **Verificar console** - Tem erros?
2. **Testar forceSync()** - Execute `window.syncService.forceSync()` no console
3. **Ver callbacks** - Execute `window.syncService.callbacks.length` - deve ser > 0
4. **Recarregar página** - Ctrl+R em ambas as abas
5. **Abrir DevTools cedo** - Abra F12 ANTES de fazer alterações

## 📱 Para Testar Entre Dispositivos

**Infelizmente não é possível sincronizar entre dispositivos diferentes com localStorage.**

Para isso seria necessário:
- Um servidor backend (Node.js/Express)
- Firebase ou Supabase
- WebSocket para comunicação em tempo real

Vide documento `SYNC_DEBUG_GUIDE.md` para mais detalhes.

