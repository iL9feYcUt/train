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
    scheduled: new Set(), // スケジュール済みの列車ID
    active: false,        // 放送中フラグ
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
    });

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

function getCosmosPlaybackParts(trackNum, train) {
    const parts = [];
    parts.push([`COSMOS/track_from/${trackNum}.mp3`]);

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
        // 併結列車
        const dest1 = dests[0] || '';
        const dest2 = dests[1] || '';
        const name1 = serviceNames[0] || '';
        const name2 = serviceNames[1] || '';

        if (dest1 !== dest2) {
            // 行先が異なる場合
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
            // 行先が同じ場合
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
