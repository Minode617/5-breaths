/**
 * AudioProcessor - 音声のキャプチャと処理
 * マイク入力 または システム音声(getDisplayMedia)に対応
 */
class AudioProcessor {
    constructor() {
        this.mediaStream = null;
        this.audioContext = null;
        this.analyser = null;
        this.sourceNode = null;
        this.isCapturing = false;
        this.onAudioLevel = null;
        this.onAudioData = null;
        this.captureMode = 'mic'; // 'mic' or 'system'
    }

    /**
     * 音声キャプチャを開始
     * @param {string} mode - 'mic' (マイク) or 'system' (システム音声)
     */
    async startCapture(mode = 'mic') {
        this.captureMode = mode;

        try {
            if (mode === 'mic') {
                await this.startMicCapture();
            } else {
                await this.startSystemCapture();
            }
            return true;
        } catch (error) {
            console.error('音声キャプチャエラー:', error);
            throw error;
        }
    }

    /**
     * マイク入力でキャプチャ（スマホ対応）
     */
    async startMicCapture() {
        // マイクの権限を取得
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: false
        });

        await this.setupAudioContext();
    }

    /**
     * システム音声でキャプチャ（PC専用）
     */
    async startSystemCapture() {
        // getDisplayMediaでタブ/画面の音声をキャプチャ
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                displaySurface: 'browser'
            },
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            },
            preferCurrentTab: false,
            selfBrowserSurface: 'exclude',
            systemAudio: 'include'
        });

        // 音声トラックがあるか確認
        const audioTracks = this.mediaStream.getAudioTracks();
        if (audioTracks.length === 0) {
            throw new Error('音声トラックが見つかりません。「タブの音声を共有」を選択してください。');
        }

        // ビデオトラックを停止（音声のみ使用）
        const videoTracks = this.mediaStream.getVideoTracks();
        videoTracks.forEach(track => track.stop());

        await this.setupAudioContext();
    }

    /**
     * AudioContextをセットアップ
     */
    async setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // AudioContextがsuspended状態の場合はresumeする（モバイル対応）
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.sourceNode.connect(this.analyser);

        this.isCapturing = true;
        this.startLevelMonitoring();

        // トラック終了時のハンドリング
        const audioTracks = this.mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].onended = () => {
                this.stopCapture();
                if (this.onTrackEnded) {
                    this.onTrackEnded();
                }
            };
        }
    }

    /**
     * 音声レベルのモニタリングを開始
     */
    startLevelMonitoring() {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const updateLevel = () => {
            if (!this.isCapturing) return;

            this.analyser.getByteFrequencyData(dataArray);

            // 平均音量を計算
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const level = Math.min(100, (average / 128) * 100);

            if (this.onAudioLevel) {
                this.onAudioLevel(level);
            }

            requestAnimationFrame(updateLevel);
        };

        updateLevel();
    }

    /**
     * 音声の特徴量を取得（話者認識用）
     */
    getAudioFeatures() {
        if (!this.analyser) return null;

        const frequencyData = new Float32Array(this.analyser.frequencyBinCount);
        this.analyser.getFloatFrequencyData(frequencyData);

        const timeData = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(timeData);

        // 基本的な特徴量を計算
        const features = {
            // スペクトル重心（音の明るさ）
            spectralCentroid: this.calculateSpectralCentroid(frequencyData),
            // スペクトルフラックス（音の変化率）
            spectralFlux: this.calculateSpectralFlux(frequencyData),
            // ゼロ交差率
            zeroCrossingRate: this.calculateZeroCrossingRate(timeData),
            // RMSエネルギー
            rmsEnergy: this.calculateRMSEnergy(timeData),
            // MFCCライクな特徴（簡易版）
            mfccLike: this.calculateMFCCLike(frequencyData)
        };

        return features;
    }

    calculateSpectralCentroid(frequencyData) {
        let numerator = 0;
        let denominator = 0;
        const sampleRate = this.audioContext.sampleRate;
        const binSize = sampleRate / (2 * frequencyData.length);

        for (let i = 0; i < frequencyData.length; i++) {
            const magnitude = Math.pow(10, frequencyData[i] / 20);
            numerator += i * binSize * magnitude;
            denominator += magnitude;
        }

        return denominator > 0 ? numerator / denominator : 0;
    }

    calculateSpectralFlux(frequencyData) {
        if (!this.previousFrequencyData) {
            this.previousFrequencyData = new Float32Array(frequencyData);
            return 0;
        }

        let flux = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            const diff = frequencyData[i] - this.previousFrequencyData[i];
            flux += diff * diff;
        }

        this.previousFrequencyData = new Float32Array(frequencyData);
        return Math.sqrt(flux / frequencyData.length);
    }

    calculateZeroCrossingRate(timeData) {
        let crossings = 0;
        for (let i = 1; i < timeData.length; i++) {
            if ((timeData[i] >= 0 && timeData[i - 1] < 0) ||
                (timeData[i] < 0 && timeData[i - 1] >= 0)) {
                crossings++;
            }
        }
        return crossings / timeData.length;
    }

    calculateRMSEnergy(timeData) {
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
            sum += timeData[i] * timeData[i];
        }
        return Math.sqrt(sum / timeData.length);
    }

    calculateMFCCLike(frequencyData) {
        // 簡易的なMFCC風の特徴量（フィルタバンクエネルギー）
        const numBands = 13;
        const bandEnergies = new Array(numBands).fill(0);
        const bandSize = Math.floor(frequencyData.length / numBands);

        for (let band = 0; band < numBands; band++) {
            let energy = 0;
            for (let i = band * bandSize; i < (band + 1) * bandSize; i++) {
                const magnitude = Math.pow(10, frequencyData[i] / 20);
                energy += magnitude * magnitude;
            }
            bandEnergies[band] = Math.log(energy + 1e-10);
        }

        return bandEnergies;
    }

    /**
     * MediaStreamを取得（SpeechRecognition用）
     */
    getMediaStream() {
        return this.mediaStream;
    }

    /**
     * キャプチャを停止
     */
    stopCapture() {
        this.isCapturing = false;

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
    }

    /**
     * キャプチャ中かどうか
     */
    isActive() {
        return this.isCapturing;
    }
}

// グローバルに公開
window.AudioProcessor = AudioProcessor;
