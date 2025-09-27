// admin.js - VERSÃO FINAL COM EDIÇÃO E BOTÃO VOLTAR

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
    const formTitle = document.getElementById('form-title');
    const agentIdInput = document.getElementById('agent-id-input');
    const agentNameInput = document.getElementById('agent-name-input');
    const agentPromptInput = document.getElementById('agent-prompt-input');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn'); // Pega o novo botão

    // LÓGICA DO BOTÃO VOLTAR
    backToDashboardBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    showFormBtn.addEventListener('click', () => {
        agentForm.reset();
        agentIdInput.value = '';
        formTitle.textContent = 'Criar Novo Agente';
        formContainer.style.display = 'block';
        showFormBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        showFormBtn.style.display = 'block';
        agentForm.reset();
    });

    // LÓGICA CORRIGIDA PARA CRIAR E EDITAR
    agentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const agentId = agentIdInput.value;
        const agentName = agentNameInput.value;
        const agentPrompt = agentPromptInput.value;
        
        if (!agentName || !agentPrompt) {
            alert('Nome e Prompt são obrigatórios.');
            return;
        }

        try {
            if (agentId) {
                // Se tem ID, estamos a EDITAR
                const agentRef = db.collection('agents').doc(agentId);
                await agentRef.update({ name: agentName, prompt: agentPrompt });
                alert('Agente atualizado com sucesso!');
            } else {
                // Se não tem ID, estamos a CRIAR
                await db.collection('agents').add({ name: agentName, prompt: agentPrompt });
                alert('Agente criado com sucesso! Lembre-se de atribuir este agente a um usuário.');
            }
            
            agentForm.reset();
            formContainer.style.display = 'none';
            showFormBtn.style.display = 'block';
            loadAdminAgents();
        } catch (error) {
            console.error("Erro ao salvar agente:", error);
            alert("Não foi possível salvar o agente. Verifique as regras de segurança.");
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

        agentListDiv.innerHTML = '';
        querySnapshot.forEach(doc => {
            const agent = doc.data();
            const agentId = doc.id;
            
            const agentElement = document.createElement('div');
            agentElement.classList.add('history-item');
            agentElement.innerHTML = `
                <p style="flex-grow: 1; margin: 0;"><strong>${agent.name}</strong></p>
                <button class="edit-agent-btn" data-id="${agentId}" data-name="${agent.name}" data-prompt="${agent.prompt}">Editar</button>
                <button class="delete-agent-btn" data-id="${agentId}" style="background-color: #c0392b;">Excluir</button>
            `;
            agentListDiv.appendChild(agentElement);
        });

        document.querySelectorAll('.delete-agent-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const agentId = e.target.dataset.id;
                if(confirm(`Tem a certeza que quer excluir o agente?`)) {
                    await db.collection('agents').doc(agentId).delete();
                    alert('Agente excluído!');
                    loadAdminAgents();
                }
            });
        });

        document.querySelectorAll('.edit-agent-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const agentId = e.target.dataset.id;
                // Usamos o getAttribute para pegar o valor exato, sem problemas de formatação
                const agentName = e.target.getAttribute('data-name');
                const agentPrompt = e.target.getAttribute('data-prompt');

                document.getElementById('form-title').textContent = 'Editar Agente';
                document.getElementById('agent-id-input').value = agentId;
                document.getElementById('agent-name-input').value = agentName;
                document.getElementById('agent-prompt-input').value = agentPrompt;

                document.getElementById('agent-form-container').style.display = 'block';
                document.getElementById('show-form-btn').style.display = 'none';
            });
        });
        
    } catch (error) {
        console.error("Erro ao carregar agentes:", error);
        agentListDiv.innerHTML = '<p>Ocorreu um erro ao carregar os agentes.</p>';
    }
}