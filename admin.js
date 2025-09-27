// admin.js - VERSÃO CORRIGIDA E FINAL

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
    
    // O botão de voltar foi movido para o auth.js, que é mais apropriado,
    // então a lógica dele foi removida daqui para evitar erros.

    showFormBtn.addEventListener('click', () => {
        agentForm.reset();
        document.getElementById('agent-id-input').value = '';
        document.getElementById('form-title').textContent = 'Criar Novo Agente';
        formContainer.style.display = 'block';
        showFormBtn.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        showFormBtn.style.display = 'block';
        agentForm.reset();
    });

    agentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const agentId = document.getElementById('agent-id-input').value;
        const agentName = document.getElementById('agent-name-input').value;
        const agentPrompt = document.getElementById('agent-prompt-input').value;
        
        if (!agentName || !agentPrompt) {
            alert('Nome e Prompt são obrigatórios.');
            return;
        }

        try {
            if (agentId) {
                const agentRef = db.collection('agents').doc(agentId);
                await agentRef.update({ name: agentName, prompt: agentPrompt });
                alert('Agente atualizado com sucesso!');
            } else {
                await db.collection('agents').add({ name: agentName, prompt: agentPrompt });
                alert('Agente criado com sucesso! Lembre-se de atribuir o ID deste agente a um usuário.');
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
                <button class="edit-agent-btn" data-id="${agentId}">Editar</button>
                <button class="delete-agent-btn" data-id="${agentId}" style="background-color: #c0392b;">Excluir</button>
            `;
            // Adiciona um listener de clique ao elemento inteiro para os dados
            agentElement.querySelector('.edit-agent-btn').addEventListener('click', () => {
                document.getElementById('form-title').textContent = 'Editar Agente';
                document.getElementById('agent-id-input').value = agentId;
                document.getElementById('agent-name-input').value = agent.name;
                document.getElementById('agent-prompt-input').value = agent.prompt;
                document.getElementById('agent-form-container').style.display = 'block';
                document.getElementById('show-form-btn').style.display = 'none';
            });
            
            agentElement.querySelector('.delete-agent-btn').addEventListener('click', async () => {
                 if(confirm(`Tem a certeza que quer excluir o agente "${agent.name}"?`)) {
                    await db.collection('agents').doc(agentId).delete();
                    alert('Agente excluído!');
                    loadAdminAgents();
                }
            });

            agentListDiv.appendChild(agentElement);
        });
        
    } catch (error) {
        console.error("Erro ao carregar agentes:", error);
        agentListDiv.innerHTML = '<p>Ocorreu um erro ao carregar os agentes.</p>';
    }
}