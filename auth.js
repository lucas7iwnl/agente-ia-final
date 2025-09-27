// auth.js - VERSÃO COM LOGIN POR ENTER

// A sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDHVQd_To0ihQzbxcX2_zUJ9pnh3snhR5M",
    authDomain: "plataforma-agenteis-ia.firebaseapp.com",
    projectId: "plataforma-agenteis-ia",
    storageBucket: "plataforma-agenteis-ia.appspot.com",
    messagingSenderId: "466485628265",
    appId: "1:466485628265:web:8969c2878e0f6b500b81f8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Lógica para a PÁGINA DE LOGIN (index.html)
if (document.getElementById('login-btn')) {
    const loginButton = document.getElementById('login-btn');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');

    // Função de login para ser reutilizada
    const handleLogin = () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        if (!email || !password) {
            errorMessage.textContent = 'Por favor, preencha todos os campos.';
            return;
        }
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => window.location.href = 'dashboard.html')
            .catch(error => errorMessage.textContent = 'Email ou senha inválidos.');
    };

    // Ação de clique
    loginButton.addEventListener('click', handleLogin);

    // AÇÃO PARA A TECLA ENTER
    passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });
    emailInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });
}

// Lógica para as páginas que precisam de logout (dashboard, agente)
if (document.getElementById('logout-btn')) {
    const logoutButton = document.getElementById('logout-btn');
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('selectedAgentId');
        localStorage.removeItem('selectedChatId');
        auth.signOut().then(() => window.location.href = 'index.html');
    });
}