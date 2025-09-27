// admin.js - VERSÃO COM BOTÃO VOLTAR

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
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn'); // Pega o botão "Voltar"

    // ADICIONADO: Lógica para o botão "Voltar ao Dashboard"
    backToDashboardBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
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

// A função loadAdminAgents e delete (se houver) continua igual
async function loadAdminAgents() {
    // ... (o conteúdo desta função permanece o mesmo da versão anterior)
}