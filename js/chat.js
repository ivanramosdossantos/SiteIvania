/**
 * Gemini Chat Integration for SiteIvania (Standard JS version for file:// support)
 */

// --- CONFIGURATION ---
const GEMINI_API_KEY = 'AIzaSyC7g_6egN3pjQ-AeFhVE4bM8lcSeHdgByM';

const SYSTEM_INSTRUCTION = `
Você é o Consultor Virtual da Ivânia Ramos Consultoria. Sua missão é ser direto, profissional e focado em converter o contato em um lead.

DIRETRIZES CRÍTICAS DE ESTILO:
- NUNCA use asteriscos (**) ou qualquer formatação markdown. Envie apenas texto puro.
- Seja EXTREMAMENTE conciso. Respostas curtas são melhores.
- Faça apenas UMA pergunta por vez para não sobrecarregar o cliente.
- Evite elogios excessivos ou introduções longas. Vá direto ao ponto.

BASE DE CONHECIMENTO:
- Missão: Transformar conhecimento em resultados.
- Serviços: Inovação, Melhoria de Processos (BPI), Planejamento Estratégico, Gestão de TI, MPS.BR/CMMI e RH.
- Autoridade: +10.000h de consultoria, 75 clientes atendidos, 15 certificações.
- Time: Ivânia (CEO/Processos), Heloiza (Inovação/BPI), Ivan (Tecnologia).

FLUXO DA CONVERSA:
1. Entenda o setor e tamanho da empresa.
2. Identifique o maior problema atual.
3. Sugira uma solução breve (ex: BPI para gargalos, Scrum para agilidade).
4. Peça o contato (Nome, Empresa, Telefone) para uma análise humana detalhada.
- Contato: (46) 8402-4898.
- Localização: Pato Branco - PR.
`;

// --- UI LOGIC ---
(function () {
    // We use a self-executing function instead of DOMContentLoaded to be more robust
    const init = () => {
        const chatBtn = document.getElementById('gemini-chat-btn');
        const chatWindow = document.getElementById('gemini-chat-window');
        const closeBtn = document.getElementById('gemini-chat-close');
        const chatForm = document.getElementById('gemini-chat-form');
        const chatInput = document.getElementById('gemini-chat-input');
        const messagesContainer = document.getElementById('gemini-chat-messages');

        if (!chatBtn || !chatWindow) return;

        let chatHistory = [];

        // Toggle Chat
        chatBtn.onclick = () => {
            chatWindow.classList.toggle('active');
            if (chatWindow.classList.contains('active')) {
                chatInput.focus();
                if (messagesContainer.children.length === 0) {
                    addMessage("Olá! Sou o assistente virtual da Ivânia Ramos Consultoria. Como posso ajudar você hoje com suas dúvidas sobre nossos serviços?", "bot");
                }
            }
        };

        closeBtn.onclick = () => {
            chatWindow.classList.remove('active');
        };

        // Handle Sending Messages
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            chatInput.value = '';

            chatHistory.push({ role: "user", parts: [{ text: message }] });
            await handleBotResponse(message);
        };

        function addMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${sender}`;
            msgDiv.textContent = text;
            messagesContainer.appendChild(msgDiv);
            scrollToBottom();
        }

        function addTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.id = 'bot-typing';
            indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
            messagesContainer.appendChild(indicator);
            scrollToBottom();
        }

        function removeTypingIndicator() {
            const indicator = document.getElementById('bot-typing');
            if (indicator) indicator.remove();
        }

        function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        async function handleBotResponse(userMsg) {
            addTypingIndicator();

            // Preparar as mensagens para a API
            let messages = [...chatHistory];

            // Adicionar instrução do sistema como a primeira mensagem se for um novo chat
            // Usamos o formato de 'user' + 'model' para simular a instrução se o campo direto falhar
            if (messages.length === 1) { // Só a mensagem do usuário
                messages = [
                    { role: "user", parts: [{ text: "INSTRUÇÃO DE SISTEMA: " + SYSTEM_INSTRUCTION }] },
                    { role: "model", parts: [{ text: "Entendido. Atuarei como o Assistente Virtual da Ivânia Ramos Consultoria seguindo todas as diretrizes." }] },
                    ...chatHistory
                ];
            }

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: messages
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("API Error Response:", errorData);
                    throw new Error(errorData.error ? errorData.error.message : 'Erro na API');
                }

                const data = await response.json();

                removeTypingIndicator();

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    const botText = data.candidates[0].content.parts[0].text;
                    addMessage(botText, 'bot');
                    chatHistory.push({ role: "model", parts: [{ text: botText }] });
                } else {
                    throw new Error('Invalid response from API');
                }

            } catch (error) {
                console.error("Gemini Error:", error);
                removeTypingIndicator();

                let errorMessage = "Ocorreu um erro ao processar sua pergunta.";
                if (window.location.protocol === 'file:') {
                    errorMessage += " Nota: APIs como a do Gemini costumam bloquear chamadas vindas de arquivos locais (file://). Tente rodar o site em um servidor local (ex: Live Server no VS Code).";
                } else {
                    errorMessage += " Por favor, tente novamente mais tarde.";
                }

                addMessage(errorMessage, "bot");
            }
        }
    };

    // Try to init immediately, or wait if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
