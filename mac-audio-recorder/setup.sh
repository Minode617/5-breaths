#!/bin/bash
# Mac Audio Recorder セットアップスクリプト

echo "=== Mac Audio Recorder セットアップ ==="
echo ""

# Homebrewの確認
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrewがインストールされていません"
    echo "   インストール: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi
echo "✅ Homebrew: OK"

# BlackHoleの確認とインストール
if ! brew list blackhole-2ch &> /dev/null; then
    echo "📦 BlackHoleをインストールしています..."
    brew install blackhole-2ch
else
    echo "✅ BlackHole: OK"
fi

# PortAudioの確認とインストール（PyAudioに必要）
if ! brew list portaudio &> /dev/null; then
    echo "📦 PortAudioをインストールしています..."
    brew install portaudio
else
    echo "✅ PortAudio: OK"
fi

# ffmpegの確認とインストール（pydubに必要）
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 ffmpegをインストールしています..."
    brew install ffmpeg
else
    echo "✅ ffmpeg: OK"
fi

# Python仮想環境のセットアップ
echo ""
echo "📦 Python仮想環境をセットアップしています..."
python3 -m venv venv
source venv/bin/activate

# 依存関係のインストール
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "次のステップ:"
echo "1. Audio MIDI設定で「複数出力デバイス」を作成"
echo "   - BlackHole 2ch + 内蔵スピーカーにチェック"
echo "2. システム設定 > サウンド > 出力 で「複数出力デバイス」を選択"
echo "3. アプリを起動: source venv/bin/activate && python app.py"
echo ""
