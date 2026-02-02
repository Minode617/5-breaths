# Mac Audio Recorder

Macのシステム音声（内部音声）をMP3で録音するメニューバーアプリ

## 機能

- メニューバーに常駐
- ワンクリックで録音開始/停止
- 自動でMP3形式で保存
- 録音時間をリアルタイム表示

## 必要なもの

- macOS
- BlackHole（仮想オーディオドライバ）
- Python 3.8以上

## セットアップ

### 1. 自動セットアップ

```bash
chmod +x setup.sh
./setup.sh
```

### 2. 手動セットアップ

```bash
# BlackHoleをインストール
brew install blackhole-2ch

# PortAudio（PyAudioに必要）
brew install portaudio

# ffmpeg（MP3変換に必要）
brew install ffmpeg

# Python依存関係
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. オーディオ設定

1. **Audio MIDI設定**を開く（Spotlightで検索）
2. 左下の「+」→「複数出力デバイスを作成」
3. 以下にチェックを入れる：
   - BlackHole 2ch
   - 内蔵スピーカー（または使用中のスピーカー）
4. **システム設定 > サウンド > 出力** で「複数出力デバイス」を選択

## 使い方

```bash
source venv/bin/activate
python app.py
```

メニューバーに 🎙️ アイコンが表示されます。

| 操作 | 説明 |
|------|------|
| 🎙️ クリック | メニューを開く |
| 録音開始 | 録音を開始（アイコンが 🔴 に変化） |
| 録音停止 | 録音を停止してMP3保存 |

録音ファイルは `~/Recordings/` に保存されます。

## ファイル構成

```
mac-audio-recorder/
├── app.py          # メニューバーアプリ
├── recorder.py     # 録音ロジック
├── requirements.txt
├── setup.sh        # セットアップスクリプト
└── README.md
```

## トラブルシューティング

### BlackHoleが検出されない

1. BlackHoleがインストールされているか確認：`brew list blackhole-2ch`
2. 再起動してみる
3. Audio MIDI設定でBlackHoleが表示されているか確認

### 録音されない / 無音

1. システム出力が「複数出力デバイス」になっているか確認
2. 複数出力デバイスにBlackHoleが含まれているか確認
3. 音声を再生しながら録音テスト
