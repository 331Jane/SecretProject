// Firebase config and data management
let cards = [];
let useFirebase = false;
let db = null;
let editingCardId = null; // Track which card is being edited
const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB limit

// Firebase config (hardcoded)
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBTlb3VofnlMFuBJBHfKYC8y---IXxRNt8",
    authDomain: "secretproject-b70ea.firebaseapp.com",
    projectId: "secretproject-b70ea",
    storageBucket: "secretproject-b70ea.firebasestorage.app",
    messagingSenderId: "661631407740",
    appId: "1:661631407740:web:c007f79ab41232e61a9bf9",
    databaseURL: "https://secretproject-b70ea-default-rtdb.firebaseio.com"
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupFormListener();
});

// 初始化应用
function initializeApp() {
    const firebaseConfig = localStorage.getItem('firebaseConfig');
    
    if (firebaseConfig) {
        try {
            const config = JSON.parse(firebaseConfig);
            initializeFirebase(config);
        } catch (error) {
            console.error('Firebase config error:', error);
            // Fallback to hardcoded config
            initializeFirebase(FIREBASE_CONFIG);
        }
    } else {
        // Use hardcoded Firebase config
        initializeFirebase(FIREBASE_CONFIG);
    }
}

// Initialize Firebase
function initializeFirebase(config) {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        db = firebase.database();
        useFirebase = true;
        updateSyncStatus('Connecting...', 'default');
        
        console.log('Firebase initialized successfully');
        console.log('Project ID:', config.projectId);
        
        // Load data from Realtime Database
        loadCardsFromFirebase();
    } catch (error) {
        console.error('Firebase initialization error:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        
        useFirebase = false;
        loadCards();
        renderCards();
        updateSyncStatus('Firebase Failed', 'error');
        
        // Show detailed error
        alert('Firebase connection failed:\n\n' + error.message + '\n\nPlease ensure:\n1. Realtime Database is created\n2. Network connection is stable\n3. Check browser console for more info');
    }
}

// 从 localStorage 加载卡片
function loadCards() {
    const savedCards = localStorage.getItem('cards');
    if (savedCards) {
        cards = JSON.parse(savedCards);
    } else {
        cards = [];
    }
}

// Load cards from Realtime Database
function loadCardsFromFirebase() {
    if (!db) return;
    
    const cardsRef = db.ref('cards');
    
    cardsRef.on('value', (snapshot) => {
        cards = [];
        const data = snapshot.val();
        
        if (data) {
            // Convert object to array and sort by timestamp (newest first)
            Object.keys(data).forEach((key) => {
                cards.unshift({
                    id: key,
                    ...data[key]
                });
            });
            cards.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        
        renderCards();
        updateSyncStatus('Connected', 'connected');
        console.log('Loaded', cards.length, 'cards from Firebase');
    }, (error) => {
        console.error('Firebase load error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        updateSyncStatus('Connection Failed', 'error');
        
        // Fallback to local storage
        loadCards();
        renderCards();
    });
}

// Save cards to localStorage
function saveCards() {
    localStorage.setItem('cards', JSON.stringify(cards));
}

// Save card to Realtime Database
function saveCardsToFirebase(cardData) {
    if (!db) return Promise.reject('Firebase not initialized');
    
    return db.ref('cards').push({
        title: cardData.title,
        description: cardData.description,
        image: cardData.image,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

// Delete card from Realtime Database
function deleteCardFromFirebase(cardId) {
    if (!db) return Promise.reject('Firebase not initialized');
    
    return db.ref('cards/' + cardId).remove();
}

// Update card in Realtime Database
function updateCardInFirebase(cardId, cardData) {
    if (!db) return Promise.reject('Firebase not initialized');
    
    return db.ref('cards/' + cardId).update({
        title: cardData.title,
        description: cardData.description,
        image: cardData.image
    });
}

// 设置表单提交监听
function setupFormListener() {
    const form = document.getElementById('cardForm');
    form.addEventListener('submit', handleAddCard);
}

// Handle add card
function handleAddCard(e) {
    e.preventDefault();

    const title = document.getElementById('cardTitle').value;
    const description = document.getElementById('cardDescription').value;
    const imageInput = document.getElementById('cardImage');

    const card = {
        title: title,
        description: description,
        image: null
    };

    // If there's an image, convert to Base64
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        
        // Check file size
        if (file.size > MAX_IMAGE_SIZE) {
            alert('Image size cannot exceed 1MB, please compress and retry');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            card.image = e.target.result;
            saveCard(card);
        };
        reader.onerror = function() {
            alert('Image read failed');
        };
        reader.readAsDataURL(file);
    } else {
        saveCard(card);
    }
}

// Save card
function saveCard(cardData) {
    if (useFirebase && db) {
        saveCardsToFirebase(cardData)
            .then(() => {
                closeAddModal();
                resetForm();
            })
            .catch(error => {
                console.error('Save failed:', error);
                alert('Save failed: ' + error.message);
            });
    } else {
        cardData.id = Date.now();
        cards.push(cardData);
        saveCards();
        renderCards();
        closeAddModal();
        resetForm();
    }
}

// 渲染所有卡片
function renderCards() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    if (cards.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>No cards yet. Click "Add New Card" to start!</p>
            </div>
        `;
        return;
    }

    cards.forEach(card => {
        const cardElement = createCardElement(card);
        gallery.appendChild(cardElement);
    });
}

// 创建卡片元素
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    // 图片部分 - 只有有图片才显示
    let imageHTML = '';
    if (card.image) {
        imageHTML = `<img src="${card.image}" alt="Card image" class="card-image">`;
    }

    const cardId = card.id;
    cardDiv.innerHTML = `
        ${imageHTML}
        <div class="card-content">
            <p class="card-description">${escapeHtml(card.title)}</p>
            <div class="card-signature">
                <span class="signature-label">— ${escapeHtml(card.description)}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="openEditModal('${cardId}')">✏️ Edit</button>
                <button class="btn btn-danger" id="delete-btn-${cardId}" onclick="confirmDeleteCard('${cardId}')">Delete</button>
            </div>
        </div>
    `;

    return cardDiv;
}

// 确认删除卡片
function confirmDeleteCard(cardId) {
    const button = document.getElementById('delete-btn-' + cardId);
    
    if (button.textContent === 'Confirm Delete') {
        deleteCard(cardId);
        return;
    }
    
    // 第一次点击，改变按钮状态
    button.textContent = 'Confirm Delete';
    button.style.backgroundColor = '#d32f2f';
    
    // 3秒后恢复按钮状态
    setTimeout(() => {
        if (button && document.body.contains(button)) {
            button.textContent = 'Delete';
            button.style.backgroundColor = '';
        }
    }, 3000);
}

// 删除卡片
function deleteCard(cardId) {
    if (useFirebase && db) {
        deleteCardFromFirebase(cardId)
            .catch(error => {
                console.error('Delete failed:', error);
                alert('Delete failed: ' + error.message);
            });
    } else {
        cards = cards.filter(card => card.id !== cardId);
        saveCards();
        renderCards();
    }
}

// 打开添加模态框
function openAddModal() {
    document.getElementById('addModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭添加模态框
function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 打开配置模态框
function openConfigModal() {
    const modal = document.getElementById('configModal');
    const configForm = document.getElementById('configForm');
    const configStatus = document.getElementById('configStatus');
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    if (useFirebase) {
        configStatus.innerHTML = '<p style="color: #4CAF50; padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 6px;"><strong>✓ Firebase Connected</strong><br>Project: secretproject-b70ea<br>Real-time sync enabled...</p>';
        configForm.style.display = 'block';
    } else {
        configStatus.innerHTML = '<p style="color: #ff6b6b; padding: 15px; background: rgba(255, 107, 107, 0.1); border-radius: 6px;">Firebase connection failed<br>Please check network or enable Firestore</p>';
        configForm.style.display = 'block';
    }
}

// 关闭配置模态框
function closeConfigModal() {
    document.getElementById('configModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 打开编辑模态框
function openEditModal(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    editingCardId = cardId;
    document.getElementById('editTitle').value = card.title;
    document.getElementById('editDescription').value = card.description;
    document.getElementById('editImagePreview').src = card.image || '';
    document.getElementById('editImagePreview').style.display = card.image ? 'block' : 'none';
    
    document.getElementById('editModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭编辑模态框
function closeEditModal() {
    editingCardId = null;
    document.getElementById('editModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle edit card save
function handleEditCard(e) {
    e.preventDefault();
    
    if (!editingCardId) return;
    
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const imageInput = document.getElementById('editImage');
    const currentCard = cards.find(c => c.id === editingCardId);
    
    const updatedCard = {
        title: title,
        description: description,
        image: currentCard.image
    };
    
    // If there's a new image, convert to Base64
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        
        if (file.size > MAX_IMAGE_SIZE) {
            alert('Image size cannot exceed 1MB, please compress and retry');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            updatedCard.image = e.target.result;
            saveEditCard(updatedCard);
        };
        reader.onerror = function() {
            alert('Image read failed');
        };
        reader.readAsDataURL(file);
    } else {
        saveEditCard(updatedCard);
    }
}

// Save edited card
function saveEditCard(cardData) {
    if (useFirebase && db) {
        updateCardInFirebase(editingCardId, cardData)
            .then(() => {
                closeEditModal();
                document.getElementById('editForm').reset();
            })
            .catch(error => {
                console.error('Update failed:', error);
                alert('Update failed: ' + error.message);
            });
    } else {
        const cardIndex = cards.findIndex(c => c.id === editingCardId);
        if (cardIndex >= 0) {
            cards[cardIndex] = {
                id: editingCardId,
                ...cardData
            };
            saveCards();
            renderCards();
            closeEditModal();
            document.getElementById('editForm').reset();
        }
    }
}

// Reset form
function resetForm() {
    document.getElementById('cardForm').reset();
}

// Prevent XSS attack - HTML escape function
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Click outside modal to close
window.addEventListener('click', function(event) {
    const addModal = document.getElementById('addModal');
    const configModal = document.getElementById('configModal');
    const editModal = document.getElementById('editModal');
    
    if (event.target === addModal) {
        closeAddModal();
    }
    if (event.target === configModal) {
        closeConfigModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
});

// Press ESC to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAddModal();
        closeConfigModal();
        closeEditModal();
    }
});

// 保存 Firebase 配置
function saveFirebaseConfig() {
    // Firebase is already configured in code
    alert('Firebase is configured in code, no manual setup needed');
    closeConfigModal();
}

// 使用本地存储
function useLocalStorage() {
    localStorage.removeItem('firebaseConfig');
    useFirebase = false;
    db = null;
    
    loadCards();
    renderCards();
    updateSyncStatus('Local Mode', 'default');
    closeConfigModal();
}

// 更新同步状态
function updateSyncStatus(message, status = 'default') {
    const element = document.getElementById('syncStatus');
    element.textContent = message;
    element.className = 'sync-status ' + status;
}
