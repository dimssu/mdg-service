import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadDevanagari } from '@remotion/google-fonts/NotoSansDevanagari';
import * as React from 'react';
import { Composition } from 'remotion';

import { makeCalculateMetadata, type TutorialProps } from './lib/calc';
import { TUTORIAL_BY_ID } from './narration';
import { VIDEO } from './theme';
import { AddWarriorVideo } from './videos/AddWarriorVideo';
import { CreditMonitorPhotoVideo } from './videos/CreditMonitorPhotoVideo';
import { CreditMonitorVideo } from './videos/CreditMonitorVideo';
import { GivePointsVideo } from './videos/GivePointsVideo';
import { LoginVideo } from './videos/LoginVideo';
import { PointsSystemVideo } from './videos/PointsSystemVideo';
import { SplitPointsVideo } from './videos/SplitPointsVideo';
import { SubmitPointsVideo } from './videos/SubmitPointsVideo';

// Load Latin + Devanagari so Hindi renders correctly in headless Chromium.
loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] });
loadDevanagari('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['devanagari', 'latin'],
});

const defaults = (tutorialId: string): TutorialProps => ({
  tutorialId,
  sceneFrames: [],
  hasAudio: [],
});

export function RemotionRoot() {
  return (
    <>
      <Composition
        id={TUTORIAL_BY_ID.login.compositionId}
        component={LoginVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('login')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID.login)}
      />
      <Composition
        id={TUTORIAL_BY_ID['add-warrior'].compositionId}
        component={AddWarriorVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('add-warrior')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID['add-warrior'])}
      />
      <Composition
        id={TUTORIAL_BY_ID['give-points'].compositionId}
        component={GivePointsVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('give-points')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID['give-points'])}
      />
      <Composition
        id={TUTORIAL_BY_ID['split-points'].compositionId}
        component={SplitPointsVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('split-points')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID['split-points'])}
      />
      <Composition
        id={TUTORIAL_BY_ID['submit-points'].compositionId}
        component={SubmitPointsVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('submit-points')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID['submit-points'])}
      />
      <Composition
        id={TUTORIAL_BY_ID['points-system'].compositionId}
        component={PointsSystemVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('points-system')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID['points-system'])}
      />
      {/* CREDIT & DOD MONITORING — two variants sharing one narration/voiceover:
          the clean recreation (CreditMonitor) and the marked-up-photo version
          (CreditMonitorPhoto). */}
      <Composition
        id={TUTORIAL_BY_ID['credit-monitor'].compositionId}
        component={CreditMonitorVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('credit-monitor')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID['credit-monitor'])}
      />
      <Composition
        id="CreditMonitorPhoto"
        component={CreditMonitorPhotoVideo}
        durationInFrames={1}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaults('credit-monitor')}
        calculateMetadata={makeCalculateMetadata(TUTORIAL_BY_ID['credit-monitor'])}
      />
    </>
  );
}
