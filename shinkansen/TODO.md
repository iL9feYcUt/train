# 放送機能 実装 TODO

## 完了項目
- [ ] `index.html` に `script2.js` を追加
- [ ] `script2.js` を作成（発車放送・回送放送全ロジック）

## タスク詳細
1. `index.html`: `<script src="script2.js"></script>` を `script.js` の後に追加
2. `script2.js` 作成:
   - 発車メロディ定義（番線→音声ファイル）
   - メロディ再生（0.5〜3.0コーラスランダム、発車60〜30秒前に開始）
   - メロディ開始6.5秒後に放送開始
   - 一般列車: COSMOS音声パーツ構築（参考ロジックを移植）
   - 回送列車: `COSMOS/track_of/{番線}.mp3` + `COSMOS/name/回送.mp3`
   - 音声プリロード（初回ラグ対策）
