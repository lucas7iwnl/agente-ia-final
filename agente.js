// Conteúdo completo e corrigido para o arquivo agente.js

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
    const chatMessages = document.getElementById('chat-messages');

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

    const agentApiUrl = 'https://meu-agente-ia-229126335565.southamerica-east1.run.app/meuAgenteIA';

    try {
        const agentRef = db.collection('agents').doc(selectedAgentId);
        const agentDoc = await agentRef.get();
        if (!agentDoc.exists) throw new Error('Agente não encontrado no banco de dados.');

        const agentData = agentDoc.data();
        agentNameTitle.textContent = agentData.name;
        agentPrompt = agentData.prompt;
        
        await loadMessageHistory();

        const existingMessages = chatMessages.querySelectorAll('.message');
        if (existingMessages.length === 0) {
            addMessage(`Olá! Eu sou ${agentData.name}. Como posso ajudar?`, 'agent', false);
        }

    } catch (error) {
        console.error(error);
        agentNameTitle.textContent = "Erro ao carregar";
    }

    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    });

    async function loadMessageHistory() {
        if (!conversationRef) return;
        const messagesSnapshot = await conversationRef.collection('mensagens').orderBy('timestamp', 'asc').get();
        messagesSnapshot.forEach(doc => {
            const data = doc.data();
            addMessage(data.texto, data.remetente, false);
        });
    }

    async function handleSendMessage() {
        if (!agentPrompt) {
            addMessage('O cérebro do agente não foi carregado. Tente recarregar a página.', 'agent-error', false);
            return;
        }

        const messageText = messageInput.value.trim();
        if (messageText.length === 0) return;

        addMessage(messageText, 'user', false); // Adiciona na tela, mas o backend salvará
        messageInput.value = '';
        sendBtn.disabled = true;

        const typingIndicator = addMessage('A pensar...', 'agent-typing', false);

        try {
            const idToken = await user.getIdToken();
            const finalPrompt = `${agentPrompt}\n\nAQUI ESTÁ A MENSAGEM DO UTILIZADOR:\n\n---\n\n${messageText}`;

            const response = await fetch(agentApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                // LINHA CORRIGIDA:
                body: JSON.stringify({ mensagem: finalPrompt, agentId: selectedAgentId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'O servidor respondeu com um erro.');
            }

            const data = await response.json();
            
            chatMessages.removeChild(typingIndicator);
            addMessage(data.resposta, 'agent', false); // Adiciona na tela, pois o backend já salvou

        } catch (error) {
            console.error("Erro capturado:", error.message);
            chatMessages.removeChild(typingIndicator);
            addMessage('Desculpe, ocorreu um erro: ' + error.message, 'agent-error', false);
        } finally {
            sendBtn.disabled = false;
        }
    }
    
    function addMessage(text, type, saveToDb = true) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        const messageClass = (type === 'agent-typing') ? 'agent-typing-message' : `${type}-message`;
        messageElement.classList.add('message', messageClass);
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    }
}