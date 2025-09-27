// dashboard.js - VERSÃO ATUALIZADA

auth.onAuthStateChanged(user => {
    if (user) {
        loadUserAgents(user);
    } else {
        window.location.href = 'index.html';
    }
});

async function loadUserAgents(user) {
    const agentListDiv = document.getElementById('agent-list');
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists || !userDoc.data().agentesPermitidos || userDoc.data().agentesPermitidos.length === 0) {
            agentListDiv.innerHTML = '<p>Você ainda não tem acesso a nenhum agente.</p>';
            return;
        }

        const permittedAgentIds = userDoc.data().agentesPermitidos;
        agentListDiv.innerHTML = '';

        for (const agentId of permittedAgentIds) {
            const agentRef = db.collection('agents').doc(agentId);
            const agentDoc = await agentRef.get();

            if (agentDoc.exists) {
                const agentData = agentDoc.data();
                const agentButton = document.createElement('button');
                // O texto do botão agora indica que uma NOVA conversa será criada
                agentButton.textContent = `Nova Conversa com ${agentData.name}`;
                agentButton.classList.add('agent-button');
                
                agentButton.onclick = async () => {
                    try {
                        // CRIA UM NOVO DOCUMENTO DE CHAT PARA O USUÁRIO
                        const newChatRef = await db.collection('users').doc(user.uid).collection('chats').add({
                            agentId: agentId,
                            agentName: agentData.name,
                            titulo: `Conversa com ${agentData.name}`, // Título inicial
                            dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        // Salva o ID do agente e o NOVO ID da conversa para a próxima página
                        localStorage.setItem('selectedAgentId', agentId);
                        localStorage.setItem('selectedChatId', newChatRef.id); // NOVO!
                        window.location.href = 'agente.html';

                    } catch (error) {
                        console.error("Erro ao criar nova conversa:", error);
                        alert("Não foi possível iniciar uma nova conversa. Tente novamente.");
                    }
                };
                agentListDiv.appendChild(agentButton);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar agentes:", error);
        agentListDiv.innerHTML = '<p>Ocorreu um erro ao carregar os seus agentes.</p>';
    }
}