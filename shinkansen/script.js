const departures = [
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
    time: '8:20', service: 'とき', number: '425号',
    destination: '新潟', remarks: '自由席1~4,9~12号車', remarks2: '', carCount: '12両編成',
    stops: '上野・大宮・高崎・越後湯沢・浦佐・長岡・燕三条・新潟'
  },
  {
    time: '8:36', service: 'あさま', number: '505号',
    destination: '黒部宇奈月温泉', remarks: '全車指定席', remarks2: '', carCount: '12両編成',
    stops: '上野・大宮・熊谷・本庄早稲田・高崎・安中榛名・軽井沢・佐久平・上田・長野・飯山・上越妙高・糸魚川・黒部宇奈月温泉'
  }
];

const display = document.querySelector('#departures');

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

display.innerHTML = departures.map((train, trainIndex) => {
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
      <span class="remarks"><span class="fit-text remarks-current" data-train-index="${trainIndex}" data-mode="seat">${enlargeAlnum(train.remarks)}</span></span>
    </div>
    ${renderStopsLine(train)}
  </article>
`;
}).join('');

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
      const trainIndex = Number(remarksNode.dataset.trainIndex);
      const train = departures[trainIndex];
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
  const scene = document.querySelector('.scene');
  const sign = document.querySelector('.sign');
  const scale = Math.min(1, window.innerWidth / 1500);

  scene.style.setProperty('--sign-scale', scale);
  scene.style.height = `${Math.ceil((sign.offsetHeight + 60) * scale)}px`;
}

scaleSignToViewport();
window.addEventListener('resize', () => {
  fitTextToContainer();
  scaleSignToViewport();
});
