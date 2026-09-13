// ============================================================
// デバッグ用・追加データ
// ============================================================
// API に存在しない列車を発車標に追加表示するためのデータファイル。
// このファイルは script.js の前に読み込まれる前提。
//
// 追加する列車は以下の形式で記述する。
// {
//   platform: 番線 (20/21/22/23),
//   time: 'HH:MM',
//   service: '列車名 (「・」で複数併結)',
//   number: 'unban (編成番号)。折り返し回送などで列車どうしを紐づけるために使用',
//   displayNumber: '表示する号数 (任意)。省略時は番号欄は空',
//   destination: '行先 (「・」で複数)',
//   remarks: '記事 (例: 全車指定席)',
//   remarks2: '追加記事 (任意)',
//   carCount: '両数 (例: 17両編成)',
//   stops: '停車駅 (「・」区切り)',
//   stopsByService: { 種別: '停車駅' }  // 併結列車の場合 (任意)
// }
//
// この配列を編集して、追加したい列車を自由に追加できる。
window.DEBUG_TRAINS = [
     // 例: 20番線に 10:42 発の「はやぶさ・こまち」を追加
     {
       platform: 21,
       time: '',
       service: 'やまびこ·つばさ',
       number: 'U999',            // unban（編成番号）
       displayNumber: '309E',      // 表示する号数
       destination: '白石蔵王·さくらんぼ東根',  // 行先
       remarks: '全車指定席',
       remarks2: 'つばさ全車指定席',
       carCount: '17両編成',
       stops: '上野・大宮・宇都宮・福島・仙台・白石蔵王',
       stopsByService: {
         やまびこ: '上野・大宮・宇都宮・福島・仙台・白石蔵王',
         つばさ: '上野・大宮・宇都宮・福島・米沢・赤湯・山形・さくらんぼ東根'
       }
     },
    {
        platform: 21,
        time: '',
        service: 'やまびこ',
        number: '8530E',
        displayNumber: '401',
        destination: '新花巻',
        remarks: '自由席1~7号車',
        carCount: '10両編成',
        stops: '大宮・宇都宮・福島・仙台・一ノ関・水沢江刺・北上・新花巻',
        /*stopsByService: {
        はやぶさ: '上野・大宮・仙台・盛岡・新青森・新函館北斗',
        こまち: '上野・大宮・仙台・盛岡・雫石'
        }*/
    },
    {
        platform: 22,
        time: '23:59',
        service: '回送',
        number: 'F760',
        displayNumber: ' ',
        destination: '当駅止まり',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    }
];
// Current-time debug setting. Use an ISO 8601 value to start from a test time.
// The simulated clock advances at real-time speed. Keep null to use real time.
// Example: window.DEBUG_CURRENT_TIME = '2026-09-11T10:30:00+09:00';
window.DEBUG_CURRENT_TIME = null;
