(function() {
  'use strict';

  // Widget configuration
  let config = {
    apiUrl: 'http://localhost:5000/api',
    primaryColor: '#2196F3',
    position: 'bottom-right',
    websiteId: 'default',
  };

  // Widget state
  let state = {
    isOpen: false,
    isMinimized: false,
    conversationId: null,
    messages: [],
    isLoading: false,
  };

  // Create widget HTML
  function createWidget() {
    const positions = {
      'bottom-right': 'bottom: 24px; right: 24px;',
      'bottom-left': 'bottom: 24px; left: 24px;',
      'top-right': 'top: 24px; right: 24px;',
      'top-left': 'top: 24px; left: 24px;',
    };

    const widgetHTML = `
      <div id="chat-widget" style="position: fixed; ${positions[config.position]} z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Chat Button -->
        <div id="chat-button" style="width: 64px; height: 64px; background: ${config.primaryColor}; border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span id="unread-count" style="position: absolute; top: -8px; right: -8px; background: #ff5722; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; display: none;">0</span>
        </div>

        <!-- Chat Window -->
        <div id="chat-window" style="width: 380px; height: 520px; background: white; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; display: none; flex-direction: column; overflow: hidden; margin-bottom: 80px;">
          <!-- Header -->
          <div id="chat-header" style="background: ${config.primaryColor}; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
              <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div>
                <div style="font-weight: 500; font-size: 14px;">Hỗ trợ khách hàng</div>
                <div style="font-size: 12px; opacity: 0.8; display: flex; align-items: center;">
                  <div style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; margin-right: 4px;"></div>
                  Đang hoạt động
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button id="minimize-btn" style="background: none; border: none; color: white; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4,14 10,14 10,20"></polyline>
                  <polyline points="20,10 14,10 14,4"></polyline>
                  <line x1="14" y1="10" x2="21" y2="3"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
              <button id="close-btn" style="background: none; border: none; color: white; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content Area -->
          <div id="chat-content" style="flex: 1; display: flex; flex-direction: column;">
            <!-- Pre-chat Form -->
            <div id="pre-chat-form" style="padding: 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 48px; height: 48px; background: #e3f2fd; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${config.primaryColor}" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </div>
                <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 4px;">Bắt đầu cuộc trò chuyện</h3>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Vui lòng cung cấp thông tin để được hỗ trợ tốt nhất</p>
              </div>

              <form id="contact-form" style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">Họ và tên *</label>
                  <input type="text" id="customer-name" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none;" placeholder="Nhập họ và tên">
                </div>
                <div>
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">Số điện thoại *</label>
                  <input type="tel" id="customer-phone" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none;" placeholder="Nhập số điện thoại">
                </div>
                <div>
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">Địa chỉ</label>
                  <input type="text" id="customer-address" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none;" placeholder="Nhập địa chỉ">
                </div>
                <div>
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">Loại yêu cầu</label>
                  <select id="request-type" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; background: white;">
                    <option value="">Chọn loại yêu cầu</option>
                    <option value="support">Hỗ trợ kỹ thuật</option>
                    <option value="sales">Tư vấn bán hàng</option>
                    <option value="complaint">Khiếu nại</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">Nội dung</label>
                  <textarea id="customer-content" rows="3" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none; resize: none;" placeholder="Mô tả vấn đề của bạn..."></textarea>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <input type="checkbox" id="agree-terms" required style="margin-top: 4px;">
                  <label for="agree-terms" style="font-size: 12px; color: #6b7280;">
                    Tôi đồng ý với <a href="#" style="color: ${config.primaryColor};">điều khoản sử dụng</a> và <a href="#" style="color: ${config.primaryColor};">chính sách bảo mật</a>
                  </label>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                  <button type="button" id="cancel-btn" style="flex: 1; padding: 8px 16px; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer; font-size: 14px;">Hủy</button>
                  <button type="submit" id="start-chat-btn" style="flex: 1; padding: 8px 16px; background: ${config.primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Bắt đầu chat</button>
                </div>
              </form>
            </div>

            <!-- Chat Messages -->
            <div id="chat-messages" style="flex: 1; padding: 16px; overflow-y: auto; background: #f9fafb; display: none;">
              <div id="messages-container"></div>
            </div>

            <!-- Message Input -->
            <div id="message-input-area" style="padding: 16px; border-top: 1px solid #e5e7eb; background: white; display: none;">
              <form id="message-form" style="display: flex; gap: 8px;">
                <input type="text" id="message-input" placeholder="Nhập tin nhắn..." style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; outline: none;">
                <button type="submit" style="padding: 8px 12px; background: ${config.primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }

  // Initialize event listeners
  function initEventListeners() {
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('close-btn');
    const minimizeBtn = document.getElementById('minimize-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const contactForm = document.getElementById('contact-form');
    const messageForm = document.getElementById('message-form');

    // Toggle chat window
    chatButton.addEventListener('click', () => {
      if (state.isMinimized) {
        state.isMinimized = false;
        chatWindow.style.height = '520px';
      } else {
        state.isOpen = !state.isOpen;
        chatWindow.style.display = state.isOpen ? 'flex' : 'none';
        chatButton.style.display = state.isOpen ? 'none' : 'flex';
      }
    });

    // Close chat
    closeBtn.addEventListener('click', () => {
      state.isOpen = false;
      chatWindow.style.display = 'none';
      chatButton.style.display = 'flex';
    });

    // Minimize chat
    minimizeBtn.addEventListener('click', () => {
      state.isMinimized = !state.isMinimized;
      chatWindow.style.height = state.isMinimized ? '64px' : '520px';
    });

    // Cancel form
    cancelBtn.addEventListener('click', () => {
      state.isOpen = false;
      chatWindow.style.display = 'none';
      chatButton.style.display = 'flex';
    });

    // Submit contact form
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleFormSubmit();
    });

    // Send message
    messageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await sendMessage();
    });
  }

  // Handle form submission
  async function handleFormSubmit() {
    const formData = {
      customerName: document.getElementById('customer-name').value,
      customerPhone: document.getElementById('customer-phone').value,
      customerAddress: document.getElementById('customer-address').value,
      requestType: document.getElementById('request-type').value,
      content: document.getElementById('customer-content').value,
    };

    if (!formData.customerName || !formData.customerPhone) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (!document.getElementById('agree-terms').checked) {
      alert('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    try {
      state.isLoading = true;
      const response = await fetch(`${config.apiUrl}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Không thể tạo cuộc trò chuyện');
      }

      const conversation = await response.json();
      state.conversationId = conversation.id;
      
      // Switch to chat view
      document.getElementById('pre-chat-form').style.display = 'none';
      document.getElementById('chat-messages').style.display = 'block';
      document.getElementById('message-input-area').style.display = 'block';
      
      // Load initial messages
      await loadMessages();
      
      // Start polling for new messages
      startMessagePolling();
      
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      state.isLoading = false;
    }
  }

  // Send message
  async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message || !state.conversationId) return;

    try {
      const response = await fetch(`${config.apiUrl}/conversations/${state.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'customer',
          senderName: 'Khách hàng',
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể gửi tin nhắn');
      }

      messageInput.value = '';
      await loadMessages();
      
    } catch (error) {
      alert('Lỗi gửi tin nhắn: ' + error.message);
    }
  }

  // Load messages
  async function loadMessages() {
    if (!state.conversationId) return;

    try {
      const response = await fetch(`${config.apiUrl}/conversations/${state.conversationId}/messages`);
      if (!response.ok) return;

      const messages = await response.json();
      displayMessages(messages);
      
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  // Display messages
  function displayMessages(messages) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';

    messages.forEach(msg => {
      const isAgent = msg.senderType === 'agent';
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;
        ${isAgent ? 'justify-content: flex-end;' : ''}
      `;

      const messageContent = `
        ${!isAgent ? `
          <div style="width: 24px; height: 24px; background: #d1d5db; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px; flex-shrink: 0;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        ` : ''}
        <div style="flex: 1; ${isAgent ? 'text-align: right;' : ''}">
          <div style="
            display: inline-block;
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 240px;
            font-size: 14px;
            ${isAgent 
              ? `background: ${config.primaryColor}; color: white; border-top-right-radius: 2px;`
              : 'background: #f3f4f6; color: #1f2937; border-top-left-radius: 2px;'
            }
          ">
            ${msg.message}
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            ${formatTime(msg.createdAt)}
          </div>
        </div>
        ${isAgent ? `
          <div style="width: 24px; height: 24px; background: ${config.primaryColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 8px; flex-shrink: 0; color: white; font-size: 10px; font-weight: bold;">
            AG
          </div>
        ` : ''}
      `;

      messageDiv.innerHTML = messageContent;
      container.appendChild(messageDiv);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  // Format time
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Start polling for messages
  function startMessagePolling() {
    setInterval(() => {
      if (state.conversationId && state.isOpen) {
        loadMessages();
      }
    }, 2000);
  }

  // Initialize widget
  function init(userConfig = {}) {
    // Merge user config with defaults
    config = { ...config, ...userConfig };
    
    // Create widget if not exists
    if (!document.getElementById('chat-widget')) {
      createWidget();
      initEventListeners();
    }
  }

  // Expose global ChatWidget object
  window.ChatWidget = {
    init: init,
    open: () => {
      state.isOpen = true;
      document.getElementById('chat-window').style.display = 'flex';
      document.getElementById('chat-button').style.display = 'none';
    },
    close: () => {
      state.isOpen = false;
      document.getElementById('chat-window').style.display = 'none';
      document.getElementById('chat-button').style.display = 'flex';
    },
    toggle: () => {
      if (state.isOpen) {
        window.ChatWidget.close();
      } else {
        window.ChatWidget.open();
      }
    }
  };

  // Auto-initialize if config is available
  if (window.ChatWidgetConfig) {
    init(window.ChatWidgetConfig);
  }
})();
