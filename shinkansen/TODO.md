# TODO - 到着放送機能追加

## ステップ
- [x] 計画の承認
- [x] script.js: 発列車オブジェクトに unban を追加
- [x] script.js: 着列車オブジェクトを収集し arrivalTrains として各ボードに保持
- [x] script2.js: buildTrainNameNumberDestParts にリファクタ（列車名+号数+行先）
- [x] script2.js: buildArrivalNoParts / buildArrivalIdentityParts（到着の列車名と号数）
- [x] script2.js: buildTimeParts（折り返し後発車時刻）
- [x] script2.js: startArrivalBroadcast / checkArrivals（120秒前から開始、unban照合）
- [x] script2.js: 到着放送用音声のプリロード追加
- [x] script2.js: initBroadcast に到着監視を組み込み
- [x] テスト・確認（実装確認済み）
