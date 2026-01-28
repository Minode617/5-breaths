// Buddhist Philosophy Chatbot
// 空海、道元、親鸞の視点で人生の悩みに向き合う

// ==================== State Management ====================
let currentHost = null;
let chatHistory = [];

// ==================== Host Data ====================
const hosts = {
    kukai: {
        name: '空海',
        title: '真言密教の開祖',
        greeting: 'ようこそ。私は空海、弘法大師と呼ばれる者です。\n\n真言密教の教えでは、この身このままで悟りに至れる「即身成仏」を説きます。宇宙の真理である大日如来と一体となる道をお伝えしましょう。\n\nあなたの心に何か悩みや疑問がありますか？',
        avatar: getKukaiSVG()
    },
    dogen: {
        name: '道元',
        title: '曹洞宗の開祖',
        greeting: 'よく来られた。私は道元です。\n\n禅の道とは、ただひたすら坐ること「只管打坐」にあります。悟りを求めて坐るのではなく、坐ること自体が悟りなのです。今この瞬間に全てがある。\n\n何をお聞きになりたいですか？',
        avatar: getDogenSVG()
    },
    shinran: {
        name: '親鸞',
        title: '浄土真宗の開祖',
        greeting: 'ようこそお越しくださいました。親鸞でございます。\n\n私は煩悩を抱えた一人の凡夫として、阿弥陀仏の本願に救われました。自力では悟りに至れぬ私たちも、他力本願によって救われる道があります。\n\nお心の内をお聞かせください。',
        avatar: getShinranSVG()
    }
};

// ==================== Wisdom Database ====================
const wisdomDatabase = {
    kukai: {
        suffering: {
            response: '苦しみとは、自己と宇宙の真理との分離から生まれます。\n\n密教では、身・口・意の三密を通じて大日如来と一体となることで、苦しみの根本を超越できると説きます。あなたの苦しみも、より大きな宇宙の営みの一部なのです。',
            question: 'その苦しみの中に、何か学ぶべきものがあるとしたら、それは何でしょうか？',
            practical: '今日、5分間だけ静かに座り、呼吸に意識を向けてみてください。吸う息、吐く息を通じて、宇宙とつながっていることを感じてみましょう。'
        },
        meaning: {
            response: '人生の意味は、この身このままで仏となる「即身成仏」にあります。\n\n遠い未来の悟りを待つ必要はありません。今この瞬間、あなたはすでに宇宙の真理を内に秘めています。それを顕現させることが、人生の目的なのです。',
            question: 'あなたが今日、「仏の心」で行えることは何でしょうか？',
            practical: '朝起きた時、「今日一日、すべての存在とつながっている」と心で唱えてみてください。小さな行為も宇宙的な意味を持っています。'
        },
        peace: {
            response: '心の平安は、曼荼羅に象徴される宇宙の秩序を理解することから生まれます。\n\n全ての存在は互いにつながり、支え合っています。あなたもその一部。孤独に見える時も、実は無数のつながりの中にいるのです。',
            question: 'あなたを支えてくれている「見えないつながり」は何でしょうか？',
            practical: '一日の終わりに、今日感謝できる3つのことを心の中で唱えてみてください。それが宇宙とのつながりを確認する瞬間になります。'
        },
        practice: {
            response: '日常の実践として、真言を唱えることをお勧めします。\n\n「オン・アビラウンケン」は大日如来の真言です。言葉の響きそのものに宇宙の真理が宿っています。通勤中や家事の合間でも、心で唱えることができます。',
            question: '日常の中で「聖なる瞬間」を見出すとしたら、どこに見つけられるでしょうか？',
            practical: '朝の歯磨きや食事など、日常の行為を「修行」として意識してみてください。すべての行為が仏道につながっています。'
        },
        default: {
            response: 'あなたの問いは、深い洞察を求めていますね。\n\n密教の教えでは、問いを持つこと自体が悟りへの第一歩です。疑問は光を求める心の表れ。その光は、実はあなたの内にすでに存在しています。',
            question: 'もしあなたがすでに答えを知っているとしたら、それは何でしょうか？',
            practical: '静かな場所で目を閉じ、心に浮かぶ最初のイメージに注意を向けてみてください。そこに答えのヒントがあるかもしれません。'
        }
    },
    dogen: {
        suffering: {
            response: '苦しみから逃れようとすること、それ自体が苦しみを生んでいます。\n\n只管打坐の教えでは、苦しみを「なくそう」とせず、ただそこに在ることを許します。坐禅において、痛みも退屈も、ただ観察するのみ。抵抗しなければ、苦しみは変容します。',
            question: 'もし苦しみを「敵」ではなく「客人」として迎えたら、何が変わるでしょうか？',
            practical: '今日、何か不快な感情が生じた時、3回深呼吸してから「これも通り過ぎる」と心の中で唱えてみてください。'
        },
        meaning: {
            response: '人生の意味を「探す」必要はありません。なぜなら、今この瞬間が全てだからです。\n\n正法眼蔵に記したように「仏道をならうというは、自己をならうなり」。自己を深く見つめることで、意味は自ずと顕れます。',
            question: '「今、ここ」に完全に存在したら、何が見えてきますか？',
            practical: '食事の時、最初の一口を30回噛んでから飲み込んでみてください。その瞬間に全意識を向けること、それが禅の実践です。'
        },
        peace: {
            response: '心の平安を求めること、それ自体が平安を遠ざけています。\n\n坐禅とは、何も求めず、何も拒まず、ただ坐ること。そこに自然と平安が訪れます。月を映す水面のように、心を静めれば真理が映し出されます。',
            question: '今この瞬間、何も変える必要がないとしたら、どう感じますか？',
            practical: '一日5分でも良いので、何も考えず、何もせず、ただ坐る時間を作ってみてください。姿勢を正し、呼吸を観察するだけで構いません。'
        },
        practice: {
            response: '日常すべてが修行の場です。\n\n典座教訓に説いたように、料理を作ること、掃除をすること、すべてが仏道です。一つ一つの行為に全身全霊を注ぐこと、それが禅の実践です。',
            question: '今日の一つの行為に「全身全霊」を注ぐとしたら、どれを選びますか？',
            practical: '毎朝、布団を整える時に心を込めてみてください。角を揃え、シワを伸ばす。その行為自体が瞑想になります。'
        },
        default: {
            response: '言葉で語れることには限りがあります。\n\n禅の真髄は「不立文字」、文字に頼らぬ伝達にあります。しかし、あなたが問いを持っていること、それは求道の心の表れ。その問いを大切に抱え続けてください。',
            question: 'この問いを持ったまま、静かに坐ってみたら何が生まれるでしょうか？',
            practical: '問いの答えを急いで求めず、しばらく心に留めておいてください。答えは思わぬ時に、思わぬ形で訪れることがあります。'
        }
    },
    shinran: {
        suffering: {
            response: '苦しみの中にいらっしゃるのですね。私もまた、煩悩に苦しみ続けた者です。\n\n浄土真宗では、煩悩を消そうとする「自力」を手放し、阿弥陀仏の慈悲に身を委ねる「他力」を説きます。苦しみを抱えたままでも、救いはあります。',
            question: 'もし、苦しみを抱えたままでも許されるとしたら、どう感じますか？',
            practical: '辛い時、「南無阿弥陀仏」と声に出してみてください。解決を求めるのではなく、ただ苦しみを仏に委ねる。それだけで心が少し軽くなることがあります。'
        },
        meaning: {
            response: '人生の意味を問うあなたの心、それは仏に向かう心の表れです。\n\n歎異抄に記したように、私たちは「悪人」です。しかし、だからこそ阿弥陀仏の救いの対象となるのです。不完全な自分を受け入れることから、真の意味が見えてきます。',
            question: 'もし「完璧でなくていい」としたら、今のあなたをどう見ることができますか？',
            practical: '一日の終わりに、今日できなかったことではなく、今日在れたことに感謝してみてください。存在そのものに価値があります。'
        },
        peace: {
            response: '心の平安は、自力で獲得するものではありません。\n\n私たちの心は移ろいやすく、煩悩に満ちています。それを変えようとするのではなく、そのままの自分を阿弥陀仏に委ねる。そこに真の平安があります。',
            question: 'コントロールを手放すことへの恐れは何ですか？そして、もし手放せたら？',
            practical: '不安な時、両手を合わせて「おまかせします」と呟いてみてください。結果をコントロールしようとする心を、少しだけ緩めることができます。'
        },
        practice: {
            response: '特別な修行は必要ありません。\n\n念仏を唱えること、それだけで十分です。「南無阿弥陀仏」の六字には、阿弥陀仏の全ての功徳が込められています。日常の中で、感謝の時も苦しい時も、念仏を唱えてください。',
            question: '日常の中で、仏を想う瞬間をどこに見出せますか？',
            practical: '通勤中や就寝前、心の中で「南無阿弥陀仏」と唱えてみてください。声に出しても、心の中でも構いません。回数を気にする必要もありません。'
        },
        default: {
            response: 'あなたが問いを持っていること、それは仏縁あってのことです。\n\n私も若き日、多くの疑問を抱えて苦しみました。しかし、師である法然上人との出会いが、すべてを変えました。問いを持ち続けることは、尊いことです。',
            question: 'あなたを導いてくれた出会いや言葉は、何かありますか？',
            practical: '今日出会う人々の中に、仏の姿を見ようとしてみてください。思わぬところに、導きがあるかもしれません。'
        }
    }
};

// ==================== SVG Generators ====================
function getKukaiSVG() {
    return `<svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="url(#kukai-gradient-mini)"/>
        <ellipse cx="50" cy="52" rx="28" ry="32" fill="#fce4c4"/>
        <path d="M22 45 Q25 20 50 18 Q75 20 78 45 Q75 35 50 33 Q25 35 22 45" fill="#1a1a2e"/>
        <path d="M35 42 Q40 39 45 42" stroke="#3d3d3d" stroke-width="1.5" fill="none"/>
        <path d="M55 42 Q60 39 65 42" stroke="#3d3d3d" stroke-width="1.5" fill="none"/>
        <ellipse cx="40" cy="48" rx="4" ry="3" fill="#1a1a2e"/>
        <ellipse cx="60" cy="48" rx="4" ry="3" fill="#1a1a2e"/>
        <circle cx="41" cy="47" r="1.5" fill="#fff"/>
        <circle cx="61" cy="47" r="1.5" fill="#fff"/>
        <path d="M50 52 L48 58 Q50 60 52 58 L50 52" fill="#e8c9a4"/>
        <path d="M44 66 Q50 70 56 66" stroke="#c98a7b" stroke-width="2" fill="none"/>
        <path d="M25 82 Q50 75 75 82 L80 100 L20 100 Z" fill="#8b4513"/>
        <circle cx="50" cy="25" r="4" fill="#ffd700"/>
        <defs>
            <linearGradient id="kukai-gradient-mini" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea"/>
                <stop offset="100%" style="stop-color:#764ba2"/>
            </linearGradient>
        </defs>
    </svg>`;
}

function getDogenSVG() {
    return `<svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="url(#dogen-gradient-mini)"/>
        <ellipse cx="50" cy="52" rx="26" ry="30" fill="#f5deb3"/>
        <ellipse cx="50" cy="35" rx="24" ry="18" fill="#d4c4a8"/>
        <path d="M33 43 L45 41" stroke="#3d3d3d" stroke-width="2" fill="none"/>
        <path d="M55 41 L67 43" stroke="#3d3d3d" stroke-width="2" fill="none"/>
        <path d="M36 48 Q40 46 44 48 Q40 51 36 48" fill="#1a1a2e"/>
        <path d="M56 48 Q60 46 64 48 Q60 51 56 48" fill="#1a1a2e"/>
        <circle cx="40" cy="48" r="1" fill="#fff"/>
        <circle cx="60" cy="48" r="1" fill="#fff"/>
        <path d="M50 50 L47 57 Q50 59 53 57 L50 50" fill="#dfc59d"/>
        <path d="M45 65 L55 65" stroke="#a67c6d" stroke-width="2" fill="none"/>
        <path d="M28 80 Q50 72 72 80 L78 100 L22 100 Z" fill="#2d2d2d"/>
        <defs>
            <linearGradient id="dogen-gradient-mini" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#11998e"/>
                <stop offset="100%" style="stop-color:#38ef7d"/>
            </linearGradient>
        </defs>
    </svg>`;
}

function getShinranSVG() {
    return `<svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="url(#shinran-gradient-mini)"/>
        <ellipse cx="50" cy="52" rx="27" ry="31" fill="#ffe4c9"/>
        <path d="M23 50 Q20 25 50 20 Q80 25 77 50 Q70 35 50 32 Q30 35 23 50" fill="#2d2d2d"/>
        <path d="M34 44 Q40 42 46 44" stroke="#4a4a4a" stroke-width="1.5" fill="none"/>
        <path d="M54 44 Q60 42 66 44" stroke="#4a4a4a" stroke-width="1.5" fill="none"/>
        <ellipse cx="40" cy="50" rx="4" ry="4" fill="#1a1a2e"/>
        <ellipse cx="60" cy="50" rx="4" ry="4" fill="#1a1a2e"/>
        <circle cx="41" cy="49" r="1.5" fill="#fff"/>
        <circle cx="61" cy="49" r="1.5" fill="#fff"/>
        <path d="M50 52 L48 59 Q50 61 52 59 L50 52" fill="#ebd4b8"/>
        <path d="M43 67 Q50 72 57 67" stroke="#c98a7b" stroke-width="2" fill="none"/>
        <path d="M26 82 Q50 74 74 82 L80 100 L20 100 Z" fill="#4a3728"/>
        <circle cx="35" cy="90" r="2" fill="#8b7355"/>
        <circle cx="40" cy="92" r="2" fill="#8b7355"/>
        <circle cx="45" cy="93" r="2" fill="#8b7355"/>
        <defs>
            <linearGradient id="shinran-gradient-mini" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#f093fb"/>
                <stop offset="100%" style="stop-color:#f5576c"/>
            </linearGradient>
        </defs>
    </svg>`;
}

// ==================== DOM Elements ====================
const hostSelection = document.getElementById('hostSelection');
const chatScreen = document.getElementById('chatScreen');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const backBtn = document.getElementById('backBtn');
const currentHostAvatar = document.getElementById('currentHostAvatar');
const currentHostName = document.getElementById('currentHostName');
const currentHostTitle = document.getElementById('currentHostTitle');
const suggestedTopics = document.getElementById('suggestedTopics');

// ==================== Initialize App ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadState();
});

function initializeEventListeners() {
    // Host card selection
    document.querySelectorAll('.host-card').forEach(card => {
        card.addEventListener('click', () => {
            selectHost(card.dataset.host);
        });
    });

    // Back button
    backBtn.addEventListener('click', () => {
        showHostSelection();
    });

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
    });

    // Suggested topics
    document.querySelectorAll('.topic-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            userInput.value = btn.dataset.topic;
            sendMessage();
        });
    });
}

// ==================== Host Selection ====================
function selectHost(hostId) {
    currentHost = hostId;
    const host = hosts[hostId];

    // Update header
    currentHostAvatar.innerHTML = host.avatar;
    currentHostName.textContent = host.name;
    currentHostTitle.textContent = host.title;

    // Clear and show chat
    chatMessages.innerHTML = '';
    chatHistory = [];

    // Show chat screen
    hostSelection.classList.add('hidden');
    chatScreen.classList.remove('hidden');

    // Add welcome message
    setTimeout(() => {
        addMessage(host.greeting, 'host', true);
    }, 300);

    saveState();
}

function showHostSelection() {
    chatScreen.classList.add('hidden');
    hostSelection.classList.remove('hidden');
    currentHost = null;
    saveState();
}

// ==================== Chat Functions ====================
function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show typing indicator
    const typingDiv = showTypingIndicator();

    // Generate response after delay
    setTimeout(() => {
        typingDiv.remove();
        const response = generateResponse(message);
        addMessage(response.text, 'host', false, response.question, response.practical);
    }, 1000 + Math.random() * 1000);
}

function addMessage(text, type, isWelcome = false, question = null, practical = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type} ${currentHost || ''}`;
    if (isWelcome) messageDiv.classList.add('welcome-message');

    let avatarHTML = '';
    if (type === 'host' && currentHost) {
        avatarHTML = `<div class="message-avatar">${hosts[currentHost].avatar}</div>`;
    }

    let contentHTML = `<div class="message-text">${text.replace(/\n/g, '<br>')}</div>`;

    if (question) {
        contentHTML += `<div class="message-question">${question}</div>`;
    }

    if (practical) {
        contentHTML += `<div class="message-practical">${practical}</div>`;
    }

    messageDiv.innerHTML = `
        ${avatarHTML}
        <div class="message-content">
            ${contentHTML}
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save to history
    chatHistory.push({ type, text, question, practical });
    saveState();
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = `message host ${currentHost}`;
    typingDiv.innerHTML = `
        <div class="message-avatar">${hosts[currentHost].avatar}</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

// ==================== Response Generation ====================
function generateResponse(userMessage) {
    const wisdom = wisdomDatabase[currentHost];
    const lowerMessage = userMessage.toLowerCase();

    // Detect topic from user message
    let topic = 'default';

    if (containsAny(lowerMessage, ['苦し', '辛い', 'つらい', '悲し', '痛い', '不安', '怖い', '恐れ', '悩み', '困'])) {
        topic = 'suffering';
    } else if (containsAny(lowerMessage, ['意味', '目的', '生きる', '人生', 'なぜ', '理由', '価値'])) {
        topic = 'meaning';
    } else if (containsAny(lowerMessage, ['平安', '安らぎ', '穏やか', '平和', '落ち着', 'リラックス', '安心'])) {
        topic = 'peace';
    } else if (containsAny(lowerMessage, ['実践', '日常', '毎日', '具体的', 'どうすれば', '方法', 'やり方', '習慣'])) {
        topic = 'practice';
    }

    const response = wisdom[topic] || wisdom.default;

    return {
        text: response.response,
        question: response.question,
        practical: response.practical
    };
}

function containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

// ==================== State Management ====================
function saveState() {
    const state = {
        currentHost,
        chatHistory
    };
    localStorage.setItem('buddhistChatState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('buddhistChatState');
    if (saved) {
        const state = JSON.parse(saved);
        if (state.currentHost && hosts[state.currentHost]) {
            currentHost = state.currentHost;
            chatHistory = state.chatHistory || [];

            // Restore UI
            const host = hosts[currentHost];
            currentHostAvatar.innerHTML = host.avatar;
            currentHostName.textContent = host.name;
            currentHostTitle.textContent = host.title;

            // Restore messages
            chatHistory.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.type} ${currentHost}`;

                let avatarHTML = '';
                if (msg.type === 'host') {
                    avatarHTML = `<div class="message-avatar">${host.avatar}</div>`;
                }

                let contentHTML = `<div class="message-text">${msg.text.replace(/\n/g, '<br>')}</div>`;
                if (msg.question) {
                    contentHTML += `<div class="message-question">${msg.question}</div>`;
                }
                if (msg.practical) {
                    contentHTML += `<div class="message-practical">${msg.practical}</div>`;
                }

                messageDiv.innerHTML = `
                    ${avatarHTML}
                    <div class="message-content">
                        ${contentHTML}
                    </div>
                `;
                chatMessages.appendChild(messageDiv);
            });

            // Show chat screen
            hostSelection.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}
