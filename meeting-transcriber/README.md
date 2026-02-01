# Web会議 文字起こしシステム

Zoom、Microsoft Teams、Google Meetなどのオンライン会議をリアルタイムで文字起こしするWebアプリケーション。

## 機能

- **システム音声キャプチャ**: `getDisplayMedia` APIを使用してタブ/画面の音声を録音
- **リアルタイム文字起こし**: Web Speech APIによる音声認識
- **話者認識**: 音声特徴量（スペクトル重心、MFCC等）によるクラスタリング
- **エクスポート**: TXT / JSON / SRT形式での出力
- **自動保存**: LocalStorageへの定期保存

## 使い方

1. `index.html` をブラウザで開く（Chrome / Edge推奨）
2. 「録音開始」ボタンをクリック
3. 画面共有ダイアログで会議を行っているタブを選択し、「タブの音声を共有」にチェック
4. 会議の音声がリアルタイムで文字起こしされる
5. 「録音停止」で終了し、各種形式でエクスポート可能

## 対応ブラウザ

- Google Chrome (推奨)
- Microsoft Edge
- その他Chromiumベースブラウザ

※ Firefoxは `getDisplayMedia` での音声キャプチャに制限があります

## ファイル構成

```
meeting-transcriber/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── app.js              # メインアプリケーション
├── audio-processor.js  # 音声キャプチャ・処理
├── speaker-recognition.js  # 話者認識
├── transcription.js    # 文字起こし
├── manifest.json       # PWAマニフェスト
└── icon.svg            # アプリアイコン
```

## 技術スタック

- **音声キャプチャ**: MediaDevices.getDisplayMedia API
- **音声分析**: Web Audio API (AnalyserNode)
- **音声認識**: Web Speech API (SpeechRecognition)
- **話者認識**: 自前実装（特徴量抽出 + コサイン類似度）
