// agente.js - VERSÃO COM BOTÃO VOLTAR

auth.onAuthStateChanged(user => {
    if (user) {
        initializeChat(user);
    } else {
        window.location.href = 'index.html';
    }
});

async function initializeChat(user) {
    const agentNameTitle = document.getElementById('agent-name');
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    
    let agentPrompt = null;
    let chatRef = null;

    const selectedAgentId = localStorage.getItem('selectedAgentId');
    const selectedChatId = localStorage.getItem('selectedChatId');

    if (!selectedAgentId || !selectedChatId) {
        alert("Nenhuma conversa selecionada. A redirecionar...");
        window.location.href = 'dashboard.html';
        return;
    }
    
    chatRef = db.collection('users').doc(user.uid).collection('chats').doc(selectedChatId);

    const agentApiUrl = 'https://meu-agente-ia-229126335565.southamerica-east1.run.app/meuAgenteIA';

    try {
        const agentRef = db.collection('agents').doc(selectedAgentId);
        const agentDoc = await agentRef.get();
        if (!agentDoc.exists) throw new Error('Agente não encontrado.');

        const agentData = agentDoc.data();
        agentNameTitle.textContent = agentData.name;
        agentPrompt = agentData.prompt;
        
        await loadMessageHistory(chatRef);
        
        if (document.getElementById('chat-messages').children.length === 0) {
             addMessage(`Olá! Eu sou ${agentData.name}. Como posso ajudar?`, 'agent');
        }

    } catch (error) {
        console.error("Erro na inicialização:", error);
        agentNameTitle.textContent = "Erro ao carregar";
    }

    sendBtn.addEventListener('click', () => handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId, selectedChatId));
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId, selectedChatId);
        }
    });

    // NOVO BLOCO PARA O BOTÃO VOLTAR
    const backBtn = document.getElementById('back-dashboard-btn');
    backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

async function loadMessageHistory(chatRef) {
    const messagesSnapshot = await chatRef.collection('mensagens').orderBy('timestamp', 'asc').get();
    messagesSnapshot.forEach(doc => {
        addMessage(doc.data().texto, doc.data().remetente);
    });
}

async function handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId, selectedChatId) {
    // ... (o conteúdo desta função permanece o mesmo da versão anterior) ...
}

function addMessage(text, type) {
    // ... (o conteúdo desta função permanece o mesmo da versão anterior) ...
}