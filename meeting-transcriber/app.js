/**
 * Meeting Transcriber - メインアプリケーション
 * Web会議の文字起こしシステム
 */
class MeetingTranscriber {
    constructor() {
        // モジュール
        this.audioProcessor = new AudioProcessor();
        this.speakerRecognition = new SpeakerRecognition();
        this.transcription = new Transcription();

        // 状態
        this.isRecording = false;
        this.timerInterval = null;
        this.autoSaveInterval = null;
        this.recordingStartTime = null;

        // DOM要素
        this.elements = {};

        // 初期化
        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.setupTranscriptionCallbacks();
        this.checkBrowserSupport();
    }

    /**
     * DOM要素をキャッシュ
     */
    cacheElements() {
        this.elements = {
            // ボタン
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            copyBtn: document.getElementById('copyBtn'),
            exportTxtBtn: document.getElementById('exportTxtBtn'),
            exportJsonBtn: document.getElementById('exportJsonBtn'),
            exportSrtBtn: document.getElementById('exportSrtBtn'),
            clearBtn: document.getElementById('clearBtn'),
            addSpeakerBtn: document.getElementById('addSpeakerBtn'),

            // 設定
            audioSource: document.getElementById('audioSource'),
            language: document.getElementById('language'),
            speakerDetection: document.getElementById('speakerDetection'),
            autoSave: document.getElementById('autoSave'),

            // フッター
            footerTip: document.getElementById('footerTip'),

            // 表示
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            timer: document.getElementById('timer'),
            audioLevel: document.getElementById('audioLevel'),
            currentSpeaker: document.getElementById('currentSpeaker'),
            transcript: document.getElementById('transcript'),
            speakerList: document.getElementById('speakerList'),

            // 統計
            totalUtterances: document.getElementById('totalUtterances'),
            totalChars: document.getElementById('totalChars'),
            speakerCount: document.getElementById('speakerCount'),
            recordingDuration: document.getElementById('recordingDuration'),

            // モーダル
            speakerModal: document.getElementById('speakerModal'),
            speakerNameInput: document.getElementById('speakerNameInput'),
            saveSpeakerBtn: document.getElementById('saveSpeakerBtn'),
            cancelSpeakerBtn: document.getElementById('cancelSpeakerBtn')
        };
    }

    /**
     * イベントをバインド
     */
    bindEvents() {
        // 録音コントロール
        this.elements.startBtn.addEventListener('click', () => this.startRecording());
        this.elements.stopBtn.addEventListener('click', () => this.stopRecording());

        // エクスポート
        this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.elements.exportTxtBtn.addEventListener('click', () => this.exportTxt());
        this.elements.exportJsonBtn.addEventListener('click', () => this.exportJson());
        this.elements.exportSrtBtn.addEventListener('click', () => this.exportSrt());
        this.elements.clearBtn.addEventListener('click', () => this.clearTranscript());

        // 話者管理
        this.elements.addSpeakerBtn.addEventListener('click', () => this.showAddSpeakerModal());

        // 設定変更
        this.elements.language.addEventListener('change', (e) => {
            this.transcription.setLanguage(e.target.value);
            this.saveSettings();
        });

        this.elements.speakerDetection.addEventListener('change', (e) => {
            this.speakerRecognition.setEnabled(e.target.checked);
            this.saveSettings();
        });

        this.elements.autoSave.addEventListener('change', () => this.saveSettings());

        // オーディオソース変更時のヒント更新
        this.elements.audioSource.addEventListener('change', (e) => {
            this.updateFooterTip(e.target.value);
            this.saveSettings();
        });

        // モーダル
        this.elements.saveSpeakerBtn.addEventListener('click', () => this.saveSpeakerName());
        this.elements.cancelSpeakerBtn.addEventListener('click', () => this.hideModal());

        // モーダル外クリックで閉じる
        this.elements.speakerModal.addEventListener('click', (e) => {
            if (e.target === this.elements.speakerModal) {
                this.hideModal();
            }
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.exportTxt();
                }
            }
        });
    }

    /**
     * ブラウザサポートチェック
     */
    checkBrowserSupport() {
        if (!this.transcription.isSupported()) {
            this.showError('このブラウザはWeb Speech APIをサポートしていません。Chrome または Edge をお使いください。');
            this.elements.startBtn.disabled = true;
            return;
        }

        // システム音声キャプチャが使えない場合はマイクモードに固定
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            this.elements.audioSource.value = 'mic';
            // システム音声オプションを無効化
            const systemOption = this.elements.audioSource.querySelector('option[value="system"]');
            if (systemOption) {
                systemOption.disabled = true;
                systemOption.textContent = 'システム音声 (非対応)';
            }
        }

        // デバイス検出
        this.detectDevice();
    }

    /**
     * デバイス検出とUIの最適化
     */
    detectDevice() {
        const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // モバイルではマイクモードを推奨
            this.elements.audioSource.value = 'mic';
            this.updateFooterTip('mic');

            // システム音声をモバイルでは無効化
            const systemOption = this.elements.audioSource.querySelector('option[value="system"]');
            if (systemOption) {
                systemOption.disabled = true;
                systemOption.textContent = 'システム音声 (PC専用)';
            }
        }
    }

    /**
     * フッターのヒントを更新
     */
    updateFooterTip(mode) {
        if (mode === 'mic') {
            this.elements.footerTip.textContent = '💡 ヒント: スマホではスピーカーから出る音をマイクで拾います。静かな環境で、スピーカー音量を上げてお使いください。';
        } else {
            this.elements.footerTip.textContent = '💡 ヒント: Chrome/Edgeで「タブの音声を共有」を選択すると、特定のタブの音声のみを録音できます。';
        }
    }

    /**
     * 文字起こしコールバックを設定
     */
    setupTranscriptionCallbacks() {
        // 確定結果
        this.transcription.onResult = (utterance) => {
            // 話者を識別（AudioProcessorが動作している場合のみ）
            if (this.audioProcessor.isActive() && this.elements.speakerDetection.checked) {
                const features = this.audioProcessor.getAudioFeatures();
                if (features) {
                    const speakerId = this.speakerRecognition.identifySpeaker(features);
                    if (speakerId) {
                        const speaker = this.speakerRecognition.getSpeaker(speakerId);
                        utterance.speakerId = speakerId;
                        utterance.speakerName = speaker ? speaker.name : '不明';
                        this.speakerRecognition.incrementUtteranceCount(speakerId);
                    }
                }
            }
            if (!utterance.speakerName) {
                utterance.speakerName = '話者';
            }

            this.addUtteranceToDisplay(utterance);
            this.updateStats();
            this.updateSpeakerList();
        };

        // 中間結果
        this.transcription.onInterim = (interim) => {
            this.updateInterimDisplay(interim);
        };

        // エラー
        this.transcription.onError = (error) => {
            console.error('文字起こしエラー:', error);
            this.setStatus('recording', 'エラー: ' + error);
            // エラーを画面に表示
            this.showToast('エラー: ' + error);
        };

        // ステータス変更
        this.transcription.onStatusChange = (state, message) => {
            if (this.isRecording) {
                this.setStatus('recording', message);
            }
        };

        // デバッグ用：画面に状態を表示
        this.transcription.onDebug = (message) => {
            this.addDebugMessage(message);
        };
    }

    /**
     * デバッグメッセージを表示
     */
    addDebugMessage(message) {
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        const div = document.createElement('div');
        div.style.cssText = 'padding: 4px 8px; margin: 2px 0; background: #e0f2fe; border-radius: 4px; font-size: 12px; color: #0369a1;';
        div.textContent = `[${timestamp}] ${message}`;
        this.elements.transcript.appendChild(div);
        this.elements.transcript.scrollTop = this.elements.transcript.scrollHeight;
    }

    /**
     * 録音開始
     */
    async startRecording() {
        try {
            const audioMode = this.elements.audioSource.value;
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            this.setStatus('processing', '準備中...');

            // モバイルのマイクモードではAudioProcessorをスキップ
            // （Web Speech APIが自身でマイクにアクセスするため、競合を避ける）
            let audioProcessorStarted = false;
            if (!(isMobile && audioMode === 'mic')) {
                try {
                    await this.audioProcessor.startCapture(audioMode);
                    audioProcessorStarted = true;

                    // 音声レベルのコールバック
                    this.audioProcessor.onAudioLevel = (level) => {
                        this.updateAudioLevel(level);
                    };

                    // トラック終了時
                    this.audioProcessor.onTrackEnded = () => {
                        this.stopRecording();
                    };
                } catch (audioError) {
                    console.log('AudioProcessor開始失敗:', audioError);
                }
            }

            // 文字起こしを開始（これがメイン）
            this.transcription.setLanguage(this.elements.language.value);
            this.transcription.start();

            // UI更新
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.setStatus('recording', '話しかけてください...');

            // タイマー開始
            this.startTimer();

            // 自動保存
            if (this.elements.autoSave.checked) {
                this.startAutoSave();
            }

            // プレースホルダーを削除
            const placeholder = this.elements.transcript.querySelector('.placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            // AudioProcessorなしの場合は音声レベルバーを薄く表示
            if (!audioProcessorStarted) {
                this.elements.audioLevel.style.width = '30%';
                this.elements.audioLevel.style.opacity = '0.3';
            }

        } catch (error) {
            console.error('録音開始エラー:', error);
            this.setStatus('', '待機中');
            this.showError(error.message || '録音の開始に失敗しました。');
        }
    }

    /**
     * 録音停止
     */
    stopRecording() {
        this.isRecording = false;

        // 音声キャプチャを停止
        this.audioProcessor.stopCapture();

        // 文字起こしを停止
        this.transcription.stop();

        // UI更新
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.setStatus('', '停止');

        // タイマー停止
        this.stopTimer();

        // 自動保存停止
        this.stopAutoSave();

        // 音声レベルをリセット
        this.elements.audioLevel.style.width = '0%';
        this.elements.currentSpeaker.textContent = '-';
    }

    /**
     * ステータス更新
     */
    setStatus(state, text) {
        this.elements.statusDot.className = 'status-dot';
        if (state) {
            this.elements.statusDot.classList.add(state);
        }
        this.elements.statusText.textContent = text;
    }

    /**
     * 音声レベル更新
     */
    updateAudioLevel(level) {
        this.elements.audioLevel.style.width = `${level}%`;

        // 話者表示更新
        if (level > 10 && this.speakerRecognition.currentSpeakerId) {
            const speaker = this.speakerRecognition.getSpeaker(this.speakerRecognition.currentSpeakerId);
            if (speaker) {
                this.elements.currentSpeaker.textContent = speaker.name;
                this.elements.currentSpeaker.style.background = speaker.color;
            }
        }
    }

    /**
     * 発言を表示に追加
     */
    addUtteranceToDisplay(utterance) {
        const speaker = utterance.speakerId ?
            this.speakerRecognition.getSpeaker(utterance.speakerId) : null;
        const speakerIndex = speaker ?
            parseInt(speaker.id.split('_')[1]) : 0;

        const div = document.createElement('div');
        div.className = 'utterance';
        div.dataset.speaker = speakerIndex;
        div.dataset.utteranceId = utterance.id;

        div.innerHTML = `
            <div class="utterance-header">
                <span class="utterance-speaker">${utterance.speakerName || '話者'}</span>
                <span class="utterance-time">${this.transcription.formatTimestamp(utterance.timestamp)}</span>
            </div>
            <div class="utterance-text">${this.escapeHtml(utterance.text)}</div>
        `;

        // 中間結果要素があれば削除
        const interim = this.elements.transcript.querySelector('.utterance-interim');
        if (interim) {
            interim.remove();
        }

        this.elements.transcript.appendChild(div);
        this.elements.transcript.scrollTop = this.elements.transcript.scrollHeight;
    }

    /**
     * 中間結果を表示
     */
    updateInterimDisplay(interim) {
        let interimDiv = this.elements.transcript.querySelector('.utterance-interim');

        if (!interimDiv) {
            interimDiv = document.createElement('div');
            interimDiv.className = 'utterance utterance-interim';
            interimDiv.style.opacity = '0.6';
            this.elements.transcript.appendChild(interimDiv);
        }

        interimDiv.innerHTML = `
            <div class="utterance-header">
                <span class="utterance-speaker">...</span>
                <span class="utterance-time">${this.transcription.formatTimestamp(interim.timestamp)}</span>
            </div>
            <div class="utterance-text">${this.escapeHtml(interim.text)}</div>
        `;

        this.elements.transcript.scrollTop = this.elements.transcript.scrollHeight;
    }

    /**
     * 統計情報を更新
     */
    updateStats() {
        const stats = this.transcription.getStats();
        this.elements.totalUtterances.textContent = stats.totalUtterances;
        this.elements.totalChars.textContent = stats.totalChars.toLocaleString();
        this.elements.speakerCount.textContent = this.speakerRecognition.getAllSpeakers().length;
    }

    /**
     * 話者リストを更新
     */
    updateSpeakerList() {
        const speakers = this.speakerRecognition.getAllSpeakers();

        if (speakers.length === 0) {
            this.elements.speakerList.innerHTML = '<p class="placeholder">話者が検出されると、ここに表示されます。</p>';
            return;
        }

        this.elements.speakerList.innerHTML = speakers.map(speaker => `
            <div class="speaker-item" data-speaker-id="${speaker.id}">
                <span class="speaker-color" style="background: ${speaker.color}"></span>
                <span class="speaker-name">${this.escapeHtml(speaker.name)}</span>
                <span class="speaker-stats">${speaker.utteranceCount}発言</span>
                <button class="speaker-edit-btn" onclick="app.editSpeaker('${speaker.id}')">✏️</button>
            </div>
        `).join('');
    }

    /**
     * タイマー開始
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            this.elements.timer.textContent = this.formatDuration(elapsed);
            this.elements.recordingDuration.textContent = this.formatDuration(elapsed);
        }, 1000);
    }

    /**
     * タイマー停止
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * 自動保存開始
     */
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.autoSaveTranscript();
        }, 60000); // 1分ごと
    }

    /**
     * 自動保存停止
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * 自動保存実行
     */
    autoSaveTranscript() {
        const data = this.transcription.exportAsJSON();
        localStorage.setItem('meeting_transcriber_autosave', data);
        localStorage.setItem('meeting_transcriber_autosave_time', new Date().toISOString());
        console.log('自動保存完了');
    }

    /**
     * 時間フォーマット
     */
    formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * クリップボードにコピー
     */
    async copyToClipboard() {
        const text = this.transcription.exportAsText();
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('クリップボードにコピーしました');
        } catch (error) {
            console.error('コピーエラー:', error);
            this.showError('コピーに失敗しました');
        }
    }

    /**
     * TXTエクスポート
     */
    exportTxt() {
        const text = this.transcription.exportAsText();
        this.downloadFile(text, 'transcript.txt', 'text/plain');
    }

    /**
     * JSONエクスポート
     */
    exportJson() {
        const json = this.transcription.exportAsJSON();
        this.downloadFile(json, 'transcript.json', 'application/json');
    }

    /**
     * SRTエクスポート
     */
    exportSrt() {
        const srt = this.transcription.exportAsSRT();
        this.downloadFile(srt, 'transcript.srt', 'text/srt');
    }

    /**
     * ファイルダウンロード
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 文字起こしをクリア
     */
    clearTranscript() {
        if (confirm('文字起こし結果をクリアしますか？')) {
            this.transcription.clear();
            this.speakerRecognition.reset();
            this.elements.transcript.innerHTML = '<p class="placeholder">録音を開始すると、ここに文字起こし結果が表示されます。</p>';
            this.updateStats();
            this.updateSpeakerList();
        }
    }

    /**
     * 話者追加モーダルを表示
     */
    showAddSpeakerModal() {
        this.currentEditingSpeakerId = null;
        this.elements.speakerNameInput.value = '';
        this.elements.speakerModal.classList.add('active');
        this.elements.speakerNameInput.focus();
    }

    /**
     * 話者編集
     */
    editSpeaker(speakerId) {
        const speaker = this.speakerRecognition.getSpeaker(speakerId);
        if (speaker) {
            this.currentEditingSpeakerId = speakerId;
            this.elements.speakerNameInput.value = speaker.name;
            this.elements.speakerModal.classList.add('active');
            this.elements.speakerNameInput.focus();
        }
    }

    /**
     * 話者名を保存
     */
    saveSpeakerName() {
        const name = this.elements.speakerNameInput.value.trim();
        if (!name) {
            this.showError('話者名を入力してください');
            return;
        }

        if (this.currentEditingSpeakerId) {
            // 既存の話者を更新
            this.speakerRecognition.updateSpeakerName(this.currentEditingSpeakerId, name);

            // 表示を更新
            const utterances = this.transcription.getUtterances();
            utterances.forEach(u => {
                if (u.speakerId === this.currentEditingSpeakerId) {
                    u.speakerName = name;
                }
            });

            // DOM更新
            document.querySelectorAll(`[data-utterance-id]`).forEach(el => {
                const id = parseInt(el.dataset.utteranceId);
                const utterance = utterances.find(u => u.id === id);
                if (utterance && utterance.speakerId === this.currentEditingSpeakerId) {
                    el.querySelector('.utterance-speaker').textContent = name;
                }
            });
        } else {
            // 新しい話者を追加
            this.speakerRecognition.addManualSpeaker(name);
        }

        this.updateSpeakerList();
        this.hideModal();
    }

    /**
     * モーダルを非表示
     */
    hideModal() {
        this.elements.speakerModal.classList.remove('active');
        this.currentEditingSpeakerId = null;
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
        const settings = localStorage.getItem('meeting_transcriber_settings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                // オーディオソースは無効でなければ設定
                const audioSourceOption = this.elements.audioSource.querySelector(`option[value="${parsed.audioSource}"]`);
                if (audioSourceOption && !audioSourceOption.disabled) {
                    this.elements.audioSource.value = parsed.audioSource || 'mic';
                }
                this.elements.language.value = parsed.language || 'ja-JP';
                this.elements.speakerDetection.checked = parsed.speakerDetection !== false;
                this.elements.autoSave.checked = parsed.autoSave !== false;

                this.transcription.setLanguage(parsed.language || 'ja-JP');
                this.speakerRecognition.setEnabled(parsed.speakerDetection !== false);
                this.updateFooterTip(this.elements.audioSource.value);
            } catch (e) {
                console.error('設定読み込みエラー:', e);
            }
        }

        // 自動保存データの復元確認
        const autosaveTime = localStorage.getItem('meeting_transcriber_autosave_time');
        if (autosaveTime) {
            const time = new Date(autosaveTime).toLocaleString('ja-JP');
            if (confirm(`前回の自動保存データ (${time}) を復元しますか？`)) {
                this.restoreAutosave();
            }
        }
    }

    /**
     * 設定を保存
     */
    saveSettings() {
        const settings = {
            audioSource: this.elements.audioSource.value,
            language: this.elements.language.value,
            speakerDetection: this.elements.speakerDetection.checked,
            autoSave: this.elements.autoSave.checked
        };
        localStorage.setItem('meeting_transcriber_settings', JSON.stringify(settings));
    }

    /**
     * 自動保存から復元
     */
    restoreAutosave() {
        const data = localStorage.getItem('meeting_transcriber_autosave');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed.utterances) {
                    parsed.utterances.forEach(u => {
                        this.transcription.utterances.push(u);
                        this.addUtteranceToDisplay(u);
                    });
                    this.updateStats();
                }
            } catch (e) {
                console.error('復元エラー:', e);
            }
        }
    }

    /**
     * エラー表示
     */
    showError(message) {
        alert('エラー: ' + message);
    }

    /**
     * トースト表示
     */
    showToast(message) {
        // 簡易的なトースト表示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * HTMLエスケープ
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MeetingTranscriber();
});
