"""
Finds the generator's four-point sparkle star in a Flow clip, follows it frame
by frame, and paints it out. Writes a cleaned copy; the cutter prefers it.

    python unsparkle.py clips/S09.mp4 clips-clean/S09.mp4 [--debug out.png]
    python unsparkle.py clips/S50.mp4 clips-clean/S50.mp4 --plate 540 1110 720 1280

--sweep: a second pass over every frame for the REAL star shape anywhere in
the lower-right, painting only matches that recur in place for several frames.
For smooth backgrounds where the star comes back after the follower lets go
(S39, S42, S53); on sand or grit the texture scores too close to a star.

--visible x0 y0 x1 y1: the part of the frame the cutter keeps (it crops the
bottom-right corner off every Flow shot). Only stars that reach into it are
painted, and they are filled by copying nearby texture (clone), not by
smoothing — a smooth fill on sand or brick shows as a star-shaped blur.

--extras: also paint Veo's own animated sparkles (S50 only — elsewhere the
same shape test picks up watch glints).

--plate x0 y0 x1 y1: for a LOCKED shot where Veo turned the star into its own
glowing sparkles (S50), the box is replaced in every frame by the same box from
the cleaned first frame, feathered at the edges. Only for a box nothing moves in.

Why this and not a fixed box: every Nano Banana still carries the star at the
bottom right and Veo keeps it — but not in one place. A push-in walks it across
the frame, a different still puts it elsewhere, and in S50 Veo turned it into a
glowing gold star with smaller sparkles round it. A fixed delogo box missed
seven shots in the first full cut, and a round inpaint patch left smudges on
textured ground.

How:
 1. Find the star in the first frames, where it sits exactly as the still had
    it: the bottom-right region is high-passed and matched against synthetic
    four-point star shapes (concave sides) at several sizes.
 2. Cut the star's real appearance out of that frame and FOLLOW it: each next
    frame is searched only near the last position, with that real template.
    A glint on a watch or a chrome chair base is never picked up, because
    nothing looks for it.
 3. Mask only the star's own pixels — the ones clearly brighter than the local
    background, connected to its centre — grown by a few pixels, and inpaint.
    A small mask on grit or wood leaves no visible patch.
 4. Extra sparkles (S50) are caught by a second, stricter synthetic pass that
    only accepts shapes that stay put for many frames.

Needs OpenCV (pip install opencv-python-headless numpy) and ffmpeg.
"""
import subprocess
import sys

import cv2
import numpy as np

SIZES = [12, 15, 18, 22, 27, 33, 40, 50, 62, 76]


def star(d):
    r = d / 2
    y, x = np.mgrid[-r:r + 1, -r:r + 1] / max(r, 1)
    m = (np.abs(x) ** (2 / 3) + np.abs(y) ** (2 / 3)) <= 1
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), max(d / 40, 0.6))


TEMPLATES = [(d, (star(d) - cv2.GaussianBlur(star(d), (0, 0), d / 5)).astype(np.float32)) for d in SIZES]


def hp(gray):
    g = gray.astype(np.float32)
    return g - cv2.GaussianBlur(g, (0, 0), 6)


REAL = cv2.imread(__file__.rsplit('/', 1)[0] + '/star-template.png', cv2.IMREAD_GRAYSCALE) \
    if '/' in __file__ else cv2.imread('star-template.png', cv2.IMREAD_GRAYSCALE)


def find_real_star(gray, W, H):
    """Best match of the real star, at sizes 0.45x-1.7x, in the bottom-right corner."""
    x0, y0 = int(W * 0.5), int(H * 0.68)
    region = hp(gray)[y0:, x0:].copy()
    region[-45:, -70:] = 0            # the "Veo" word
    best = (0, 0, 0, 0)
    for k in (0.45, 0.55, 0.65, 0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.7):
        t = cv2.resize(REAL, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
        th = hp(t)
        if th.shape[0] >= region.shape[0] or th.shape[1] >= region.shape[1]:
            continue
        res = cv2.matchTemplate(region, th, cv2.TM_CCOEFF_NORMED)
        _, sc, _, loc = cv2.minMaxLoc(res)
        if sc > best[0]:
            best = (sc, x0 + loc[0] + th.shape[1] // 2, y0 + loc[1] + th.shape[0] // 2, int(44 * k))
    return best


def synthetic_peaks(gray, x0, y0, x1, y1, thresh):
    """Star-shaped bright peaks inside a region, strongest first, one per place."""
    h = hp(gray)[y0:y1, x0:x1]
    found = []
    for d, t in TEMPLATES:
        if t.shape[0] >= h.shape[0] or t.shape[1] >= h.shape[1]:
            continue
        res = cv2.matchTemplate(h, t, cv2.TM_CCOEFF_NORMED)
        peaks = (res >= thresh) & (res == cv2.dilate(res, np.ones((d, d), np.uint8)))
        for y, x in zip(*np.nonzero(peaks)):
            cx, cy = x0 + x + t.shape[1] // 2, y0 + y + t.shape[0] // 2
            # prefer the size that fits: penalise templates much larger than the blob
            found.append((float(res[y, x]) - d / 400, cx, cy, d))
    found.sort(reverse=True)
    keep = []
    for s, cx, cy, d in found:
        if all((cx - k[1]) ** 2 + (cy - k[2]) ** 2 > (max(d, k[3]) * 0.7) ** 2 for k in keep):
            keep.append((s, cx, cy, d))
    return keep


def measure(gray, cx, cy, d):
    """The star's real width: the bright blob round the centre, not the template size."""
    H, W = gray.shape
    r = 48
    x0, y0, x1, y1 = max(cx - r, 0), max(cy - r, 0), min(cx + r + 1, W), min(cy + r + 1, H)
    patch = gray[y0:y1, x0:x1].astype(np.float32)
    lift = patch - cv2.medianBlur(gray[y0:y1, x0:x1], 41).astype(np.float32)
    near = lift[max(cy - y0 - 6, 0):cy - y0 + 7, max(cx - x0 - 6, 0):cx - x0 + 7]
    if not near.size or near.max() < 8:
        return d
    m = (lift > near.max() * 0.45).astype(np.uint8)
    n, lab = cv2.connectedComponents(m)
    c = lab[cy - y0, cx - x0] or lab[max(cy - y0 - 6, 0):cy - y0 + 7, max(cx - x0 - 6, 0):cx - x0 + 7].max()
    if not c:
        return d
    ys, xs = np.nonzero(lab == c)
    w = max(xs.max() - xs.min(), ys.max() - ys.min()) + 4
    return int(min(max(w, 14), 90)) if w < 2.2 * d + 20 else d


def star_mask(gray, cx, cy, d, grow=3, reach=0.8):
    """The star's own pixels: brighter than the local background and connected to its centre."""
    H, W = gray.shape
    r = int(d * 0.9) + 6
    x0, y0, x1, y1 = max(cx - r, 0), max(cy - r, 0), min(cx + r + 1, W), min(cy + r + 1, H)
    patch = gray[y0:y1, x0:x1].astype(np.float32)
    bg = cv2.medianBlur(gray[y0:y1, x0:x1], 2 * (r // 2) + 1 if r // 2 >= 1 else 3).astype(np.float32)
    lift = patch - bg
    m = (lift > max(6.0, np.percentile(lift, 97) * 0.35)).astype(np.uint8)
    n, lab = cv2.connectedComponents(m)
    c = lab[min(cy - y0, lab.shape[0] - 1), min(cx - x0, lab.shape[1] - 1)]
    if c == 0:
        # centre pixel itself not lifted: take the component nearest the centre
        ys, xs = np.nonzero(lab)
        if not len(ys):
            return None
        k = np.argmin((ys - (cy - y0)) ** 2 + (xs - (cx - x0)) ** 2)
        c = lab[ys[k], xs[k]]
    comp = (lab == c).astype(np.uint8) * 255
    if comp.sum() / 255 > (d * 1.2) ** 2:      # leaked into a bright surface: fall back to the shape
        comp = np.zeros_like(comp)
        s = (star(d) > 0.25).astype(np.uint8) * 255
        sy, sx = s.shape
        oy, ox = cy - y0 - sy // 2, cx - x0 - sx // 2
        comp[max(oy, 0):oy + sy, max(ox, 0):ox + sx] = s[max(-oy, 0):, max(-ox, 0):][:comp.shape[0] - max(oy, 0), :comp.shape[1] - max(ox, 0)]
    # the star's own shape at its measured size, always — on bright sand the
    # brightness test alone finds nothing (S23)
    shape = np.zeros_like(comp)
    sd = int(d * 1.25)
    st = (star(sd) > 0.2).astype(np.uint8) * 255
    sy, sx = st.shape
    oy, ox = cy - y0 - sy // 2, cx - x0 - sx // 2
    ty0, tx0 = max(oy, 0), max(ox, 0)
    ty1, tx1 = min(oy + sy, shape.shape[0]), min(ox + sx, shape.shape[1])
    if ty1 > ty0 and tx1 > tx0:
        shape[ty0:ty1, tx0:tx1] = st[ty0 - oy:ty1 - oy, tx0 - ox:tx1 - ox]
    # keep only the bright pixels close to the star, not a lit surface beside it
    yy, xx = np.mgrid[0:comp.shape[0], 0:comp.shape[1]]
    comp[(yy - (cy - y0)) ** 2 + (xx - (cx - x0)) ** 2 > (d * reach) ** 2] = 0
    comp = cv2.dilate(comp | shape, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    full = np.zeros_like(gray)
    full[y0:y1, x0:x1] = comp
    return full


def find_start_stars(gray):
    """The star(s) in frame 0, near the fixed spot every still puts them."""
    X, Y, R = 626, 1188, 70
    H, W = gray.shape
    x0, y0 = max(X - R, 0), max(Y - R, 0)
    region = hp(gray)[y0:min(Y + R, H), x0:min(X + R, W)].copy()
    t = hp(REAL)
    res = cv2.matchTemplate(region, t, cv2.TM_CCOEFF_NORMED)
    # the fixed spot is always a star in frame 0 — on pale sand or a white desk
    # it is too faint for a match score, but it is there in every clip (checked on
    # S05, S10, S12, S19, S21, S22, S32, S36, S49, S54)
    out = [(X, Y, 44)]
    cx0, cy0 = X - x0 - t.shape[1] // 2, Y - y0 - t.shape[0] // 2
    cv2.rectangle(res, (cx0 - 6, cy0 - 6), (cx0 + 6, cy0 + 6), -1, -1)
    for _ in range(2):
        _, sc, _, loc = cv2.minMaxLoc(res)
        if sc < 0.33:
            break
        cx, cy = x0 + loc[0] + t.shape[1] // 2, y0 + loc[1] + t.shape[0] // 2
        out.append((cx, cy, 44))
        # a second star can overlap the first by half its width (S07), so only
        # the peak itself is suppressed
        cv2.rectangle(res, (loc[0] - 6, loc[1] - 6), (loc[0] + 6, loc[1] + 6), -1, -1)
    return out


def follow(grays, cx, cy, d, W, H):
    """Follow one star: predict with the motion of the scene around it (optical
    flow of features in a ring outside the star), then settle on the star itself
    with a local match. Keeps the last good place if the star is briefly lost."""
    n = len(grays)
    pos = [None] * n
    pos[0] = (cx, cy, d)
    tmpl0 = hp(grays[0])[cy - 26:cy + 27, cx - 26:cx + 27].copy()
    x, y, size = float(cx), float(cy), float(d)
    for i in range(1, n):
        a, b = grays[i - 1], grays[i]
        # features in a ring 30-110 px round the star, not on it
        ring = np.zeros_like(a)
        cv2.circle(ring, (int(x), int(y)), 110, 255, -1)
        cv2.circle(ring, (int(x), int(y)), int(size * 0.8) + 6, 0, -1)
        p0 = cv2.goodFeaturesToTrack(a, 60, 0.01, 6, mask=ring)
        dx = dy = 0.0
        k = 1.0
        if p0 is not None and len(p0) >= 6:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(a, b, p0, None, winSize=(21, 21), maxLevel=3)
            good0, good1 = p0[st == 1], p1[st == 1]
            if len(good0) >= 6:
                m, _ = cv2.estimateAffinePartial2D(good0, good1)
                if m is not None:
                    nx = m[0, 0] * x + m[0, 1] * y + m[0, 2]
                    ny = m[1, 0] * x + m[1, 1] * y + m[1, 2]
                    k = float(np.hypot(m[0, 0], m[1, 0]))
                    dx, dy = nx - x, ny - y
        px, py, psize = x + dx, y + dy, size * k
        # settle on the star: the frame-0 star, rescaled, searched near the prediction
        # AND near the last place (Veo sometimes leaves it fixed while the scene moves)
        sc = psize / d
        t = cv2.resize(tmpl0, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
        hb = hp(b)
        best = (0, px, py)
        # three places it can be: where the scene carried it, where it last was,
        # and where it started (Veo sometimes keeps it pinned there, S25, S53)
        for gx, gy in ((px, py), (x, y), (cx, cy)):
            r = t.shape[0] // 2 + 10
            x0, y0 = int(max(gx - r, 0)), int(max(gy - r, 0))
            win = hb[y0:int(min(gy + r + 1, H)), x0:int(min(gx + r + 1, W))]
            if win.shape[0] > t.shape[0] and win.shape[1] > t.shape[1]:
                res = cv2.matchTemplate(win, t, cv2.TM_CCOEFF_NORMED)
                _, s2, _, loc = cv2.minMaxLoc(res)
                if s2 > best[0]:
                    best = (s2, x0 + loc[0] + t.shape[1] / 2, y0 + loc[1] + t.shape[0] / 2)
        if best[0] > 0.45:
            x, y = best[1], best[2]
        else:
            x, y = px, py
        size = psize
        if not (0 <= x < W and 0 <= y < H):
            break
        pos[i] = (int(round(x)), int(round(y)), int(round(size)))
    return pos


def clone_fill(frame, mask, avoid):
    """Fill the masked pixels with texture from a nearby patch of similar
    brightness, feathered. Candidates sit left, above, right and below at 1.4x
    the mask's size; the one whose brightness best matches the ring round the
    mask wins (a darker patch pasted on a pale desk reads as a blot, S21)."""
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return frame
    H, W = mask.shape
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    w, h = x1 - x0 + 1, y1 - y0 + 1
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    ring = cv2.dilate(mask, np.ones((15, 15), np.uint8)) & ~mask
    target = gray[ring > 0].mean() if ring.any() else gray[mask > 0].mean()
    best = None
    for k in (1.4, 2.0, 2.8):
      for dx, dy in ((0, -k * h), (-k * w, 0), (k * w, 0), (0, k * h), (-k * w, -k * h), (k * w, -k * h)):
        dx, dy = int(dx), int(dy)
        sx0, sy0, sx1, sy1 = x0 + dx, y0 + dy, x1 + dx, y1 + dy
        if sx0 < 0 or sy0 < 0 or sx1 >= W or sy1 >= H:
            continue
        if avoid[sy0:sy1 + 1, sx0:sx1 + 1].any():
            continue
        diff = abs(gray[sy0:sy1 + 1, sx0:sx1 + 1].mean() - target) + 2 * k
        if best is None or diff < best[0]:
            best = (diff, dx, dy)
    if best is None or best[0] > 40:
        return cv2.inpaint(frame, mask, 3, cv2.INPAINT_TELEA)
    _, dx, dy = best
    # shifted[y, x] = frame[y + dy, x + dx]
    shifted = np.roll(frame, (-dy, -dx), axis=(0, 1))
    alpha = cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 2.5)[..., None]
    alpha = np.clip(alpha * 1.6, 0, 1)
    return (shifted.astype(np.float32) * alpha + frame.astype(np.float32) * (1 - alpha)).astype(np.uint8)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    args = sys.argv[3:]
    debug = args[args.index('--debug') + 1] if '--debug' in args else None
    sweep = '--sweep' in args
    extras_on = '--extras' in args
    visible = [int(v) for v in args[args.index('--visible') + 1:args.index('--visible') + 5]] if '--visible' in args else None
    plate = [int(v) for v in args[args.index('--plate') + 1:args.index('--plate') + 5]] if '--plate' in args else None
    cap = cv2.VideoCapture(src)
    fps = cap.get(cv2.CAP_PROP_FPS) or 24
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    grays = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in frames]
    H, W = grays[0].shape

    # 1. Every still carries the star in the same place, so frame 0 of every clip
    #    has it at (626, 1188), about 44 px across. Some stills carry two (S07:
    #    the reference photo had one and the new still added its own), so every
    #    good match near that spot is taken, not just the best.
    stars0 = find_start_stars(grays[0])
    tracks = []
    for (cx, cy, d) in stars0:
        tracks.append(follow(grays, cx, cy, d, W, H))
    track = [[t[i] for t in tracks if t[i]] for i in range(len(frames))]
    # the star can also stay PINNED at its starting spot while the scene moves
    # under it (S39, S25, S53), or come back there later. Every frame, the
    # starting spot is compared with the star's own look in frame 0; a match
    # there is painted even if the follower went elsewhere.
    for (sx, sy, sd) in stars0:
        t0 = hp(grays[0])[sy - 26:sy + 27, sx - 26:sx + 27]
        for i, g in enumerate(grays):
            if any((t[0] - sx) ** 2 + (t[1] - sy) ** 2 < 10 ** 2 for t in track[i]):
                continue
            win = hp(g)[sy - 34:sy + 35, sx - 34:sx + 35]
            res = cv2.matchTemplate(win, t0, cv2.TM_CCOEFF_NORMED)
            _, sc, _, loc = cv2.minMaxLoc(res)
            if sc >= 0.4:
                track[i].append((sx - 34 + loc[0] + 26, sy - 34 + loc[1] + 26, sd))
    start = stars0[0] + (0,) if stars0 else None

    # 4. extra, persistent sparkles anywhere in the lower-right third (S50)
    extra = [synthetic_peaks(g, int(W * 0.5), int(H * 0.66), W, H, 0.72) for g in grays]
    def persists(i, cx, cy, d):
        hits = sum(any((cx - x) ** 2 + (cy - y) ** 2 < (d * 0.8) ** 2 for _, x, y, _ in extra[j])
                   for j in range(max(0, i - 10), min(len(extra), i + 11)))
        return hits >= 12

    swept = [[] for _ in frames]
    if sweep:
        hits = [find_real_star(g, W, H) for g in grays]
        # a faint star (S39: half behind a chair leg, score ~0.5) is accepted only
        # when it holds the SAME spot, within 8 px, in most neighbouring frames
        for i, (sc, x, y, d) in enumerate(hits):
            if sc < 0.47:
                continue
            near = sum(1 for j in range(max(0, i - 8), min(len(hits), i + 9))
                       if hits[j][0] >= 0.45 and (hits[j][1] - x) ** 2 + (hits[j][2] - y) ** 2 < 8 ** 2)
            if near >= 10:
                swept[i].append((x, y, max(d, 26)))

    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                            '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', dst],
                           stdin=subprocess.PIPE)
    painted, extras = 0, 0
    boxes_log = []
    out_frames = []
    for i, f in enumerate(frames):
        mask = np.zeros((H, W), np.uint8)
        for tr in track[i] + swept[i]:
            m = star_mask(grays[i], *tr)
            if m is not None:
                mask |= m
        for s, cx, cy, d in (extra[i] if extras_on else []):
            if any((cx - t[0]) ** 2 + (cy - t[1]) ** 2 < (max(d, t[2]) * 0.9) ** 2 for t in track[i]):
                continue
            if persists(i, cx, cy, d):
                # these are Veo's own animated sparkles, with a glow round them
                m = star_mask(grays[i], cx, cy, d, grow=7, reach=1.6)
                if m is not None:
                    mask |= m
                    extras += 1
        if visible is not None and mask.any():
            vx0, vy0, vx1, vy1 = visible
            # the grown mask can graze the crop line while the star itself sits
            # below it; paint only when a real share of it is in the kept frame
            inside = np.count_nonzero(mask[vy0:vy1, vx0:vx1]) / max(np.count_nonzero(mask), 1)
            if inside < 0.2:
                mask[:] = 0                      # the crop removes it; leave the pixels alone
        if mask.any():
            painted += 1
            ys_, xs_ = np.nonzero(mask)
            boxes_log.append((i, int(xs_.min()), int(ys_.min()), int(xs_.max()), int(ys_.max())))
            if visible is not None:
                # texture copy, not a smooth fill; roll-shift is wrong at frame edges, so
                # np.roll's wrap-around is avoided by the in-frame check in clone_fill
                big = cv2.dilate(mask, np.ones((25, 25), np.uint8))
                f = clone_fill(f, mask, big)
            else:
                f = cv2.inpaint(f, mask, 3, cv2.INPAINT_TELEA)
        if plate:
            if i == 0:
                px0, py0, px1, py1 = plate
                plate_img = f[py0:py1, px0:px1].astype(np.float32)
                fm = np.zeros((py1 - py0, px1 - px0), np.float32)
                fm[12:-12 or None, 12:-12 or None] = 1
                fm = cv2.GaussianBlur(fm, (0, 0), 6)[..., None]
                # the right and bottom edges are the frame edge: no feather there
                fm[:, -12:] = fm[:, -13:-12]
                fm[-12:, :] = fm[-13:-12, :]
            else:
                px0, py0, px1, py1 = plate
                roi = f[py0:py1, px0:px1].astype(np.float32)
                f = f.copy()
                f[py0:py1, px0:px1] = (plate_img * fm + roi * (1 - fm)).astype(np.uint8)
        out_frames.append(f)
        enc.stdin.write(f.tobytes())
    enc.stdin.close()
    enc.wait()
    import json
    with open(dst.rsplit('.', 1)[0] + '.painted.json', 'w') as fh:
        json.dump(boxes_log, fh)
    where = [(int(x), int(y), int(d)) for x, y, d in stars0]
    print(f'{src}: start stars {where}, tracked in {sum(bool(t) for t in track)}/{len(frames)}, '
          f'painted {painted}, extra sparkles {extras}')
    if debug:
        rows = []
        for i in (0, len(frames) // 2, len(frames) - 1):
            x0, y0 = int(W * 0.45), int(H * 0.62)
            rows.append(np.hstack([frames[i][y0:, x0:], out_frames[i][y0:, x0:]]))
        cv2.imwrite(debug, np.hstack(rows))


if __name__ == '__main__':
    main()
