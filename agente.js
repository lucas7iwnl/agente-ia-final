// agente.js - VERSÃO COMPLETA E CORRIGIDA

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
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.tipoDeAcesso === 'creditos' && userData.creditosRestantes <= 0) {
                messageInput.placeholder = 'Seus créditos acabaram. Recarregue para continuar.';
                messageInput.disabled = true;
                sendBtn.disabled = true;
            }
        }

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
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messageText = messageInput.value.trim();
    if (messageText.length === 0) return;

    addMessage(messageText, 'user');
    messageInput.value = '';
    sendBtn.disabled = true;

    const typingIndicator = addMessage('A pensar...', 'agent-typing');

    try {
        const idToken = await user.getIdToken();
        const finalPrompt = `${agentPrompt}\n\n...${messageText}`;

        const response = await fetch(agentApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({
                mensagem: finalPrompt,
                agentId: selectedAgentId,
                chatId: selectedChatId
            })
        });

        if (response.status === 402) {
            throw new Error('Créditos esgotados.');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'O servidor respondeu com um erro.');
        }

        const data = await response.json();
        if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
        }
        addMessage(data.resposta, 'agent');

    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        if(typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
        }
        addMessage(`Desculpe, ocorreu um erro: ${error.message}`, 'agent-error');
        if (error.message === 'Créditos esgotados.') {
            messageInput.placeholder = 'Seus créditos acabaram. Recarregue para continuar.';
            messageInput.disabled = true;
            sendBtn.disabled = true;
        }
    } finally {
        if (messageInput.disabled === false) {
           sendBtn.disabled = false;
           messageInput.focus();
        }
    }
}

function addMessage(text, type) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    const messageClass = (type === 'agent-typing') ? 'agent-typing-message' : `${type}-message`;
    messageElement.classList.add('message', messageClass);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement;
}