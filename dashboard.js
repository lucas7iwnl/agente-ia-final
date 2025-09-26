auth.onAuthStateChanged(user => {
    if (user) {
        // O utilizador está logado, vamos mostrar o agente.
        loadHardcodedAgent();
    } else {
        window.location.href = 'index.html';
    }
});

function loadHardcodedAgent() {
    const agentListDiv = document.getElementById('agent-list');
    agentListDiv.innerHTML = ''; // Limpa a mensagem "A carregar..."

    // Criamos o botão diretamente, sem ler o banco de dados
    const agentButton = document.createElement('button');
    agentButton.textContent = 'Aceder ao Detetive de Competências';
    agentButton.classList.add('agent-button');
    agentButton.style.marginTop = '15px';
    agentButton.onclick = () => {
        // Guardamos o ID do agente que o backend espera
        localStorage.setItem('selectedAgentId', 'corretor-enem');
        window.location.href = 'agente.html';
    };
    agentListDiv.appendChild(agentButton);
}