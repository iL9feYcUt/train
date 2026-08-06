# TODO

## Task: remarks を先頭種別の実際の座席情報で表示する

- [x] Plan confirmed
- [x] `script.js` - Extract `FORMATION_CAR_COUNT` constant and refactor `computeCarCount` to use it
- [x] `script.js` - Add `computeFirstServiceCarCount` helper (first service's car count from shotei)
- [x] `script.js` - Add `computeServiceRemark` helper (single service remark logic)
- [x] `script.js` - Refactor `computeRemarks`:
  - Combined trains: show first service's actual remark (e.g., はやぶさ全車指定席, やまびこ自由席1~7号車)
  - Single trains: show remark as before
- [x] Verify the changes

## Task: 併結列車のはやぶさを黄緑色で表示する

- [x] Plan confirmed
- [x] `script.js` - Add `getServiceDestination` helper (per-service destination for combined trains)
- [x] `script.js` - Update `renderService` to pass per-service destination to `getServiceColor`
- [x] `script.js` - Update `getTrainAccentColors` to pass per-service destination
- [x] `script.js` - Update `renderStopsLine` to pass first service's destination
- [x] `script.js` - Update `startStopStationMarquee`'s `updateServiceLabel` to pass per-service destination
- [x] `script.js` - Update `renderBoard`'s `numberColor` to pass last service's destination
- [ ] Verify はやぶさ・こまち (新函館北斗行) displays はやぶさ in yellow-green
