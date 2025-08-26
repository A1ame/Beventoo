// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrCEGjGkJvXyVG6wIg42ypt875X5iu-Ew",
  authDomain: "bevento-6c7ac.firebaseapp.com",
  projectId: "bevento-6c7ac",
  storageBucket: "bevento-6c7ac.firebasestorage.app",
  messagingSenderId: "886093046112",
  appId: "1:886093046112:web:f187ffad1eaf808336be05",
  measurementId: "G-WTQR65W6VX"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Главный класс приложения
class FamilyChatApp {
    constructor() {
        this.currentUser = null;
        this.users = new Map();
        this.currentChatId = null;
        this.currentView = 'auth'; // 'auth', 'contacts' или 'chat'
        this.replyingToMessage = null; // Для отслеживания сообщения, на которое отвечаем
        this.init();
    }
    
    // Инициализация приложения
    async init() {
        this.initElements();
        this.bindEvents();
        await this.loadAllData();
        this.showSplashScreen();
    }
    
    // Получение элементов DOM
    initElements() {
        // Основные экраны
        this.splashScreen = document.getElementById('splashScreen');
        this.authScreen = document.getElementById('authScreen');
        this.app = document.getElementById('app');
        this.contactsScreen = document.getElementById('contactsScreen');
        this.chatScreen = document.getElementById('chatScreen');
        this.chatHeader = document.getElementById('chatHeader');
        // Элементы авторизации
        this.authForm = document.getElementById('authForm');
        this.authName = document.getElementById('authName');
        this.authPassword = document.getElementById('authPassword');
        this.createAccountLink = document.getElementById('createAccountLink');
        // Элементы контактов
        this.contactsList = document.getElementById('contactsList');
        this.searchInput = document.getElementById('searchInput');
        this.tabs = document.querySelectorAll('.tab');
        this.addFriendBtn = document.getElementById('addFriendBtn');
        this.userName = document.getElementById('userName');
        this.userStatus = document.getElementById('userStatus');
        this.userAvatar = document.getElementById('userAvatar');
        // Элементы чата
        this.backBtn = document.getElementById('backBtn');
        this.chatName = document.getElementById('chatName');
        this.chatStatus = document.getElementById('chatStatus');
        this.chatAvatar = document.getElementById('chatAvatar');
        this.callBtn = document.getElementById('callBtn');
        this.videoBtn = document.getElementById('videoBtn');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.attachBtn = document.getElementById('attachBtn');
        this.emojiBtn = document.getElementById('emojiBtn');
        // Модальное окно
        this.addFriendModal = document.getElementById('addFriendModal');
        this.friendUsername = document.getElementById('friendUsername');
        this.friendCode = document.getElementById('friendCode');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.addBtn = document.getElementById('addBtn');
        // Уведомления
        this.notification = document.getElementById('notification');
        this.notificationContent = document.getElementById('notificationContent');
    }
    
    // Привязка событий
    bindEvents() {
        // Авторизация
        this.authForm.addEventListener('submit', (e) => this.handleAuth(e));
        // Создание аккаунта
        this.createAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCreateAccount();
        });
        // Навигация
        this.backBtn.addEventListener('click', () => this.showContactsView());
        // Контакты
        this.contactsList.addEventListener('click', (e) => this.handleContactClick(e));
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleTabChange(tab));
        });
        // Чат
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('input', () => this.handleInputResize());
        this.messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        this.callBtn.addEventListener('click', () => this.startCall());
        this.videoBtn.addEventListener('click', () => this.startVideoCall());
        this.attachBtn.addEventListener('click', () => this.attachFile());
        this.emojiBtn.addEventListener('click', () => this.showEmojiPicker());
        // Модальное окно
        this.addFriendBtn.addEventListener('click', () => this.openAddFriendModal());
        this.closeModalBtn.addEventListener('click', () => this.closeAddFriendModal());
        this.cancelBtn.addEventListener('click', () => this.closeAddFriendModal());
        this.addBtn.addEventListener('click', () => this.addFriend());
        this.addFriendModal.addEventListener('click', (e) => {
            if (e.target === this.addFriendModal) {
                this.closeAddFriendModal();
            }
        });
        // Предотвращение масштабирования при фокусе на input
        this.preventZoomOnInput();
        // Обработка изменения ориентации
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
        // Обработка кликов по сообщениям для ответа
        this.messagesContainer.addEventListener('click', (e) => this.handleMessageClick(e));
    }
    
    // Показ экрана загрузки
    showSplashScreen() {
        setTimeout(() => {
            this.splashScreen.style.display = 'none';
            if (this.currentUser) {
                this.showMainApp();
            } else {
                this.showAuthScreen();
            }
        }, 2500);
    }
    
    // Показ экрана авторизации
    showAuthScreen() {
        this.authScreen.style.display = 'flex';
        this.app.style.display = 'none';
    }
    
    // Показ основного приложения
    showMainApp() {
        this.authScreen.style.display = 'none';
        this.app.style.display = 'flex';
        this.showContactsView();
    }
    
    // Показ списка контактов
    showContactsView() {
        this.currentView = 'contacts';
        this.contactsScreen.style.display = 'flex';
        this.chatScreen.style.display = 'none';
        this.chatHeader.style.display = 'none';
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        // Обновляем информацию о текущем пользователе
        if (this.currentUser) {
            this.userName.textContent = this.currentUser.name;
            this.userStatus.textContent = 'В сети';
            this.userAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
        
        // Загружаем контакты
        this.loadContacts();
    }
    
    // Показ чата
    showChatView(contactId) {
        this.currentChatId = contactId;
        this.currentView = 'chat';
        this.contactsScreen.style.display = 'none';
        this.chatScreen.style.display = 'flex';
        this.chatHeader.style.display = 'flex';
        document.body.style.background = '#f8f9fa';
        this.updateChatHeader();
        this.loadMessages();
        this.scrollToBottom();
    }
    
    // Обработка клика по контакту
    handleContactClick(e) {
        const contactItem = e.target.closest('.contact-item');
        if (contactItem) {
            const contactId = contactItem.dataset.contact;
            this.showChatView(contactId);
            this.addHapticFeedback();
        }
    }
    
    // Обновление заголовка чата
    updateChatHeader() {
        if (this.currentChatId === 'favorite') {
            this.chatName.textContent = 'Избранное';
            this.chatStatus.textContent = 'Список друзей';
            this.chatAvatar.textContent = '⭐';
        } else {
            const user = this.users.get(this.currentChatId);
            if (user) {
                this.chatName.textContent = user.name;
                this.chatStatus.textContent = user.status || 'Не в сети';
                this.chatAvatar.textContent = user.name.charAt(0).toUpperCase();
            }
        }
    }
    
    // Загрузка контактов
    loadContacts() {
        this.contactsList.innerHTML = '';
        
        // Добавляем "Избранное" как первый контакт
        const favoriteContact = document.createElement('div');
        favoriteContact.className = 'contact-item';
        favoriteContact.dataset.contact = 'favorite';
        favoriteContact.innerHTML = `
            <div class="contact-avatar">⭐</div>
            <div class="contact-info">
                <div class="contact-name">Избранное</div>
                <div class="contact-last-message">Добавьте друзей</div>
            </div>
            <div class="contact-meta">
                <div class="contact-time">Сейчас</div>
            </div>
        `;
        this.contactsList.appendChild(favoriteContact);
        
        // Загружаем друзей из базы данных
        this.loadFriendsFromDatabase();
    }
    
    // Загрузка друзей из базы данных
    async loadFriendsFromDatabase() {
        try {
            const usersSnapshot = await db.collection('users').get();
            this.users = new Map();
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                this.users.set(userData.id, userData);
            });
            
            // Обновляем список контактов
            this.loadContacts();
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }
    
    // Загрузка сообщений
    async loadMessages() {
        if (!this.currentChatId) return;
        
        try {
            const messages = await this.loadMessagesFromFirebase(this.currentChatId);
            this.messagesContainer.innerHTML = '';
            messages.forEach(message => {
                this.addMessageToDOM(message);
            });
        } catch (error) {
            console.error('Error loading messages:', error);
            this.messagesContainer.innerHTML = '<div class="message incoming"><div class="message-content"><div class="message-text">Ошибка загрузки сообщений</div></div></div>';
        }
    }
    
    // Получение сообщений для чата из Firebase
    async loadMessagesFromFirebase(chatId) {
        try {
            const doc = await db.collection('chats').doc(chatId).get();
            if (doc.exists) {
                return doc.data().messages || [];
            }
            return [];
        } catch (error) {
            console.error('Error loading messages from Firebase:', error);
            return [];
        }
    }
    
    // Добавление сообщения в DOM
    addMessageToDOM(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.incoming ? 'incoming' : 'outgoing'}`;
        messageElement.dataset.messageId = message.id;
        
        // Если это ответ на сообщение
        let replyInfo = '';
        if (message.replyTo) {
            replyInfo = `
                <div class="reply-preview">
                    <div class="reply-sender">${message.replyTo.sender}</div>
                    <div class="reply-text">${message.replyTo.text}</div>
                </div>
            `;
        }
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${replyInfo}
                <div class="message-text">${message.text}</div>
                <div class="message-time">${message.time}</div>
                <div class="message-actions">
                    <button class="reply-btn" data-message-id="${message.id}">Ответить</button>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(messageElement);
    }
    
    // Обработка клика по сообщению
    handleMessageClick(e) {
        const replyBtn = e.target.closest('.reply-btn');
        if (replyBtn) {
            const messageId = replyBtn.dataset.messageId;
            this.startReplyingToMessage(messageId);
        }
    }
    
    // Начать отвечать на сообщение
    startReplyingToMessage(messageId) {
        // Находим сообщение по ID (в реальном приложении нужно загрузить из Firebase)
        const messages = this.getMessagesForChat(this.currentChatId);
        const targetMessage = messages.find(msg => msg.id == messageId);
        
        if (!targetMessage) return;
        
        // Устанавливаем режим ответа
        this.replyingToMessage = {
            id: messageId,
            text: targetMessage.text,
            sender: targetMessage.incoming ? 
                this.users.get(this.currentChatId)?.name || 'Пользователь' : 
                'Вы'
        };
        
        // Добавляем префикс в поле ввода
        this.messageInput.value = `> @${this.replyingToMessage.sender}: ${this.replyingToMessage.text}\n\n`;
        this.messageInput.focus();
        this.handleInputResize();
        
        // Показываем индикатор ответа
        this.showNotification(`💬 Отвечаете на сообщение от ${this.replyingToMessage.sender}`);
    }
    
    // Получение сообщений для чата (демо данные для тестирования)
    getMessagesForChat(chatId) {
        // Возвращаем пустой массив для работы с базой данных
        return [];
    }
    
    // Отправка сообщения
    async sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;
        
        // Проверяем, есть ли ответ на сообщение
        let replyTo = null;
        if (this.replyingToMessage) {
            replyTo = {
                id: this.replyingToMessage.id,
                text: this.replyingToMessage.text,
                sender: this.replyingToMessage.sender
            };
        }
        
        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const message = {
            id: Date.now(),
            text: text,
            time: currentTime,
            incoming: false,
            replyTo: replyTo,
            senderId: this.currentUser?.id,
            senderName: this.currentUser?.name
        };
        
        this.addMessageToDOM(message);
        this.messageInput.value = '';
        this.handleInputResize();
        this.scrollToBottom();
        this.addHapticFeedback();
        
        // Сохраняем сообщение в Firebase
        try {
            const currentMessages = await this.loadMessagesFromFirebase(this.currentChatId);
            currentMessages.push(message);
            await this.saveMessagesToFirebase(this.currentChatId, currentMessages);
        } catch (error) {
            console.error('Error saving message:', error);
        }
        
        // Сбрасываем режим ответа
        this.replyingToMessage = null;
        
        // Эмуляция ответа
        setTimeout(() => this.simulateReply(), 1000 + Math.random() * 2000);
    }
    
    // Сохранение сообщений в Firebase
    async saveMessagesToFirebase(chatId, messages) {
        try {
            await db.collection('chats').doc(chatId).set({
                messages: messages,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving messages to Firebase:', error);
        }
    }
    
    // Эмуляция ответа
    async simulateReply() {
        const replies = [
            'Понятно! ❤️',
            'Хорошо!',
            'Договорились 😊',
            'Увидимся!',
            'Береги себя!',
            'Люблю тебя! 💕'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const replyMessage = {
            id: Date.now(),
            text: randomReply,
            time: currentTime,
            incoming: true
        };
        
        this.addMessageToDOM(replyMessage);
        this.scrollToBottom();
        this.showNotification('Новое сообщение');
        
        // Сохраняем ответ в Firebase
        try {
            const currentMessages = await this.loadMessagesFromFirebase(this.currentChatId);
            currentMessages.push(replyMessage);
            await this.saveMessagesToFirebase(this.currentChatId, currentMessages);
        } catch (error) {
            console.error('Error saving reply:', error);
        }
    }
    
    // Прокрутка к низу чата
    scrollToBottom() {
        setTimeout(() => {
            if (this.messagesContainer && this.messagesContainer.scrollHeight > 0) {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        }, 100);
    }
    
    // Обработка авторизации
    async handleAuth(e) {
        e.preventDefault();
        const name = this.authName.value.trim();
        const password = this.authPassword.value.trim();
        
        if (!name || !password) {
            this.showNotification('⚠️ Заполните все поля');
            return;
        }
        
        try {
            // Пытаемся войти
            const userCredential = await auth.signInWithEmailAndPassword(name, password);
            const user = userCredential.user;
            
            // Загружаем информацию о пользователе
            await this.loadCurrentUserFromFirebase(user.uid);
            this.showMainApp();
            this.showNotification('✅ Вход успешен');
        } catch (error) {
            console.error('Auth error:', error);
            this.showNotification('❌ Ошибка авторизации');
        }
    }
    
    // Обработка создания аккаунта
    async handleCreateAccount() {
        const name = this.authName.value.trim();
        const password = this.authPassword.value.trim();
        
        if (!name || !password) {
            this.showNotification('⚠️ Заполните все поля');
            return;
        }
        
        try {
            // Регистрируем нового пользователя
            const userCredential = await auth.createUserWithEmailAndPassword(name, password);
            const user = userCredential.user;
            
            // Создаем пользователя в Firestore
            this.currentUser = {
                id: user.uid,
                name: name,
                username: name.toLowerCase().replace(/\s+/g, '_'),
                inviteCode: this.generateInviteCode(name),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.saveCurrentUserToFirebase();
            this.showMainApp();
            this.showNotification('✅ Регистрация успешна');
        } catch (error) {
            console.error('Create account error:', error);
            this.showNotification('❌ Ошибка регистрации');
        }
    }
    
    // Генерация уникального кода
    generateInviteCode(name) {
        // Генерируем простой код из имени пользователя
        const cleanName = name.replace(/[^a-zA-Zа-яА-Я]/g, '').toLowerCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${cleanName.substring(0, 3).toUpperCase()}${randomNum}`;
    }
    
    // Сохранение текущего пользователя в Firebase
    async saveCurrentUserToFirebase() {
        if (this.currentUser) {
            try {
                await db.collection('users').doc(this.currentUser.id).set({
                    ...this.currentUser,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (error) {
                console.error('Error saving user to Firebase:', error);
            }
        }
    }
    
    // Загрузка текущего пользователя из Firebase
    async loadCurrentUserFromFirebase(userId) {
        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                this.currentUser = doc.data();
                return this.currentUser;
            }
        } catch (error) {
            console.error('Error loading user from Firebase:', error);
        }
        return null;
    }
    
    // Загрузка всех данных
    async loadAllData() {
        try {
            // Загружаем пользователей из Firebase
            const usersSnapshot = await db.collection('users').get();
            this.users = new Map();
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                this.users.set(userData.id, userData);
            });
        } catch (error) {
            console.error('Error loading all data:', error);
        }
    }
    
    // Обработка изменения размера поля ввода
    handleInputResize() {
        this.messageInput.style.height = 'auto';
        const scrollHeight = this.messageInput.scrollHeight;
        const maxHeight = 100;
        this.messageInput.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        // Активация/деактивация кнопки отправки
        if (this.messageInput.value.trim()) {
            this.sendBtn.disabled = false;
        } else {
            this.sendBtn.disabled = true;
        }
    }
    
    // Обработка нажатия клавиш
    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }
    
    // Поиск контактов
    handleSearch(query) {
        const contacts = document.querySelectorAll('.contact-item');
        const searchTerm = query.toLowerCase();
        contacts.forEach(contact => {
            const name = contact.querySelector('.contact-name').textContent.toLowerCase();
            const shouldShow = name.includes(searchTerm);
            contact.style.display = shouldShow ? 'flex' : 'none';
        });
    }
    
    // Переключение вкладок
    handleTabChange(activeTab) {
        this.tabs.forEach(tab => tab.classList.remove('active'));
        activeTab.classList.add('active');
        const tabType = activeTab.dataset.tab;
        this.filterContacts(tabType);
        this.addHapticFeedback();
    }
    
    // Фильтрация контактов
    filterContacts(type) {
        // В реальном приложении здесь будет логика фильтрации
        console.log('Фильтрация по типу:', type);
    }
    
    // Звонки
    startCall() {
        const userName = this.users.get(this.currentChatId)?.name || 'пользователю';
        this.showNotification(`📞 Звоним ${userName}...`);
        this.addHapticFeedback();
    }
    
    startVideoCall() {
        const userName = this.users.get(this.currentChatId)?.name || 'пользователю';
        this.showNotification(`📹 Видеозвонок с ${userName}...`);
        this.addHapticFeedback();
    }
    
    // Прикрепление файлов
    attachFile() {
        this.showNotification('📎 Функция прикрепления файлов в разработке');
        this.addHapticFeedback();
    }
    
    // Эмодзи
    showEmojiPicker() {
        const emojis = ['😊', '❤️', '😄', '👍', '🎉', '💕', '😍', '👋'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        this.messageInput.value += randomEmoji;
        this.handleInputResize();
        this.addHapticFeedback();
    }
    
    // Модальное окно добавления друга
    openAddFriendModal() {
        this.addFriendModal.classList.add('active');
        this.friendUsername.focus();
        this.addHapticFeedback();
    }
    
    closeAddFriendModal() {
        this.addFriendModal.classList.remove('active');
        this.friendUsername.value = '';
        this.friendCode.value = '';
    }
    
    // Добавление друга
    async addFriend() {
        const username = this.friendUsername.value.trim();
        const code = this.friendCode.value.trim();
        if (!username || !code) {
            this.showNotification('⚠️ Заполните все поля');
            return;
        }
        
        try {
            // Создаем нового пользователя
            const newUser = {
                id: `user_${Date.now()}`,
                name: username,
                username: `friend_${code}`,
                inviteCode: code,
                status: 'Не в сети',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Сохраняем в Firebase
            await db.collection('users').doc(code).set(newUser);
            
            this.users.set(code, newUser);
            this.loadContacts();
            this.showNotification(`✅ Друг добавлен: ${newUser.name}`);
            this.closeAddFriendModal();
            this.addHapticFeedback();
        } catch (error) {
            console.error('Error adding friend:', error);
            this.showNotification('❌ Ошибка добавления друга');
        }
    }
    
    // Уведомления
    showNotification(message) {
        this.notificationContent.textContent = message;
        this.notification.classList.add('show');
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
    
    // Тактильная обратная связь
    addHapticFeedback() {
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
    
    // Предотвращение масштабирования при фокусе на input
    preventZoomOnInput() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Временно отключаем масштабирование
                const viewport = document.querySelector('meta[name=viewport]');
                const content = viewport.getAttribute('content');
                viewport.setAttribute('content', content + ', maximum-scale=1.0');
                setTimeout(() => {
                    viewport.setAttribute('content', content);
                }, 500);
            });
        });
    }
    
    // Обработка изменения ориентации
    handleOrientationChange() {
        // Принудительная перерисовка для корректного отображения
        document.body.style.height = '100vh';
        setTimeout(() => {
            if (this.currentView === 'chat') {
                this.scrollToBottom();
            }
        }, 300);
    }
    
    // Регистрация Service Worker для PWA
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
    }
    
    // Обработка push-уведомлений
    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Разрешение на уведомления получено');
                }
            });
        }
    }
    
    // Симуляция получения сообщения
    simulateIncomingMessage() {
        const messages = [
            'Привет! Как дела?',
            'Что делаешь?',
            'Увидимся скоро! ❤️',
            'Не забудь про встречу завтра'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        if (this.currentView === 'chat') {
            const message = {
                id: Date.now(),
                text: randomMessage,
                time: currentTime,
                incoming: true
            };
            this.addMessageToDOM(message);
            this.scrollToBottom();
        }
        this.showNotification('💬 Новое сообщение');
        this.addHapticFeedback();
        // Показ системного уведомления
        if (Notification.permission === 'granted') {
            new Notification('FamilyChat', {
                body: randomMessage,
                icon: './icon-192.png',
                badge: './icon-192.png'
            });
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    const app = new FamilyChatApp();
    // Запрос разрешений
    app.requestNotificationPermission();
    app.registerServiceWorker();
    // Периодическая симуляция входящих сообщений (только для демо)
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% вероятность
            app.simulateIncomingMessage();
        }
    }, 30000); // каждые 30 секунд
    console.log('FamilyChat приложение запущено!');
});

// Обработка событий приложения
window.addEventListener('beforeunload', () => {
    // Сохранение состояния приложения
    console.log('Приложение закрывается...');
});

// Обработка возврата в приложение
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Приложение активно');
    } else {
        console.log('Приложение в фоне');
    }
});

// Утилиты для работы с датами
class DateUtils {
    static formatTime(date) {
        return new Intl.DateTimeFormat('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
    static formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Вчера';
        } else {
            return new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'short'
            }).format(date);
        }
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FamilyChatApp, DateUtils };
}