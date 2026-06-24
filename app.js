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
  soundVolume: $("soundVolume"),
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
  soundVolume: $("soundVolumeValue"),
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
  soundVolume: Number(controls.soundVolume.value),
  continuousMode: controls.continuousMode.checked,
  autoHeat: controls.autoHeat.checked,
});

const elements = {
  toggleRun: $("toggleRun"),
  toggleBrew: $("toggleBrew"),
  toggleSound: $("toggleSound"),
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
  machineVisual: $("machineVisual"),
  prepStation: $("prepStation"),
  workflowLabel: $("workflowLabel"),
  historyChart: $("historyChart"),
  shotChart: $("shotChart"),
  challengeMode: $("challengeMode"),
  sandboxMode: $("sandboxMode"),
  challengeContent: $("challengeContent"),
  sandboxContent: $("sandboxContent"),
  perfectShotPreset: $("perfectShotPreset"),
  sandboxPresetStatus: $("sandboxPresetStatus"),
  totalCost: $("totalCost"),
  stageNumber: $("stageNumber"),
  stageName: $("stageName"),
  stageBrief: $("stageBrief"),
  goalQuality: $("goalQuality"),
  goalShots: $("goalShots"),
  goalBudget: $("goalBudget"),
  goalCycle: $("goalCycle"),
  goalPayback: $("goalPayback"),
  stageProgress: $("stageProgress"),
  budgetFill: $("budgetFill"),
  currentCycle: $("currentCycle"),
  dailyCapacity: $("dailyCapacity"),
  currentPayback: $("currentPayback"),
  stageStatus: $("stageStatus"),
  runStage: $("runStage"),
  nextStage: $("nextStage"),
  autoTuneStage: $("autoTuneStage"),
  helpDialog: $("helpDialog"),
  helpTitle: $("helpTitle"),
  helpBody: $("helpBody"),
  helpImpact: $("helpImpact"),
  closeHelp: $("closeHelp"),
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
  const tempPenalty = Math.abs(avgTemp - 93.08) * 2.2 + Math.max(0, tempStd - 4.4) * 0.7;
  const pressurePenalty = Math.abs(avgPressure - 8.02) * 1.2;
  const flowPenalty = Math.abs(avgFlow - 1.36) * 1.6;
  const massPenalty = Math.abs(mass - 36.7) * 0.18;
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

const BASE_MACHINE_COST = 2500000;

const FACTOR_DEFS = {
  targetTemp: {
    title: "목표 수온",
    kind: "recipe",
    help: "커피층에 도달할 추출수의 목표 온도입니다. 높은 온도는 용출을 늘리고, 낮은 온도는 산미와 저추출 가능성을 높입니다.",
    impact: "성능 영향: 추출 수율과 맛의 균형. 하드웨어 가격에는 영향을 주지 않는 레시피 값입니다.",
  },
  ambientTemp: {
    title: "외부 온도",
    kind: "environment",
    help: "머신이 놓인 공간의 온도입니다. 주변이 추울수록 보일러와 그룹헤드에서 빠져나가는 열이 많아집니다.",
    impact: "성능 영향: 열손실과 예열 시간. 환경 조건이므로 견적에는 포함되지 않습니다.",
  },
  pumpPressure: {
    title: "펌프 압력",
    cost: (value) => 600000 + Math.max(0, value - 3) * 95000,
    help: "커피 퍽에 물을 밀어 넣는 펌프의 설정 압력입니다. 너무 낮으면 저추출, 너무 높으면 채널링과 과다 유량 위험이 커집니다.",
    impact: "가격 영향: 고압에서도 유량을 안정적으로 유지하는 펌프와 밸브 비용이 증가합니다.",
  },
  puckResistance: {
    title: "퍽 저항",
    kind: "recipe",
    help: "분쇄도, 도징량, 탬핑으로 만들어지는 커피층의 저항입니다. 높을수록 유량이 느려지고 압력이 쉽게 형성됩니다.",
    impact: "성능 영향: 유량과 추출 시간. 원두 준비값이므로 머신 견적에는 포함되지 않습니다.",
  },
  heaterPower: {
    title: "히터 출력",
    cost: (value) => 900000 + Math.max(0, value - 1400) * 1100,
    help: "보일러에 공급할 수 있는 최대 열량입니다. 연속 추출 중 보충수가 들어올 때 온도를 얼마나 빨리 회복하는지 결정합니다.",
    impact: "가격 영향: 고출력 히터, 전원부, 배선과 안전장치 비용이 함께 증가합니다.",
  },
  boilerVolume: {
    title: "보일러 용량",
    cost: (value) => 700000 + Math.max(0, value - 600) * 1750,
    help: "추출용 온수를 저장하는 열용량입니다. 클수록 샷 사이 온도 변화가 작지만 예열 시간과 크기, 소비전력이 늘어납니다.",
    impact: "가격 영향: 보일러 재질, 프레임 크기, 단열재와 열용량 비용이 증가합니다.",
  },
  thermalLoss: {
    title: "열손실",
    cost: (value) => 400000 + Math.max(0, 12 - value) * 320000,
    help: "보일러와 배관이 주변으로 잃는 열량입니다. 값이 낮을수록 단열과 구조가 우수한 머신입니다.",
    impact: "가격 영향: 낮은 열손실을 만들기 위한 단열, 배관, 포화그룹 구조가 비쌉니다.",
  },
  inletWaterTemp: {
    title: "급수 온도",
    kind: "environment",
    help: "상수도에서 머신으로 들어오는 원수 온도입니다. 차가운 물일수록 보충 때 보일러가 받는 열충격이 큽니다.",
    impact: "성능 영향: 급수 열부하. 매장 환경 조건이므로 머신 견적에는 포함되지 않습니다.",
  },
  refillRate: {
    title: "급수 능력",
    cost: (value) => 300000 + Math.max(0, value - 0.6) * 240000,
    help: "추출로 빠진 물을 보일러에 보충할 수 있는 최대 유량입니다. 부족하면 수위와 유량 안정성이 떨어집니다.",
    impact: "가격 영향: 급수 펌프, 솔레노이드 밸브, 유량계와 배관 용량이 커집니다.",
  },
  preheatEfficiency: {
    title: "프리히트",
    cost: (value) => 250000 + value * 35000,
    help: "차가운 보충수를 보일러에 넣기 전에 폐열로 미리 데우는 효율입니다. 높을수록 연속 추출 열충격이 줄어듭니다.",
    impact: "가격 영향: 열교환기 면적, 배관 복잡도와 제어 비용이 증가합니다.",
  },
  preinfusion: {
    title: "프리인퓨전",
    cost: (value) => value > 0 ? 250000 + value * 25000 : 0,
    help: "본 추출 전에 낮은 압력으로 커피층을 적시는 시간입니다. 균일한 포화에 도움을 주지만 전체 샷 시간이 길어집니다.",
    impact: "가격 영향: 정밀 밸브와 압력 제어 기능 비용이 소폭 추가됩니다.",
  },
  shotDuration: {
    title: "샷 시간",
    kind: "recipe",
    help: "한 샷 동안 펌프를 작동하는 총 시간입니다. 퍽 저항과 함께 최종 추출량을 결정합니다.",
    impact: "성능 영향: 추출량과 수율. 레시피 값이므로 견적에는 영향을 주지 않습니다.",
  },
  restDuration: {
    title: "회복 시간",
    kind: "operation",
    help: "연속작동에서 다음 샷을 시작하기 전에 기다리는 시간입니다. 길수록 열회복은 좋아지지만 처리량은 낮아집니다.",
    impact: "운영 영향: 품질과 처리량의 교환 조건. 머신 견적에는 포함되지 않습니다.",
  },
  simSpeed: {
    title: "진행 속도",
    kind: "simulation",
    help: "화면에서 시뮬레이션 시간이 흐르는 속도입니다. 물리 결과에는 영향을 주지 않습니다.",
    impact: "시뮬레이션 전용 설정이며 비용과 성능 판정에 영향을 주지 않습니다.",
  },
  soundVolume: {
    title: "소리 볼륨",
    kind: "simulation",
    help: "펌프, 히터, 급수와 추출 스트림의 합성음 크기를 조절합니다.",
    impact: "시뮬레이션 전용 설정이며 비용과 성능 판정에 영향을 주지 않습니다.",
  },
  continuousMode: {
    title: "연속작동",
    cost: (enabled) => enabled ? 450000 : 0,
    help: "설정된 회복 시간이 지나면 다음 샷을 자동으로 시작합니다. 도전 모드에서는 연속 성능 시험을 위해 필수로 사용됩니다.",
    impact: "가격 영향: 자동 시퀀스 제어, 타이머와 안전 인터록 비용이 추가됩니다.",
  },
  autoHeat: {
    title: "자동 PID 가열",
    cost: (enabled) => enabled ? 800000 : 0,
    help: "목표와 현재 온도의 차이, 누적 오차와 변화 속도를 이용해 히터 출력을 자동 조절합니다.",
    impact: "가격 영향: 온도 센서, PID 제어기와 전력 조절부 비용이 추가됩니다.",
  },
};

const BARISTA_PREP_SECONDS = 8;

const PERFECT_SHOT_PRESET = {
  targetTemp: 93,
  ambientTemp: 22,
  pumpPressure: 8.8,
  puckResistance: 1.55,
  heaterPower: 5200,
  boilerVolume: 4200,
  thermalLoss: 1.5,
  inletWaterTemp: 22,
  refillRate: 9,
  preheatEfficiency: 90,
  preinfusion: 4,
  shotDuration: 27,
  restDuration: 30,
};

const CHALLENGE_STAGES = [
  {
    name: "동네 카페의 첫 머신",
    brief: "합리적인 투자로 품질과 회전율을 함께 확보하세요.",
    quality: 85,
    shots: 3,
    budget: 14000000,
    maxCycle: 50,
    maxPaybackDays: 96,
    marginPerShot: 1800,
    openHours: 8,
    utilization: 0.12,
    solution: { heaterPower: 2300, boilerVolume: 1200, thermalLoss: 5.5, refillRate: 2.4, preheatEfficiency: 45, restDuration: 5 },
  },
  {
    name: "점심시간 러시",
    brief: "점심 러시를 버티는 빠른 사이클과 열회복을 설계하세요.",
    quality: 92,
    shots: 4,
    budget: 18000000,
    maxCycle: 44,
    maxPaybackDays: 75,
    marginPerShot: 2000,
    openHours: 10,
    utilization: 0.14,
    solution: { heaterPower: 3200, boilerVolume: 1800, thermalLoss: 4, refillRate: 5, preheatEfficiency: 65, restDuration: 4 },
  },
  {
    name: "스페셜티 바",
    brief: "높은 품질을 유지하면서도 투자금을 빠르게 회수하세요.",
    quality: 96,
    shots: 5,
    budget: 22000000,
    maxCycle: 40,
    maxPaybackDays: 66,
    marginPerShot: 2300,
    openHours: 10,
    utilization: 0.16,
    solution: { heaterPower: 4000, boilerVolume: 3000, thermalLoss: 3.4, refillRate: 5, preheatEfficiency: 75, restDuration: 3 },
  },
  {
    name: "플래그십 98+",
    brief: "98점 이상의 플래그십 품질과 상업적인 처리량을 동시에 달성하세요.",
    quality: 98,
    shots: 7,
    budget: 27000000,
    maxCycle: 38,
    maxPaybackDays: 54,
    marginPerShot: 2600,
    openHours: 12,
    utilization: 0.18,
    solution: { heaterPower: 5200, boilerVolume: 4200, thermalLoss: 1.5, inletWaterTemp: 22, refillRate: 9, preheatEfficiency: 90, restDuration: 3 },
  },
];

const gameState = {
  mode: "challenge",
  stageIndex: 0,
  active: false,
  status: "idle",
  results: [],
  runCost: 0,
  runCycle: 0,
  runPayback: 0,
  lastMessage: "",
};

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
    workflowPhase: "ready",
    workflowTime: BARISTA_PREP_SECONDS,
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

const audioSim = {
  ctx: null,
  enabled: false,
  ready: false,
  nodes: {},
  lastBrewActive: false,
  lastPumpActive: false,

  async toggle() {
    if (this.enabled) {
      this.enabled = false;
      this.updateButton();
      return;
    }

    if (!this.ready && !this.init()) {
      elements.toggleSound.textContent = "소리 불가";
      elements.toggleSound.disabled = true;
      return;
    }

    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.enabled = true;
    this.click(760, 0.08, 0.08);
    this.updateButton();
  },

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    this.ctx = new AudioContextClass();
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const pumpOsc = ctx.createOscillator();
    pumpOsc.type = "sawtooth";
    pumpOsc.frequency.value = 52;
    const pumpFilter = ctx.createBiquadFilter();
    pumpFilter.type = "lowpass";
    pumpFilter.frequency.value = 180;
    pumpFilter.Q.value = 0.8;
    const pumpGain = ctx.createGain();
    pumpGain.gain.value = 0;
    pumpOsc.connect(pumpFilter).connect(pumpGain).connect(master);
    pumpOsc.start();

    const heaterOsc = ctx.createOscillator();
    heaterOsc.type = "sine";
    heaterOsc.frequency.value = 120;
    const heaterGain = ctx.createGain();
    heaterGain.gain.value = 0;
    heaterOsc.connect(heaterGain).connect(master);
    heaterOsc.start();

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 2);
    noise.loop = true;

    const streamFilter = ctx.createBiquadFilter();
    streamFilter.type = "bandpass";
    streamFilter.frequency.value = 900;
    streamFilter.Q.value = 1.2;
    const streamGain = ctx.createGain();
    streamGain.gain.value = 0;
    noise.connect(streamFilter).connect(streamGain).connect(master);

    const rattleFilter = ctx.createBiquadFilter();
    rattleFilter.type = "bandpass";
    rattleFilter.frequency.value = 120;
    rattleFilter.Q.value = 5;
    const rattleGain = ctx.createGain();
    rattleGain.gain.value = 0;
    noise.connect(rattleFilter).connect(rattleGain).connect(master);

    const refillFilter = ctx.createBiquadFilter();
    refillFilter.type = "bandpass";
    refillFilter.frequency.value = 1800;
    refillFilter.Q.value = 0.9;
    const refillGain = ctx.createGain();
    refillGain.gain.value = 0;
    noise.connect(refillFilter).connect(refillGain).connect(master);
    noise.start();

    this.nodes = {
      master,
      pumpOsc,
      pumpGain,
      heaterGain,
      streamFilter,
      streamGain,
      rattleGain,
      refillFilter,
      refillGain,
    };
    this.ready = true;
    return true;
  },

  createNoiseBuffer(ctx, seconds) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = last * 0.72 + (Math.random() * 2 - 1) * 0.28;
      data[i] = last;
    }
    return buffer;
  },

  click(frequency = 720, gain = 0.08, duration = 0.055) {
    if (!this.ready || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(frequency, t);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp).connect(this.nodes.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  },

  setParam(param, value, time = 0.08) {
    param.setTargetAtTime(value, this.ctx.currentTime, time);
  },

  update(simState, s) {
    if (!this.ready) return;
    const enabledGain = this.enabled ? s.soundVolume / 100 : 0;
    const pumpActive = simState.pressure > 0.25 || simState.flow > 0.1;
    const pumpActivity = clamp(simState.pressure / 9 * 0.62 + simState.flow / 2.4 * 0.45, 0, 1);
    const streamActivity = clamp(simState.flow / 2.4, 0, 1);
    const refillActivity = clamp(simState.refillFlow / Math.max(0.1, s.refillRate), 0, 1);

    this.setParam(this.nodes.master.gain, enabledGain * 0.82, 0.05);
    this.setParam(this.nodes.pumpOsc.frequency, 48 + simState.pressure * 2.5 + simState.flow * 4.5, 0.06);
    this.setParam(this.nodes.pumpGain.gain, pumpActivity * 0.14, 0.08);
    this.setParam(this.nodes.rattleGain.gain, pumpActivity * (0.02 + simState.thermalStress * 0.035), 0.08);
    this.setParam(this.nodes.heaterGain.gain, simState.heaterDuty * 0.055, 0.16);
    this.setParam(this.nodes.streamFilter.frequency, 650 + simState.flow * 260 + simState.pressure * 22, 0.08);
    this.setParam(this.nodes.streamGain.gain, streamActivity * 0.105, 0.07);
    this.setParam(this.nodes.refillFilter.frequency, 1200 + refillActivity * 1200, 0.1);
    this.setParam(this.nodes.refillGain.gain, refillActivity * 0.04, 0.12);

    if (!this.lastBrewActive && simState.brewActive) this.click(820, 0.1, 0.055);
    if (this.lastBrewActive && !simState.brewActive) this.click(380, 0.09, 0.085);
    if (!this.lastPumpActive && pumpActive) this.click(540, 0.055, 0.04);

    this.lastBrewActive = simState.brewActive;
    this.lastPumpActive = pumpActive;
  },

  updateButton() {
    if (elements.toggleSound.disabled) return;
    elements.toggleSound.textContent = this.enabled ? "소리 끄기" : "소리 켜기";
    elements.toggleSound.classList.toggle("active", this.enabled);
  },
};

function formatWon(value) {
  return `${Math.round(value / 10000).toLocaleString("ko-KR")}만원`;
}

function getFactorCost(id) {
  const def = FACTOR_DEFS[id];
  const control = controls[id];
  if (!def || !def.cost || !control) return 0;
  const checkboxValue = id === "continuousMode" && gameState.mode === "challenge" ? true : control.checked;
  const value = control.type === "checkbox" ? checkboxValue : Number(control.value);
  return Math.max(0, def.cost(value));
}

function calculateTotalCost() {
  const factorCost = Object.keys(FACTOR_DEFS).reduce((sum, id) => sum + getFactorCost(id), 0);
  return BASE_MACHINE_COST + factorCost;
}

function calculateEconomics(stage, cost = calculateTotalCost(), s = readSettings()) {
  const cycleSeconds = s.shotDuration + Math.max(s.restDuration, BARISTA_PREP_SECONDS);
  const dailyShots = (stage.openHours * 3600 / cycleSeconds) * stage.utilization;
  const paybackDays = cost / Math.max(1, dailyShots * stage.marginPerShot);
  return { cycleSeconds, dailyShots, paybackDays };
}

function formatPayback(days) {
  return `${(days / 30).toFixed(1)}개월`;
}

function openFactorHelp(id) {
  const def = FACTOR_DEFS[id];
  if (!def) return;
  elements.helpTitle.textContent = def.title;
  elements.helpBody.textContent = def.help;
  const cost = getFactorCost(id);
  const priceText = def.cost ? `현재 부품가: ${formatWon(cost)}` : "현재 비용: 없음";
  elements.helpImpact.textContent = `${def.impact} ${priceText}`;
  if (typeof elements.helpDialog.showModal === "function") elements.helpDialog.showModal();
  else elements.helpDialog.setAttribute("open", "");
}

function setupFactorControls() {
  document.querySelectorAll(".control").forEach((label) => {
    const input = label.querySelector("input[type='range']");
    const title = label.querySelector(":scope > span");
    const def = input ? FACTOR_DEFS[input.id] : null;
    if (!input || !title || !def) return;

    const heading = document.createElement("div");
    heading.className = "control-heading";
    label.insertBefore(heading, title);
    heading.appendChild(title);

    const helpButton = document.createElement("button");
    helpButton.type = "button";
    helpButton.className = "help-button";
    helpButton.textContent = "?";
    helpButton.title = `${def.title} 도움말`;
    helpButton.setAttribute("aria-label", `${def.title} 도움말`);
    helpButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFactorHelp(input.id);
    });
    heading.appendChild(helpButton);

    const costLabel = document.createElement("small");
    costLabel.className = "factor-cost";
    costLabel.id = `cost-${input.id}`;
    label.appendChild(costLabel);
  });

  document.querySelectorAll("[data-factor-help]").forEach((button) => {
    const id = button.dataset.factorHelp;
    button.title = `${FACTOR_DEFS[id].title} 도움말`;
    button.addEventListener("click", () => openFactorHelp(id));
  });
}

function updatePricingLabels() {
  Object.entries(FACTOR_DEFS).forEach(([id, def]) => {
    const costLabel = $(`cost-${id}`);
    if (!costLabel) return;
    if (def.cost) {
      costLabel.textContent = `부품 ${formatWon(getFactorCost(id))}`;
      costLabel.classList.remove("free");
    } else {
      const kindLabel = def.kind === "environment" ? "환경 조건" : def.kind === "recipe" ? "레시피" : "시뮬레이션";
      costLabel.textContent = `${kindLabel} · 비용 없음`;
      costLabel.classList.add("free");
    }
  });
  elements.totalCost.textContent = formatWon(calculateTotalCost());
}

function setBuildControlsDisabled(disabled) {
  Object.entries(controls).forEach(([id, control]) => {
    if (id === "simSpeed" || id === "soundVolume") return;
    control.disabled = disabled;
  });
  elements.runStage.disabled = disabled;
  elements.toggleBrew.disabled = disabled;
  elements.challengeMode.disabled = disabled;
  elements.sandboxMode.disabled = disabled;
  elements.autoTuneStage.disabled = disabled;
}

function updateGameUI() {
  updatePricingLabels();
  const challenge = gameState.mode === "challenge";
  elements.challengeMode.classList.toggle("active", challenge);
  elements.sandboxMode.classList.toggle("active", !challenge);
  elements.challengeMode.setAttribute("aria-selected", String(challenge));
  elements.sandboxMode.setAttribute("aria-selected", String(!challenge));
  elements.challengeContent.hidden = !challenge;
  elements.sandboxContent.hidden = challenge;
  if (!challenge) return;

  const stage = CHALLENGE_STAGES[gameState.stageIndex];
  if (!stage) {
    elements.stageNumber.textContent = "COMPLETE";
    elements.stageName.textContent = "모든 스테이지 완료";
    elements.stageBrief.textContent = "예산과 성능을 모두 다루는 머신 설계를 마쳤습니다.";
    elements.goalQuality.textContent = "완료";
    elements.goalShots.textContent = "완료";
    elements.goalBudget.textContent = "완료";
    elements.goalCycle.textContent = "완료";
    elements.goalPayback.textContent = "완료";
    elements.stageProgress.textContent = "4 / 4";
    elements.currentCycle.textContent = "완료";
    elements.dailyCapacity.textContent = "완료";
    elements.currentPayback.textContent = "완료";
    elements.budgetFill.style.width = "100%";
    elements.budgetFill.classList.remove("over");
    elements.stageStatus.textContent = "축하합니다. 샌드박스에서 완성된 세팅을 계속 시험할 수 있습니다.";
    elements.stageStatus.className = "stage-status success";
    elements.runStage.hidden = true;
    elements.nextStage.hidden = true;
    elements.autoTuneStage.hidden = true;
    return;
  }

  const totalCost = calculateTotalCost();
  const economics = calculateEconomics(stage, totalCost);
  const budgetRatio = totalCost / stage.budget;
  elements.stageNumber.textContent = `STAGE ${gameState.stageIndex + 1}`;
  elements.stageName.textContent = stage.name;
  elements.stageBrief.textContent = stage.brief;
  elements.goalQuality.textContent = `${stage.quality}점`;
  elements.goalShots.textContent = `${stage.shots}회`;
  elements.goalBudget.textContent = formatWon(stage.budget);
  elements.goalCycle.textContent = `${stage.maxCycle}초 이하`;
  elements.goalPayback.textContent = `${formatPayback(stage.maxPaybackDays)} 이내`;
  elements.stageProgress.textContent = `${gameState.results.length} / ${stage.shots}`;
  elements.currentCycle.textContent = `${economics.cycleSeconds.toFixed(0)}초`;
  elements.dailyCapacity.textContent = `${Math.floor(economics.dailyShots)}잔`;
  elements.currentPayback.textContent = formatPayback(economics.paybackDays);
  elements.budgetFill.style.width = `${clamp(budgetRatio * 100, 0, 100)}%`;
  elements.budgetFill.classList.toggle("over", budgetRatio > 1);
  elements.runStage.hidden = gameState.status === "passed";
  elements.runStage.textContent = gameState.status === "failed" ? "다시 테스트" : gameState.active ? "테스트 중" : "테스트 시작";
  elements.nextStage.hidden = gameState.status !== "passed";
  elements.autoTuneStage.hidden = false;

  let message = gameState.lastMessage || "세팅을 정한 뒤 테스트를 시작하세요.";
  let statusClass = "stage-status";
  if (gameState.active) message = `테스트 중 · ${gameState.results.length}/${stage.shots}샷 완료`;
  if (gameState.status === "passed") statusClass += " success";
  if (gameState.status === "failed") statusClass += " failure";
  elements.stageStatus.textContent = message;
  elements.stageStatus.className = statusClass;
}

function setGameMode(mode) {
  if (gameState.active) return;
  gameState.mode = mode;
  updateGameUI();
}

function startStageTest() {
  const stage = CHALLENGE_STAGES[gameState.stageIndex];
  if (!stage || gameState.active) return;

  controls.continuousMode.checked = true;
  controls.autoHeat.checked = true;
  const cost = calculateTotalCost();
  const economics = calculateEconomics(stage, cost);
  if (cost > stage.budget) {
    gameState.status = "failed";
    gameState.lastMessage = `예산 초과 · ${formatWon(cost - stage.budget)}을 줄여야 합니다.`;
    updateGameUI();
    return;
  }
  if (economics.cycleSeconds > stage.maxCycle) {
    gameState.status = "failed";
    gameState.lastMessage = `사이클 초과 · ${economics.cycleSeconds.toFixed(0)}초를 ${stage.maxCycle}초 이하로 줄이세요.`;
    updateGameUI();
    return;
  }
  if (economics.paybackDays > stage.maxPaybackDays) {
    gameState.status = "failed";
    gameState.lastMessage = `회수 기간 초과 · 현재 ${formatPayback(economics.paybackDays)}, 목표 ${formatPayback(stage.maxPaybackDays)}.`;
    updateGameUI();
    return;
  }

  gameState.active = true;
  gameState.status = "running";
  gameState.results = [];
  gameState.runCost = cost;
  gameState.runCycle = economics.cycleSeconds;
  gameState.runPayback = economics.paybackDays;
  gameState.lastMessage = "";
  state = initialState();
  state.running = true;
  accumulator = 0;
  setBuildControlsDisabled(true);
  updateGameUI();
}

function handleStageShot(shot) {
  if (gameState.mode !== "challenge" || !gameState.active) return;
  const stage = CHALLENGE_STAGES[gameState.stageIndex];
  if (!stage) return;
  gameState.results.push(shot);

  if (gameState.results.length >= stage.shots) {
    gameState.active = false;
    controls.continuousMode.checked = false;
    setBuildControlsDisabled(false);
    const minQuality = Math.min(...gameState.results.map((result) => result.quality));
    const passed =
      minQuality >= stage.quality &&
      gameState.runCost <= stage.budget &&
      gameState.runCycle <= stage.maxCycle &&
      gameState.runPayback <= stage.maxPaybackDays;
    gameState.status = passed ? "passed" : "failed";
    gameState.lastMessage = passed
      ? `성공 · 최저 ${minQuality.toFixed(1)}점 · ${gameState.runCycle.toFixed(0)}초/잔 · 회수 ${formatPayback(gameState.runPayback)}`
      : `실패 · 최저 ${minQuality.toFixed(1)}점, 목표 ${stage.quality}점`;
  }
  updateGameUI();
}

function applyStageSolution(stage) {
  Object.entries(stage.solution).forEach(([id, value]) => {
    if (controls[id]) controls[id].value = String(value);
  });
  controls.autoHeat.checked = true;
  controls.continuousMode.checked = false;
  updateControlLabels();
}

function advanceStage(message = "") {
  gameState.stageIndex += 1;
  gameState.active = false;
  gameState.status = "idle";
  gameState.results = [];
  gameState.lastMessage = message;
  controls.continuousMode.checked = false;
  setBuildControlsDisabled(false);
  state = initialState();
  accumulator = 0;
  updateGameUI();
}

function autoTuneStage() {
  const stage = CHALLENGE_STAGES[gameState.stageIndex];
  if (!stage || gameState.active) return;
  gameState.active = false;
  gameState.status = "idle";
  gameState.results = [];
  setBuildControlsDisabled(false);
  applyStageSolution(stage);
  gameState.lastMessage = "자동 세팅 완료 · 테스트를 시작해 성능과 수익성을 검증하세요.";
  state = initialState();
  accumulator = 0;
  updateGameUI();
}

function applyPerfectShotPreset() {
  if (gameState.active) return;
  Object.entries(PERFECT_SHOT_PRESET).forEach(([id, value]) => {
    controls[id].value = String(value);
  });
  controls.autoHeat.checked = true;
  controls.continuousMode.checked = false;
  state = initialState();
  state.running = true;
  accumulator = 0;
  elements.sandboxPresetStatus.textContent = "100점 레시피 적용됨";
  updateControlLabels();
}

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
  labels.soundVolume.textContent = `${s.soundVolume.toFixed(0)}%`;
  updateGameUI();
}

function updateWorkflowPhase() {
  if (state.brewActive) {
    state.workflowPhase = "brew";
  } else if (state.workflowTime < 1.4) {
    state.workflowPhase = "knockout";
  } else if (state.workflowTime < 4.2) {
    state.workflowPhase = "dosing";
  } else if (state.workflowTime < 5.8) {
    state.workflowPhase = "tamping";
  } else if (state.workflowTime < BARISTA_PREP_SECONDS) {
    state.workflowPhase = "return";
  } else {
    state.workflowPhase = "ready";
  }
}

function startShot() {
  if (state.brewActive || state.workflowPhase !== "ready") return;
  state.brewActive = true;
  state.workflowPhase = "brew";
  state.workflowTime = 0;
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
    handleStageShot(shot);
  }

  state.brewActive = false;
  state.restTimer = 0;
  state.workflowTime = 0;
  state.workflowPhase = "knockout";
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
  } else if (state.workflowPhase === "knockout") {
    state.mode = "퍽 폐기";
  } else if (state.workflowPhase === "dosing") {
    state.mode = "원두 도징";
  } else if (state.workflowPhase === "tamping") {
    state.mode = "탬핑";
  } else if (state.workflowPhase === "return") {
    state.mode = "포터필터 장착";
  } else if (!ready && state.boilerTemp < state.boilerSetpoint - 1.8) {
    state.mode = "예열 중";
  } else if (!ready && state.boilerTemp > state.boilerSetpoint + 3) {
    state.mode = "냉각 중";
  } else if (!levelReady) {
    state.mode = "급수 회복";
  } else if (settings.continuousMode && state.restTimer < Math.max(settings.restDuration, BARISTA_PREP_SECONDS)) {
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

  if (!state.brewActive) {
    state.workflowTime = Math.min(BARISTA_PREP_SECONDS, state.workflowTime + step);
    updateWorkflowPhase();
  }

  if (settings.continuousMode && !state.brewActive) {
    const closeEnough =
      state.boilerTemp >= state.boilerSetpoint - 4.8 &&
      state.groupTemp >= settings.targetTemp - 5.2 &&
      state.boilerWaterLevel >= settings.boilerVolume * 0.88;
    const requiredRest = Math.max(settings.restDuration, BARISTA_PREP_SECONDS);
    if (state.restTimer >= requiredRest && state.workflowPhase === "ready" && closeEnough) {
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
  const operationalReady = ready && state.workflowPhase === "ready";

  elements.clock.textContent = minutesSeconds(state.time);
  elements.modeLabel.textContent = state.mode;
  elements.readyLabel.textContent = state.brewActive
    ? "BREWING"
    : operationalReady
      ? "READY"
      : state.workflowPhase !== "ready"
        ? "PREP"
        : state.mode === "회복 중"
          ? "RECOVER"
          : "HEATING";
  elements.readyLabel.className = `mode-pill ${state.brewActive ? "brewing" : operationalReady ? "ready" : state.workflowPhase !== "ready" || state.mode === "회복 중" ? "recovering" : ""}`;
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
      : `연속작동 · 다음 샷까지 ${Math.max(0, Math.max(settings.restDuration, BARISTA_PREP_SECONDS) - state.restTimer).toFixed(0)}초`
    : state.brewActive
      ? "수동 추출"
      : state.workflowPhase === "ready" ? "대기" : "다음 샷 준비";

  elements.toggleRun.textContent = state.running ? "일시정지" : "재생";
  elements.toggleBrew.textContent = state.brewActive ? "샷 중지" : "샷 시작";
  elements.toggleBrew.classList.toggle("active", state.brewActive);
  audioSim.updateButton();

  const needleAngle = -112 + clamp(state.pressure / 12, 0, 1) * 224;
  elements.pressureNeedle.style.transform = `translate(-50%, -100%) rotate(${needleAngle}deg)`;

  const tempRatio = clamp((state.boilerTemp - 20) / 82, 0, 1);
  const hotHue = Math.round(lerp(190, 8, tempRatio));
  elements.boilerFill.style.height = `${clamp(levelRatio * 78, 40, 82)}%`;
  elements.boilerFill.style.background = `linear-gradient(180deg, hsl(${hotHue} 82% 68%), hsl(${Math.max(0, hotHue - 14)} 66% 44%))`;
  elements.heaterGlow.style.background = `rgba(177, 59, 46, ${0.15 + state.heaterDuty * 0.7})`;
  elements.heaterGlow.style.boxShadow = `0 0 ${Math.round(4 + state.heaterDuty * 30)}px rgba(177, 59, 46, ${state.heaterDuty * 0.72})`;
  elements.groupLight.style.background = operationalReady ? "#1d8f5b" : state.brewActive ? "#b13b2e" : "#b87510";
  elements.groupLight.style.boxShadow = operationalReady
    ? "0 0 14px rgba(29, 143, 91, 0.5)"
    : state.brewActive
      ? "0 0 16px rgba(177, 59, 46, 0.58)"
      : "0 0 14px rgba(184, 117, 16, 0.45)";
  elements.stream.classList.toggle("active", state.flow > 0.2);
  elements.pumpPulse.parentElement.classList.toggle("active", state.pressure > 0.3 || state.flow > 0.1);
  elements.espressoLevel.style.height = `${clamp(state.shotMass / 42, 0, 1) * 82}%`;
  const workflowLabels = {
    ready: "준비 완료",
    brew: "추출 중",
    knockout: "사용한 퍽 버리기",
    dosing: "새 원두 도징",
    tamping: "고르게 탬핑",
    return: "그룹헤드에 장착",
  };
  elements.prepStation.className = `prep-station phase-${state.workflowPhase}`;
  elements.workflowLabel.textContent = workflowLabels[state.workflowPhase];
  elements.machineVisual.classList.toggle("preparing", !["ready", "brew"].includes(state.workflowPhase));

  audioSim.update(state, settings);
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

elements.toggleSound.addEventListener("click", async () => {
  await audioSim.toggle();
});

elements.resetSim.addEventListener("click", () => {
  if (gameState.active) {
    gameState.active = false;
    gameState.status = "idle";
    gameState.results = [];
    gameState.runCycle = 0;
    gameState.runPayback = 0;
    gameState.lastMessage = "테스트가 초기화되었습니다.";
    controls.continuousMode.checked = false;
    setBuildControlsDisabled(false);
  }
  state = initialState();
  accumulator = 0;
  updateGameUI();
});

elements.challengeMode.addEventListener("click", () => setGameMode("challenge"));
elements.sandboxMode.addEventListener("click", () => setGameMode("sandbox"));
elements.runStage.addEventListener("click", startStageTest);
elements.nextStage.addEventListener("click", () => advanceStage());
elements.autoTuneStage.addEventListener("click", autoTuneStage);
elements.perfectShotPreset.addEventListener("click", applyPerfectShotPreset);

elements.helpDialog.addEventListener("click", (event) => {
  if (event.target === elements.helpDialog) elements.helpDialog.close();
});

controls.continuousMode.addEventListener("change", () => {
  if (controls.continuousMode.checked && !state.brewActive) {
    state.restTimer = Math.max(state.restTimer, Math.max(readSettings().restDuration, BARISTA_PREP_SECONDS));
  }
});

setupFactorControls();
updateControlLabels();
for (let i = 0; i < 8; i += 1) {
  simulateStep(0.05);
}
render();
requestAnimationFrame(animate);
