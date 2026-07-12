/** Cumulative start frame of each scene. */
export function sceneOffsets(sceneFrames: number[]): number[] {
  const offsets: number[] = [];
  let acc = 0;
  for (const f of sceneFrames) {
    offsets.push(acc);
    acc += f;
  }
  return offsets;
}

export interface ActiveScene {
  index: number;
  /** Frame within the current scene (0-based). */
  local: number;
  /** Length of the current scene in frames. */
  length: number;
}

/** Which scene is playing at `frame`, and how far into it we are. */
export function activeScene(frame: number, sceneFrames: number[]): ActiveScene {
  let acc = 0;
  for (let i = 0; i < sceneFrames.length; i++) {
    if (frame < acc + sceneFrames[i]) {
      return { index: i, local: frame - acc, length: sceneFrames[i] };
    }
    acc += sceneFrames[i];
  }
  const last = Math.max(0, sceneFrames.length - 1);
  return { index: last, local: (sceneFrames[last] ?? 1) - 1, length: sceneFrames[last] ?? 1 };
}
