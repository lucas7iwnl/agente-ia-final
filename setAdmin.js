// setAdmin.js
const admin = require('firebase-admin');

// IMPORTANTE: Faça o download do seu ficheiro de credenciais do Firebase
// Vá em "Definições do Projeto" > "Contas de Serviço" > "Gerar nova chave privada"
// Renomeie o ficheiro .json para "serviceAccountKey.json" e coloque na mesma pasta.
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ===== COLOQUE O SEU EMAIL DE ADMIN AQUI =====
const adminEmail = "seu-email-de-admin@exemplo.com";
// ===========================================

async function setAdminClaim() {
  try {
    const user = await admin.auth().getUserByEmail(adminEmail);
    await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });
    console.log(`Sucesso! O usuário ${adminEmail} (UID: ${user.uid}) agora é um administrador.`);
    console.log("IMPORTANTE: Faça logout e login novamente na sua aplicação para as alterações terem efeito.");
  } catch (error) {
    console.error("Erro ao definir o atributo de admin:", error);
  }
  process.exit();
}

setAdminClaim();