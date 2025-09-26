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
    
    // O URL do seu backend na Google Cloud
    const agentApiUrl = 'https://meu-agente-ia-229126335565.southamerica-east1.run.app/meuAgenteIA';

    // --- INFORMAÇÃO DO AGENTE (SIMPLIFICADO) ---
    // Em vez de ler do DB, colocamos a informação aqui
    const agentName = "Detetive de Competências";
    const agentPrompt = `Aja como o "Detetive de Competências", um especialista sênior e tutor de redação do ENEM. Seu tom deve ser encorajador e didático. Sua missão é fornecer clareza total ao aluno... (coloque o seu prompt completo aqui se quiser, ou deixe um simples para teste)`;
    
    agentNameTitle.textContent = agentName;
    addMessage(`Olá! Eu sou ${agentName}. Como posso ajudar?`, 'agent');
    // --- FIM DA SIMPLIFICAÇÃO ---

    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); 
            handleSendMessage();
        }
    });

    async function handleSendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText.length === 0) return;

        addMessage(messageText, 'user');
        messageInput.value = ''; 
        sendBtn.disabled = true;

        const typingIndicator = addMessage('A pensar...', 'agent-typing');

        try {
            const idToken = await user.getIdToken();
            
            const finalPrompt = `${agentPrompt}\n\nMensagem do Utilizador: ${messageText}`;

            const response = await fetch(agentApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
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
            addMessage('Desculpe, ocorreu um erro na comunicação com a IA.', 'agent-error');
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