# 🔍 Guia de Debug da Sincronização

## Problema Identificado

A sincronização entre dispositivos **NÃO funciona com localStorage sozinho** porque:
- `localStorage` é isolado **por dispositivo** e por **por domínio**
- `BroadcastChannel` só funciona entre **abas do mesmo navegador**
- Não há conexão de rede entre dois dispositivos diferentes

## ✅ O que FUNCIONA Agora

### Sincronização Entre Abas do Mesmo Navegador

Se você abrir duas abas do **mesmo navegador** no **mesmo computador**:

```bash
1. Aba 1: http://localhost:3000
2. Aba 2: http://localhost:3000 (mesma URL)
```

Neste caso, a sincronização deve funcionar via:
- **Storage Events** (disparado automaticamente quando localStorage muda)
- **BroadcastChannel** (comunicação entre abas)
- **Polling** (verificação a cada 1 segundo como fallback)

### Como Testar:

1. Abra duas abas do navegador (ou use DevTools mode)
2. Na Aba 1: Altere um turno e clique em Salvar
3. Na Aba 2: Verifique se a mudança aparece automaticamente

## ❌ O que NÃO FUNCIONA

### Sincronização Entre Dispositivos Diferentes

Se você tentar sincronizar entre:
- Um computador e um telemóvel
- Dois navegadores diferentes
- Dois dispositivos físicos diferentes

**Isto não vai funcionar com a implementação atual** porque eles não compartilham o mesmo `localStorage`.

## 🔧 Soluções Possíveis

### Opção 1: Backend com WebSocket (Recomendado)

Criar um servidor que sincroniza dados entre clientes:

```typescript
// Pseudocódigo
- Cliente A modifica dados
- Envia para servidor via WebSocket
- Servidor broadcast para Cliente B
- Cliente B recebe e atualiza estado
```

**Tecnologias**: Node.js + Socket.io, ou Firebase Realtime DB

### Opção 2: Usar um Banco de Dados em Nuvem

- **Firebase Realtime Database**: Sync em tempo real
- **Supabase**: PostgreSQL em tempo real
- **Google Firestore**: Sync automático

### Opção 3: Usar SharedWorker (Experimental)

`SharedWorker` permite compartilhar estado entre abas:
- Mais confiável que BroadcastChannel
- Ainda não funciona entre dispositivos

## 🐛 Debug com Console

Para verificar se a sincronização está funcionando:

### 1. Ver Logs no Console

No navegador, abra DevTools (F12) > Console

Você deve ver logs como:
```
🔄 Iniciando polling de sincronização...
🔄 Sincronização recebida: {...}
📝 Atualizando overrides
✅ Nenhuma mudança detectada no polling
```

### 2. Acessar SyncService pelo Console

```javascript
// No console do navegador:
window.syncService

// Ver todos os callbacks registrados:
window.syncService.callbacks

// Forçar verificação de mudanças:
window.syncService.forceSync()

// Ver device ID:
window.syncService.getDeviceId()
```

### 3. Ver LocalStorage

```javascript
// Ver todos os dados salvos:
Object.keys(localStorage).filter(k => k.startsWith('cuf-'))

// Ver metadata de sincronização:
localStorage.getItem('cuf-overrides-v3__metadata')
localStorage.getItem('cuf-holidays-v3__metadata')

// Ver device ID:
localStorage.getItem('cuf-device-id')
```

### 4. Testar Storage Events

```javascript
// Simular mudança no localStorage (de outra aba):
localStorage.setItem('cuf-overrides-v3', JSON.stringify({ test: 'data' }))

// Na outra aba, você deve ver no console:
// "Storage event detectado: cuf-overrides-v3"
```

## ✅ Checklist de Sincronização

- [ ] Polls estão rodando (check logs a cada 1 segundo)
- [ ] Storage Events estão sendo disparados
- [ ] Callbacks do onSync estão sendo registrados
- [ ] Metadata com timestamps está sendo salva
- [ ] BroadcastChannel está inicializado (ou com fallback)
- [ ] Hash detection está funcionando

## 🚀 Próximos Passos Recomendados

1. **Testar entre abas do mesmo navegador** (deve funcionar)
2. Se não funcionar, debugar com console (ver seção anterior)
3. Para sincronização entre dispositivos, implementar backend/cloud
4. Considerar Firebase ou Supabase para solução pronta

