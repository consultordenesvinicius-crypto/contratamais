(() => {
  const conversationList = document.querySelector('#conversationList');
  const refreshConversationsButton = document.querySelector('#refreshConversations');
  const refreshMessagesButton = document.querySelector('#refreshMessages');
  const conversationTitle = document.querySelector('#conversationTitle');
  const conversationSubtitle = document.querySelector('#conversationSubtitle');
  const messageHistory = document.querySelector('#messageHistory');
  const environmentLabel = document.querySelector('#environmentLabel');

  const composerTabs = document.querySelectorAll('.composer-tab');
  const aiForm = document.querySelector('#aiForm');
  const manualForm = document.querySelector('#manualForm');
  const aiPromptField = document.querySelector('#aiPrompt');
  const manualMessageField = document.querySelector('#manualMessage');
  const toast = document.querySelector('#toast');

  let selectedConversation = null;
  let conversations = [];
  let environmentStatus = { hasOpenAI: false, hasWhatsApp: false };

  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function setEnvironmentLabel() {
    const parts = [];
    parts.push(environmentStatus.hasOpenAI ? 'OpenAI ✅' : 'OpenAI ❌');
    parts.push(environmentStatus.hasWhatsApp ? 'WhatsApp ✅' : 'WhatsApp ❌');
    environmentLabel.textContent = parts.join(' · ');
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch (error) {
      return iso;
    }
  }

  function renderConversations(items) {
    conversationList.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('li');
      empty.className = 'muted';
      empty.textContent = 'Nenhuma conversa registrada ainda.';
      conversationList.appendChild(empty);
      return;
    }

    const template = document.querySelector('#conversationItemTemplate');
    items.forEach((conversation) => {
      const node = template.content.firstElementChild.cloneNode(true);
      node.querySelector('.conversation-title').textContent = conversation.title || 'Contato';
      node.querySelector('.conversation-phone').textContent = conversation.phone;
      node.querySelector('.conversation-last').textContent = conversation.lastMessage || 'Sem mensagens';
      node.dataset.id = conversation.id;
      if (selectedConversation?.id === conversation.id) {
        node.classList.add('active');
      }

      node.addEventListener('click', () => {
        selectedConversation = conversation;
        renderConversations(conversations);
        loadMessages();
      });

      conversationList.appendChild(node);
    });
  }

  function renderMessages(messages) {
    messageHistory.innerHTML = '';
    if (!messages.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Ainda não há mensagens neste atendimento.';
      messageHistory.appendChild(empty);
      return;
    }

    const template = document.querySelector('#messageTemplate');
    messages
      .slice()
      .reverse()
      .forEach((message) => {
        const node = template.content.firstElementChild.cloneNode(true);
        node.classList.add(message.direction);
        node.querySelector('.message-body').textContent = message.body;
        node.querySelector('.message-meta').textContent = `${
          message.direction === 'outbound' ? 'Enviado' : 'Recebido'
        } • ${formatDate(message.createdAt)}${
          message.metadata?.simulated ? ' • Simulação' : ''
        }${message.status === 'error' ? ' • Erro' : ''}`;
        messageHistory.appendChild(node);
      });

    messageHistory.scrollTop = messageHistory.scrollHeight;
  }

  async function fetchJSON(url, options) {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || 'Erro desconhecido');
    }
    return response.json();
  }

  async function loadStatus() {
    try {
      const status = await fetchJSON('/api/status');
      environmentStatus = status;
      setEnvironmentLabel();
    } catch (error) {
      showToast('Não foi possível verificar o status das integrações.', 'warning');
    }
  }

  async function loadConversations() {
    refreshConversationsButton.disabled = true;
    try {
      const data = await fetchJSON('/api/conversations');
      conversations = data.conversations || [];
      renderConversations(conversations);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      refreshConversationsButton.disabled = false;
    }
  }

  async function loadMessages() {
    if (!selectedConversation) return;

    refreshMessagesButton.disabled = true;
    aiForm.querySelector('button').disabled = false;
    manualForm.querySelector('button').disabled = false;
    aiPromptField.disabled = false;
    manualMessageField.disabled = false;

    conversationTitle.textContent = selectedConversation.title || 'Contato';
    conversationSubtitle.textContent = `Telefone: ${selectedConversation.phone}`;

    try {
      const data = await fetchJSON(`/api/messages?conversationId=${selectedConversation.id}`);
      renderMessages(data.messages || []);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      refreshMessagesButton.disabled = false;
    }
  }

  async function submitAI(event) {
    event.preventDefault();
    if (!selectedConversation) return;
    const prompt = aiPromptField.value.trim();
    if (!prompt) {
      showToast('Descreva a pergunta do cliente para gerar a resposta.', 'warning');
      return;
    }

    aiForm.querySelector('button').disabled = true;
    try {
      const payload = {
        phone: selectedConversation.phone,
        prompt,
      };
      const data = await fetchJSON('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Resposta enviada com sucesso!');
      aiPromptField.value = '';
      await loadConversations();
      await loadMessages();
      console.log('AI Response', data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      aiForm.querySelector('button').disabled = false;
    }
  }

  async function submitManual(event) {
    event.preventDefault();
    if (!selectedConversation) return;
    const message = manualMessageField.value.trim();
    if (!message) {
      showToast('Digite uma mensagem para enviar.', 'warning');
      return;
    }

    manualForm.querySelector('button').disabled = true;
    try {
      const payload = {
        phone: selectedConversation.phone,
        message,
      };
      await fetchJSON('/api/messages/manual', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Mensagem enviada com sucesso!');
      manualMessageField.value = '';
      await loadConversations();
      await loadMessages();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      manualForm.querySelector('button').disabled = false;
    }
  }

  function switchTab(event) {
    const { mode } = event.target.dataset;
    if (!mode) return;

    composerTabs.forEach((tab) => tab.classList.remove('active'));
    event.target.classList.add('active');

    aiForm.classList.toggle('visible', mode === 'ai');
    manualForm.classList.toggle('visible', mode === 'manual');
  }

  async function bootstrap() {
    await loadStatus();
    await loadConversations();
  }

  refreshConversationsButton.addEventListener('click', loadConversations);
  refreshMessagesButton.addEventListener('click', loadMessages);
  aiForm.addEventListener('submit', submitAI);
  manualForm.addEventListener('submit', submitManual);
  composerTabs.forEach((tab) => tab.addEventListener('click', switchTab));

  bootstrap();
})();
