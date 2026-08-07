# 放送機能の追加

## タスク
- [x] 計画の作成と承認
- [x] `script2.js` を作成（発車メロディ + 放送ロジック）
- [x] `index.html` に `script2.js` を追加
- [x] `script.js` に `boards` データ公開と放送初期化処理を追加
- [x] テスト・動作確認

# remarks と remarks2 の表示改善

## タスク
- [x] `script.js` - `FORMATION_CAR_COUNT` 定数を抽出し `computeCarCount` をリファクタリング
- [x] `script.js` - `computeFirstServiceCarCount` ヘルパーを追加（併結列車の先頭種別の両数）
- [x] `script.js` - `computeServiceRemark` ヘルパーを追加（単一種別の remarks ロジック）
- [x] `script.js` - `computeRemarks` をリファクタリング:
  - 併結列車: 先頭種別の実際の remarks を表示（例: はやぶさ全車指定席, やまびこ自由席1~7号車）
  - 単独列車: 従来どおり
- [x] テスト・動作確認

# 併結列車のはやぶさを黄緑色で表示

## タスク
- [x] `script.js` - `getServiceDestination` ヘルパーを追加（併結列車のサービスごとの行先）
- [x] `script.js` - `renderService` を更新（サービスごとの行先で色を決定）
- [x] `script.js` - `getTrainAccentColors` を更新
- [x] `script.js` - `renderStopsLine` を更新
- [x] `script.js` - `startStopStationMarquee` の `updateServiceLabel` を更新
- [x] `script.js` - `renderBoard` の `numberColor` を更新
- [x] テスト・動作確認

# 停車駅のセグメントごとに固定/スクロールを切り替える

## タスク
- [x] 計画の作成と承認
- [x] `script.js` - `startStopStationMarquee` を書き換え:
  - 各セグメントを独立に評価: 収まる場合は固定表示（7秒で切替）、あふれる場合はスクロール
- [x] `script.js` - `stopStopStationMarquee` を更新（7秒タイマーをクリア）
- [x] `fitTextToContainer` を更新（`isCombined` による強制スクロールを廃止し、セグメントごとに判定）
- [x] テスト・動作確認

# 「列車がまいります」の表示開始時・終了時に発車標を表示更新

## タスク
- [x] `script.js` - `startArrivalMonitor` を更新:
  - 「列車がまいります」表示開始時（`.arrival-message` 追加後）に `fitTextToContainer()` を呼び出して該当発車標の表示を更新
  - 表示終了時（`.arrival-message` 除去・停車駅復元後）に `fitTextToContainer()` を呼び出して停車駅のマーキー/スクロールを再初期化
- [x] テスト・動作確認
