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
    // // 例: 20番線に 10:42 発の「はやぶさ・こまち」を追加
    // {
    //   platform: 20,
    //   time: '10:42',
    //   service: 'はやぶさ・こまち',
    //   number: 'U999',            // unban（編成番号）
    //   displayNumber: '33E',      // 表示する号数
    //   destination: '新函館北斗·秋田',
    //   remarks: '全車指定席',
    //   remarks2: 'こまち全車指定席',
    //   carCount: '17両編成',
    //   stops: '上野・大宮・仙台・盛岡・新青森・新函館北斗',
    //   stopsByService: {
    //     はやぶさ: '上野・大宮・仙台・盛岡・新青森・新函館北斗',
    //     こまち: '上野・大宮・仙台・盛岡・雫石・田沢湖・角館・大曲・秋田'
    //   }
    // },
    {
        platform: 23,
        time: '14:30',
        service: '回送',
        number: '8530E',
        displayNumber: ' ',
        destination: '',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    },{
        platform: 21,
        time: '',
        service: 'Maxとき·Maxたにがわ',
        number: '8530E',
        displayNumber: '351',
        destination: '新潟·越後湯沢',
        remarks: '',
        carCount: '17両編成',
        stops: '大宮・熊谷・本庄早稲田・高崎・上毛高原・越後湯沢'
    },{
        platform: 23,
        time: '21:00',
        service: '回送',
        number: 'U131',
        displayNumber: ' ',
        destination: '小山支所',
        remarks: '',
        carCount: '17両編成',
        stops: ''
    },{
        platform: 20,
        time: '21:08',
        service: '回送',
        number: 'F701',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    },
    {
        platform: 22,
        time: '21:35',
        service: '回送',
        number: '変U109-2',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '10両編成',
        stops: ''
    },
    {
        platform: 21,
        time: '22:16',
        service: '回送',
        number: 'U128+変Z715-2',
        displayNumber: ' ',
        destination: '小山支所',
        remarks: '',
        carCount: '17両編成',
        stops: ''
    },
    {
        platform: 22,
        time: '22:22',
        service: '回送',
        number: 'W705',
        displayNumber: ' ',
        destination: '小山支所',
        remarks: '',
        carCount: '17両編成',
        stops: ''
    },
    {
        platform: 21,
        time: '22:36',
        service: '回送',
        number: 'G706',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '7両編成',
        stops: ''
    },
    {
        platform: 20,
        time: '22:40',
        service: '回送',
        number: '平F707',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    },
    {
        platform: 23,
        time: '23:00',
        service: '回送',
        number: '変U104-14',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '10両編成',
        stops: ''
    },
    {
        platform: 22,
        time: '23:16',
        service: '回送',
        number: 'U107+Z703',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '17両編成',
        stops: ''
    },
    {
        platform: 21,
        time: '23:18',
        service: '回送',
        number: '変F770',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    },
    {
        platform: 20,
        time: '23:28',
        service: '回送',
        number: '',
        displayNumber: ' ',
        destination: '',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    },
    {
        platform: 21,
        time: '23:30',
        service: '回送',
        number: 'U125',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '10両編成',
        stops: ''
    },
    {
        platform: 23,
        time: '23:36',
        service: '回送',
        number: 'W708',
        displayNumber: ' ',
        destination: '東京支所',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    },
    {
        platform: 20,
        time: '23:40',
        service: '回送',
        number: 'G710',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '7両編成',
        stops: ''
    },
    {
        platform: 23,
        time: '23:46',
        service: '回送',
        number: '平F713',
        displayNumber: ' ',
        destination: '東総車',
        remarks: '',
        carCount: '12両編成',
        stops: ''
    },
    {
        platform: 20,
        time: '23:48',
        service: '回送',
        number: '平変J203',
        displayNumber: ' ',
        destination: '',
        remarks: '',
        carCount: '10両編成',
        stops: ''
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
