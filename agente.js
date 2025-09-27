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
    let conversationRef = null;

    const selectedAgentId = localStorage.getItem('selectedAgentId');
    if (!selectedAgentId) {
        alert("Nenhum agente selecionado. A redirecionar...");
        window.location.href = 'dashboard.html';
        return;
    }

    const conversationId = `${user.uid}_${selectedAgentId}`;
    conversationRef = db.collection('conversations').doc(conversationId);

    // IMPORTANTE: Insira a URL da sua Cloud Function aqui
    const agentApiUrl = 'URL_DA_SUA_CLOUD_FUNCTION'; 

    try {
        const agentRef = db.collection('agents').doc(selectedAgentId);
        const agentDoc = await agentRef.get();

        if (!agentDoc.exists) {
            throw new Error('Agente não encontrado no banco de dados.');
        }

        const agentData = agentDoc.data();
        agentNameTitle.textContent = agentData.name;
        agentPrompt = agentData.prompt;

        await loadMessageHistory();
        
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages.children.length === 0) {
            addMessage(`Olá! Eu sou ${agentData.name}. Como posso ajudar?`, 'agent');
        }

    } catch (error) {
        console.error("Erro na inicialização do chat:", error);
        agentNameTitle.textContent = "Erro ao carregar";
    }

    sendBtn.addEventListener('click', () => handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId));
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId);
        }
    });

    async function loadMessageHistory() {
        const messagesSnapshot = await conversationRef.collection('mensagens').orderBy('timestamp', 'asc').get();
        messagesSnapshot.forEach(doc => {
            addMessage(doc.data().texto, doc.data().remetente);
        });
    }
}

async function handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId) {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (!agentPrompt) {
        addMessage('O cérebro do agente não foi carregado. Tente recarregar a página.', 'agent-error');
        return;
    }

    const messageText = messageInput.value.trim();
    if (messageText.length === 0) return;

    addMessage(messageText, 'user');
    messageInput.value = '';
    sendBtn.disabled = true;

    const typingIndicator = addMessage('A pensar...', 'agent-typing');

    try {
        const idToken = await user.getIdToken();
        const finalPrompt = `${agentPrompt}\n\nAQUI ESTÁ A MENSAGEM DO UTILIZADOR:\n\n---\n\n${messageText}`;

        const response = await fetch(agentApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ mensagem: finalPrompt, agentId: selectedAgentId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'O servidor respondeu com um erro.');
        }

        const data = await response.json();
        
        document.getElementById('chat-messages').removeChild(typingIndicator);
        addMessage(data.resposta, 'agent');

    } catch (error) {
        console.error("Erro capturado:", error.message);
        if (typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
        }
        addMessage('Desculpe, ocorreu um erro: ' + error.message, 'agent-error');
    } finally {
        sendBtn.disabled = false;
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