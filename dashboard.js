// dashboard.js - VERSÃO COMPLETA COM BOTÃO ADMIN CONDICIONAL

auth.onAuthStateChanged(user => {
    if (user) {
        loadDashboardData(user);
    } else {
        window.location.href = 'index.html';
    }
});

async function loadDashboardData(user) {
    const agentListDiv = document.getElementById('agent-list');
    const historyListDiv = document.getElementById('history-list');
    const creditDisplay = document.getElementById('credit-display');

    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            agentListDiv.innerHTML = '<p>Usuário não encontrado no banco de dados.</p>';
            return;
        }

        const userData = userDoc.data();

        if (userData.tipoDeAcesso === 'ilimitado') {
            creditDisplay.textContent = 'Acesso: Ilimitado';
        } else if (userData.tipoDeAcesso === 'creditos') {
            creditDisplay.textContent = `Créditos Restantes: ${userData.creditosRestantes}`;
        }

        // LÓGICA PARA MOSTRAR O BOTÃO ADMIN
        if (userData.isAdmin === true) {
            const adminLinkContainer = document.getElementById('admin-link-container');
            const adminButton = document.createElement('button');
            adminButton.textContent = 'Painel Admin';
            adminButton.id = 'admin-panel-btn';
            adminButton.onclick = () => {
                window.location.href = 'admin.html';
            };
            adminLinkContainer.appendChild(adminButton);
        }

        loadUserAgents(user, userData, agentListDiv);
        loadChatHistory(user, historyListDiv);

    } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        creditDisplay.textContent = "Erro ao carregar créditos.";
        agentListDiv.innerHTML = '<p>Ocorreu um erro ao carregar seus dados.</p>';
    }
}

async function loadUserAgents(user, userData, agentListDiv) {
    try {
        if (!userData.agentesPermitidos || userData.agentesPermitidos.length === 0) {
            agentListDiv.innerHTML = '<p>Você ainda não tem acesso a nenhum agente.</p>';
            return;
        }
        const permittedAgentIds = userData.agentesPermitidos;
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

async function loadChatHistory(user, historyListDiv) {
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
            historyButton.style.backgroundColor = '#7f8c8d';
            historyButton.onclick = () => {
                localStorage.setItem('selectedAgentId', chatData.agentId);
                localStorage.setItem('selectedChatId', chatId);
                window.location.href = 'agente.html';
            };
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '&#128465;';
            deleteButton.classList.add('delete-btn');
            deleteButton.title = 'Excluir conversa';
            deleteButton.onclick = (event) => {
                event.stopPropagation();
                deleteChat(user, chatId, historyItemDiv);
            };
            historyItemDiv.appendChild(historyButton);
            historyItemDiv.appendChild(deleteButton);
            historyListDiv.appendChild(historyItemDiv);
        });
    } catch (error) {
        console.error("Erro ao carregar histórico de conversas:", error);
        historyListDiv.innerHTML = '<p>Ocorreu um erro ao carregar seu histórico.</p>';
    }
}

async function deleteChat(user, chatId, elementToRemove) {
    if (confirm("Tem certeza de que deseja excluir esta conversa? Esta ação não pode ser desfeita.")) {
        try {
            const chatRef = db.collection('users').doc(user.uid).collection('chats').doc(chatId);
            await chatRef.delete();
            elementToRemove.remove();
        } catch (error) {
            console.error("Erro ao excluir conversa:", error);
            alert("Não foi possível excluir a conversa. Tente novamente.");
        }
    }
}