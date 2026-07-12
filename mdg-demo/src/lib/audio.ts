/** Public path (for `staticFile`) of a scene's generated voiceover. */
export function audioPath(tutorialId: string, sceneId: string): string {
  return `audio/${tutorialId}/${sceneId}.mp3`;
}
