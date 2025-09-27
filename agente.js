// VERSÃO FINAL DA FUNÇÃO (sem a linha console.log)

async function handleSendMessage() {
    if (!agentPrompt) {
        addMessage('O cérebro do agente não foi carregado. Tente recarregar a página.', 'agent-error', false);
        return;
    }

    const messageText = messageInput.value.trim();
    if (messageText.length === 0) return;

    addMessage(messageText, 'user', false);
    messageInput.value = '';
    sendBtn.disabled = true;

    const typingIndicator = addMessage('A pensar...', 'agent-typing', false);

    try {
        const idToken = await user.getIdToken();
        const finalPrompt = `${agentPrompt}\n\nAQUI ESTÁ A MENSAGEM DO UTILIZADOR:\n\n---\n\n${messageText}`;

        // A linha de console.log que estava aqui foi removida.

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
        
        chatMessages.removeChild(typingIndicator);
        addMessage(data.resposta, 'agent', false);

    } catch (error) {
        console.error("Erro capturado:", error.message);
        chatMessages.removeChild(typingIndicator);
        addMessage('Desculpe, ocorreu um erro: ' + error.message, 'agent-error', false);
    } finally {
        sendBtn.disabled = false;
    }
}