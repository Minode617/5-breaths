/**
 * Transcription - Web Speech APIを使用したリアルタイム文字起こし
 */
class Transcription {
    constructor() {
        this.recognition = null;
        this.isRunning = false;
        this.language = 'ja-JP';
        this.utterances = [];
        this.currentUtterance = null;
        this.startTime = null;

        // コールバック
        this.onResult = null;
        this.onInterim = null;
        this.onError = null;
        this.onEnd = null;

        // ブラウザ互換性チェック
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!this.SpeechRecognition) {
            console.error('このブラウザはWeb Speech APIをサポートしていません');
        }
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
        if (this.recognition) {
            this.recognition.lang = lang;
        }
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

        this.recognition = new this.SpeechRecognition();
        this.recognition.lang = this.language;
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.startTime = Date.now();
        this.currentUtterance = null;

        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };

        this.recognition.onerror = (event) => {
            console.error('音声認識エラー:', event.error);
            if (this.onError) {
                this.onError(event.error);
            }

            // no-speech エラーの場合は再起動
            if (event.error === 'no-speech' && this.isRunning) {
                this.restartRecognition();
            }
        };

        this.recognition.onend = () => {
            // 継続モードで終了した場合は再起動
            if (this.isRunning) {
                this.restartRecognition();
            } else if (this.onEnd) {
                this.onEnd();
            }
        };

        try {
            this.recognition.start();
            this.isRunning = true;
        } catch (error) {
            console.error('音声認識開始エラー:', error);
            throw error;
        }
    }

    /**
     * 音声認識を再起動
     */
    restartRecognition() {
        if (!this.isRunning) return;

        setTimeout(() => {
            if (this.isRunning) {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('再起動エラー:', error);
                }
            }
        }, 100);
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

            if (result.isFinal) {
                // 確定結果
                const utterance = {
                    id: this.utterances.length,
                    text: transcript,
                    timestamp: timestamp,
                    confidence: confidence,
                    speakerId: null, // 後で設定
                    speakerName: null,
                    isFinal: true
                };

                this.utterances.push(utterance);
                this.currentUtterance = null;

                if (this.onResult) {
                    this.onResult(utterance);
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
                console.error('停止エラー:', error);
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
     * 発言を更新（話者情報の追加など）
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
            const speaker = u.speakerName || '不明';
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
     * SRT形式でエクスポート（字幕用）
     */
    exportAsSRT() {
        return this.utterances.map((u, index) => {
            const startTime = this.formatSRTTimestamp(u.timestamp);
            const endTime = this.formatSRTTimestamp(u.timestamp + 3000); // 3秒間表示
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
