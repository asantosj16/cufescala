/**
 * Teste do Sistema de Sincronização
 * 
 * Como usar:
 * 1. Abra a aplicação em dois navegadores/abas diferentes
 * 2. Cole este código no console do navegador (F12 > Console)
 * 3. Faça uma mudança em um dispositivo
 * 4. Verifique se a mudança aparece no outro
 */

// Teste 1: Verificar se syncService está carregado
console.log('=== TESTE 1: Verificar syncService ===');
console.log('syncService disponível:', typeof window.syncService !== 'undefined');
if (typeof window.syncService !== 'undefined') {
  console.log('Device ID:', window.syncService.getDeviceId());
}

// Teste 2: Registrar listener e forçar uma sincronização
console.log('\n=== TESTE 2: Testar sincronização ===');
if (typeof window.syncService !== 'undefined') {
  // Simular uma mudança
  const testData = {
    overrides: { 'test-key': 'TEST_VALUE' },
    timestamp: Date.now(),
    deviceId: window.syncService.getDeviceId(),
  };
  
  console.log('Publicando dados de teste:', testData);
  window.syncService.publishSync(testData);
  console.log('Dados publicados. Verifique localStorage em outros dispositivos.');
}

// Teste 3: Monitorar storage events
console.log('\n=== TESTE 3: Monitorar Storage Events ===');
console.log('Abra o DevTools (F12) e vá para Application > Storage > Local Storage');
console.log('Qualquer mudança será refletida automaticamente');

// Teste 4: Teste manual de armazenamento
console.log('\n=== TESTE 4: Teste Manual ===');
console.log('Execute no console:');
console.log("localStorage.setItem('cuf-overrides-v3', JSON.stringify({test: 'data'}));");
console.log('Aguarde 5 segundos e verifique se a mudança aparece em outros dispositivos');

// Teste 5: Forçar sincronização manual
if (typeof window.syncService !== 'undefined') {
  console.log('\n=== TESTE 5: Forçar Sincronização ===');
  console.log('Execute no console:');
  console.log('window.syncService.forceSync();');
  console.log('Isso forçará uma verificação imediata de mudanças');
}
