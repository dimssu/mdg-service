import * as React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

import { BrowserFrame } from '../components/BrowserFrame';
import { AudioTrack } from '../components/explainerChrome';
import { LandscapeShell, VIDEO_LANDSCAPE } from '../components/landscapeChrome';
import type { TutorialProps } from '../lib/calc';
import { activeScene } from '../lib/scene';
import { TUTORIAL_BY_ID } from '../narration';
import {
  AdminShell,
  DealerHeader,
  GenerateCard,
  ReportDetail,
  ReportHistory,
  Ring,
  RunFailure,
  ShareDialog,
  type AdminNavKey,
  type ReportHighlight,
} from '../screens/admin';
import { FONT_FAMILY } from '../theme';

/**
 * AdminCreditDodPortal — the hands-on admin walkthrough: generate → review →
 * share, driven through mocked admin-portal screens inside a browser frame.
 *
 * One `Screen` descriptor per narration step keeps the timeline and the pixels
 * in one readable table: which nav item, which tab, what the content column
 * shows, and which rectangle the ring pulses around. Ring coordinates are in
 * BrowserFrame content space (1440×620), measured against the mocked screens.
 */

const TUT = TUTORIAL_BY_ID['admin-credit-dod-portal'];

/** The browser is 1440 wide; the stage is 1920 minus padding and needs headroom. */
const FRAME_SCALE = 0.9;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: number;
}

interface Screen {
  url: string;
  nav: AdminNavKey;
  /** What fills the content column. */
  body:
    | { kind: 'dealers' }
    | { kind: 'tab'; mode: 'today' | 'backdated'; busy?: boolean; pressed?: boolean }
    | {
        kind: 'history';
        expanded?: boolean;
        shared?: boolean;
        highlight?: ReportHighlight;
      }
    | { kind: 'share' }
    | { kind: 'failure' };
  ring?: Rect;
  /** Pans the content column, as the real portal scrolls under a fixed shell. */
  scrollY?: number;
}

/**
 * Measured off a real render, in BrowserFrame content space (1440×620, i.e.
 * before FRAME_SCALE). Kept in one place so a layout tweak in `screens/admin` is
 * a single edit here, not a hunt through the switch.
 *
 * Highlights INSIDE the expanded report are not here — `ReportDetail` draws its
 * own ring from its `highlight` prop, so it stays correct when its layout moves.
 */
const RECT = {
  navDealers: { x: 11, y: 146, w: 194, h: 34 },
  tabCreditDod: { x: 936, y: 142, w: 100, h: 32 },
  generateNow: { x: 1278, y: 305, w: 130, h: 40 },
  modeTabs: { x: 249, y: 258, w: 210, h: 38, radius: 10 },
  quota: { x: 1214, y: 360, w: 200, h: 28 },
  historyTop: { x: 238, y: 494, w: 1184, h: 40 },
} as const;

const SCREENS: Record<string, Screen> = {
  intro: {
    url: 'admin.mdgservices.in/dealers',
    nav: 'Dealers',
    body: { kind: 'dealers' },
  },
  'open-tab': {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'tab', mode: 'today' },
    ring: RECT.tabCreditDod,
  },
  generate: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'tab', mode: 'today' },
    ring: RECT.generateNow,
  },
  quota: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'tab', mode: 'today' },
    ring: RECT.quota,
  },
  wait: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'tab', mode: 'today', busy: true, pressed: true },
  },
  history: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    // Expanded, because the real tab auto-opens the newest report and the
    // narration says so ("सबसे नई अपने आप खुली रहती है").
    body: { kind: 'history', expanded: true },
    ring: RECT.historyTop,
  },
  review: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'history', expanded: true, highlight: 'reconcile' },
    scrollY: 250,
  },
  sources: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'history', expanded: true, highlight: 'sources' },
    scrollY: 305,
  },
  share: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'share' },
    scrollY: 305,
  },
  shared: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'history', expanded: true, shared: true, highlight: 'none' },
    scrollY: 305,
  },
  failed: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=runs',
    nav: 'Dealers',
    body: { kind: 'failure' },
  },
  recap: {
    url: 'admin.mdgservices.in/dealers/5e01?tab=credit-dod',
    nav: 'Dealers',
    body: { kind: 'history', expanded: false, shared: true },
  },
};

/** A stand-in dealers list for the opening scene. */
function DealersList() {
  const rows = [
    { name: 'SA Fuel Point', code: '5E01', city: 'Sehore', status: 'ACTIVE' },
    { name: 'Sahu Filling Station', code: '5E07', city: 'Ashta', status: 'ACTIVE' },
    { name: 'Highway Fuels', code: '5F12', city: 'Ichhawar', status: 'ONBOARDING' },
  ];
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e7e5e4',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          padding: '10px 16px',
          background: '#f5f5f4',
          borderBottom: '1px solid #e7e5e4',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#57534e',
        }}
      >
        <span style={{ flex: 2 }}>Dealer</span>
        <span style={{ flex: 1 }}>Code</span>
        <span style={{ flex: 1 }}>City</span>
        <span style={{ flex: 1 }}>Status</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.code}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            fontSize: 16,
            borderBottom: i === rows.length - 1 ? 'none' : '1px solid #e7e5e4',
            background: i === 0 ? '#f5f5f4' : '#ffffff',
          }}
        >
          <span style={{ flex: 2, fontWeight: 600, color: '#0f172a' }}>{r.name}</span>
          <span style={{ flex: 1, color: '#57534e' }}>{r.code}</span>
          <span style={{ flex: 1, color: '#57534e' }}>{r.city}</span>
          <span style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 999,
                padding: '3px 10px',
                background: r.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
                color: r.status === 'ACTIVE' ? '#15803d' : '#92400e',
              }}
            >
              {r.status}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function bodyFor(screen: Screen): React.ReactNode {
  const { body } = screen;
  switch (body.kind) {
    case 'dealers':
      return (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Dealers</div>
          <DealersList />
        </div>
      );
    case 'tab':
      return (
        <div style={{ display: 'grid', gap: 14 }}>
          <DealerHeader activeTab="Credit & DOD" />
          <GenerateCard mode={body.mode} busy={body.busy} pressed={body.pressed} />
          <ReportHistory />
        </div>
      );
    case 'history':
      // GenerateCard stays on screen: the real tab always shows it above Report
      // history, and dropping it would both jump-cut away from the previous
      // scene and shift the table up, stranding the ring over empty background.
      return (
        <div style={{ display: 'grid', gap: 14 }}>
          <DealerHeader activeTab="Credit & DOD" />
          <GenerateCard mode="today" />
          <ReportHistory expanded={body.expanded} shared={body.shared}>
            <ReportDetail highlight={body.highlight} shared={body.shared} />
          </ReportHistory>
        </div>
      );
    case 'share':
      return (
        <>
          <div style={{ display: 'grid', gap: 14 }}>
            <DealerHeader activeTab="Credit & DOD" />
            <GenerateCard mode="today" />
            <ReportHistory expanded>
              <ReportDetail highlight="share" />
            </ReportHistory>
          </div>
          <ShareDialog />
        </>
      );
    case 'failure':
    default:
      return (
        <div style={{ display: 'grid', gap: 14 }}>
          <DealerHeader activeTab="Run history" />
          <RunFailure />
        </div>
      );
  }
}

export function AdminCreditDodPortalVideo({ sceneFrames, hasAudio }: TutorialProps) {
  const frame = useCurrentFrame();
  const frames =
    sceneFrames.length === TUT.scenes.length
      ? sceneFrames
      : TUT.scenes.map((s) => Math.round(s.estSeconds * VIDEO_LANDSCAPE.fps));

  const { index, local, length } = activeScene(frame, frames);
  const scene = TUT.scenes[index];
  const screen = SCREENS[scene.step] ?? SCREENS.intro;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_FAMILY }}>
      <LandscapeShell
        title={TUT.title}
        subtitle={TUT.subtitle}
        index={index}
        count={TUT.scenes.length}
        progress={length ? local / length : 0}
        caption={scene.text}
        local={local}
      >
        <BrowserFrame url={screen.url} scale={FRAME_SCALE}>
          <AdminShell nav={screen.nav} scrollY={screen.scrollY}>
            {bodyFor(screen)}
          </AdminShell>
          {screen.ring ? (
            <Ring
              x={screen.ring.x}
              y={screen.ring.y}
              w={screen.ring.w}
              h={screen.ring.h}
              radius={screen.ring.radius}
              local={local}
            />
          ) : null}
        </BrowserFrame>
      </LandscapeShell>
      <AudioTrack tutorial={TUT} frames={frames} hasAudio={hasAudio} />
    </AbsoluteFill>
  );
}
