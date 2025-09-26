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

    const selectedAgentId = localStorage.getItem('selectedAgentId');
    if (!selectedAgentId) {
        alert("Nenhum agente selecionado. A redirecionar...");
        window.location.href = 'dashboard.html';
        return;
    }

    const agentApiUrl = 'https://meu-agente-ia-229126335565.southamerica-east1.run.app/meuAgenteIA';

    try {
        const agentRef = db.collection('agents').doc(selectedAgentId);
        const agentDoc = await agentRef.get();
        if (!agentDoc.exists) throw new Error('Agente não encontrado no banco de dados.');

        const agentData = agentDoc.data();
        agentNameTitle.textContent = agentData.name;
        agentPrompt = agentData.prompt;

        addMessage(`Olá! Eu sou ${agentData.name}. Como posso ajudar?`, 'agent');

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

    async function handleSendMessage() {
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
                body: JSON.stringify({ mensagem: finalPrompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'O servidor respondeu com um erro.');
            }

            const data = await response.json();

            chatMessages.removeChild(typingIndicator);
            addMessage(data.resposta, 'agent');

        } catch (error) {
            console.error(error);
            chatMessages.removeChild(typingIndicator);
            addMessage('Desculpe, ocorreu um erro na comunicação com a IA. Tente novamente.', 'agent-error');
        } finally {
            sendBtn.disabled = false;
        }
    }
}

function addMessage(text, type) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${type}-message`);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement;
}