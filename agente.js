// agente.js - VERSÃO ATUALIZADA PARA CHATS INDIVIDUAIS

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
    const selectedChatId = localStorage.getItem('selectedChatId'); // NOVO!

    if (!selectedAgentId || !selectedChatId) {
        alert("Nenhuma conversa selecionada. A redirecionar...");
        window.location.href = 'dashboard.html';
        return;
    }
    
    // NOVO CAMINHO PARA ACESSAR AS MENSAGENS:
    chatRef = db.collection('users').doc(user.uid).collection('chats').doc(selectedChatId);

    const agentApiUrl = 'URL_DA_SUA_CLOUD_FUNCTION'; // Substitua pela sua URL

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
        console.error(error);
        agentNameTitle.textContent = "Erro ao carregar";
    }

    sendBtn.addEventListener('click', () => handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId, selectedChatId));
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage(user, agentApiUrl, agentPrompt, selectedAgentId, selectedChatId);
        }
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
                chatId: selectedChatId // ENVIA O ID DO CHAT PARA O BACKEND
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'O servidor respondeu com um erro.');
        }

        const data = await response.json();
        document.getElementById('chat-messages').removeChild(typingIndicator);
        addMessage(data.resposta, 'agent');

    } catch (error) {
        // ... (código de tratamento de erro) ...
    } finally {
        sendBtn.disabled = false;
    }
}

function addMessage(text, type) {
    // ... (código da função addMessage, sem alterações) ...
}