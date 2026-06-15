# 스프라이트 시트 자동 슬라이스 + 배경 투명화
import numpy as np
from PIL import Image
from scipy import ndimage
import os, json

SRC = "image-1781445909480.webp"
OUT = "frames"
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.int16)
H, W, _ = a.shape
R, G, B = a[..., 0], a[..., 1], a[..., 2]
mx = np.maximum(np.maximum(R, G), B)
mn = np.minimum(np.minimum(R, G), B)
sat = mx - mn
bright = mx
# 배경(tan/격자): 채도 낮고 + 밝고 + '따뜻한'(R>B) 색. → 회색 낫 날(중성색)은 배경에서 제외
def warm_bg(R, G, B):
    mx = np.maximum(np.maximum(R, G), B); mn = np.minimum(np.minimum(R, G), B)
    return ((mx - mn) < 35) & (mx > 120) & ((R - B) > 12)
bg_like = warm_bg(R, G, B)
fg = ~bg_like                  # 전경(낫 날·흰색·외곽선 포함)
# 프레임 '분리' 검출용: 채도 높은 채움만 (텍스트/외곽선 제외해 행 병합 방지)
content = sat > 45

def bands(proj, min_run, gap=3, thresh=4):
    on = proj > thresh
    res = []
    i = 0
    n = len(on)
    while i < n:
        if on[i]:
            j = i
            g = 0
            while j < n and (on[j] or g < gap):
                if on[j]: g = 0
                else: g += 1
                j += 1
            j -= g
            if j - i >= min_run:
                res.append((i, j))
            i = j
        else:
            i += 1
    return res

rowproj = content.sum(axis=1)
rows = bands(rowproj, min_run=22, gap=4, thresh=5)  # 스프라이트 행

report = []
idx_rows = []
for (r0, r1) in rows:
    sub = content[r0:r1, :]
    colproj = sub.sum(axis=0)
    cols = bands(colproj, min_run=14, gap=10, thresh=2)
    idx_rows.append((r0, r1, cols))
    report.append({"row": [int(r0), int(r1)], "h": int(r1 - r0), "sprites": len(cols),
                   "cols": [[int(c0), int(c1)] for (c0, c1) in cols]})

print(json.dumps(report, indent=1, ensure_ascii=False))

# 전경 연결요소(캐릭터+낫은 하나로 이어진 덩어리) 라벨링
# 8방향 연결로 외곽선/날 끊김 방지
lbl_full, ncomp = ndimage.label(fg, structure=np.ones((3, 3), int))

# 각 스프라이트: 채움 bbox 안에서 '가장 큰 연결요소'를 골라 그 요소 전체를 크롭(낫 포함)
# 마스크 = 해당 요소만 불투명 → 이웃 스프라이트/섹션 제목 글자(다른 요소)는 자동 배제
def clean_fringe(rgba):
    """투명 영역의 RGB 번짐만 제거하고 캐릭터 픽셀은 보존."""
    out = rgba.copy()
    R, G, B, A = out[..., 0], out[..., 1], out[..., 2], out[..., 3]

    # alpha=0 인데 RGB만 흰색인 픽셀 → 축소 렌더 시 번짐(halo) 유발
    ghost = A < 10
    R[ghost] = 0
    G[ghost] = 0
    B[ghost] = 0
    return out

def cut(r0, r1, c0, c1, name):
    sub = lbl_full[r0:r1, c0:c1]
    vals = sub[sub > 0]
    if vals.size == 0: return None
    ids, counts = np.unique(vals, return_counts=True)
    comp = int(ids[np.argmax(counts)])
    ys, xs = np.where(lbl_full == comp)
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    pad = 2
    y0 = max(0, y0 - pad); x0 = max(0, x0 - pad); y1 = min(H, y1 + pad); x1 = min(W, x1 + pad)
    crop = a[y0:y1, x0:x1].astype(np.uint8)
    mask = (lbl_full[y0:y1, x0:x1] == comp)
    rgba = np.dstack([crop, np.where(mask, 255, 0).astype(np.uint8)])
    rgba = clean_fringe(rgba)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, name + ".png"))
    return (x0, y0, x1 - x0, y1 - y0)

boxes = {}
for ri, (r0, r1, cols) in enumerate(idx_rows):
    for ci, (c0, c1) in enumerate(cols):
        nm = f"b{ri}_{ci}"
        boxes[nm] = cut(r0, r1, c0, c1, nm)

print("SAVED", len(boxes), "frames to", OUT)

# b2_0(아래 걷기 B)은 좌우 반전해 사용 (걷기 애니메이션 일관성)
try:
    from PIL import Image as _I
    _p="frames/b2_0.png"
    _I.open(_p).transpose(_I.FLIP_LEFT_RIGHT).save(_p)
    print("flip b2_0")
except Exception as e:
    print("flip skip", e)
