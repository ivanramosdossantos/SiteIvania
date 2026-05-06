/**
 * Gemini Chat Integration for SiteIvania (Standard JS version for file:// support)
 */

// --- CONFIGURATION ---
const GEMINI_API_KEY = 'AIzaSyDUv7BFD8OcATlJ9imbsbz-CQaM6g936z4';

const SYSTEM_INSTRUCTION = `
Você é o Assistente Virtual da Ivânia Ramos Consultoria e Assessoria. Seu objetivo é ajudar clientes em potencial a entenderem os processos de consultoria.
Informações da Empresa:
- Missão: Promover o desenvolvimento de pessoas e organizações, transformando conhecimento em resultados.
- Visão: Ser referência nacional em gestão, estratégia e desenvolvimento organizacional.
- Serviços principais: Inovação, Melhoria de Processos (BPI), Planejamento Estratégico, Gestão de TI, MPS.BR/CMMI e RH.
- Localização: Pato Branco - PR.

Diretrizes:
- Seja sempre profissional, educado e acolhedor.
- Se o usuário perguntar sobre preços, peça para ele entrar em contato pelo formulário do site ou pelo telefone (46) 8402-4898.
- Responda de forma concisa mas informativa.
- Idioma: Português do Brasil.
`;

// --- UI LOGIC ---
(function() {
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

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: chatHistory,
                        systemInstruction: {
                            parts: [{ text: SYSTEM_INSTRUCTION }]
                        }
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
