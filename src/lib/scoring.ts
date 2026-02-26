export interface PodiumPrediction {
  pos1: string;
  pos2: string;
  pos3: string;
}

export function calculateScore(
  prediction: PodiumPrediction,
  result: PodiumPrediction
): { total: number; pos1: number; pos2: number; pos3: number } {
  const predRiders = [prediction.pos1, prediction.pos2, prediction.pos3];
  const resRiders = [result.pos1, result.pos2, result.pos3];

  const posPoints = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    if (predRiders[i] === resRiders[i]) {
      posPoints[i] = 2; // Exact position match
    } else if (resRiders.includes(predRiders[i])) {
      posPoints[i] = 1; // Rider on podium but wrong position
    }
  }

  return {
    total: posPoints[0] + posPoints[1] + posPoints[2],
    pos1: posPoints[0],
    pos2: posPoints[1],
    pos3: posPoints[2],
  };
}
