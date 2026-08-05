const boards = [
  {
    platform: 20,
    departures: [
      {
        time: '9:56', service: 'はやて', number: '115号',
        destination: '仙台', remarks: '全車指定席', remarks2: 'E5系運行', carCount: '10両編成',
        stops: '上野・大宮・仙台'
      },
      {
        time: '10:20', service: 'やまびこ', number: '235号',
        destination: '盛岡', remarks: '自由席1~4号車', remarks2: 'E2系運行', carCount: '16両編成',
        stops: '上野・大宮・宇都宮・福島・郡山・仙台・古川・水沢江刺・北上・盛岡'
      },
      {
        time: '10:36', service: 'なすの', number: '252号',
        destination: '仙台', remarks: '全車指定席', remarks2: 'E2系', carCount: '8両編成',
        stops: '上野・大宮・小山・栃木・郡山・福島・仙台'
      }
    ]
  },
  {
    platform: 21,
    departures: [
      {
        time: '10:04', service: 'はやぶさ·こまち', number: '93号',
        destination: '新函館北斗·秋田', remarks: 'はやぶさ全車指定席', remarks2: 'こまち全車指定席', carCount: '17両編成',
        stops: '上野・大宮・仙台・盛岡・新青森・新函館北斗',
        stopsByService: {
          はやぶさ: '上野・大宮・仙台・盛岡・新青森・新函館北斗',
          こまち: '上野・大宮・仙台・盛岡・雫石・田沢湖・角館・大曲・秋田'
        }
      },
      {
        time: '11:10', service: 'つばさ', number: '131号',
        destination: '新庄', remarks: '全車指定席', remarks2: 'E3系運行', carCount: '7両編成',
        stops: '上野・大宮・福島・米沢・山形・新庄'
      },
      {
        time: '11:50', service: 'やまびこ', number: '343号',
        destination: '新潟', remarks: '一部自由席', remarks2: '12両編成', carCount: '12両編成',
        stops: '上野・大宮・福島・郡山・新潟'
      }
    ]
  },
  {
    platform: 22,
    departures: [
      {
        time: '10:12', service: 'とき', number: '445号',
        destination: '新潟', remarks: '全車指定席', remarks2: 'E4系', carCount: '8両編成',
        stops: '上野・大宮・高崎・越後湯沢・浦佐・長岡・燕三条・新潟'
      },
      {
        time: '10:38', service: 'たにがわ', number: '565号',
        destination: '越後湯沢', remarks: '全車指定席', remarks2: '2階建てE4系', carCount: '12両編成',
        stops: '上野・大宮・熊谷・本庄早稲田・高崎・上毛高原・越後湯沢'
      },
      {
        time: '11:05', service: 'Maxたにがわ', number: '8号',
        destination: '越後湯沢', remarks: '全車指定席', remarks2: '2階建て', carCount: '12両編成',
        stops: '上野・大宮・熊谷・本庄早稲田・高崎・上毛高原・越後湯沢'
      }
    ]
  },
  {
    platform: 23,
    departures: [
      {
        time: '10:06', service: 'あさま', number: '505号',
        destination: '軽井沢', remarks: '全車指定席', remarks2: 'E7系運行', carCount: '12両編成',
        stops: '上野・大宮・熊谷・本庄早稲田・高崎・軽井沢'
      },
      {
        time: '10:28', service: 'かがやき', number: '603号',
        destination: '金沢', remarks: '全車指定席', remarks2: 'E7/W7系', carCount: '12両編成',
        stops: '上野・大宮・熊谷・本庄早稲田・高崎・軽井沢・長野・富山・金沢'
      },
      {
        time: '10:52', service: 'はくたか', number: '652号',
        destination: '金沢', remarks: '全車指定席', remarks2: 'W7系', carCount: '12両編成',
        stops: '上野・大宮・熊谷・本庄早稲田・高崎・軽井沢・長野・富山・金沢'
      }
    ]
  }
];

const display = document.querySelector('#boards');

function enlargeAlnum(text) {
  return text.replace(/[A-Za-z0-9]+/g, '<span class="alnum">$&</span>');
}

function formatTrainNumber(number) {
  const match = number.match(/^([0-9]+)([^0-9A-Za-z]+)$/);
  if (!match) {
    return enlargeAlnum(number);
  }

  return `<span class="alnum">${match[1]}</span><span class="number-suffix">${match[2]}</span>`;
}

function formatCarCount(numberText) {
  return enlargeAlnum(numberText);
}

function getServiceColor(serviceName, destination) {
  const yellowGreenDestinations = new Set(['新函館北斗', '木古内', '奥津軽いまべつ', '札幌']);
  const greenServices = new Set(['やまびこ', 'なすの', 'はやて', 'Maxやまびこ', 'Maxなすの',]);
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
  return `
  <section class="scene" aria-label="${board.platform}番線の新幹線発車案内">
    <section class="sign">
      <header class="sign-title">
        <svg class="direction" viewBox="0 0 86 86" aria-hidden="true" focusable="false">
          <rect x="0" y="0" width="86" height="86" fill="#fff"/>
          <path d="M73 43H20M47 17 20 43 47 68" fill="none" stroke="#343d40" stroke-width="10" stroke-linecap="butt" stroke-linejoin="miter"/>
        </svg>
        <span class="platform"><span style="font-size:1.3em;">${board.platform}</span>番線</span>
        <span class="heading">今度の電車</span>
        <span class="english">Next Departure</span>
        <i class="status-light" aria-hidden="true"></i>
      </header>

      <div class="column-headings" aria-hidden="true">
        <span>時刻 <small>Time</small></span>
        <span>列車名 <small>Train</small></span>
        <span>番号 <small>Train No.</small></span>
        <span>行先 <small>Destination</small></span>
        <span>記事 <small>Remarks</small></span>
      </div>

      <div class="departures">${board.departures.map((train, trainIndex) => {
        const serviceParts = train.service.split(/[・·]/).filter(Boolean);
        const numberColor = getServiceColor(serviceParts.at(-1), train.destination);
        const [accentTop, accentBottom] = getTrainAccentColors(train.service, train.destination);
        return `
        <article class="train" style="--train-accent-top: var(--train-${accentTop}); --train-accent-bottom: var(--train-${accentBottom});">
          <div class="led main-line">
            <span class="time"><span class="fit-text">${enlargeAlnum(train.time)}</span></span>
            <span class="service"><span class="fit-text">${renderService(train.service, train.destination)}</span></span>
            <span class="number" data-train-color="${numberColor}"><span class="fit-text">${formatTrainNumber(train.number)}</span></span>
            <span class="destination"><span class="fit-text">${enlargeAlnum(train.destination)}</span></span>
            <span class="remarks"><span class="fit-text remarks-current" data-board-index="${boardIndex}" data-train-index="${trainIndex}" data-mode="seat">${enlargeAlnum(train.remarks)}</span></span>
          </div>
          ${renderStopsLine(train)}
        </article>
      `;
      }).join('')}</div>
    </section>
  </section>
`;
}

display.innerHTML = boards.map((board, boardIndex) => renderBoard(board, boardIndex)).join('');

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

fitTextToContainer();
startRemarkCycler();

function scaleSignToViewport() {
  const scale = Math.min(1, window.innerWidth / 1500);
  document.querySelectorAll('.scene').forEach((scene) => {
    const sign = scene.querySelector('.sign');
    if (!sign) return;
    scene.style.setProperty('--sign-scale', scale);
    scene.style.height = `${Math.ceil((sign.offsetHeight + 60) * scale)}px`;
  });
}

scaleSignToViewport();
window.addEventListener('resize', () => {
  fitTextToContainer();
  scaleSignToViewport();
});
