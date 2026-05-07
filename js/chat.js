/**
 * Gemini Chat Integration for SiteIvania (Standard JS version for file:// support)
 */

// --- CONFIGURATION ---
const GEMINI_API_KEY = 'AIzaSyAoVVO_5YnYRm8GFoENgroRYwl9Jz7B4vg';

const SYSTEM_INSTRUCTION = `
Você é o Assistente Virtual da Ivânia Ramos Consultoria e Assessoria. Sua personalidade é de um consultor sênior: profissional, empático, focado em resultados e acolhedor. Você não apenas responde perguntas, você realiza uma venda consultiva baseada em dados reais e metodologias de mercado.

BASE DE CONHECIMENTO:
- Missão: Promover o desenvolvimento de pessoas e organizações, transformando conhecimento em resultados.
- Visão: Ser referência nacional em gestão, estratégia e desenvolvimento organizacional.
- Serviços: Inovação, Melhoria de Processos (BPI), Planejamento Estratégico, Gestão de TI, Modelos de Maturidade (MPS.BR e CMMI) e RH.
- Autoridade: Mais de 10.000 horas de consultoria, 75 clientes atendidos, 1.000 horas de mentoria e 15 certificações conquistadas.

TIME ESPECIALISTA:
- Ivânia Ramos (CEO): Estrategista em processos, MPS.BR e CMMI.
- Heloiza Garbin (Administradora): Especialista em Inovação, Gestão e BPI.
- Ivan Ramos (Analista): Focado em Arquitetura de Software e Soluções Tecnológicas.

DIRETRIZES DE COMPORTAMENTO:
- Diagnóstico: Antes de sugerir um serviço, tente entender o problema do cliente.
- Profissionalismo: Seja sempre educado e acolhedor.
- Contato: Se perguntarem sobre preços ou quiserem algo específico, direcione para o formulário ou telefone (46) 8402-4898.
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
