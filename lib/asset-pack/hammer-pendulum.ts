import type {
  ViewerMarker,
  ViewerPose,
} from "@/lib/asset-pack/types";

export const HAMMER_MASS_KG = 0.654;
export const HAMMER_COM_STATION_M = 0.2388560182163568;
export const HAMMER_INERTIA_AT_COM_KG_M2 = 0.005512375674135533;
export const GRAVITY_M_S2 = 9.81;
export const HAMMER_DEFAULT_PIVOT_M = 0.08;
export const HAMMER_DEFAULT_RELEASE_DEG = 30;
export const HAMMER_NEUTRAL_DISTANCE_M = 0.00025;

const HAMMER_COM_BROWSER: [number, number, number] = [
  HAMMER_COM_STATION_M,
  0.010498220113394668,
  -0.00030231248636543073,
];
const PIVOT_ANCHOR: [number, number, number] = [0.165, 0.28, 0];

export type PendulumState = {
  thetaRad: number;
  omegaRadS: number;
};

export type PendulumProperties = {
  distanceToComM: number;
  inertiaAtPivotKgM2: number;
  releaseTorqueNm: number;
  periodS: number | null;
  neutral: boolean;
};

function getPivotLocal(pivotStationM: number): [number, number, number] {
  return Math.abs(pivotStationM - HAMMER_COM_STATION_M) <
    HAMMER_NEUTRAL_DISTANCE_M
    ? [...HAMMER_COM_BROWSER]
    : [pivotStationM, 0, 0];
}

function getPlanarComOffset(pivotStationM: number) {
  const pivot = getPivotLocal(pivotStationM);
  return {
    deltaX: HAMMER_COM_BROWSER[0] - pivot[0],
    deltaY: HAMMER_COM_BROWSER[1] - pivot[1],
    pivot,
  };
}

function completeEllipticIntegralFirstKind(modulus: number) {
  let arithmetic = 1;
  let geometric = Math.sqrt(Math.max(0, 1 - modulus * modulus));
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const nextArithmetic = (arithmetic + geometric) / 2;
    const nextGeometric = Math.sqrt(arithmetic * geometric);
    arithmetic = nextArithmetic;
    geometric = nextGeometric;
    if (Math.abs(arithmetic - geometric) < 1e-12) break;
  }
  return Math.PI / (2 * arithmetic);
}

export function getPendulumProperties(
  pivotStationM: number,
  releaseAngleRad: number,
): PendulumProperties {
  const offset = getPlanarComOffset(pivotStationM);
  const distanceToComM = Math.hypot(offset.deltaX, offset.deltaY);
  const inertiaAtPivotKgM2 =
    HAMMER_INERTIA_AT_COM_KG_M2 +
    HAMMER_MASS_KG * distanceToComM * distanceToComM;
  const neutral = distanceToComM < HAMMER_NEUTRAL_DISTANCE_M;
  const releaseTorqueNm =
    HAMMER_MASS_KG *
    GRAVITY_M_S2 *
    distanceToComM *
    Math.sin(Math.abs(releaseAngleRad));
  const modulus = Math.sin(Math.min(Math.abs(releaseAngleRad), Math.PI - 1e-6) / 2);
  const periodS = neutral
    ? null
    : 4 *
      Math.sqrt(
        inertiaAtPivotKgM2 /
          (HAMMER_MASS_KG * GRAVITY_M_S2 * distanceToComM),
      ) *
      completeEllipticIntegralFirstKind(modulus);
  return {
    distanceToComM,
    inertiaAtPivotKgM2,
    releaseTorqueNm,
    periodS,
    neutral,
  };
}

function angularAcceleration(thetaRad: number, pivotStationM: number) {
  const properties = getPendulumProperties(pivotStationM, thetaRad);
  if (properties.neutral) return 0;
  return (
    (-HAMMER_MASS_KG *
      GRAVITY_M_S2 *
      properties.distanceToComM *
      Math.sin(thetaRad)) /
    properties.inertiaAtPivotKgM2
  );
}

export function integratePendulumRk4(
  state: PendulumState,
  pivotStationM: number,
  timestepS: number,
): PendulumState {
  const derivative = (thetaRad: number, omegaRadS: number) => ({
    thetaRad: omegaRadS,
    omegaRadS: angularAcceleration(thetaRad, pivotStationM),
  });
  const first = derivative(state.thetaRad, state.omegaRadS);
  const second = derivative(
    state.thetaRad + (first.thetaRad * timestepS) / 2,
    state.omegaRadS + (first.omegaRadS * timestepS) / 2,
  );
  const third = derivative(
    state.thetaRad + (second.thetaRad * timestepS) / 2,
    state.omegaRadS + (second.omegaRadS * timestepS) / 2,
  );
  const fourth = derivative(
    state.thetaRad + third.thetaRad * timestepS,
    state.omegaRadS + third.omegaRadS * timestepS,
  );
  return {
    thetaRad:
      state.thetaRad +
      (timestepS / 6) *
        (first.thetaRad +
          2 * second.thetaRad +
          2 * third.thetaRad +
          fourth.thetaRad),
    omegaRadS:
      state.omegaRadS +
      (timestepS / 6) *
        (first.omegaRadS +
          2 * second.omegaRadS +
          2 * third.omegaRadS +
          fourth.omegaRadS),
  };
}

export function getPendulumEnergyJ(
  state: PendulumState,
  pivotStationM: number,
) {
  const properties = getPendulumProperties(pivotStationM, state.thetaRad);
  return (
    0.5 *
      properties.inertiaAtPivotKgM2 *
      state.omegaRadS *
      state.omegaRadS +
    HAMMER_MASS_KG *
      GRAVITY_M_S2 *
      properties.distanceToComM *
      (1 - Math.cos(state.thetaRad))
  );
}

export function getHammerPendulumView(
  thetaRad: number,
  pivotStationM: number,
): { pose: ViewerPose; markers: ViewerMarker[] } {
  const offset = getPlanarComOffset(pivotStationM);
  const localComDirection = Math.atan2(offset.deltaY, offset.deltaX);
  const equilibriumRotation = -Math.PI / 2 - localComDirection;
  const rotation = equilibriumRotation + thetaRad;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const rotatedPivotX =
    cosine * offset.pivot[0] - sine * offset.pivot[1];
  const rotatedPivotY =
    sine * offset.pivot[0] + cosine * offset.pivot[1];
  const position: [number, number, number] = [
    PIVOT_ANCHOR[0] - rotatedPivotX,
    PIVOT_ANCHOR[1] - rotatedPivotY,
    PIVOT_ANCHOR[2] - offset.pivot[2],
  ];
  const comX =
    position[0] +
    cosine * HAMMER_COM_BROWSER[0] -
    sine * HAMMER_COM_BROWSER[1];
  const comY =
    position[1] +
    sine * HAMMER_COM_BROWSER[0] +
    cosine * HAMMER_COM_BROWSER[1];
  const comZ = position[2] + HAMMER_COM_BROWSER[2];
  return {
    pose: {
      position,
      quaternion: [0, 0, Math.sin(rotation / 2), Math.cos(rotation / 2)],
    },
    markers: [
      {
        color: "#ffbd59",
        kind: "pivot",
        label: `Pivot ${pivotStationM.toFixed(3)} m`,
        position: PIVOT_ANCHOR,
      },
      {
        color: "#ef6f91",
        kind: "com",
        label: "Center of mass 0.239 m",
        position: [comX, comY, comZ],
      },
    ],
  };
}
