"use strict";

const $ = (id) => document.getElementById(id);

const controls = {
  targetTemp: $("targetTemp"),
  ambientTemp: $("ambientTemp"),
  pumpPressure: $("pumpPressure"),
  puckResistance: $("puckResistance"),
  heaterPower: $("heaterPower"),
  boilerVolume: $("boilerVolume"),
  thermalLoss: $("thermalLoss"),
  inletWaterTemp: $("inletWaterTemp"),
  refillRate: $("refillRate"),
  preheatEfficiency: $("preheatEfficiency"),
  preinfusion: $("preinfusion"),
  shotDuration: $("shotDuration"),
  restDuration: $("restDuration"),
  simSpeed: $("simSpeed"),
  continuousMode: $("continuousMode"),
  autoHeat: $("autoHeat"),
};

const labels = {
  targetTemp: $("targetTempValue"),
  ambientTemp: $("ambientTempValue"),
  pumpPressure: $("pumpPressureValue"),
  puckResistance: $("puckResistanceValue"),
  heaterPower: $("heaterPowerValue"),
  boilerVolume: $("boilerVolumeValue"),
  thermalLoss: $("thermalLossValue"),
  inletWaterTemp: $("inletWaterTempValue"),
  refillRate: $("refillRateValue"),
  preheatEfficiency: $("preheatEfficiencyValue"),
  preinfusion: $("preinfusionValue"),
  shotDuration: $("shotDurationValue"),
  restDuration: $("restDurationValue"),
  simSpeed: $("simSpeedValue"),
};

const readSettings = () => ({
  targetTemp: Number(controls.targetTemp.value),
  ambientTemp: Number(controls.ambientTemp.value),
  pumpPressure: Number(controls.pumpPressure.value),
  puckResistance: Number(controls.puckResistance.value),
  heaterPower: Number(controls.heaterPower.value),
  boilerVolume: Number(controls.boilerVolume.value),
  thermalLoss: Number(controls.thermalLoss.value),
  inletWaterTemp: Number(controls.inletWaterTemp.value),
  refillRate: Number(controls.refillRate.value),
  preheatEfficiency: Number(controls.preheatEfficiency.value),
  preinfusion: Number(controls.preinfusion.value),
  shotDuration: Number(controls.shotDuration.value),
  restDuration: Number(controls.restDuration.value),
  simSpeed: Number(controls.simSpeed.value),
  continuousMode: controls.continuousMode.checked,
  autoHeat: controls.autoHeat.checked,
});

const elements = {
  toggleRun: $("toggleRun"),
  toggleBrew: $("toggleBrew"),
  resetSim: $("resetSim"),
  clock: $("clock"),
  modeLabel: $("modeLabel"),
  readyLabel: $("readyLabel"),
  waterTemp: $("waterTemp"),
  boilerTemp: $("boilerTemp"),
  boilerSetpoint: $("boilerSetpoint"),
  pressure: $("pressure"),
  flowRate: $("flowRate"),
  heaterDuty: $("heaterDuty"),
  shotMass: $("shotMass"),
  refillFlow: $("refillFlow"),
  totalRefill: $("totalRefill"),
  feedTemp: $("feedTemp"),
  rawFeedTemp: $("rawFeedTemp"),
  boilerLevel: $("boilerLevel"),
  boilerLevelDetail: $("boilerLevelDetail"),
  refillHeatLoad: $("refillHeatLoad"),
  shotTimer: $("shotTimer"),
  avgTemp: $("avgTemp"),
  avgPressure: $("avgPressure"),
  tds: $("tds"),
  extractionYield: $("extractionYield"),
  qualityScore: $("qualityScore"),
  cycleLabel: $("cycleLabel"),
  shotCount: $("shotCount"),
  shotLog: $("shotLog"),
  pressureNeedle: $("pressureNeedle"),
  boilerFill: $("boilerFill"),
  heaterGlow: $("heaterGlow"),
  groupLight: $("groupLight"),
  stream: $("stream"),
  pumpPulse: $("pumpPulse"),
  espressoLevel: $("espressoLevel"),
  historyChart: $("historyChart"),
  shotChart: $("shotChart"),
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const minutesSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const fmt = {
  temp: (value) => `${value.toFixed(1)}°C`,
  bar: (value) => `${value.toFixed(1)} bar`,
  flow: (value) => `${value.toFixed(1)} ml/s`,
  grams: (value) => `${value.toFixed(1)} g`,
  pct: (value) => `${value.toFixed(0)}%`,
  pct1: (value) => `${value.toFixed(1)}%`,
  secs: (value) => `${value.toFixed(1)} s`,
  watts: (value) => `${value.toFixed(0)} W`,
};

function calcPreheatedFeedTemp(s, boilerTemp, groupTemp) {
  const sourceTemp = lerp(groupTemp, boilerTemp, 0.42);
  return s.inletWaterTemp + (sourceTemp - s.inletWaterTemp) * (s.preheatEfficiency / 100);
}

function calcBoilerSetpoint(s, flow = 0, refillFlow = flow, feedTemp = null) {
  const ambientComp = clamp((22 - s.ambientTemp) * 0.08, -0.7, 1.8);
  const lossComp = clamp((s.thermalLoss - 4) * 0.16, -0.6, 1.6);
  const flowComp = clamp((flow - 2.2) * 0.9, 0, 3.2);
  const estimatedFeedTemp =
    feedTemp ?? s.inletWaterTemp + (s.targetTemp + 3 - s.inletWaterTemp) * (s.preheatEfficiency / 100);
  const refillComp = clamp((70 - estimatedFeedTemp) * 0.025 * Math.max(0, refillFlow), 0, 3.2);
  return s.targetTemp + 5.4 + ambientComp + lossComp + flowComp + refillComp;
}

function calcMachineHeadroom(s) {
  return clamp(
    (s.heaterPower / 5200) * 0.35 +
      (s.boilerVolume / 4200) * 0.3 +
      (s.preheatEfficiency / 90) * 0.2 +
      (s.refillRate / 9) * 0.15,
    0.2,
    1,
  );
}

function calcQuality({ avgTemp, avgPressure, avgFlow, mass, ey, tempStd, stress }) {
  const tempPenalty = Math.abs(avgTemp - 93) * 2.2 + Math.max(0, tempStd - 4.4) * 0.7;
  const pressurePenalty = Math.abs(avgPressure - 8.0) * 1.2;
  const flowPenalty = Math.abs(avgFlow - 1.35) * 1.6;
  const massPenalty = Math.abs(mass - 38) * 0.18;
  const yieldPenalty = Math.abs(ey - 20) * 0.9;
  const stressPenalty = stress * 5.2;
  const score = clamp(100 - tempPenalty - pressurePenalty - flowPenalty - massPenalty - yieldPenalty - stressPenalty, 35, 100);

  let note = "안정";
  if (stress > 0.58) note = "열회복 밀림";
  else if (avgTemp < 91.6) note = "수온 하락";
  else if (tempStd > 4.6) note = "온도 흔들림";
  else if (avgPressure < 7.5) note = "압력 부족";
  else if (ey < 18) note = "저추출";
  else if (ey > 23) note = "과추출";
  else if (mass < 32) note = "추출량 부족";

  return { score, note };
}

const initialState = () => {
  const settings = readSettings();
  const boilerSetpoint = calcBoilerSetpoint(settings);
  return {
    running: true,
    time: 0,
    boilerTemp: boilerSetpoint + 0.4,
    boilerSetpoint,
    groupTemp: settings.targetTemp - 0.5,
    waterTemp: settings.targetTemp - 0.3,
    boilerWaterLevel: settings.boilerVolume,
    refillFlow: 0,
    totalRefill: 0,
    effectiveFeedTemp: calcPreheatedFeedTemp(settings, boilerSetpoint + 0.4, settings.targetTemp - 0.5),
    refillHeatLoad: 0,
    thermalStress: 0.02,
    serviceLoad: 0,
    pressure: 0,
    flow: 0,
    heaterDuty: 0,
    pidIntegral: 0,
    brewActive: false,
    shotTime: 0,
    shotMass: 0,
    extractedSolids: 0,
    tempIntegral: 0,
    tempSqIntegral: 0,
    pressureIntegral: 0,
    flowIntegral: 0,
    stressIntegral: 0,
    loadIntegral: 0,
    currentQuality: 100,
    currentQualityNote: "안정",
    saturation: 0,
    restTimer: 999,
    shotIndex: 0,
    lastShot: null,
    history: [],
    shotProfile: [],
    shotLog: [],
    sampleTimer: 0,
    shotSampleTimer: 0,
    mode: "예열 중",
  };
};

let state = initialState();
let settings = readSettings();
let lastFrame = performance.now();
let accumulator = 0;
const dt = 0.05;

function updateControlLabels() {
  const s = readSettings();
  labels.targetTemp.textContent = `${s.targetTemp.toFixed(1)}°C`;
  labels.ambientTemp.textContent = `${s.ambientTemp.toFixed(0)}°C`;
  labels.pumpPressure.textContent = `${s.pumpPressure.toFixed(1)} bar`;
  labels.puckResistance.textContent = s.puckResistance.toFixed(2);
  labels.heaterPower.textContent = `${s.heaterPower.toFixed(0)} W`;
  labels.boilerVolume.textContent = `${s.boilerVolume.toFixed(0)} ml`;
  labels.thermalLoss.textContent = `${s.thermalLoss.toFixed(1)} W/K`;
  labels.inletWaterTemp.textContent = `${s.inletWaterTemp.toFixed(0)}°C`;
  labels.refillRate.textContent = `${s.refillRate.toFixed(1)} ml/s`;
  labels.preheatEfficiency.textContent = `${s.preheatEfficiency.toFixed(0)}%`;
  labels.preinfusion.textContent = `${s.preinfusion.toFixed(1)} s`;
  labels.shotDuration.textContent = `${s.shotDuration.toFixed(0)} s`;
  labels.restDuration.textContent = `${s.restDuration.toFixed(0)} s`;
  labels.simSpeed.textContent = `${s.simSpeed.toFixed(1).replace(".0", "")}x`;
}

function startShot() {
  if (state.brewActive) return;
  state.brewActive = true;
  state.shotTime = 0;
  state.shotMass = 0;
  state.extractedSolids = 0;
  state.tempIntegral = 0;
  state.tempSqIntegral = 0;
  state.pressureIntegral = 0;
  state.flowIntegral = 0;
  state.stressIntegral = 0;
  state.loadIntegral = 0;
  state.currentQuality = 100;
  state.currentQualityNote = "안정";
  state.saturation = 0;
  state.shotProfile = [];
  state.shotSampleTimer = 0;
  state.shotIndex += 1;
}

function stopShot(reason = "완료") {
  if (!state.brewActive && state.shotTime <= 0) return;
  const avgTemp = state.shotTime > 0 ? state.tempIntegral / state.shotTime : 0;
  const avgPressure = state.shotTime > 0 ? state.pressureIntegral / state.shotTime : 0;
  const avgFlow = state.shotTime > 0 ? state.flowIntegral / state.shotTime : 0;
  const avgStress = state.shotTime > 0 ? state.stressIntegral / state.shotTime : state.thermalStress;
  const avgLoad = state.shotTime > 0 ? state.loadIntegral / state.shotTime : state.serviceLoad;
  const tempVariance = state.shotTime > 0 ? state.tempSqIntegral / state.shotTime - avgTemp * avgTemp : 0;
  const tempStd = Math.sqrt(Math.max(0, tempVariance));
  const tds = state.shotMass > 0 ? (state.extractedSolids / state.shotMass) * 100 : 0;
  const ey = (state.extractedSolids / 18) * 100;
  const quality = calcQuality({ avgTemp, avgPressure, avgFlow, mass: state.shotMass, ey, tempStd, stress: clamp(avgStress + avgLoad * 0.55, 0, 1) });
  const shot = {
    index: state.shotIndex,
    reason,
    time: state.shotTime,
    mass: state.shotMass,
    avgTemp,
    avgPressure,
    avgFlow,
    tempStd,
    avgStress,
    avgLoad,
    tds,
    ey,
    quality: quality.score,
    qualityNote: quality.note,
  };

  if (state.shotTime > 1.5 || state.shotMass > 1) {
    state.lastShot = shot;
    state.shotLog.unshift(shot);
    state.shotLog = state.shotLog.slice(0, 7);
  }

  state.brewActive = false;
  state.restTimer = 0;
  state.saturation = Math.min(state.saturation, 0.6);
}

function updateMode(pumpCommand) {
  const levelReady = state.boilerWaterLevel >= settings.boilerVolume * 0.94;
  const ready =
    Math.abs(state.boilerTemp - state.boilerSetpoint) <= 2.2 &&
    state.groupTemp >= settings.targetTemp - 2.5 &&
    levelReady;

  if (state.brewActive && state.shotTime < settings.preinfusion) {
    state.mode = "프리인퓨전";
  } else if (state.brewActive) {
    state.mode = "추출 중";
  } else if (!ready && state.boilerTemp < state.boilerSetpoint - 1.8) {
    state.mode = "예열 중";
  } else if (!ready && state.boilerTemp > state.boilerSetpoint + 3) {
    state.mode = "냉각 중";
  } else if (!levelReady) {
    state.mode = "급수 회복";
  } else if (settings.continuousMode && state.restTimer < settings.restDuration) {
    state.mode = "회복 중";
  } else {
    state.mode = "대기";
  }

  if (pumpCommand > 0.05 && !state.brewActive) {
    state.mode = "라인 가압";
  }
}

function simulateStep(step) {
  settings = readSettings();
  state.boilerWaterLevel = clamp(state.boilerWaterLevel, settings.boilerVolume * 0.72, settings.boilerVolume);
  state.effectiveFeedTemp = calcPreheatedFeedTemp(settings, state.boilerTemp, state.groupTemp);
  state.boilerSetpoint = calcBoilerSetpoint(settings, state.flow, state.refillFlow, state.effectiveFeedTemp);
  state.time += step;

  if (settings.continuousMode && !state.brewActive) {
    const closeEnough =
      state.boilerTemp >= state.boilerSetpoint - 4.8 &&
      state.groupTemp >= settings.targetTemp - 5.2 &&
      state.boilerWaterLevel >= settings.boilerVolume * 0.88;
    if (state.restTimer >= settings.restDuration && closeEnough) {
      startShot();
    }
  }

  let pumpCommand = 0;
  if (state.brewActive) {
    state.shotTime += step;
    pumpCommand = state.shotTime < settings.preinfusion ? 0.34 : 1;
    if (state.shotTime >= settings.shotDuration) {
      stopShot("시간 종료");
      pumpCommand = 0;
    }
  } else {
    state.restTimer += step;
  }

  if (state.brewActive) {
    state.saturation = clamp(state.saturation + step * (0.24 + pumpCommand * 0.16), 0, 1);
  } else {
    state.saturation = Math.max(0, state.saturation - step * 0.08);
  }

  const puckWetness = clamp(0.14 + state.saturation * 0.86, 0.14, 1);
  const puckResistance = settings.puckResistance * (1.12 - state.saturation * 0.26);
  const pressureBuild = clamp(0.62 + settings.puckResistance * 0.22 + state.saturation * 0.16, 0.35, 1.03);
  const targetPressure = settings.pumpPressure * pumpCommand * pressureBuild;
  const pressureTau = pumpCommand > 0 ? 0.46 : 0.24;
  state.pressure += ((targetPressure - state.pressure) / pressureTau) * step;
  state.pressure = clamp(state.pressure, 0, settings.pumpPressure + 0.7);

  const tempViscosity = clamp(1 + (92 - state.waterTemp) * 0.006, 0.84, 1.18);
  const preinfusionLimiter = state.brewActive && state.shotTime < settings.preinfusion ? 0.72 : 1;
  const flowRaw = ((Math.max(0, state.pressure - 0.35) / Math.max(0.45, puckResistance)) * 0.24 * puckWetness * preinfusionLimiter) / tempViscosity;
  const levelRatio = state.boilerWaterLevel / settings.boilerVolume;
  const lowLevelLimiter = clamp((levelRatio - 0.76) / 0.12, 0.18, 1);
  state.flow = pumpCommand > 0 ? clamp(flowRaw * lowLevelLimiter, 0, 8.2) : lerp(state.flow, 0, clamp(step * 8, 0, 1));

  const brewOutflow = state.brewActive ? state.flow : 0;
  const missingWater = Math.max(0, settings.boilerVolume - state.boilerWaterLevel);
  const makeUpDemand = clamp(missingWater * 2.2, 0, settings.refillRate);
  const refillDemand = brewOutflow + makeUpDemand;
  state.refillFlow = clamp(Math.min(settings.refillRate, refillDemand), 0, settings.refillRate);
  state.boilerWaterLevel = clamp(
    state.boilerWaterLevel + (state.refillFlow - brewOutflow) * step,
    settings.boilerVolume * 0.72,
    settings.boilerVolume,
  );
  state.totalRefill += state.refillFlow * step;
  state.effectiveFeedTemp = calcPreheatedFeedTemp(settings, state.boilerTemp, state.groupTemp);
  state.boilerSetpoint = calcBoilerSetpoint(settings, state.flow, state.refillFlow, state.effectiveFeedTemp);

  const boilerCapacity = state.boilerWaterLevel * 4.18 + 3200 + settings.boilerVolume * 0.62;
  const groupCapacity = 1180;
  const error = state.boilerSetpoint - state.boilerTemp;
  if (settings.autoHeat) {
    state.pidIntegral = clamp(state.pidIntegral + error * step * 0.003, 0, 0.68);
    if (error < -0.6) state.pidIntegral *= Math.pow(0.975, step * 8);
    state.heaterDuty = clamp(error * 0.075 + state.pidIntegral + (state.brewActive ? 0.14 : 0), 0, 1);
  } else {
    state.pidIntegral = 0;
    state.heaterDuty = 0;
  }

  const heatIn = settings.heaterPower * state.heaterDuty;
  const ambientLoss = settings.thermalLoss * (state.boilerTemp - settings.ambientTemp);
  state.refillHeatLoad = state.refillFlow * 4.18 * Math.max(0, state.boilerTemp - state.effectiveFeedTemp);
  const mixingLoss = state.refillFlow > 0 ? Math.max(0, state.boilerTemp - settings.targetTemp) * state.refillFlow * 1.15 : 0;
  const boilerDelta = ((heatIn - ambientLoss - state.refillHeatLoad - mixingLoss) / boilerCapacity) * step;
  state.boilerTemp += boilerDelta;

  const heatLoadRatio = settings.heaterPower > 0 ? state.refillHeatLoad / settings.heaterPower : 0;
  const headroom = calcMachineHeadroom(settings);
  const stressHeadroomFactor = clamp(1.18 - headroom, 0.18, 0.92);
  const thermalDeficit = Math.max(0, state.boilerSetpoint - state.boilerTemp);
  const groupDeficit = Math.max(0, settings.targetTemp - state.groupTemp);
  const refillSaturation = settings.refillRate > 0 ? state.refillFlow / settings.refillRate : 0;
  const targetStress = clamp(
    (state.brewActive ? 0.18 : 0) +
      thermalDeficit * 0.055 +
      groupDeficit * 0.04 +
      heatLoadRatio * 0.5 +
      Math.max(0, state.heaterDuty - 0.88) * 0.55 +
      Math.max(0, refillSaturation - 0.82) * 0.4,
    0,
    1,
  ) * stressHeadroomFactor;
  const stressRate = targetStress > state.thermalStress ? 0.03 + (1 - headroom) * 0.045 : state.brewActive ? 0.035 : 0.07;
  state.thermalStress += (targetStress - state.thermalStress) * stressRate * step;
  state.thermalStress = clamp(state.thermalStress, 0, 1);

  if (state.brewActive) {
    const loadGain = 0.00018 + Math.pow(1 - headroom, 1.25) * 0.0042 + heatLoadRatio * 0.0008;
    state.serviceLoad += step * loadGain;
  } else {
    const recoveryFactor = state.boilerTemp >= state.boilerSetpoint - 1 ? 1 : 0.35;
    state.serviceLoad -= step * (0.0014 + headroom * 0.0024) * recoveryFactor;
  }
  state.serviceLoad = clamp(state.serviceLoad, 0, 1);

  const groupConductance = 11 + Math.min(7, state.flow * 1.7);
  const groupFlowHeat = state.flow * 4.18 * 0.46 * (state.boilerTemp - state.groupTemp);
  const groupAssist = settings.autoHeat ? Math.max(0, settings.targetTemp - state.groupTemp) * 11 : 0;
  const groupLoss = 2.8 * (state.groupTemp - settings.ambientTemp);
  const groupDelta = ((groupConductance * (state.boilerTemp - state.groupTemp) + groupFlowHeat + groupAssist - groupLoss) / groupCapacity) * step;
  state.groupTemp += groupDelta;

  const boilerOffset = state.boilerSetpoint - settings.targetTemp;
  const brewCoreTemp = state.boilerTemp - boilerOffset;
  const outletDuringFlow =
    brewCoreTemp -
    Math.max(0, settings.targetTemp - state.groupTemp) * 0.14 -
    Math.max(0, state.flow - 2.8) * 0.28 -
    Math.max(0, 22 - settings.ambientTemp) * 0.03 -
    state.thermalStress * 1.55 -
    state.serviceLoad * 1.35;
  const outletIdle = lerp(state.waterTemp, state.groupTemp, clamp(step / 4.5, 0, 1));
  const desiredWaterTemp = state.flow > 0.05 ? outletDuringFlow : outletIdle;
  state.waterTemp += (desiredWaterTemp - state.waterTemp) * clamp(step / (state.flow > 0.05 ? 0.32 : 1.8), 0, 1);

  if (state.brewActive) {
    const massStep = state.flow * step;
    state.shotMass += massStep;
    state.tempIntegral += state.waterTemp * step;
    state.tempSqIntegral += state.waterTemp * state.waterTemp * step;
    state.pressureIntegral += state.pressure * step;
    state.flowIntegral += state.flow * step;
    state.stressIntegral += state.thermalStress * step;
    state.loadIntegral += state.serviceLoad * step;

    const tempFactor = Math.exp(-Math.pow((state.waterTemp - 93) / 7.5, 2));
    const pressureFactor = clamp(0.58 + state.pressure / 13, 0.45, 1.22);
    const flowFactor = clamp(1.1 - Math.abs(state.flow - 2.2) / 9, 0.62, 1.12);
    const depletion = Math.exp(-state.shotMass / 46);
    const stressFactor = clamp(1 - state.thermalStress * 0.1, 0.88, 1);
    const instantTds = (0.028 + 0.075 * depletion) * tempFactor * pressureFactor * flowFactor * stressFactor;
    state.extractedSolids += massStep * instantTds;

    state.shotSampleTimer += step;
    if (state.shotSampleTimer >= 0.25) {
      state.shotSampleTimer = 0;
      state.shotProfile.push({
        time: state.shotTime,
        pressure: state.pressure,
        flow: state.flow,
        temp: state.waterTemp,
      });
      state.shotProfile = state.shotProfile.slice(-220);
    }
  }

  state.sampleTimer += step;
  if (state.sampleTimer >= 0.5) {
    state.sampleTimer = 0;
    state.history.push({
      time: state.time,
      waterTemp: state.waterTemp,
      boilerTemp: state.boilerTemp,
      pressure: state.pressure,
      flow: state.flow,
      heaterDuty: state.heaterDuty,
      refillFlow: state.refillFlow,
      feedTemp: state.effectiveFeedTemp,
    });
    state.history = state.history.slice(-420);
  }

  updateMode(pumpCommand);
}

function drawCanvas(canvas, draw) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.scale(dpr, dpr);
  draw(ctx, rect.width, rect.height);
  ctx.restore();
}

function drawGrid(ctx, width, height, padding) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfdff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#e2e9f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) * i) / 5;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 6; i += 1) {
    const x = padding.left + ((width - padding.left - padding.right) * i) / 6;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }
}

function drawLine(ctx, points, getX, getY, color, width = 2.5) {
  if (points.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = getX(point);
    const y = getY(point);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawHistoryChart() {
  drawCanvas(elements.historyChart, (ctx, width, height) => {
    const padding = { left: 42, right: 38, top: 18, bottom: 30 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    drawGrid(ctx, width, height, padding);

    const points = state.history;
    const minTime = points.length ? points[0].time : state.time - 180;
    const maxTime = Math.max(state.time, minTime + 60);
    const x = (p) => padding.left + ((p.time - minTime) / (maxTime - minTime)) * plotW;
    const yTemp = (value) => padding.top + (1 - (value - 20) / 88) * plotH;
    const yPressure = (value) => padding.top + (1 - value / 13) * plotH;

    ctx.fillStyle = "#697381";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("108°C", 8, padding.top + 5);
    ctx.fillText("20°C", 14, height - padding.bottom + 4);
    ctx.fillText("13 bar", width - 37, padding.top + 5);
    ctx.fillText("0", width - 24, height - padding.bottom + 4);

    const targetY = yTemp(settings.targetTemp);
    ctx.strokeStyle = "rgba(177, 59, 46, 0.28)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(padding.left, targetY);
    ctx.lineTo(width - padding.right, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    drawLine(ctx, points, x, (p) => yTemp(p.boilerTemp), "#c68b2f", 2.4);
    drawLine(ctx, points, x, (p) => yTemp(p.waterTemp), "#b13b2e", 2.8);
    drawLine(ctx, points, x, (p) => yPressure(p.pressure), "#087c89", 2.5);
  });
}

function drawShotChart() {
  drawCanvas(elements.shotChart, (ctx, width, height) => {
    const padding = { left: 42, right: 28, top: 15, bottom: 28 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    drawGrid(ctx, width, height, padding);

    const points = state.shotProfile;
    const maxTime = Math.max(settings.shotDuration, 12);
    const x = (p) => padding.left + (p.time / maxTime) * plotW;
    const yPressure = (value) => padding.top + (1 - value / 13) * plotH;
    const yFlow = (value) => padding.top + (1 - value / 8) * plotH;
    const yTemp = (value) => padding.top + (1 - (value - 78) / 24) * plotH;

    ctx.fillStyle = "#697381";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("bar/ml", 7, padding.top + 4);
    ctx.fillText("sec", width - 44, height - 9);

    drawLine(ctx, points, x, (p) => yTemp(p.temp), "#b13b2e", 2.3);
    drawLine(ctx, points, x, (p) => yPressure(p.pressure), "#087c89", 2.3);
    drawLine(ctx, points, x, (p) => yFlow(p.flow), "#1d8f5b", 2);
  });
}

function updateShotLog() {
  elements.shotCount.textContent = `${state.shotLog.length} shots`;
  if (state.shotLog.length === 0) {
    elements.shotLog.innerHTML = '<p class="empty-log">샷 데이터가 아직 없습니다.</p>';
    return;
  }

  elements.shotLog.innerHTML = state.shotLog
    .map(
      (shot) => `
        <div class="shot-row">
          <strong>#${shot.index}</strong>
          <span>${shot.mass.toFixed(1)} g</span>
          <span>${shot.avgTemp.toFixed(1)}°C</span>
          <span>${shot.avgPressure.toFixed(1)} bar · ${shot.ey.toFixed(1)}%</span>
          <span>${shot.quality.toFixed(0)}점 · ${shot.qualityNote}</span>
        </div>
      `,
    )
    .join("");
}

function render() {
  settings = readSettings();
  state.effectiveFeedTemp = calcPreheatedFeedTemp(settings, state.boilerTemp, state.groupTemp);
  state.boilerSetpoint = calcBoilerSetpoint(settings, state.flow, state.refillFlow, state.effectiveFeedTemp);
  const avgTemp = state.shotTime > 0 ? state.tempIntegral / state.shotTime : 0;
  const avgPressure = state.shotTime > 0 ? state.pressureIntegral / state.shotTime : 0;
  const avgFlow = state.shotTime > 0 ? state.flowIntegral / state.shotTime : 0;
  const avgStress = state.shotTime > 0 ? state.stressIntegral / state.shotTime : state.thermalStress;
  const avgLoad = state.shotTime > 0 ? state.loadIntegral / state.shotTime : state.serviceLoad;
  const tempVariance = state.shotTime > 0 ? state.tempSqIntegral / state.shotTime - avgTemp * avgTemp : 0;
  const tempStd = Math.sqrt(Math.max(0, tempVariance));
  const tds = state.shotMass > 0 ? (state.extractedSolids / state.shotMass) * 100 : 0;
  const ey = (state.extractedSolids / 18) * 100;
  const quality = state.shotTime > 0
    ? calcQuality({ avgTemp, avgPressure, avgFlow, mass: state.shotMass, ey, tempStd, stress: clamp(avgStress + avgLoad * 0.55, 0, 1) })
    : { score: Math.round((1 - (state.thermalStress + state.serviceLoad * 0.55) * 0.45) * 100), note: "대기" };
  state.currentQuality = quality.score;
  state.currentQualityNote = quality.note;
  const levelRatio = state.boilerWaterLevel / settings.boilerVolume;
  const ready =
    Math.abs(state.boilerTemp - state.boilerSetpoint) <= 2.2 &&
    state.groupTemp >= settings.targetTemp - 2.5 &&
    levelRatio >= 0.94;

  elements.clock.textContent = minutesSeconds(state.time);
  elements.modeLabel.textContent = state.mode;
  elements.readyLabel.textContent = state.brewActive ? "BREWING" : ready ? "READY" : state.mode === "회복 중" ? "RECOVER" : "HEATING";
  elements.readyLabel.className = `mode-pill ${state.brewActive ? "brewing" : ready ? "ready" : state.mode === "회복 중" ? "recovering" : ""}`;
  elements.waterTemp.textContent = fmt.temp(state.waterTemp);
  elements.boilerTemp.textContent = fmt.temp(state.boilerTemp);
  elements.boilerSetpoint.textContent = `목표 ${state.boilerSetpoint.toFixed(1)}°C`;
  elements.pressure.textContent = fmt.bar(state.pressure);
  elements.flowRate.textContent = fmt.flow(state.flow);
  elements.heaterDuty.textContent = fmt.pct(state.heaterDuty * 100);
  elements.shotMass.textContent = fmt.grams(state.shotMass);
  elements.refillFlow.textContent = fmt.flow(state.refillFlow);
  elements.totalRefill.textContent = `보충 ${state.totalRefill.toFixed(0)} ml`;
  elements.feedTemp.textContent = fmt.temp(state.effectiveFeedTemp);
  elements.rawFeedTemp.textContent = `원수 ${settings.inletWaterTemp.toFixed(1)}°C`;
  elements.boilerLevel.textContent = fmt.pct(levelRatio * 100);
  elements.boilerLevelDetail.textContent = `${state.boilerWaterLevel.toFixed(0)} ml`;
  elements.refillHeatLoad.textContent = fmt.watts(state.refillHeatLoad);
  elements.shotTimer.textContent = fmt.secs(state.shotTime);
  elements.avgTemp.textContent = avgTemp > 0 ? fmt.temp(avgTemp) : "0.0°C";
  elements.avgPressure.textContent = fmt.bar(avgPressure);
  elements.tds.textContent = fmt.pct1(tds);
  elements.extractionYield.textContent = fmt.pct1(ey);
  elements.qualityScore.textContent = `${quality.score.toFixed(0)}점`;
  elements.cycleLabel.textContent = settings.continuousMode
    ? state.brewActive
      ? `연속작동 · ${state.shotIndex}번째 샷`
      : `연속작동 · 다음 샷까지 ${Math.max(0, settings.restDuration - state.restTimer).toFixed(0)}초`
    : state.brewActive
      ? "수동 추출"
      : "대기";

  elements.toggleRun.textContent = state.running ? "일시정지" : "재생";
  elements.toggleBrew.textContent = state.brewActive ? "샷 중지" : "샷 시작";
  elements.toggleBrew.classList.toggle("active", state.brewActive);

  const needleAngle = -112 + clamp(state.pressure / 12, 0, 1) * 224;
  elements.pressureNeedle.style.transform = `translate(-50%, -100%) rotate(${needleAngle}deg)`;

  const tempRatio = clamp((state.boilerTemp - 20) / 82, 0, 1);
  const hotHue = Math.round(lerp(190, 8, tempRatio));
  elements.boilerFill.style.height = `${clamp(levelRatio * 78, 40, 82)}%`;
  elements.boilerFill.style.background = `linear-gradient(180deg, hsl(${hotHue} 82% 68%), hsl(${Math.max(0, hotHue - 14)} 66% 44%))`;
  elements.heaterGlow.style.background = `rgba(177, 59, 46, ${0.15 + state.heaterDuty * 0.7})`;
  elements.heaterGlow.style.boxShadow = `0 0 ${Math.round(4 + state.heaterDuty * 30)}px rgba(177, 59, 46, ${state.heaterDuty * 0.72})`;
  elements.groupLight.style.background = ready ? "#1d8f5b" : state.brewActive ? "#b13b2e" : "#b87510";
  elements.groupLight.style.boxShadow = ready
    ? "0 0 14px rgba(29, 143, 91, 0.5)"
    : state.brewActive
      ? "0 0 16px rgba(177, 59, 46, 0.58)"
      : "0 0 14px rgba(184, 117, 16, 0.45)";
  elements.stream.classList.toggle("active", state.flow > 0.2);
  elements.pumpPulse.parentElement.classList.toggle("active", state.pressure > 0.3 || state.flow > 0.1);
  elements.espressoLevel.style.height = `${clamp(state.shotMass / 42, 0, 1) * 82}%`;

  drawHistoryChart();
  drawShotChart();
  updateShotLog();
}

function animate(now) {
  const elapsed = Math.min(0.12, (now - lastFrame) / 1000);
  lastFrame = now;

  if (state.running) {
    accumulator += elapsed * readSettings().simSpeed;
    while (accumulator >= dt) {
      simulateStep(dt);
      accumulator -= dt;
    }
  }

  render();
  requestAnimationFrame(animate);
}

Object.values(controls).forEach((control) => {
  control.addEventListener("input", updateControlLabels);
  control.addEventListener("change", updateControlLabels);
});

elements.toggleRun.addEventListener("click", () => {
  state.running = !state.running;
});

elements.toggleBrew.addEventListener("click", () => {
  if (state.brewActive) {
    stopShot("수동 중지");
  } else {
    startShot();
  }
});

elements.resetSim.addEventListener("click", () => {
  state = initialState();
  accumulator = 0;
});

controls.continuousMode.addEventListener("change", () => {
  if (controls.continuousMode.checked && !state.brewActive) {
    state.restTimer = Math.max(state.restTimer, readSettings().restDuration);
  }
});

updateControlLabels();
for (let i = 0; i < 8; i += 1) {
  simulateStep(0.05);
}
render();
requestAnimationFrame(animate);
