import * as React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile } from 'remotion';

import { audioPath } from '../lib/audio';
import { sceneOffsets } from '../lib/scene';

import {
  brand,
  FILM,
  FILM_BG_DARK,
  FONT_DEVA,
  FONT_DISPLAY,
  FONT_SANS,
  LAYOUT,
  STAGE_H,
} from './brand';
import { BROLL_BY_ID, brollPath } from './broll';

/**
 * The frame every scene of the marketing film is drawn inside.
 *
 * The tutorials use a light frame because they are showing a light app. This
 * film inverts it: a deep navy sheet with the artwork floating on it as light
 * cards. Two reasons. A dealer watches this outdoors on a phone, and white text
 * on navy survives sunlight and a low screen brightness far better than the
 * reverse. And the brochure the marketing person hands him is navy and gold, so
 * the film and the paper read as one thing.
 */

/* ── B-roll ──────────────────────────────────────────────────────────────── */

/**
 * The photograph behind a scene, and the camera move over it.
 *
 * THE PROBLEM THIS SOLVES. Without it the film is fifteen white cards on a flat
 * navy field — legible, correct, and dead still, with a third of every frame
 * empty. Nothing on screen moves except a caption fading in. A photograph that
 * is always drifting, even slightly, is the difference between a slide and a
 * film, and it costs nothing at render time.
 *
 * THE MOVE. A slow push from 1.06 to 1.16 over the whole scene, drifting toward
 * the shot's own focus point, with the direction flipped on alternate scenes so
 * two neighbours never move the same way. It is deliberately slower than feels
 * right in the Studio: at phone size a move that reads as gentle on a laptop
 * reads as a lurch.
 *
 * THE SCRIM. Four stops, not one flat wash. The top has to hold the brand mark,
 * the bottom has to hold two lines of white caption, and the middle wants to be
 * as light as it can get away with — that band is the only place the photograph
 * is actually visible, because an opaque white card sits over most of it.
 * `weight` lets a scene lighten the whole thing when its stage is small enough
 * to let the picture carry the frame.
 */
export function BRollLayer({
  id,
  local,
  length,
  index,
  weight = 1,
}: {
  id: string;
  local: number;
  length: number;
  index: number;
  weight?: number;
}) {
  const shot = BROLL_BY_ID[id];
  if (!shot) return null;

  const t = length > 0 ? Math.min(1, Math.max(0, local / length)) : 0;
  /* Alternate the push direction. Two consecutive scenes that both zoom in the
     same way read as one long shot, which flattens the cut between them. */
  const inward = index % 2 === 0;
  const scale = inward ? 1.06 + 0.1 * t : 1.16 - 0.1 * t;

  /* Drift toward the focus point, in percent of frame. Small — the subject is
     already framed; this is a breath, not a pan. */
  const dx = (shot.focus.x - 0.5) * 5 * (inward ? t : 1 - t);
  const dy = (shot.focus.y - 0.5) * 5 * (inward ? t : 1 - t);

  /* Cross-fade at the seams so scenes dissolve rather than cut. The film has
     fifteen of them; hard cuts every six seconds would fight the narration. */
  const fadeIn = interpolate(local, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(local, [length - 12, length], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const w = Math.max(0, Math.min(1, weight));

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={staticFile(brollPath(id))}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) translate(${dx}%, ${dy}%)`,
          }}
        />
      </AbsoluteFill>

      {/* The scrim. Stops chosen against the layout: header, stage, caption. */}
      <AbsoluteFill
        style={{
          background:
            `linear-gradient(180deg,` +
            ` rgba(16,17,51,${0.9 * w}) 0%,` +
            ` rgba(16,17,51,${0.62 * w}) 14%,` +
            ` rgba(16,17,51,${0.44 * w}) 38%,` +
            ` rgba(16,17,51,${0.6 * w}) 74%,` +
            ` rgba(16,17,51,${0.94 * w}) 88%,` +
            ` rgba(16,17,51,${0.97 * w}) 100%)`,
        }}
      />
      {/* A dark pool over the stage.
          The vertical gradient alone is not enough on a picture-led beat: a
          white headline set straight on the photograph lands on whatever the
          photograph happens to be doing there, and a bright sky wins. This pool
          is centred on the stage and fades out well before the frame edge, so
          text gets something to sit on while the picture keeps its corners.
          It does NOT scale with `weight` — lightening the wash is the point of
          those scenes, and the text still has to be readable when it is. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(62% 34% at 50% 46%, rgba(16,17,51,.58) 0%, rgba(16,17,51,.22) 62%, rgba(16,17,51,0) 100%)',
        }}
      />

      {/* A touch of the brand navy over the whole thing, so a warm photograph
          still belongs to a navy-and-gold film. */}
      <AbsoluteFill
        style={{ background: brand.navy900, opacity: 0.24 * w, mixBlendMode: 'color' }}
      />
    </AbsoluteFill>
  );
}

/* ── Progress: how much of the dealer's 90 seconds is left ───────────────── */

export function FilmProgress({
  index,
  count,
  progress,
}: {
  index: number;
  count: number;
  progress: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.progressTop,
        left: 0,
        width: FILM.width,
        display: 'flex',
        gap: 5,
        padding: '0 64px',
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const fill = i < index ? 1 : i === index ? progress : 0;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              background: 'rgba(255,255,255,.14)',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${fill * 100}%`, height: '100%', background: brand.gold400 }} />
          </div>
        );
      })}
    </div>
  );
}

/* ── The brand lockup ────────────────────────────────────────────────────── */

/**
 * "Dealer's कवच" — the product name.
 *
 * The कवच is set in the brand's Devanagari face and never translated, exactly
 * as on the website: it is the product's name, not a word in a sentence, and it
 * reads the same to a Hindi and an English viewer.
 */
export function KavachMark({
  size = 30,
  color = '#FFFFFF',
  accent = brand.gold400,
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  return (
    <span style={{ fontFamily: FONT_DISPLAY, fontSize: size, fontWeight: 600, color }}>
      Dealer&rsquo;s{' '}
      <span style={{ fontFamily: FONT_DEVA, color: accent, fontWeight: 400 }}>कवच</span>
    </span>
  );
}

export function FilmHeader() {
  return (
    <div
      style={{
        position: 'absolute',
        top: LAYOUT.headerTop,
        left: 0,
        width: FILM.width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <img
        src={staticFile('brand/logo-mark-white.png')}
        alt=""
        style={{ height: 52, width: 'auto', opacity: 0.96 }}
      />
      <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,.22)' }} />
      <KavachMark size={30} />
    </div>
  );
}

/* ── The stage ───────────────────────────────────────────────────────────── */

export function Stage({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: LAYOUT.stageTop,
        width: FILM.width,
        height: STAGE_H,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: padded ? '0 64px' : 0,
      }}
    >
      {children}
    </div>
  );
}

/* ── The caption ─────────────────────────────────────────────────────────── */

/**
 * Sound-off viewers are the majority on a forwarded video, so the caption is
 * the narration verbatim rather than a summary of it. It rises 14px as it fades
 * in — enough that the eye notices a new line has arrived without the movement
 * itself competing with the stage.
 */
export function FilmCaption({
  text,
  local,
  lang,
}: {
  text: string;
  local: number;
  lang: 'hi' | 'en';
}) {
  const opacity = interpolate(local, [0, 9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ty = interpolate(local, [0, 9], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: LAYOUT.captionTop,
        width: FILM.width,
        height: FILM.height - LAYOUT.captionTop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 76px',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${ty}px)`,
          maxWidth: 920,
          textAlign: 'center',
          /* Devanagari needs a touch more line-height and a touch less size to
             sit in the same two-line band as the Latin caption. */
          fontFamily: FONT_SANS,
          fontSize: lang === 'hi' ? 43 : 45,
          lineHeight: lang === 'hi' ? 1.46 : 1.36,
          fontWeight: 600,
          letterSpacing: lang === 'hi' ? 0 : '-0.01em',
          color: '#FFFFFF',
          textWrap: 'balance',
          textShadow: '0 2px 16px rgba(16,17,51,.7)',
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ── The whole frame ─────────────────────────────────────────────────────── */

export function FilmFrame({
  caption,
  captionLocal,
  index,
  count,
  progress,
  lang,
  showHeader = true,
  broll,
  brollWeight = 1,
  sceneLength,
  children,
}: {
  caption: string;
  captionLocal: number;
  index: number;
  count: number;
  progress: number;
  lang: 'hi' | 'en';
  showHeader?: boolean;
  /** Id of the photograph behind this scene, from `broll.ts`. */
  broll?: string;
  /** 0–1. Lower lets more of the photograph through; used on picture-led beats. */
  brollWeight?: number;
  /** Frames in this scene — the camera move and the cross-fade need it. */
  sceneLength: number;
  children: React.ReactNode;
}) {
  /**
   * The stage's own entrance, and a slow counter-drift.
   *
   * The cards rise 22px and settle, then keep drifting upward by a few pixels
   * for the rest of the scene — against the B-roll's push, which is what makes
   * the two layers read as separate planes rather than one flat image. It is
   * small enough that nobody consciously sees it and large enough that the
   * frame never looks frozen.
   */
  const enter = interpolate(captionLocal, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = interpolate(captionLocal, [0, Math.max(1, sceneLength)], [0, -10], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const leave = interpolate(captionLocal, [sceneLength - 10, sceneLength], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT_SANS, background: FILM_BG_DARK }}>
      {broll ? (
        <BRollLayer
          id={broll}
          local={captionLocal}
          length={sceneLength}
          index={index}
          weight={brollWeight}
        />
      ) : (
        /* A soft gold bloom, for any scene with no photograph behind it. It is
           what stops a flat navy rectangle from reading as a slide deck. */
        <AbsoluteFill
          style={{
            background: `radial-gradient(46% 26% at 50% 46%, rgba(245,165,36,.16) 0%, rgba(245,165,36,0) 70%)`,
          }}
        />
      )}

      <FilmProgress index={index} count={count} progress={progress} />
      {showHeader ? <FilmHeader /> : null}

      <div
        style={{
          opacity: Math.min(enter, leave),
          transform: `translateY(${(1 - enter) * 22 + drift}px)`,
        }}
      >
        <Stage>{children}</Stage>
      </div>

      <FilmCaption text={caption} local={captionLocal} lang={lang} />
    </AbsoluteFill>
  );
}

/* ── Voiceover ───────────────────────────────────────────────────────────── */

/**
 * One `<Audio>` per scene, placed at the scene's own offset.
 *
 * Identical in shape to the tutorials' version, but it takes the tutorial id as
 * an argument because the film has two of them — `marketing-hi` and
 * `marketing-en` — reading the same scene ids out of different folders.
 */
export function FilmVoiceover({
  tutorialId,
  sceneIds,
  sceneFrames,
  hasAudio,
}: {
  tutorialId: string;
  sceneIds: string[];
  sceneFrames: number[];
  hasAudio: boolean[];
}) {
  const offsets = sceneOffsets(sceneFrames);
  return (
    <>
      {sceneIds.map((id, i) =>
        hasAudio[i] ? (
          <Sequence key={id} from={offsets[i]} durationInFrames={sceneFrames[i]}>
            <Audio src={staticFile(audioPath(tutorialId, id))} />
          </Sequence>
        ) : null,
      )}
    </>
  );
}
