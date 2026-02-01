/**
 * SpeakerRecognition - 音声特徴量による話者認識
 * 簡易的なクラスタリングで話者を識別
 */
class SpeakerRecognition {
    constructor() {
        this.speakers = new Map(); // speakerId -> { name, features[], color }
        this.speakerCount = 0;
        this.featureHistory = []; // 最近の特徴量履歴
        this.historyMaxSize = 50;
        this.currentSpeakerId = null;
        this.silenceThreshold = 0.01;
        this.speakerColors = [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // purple
            '#ec4899', // pink
            '#06b6d4', // cyan
            '#84cc16'  // lime
        ];
        this.enabled = true;
        this.minFeatureSamples = 5; // 話者を確定するための最小サンプル数
    }

    /**
     * 話者認識の有効/無効を切り替え
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 音声特徴量から話者を識別
     */
    identifySpeaker(features) {
        if (!this.enabled || !features) {
            return this.currentSpeakerId;
        }

        // 無音の場合はスキップ
        if (features.rmsEnergy < this.silenceThreshold) {
            return null;
        }

        // 特徴量ベクトルを作成
        const featureVector = this.createFeatureVector(features);

        // 既存の話者との類似度を計算
        let bestMatch = null;
        let bestSimilarity = -Infinity;

        for (const [speakerId, speaker] of this.speakers) {
            const similarity = this.calculateSimilarity(featureVector, speaker.centroid);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = speakerId;
            }
        }

        // 類似度が閾値を超えていれば既存の話者
        const similarityThreshold = 0.7;
        if (bestMatch && bestSimilarity > similarityThreshold) {
            this.updateSpeakerFeatures(bestMatch, featureVector);
            this.currentSpeakerId = bestMatch;
            return bestMatch;
        }

        // 新しい話者を追加
        if (this.shouldCreateNewSpeaker(featureVector)) {
            const newSpeakerId = this.createNewSpeaker(featureVector);
            this.currentSpeakerId = newSpeakerId;
            return newSpeakerId;
        }

        // 特徴量を履歴に追加
        this.featureHistory.push(featureVector);
        if (this.featureHistory.length > this.historyMaxSize) {
            this.featureHistory.shift();
        }

        return this.currentSpeakerId;
    }

    /**
     * 特徴量ベクトルを作成
     */
    createFeatureVector(features) {
        return [
            features.spectralCentroid / 8000, // 正規化
            features.zeroCrossingRate,
            features.rmsEnergy * 10,
            ...features.mfccLike.map(v => v / 20) // 正規化
        ];
    }

    /**
     * コサイン類似度を計算
     */
    calculateSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator > 0 ? dotProduct / denominator : 0;
    }

    /**
     * 新しい話者を作成すべきかどうか判定
     */
    shouldCreateNewSpeaker(featureVector) {
        // 履歴が十分にある場合のみ新しい話者を作成
        if (this.featureHistory.length < this.minFeatureSamples) {
            return false;
        }

        // 履歴内の特徴量が一貫しているか確認
        const avgSimilarity = this.calculateAverageHistorySimilarity(featureVector);
        return avgSimilarity > 0.8;
    }

    /**
     * 履歴との平均類似度を計算
     */
    calculateAverageHistorySimilarity(featureVector) {
        if (this.featureHistory.length === 0) return 0;

        let totalSimilarity = 0;
        for (const histFeature of this.featureHistory) {
            totalSimilarity += this.calculateSimilarity(featureVector, histFeature);
        }
        return totalSimilarity / this.featureHistory.length;
    }

    /**
     * 新しい話者を作成
     */
    createNewSpeaker(featureVector) {
        this.speakerCount++;
        const speakerId = `speaker_${this.speakerCount}`;
        const colorIndex = (this.speakerCount - 1) % this.speakerColors.length;

        // 履歴の特徴量を含めて重心を計算
        const allFeatures = [...this.featureHistory, featureVector];
        const centroid = this.calculateCentroid(allFeatures);

        this.speakers.set(speakerId, {
            id: speakerId,
            name: `話者 ${this.speakerCount}`,
            features: allFeatures,
            centroid: centroid,
            color: this.speakerColors[colorIndex],
            utteranceCount: 0,
            totalDuration: 0
        });

        // 履歴をクリア
        this.featureHistory = [];

        return speakerId;
    }

    /**
     * 話者の特徴量を更新
     */
    updateSpeakerFeatures(speakerId, featureVector) {
        const speaker = this.speakers.get(speakerId);
        if (!speaker) return;

        // 特徴量を追加（最大100個まで保持）
        speaker.features.push(featureVector);
        if (speaker.features.length > 100) {
            speaker.features.shift();
        }

        // 重心を再計算
        speaker.centroid = this.calculateCentroid(speaker.features);

        // 履歴をクリア
        this.featureHistory = [];
    }

    /**
     * 特徴量の重心を計算
     */
    calculateCentroid(features) {
        if (features.length === 0) return null;

        const dimension = features[0].length;
        const centroid = new Array(dimension).fill(0);

        for (const feature of features) {
            for (let i = 0; i < dimension; i++) {
                centroid[i] += feature[i];
            }
        }

        for (let i = 0; i < dimension; i++) {
            centroid[i] /= features.length;
        }

        return centroid;
    }

    /**
     * 話者情報を取得
     */
    getSpeaker(speakerId) {
        return this.speakers.get(speakerId);
    }

    /**
     * 全話者を取得
     */
    getAllSpeakers() {
        return Array.from(this.speakers.values());
    }

    /**
     * 話者名を更新
     */
    updateSpeakerName(speakerId, newName) {
        const speaker = this.speakers.get(speakerId);
        if (speaker) {
            speaker.name = newName;
        }
    }

    /**
     * 話者の発言カウントを増加
     */
    incrementUtteranceCount(speakerId) {
        const speaker = this.speakers.get(speakerId);
        if (speaker) {
            speaker.utteranceCount++;
        }
    }

    /**
     * 話者の統計情報を取得
     */
    getSpeakerStats() {
        const stats = [];
        for (const [id, speaker] of this.speakers) {
            stats.push({
                id: id,
                name: speaker.name,
                color: speaker.color,
                utteranceCount: speaker.utteranceCount
            });
        }
        return stats;
    }

    /**
     * リセット
     */
    reset() {
        this.speakers.clear();
        this.speakerCount = 0;
        this.featureHistory = [];
        this.currentSpeakerId = null;
    }

    /**
     * 手動で話者を追加
     */
    addManualSpeaker(name) {
        this.speakerCount++;
        const speakerId = `speaker_${this.speakerCount}`;
        const colorIndex = (this.speakerCount - 1) % this.speakerColors.length;

        this.speakers.set(speakerId, {
            id: speakerId,
            name: name || `話者 ${this.speakerCount}`,
            features: [],
            centroid: null,
            color: this.speakerColors[colorIndex],
            utteranceCount: 0,
            totalDuration: 0
        });

        return speakerId;
    }
}

// グローバルに公開
window.SpeakerRecognition = SpeakerRecognition;
