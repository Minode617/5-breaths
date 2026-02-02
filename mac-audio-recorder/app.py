"""
Mac 音声録音アプリ
メニューバーに常駐してワンクリックで録音
システム音声（BlackHole経由）またはマイク入力に対応
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
        self.selected_device_index = None  # None = 自動選択
        self.selected_device_name = "自動 (BlackHole優先)"

        # メニュー項目
        self.record_button = rumps.MenuItem("録音開始", callback=self.toggle_recording)
        self.status_item = rumps.MenuItem("状態: 待機中")
        self.status_item.set_callback(None)

        self.device_menu = rumps.MenuItem("入力デバイス")
        self.current_device_item = rumps.MenuItem(f"現在: {self.selected_device_name}")
        self.current_device_item.set_callback(None)

        self.menu = [
            self.record_button,
            None,
            self.status_item,
            self.current_device_item,
            None,
            self.device_menu,
            rumps.MenuItem("録音フォルダを開く", callback=self.open_recordings_folder),
            None,
            rumps.MenuItem("終了", callback=self.quit_app),
        ]

        # デバイスメニューを構築
        self.build_device_menu()

    def build_device_menu(self):
        """入力デバイスのサブメニューを構築"""
        self.device_menu.clear()

        # 自動選択オプション
        auto_item = rumps.MenuItem(
            "✓ 自動 (BlackHole優先)" if self.selected_device_index is None else "自動 (BlackHole優先)",
            callback=lambda _: self.select_device(None, "自動 (BlackHole優先)")
        )
        self.device_menu.add(auto_item)
        self.device_menu.add(None)  # セパレータ

        # 利用可能なデバイス
        devices = self.recorder.list_devices()
        for device in devices:
            is_selected = self.selected_device_index == device['index']
            prefix = "✓ " if is_selected else ""

            # デバイス種別を判定
            if 'BlackHole' in device['name']:
                label = f"{prefix}🔊 {device['name']} (システム音声)"
            elif 'MacBook' in device['name'] or 'Built-in' in device['name'] or 'Internal' in device['name']:
                label = f"{prefix}🎤 {device['name']} (内蔵マイク)"
            else:
                label = f"{prefix}🎧 {device['name']}"

            item = rumps.MenuItem(
                label,
                callback=lambda _, d=device: self.select_device(d['index'], d['name'])
            )
            self.device_menu.add(item)

    def select_device(self, device_index, device_name):
        """入力デバイスを選択"""
        self.selected_device_index = device_index
        self.selected_device_name = device_name
        self.current_device_item.title = f"現在: {device_name}"
        self.build_device_menu()  # メニューを再構築

        rumps.notification(
            title="入力デバイス変更",
            subtitle="",
            message=f"{device_name} を選択しました"
        )

    def toggle_recording(self, _):
        """録音の開始/停止を切り替え"""
        if self.recorder.is_recording:
            self.stop_recording()
        else:
            self.start_recording()

    def start_recording(self):
        """録音を開始"""
        if self.recorder.start_recording(device_index=self.selected_device_index):
            self.title = "🔴"
            self.record_button.title = "録音停止"
            self.status_item.title = "状態: 録音中..."

            # タイマーで録音時間を更新
            self.recording_timer = rumps.Timer(self.update_duration, 1)
            self.recording_timer.start()

            source = "マイク" if self.selected_device_index is not None and 'BlackHole' not in self.selected_device_name else "システム音声"
            rumps.notification(
                title="録音開始",
                subtitle=self.selected_device_name,
                message=f"{source}の録音を開始しました"
            )
        else:
            rumps.notification(
                title="エラー",
                subtitle="",
                message="録音デバイスにアクセスできません"
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

    def quit_app(self, _):
        """アプリを終了"""
        if self.recorder.is_recording:
            self.stop_recording()
        rumps.quit_application()


if __name__ == "__main__":
    app = AudioRecorderApp()
    app.run()
