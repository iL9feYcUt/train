// ============================================================
// 発車放送機能 (script2.js)
// ============================================================

// ---- 設定 ----
const MELODY_FILES = {
    20: 'sounds/JRE-IKST-101-01.mp3',
    21: 'sounds/JRE-IKST-104-01.mp3',
    22: 'sounds/JRE-IKST-102-01.mp3',
    23: 'sounds/JRE-IKST-105-01.mp3'
};
const BROADCAST_PLATFORMS = [20, 21, 22, 23];
const BROADCAST_DELAY_MS = 6500; // メロディ開始から放送開始までの遅延

// ---- 状態管理 ----
const broadcastState = {
    scheduled: new Set(),       // スケジュール済みの発車列車ID
    arrivalScheduled: new Set(),// スケジュール済みの到着列車ID
    active: false,              // 放送中フラグ
};

// 放送用の各列車を一意に識別するID
function getTrainId(platform, train) {
    return `${platform}_${train.number || train.time || ''}_${train.departureMs || 0}`;
}

// ============================================================
// 音声プリロード（初回読み込みラグ対策）
// ============================================================

function preloadAudio(url) {
    try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        audio.load();
    } catch (e) {
        console.warn('音声プリロード失敗:', url, e);
    }
}

function preloadAllAudio(boards) {
    // 発車メロディをプリロード
    Object.values(MELODY_FILES).forEach(url => preloadAudio(url));

    // 固定フレーズをプリロード
    [
        'COSMOS/行が.mp3',
        'COSMOS/発車いたします.mp3',
        'COSMOS/次は.mp3',
        'COSMOS/とまります.mp3',
        'COSMOS/黄色い点字ブロック.mp3',
        'COSMOS/行と.mp3',
        'COSMOS/name/回送.mp3'
    ].forEach(url => preloadAudio(url));

// 番線関連をプリロード
    BROADCAST_PLATFORMS.forEach(p => {
        preloadAudio(`COSMOS/track_from/${p}.mp3`);
        preloadAudio(`COSMOS/track_of/${p}.mp3`);
        preloadAudio(`COSMOS/track_to/${p}.mp3`);
    });

    // 到着放送用の固定フレーズをプリロード
    [
        'COSMOS/COSMOS接近音.mp3',
        'COSMOS/入ります.mp3',
        'COSMOS/この電車は.mp3',
        'COSMOS/当駅止まりです.mp3',
        'COSMOS/折り返し.mp3',
        'COSMOS/回送電車となります.mp3',
        'COSMOS/行となります.mp3'
    ].forEach(url => preloadAudio(url));

    // 列車データから必要な音声をプリロード
    boards.forEach(board => {
        (board.departures || []).forEach(train => {
            if (train.service === '回送') return;

            const serviceNames = (train.service || '').split(/[・·]/).filter(Boolean);
            serviceNames.forEach(name => {
                if (name) preloadAudio(`COSMOS/name/${name}.mp3`);
            });

            const dests = (train.destination || '').split(/[・·]/).filter(Boolean).map(normalizeAudioFileName);
            dests.forEach(d => {
                if (d) preloadAudio(`COSMOS/stations_up/${d}.mp3`);
            });

            // 号数パーツをプリロード
            const digits = extractNumberDigits(train);
            const numParts = buildNoParts(digits.h, digits.t, digits.o);
            numParts.forEach(cands => cands.forEach(url => preloadAudio(url)));

            // 次の停車駅をプリロード
            const next = (train.stops || '').split('・').filter(Boolean)[0];
            if (next) preloadAudio(`COSMOS/next/${normalizeAudioFileName(next)}.mp3`);
        });
    });
}

// 列車番号から百・十・一の位を抽出
function extractNumberDigits(train) {
    const number = train.displayNumber || train.number || '';
    const matches = (number || '').match(/[0-9]+/g) || [];
    let digits = '';
    if (matches.length) {
        digits = matches[matches.length - 1].slice(-3).replace(/^0+/, '');
    }
    return {
        h: digits.length >= 3 ? digits[0] : '0',
        t: digits.length >= 2 ? digits[digits.length - 2] : '0',
        o: digits.length >= 1 ? digits[digits.length - 1] : '0'
    };
}

// ============================================================
// 号数パーツ
// ============================================================

function buildNoParts(hund, ten, one) {
    const parts = [];
    const hd = parseInt(hund, 10) || 0;
    const td = parseInt(ten, 10) || 0;
    const od = parseInt(one, 10) || 0;
    const h = hd * 100;
    const t = td * 10;
    const o = od;

    // 特別扱い: ちょうど百の倍数（例:100,200...）
    if (h > 0 && t === 0 && o === 0) {
        parts.push([`COSMOS/no/${h}号.mp3`, `COSMOS/no/${h}.mp3`]);
        return parts;
    }

    // 百の位
    if (h > 0) {
        parts.push([`COSMOS/no/${h}.mp3`, `COSMOS/no/${h}号.mp3`]);
    }

    // 十の位
    if (t > 0) {
        if (o === 0) {
            parts.push([`COSMOS/no/${t}号.mp3`, `COSMOS/no/${t}.mp3`]);
        } else {
            parts.push([`COSMOS/no/${t}.mp3`, `COSMOS/no/${t}号.mp3`]);
        }
    }

    // 一の位（1桁のときは必ず「1号.mp3」のみ。素の1.mp3は存在しないためフォールバックしない）
    if (o > 0) {
        parts.push([`COSMOS/no/${o}号.mp3`]);
    }

    return parts;
}

// ============================================================
// 放送パーツ構築（列車データから）
// ============================================================

// ファイル名の区切り文字を統一する（山形·新庄 -> 山形・新庄）
// 新庄行は新庄.mp3を使用する
function normalizeAudioFileName(name) {
    let n = (name || '').replace(/·/g, '・');
    if (n === '山形・新庄') {
        n = '新庄';
    }
    return n;
}

// 併結列車の各サービスに対応する「最終行先」を取得する。
// 表示上の行先は種別順に並ぶため、複合行先（例: 山形・新庄）は後方の行先が最終行先になる。
// 例) やまびこ・つばさ / 仙台・山形・新庄
//     -> やまびこ: 仙台, つばさ: 新庄
// 例) はやぶさ・こまち / 新函館北斗・秋田
//     -> はやぶさ: 新函館北斗, こまち: 秋田
function getFinalDestinations(serviceText, destination) {
    const serviceNames = (serviceText || '').split(/[・·]/).filter(Boolean);
    const dests = (destination || '').split(/[・·]/).filter(Boolean);
    const result = [];

    serviceNames.forEach((serviceName, index) => {
        // script.js の getServiceTerminals でこのサービスに属する行先を特定する
        const terminals = (typeof getServiceTerminals === 'function')
            ? getServiceTerminals(serviceName)
            : new Set();
        const matched = dests.filter((d) => terminals.has(d));
        // このサービスに属する行先があれば最後のもの（最終行先）を使う
        if (matched.length > 0) {
            result.push(matched[matched.length - 1]);
        } else {
            // 属する行先が特定できない場合は、表示順の該当インデックスをフォールバック
            result.push(dests[index] || '');
        }
    });

    return result;
}

// 併結列車の各サービスに対応する「最終行先」を取得する。
// (既存の getFinalDestinations と同じロジック。script2.js 内で自己完結するよう定義)
function getFinalDestinationsLocal(serviceText, destination) {
    const serviceNames = (serviceText || '').split(/[・·]/).filter(Boolean);
    const dests = (destination || '').split(/[・·]/).filter(Boolean);
    const result = [];

    serviceNames.forEach((serviceName, index) => {
        const terminals = (typeof getServiceTerminals === 'function')
            ? getServiceTerminals(serviceName)
            : new Set();
        const matched = dests.filter((d) => terminals.has(d));
        if (matched.length > 0) {
            result.push(matched[matched.length - 1]);
        } else {
            result.push(dests[index] || '');
        }
    });

    return result;
}

// 列車名 + 号数 + 行先 のパーツを構築する（発車放送・折り返し後列車の放送で共用）
function getTrainNameNumberDestParts(train) {
    const parts = [];
    const serviceNames = (train.service || '').split(/[・·]/).filter(Boolean);
    const dests = (train.destination || '').split(/[・·]/).filter(Boolean).map(normalizeAudioFileName);
    const digits = extractNumberDigits(train);
    const coupled = serviceNames.length > 1;

    if (!coupled) {
        if (serviceNames[0]) parts.push([`COSMOS/name/${serviceNames[0]}.mp3`]);
        const noParts = buildNoParts(digits.h, digits.t, digits.o);
        noParts.forEach(p => parts.push(p));
        if (dests[0]) parts.push([`COSMOS/stations_up/${dests[0]}.mp3`]);
    } else {
        const finalDests = getFinalDestinationsLocal(train.service, train.destination).map(normalizeAudioFileName);
        const dest1 = finalDests[0] || '';
        const dest2 = finalDests[1] || '';
        const name1 = serviceNames[0] || '';
        const name2 = serviceNames[1] || '';

        if (dest1 !== dest2) {
            if (name1) parts.push([`COSMOS/name/${name1}.mp3`]);
            const noPartsA = buildNoParts(digits.h, digits.t, digits.o);
            noPartsA.forEach(p => parts.push(p));
            if (dest1) parts.push([`COSMOS/stations_up/${dest1}.mp3`]);
            parts.push([`COSMOS/行と.mp3`]);

            if (name2) parts.push([`COSMOS/name/${name2}.mp3`]);
            const noPartsB = buildNoParts(digits.h, digits.t, digits.o);
            noPartsB.forEach(p => parts.push(p));
            if (dest2) parts.push([`COSMOS/stations_up/${dest2}.mp3`]);
        } else {
            if (name1) parts.push([`COSMOS/name/${name1}.mp3`]);
            const noPartsA = buildNoParts(digits.h, digits.t, digits.o);
            if (noPartsA.length > 0) {
                const hdA = parseInt(digits.h, 10) || 0;
                const tdA = parseInt(digits.t, 10) || 0;
                const odA = parseInt(digits.o, 10) || 0;
                const numericPartsA = [];
                if (hdA > 0) numericPartsA.push(hdA * 100);
                if (tdA > 0) numericPartsA.push(tdA * 10);
                if (odA > 0) numericPartsA.push(odA);
                if (numericPartsA.length > 0) {
                    const lastNumber = numericPartsA[numericPartsA.length - 1];
                    const lastIdx = noPartsA.length - 1;
                    const candidate = `COSMOS/no/${lastNumber}号と.mp3`;
                    if (noPartsA[lastIdx].indexOf(candidate) === -1) {
                        noPartsA[lastIdx].unshift(candidate);
                    }
                }
            }
            noPartsA.forEach(p => parts.push(p));

            if (name2) parts.push([`COSMOS/name/${name2}.mp3`]);
            const noPartsB = buildNoParts(digits.h, digits.t, digits.o);
            noPartsB.forEach(p => parts.push(p));
            if (dest1) parts.push([`COSMOS/stations_up/${dest1}.mp3`]);
        }
    }

    return parts;
}

function getCosmosPlaybackParts(trackNum, train) {
    const parts = [];
    parts.push([`COSMOS/track_from/${trackNum}.mp3`]);
    const nameNumberDest = getTrainNameNumberDestParts(train);
    nameNumberDest.forEach(p => parts.push(p));
    return parts;
}

// ============================================================
// 到着放送パーツ構築
// ============================================================

// 号数パーツを「が」または「と」付きで構築する。
// 例) 122号が -> 100 + 20 + 2号が
//     230号が -> 200 + 30号が
//     122号と -> 100 + 20 + 2号と
function buildArrivalNoParts(hund, ten, one, ending) {
    const parts = [];
    const hd = parseInt(hund, 10) || 0;
    const td = parseInt(ten, 10) || 0;
    const od = parseInt(one, 10) || 0;
    const h = hd * 100;
    const t = td * 10;
    const o = od;

    // ちょうど百の倍数（例: 100,200,300...）
    if (h > 0 && t === 0 && o === 0) {
        parts.push([`COSMOS/no/${h}号${ending}.mp3`, `COSMOS/no/${h}号.mp3`]);
        return parts;
    }

    // 百の位
    if (h > 0) {
        parts.push([`COSMOS/no/${h}.mp3`, `COSMOS/no/${h}号${ending}.mp3`]);
    }

    // 十の位
    if (t > 0) {
        if (o === 0) {
            parts.push([`COSMOS/no/${t}号${ending}.mp3`, `COSMOS/no/${t}.mp3`, `COSMOS/no/${t}号.mp3`]);
        } else {
            parts.push([`COSMOS/no/${t}.mp3`, `COSMOS/no/${t}号${ending}.mp3`]);
        }
    }

    // 一の位
    if (o > 0) {
        parts.push([`COSMOS/no/${o}号${ending}.mp3`, `COSMOS/no/${o}号.mp3`]);
    }

    return parts;
}

// 到着列車の「列車名と号数」パーツを構築する。
// 単独: 列車名 + 号数が  （例: はやぶさ + 10 + 2号が）
// 併結: 列車名1 + 号数と + 列車名2 + 号数が  （例: はやぶさ + 10 + 2号と + こまち + 10 + 2号が）
function buildArrivalIdentityParts(arrival) {
    const parts = [];
    const serviceNames = (arrival.service || '').split(/[・·]/).filter(Boolean);
    const digits = extractNumberDigits(arrival);
    const coupled = serviceNames.length > 1;

    if (!coupled) {
        if (serviceNames[0]) parts.push([`COSMOS/name/${serviceNames[0]}.mp3`]);
        const noParts = buildArrivalNoParts(digits.h, digits.t, digits.o, 'が');
        noParts.forEach(p => parts.push(p));
    } else {
        // 併結列車
        if (serviceNames[0]) parts.push([`COSMOS/name/${serviceNames[0]}.mp3`]);
        const noPartsA = buildArrivalNoParts(digits.h, digits.t, digits.o, 'と');
        noPartsA.forEach(p => parts.push(p));

        if (serviceNames[1]) parts.push([`COSMOS/name/${serviceNames[1]}.mp3`]);
        const noPartsB = buildArrivalNoParts(digits.h, digits.t, digits.o, 'が');
        noPartsB.forEach(p => parts.push(p));
    }

    return parts;
}

// 折り返し後発車時刻を「時」と「分発」に分けてパーツを構築する。
// 例) 9:05 -> 9時 + 5分発
//     11:32 -> 10 + 1時 + 30 + 2分発
//     20:30 -> 20時 + 30分発
// こちらはすべて COSMOS/time/ に入っている。
function buildTimeParts(timeStr) {
    const parts = [];
    if (!timeStr) return parts;
    const [hStr, mStr] = String(timeStr).split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h)) return parts;

// 時の放送。10ちょうどは「10時」、11〜19は「10+{一の位}時」、それ以外は「{h}時」
    if (h >= 10 && h < 20) {
        const ones = h % 10;
        if (ones === 0) {
            // 10時（例: 10:20 → 10時.mp3）
            parts.push([`COSMOS/time/10時.mp3`]);
        } else {
            // 11〜19（例: 11:32 → 10.mp3 + 1時.mp3）
            const tens = Math.floor(h / 10) * 10; // 10
            parts.push([`COSMOS/time/${tens}.mp3`]);
            parts.push([`COSMOS/time/${ones}時.mp3`]);
        }
    } else {
        parts.push([`COSMOS/time/${h}時.mp3`]);
    }

// 分の放送
    if (!isNaN(m) && m > 0) {
        if (m >= 10 && (m % 10) !== 0) {
            // 10の倍数でない端数の分（例: 32 → 30 + 2分発）
            const tens = Math.floor(m / 10) * 10;
            parts.push([`COSMOS/time/${tens}.mp3`]);
            const ones = m % 10;
            parts.push([`COSMOS/time/${ones}分発.mp3`]);
        } else {
            // 10の倍数または1桁の分（例: 20 → 20分発, 5 → 5分発）
            parts.push([`COSMOS/time/${m}分発.mp3`]);
        }
    } else if (!isNaN(m) && m === 0) {
        parts.push([`COSMOS/time/0分発.mp3`]);
    }

    return parts;
}

// ============================================================
// 到着放送再生
// ============================================================

// 到着放送を再生する。
// pattern 1: 旅客列車到着 → 折り返し旅客列車
// pattern 2: 旅客列車到着 → 回送電車または不明
function startArrivalBroadcast(platform, arrival, returnTrain) {
    const onBroadcastFinished = () => {
        broadcastState.active = false;
    };

    const parts = [];
    // 接近音
    parts.push(['COSMOS/COSMOS接近音.mp3']);
    // 番線
    parts.push([`COSMOS/track_to/${platform}.mp3`]);
    // 到着の列車名と号数
    const identityParts = buildArrivalIdentityParts(arrival);
    identityParts.forEach(p => parts.push(p));
    // 入ります
    parts.push(['COSMOS/入ります.mp3']);
    // この電車は
    parts.push(['COSMOS/この電車は.mp3']);
    // 当駅止まりです
    parts.push(['COSMOS/当駅止まりです.mp3']);
    // 黄色い点字ブロック
    parts.push(['COSMOS/黄色い点字ブロック.mp3']);
    // この電車は
    parts.push(['COSMOS/この電車は.mp3']);
    // 折り返し
    parts.push(['COSMOS/折り返し.mp3']);

    if (returnTrain && returnTrain.service !== '回送') {
        // pattern 1: 折り返し後発車時刻 + 折り返し後列車名号数行先 + 行となります
        const timeParts = buildTimeParts(returnTrain.time);
        timeParts.forEach(p => parts.push(p));
        const returnTrainParts = getTrainNameNumberDestParts(returnTrain);
        returnTrainParts.forEach(p => parts.push(p));
        parts.push(['COSMOS/行となります.mp3']);
    } else {
        // pattern 2: 回送電車となります
        parts.push(['COSMOS/回送電車となります.mp3']);
    }

    broadcastState.active = true;
    playPartsWithFallbacks(parts, onBroadcastFinished);
}

// ============================================================
// 到着時刻の監視
// ============================================================

function checkArrivals(boards) {
    const now = Date.now();
    boards.forEach(board => {
        const platform = board.platform;
        (board.arrivalTrains || []).forEach(arrival => {
            const arrivalMs = arrival.arrivalMs;
            if (!arrivalMs) return;

            const arrivalId = getTrainId(platform, arrival);
            if (broadcastState.arrivalScheduled.has(arrivalId)) return;

            const msUntilArrival = arrivalMs - now;

            // 到着120秒前になったらスケジュール
            if (msUntilArrival <= 120000 && msUntilArrival > 0) {
                broadcastState.arrivalScheduled.add(arrivalId);

                // 到着120秒前に開始
                const startAt = arrivalMs - 120000;
                const delay = Math.max(0, startAt - now);

                setTimeout(() => {
                    // unban で折り返し列車を照合
                    const returnTrain = (board.departures || []).find(
                        (t) => t.unban && t.unban === arrival.unban
                    );
                    startArrivalBroadcast(platform, arrival, returnTrain);
                }, delay);
            }
        });
    });
}

// ============================================================
// 音声再生ヘルパー
// ============================================================

// 各パートは候補配列（存在しない場合は次の候補へフォールバック）
function playPartsWithFallbacks(parts, onFinished) {
    let idx = 0;
    let stopped = false;

    function stop() {
        stopped = true;
        if (onFinished) onFinished();
    }

    function playPart(partCandidates) {
        if (stopped) return;
        if (!partCandidates || partCandidates.length === 0) { nextPart(); return; }
        let candIndex = 0;
        const audio = document.createElement('audio');
        audio.className = 'broadcast-audio';
        audio.autoplay = false;
        audio.preload = 'auto';

        function tryCandidate() {
            if (stopped) return;
            if (candIndex >= partCandidates.length) { nextPart(); return; }
            const url = partCandidates[candIndex];
            audio.src = url;
            // エラーなら次の候補へ
            audio.onerror = function () { candIndex++; tryCandidate(); };
            audio.onended = function () { try { audio.remove(); } catch (e) {} nextPart(); };
            // 再生可能になれば再生
            audio.oncanplaythrough = function () {
                audio.play().catch(() => { nextPart(); });
            };
            // 読み込み開始してみる
            audio.load();
            // タイムアウト: 読み込めなければ次へ（1.5s）
            setTimeout(() => {
                if (!audio.duration || isNaN(audio.duration)) {
                    candIndex++;
                    tryCandidate();
                }
            }, 1500);
        }

        tryCandidate();
    }

    function nextPart() {
        idx++;
        if (idx > parts.length - 1) {
            if (onFinished) onFinished();
            return;
        }
        playPart(parts[idx]);
    }

    // start
    if (parts.length === 0) { if (onFinished) onFinished(); return; }
    idx = 0;
    playPart(parts[0]);
}

// 固定フレーズを順次再生
function playFixedPhrases(nextStation, onFinished) {
    const seq = [];
    if (nextStation) {
        seq.push(
            'COSMOS/行が.mp3',
            'COSMOS/発車いたします.mp3',
            'COSMOS/次は.mp3',
            `COSMOS/next/${nextStation}.mp3`,
            'COSMOS/とまります.mp3',
            'COSMOS/黄色い点字ブロック.mp3'
        );
    } else {
        seq.push(
            'COSMOS/行が.mp3',
            'COSMOS/発車いたします.mp3'
        );
    }

    let i = 0;
    function playNext() {
        if (i >= seq.length) { if (onFinished) onFinished(); return; }
        const a = document.createElement('audio');
        a.className = 'broadcast-audio';
        a.autoplay = true;
        a.src = seq[i];
        a.onended = function () { try { a.remove(); } catch (e) {} i++; playNext(); };
        a.onerror = function () { try { a.remove(); } catch (e) {} i++; playNext(); };
        document.body.appendChild(a);
        a.load();
    }
    playNext();
}

// ============================================================
// 発車メロディ再生
// ============================================================

// 0.5〜3.0コーラスのランダム
function getRandomChoruses() {
    return 0.5 + Math.random() * 2.5;
}

function playDepartureMelody(platform, onComplete) {
    const url = MELODY_FILES[platform];
    if (!url) { onComplete(); return; }

    const choruses = getRandomChoruses();
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.loop = true; // 複数コーラスの場合にループ

    let completed = false;
    const finish = () => {
        if (completed) return;
        completed = true;
        try { audio.pause(); } catch (e) {}
        try { audio.remove(); } catch (e) {}
        onComplete();
    };

    const startPlayback = () => {
        const duration = audio.duration;
        if (!duration || isNaN(duration)) { finish(); return; }
        audio.play().catch(() => finish());
        // 指定コーラス数分の再生時間で停止
        setTimeout(finish, duration * choruses * 1000);
    };

    audio.onloadedmetadata = startPlayback;
    audio.onerror = function () { finish(); };

    // メタデータが既に読み込まれている場合（プリロード済み）
    if (audio.readyState >= 1) {
        startPlayback();
    } else {
        audio.load();
    }
}

// ============================================================
// 放送開始
// ============================================================

function startBroadcast(platform, train) {
    if (broadcastState.active) return;
    broadcastState.active = true;

    // 発車メロディを再生（独立して流れる）
    playDepartureMelody(platform, () => {
        // メロディ終了時の処理（何もしない）
    });

    // メロディ開始から6.5秒後に放送開始
    setTimeout(() => {
        if (!broadcastState.active) return;

        const onBroadcastFinished = () => {
            broadcastState.active = false;
        };

        if (train.service === '回送') {
            // 回送列車の放送
            const parts = [
                [`COSMOS/track_of/${platform}.mp3`],
                [`COSMOS/name/回送.mp3`]
            ];
            playPartsWithFallbacks(parts, onBroadcastFinished);
        } else {
            // 一般列車の放送
            const parts = getCosmosPlaybackParts(platform, train);
            const nextStation = normalizeAudioFileName((train.stops || '').split('・').filter(Boolean)[0] || '');
            playPartsWithFallbacks(parts, () => {
                playFixedPhrases(nextStation, onBroadcastFinished);
            });
        }
    }, BROADCAST_DELAY_MS);
}

// ============================================================
// 発車時刻の監視
// ============================================================

function checkDepartures(boards) {
    const now = Date.now();
    boards.forEach(board => {
        const platform = board.platform;
        (board.departures || []).forEach(train => {
            const departureMs = train.departureMs;
            if (!departureMs) return;

            const trainId = getTrainId(platform, train);
            if (broadcastState.scheduled.has(trainId)) return;

            const msUntilDeparture = departureMs - now;

            // 発車60秒前になったらスケジュール
            if (msUntilDeparture <= 60000 && msUntilDeparture > 0) {
                broadcastState.scheduled.add(trainId);

                // 60秒前〜30秒前のランダムなタイミングで開始
                const startAt = departureMs - (30000 + Math.random() * 30000);
                const delay = Math.max(0, startAt - now);

                setTimeout(() => {
                    startBroadcast(platform, train);
                }, delay);
            }
        });
    });
}

// ============================================================
// 音声有効化ボタン（自動再生ブロック対策）
// ============================================================

function createEnableAudioButton() {
    // 既に存在する場合は何もしない
    if (document.getElementById('enable-audio-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'enable-audio-btn';
    btn.textContent = '🔊 音声を有効にする';
    btn.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 99999;
        padding: 10px 20px;
        font-size: 16px;
        background: #ffffff;
        color: #000000;
        cursor: pointer;
        opacity: 1;
    `;
    btn.addEventListener('click', () => {
        // 音声を有効化（ダミー再生でユーザー操作として認識させる）
        const silent = new Audio();
        silent.volume = 0;
        silent.play().catch(() => {});
        // ボタンを消す
        btn.remove();
    });
    document.body.appendChild(btn);
}

// ============================================================
// 初期化
// ============================================================

let broadcastInitialized = false;

function initBroadcast(boards) {
    if (broadcastInitialized) return;
    broadcastInitialized = true;

// 全音声をプリロード（初回読み込みラグ対策）
    preloadAllAudio(boards);

    // 発車時刻を監視
    setInterval(() => checkDepartures(boards), 1000);

    // 到着時刻を監視（到着120秒前から到着放送）
    setInterval(() => checkArrivals(boards), 1000);
}

// window に公開
window.initBroadcast = initBroadcast;

// script2.js が読み込まれた時点で即座にボタンを表示する
// （script.js の initBroadcast 呼び出しを待たずに、確実に表示されるようにする）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createEnableAudioButton);
} else {
    createEnableAudioButton();
}
