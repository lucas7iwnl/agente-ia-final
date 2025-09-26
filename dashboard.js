auth.onAuthStateChanged(user => {
    if (user) {
        loadUserAgents(user);
    } else {
        window.location.href = 'index.html';
    }
});

async function loadUserAgents(user) {
    const agentListDiv = document.getElementById('agent-list');
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists || !userDoc.data().agentesPermitidos || userDoc.data().agentesPermitidos.length === 0) {
            agentListDiv.innerHTML = '<p>Você ainda não tem acesso a nenhum agente.</p>';
            return;
        }

        const permittedAgentIds = userDoc.data().agentesPermitidos;
        agentListDiv.innerHTML = ''; 

        for (const agentId of permittedAgentIds) {
            const agentRef = db.collection('agents').doc(agentId);
            const agentDoc = await agentRef.get();

            if (agentDoc.exists) {
                const agentData = agentDoc.data();
                const agentButton = document.createElement('button');
                agentButton.textContent = `Aceder ao ${agentData.name}`;
                agentButton.classList.add('agent-button');
                agentButton.style.marginTop = '15px';
                agentButton.onclick = () => {
                    localStorage.setItem('selectedAgentId', agentId);
                    // A alteração está aqui: agora vai para agente.html
                    window.location.href = 'agente.html'; 
                };
                agentListDiv.appendChild(agentButton);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar agentes:", error);
        agentListDiv.innerHTML = '<p>Ocorreu um erro ao carregar os seus agentes.</p>';
    }
}