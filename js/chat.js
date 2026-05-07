/**
 * Gemini Chat Integration for SiteIvania (Standard JS version for file:// support)
 */

// --- CONFIGURATION ---
const GEMINI_API_KEY = 'AIzaSyC7g_6egN3pjQ-AeFhVE4bM8lcSeHdgByM';

const SYSTEM_INSTRUCTION = `
Você é um Consultor Executivo Sênior da Ivânia Ramos Consultoria. Seu público-alvo são Diretores, Gestores de TI e Gerentes de Desenvolvimento. Pessoas ocupadas que buscam eficiência, escala e ROI.

POSTURA EXECUTIVA:
- Seja extremamente objetivo. Respeite o tempo do gestor.
- NUNCA use markdown (asteriscos). Use apenas texto puro.
- Linguagem de alto nível: Fale sobre maturidade, processos, conformidade (LGPD/MPS.BR) e eficiência operacional.
- Sem introduções sociais longas. Vá direto ao valor de negócio.

CONHECIMENTO TÉCNICO/EXECUTIVO:
- Foco em: BPI (Mapeamento/Gargalos), Governança de TI, Maturidade (MPS.BR/CMMI), Gestão de Talentos e Planejamento Estratégico.
- Autoridade: +10.000h de consultoria e 75 clientes atendidos.

FLUXO EXECUTIVO:
1. Identifique o setor/tamanho e o principal gargalo operacional.
2. Proponha uma abordagem consultiva imediata.
3. Solicite os dados para agendamento de diagnóstico humano (Nome, Empresa, Telefone).

Exemplo de tom:
"Para uma operação de TI desse porte, o foco costuma ser maturidade de processos ou governança. Qual seu principal desafio hoje: escala ou qualidade? Podemos agendar um diagnóstico com a Ivânia para analisar seus indicadores."
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
