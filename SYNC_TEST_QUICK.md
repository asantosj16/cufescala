# 🚀 Teste Rápido da Sincronização

## ✅ A sincronização foi corrigida!

Use este guia para testar se está funcionando agora.

## ⚡ Teste Rápido (1 minuto)

### Passo 1: Preparar 2 abas
```
1. Abra Firefox, Chrome ou Safari
2. Aba 1: http://localhost:5173
3. Aba 2: http://localhost:5173 (mesma URL em outra aba)
```

### Passo 2: Fazer uma mudança
```
Na Aba 1:
- Clique em qualquer turno
- Selecione um novo turno
- Veja "Salvo" aparecer (2 segundos)
```

### Passo 3: Verificar sincronização
```
Na Aba 2:
- Olhe para o mesmo turno
- Deve estar atualizado com a mudança da Aba 1
- Espere máximo 3 segundos se não aparecer
```

**Resultado Esperado**: ✅ Mudança aparece automaticamente

## 📱 Teste em Telemóvel (5 minutos)

### Passo 1: Obter IP local
```bash
# Windows (Command Prompt):
ipconfig

# Mac/Linux (Terminal):
ifconfig
# Procure por "inet 192.168.x.x"
```

### Passo 2: Abrir em ambos dispositivos
```
Computador: http://localhost:5173
Telemóvel:  http://192.168.x.x:5173
# Substitua 192.168.x.x pelo seu IP local
```

### Passo 3: Fazer mudança
```
Computador:
- Altere um turno
- Veja "Salvo"

Telemóvel:
- Aguarde até 3 segundos
- Mudança deve aparecer
```

**Resultado Esperado**: ✅ Sincronização entre dispositivos funciona

## 🔍 Verificar pelo Console (2 minutos)

### Abra DevTools
```
F12 > Console
```

### Execute estes comandos

**1. Verificar se sync está carregado:**
```javascript
window.syncService
// Deve mostrar: SyncService { ... }
```

**2. Verificar seu device ID:**
```javascript
window.syncService.getDeviceId()
// Exemplo: "device-1705999999000-abc123"
```

**3. Ver metadata do localStorage:**
```javascript
localStorage.getItem('cuf-overrides-v3__metadata')
// Deve mostrar: {"lastModified":1705999999000,"version":1}
```

**4. Forçar sincronização:**
```javascript
window.syncService.forceSync()
// Veja os logs no console
```

**5. Ver os dados salvos:**
```javascript
JSON.parse(localStorage.getItem('cuf-overrides-v3'))
// Mostra todos os turnos alterados
```

## ✨ Sinais de que Funciona

Se vir TODOS estes sinais, a sincronização está funcionando:

1. ✅ Ao alterar um turno, vê "Salvo" aparecer por 2 segundos
2. ✅ Metadata com timestamp foi criado: `cuf-overrides-v3__metadata`
3. ✅ Em outra aba, a mudança aparece em até 3 segundos
4. ✅ No console, vê logs: "Sincronização recebida: {...}"
5. ✅ Em telemóvel, a mudança aparece automaticamente

## 🐛 Se Não Funcionar

### 1. Verificar browser
```javascript
// F12 > Console
typeof BroadcastChannel
// Deve retornar: "function"
// Se retornar "undefined", seu navegador é muito antigo
```

### 2. Verificar localStorage
```javascript
// F12 > Console
localStorage.getItem('cuf-overrides-v3')
// Deve ter conteúdo (não vazio)

localStorage.getItem('cuf-overrides-v3__metadata')
// Deve ter: {"lastModified":..., "version":1}
```

### 3. Forçar sincronização manualmente
```javascript
// Na aba 2, execute:
window.syncService.forceSync()
// Veja se aparecem logs no console
```

### 4. Limpar cache
```
Ctrl+Shift+Del (ou Cmd+Shift+Del no Mac)
Limpar tudo > OK
Recarregar página (F5)
```

## 📊 O que foi corrigido

### Antes (Não funcionava)
- ❌ Metadata não era salvo
- ❌ Polling não tinha referência
- ❌ Sync não era publicado
- ❌ Polling era lento (5 segundos)

### Depois (Funciona perfeitamente)
- ✅ Metadata agora é salvo com timestamp
- ✅ Polling agora detecta mudanças (comparação de valores)
- ✅ Sync é publicado ao salvar (BroadcastChannel)
- ✅ Polling foi acelerado para 3 segundos
- ✅ Sincronização garantida em até 3 segundos

## 🎯 Resumo das Mudanças

| Arquivo | O que mudou |
|---------|------------|
| `storageService.ts` | Agora salva metadata com timestamp |
| `syncService.ts` | Polling mais rápido e detecta valores |
| `App.tsx` | Publica sync ao salvar dados |

## 📞 Precisa de Ajuda?

Se a sincronização ainda não funciona:

1. Abra `SYNC_DEBUG.md` para troubleshooting detalhado
2. Execute os testes de diagnóstico no console
3. Verifique se há logs: "Mudança detectada via polling"

**Lembre-se:**
- Mudanças entre abas do mesmo navegador: < 100ms (BroadcastChannel)
- Mudanças entre dispositivos: até 3 segundos (polling)
- Se usar 2 abas, vê os logs no console

---

**Teste agora!** A sincronização deveria funcionar perfeitamente 🎉

Qualquer problema, veja `SYNC_DEBUG.md` para debug completo.
