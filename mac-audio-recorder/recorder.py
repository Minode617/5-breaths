"""
Mac システム音声録音モジュール
BlackHole経由で内部音声をキャプチャしてMP3保存
"""

import pyaudio
import wave
import threading
import os
from datetime import datetime
from pydub import AudioSegment


class AudioRecorder:
    def __init__(self, output_dir="~/Recordings"):
        self.output_dir = os.path.expanduser(output_dir)
        os.makedirs(self.output_dir, exist_ok=True)

        # 録音設定
        self.format = pyaudio.paInt16
        self.channels = 2
        self.rate = 44100
        self.chunk = 1024

        # 状態
        self.is_recording = False
        self.frames = []
        self.record_thread = None
        self.audio = None
        self.stream = None
        self.current_file = None

    def get_blackhole_device_index(self):
        """BlackHoleデバイスのインデックスを取得"""
        p = pyaudio.PyAudio()
        blackhole_index = None

        print("利用可能なオーディオデバイス:")
        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            print(f"  [{i}] {info['name']} (入力ch: {info['maxInputChannels']})")

            # BlackHoleを探す
            if 'BlackHole' in info['name'] and info['maxInputChannels'] > 0:
                blackhole_index = i

        p.terminate()
        return blackhole_index

    def list_devices(self):
        """利用可能なデバイス一覧を返す"""
        p = pyaudio.PyAudio()
        devices = []

        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                devices.append({
                    'index': i,
                    'name': info['name'],
                    'channels': info['maxInputChannels']
                })

        p.terminate()
        return devices

    def start_recording(self, device_index=None):
        """録音を開始"""
        if self.is_recording:
            return False

        # デバイス指定がなければBlackHoleを探す
        if device_index is None:
            device_index = self.get_blackhole_device_index()
            if device_index is None:
                print("エラー: BlackHoleが見つかりません")
                print("BlackHoleをインストールしてください: brew install blackhole-2ch")
                return False

        self.frames = []
        self.is_recording = True

        # ファイル名を生成
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.current_file = os.path.join(self.output_dir, f"recording_{timestamp}")

        # 録音スレッドを開始
        self.record_thread = threading.Thread(target=self._record_loop, args=(device_index,))
        self.record_thread.start()

        print(f"録音開始: デバイス[{device_index}]")
        return True

    def _record_loop(self, device_index):
        """録音ループ（別スレッドで実行）"""
        self.audio = pyaudio.PyAudio()

        try:
            self.stream = self.audio.open(
                format=self.format,
                channels=self.channels,
                rate=self.rate,
                input=True,
                input_device_index=device_index,
                frames_per_buffer=self.chunk
            )

            while self.is_recording:
                data = self.stream.read(self.chunk, exception_on_overflow=False)
                self.frames.append(data)

        except Exception as e:
            print(f"録音エラー: {e}")
        finally:
            if self.stream:
                self.stream.stop_stream()
                self.stream.close()
            if self.audio:
                self.audio.terminate()

    def stop_recording(self, save_as_mp3=True):
        """録音を停止してファイルに保存"""
        if not self.is_recording:
            return None

        self.is_recording = False

        # スレッドの終了を待つ
        if self.record_thread:
            self.record_thread.join(timeout=2)

        if not self.frames:
            print("録音データがありません")
            return None

        # WAVファイルとして一時保存
        wav_file = self.current_file + ".wav"
        self._save_wav(wav_file)

        if save_as_mp3:
            # MP3に変換
            mp3_file = self.current_file + ".mp3"
            self._convert_to_mp3(wav_file, mp3_file)

            # WAVファイルを削除
            os.remove(wav_file)

            print(f"保存完了: {mp3_file}")
            return mp3_file
        else:
            print(f"保存完了: {wav_file}")
            return wav_file

    def _save_wav(self, filename):
        """WAVファイルとして保存"""
        wf = wave.open(filename, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(pyaudio.PyAudio().get_sample_size(self.format))
        wf.setframerate(self.rate)
        wf.writeframes(b''.join(self.frames))
        wf.close()

    def _convert_to_mp3(self, wav_file, mp3_file, bitrate="192k"):
        """WAVをMP3に変換"""
        audio = AudioSegment.from_wav(wav_file)
        audio.export(mp3_file, format="mp3", bitrate=bitrate)

    def get_recording_duration(self):
        """現在の録音時間（秒）を取得"""
        if not self.frames:
            return 0
        return len(self.frames) * self.chunk / self.rate


# テスト用
if __name__ == "__main__":
    recorder = AudioRecorder()

    # デバイス一覧を表示
    print("\n=== オーディオデバイス一覧 ===")
    devices = recorder.list_devices()
    for d in devices:
        print(f"[{d['index']}] {d['name']}")

    print("\n録音テスト: 5秒間録音します...")
    print("BlackHoleから音声を録音するには、システム出力をBlackHoleに設定してください")

    import time

    if recorder.start_recording():
        time.sleep(5)
        file_path = recorder.stop_recording()
        print(f"\n録音ファイル: {file_path}")
    else:
        print("録音を開始できませんでした")
