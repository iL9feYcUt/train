// ============================================================
// 新幹線発車案内板 - 実データ連携版
// ============================================================

// ---- 設定 ----
const STATION = '東京';
const ROSEN_CODE = 'jr_tohoku_shin';
const ROUTE_ID = 397;
const BASE_ST_API = 'https://www.elesite-next.com/fastapi/get_st_timetable';
const BASE_RETSU_API = 'https://www.elesite-next.com/fastapi/get_retsuban_time_by_id';
const PLATFORMS = [20, 21, 22, 23];
const MAX_PER_PLATFORM = 3;

// ---- デフォルトの表示順（プラットフォーム番号ごとの発車標順） ----
// 実際の表示板では、各番線の「今度の電車」欄は到着時刻ではなく発車時刻順に並ぶ。
// ここでは API の nobori_timetable（上り=東京基準で「発」）を番線ごとに発車時刻順で並べる。

// ============================================================
// ヘルパー関数
// ============================================================

function enlargeAlnum(text) {
  return text.replace(/[A-Za-z0-9]+/g, '<span class="alnum">$&</span>');
}

function formatTrainNumber(number) {
  // 列車番号は数字の後ろ3桁部分だけ使用する。
  // 例) 617E -> 617, 2045B -> 45, 1327C -> 327, 8541E -> 541
  // 併結列車(17B/9017M など)は最後の数字を使う。
  const matches = (number || '').match(/[0-9]+/g) || [];
  if (!matches.length) return '';
  const last = matches[matches.length - 1];
  const digits = last.slice(-3).replace(/^0+/, '');
  return `<span class="alnum">${digits}</span>号`;
}

function formatCarCount(numberText) {
  return enlargeAlnum(numberText);
}

// 時刻表示を整形する。時が1桁の場合は先頭0を付けない（09:00 -> 9:00）。
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':');
  if (h == null || m == null) return String(timeStr);
  return `${Number(h)}:${m}`;
}

// ---- 種別・行先の整形 ----

// API の shubetsu は「やまびこ/つばさ」「臨時はやぶさ/こまち」のようにスラッシュ区切り。
// 「臨時」を除去し、「・」で連結する。
function normalizeService(shubetsu) {
  return (shubetsu || '')
    .split('/')
    .map((s) => s.replace(/^臨時/, ''))
    .filter(Boolean)
    .join('·');
}

// 行先。新庄は「山形・新庄」に置き換え、複数は「・」で連結。
// 併結列車では、行先を種別(service)の順番に合わせて並べ替える。
// 例) やまびこ/つばさ の ikisaki「山形/仙台」→ 種別順で「仙台·山形」
function getServiceTerminals(serviceName) {
  const terminals = {
    やまびこ: ['仙台', '盛岡'],
    つばさ: ['山形', '新庄'],
    はやぶさ: ['新函館北斗', '新青森', '札幌', '木古内', '奥津軽いまべつ'],
    こまち: ['秋田'],
    なすの: ['那須塩原', '郡山'],
    はやて: ['八戸', '盛岡'],
    とき: ['新潟'],
    たにがわ: ['越後湯沢'],
    はくたか: ['金沢', '敦賀'],
    かがやき: ['金沢', '敦賀'],
    あさま: ['長野', '軽井沢'],
  };
  return new Set(terminals[serviceName] || []);
}

function normalizeDestination(ikisaki, shubetsu) {
  const dests = (ikisaki || '')
    .split('/')
    .map((d) => d.trim())
    .filter(Boolean);

  const services = getServiceNames(normalizeService(shubetsu));

  // 各発駅を、対応する種別に割り当てる
  const destToService = {};
  dests.forEach((d) => {
    const matched = services.find((s) => getServiceTerminals(s).has(d));
    destToService[d] = matched || '';
  });

  // 種別順に行先を並べ替える
  const ordered = [];
  services.forEach((s) => {
    const found = dests.find((d) => destToService[d] === s);
    if (found && !ordered.includes(found)) ordered.push(found);
  });
  // 種別に対応しない行先は末尾に追加
  dests.forEach((d) => {
    if (!ordered.includes(d)) ordered.push(d);
  });

  return ordered
    .map((d) => (d === '新庄' ? '山形·新庄' : d))
    .join('·');
}

// ---- 種別色 ----
function getServiceColor(serviceName, destination) {
  const yellowGreenDestinations = new Set(['新函館北斗', '木古内', '奥津軽いまべつ', '札幌']);
  const greenServices = new Set(['やまびこ', 'なすの', 'はやて', 'Maxやまびこ', 'Maxなすの']);
  const purpleServices = new Set(['はくたか', 'かがやき', 'あさま']);
  const pinkServices = new Set(['こまち']);
  const vermillionServices = new Set(['とき', 'たにがわ', 'Maxとき', 'Maxたにがわ']);

  if (serviceName === 'はやぶさ' && yellowGreenDestinations.has(destination)) {
    return 'yellowgreen';
  }

  if (serviceName === 'はやぶさ' || greenServices.has(serviceName)) {
    return 'green';
  }

  if (serviceName === 'つばさ') {
    return 'orange';
  }

  if (pinkServices.has(serviceName)) {
    return 'pink';
  }

  if (vermillionServices.has(serviceName)) {
    return 'vermillion';
  }

  if (purpleServices.has(serviceName)) {
    return 'purple';
  }

  return 'white';
}

function getTrainAccentColors(serviceText, destination) {
  const parts = serviceText.split(/[・·]/).filter(Boolean);
  const colors = parts.map((serviceName) => getServiceColor(serviceName, destination));

  if (colors.length <= 1) {
    return [colors[0] ?? 'white', colors[0] ?? 'white'];
  }

  return [colors[0], colors.at(-1)];
}

function renderService(serviceText, destination) {
  const parts = serviceText.split(/[・·]/).filter(Boolean);
  const separators = serviceText.match(/[・·]/g) ?? [];

  if (parts.length === 1) {
    return `<span class="service-part" data-train-color="${getServiceColor(parts[0], destination)}">${enlargeAlnum(parts[0])}</span>`;
  }

  return parts.map((serviceName, index) => {
    const color = getServiceColor(serviceName, destination);
    const part = `<span class="service-part" data-train-color="${color}">${enlargeAlnum(serviceName)}</span>`;
    const separator = index < separators.length ? `<span class="service-separator">${separators[index]}</span>` : '';
    return `${part}${separator}`;
  }).join('');
}

function getServiceNames(serviceText) {
  return serviceText.split(/[・·]/).filter(Boolean);
}

// ============================================================
// 両数・remarks・remarks2 の計算
// ============================================================

// 両数の計算。shotei 例: "E5系+E6系", "E2系", "E7系 新潟車"
function computeCarCount(serviceText, shotei) {
  const serviceNames = getServiceNames(serviceText);

  // 併結の主要ペアは必ず17両
  if (serviceNames.includes('はやぶさ') && serviceNames.includes('こまち')) return 17;
  if (serviceNames.includes('やまびこ') && serviceNames.includes('つばさ')) return 17;

  const formationCarCount = {
    'E2系': 10,
    'E5系': 10,
    'H5系': 10,
    'E6系': 7,
    'E8系': 7,
    'E7系': 12,
    'W7系': 12,
  };

  // shotei から系式を抽出して合算
  const shoteiText = (shotei || '').replace(/[ 　].*$/, '');
  const formations = shoteiText.split('+').filter(Boolean);

  let total = 0;
  let found = false;
  for (const f of formations) {
    const key = Object.keys(formationCarCount).find((k) => f.includes(k));
    if (key) {
      total += formationCarCount[key];
      found = true;
    }
  }

  if (found) return total;
  return 0;
}

// remarks の計算。train は API の nobori 要素。
function computeRemarks(train, serviceText, carCount) {
  const serviceNames = getServiceNames(serviceText);

  // はやぶさ、こまち、つばさ、かがやきは全車指定席
  if (serviceNames.some((s) => ['はやぶさ', 'こまち', 'つばさ', 'かがやき'].includes(s))) {
    return '全車指定席';
  }

  // 「臨時」のとき（臨時ときなど）は全車指定席
  if (train.shubetsu && train.shubetsu.includes('臨時')) {
    return '全車指定席';
  }

  // なすの (E2系/E5系/17両/7両)
  if (serviceNames.includes('なすの')) {
    if (carCount === 17) return '自由席1~8,12~17号車';
    if (carCount === 7) return '自由席12~17号車';
    const shoteiText = (train.shotei || '').replace(/[ 　].*$/, '');
    if (shoteiText.includes('E2系')) return '自由席1~8,10号車';
    return '自由席1~8号車'; // E5系
  }

  // やまびこ (10両/17両)
  if (serviceNames.includes('やまびこ')) {
    if (carCount === 17) return '自由席1~7,12~17号車';
    return '自由席1~7号車'; // 10両
  }

  // とき: 指定席1~8号車
  if (serviceNames.includes('とき')) {
    return '自由席1~8号車';
  }

  // たにがわ: 自由席1~10号車
  if (serviceNames.includes('たにがわ')) {
    return '自由席1~10号車';
  }

  // はくたか: 自由席1~4号車
  if (serviceNames.includes('はくたか')) {
    return '自由席1~4号車';
  }

  // あさま: 自由席1~5号車
  if (serviceNames.includes('あさま')) {
    return '自由席1~5号車';
  }

  return '';
}

// remarks2。併結列車（複数種別）の場合のみ、最後の種別の remarks を表示。
function computeRemarks2(serviceText) {
  const serviceNames = getServiceNames(serviceText);
  if (serviceNames.length <= 1) {
    return null;
  }

  // 併結列車の remarks2 は「後ろの種別の全車指定席」などを表示
  const lastService = serviceNames.at(-1);
  if (['こまち', 'つばさ', 'かがやき', 'はやぶさ'].includes(lastService)) {
    return `${lastService}全車指定席`;
  }

  return null;
}

// 停車駅データの組み立て（API2 の timetable_list から）
//
// ・東京駅は発車駅なので停車駅には含めない。
// ・併結列車では timetable_list が切り離し駅で複数に分かれる。
//   例) やまびこ/つばさ（135B）:
//       [0] 東京〜福島 (やまびこ/つばさ共通)
//       [1] 福島〜山形 (つばさ)
//       [2] 福島〜仙台 (やまびこ、retsuban が "135B#h")
//   ここでは各サービスごとに該当セグメントの停車駅を連結して結合する。
function buildStops(timetableList, serviceText) {
  const serviceNames = getServiceNames(serviceText);

  if (!timetableList || timetableList.length === 0) {
    return { stops: '', stopsByService: {} };
  }

  const collectStops = (seg) => {
    const arr = (seg.timetable || [])
      .map((t) => t.station)
      .filter(Boolean)
      // 東京駅（発車駅）は含めない
      .filter((s) => s !== '東京');
    return arr;
  };

  // 単一種別の場合は、全セグメントの停車駅を順に連結（重複駅で重複しない）
  if (serviceNames.length <= 1) {
    const stops = [];
    timetableList.forEach((seg) => {
      const segStops = collectStops(seg);
      segStops.forEach((s) => {
        // 直前の駅と重複していたらスキップ（切り離し駅の重複を避ける）
        if (stops[stops.length - 1] !== s) {
          stops.push(s);
        }
      });
    });
    return { stops: stops.join('・'), stopsByService: {} };
  }

// 複数種別の場合
  // 各セグメントの shubetsu フィールドに含まれる種別名で、どのサービスに属するかを判定する。
  // 例) やまびこ/つばさ（135B）:
  //       [0] shubetsu="やまびこ/つばさ" 東京〜福島 (共通)
  //       [1] shubetsu="つばさ"          福島〜山形
  //       [2] shubetsu="やまびこ"        福島〜仙台
  // 各サービスは、shubetsu に自分の名前を含む全セグメントを配列順に結合する。
  const stopsByService = {};

  serviceNames.forEach((name) => {
    const stops = [];
    timetableList.forEach((seg) => {
      const segShubetsu = seg.shubetsu || '';
      // セグメントの shubetsu にこのサービス名が含まれていれば該当
      if (!segShubetsu.split('/').map((s) => s.replace(/^臨時/, '').trim()).includes(name)) {
        return;
      }
      const segStops = collectStops(seg);
      segStops.forEach((s) => {
        // 直前の駅と重複していたらスキップ（切り離し駅の重複を避ける）
        if (stops[stops.length - 1] !== s) stops.push(s);
      });
    });
    stopsByService[name] = stops.join('・');
  });

  // 全体の停車駅 = 各サービスの停車駅の順序的結合（重複禁止）
  const allStops = [];
  serviceNames.forEach((name) => {
    const segStops = (stopsByService[name] || '').split('・').filter(Boolean);
    segStops.forEach((s) => {
      if (allStops[allStops.length - 1] !== s) allStops.push(s);
    });
  });

  return { stops: allStops.join('・'), stopsByService };
}

// ============================================================
// 表示データ構築
// ============================================================

const display = document.querySelector('#boards');
let boards = [];

function getStopsSequence(train) {
  const serviceNames = getServiceNames(train.service);
  const stopsByService = train.stopsByService ?? {};

  if (serviceNames.length <= 1) {
    return [train.stops];
  }

  return serviceNames.map((serviceName) => stopsByService[serviceName] ?? train.stops);
}

function renderStopsLine(train) {
  const serviceNames = getServiceNames(train.service);
  const stopSequence = getStopsSequence(train);
  const firstServiceName = serviceNames[0] ?? '';
  const firstServiceColor = getServiceColor(firstServiceName, train.destination);
  const serviceLabelMarkup = serviceNames.length > 1
    ? `<span class="stop-service-list"><span class="stop-service-name" data-train-color="${firstServiceColor}">${enlargeAlnum(firstServiceName)}</span></span>`
    : '';

  return `
  <div class="led stops-line">
    <span class="stop-label">停車駅</span>
    ${serviceLabelMarkup}
    <span class="stops" data-stop-sequence='${JSON.stringify(stopSequence)}' data-service-sequence='${JSON.stringify(serviceNames)}' data-stop-index="0" data-destination='${train.destination}'>
      <span class="fit-text">${enlargeAlnum(stopSequence[0])}</span>
    </span>
  </div>
`;
}

function renderBoard(board, boardIndex) {
  const reversed = board.platform === 21 || board.platform === 23;

  // 発車時刻1分以上経過した列車は表示せず、次の列車に更新する。
  // 表示は「まだ発車していない列車」のうち先頭の MAX_PER_PLATFORM 本のみ。
const now = Date.now();
  const visibleDepartures = (board.departures || [])
    .map((t, i) => ({ ...t, _realIndex: i }))
    .filter((t) => !((t.departureMs || 0) && now > t.departureMs + 60000))
    .slice(0, MAX_PER_PLATFORM);

  // 発車列車が MAX_PER_PLATFORM(3) 未満でも、空白行として3段表示を維持する。
  while (visibleDepartures.length < MAX_PER_PLATFORM) {
    visibleDepartures.push({ empty: true });
  }
  const arrowPath = reversed
    ? 'M13 43H66M39 17 66 43 39 68'
    : 'M73 43H20M47 17 20 43 47 68';
  const titleOrder = reversed
    ? `
        <i class="status-light" aria-hidden="true"></i>
        <span class="english">Next Departure</span>
        <span class="heading">今度の電車</span>
        <span class="platform"><span style="font-size:1.3em;">${board.platform}</span>番線</span>
        <svg class="direction" viewBox="0 0 86 86" aria-hidden="true" focusable="false">
          <rect x="0" y="0" width="86" height="86" fill="#fff"/>
          <path d="${arrowPath}" fill="none" stroke="#343d40" stroke-width="10" stroke-linecap="butt" stroke-linejoin="miter"/>
        </svg>`
    : `
        <svg class="direction" viewBox="0 0 86 86" aria-hidden="true" focusable="false">
          <rect x="0" y="0" width="86" height="86" fill="#fff"/>
          <path d="${arrowPath}" fill="none" stroke="#343d40" stroke-width="10" stroke-linecap="butt" stroke-linejoin="miter"/>
        </svg>
        <span class="platform"><span style="font-size:1.3em;">${board.platform}</span>番線</span>
        <span class="heading">今度の電車</span>
        <span class="english">Next Departure</span>
        <i class="status-light" aria-hidden="true"></i>`;

return `
  <section class="scene" data-platform="${board.platform}" data-arrivals='${JSON.stringify(board.arrivals || [])}' aria-label="${board.platform}番線の新幹線発車案内">
    <section class="sign${reversed ? ' is-reversed' : ''}">
      <header class="sign-title">
        ${titleOrder}
      </header>

      <div class="column-headings" aria-hidden="true">
        <span>時刻 <small>Time</small></span>
        <span>列車名 <small>Train</small></span>
        <span>番号 <small>Train No.</small></span>
        <span>行先 <small>Destination</small></span>
        <span>記事 <small>Remarks</small></span>
      </div>

<div class="departures">
${visibleDepartures.map((train, trainIndex) => {
          if (train.empty) {
            return `
          <article class="train${reversed ? ' is-reversed' : ''} is-empty">
            <div class="led main-line">
              <span class="time"><span class="fit-text"></span></span>
              <span class="service"><span class="fit-text"></span></span>
              <span class="number"><span class="fit-text"></span></span>
              <span class="destination"><span class="fit-text"></span></span>
              <span class="remarks"><span class="fit-text"></span></span>
            </div>
            <div class="led stops-line"></div>
          </article>
        `;
          }
          const serviceParts = train.service.split(/[・·]/).filter(Boolean);
          const numberColor = getServiceColor(serviceParts.at(-1), train.destination);
          const [accentTop, accentBottom] = getTrainAccentColors(train.service, train.destination);
          return `
          <article class="train${reversed ? ' is-reversed' : ''}" data-departure="${train.departureMs || ''}" style="--train-accent-top: var(--train-${accentTop}); --train-accent-bottom: var(--train-${accentBottom});">
<div class="led main-line">
              <span class="time"><span class="fit-text">${enlargeAlnum(formatTime(train.time))}</span></span>
              <span class="service"><span class="fit-text">${renderService(train.service, train.destination)}</span></span>
<span class="number" data-train-color="${numberColor}"><span class="fit-text">${formatTrainNumber(train.displayNumber || train.number)}</span></span>
              <span class="destination"><span class="fit-text">${enlargeAlnum(train.destination)}</span></span>
<span class="remarks"><span class="fit-text remarks-current" data-board-index="${boardIndex}" data-train-index="${train._realIndex ?? trainIndex}" data-mode="seat">${enlargeAlnum(train.remarks)}</span></span>
            </div>
            ${renderStopsLine(train)}
</article>
        `;
}).join('')}
      </div>
    </section>
  </section>
`;
}

// ============================================================
// 到着判定（列車がまいります）
// ============================================================

// 各 scene の停車駅表示（最下段）を制御。
// 列車が到着する117秒前〜30秒前の間、該当列車の停車駅表示を消し、
// その部分に赤の点滅「列車がまいります」を中央揃えで表示する。
// 到着時刻は kudari_timetable（着列車）の train_time を使用する。
function startArrivalMonitor() {
  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('.scene').forEach((scene) => {
      const arrivals = scene.dataset.arrivals
        ? JSON.parse(scene.dataset.arrivals)
        : [];
      const isArriving = arrivals.some((arrivalMs) =>
        now >= arrivalMs - 117000 && now <= arrivalMs - 30000
      );

// 「列車がまいります」は最下段（最後の .stops-line）にのみ表示する。
      // それ以外の段には表示しない。
      const stopsLines = scene.querySelectorAll('.stops-line');
      const bottomStopsLine = stopsLines[stopsLines.length - 1];

      // 最下段以外の .stops-line に付いている「列車がまいります」を除去して復元する
      stopsLines.forEach((stopsLine) => {
        if (stopsLine === bottomStopsLine) return;
        if (stopsLine.dataset.arrivalActive) {
          delete stopsLine.dataset.arrivalActive;
          const msg = stopsLine.querySelector('.arrival-message');
          if (msg) msg.remove();
          const stopLabel = stopsLine.querySelector('.stop-label');
          const serviceList = stopsLine.querySelector('.stop-service-list');
          const stopsEl = stopsLine.querySelector('.stops');
          if (stopsEl) stopsEl.style.display = '';
          if (stopLabel) stopLabel.style.display = '';
          if (serviceList) serviceList.style.display = '';
        }
      });

if (!bottomStopsLine) return;
      if (isArriving) {
        if (!bottomStopsLine.dataset.arrivalActive) {
          bottomStopsLine.dataset.arrivalActive = '1';
          // 停車駅表示と「停車駅」ラベル、サービスラベルを全て消す
          const stopLabel = bottomStopsLine.querySelector('.stop-label');
          const serviceList = bottomStopsLine.querySelector('.stop-service-list');
          const stopsEl = bottomStopsLine.querySelector('.stops');
          if (stopLabel) stopLabel.style.display = 'none';
          if (serviceList) serviceList.style.display = 'none';
          if (stopsEl) stopsEl.style.display = 'none';
          const msg = document.createElement('span');
          msg.className = 'arrival-message';
          msg.textContent = '列車がまいります';
          bottomStopsLine.appendChild(msg);
        }
      } else if (bottomStopsLine.dataset.arrivalActive) {
        delete bottomStopsLine.dataset.arrivalActive;
        const msg = bottomStopsLine.querySelector('.arrival-message');
        if (msg) msg.remove();
        const stopLabel = bottomStopsLine.querySelector('.stop-label');
        const serviceList = bottomStopsLine.querySelector('.stop-service-list');
        const stopsEl = bottomStopsLine.querySelector('.stops');
        if (stopsEl) stopsEl.style.display = '';
        if (stopLabel) stopLabel.style.display = '';
        if (serviceList) serviceList.style.display = '';
      }
    });
  }, 100);
}

// 発車時刻1分後に次の発車へ更新する。
// 発車が1分以上経過した列車が表示行に含まれていたら、全体を再描画して次の列車へ進める。
function startDepartureAdvanceMonitor() {
  setInterval(() => {
    const now = Date.now();
    let needsRedraw = false;

    document.querySelectorAll('.scene .train').forEach((trainEl) => {
      const departureMs = Number(trainEl.getAttribute('data-departure'));
      if (!departureMs) return;
      // 今日のデータのみ対象（departureMs が今日のローカル時刻）
      if (now > departureMs + 60000) { // 発車時刻 + 1分
        needsRedraw = true;
      }
    });

    if (needsRedraw) {
      rerenderBoards();
    }
  }, 1000);
}

// 全ボードを再描画する（発車済み列車を除外して次の列車へ更新）
function rerenderBoards() {
  display.innerHTML = boards.map((board, boardIndex) => renderBoard(board, boardIndex)).join('');
  fitTextToContainer();
}

// ============================================================
// 表示の構築・再描画
// ============================================================

function fitRemarksText() {
  document.querySelectorAll('.remarks-current').forEach((text) => {
    text.style.transform = '';
    const container = text.parentElement;
    const style = window.getComputedStyle(container);
    const availableWidth = container.clientWidth
      - parseFloat(style.paddingLeft)
      - parseFloat(style.paddingRight);

    if (text.offsetWidth > availableWidth) {
      text.style.transformOrigin = container.classList.contains('is-car-count')
        ? 'center center'
        : 'left center';
      text.style.transform = `scaleX(${availableWidth / text.offsetWidth})`;
    }
  });
}

function getNextRemarkMode(currentMode, train) {
  const modes = ['seat', 'remarks2', 'car'];
  const index = modes.indexOf(currentMode);
  return modes[(index + 1) % modes.length];
}

function getRemarkText(train, mode) {
  if (mode === 'seat') {
    return enlargeAlnum(train.remarks);
  }

  if (mode === 'remarks2') {
    return enlargeAlnum(train.remarks2 || train.remarks);
  }

  return formatCarCount(train.carCount);
}

function startRemarkCycler() {
  setInterval(() => {
    document.querySelectorAll('.remarks-current').forEach((remarksNode) => {
      const boardIndex = Number(remarksNode.dataset.boardIndex);
      const trainIndex = Number(remarksNode.dataset.trainIndex);
      const train = boards[boardIndex].departures[trainIndex];
      const nextMode = getNextRemarkMode(remarksNode.dataset.mode, train);
      const remarksWrapper = remarksNode.parentElement;

      remarksNode.dataset.mode = nextMode;
      remarksWrapper.classList.toggle('is-car-count', nextMode === 'car');
      remarksNode.innerHTML = getRemarkText(train, nextMode);
    });

    fitRemarksText();
  }, 7000);
}

function startStopStationMarquee(container, textElement) {
  if (container.dataset.marqueeFrame) {
    cancelAnimationFrame(Number(container.dataset.marqueeFrame));
  }

  const stopSequence = container.dataset.stopSequence
    ? JSON.parse(container.dataset.stopSequence)
    : [textElement.textContent.trim()];
  const serviceSequence = container.dataset.serviceSequence
    ? JSON.parse(container.dataset.serviceSequence)
    : [];
  const serviceLabel = container.parentElement.querySelector('.stop-service-name');
  let currentSegmentIndex = Number(container.dataset.stopIndex || 0);
  let currentX = container.clientWidth;
  let waitTicks = 60;

  const updateServiceLabel = () => {
    if (!serviceLabel || serviceSequence.length <= 1) {
      return;
    }

    const serviceName = serviceSequence[currentSegmentIndex];
    serviceLabel.dataset.trainColor = getServiceColor(serviceName, container.dataset.destination || '');
    serviceLabel.innerHTML = enlargeAlnum(serviceName);
  };

  const step = () => {
    const textWidth = textElement.scrollWidth;
    const containerWidth = container.clientWidth;
    const speed = 2.0;

    if (waitTicks > 0) {
      waitTicks--;
      container.dataset.marqueeFrame = String(requestAnimationFrame(step));
      return;
    }

    currentX -= speed;

    if (currentX < -textWidth) {
      currentSegmentIndex = (currentSegmentIndex + 1) % stopSequence.length;
      container.dataset.stopIndex = String(currentSegmentIndex);
      textElement.innerHTML = enlargeAlnum(stopSequence[currentSegmentIndex]);
      updateServiceLabel();
      currentX = containerWidth;
      waitTicks = 30;
    }

    textElement.style.transform = `translateX(${currentX}px)`;
    container.dataset.marqueeFrame = String(requestAnimationFrame(step));
  };

  if (stopSequence.length > 1) {
    textElement.innerHTML = enlargeAlnum(stopSequence[currentSegmentIndex]);
  }

  updateServiceLabel();
  container.dataset.stopIndex = String(currentSegmentIndex);
  container.dataset.marqueeFrame = String(requestAnimationFrame(step));
}

function stopStopStationMarquee(container) {
  if (container.dataset.marqueeFrame) {
    cancelAnimationFrame(Number(container.dataset.marqueeFrame));
    container.dataset.marqueeFrame = '';
  }

  const textElement = container.querySelector('.fit-text');
  if (textElement) {
    textElement.style.transform = '';
  }
}

function fitTextToContainer() {
  document.querySelectorAll('.fit-text').forEach((text) => {
    text.style.transform = '';
    const container = text.parentElement;
    const style = window.getComputedStyle(container);
    const availableWidth = container.clientWidth
      - parseFloat(style.paddingLeft)
      - parseFloat(style.paddingRight);

    if (container.classList.contains('stops')) {
      const overflowWidth = text.scrollWidth - availableWidth;
      const serviceSequence = container.dataset.serviceSequence
        ? JSON.parse(container.dataset.serviceSequence)
        : [];
      const isCombined = serviceSequence.length > 1;

      if (overflowWidth > 1 || isCombined) {
        container.classList.add('is-marquee');
        startStopStationMarquee(container, text);
      } else {
        container.classList.remove('is-marquee');
        stopStopStationMarquee(container);
      }

      return;
    }

    if (text.offsetWidth > availableWidth) {
      text.style.transformOrigin = container.classList.contains('time')
        ? 'right center'
        : container.classList.contains('is-car-count')
          ? 'center center'
          : 'left center';
      text.style.transform = `scaleX(${availableWidth / text.offsetWidth})`;
    }
  });
}

function fitBoardsToViewport() {
  const boardsEl = document.getElementById('boards');
  if (!boardsEl) return;

  const designWidth = boardsEl.scrollWidth || 3200;
  const scale = Math.min(1, window.innerWidth / designWidth);

  boardsEl.style.transformOrigin = 'top left';
  boardsEl.style.transform = scale < 1 ? `scale(${scale})` : '';
  document.body.style.height = scale < 1
    ? `${Math.ceil(boardsEl.offsetHeight * scale)}px`
    : '';
}

// ============================================================
// 初期データ（フォールバック用）
// ============================================================

function getHardcodedBoards() {
  return [
    {
      platform: 20,
      departures: [
        {
          time: '9:56', service: 'はやて', number: '115', destination: '仙台',
          remarks: '全車指定席', remarks2: 'E5系運行', carCount: '10両編成',
          stops: '上野・大宮・仙台', arrivalMs: 0
        },
        {
          time: '10:20', service: 'やまびこ', number: '235', destination: '盛岡',
          remarks: '自由席1~4号車', remarks2: 'E2系運行', carCount: '16両編成',
          stops: '上野・大宮・宇都宮・福島・郡山・仙台・古川・水沢江刺・北上・盛岡', arrivalMs: 0
        }
      ]
    },
    {
      platform: 21,
      departures: [
        {
          time: '10:04', service: 'はやぶさ・こまち', number: '93', destination: '新函館北斗·秋田',
          remarks: 'はやぶさ全車指定席', remarks2: 'こまち全車指定席', carCount: '17両編成',
          stops: '上野・大宮・仙台・盛岡・新青森・新函館北斗',
          stopsByService: {
            はやぶさ: '上野・大宮・仙台・盛岡・新青森・新函館北斗',
            こまち: '上野・大宮・仙台・盛岡・雫石・田沢湖・角館・大曲・秋田'
          },
          arrivalMs: 0
        }
      ]
    },
    {
      platform: 22,
      departures: [
        {
          time: '10:12', service: 'とき', number: '445', destination: '新潟',
          remarks: '全車指定席', remarks2: 'E4系', carCount: '8両編成',
          stops: '上野・大宮・高崎・越後湯沢・浦佐・長岡・燕三条・新潟', arrivalMs: 0
        }
      ]
    },
    {
      platform: 23,
      departures: [
        {
          time: '10:06', service: 'あさま', number: '505', destination: '軽井沢',
          remarks: '全車指定席', remarks2: 'E7系運行', carCount: '12両編成',
          stops: '上野・大宮・熊谷・本庄早稲田・高崎・軽井沢', arrivalMs: 0
        }
      ]
    }
  ];
}

// ============================================================
// API 連携
// ============================================================

function pad2(n) {
  return String(n).padStart(2, '0');
}

// 4時を日付境界として日付文字列(YYYY-MM-DD)を返す
function computeDateFor(d) {
  const date = new Date(d);
  const hour = date.getHours();
  if (hour < 4) {
    date.setDate(date.getDate() - 1);
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function computeHourFor(d) {
  return d.getHours();
}

function parseTimeToMs(timeStr, baseDate) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const date = new Date(baseDate);
  date.setHours(h, m, 0, 0);
  return date.getTime();
}

// unban を正規化する。例) "変U118-7+Z702" -> "U118+Z702"
// 複合unban（+で連結された複数編成）は編成ID（英字+数字）を抽出し、
// ソートして結合する。これにより併結順が変わっても同一列車として比較できる。
function normalizeUnban(unban) {
  if (!unban) return '';
  const cores = String(unban)
    .split('+')
    .map((p) => {
      const m = p.match(/[A-Za-z]\d+/);
      return m ? m[0] : null;
    })
    .filter(Boolean)
    .sort();
  return cores.join('+');
}

async function fetchStTimetable(hour, dateStr) {
  const url = `${BASE_ST_API}?rosen_code=${ROSEN_CODE}&station=${encodeURIComponent(STATION)}&select_hour=${hour}&day_id=1580&select_date=${dateStr}&route_id=${ROUTE_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API1 HTTP ${res.status}`);
  return res.json();
}

async function fetchRetsubanTime(retsubanId, dateStr) {
  const url = `${BASE_RETSU_API}?retsuban_id=${retsubanId}&select_date=${dateStr}&route_id=${ROUTE_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API2 HTTP ${res.status}`);
  return res.json();
}

// デバッグ用に追加された列車を train 形式に変換する
function buildDebugTrains() {
  const list = window.DEBUG_TRAINS || [];
  return list
    .map((d) => {
      const platform = Number(d.platform);
      if (!PLATFORMS.includes(platform)) return null;
      const departureMs = parseTimeToMs(d.time, new Date());
      if (departureMs == null) return null;

return {
        platform,
        departureMs,
        time: d.time,
        service: d.service || '',
        number: d.number || '',               // unban（編成番号）
        displayNumber: d.displayNumber || '', // 発車標に表示する号数
        destination: d.destination || '',
        remarks: d.remarks || '',
        remarks2: d.remarks2 || null,
        carCount: d.carCount || '',
        stops: d.stops || '',
        stopsByService: d.stopsByService || {},
      };
    })
    .filter(Boolean);
}

// 表示する列車データを構築する
async function buildTrainData() {
  const now = new Date();
  const dateStr = computeDateFor(now);
  const currentHour = computeHourFor(now);

// 現在時刻と次の2時間を取得
  const hours = [currentHour, (currentHour + 1) % 24, (currentHour + 2) % 24];
  const trainsByPlatform = {};
  PLATFORMS.forEach((p) => { trainsByPlatform[p] = []; });

  // #h付きの列車は非表示にする
  const isHiddenTrain = (retsuban) => /#h/i.test(retsuban || '');

  for (const hour of hours) {
    const data = await fetchStTimetable(hour, dateStr);
    const nobori = data.nobori_timetable || [];
    const kudari = data.kudari_timetable || [];

// 番線が null の列車でも、同じ unban を持つ列車から番線を推測できる。
    // unban -> 番線 のマップを発列車(nobori)から構築する。
    // 複合unban（例: "変U118-7+Z702"）は normalizeUnban で正規化して一致させる。
    const unbanToPlatform = {};
    nobori.forEach((t) => {
      const key = normalizeUnban(t.unban);
      if (key && t.bansen && !(key in unbanToPlatform)) {
        unbanToPlatform[key] = Number(t.bansen);
      }
    });
    kudari.forEach((t) => {
      const key = normalizeUnban(t.unban);
      if (key && t.bansen) {
        unbanToPlatform[key] = Number(t.bansen);
      }
    });

    // 着列車(kudari)から、各番線の到着時刻を収集（「列車がまいります」用）
    const arrivalsByPlatform = {};
    PLATFORMS.forEach((p) => { arrivalsByPlatform[p] = []; });
    kudari.forEach((t) => {
      if (isHiddenTrain(t.retsuban)) return;
      let platform = Number(t.bansen);
if (!PLATFORMS.includes(platform) && t.unban) {
        platform = unbanToPlatform[normalizeUnban(t.unban)] || platform;
      }
      if (!PLATFORMS.includes(platform)) return;
      const arrivalMs = parseTimeToMs(t.train_time, now);
      if (arrivalMs != null) {
        arrivalsByPlatform[platform].push(arrivalMs);
      }
    });

    // 発列車(nobori)
    for (const t of nobori) {
      const retsuban = t.retsuban || '';
      if (isHiddenTrain(retsuban)) continue;

let platform = Number(t.bansen);
      if (!PLATFORMS.includes(platform) && t.unban) {
        platform = unbanToPlatform[normalizeUnban(t.unban)] || platform;
      }
      if (!PLATFORMS.includes(platform)) continue;

const serviceText = normalizeService(t.shubetsu);
      const destText = normalizeDestination(t.ikisaki, t.shubetsu);
      const carCount = computeCarCount(serviceText, t.shotei);

      const train = {
        retsuban_id: t.retsuban_id,
        time: t.train_time,
        departureMs: parseTimeToMs(t.train_time, now),
        service: serviceText,
        number: retsuban,
        destination: destText,
        remarks: computeRemarks(t, serviceText, carCount),
        remarks2: computeRemarks2(serviceText),
        carCount: carCount ? `${carCount}両編成` : '',
        stops: '',
        stopsByService: {},
      };

      // 停車駅データを取得
      try {
        const retsu = await fetchRetsubanTime(t.retsuban_id, dateStr);
        const { stops, stopsByService } = buildStops(retsu.timetable_list, serviceText);
        train.stops = stops;
        train.stopsByService = stopsByService;
      } catch (e) {
        // 停車駅取得失敗時は空のまま
      }

      trainsByPlatform[platform].push(train);
    }

    // 各番線の到着時刻を保存（scene の data-arrivals に使う）
    PLATFORMS.forEach((p) => {
      if (!trainsByPlatform[p].__arrivals) {
        trainsByPlatform[p].__arrivals = [];
      }
      trainsByPlatform[p].__arrivals.push(...arrivalsByPlatform[p]);
    });
  }

// デバッグ用の追加列車を各番線にマージする
  buildDebugTrains().forEach((dbg) => {
    trainsByPlatform[dbg.platform].push(dbg);
  });

  // 各番線で発車時刻順に並べる（全列車を保持。表示は先頭の MAX_PER_PLATFORM 本のみ）
  const boards = PLATFORMS.map((platform) => {
    const platformArr = trainsByPlatform[platform];
    const departures = [...platformArr].sort((a, b) => (a.departureMs || 0) - (b.departureMs || 0));
    const arrivals = [...(platformArr.__arrivals || [])].sort((a, b) => a - b);
    return { platform, departures, arrivals };
  });

  return boards;
}

// ============================================================
// 起動
// ============================================================

async function init() {
  try {
    boards = await buildTrainData();
  } catch (e) {
    console.error('API取得に失敗しました。フォールバックデータを使用します:', e);
    boards = getHardcodedBoards();
  }

display.innerHTML = boards.map((board, boardIndex) => renderBoard(board, boardIndex)).join('');

fitTextToContainer();
  startRemarkCycler();
  startArrivalMonitor();
  startDepartureAdvanceMonitor();
  fitBoardsToViewport();
}

window.addEventListener('resize', () => {
  fitTextToContainer();
  fitBoardsToViewport();
});

init();
