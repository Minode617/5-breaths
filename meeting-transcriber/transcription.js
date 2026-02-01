/**
 * Transcription - Web Speech APIを使用したリアルタイム文字起こし
 * モバイル対応版
 */
class Transcription {
    constructor() {
        this.recognition = null;
        this.isRunning = false;
        this.language = 'ja-JP';
        this.utterances = [];
        this.currentUtterance = null;
        this.startTime = null;
        this.restartCount = 0;
        this.maxRestarts = 100;

        // コールバック
        this.onResult = null;
        this.onInterim = null;
        this.onError = null;
        this.onEnd = null;
        this.onStatusChange = null;

        // ブラウザ互換性チェック
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        // モバイル検出
        this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    /**
     * サポートチェック
     */
    isSupported() {
        return !!this.SpeechRecognition;
    }

    /**
     * 言語を設定
     */
    setLanguage(lang) {
        this.language = lang;
    }

    /**
     * 文字起こしを開始
     */
    start() {
        if (!this.isSupported()) {
            throw new Error('Web Speech APIがサポートされていません');
        }

        if (this.isRunning) {
            return;
        }

        this.startTime = Date.now();
        this.restartCount = 0;
        this.isRunning = true;

        this.createRecognition();
        this.startRecognition();
    }

    /**
     * 認識インスタンスを作成
     */
    createRecognition() {
        this.recognition = new this.SpeechRecognition();
        this.recognition.lang = this.language;
        // モバイルでは continuous を false にして安定させる
        this.recognition.continuous = !this.isMobile;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            console.log('音声認識開始');
            if (this.onStatusChange) {
                this.onStatusChange('listening', '音声を聞いています...');
            }
        };

        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };

        this.recognition.onerror = (event) => {
            console.log('音声認識エラー:', event.error);

            // aborted と no-speech は正常なので無視
            if (event.error === 'aborted') {
                return;
            }

            if (event.error === 'no-speech') {
                if (this.onStatusChange) {
                    this.onStatusChange('waiting', '音声を待っています...');
                }
                return;
            }

            if (event.error === 'not-allowed') {
                if (this.onError) {
                    this.onError('マイクの使用が許可されていません。ブラウザの設定を確認してください。');
                }
                this.isRunning = false;
                return;
            }

            if (this.onError) {
                this.onError(event.error);
            }
        };

        this.recognition.onend = () => {
            console.log('音声認識終了, isRunning:', this.isRunning);

            if (this.isRunning && this.restartCount < this.maxRestarts) {
                this.restartCount++;
                // 少し待ってから再起動
                setTimeout(() => {
                    if (this.isRunning) {
                        this.startRecognition();
                    }
                }, 300);
            } else if (this.onEnd) {
                this.onEnd();
            }
        };

        this.recognition.onspeechstart = () => {
            console.log('発話検出');
            if (this.onStatusChange) {
                this.onStatusChange('speaking', '認識中...');
            }
        };

        this.recognition.onspeechend = () => {
            console.log('発話終了');
        };
    }

    /**
     * 認識を開始
     */
    startRecognition() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('認識開始エラー:', error);
            // already started エラーは無視
            if (error.message && error.message.includes('already started')) {
                return;
            }
            // 少し待ってリトライ
            setTimeout(() => {
                if (this.isRunning) {
                    this.createRecognition();
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.error('リトライ失敗:', e);
                    }
                }
            }, 500);
        }
    }

    /**
     * 結果ハンドラ
     */
    handleResult(event) {
        const timestamp = Date.now() - this.startTime;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript.trim();
            const confidence = result[0].confidence;

            if (!transcript) continue;

            if (result.isFinal) {
                // 確定結果
                const utterance = {
                    id: this.utterances.length,
                    text: transcript,
                    timestamp: timestamp,
                    confidence: confidence,
                    speakerId: null,
                    speakerName: null,
                    isFinal: true
                };

                this.utterances.push(utterance);
                this.currentUtterance = null;

                console.log('確定:', transcript);

                if (this.onResult) {
                    this.onResult(utterance);
                }

                if (this.onStatusChange) {
                    this.onStatusChange('listening', '音声を聞いています...');
                }
            } else {
                // 中間結果
                this.currentUtterance = {
                    text: transcript,
                    timestamp: timestamp,
                    isFinal: false
                };

                if (this.onInterim) {
                    this.onInterim(this.currentUtterance);
                }
            }
        }
    }

    /**
     * 文字起こしを停止
     */
    stop() {
        this.isRunning = false;
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                // 無視
            }
            this.recognition = null;
        }
    }

    /**
     * 発言にタイムスタンプをフォーマット
     */
    formatTimestamp(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 全発言を取得
     */
    getUtterances() {
        return this.utterances;
    }

    /**
     * 発言を更新
     */
    updateUtterance(id, updates) {
        const utterance = this.utterances.find(u => u.id === id);
        if (utterance) {
            Object.assign(utterance, updates);
        }
    }

    /**
     * 統計情報を取得
     */
    getStats() {
        const totalChars = this.utterances.reduce((sum, u) => sum + u.text.length, 0);
        const speakerSet = new Set(this.utterances.map(u => u.speakerId).filter(Boolean));

        return {
            totalUtterances: this.utterances.length,
            totalChars: totalChars,
            speakerCount: speakerSet.size,
            duration: this.startTime ? Date.now() - this.startTime : 0
        };
    }

    /**
     * テキスト形式でエクスポート
     */
    exportAsText() {
        return this.utterances.map(u => {
            const time = this.formatTimestamp(u.timestamp);
            const speaker = u.speakerName || '話者';
            return `[${time}] ${speaker}: ${u.text}`;
        }).join('\n');
    }

    /**
     * JSON形式でエクスポート
     */
    exportAsJSON() {
        return JSON.stringify({
            metadata: {
                exportedAt: new Date().toISOString(),
                language: this.language,
                stats: this.getStats()
            },
            utterances: this.utterances
        }, null, 2);
    }

    /**
     * SRT形式でエクスポート
     */
    exportAsSRT() {
        return this.utterances.map((u, index) => {
            const startTime = this.formatSRTTimestamp(u.timestamp);
            const endTime = this.formatSRTTimestamp(u.timestamp + 3000);
            const speaker = u.speakerName || '話者';

            return `${index + 1}\n${startTime} --> ${endTime}\n${speaker}: ${u.text}\n`;
        }).join('\n');
    }

    /**
     * SRT形式のタイムスタンプ
     */
    formatSRTTimestamp(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = ms % 1000;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    }

    /**
     * クリア
     */
    clear() {
        this.utterances = [];
        this.currentUtterance = null;
        this.startTime = null;
    }

    /**
     * 実行中かどうか
     */
    isActive() {
        return this.isRunning;
    }
}

// グローバルに公開
window.Transcription = Transcription;
