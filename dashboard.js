// dashboard.js - VERSÃO COM BOTÃO DE EXCLUIR

auth.onAuthStateChanged(user => {
    if (user) {
        loadUserAgents(user);
        loadChatHistory(user);
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
                agentButton.textContent = `Nova Conversa com ${agentData.name}`;
                agentButton.classList.add('agent-button');
                
                agentButton.onclick = async () => {
                    try {
                        const newChatRef = await db.collection('users').doc(user.uid).collection('chats').add({
                            agentId: agentId,
                            agentName: agentData.name,
                            titulo: `Conversa com ${agentData.name}`,
                            dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        localStorage.setItem('selectedAgentId', agentId);
                        localStorage.setItem('selectedChatId', newChatRef.id);
                        window.location.href = 'agente.html';

                    } catch (error) {
                        console.error("Erro ao criar nova conversa:", error);
                        alert("Não foi possível iniciar uma nova conversa.");
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

async function loadChatHistory(user) {
    const historyListDiv = document.getElementById('history-list');
    try {
        const chatsRef = db.collection('users').doc(user.uid).collection('chats');
        const querySnapshot = await chatsRef.orderBy('dataCriacao', 'desc').get();

        if (querySnapshot.empty) {
            historyListDiv.innerHTML = '<p>Nenhuma conversa anterior encontrada.</p>';
            return;
        }

        historyListDiv.innerHTML = '';

        querySnapshot.forEach(doc => {
            const chatData = doc.data();
            const chatId = doc.id;

            const historyItemDiv = document.createElement('div');
            historyItemDiv.classList.add('history-item');

            const historyButton = document.createElement('button');
            historyButton.textContent = chatData.titulo || 'Conversa sem título';
            historyButton.classList.add('agent-button');
            historyButton.onclick = () => {
                localStorage.setItem('selectedAgentId', chatData.agentId);
                localStorage.setItem('selectedChatId', chatId);
                window.location.href = 'agente.html';
            };

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '&#12