// admin.js - LÓGICA DE GESTÃO DE AGENTES

auth.onAuthStateChanged(user => {
    if (user) {
        checkAdminStatus(user);
    } else {
        window.location.href = 'index.html';
    }
});

async function checkAdminStatus(user) {
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists && userDoc.data().isAdmin === true) {
            document.getElementById('admin-container').style.display = 'block';
            document.getElementById('access-denied').style.display = 'none';
            // Inicia a lógica principal do painel admin
            initializeAdminPanel();
        } else {
            throw new Error("Permissões insuficientes.");
        }
    } catch (error) {
        console.error("Erro de permissão:", error.message);
        document.getElementById('admin-container').style.display = 'none';
        document.getElementById('access-denied').style.display = 'block';
    }
}

function initializeAdminPanel() {
    loadAdminAgents();

    const showFormBtn = document.getElementById('show-form-btn');
    const formContainer = document.getElementById('agent-form-container');
    const cancelBtn = document.getElementById('cancel-btn');
    const agentForm = document.getElementById('agent-form');
    
    // Mostra o formulário para criar um novo agente
    showFormBtn.addEventListener('click', () => {
        formContainer.style.display = 'block';
        showFormBtn.style.display = 'none';
    });

    // Esconde o formulário
    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        showFormBtn.style.display = 'block';
        agentForm.reset(); // Limpa o formulário
    });

    // Lida com o envio do formulário para criar/salvar agente
    agentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const agentName = document.getElementById('agent-name-input').value;
        const agentPrompt = document.getElementById('agent-prompt-input').value;
        
        if (!agentName || !agentPrompt) {
            alert('Nome e Prompt são obrigatórios.');
            return;
        }

        try {
            // Cria um novo documento na coleção 'agents'
            await db.collection('agents').add({
                name: agentName,
                prompt: agentPrompt
            });
            
            alert('Agente criado com sucesso!');
            agentForm.reset();
            formContainer.style.display = 'none';
            showFormBtn.style.display = 'block';
            loadAdminAgents(); // Recarrega a lista de agentes
        } catch (error) {
            console.error("Erro ao salvar agente:", error);
            alert("Não foi possível salvar o agente.");
        }
    });
}

async function loadAdminAgents() {
    const agentListDiv = document.getElementById('agent-list-admin');
    agentListDiv.innerHTML = '<p>A carregar agentes...</p>';
    
    try {
        const querySnapshot = await db.collection('agents').get();
        if (querySnapshot.empty) {
            agentListDiv.innerHTML = '<p>Nenhum agente encontrado.</p>';
            return;
        }

        agentListDiv.innerHTML = ''; // Limpa a lista
        querySnapshot.forEach(doc => {
            const agent = doc.data();
            const agentId = doc.id;
            
            const agentElement = document.createElement('div');
            agentElement.classList.add('history-item'); // Reutilizando um estilo
            agentElement.innerHTML = `
                <p style="flex-grow: 1; margin: 0;"><strong>${agent.name}</strong></p>
                <button class="edit-agent-btn" data-id="${agentId}">Editar</button>
                <button class="delete-agent-btn" data-id="${agentId}" style="background-color: #c0392b;">Excluir</button>
            `;
            agentListDiv.appendChild(agentElement);
        });

        // Adicionar lógica para os botões de excluir e editar no futuro
        document.querySelectorAll('.delete-agent-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const agentId = e.target.dataset.id;
                if(confirm(`Tem a certeza que quer excluir o agente com ID: ${agentId}?`)) {
                    await db.collection('agents').doc(agentId).delete();
                    alert('Agente excluído!');
                    loadAdminAgents(); // Recarrega a lista
                }
            });
        });
        
    } catch (error) {
        console.error("Erro ao carregar agentes:", error);
        agentListDiv.innerHTML = '<p>Ocorreu um erro ao carregar os agentes.</p>';
    }
}