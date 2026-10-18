#!/usr/bin/env python3
"""Last step after kit/audio/mix.mjs: trims audio/mix.wav by the few hundredths of a dB the two-pass loudnorm missed so the
integrated loudness lands on -16.00 LUFS, hard-zeroes the silent beat 8.5-9.0 (the resampler leaves a -95 dBFS ripple in the last 0.3 ms before 9.0),
and checks it (exact length 30.000 s, 48 kHz stereo, true peak <= -2 dBTP).
usage: python3 finish.py"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, 'audio', 'mix.wav')
def measure(p):
    """(loudnorm integrated, ebur128 integrated, true peak). The two BS.1770 implementations differ by a few hundredths of a dB."""
    err = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',p,'-af','loudnorm=I=-16:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
    j = json.loads(err[err.rfind('{'):err.rfind('}')+1])
    tmp = os.path.join(HERE, 'audio', '.r128.txt')
    subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',p,'-af',f'ebur128=metadata=1,ametadata=print:key=lavfi.r128.I:file={tmp}','-f','null','-'],capture_output=True)
    e = float(open(tmp).read().strip().splitlines()[-1].split('=')[1]); os.remove(tmp)
    return float(j['input_i']), e, float(j['input_tp'])
a, e, tp = measure(P); i = (a+e)/2; d = -16.0 - i
print(f'before: loudnorm {a:.2f}, ebur128 {e:.2f} LUFS, {tp:.2f} dBTP -> trim {d:+.2f} dB (centres the two meters on -16.00)')
if tp + d > -2.0: sys.exit('trim would push the true peak above -2 dBTP')
import numpy as np
tmp = P + '.tmp.wav'
subprocess.run(['ffmpeg','-v','error','-y','-i',P,'-af',f'volume={d:.3f}dB' if abs(d) > 0.015 else 'anull','-c:a','pcm_f32le','-ar','48000',tmp],check=True)
raw = subprocess.run(['ffmpeg','-v','error','-i',tmp,'-f','f32le','-ac','2','-ar','48000','-'],capture_output=True,check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
a0, a1 = int(round(8.4945*48000)), int(round(9.0*48000))          # the silent beat: the bed is cut at 8.493; sample 9.0 exactly is untouched (sample-accurate: ffmpeg's volume/enable works per 1024-sample frame and ate the hit)
x[a0:a1] = 0.0
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','48000','-ac','2','-i','-','-c:a','pcm_s24le',tmp],input=x.tobytes(),check=True); os.replace(tmp, P)
a, e, tp = measure(P)
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',P],capture_output=True,text=True).stdout)
print(f'after:  loudnorm {a:.2f}, ebur128 {e:.2f} LUFS, {tp:.2f} dBTP, {dur:.6f} s')
