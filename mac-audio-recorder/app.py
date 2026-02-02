"""
Mac システム音声録音アプリ
メニューバーに常駐してワンクリックで録音
"""

import rumps
import os
import subprocess
from recorder import AudioRecorder


class AudioRecorderApp(rumps.App):
    def __init__(self):
        super().__init__("🎙️", quit_button=None)

        self.recorder = AudioRecorder()
        self.recording_timer = None

        # メニュー項目
        self.record_button = rumps.MenuItem("録音開始", callback=self.toggle_recording)
        self.status_item = rumps.MenuItem("状態: 待機中")
        self.status_item.set_callback(None)  # クリック不可

        self.menu = [
            self.record_button,
            None,  # セパレータ
            self.status_item,
            None,
            rumps.MenuItem("録音フォルダを開く", callback=self.open_recordings_folder),
            rumps.MenuItem("デバイス一覧", callback=self.show_devices),
            None,
            rumps.MenuItem("終了", callback=self.quit_app),
        ]

    def toggle_recording(self, _):
        """録音の開始/停止を切り替え"""
        if self.recorder.is_recording:
            self.stop_recording()
        else:
            self.start_recording()

    def start_recording(self):
        """録音を開始"""
        if self.recorder.start_recording():
            self.title = "🔴"
            self.record_button.title = "録音停止"
            self.status_item.title = "状態: 録音中..."

            # タイマーで録音時間を更新
            self.recording_timer = rumps.Timer(self.update_duration, 1)
            self.recording_timer.start()

            rumps.notification(
                title="録音開始",
                subtitle="",
                message="システム音声の録音を開始しました"
            )
        else:
            rumps.notification(
                title="エラー",
                subtitle="",
                message="BlackHoleが見つかりません。インストールしてください。"
            )

    def stop_recording(self):
        """録音を停止"""
        if self.recording_timer:
            self.recording_timer.stop()
            self.recording_timer = None

        file_path = self.recorder.stop_recording()

        self.title = "🎙️"
        self.record_button.title = "録音開始"
        self.status_item.title = "状態: 待機中"

        if file_path:
            filename = os.path.basename(file_path)
            rumps.notification(
                title="録音完了",
                subtitle=filename,
                message="クリックしてフォルダを開く"
            )

    def update_duration(self, _):
        """録音時間を更新"""
        duration = self.recorder.get_recording_duration()
        minutes = int(duration // 60)
        seconds = int(duration % 60)
        self.status_item.title = f"状態: 録音中 {minutes:02d}:{seconds:02d}"

    def open_recordings_folder(self, _):
        """録音フォルダをFinderで開く"""
        folder = self.recorder.output_dir
        subprocess.run(["open", folder])

    def show_devices(self, _):
        """利用可能なデバイス一覧を表示"""
        devices = self.recorder.list_devices()

        device_list = "\n".join([f"[{d['index']}] {d['name']}" for d in devices])

        blackhole_found = any('BlackHole' in d['name'] for d in devices)
        status = "✅ BlackHole検出" if blackhole_found else "❌ BlackHole未検出"

        rumps.alert(
            title="オーディオデバイス",
            message=f"{status}\n\n{device_list}"
        )

    def quit_app(self, _):
        """アプリを終了"""
        if self.recorder.is_recording:
            self.stop_recording()
        rumps.quit_application()


if __name__ == "__main__":
    app = AudioRecorderApp()
    app.run()
