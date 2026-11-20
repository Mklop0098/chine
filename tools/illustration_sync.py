#!/usr/bin/env python3
"""Thêm / bớt nhà cho khớp bản đồ minh họa "故宫博物院开放区域" (bản chữ Hán).

Đầu vào: tools/.cache/illustration-match.json, sinh bởi trang đối chiếu (mái ngói tách theo màu trên ảnh,
so với hình chiếu nhà của mô hình sau khi uốn mặt bằng – xem src/core/warp.js):
  none: [id, px, py]  – nhà mô hình không có mái nào trên ảnh trong bán kính ~8 m
  add:  [x0,y0,x1,y1, diện tích px, X0,Z0,X1,Z1] – mái trên ảnh chưa có nhà (tọa độ mô hình chưa uốn)
Script lọc thận trọng rồi ghi vào khóa "illustration" của public/data/forbidden-city.json
(data.js bỏ các nhà trong remove và thêm buildings lúc nạp).

Chạy:  python tools/illustration_sync.py
"""
import json, math, os, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from osm_sync import bounds, area, centroid, pip, seg_dist, Index, in_story, INNER_X, INNER_Z, GRID  # noqa: E402
import openings_data  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'public', 'data', 'forbidden-city.json')
MATCH = os.path.join(ROOT, 'tools', '.cache', 'illustration-match.json')
OSM = os.path.join(ROOT, 'tools', '.cache', 'osm-forbidden-city.json')

# Nhà đặc biệt dựng riêng / gắn cảnh truyện: không bớt.
KEEP = {'40478704', '40586549', '40593735', '40606461'}
# Khu Nam Tam Sở mái xanh: ảnh tô xám nên máy không tách được mái (pixel ảnh).
SKIP_PX = [(920, 990, 1080, 1120)]
# Lối đá trắng (甬路) từ điện chính xuống cổng sân, theo bản đồ minh họa; x = tâm điện trong mô hình.
# [tên, x tâm, z đầu, z cuối, bề rộng] – tọa độ mô hình chưa uốn.
PATHS = [
    ['Điện Vũ Anh', -218.9, 301.3, 330.6, 6],
    ['Điện Văn Hoa', 186.95, 300.8, 326.6, 6],
    ['Cung Từ Ninh', -221.0, -102.4, -73.2, 6],
    ['Điện Hoàng Cực', 294.25, -185.1, -140.7, 7],
    ['Điện Hoàng Cực (sân ngoài)', 294.25, -127.5, -66.0, 6],
]
NAMED_SUFFIX = ('门', '殿', '宫', '阁', '楼', '亭', '堂', '轩', '斋', '房', '所', '院', '室', '馆', '台', '庙')


def main():
    data = json.load(open(DATA, encoding='utf-8'))
    match = json.load(open(MATCH, encoding='utf-8'))
    osm = json.load(open(OSM, encoding='utf-8'))
    tags = {str(e['id']): e.get('tags', {}) for e in osm['elements'] if e['type'] == 'way'}
    x = data.get('osmAdditions', {})
    buildings = data['buildings'] + x.get('buildings', [])
    walls = data['walls'] + x.get('walls', [])
    by_id = {b[3]: b for b in buildings}
    sites = [v[1] for v in data['sites'].values()]

    # ---- bớt ----
    remove = []
    for bid, px, py in match['none']:
        b = by_id.get(bid)
        if not b or bid in KEEP or b[2]: continue
        name = tags.get(bid, {}).get('name', '')
        if name and (name.endswith(NAMED_SUFFIX) or not name.startswith(('房子', '小房'))): continue
        if area(b[0]) > 300: continue
        if any(a <= px <= c and bb <= py <= d for a, bb, c, d in SKIP_PX): continue
        cx, cz = centroid(b[0])
        if in_story(cx, cz) or any(pip(cx, cz, s) for s in sites): continue
        remove.append(bid)

    # ---- thêm ----
    occ = Index()
    for b in buildings:
        if b[3] not in remove: occ.add(b[0])
    for w in walls: occ.add(w)
    for o, *_ in data['gatewayBuildings']: occ.add(o)
    for o, _ in data['gatewayWalls']: occ.add(o)
    for s in sites: occ.add(s)
    roads = []
    for e in osm['elements']:
        t = e.get('tags', {})
        if e['type'] == 'way' and t.get('highway') in ('footway', 'pedestrian', 'path', 'steps', 'service', 'track', 'living_street', 'residential'):
            roads.append(e)
    # chuyển đường OSM sang tọa độ mô hình bằng phép biến đổi đã khớp trong osm_sync (đọc lại từ nhà trùng id)

    lon0, lat0 = 116.397, 39.916
    rows, tx, tz = [], [], []
    ways = {str(e['id']): e for e in osm['elements'] if e['type'] == 'way'}
    for b in data['buildings']:
        w = ways.get(b[3])
        if not w: continue
        lon = [g['lon'] for g in w['geometry']]; lat = [g['lat'] for g in w['geometry']]
        rows.append((((min(lon) + max(lon)) / 2 - lon0) * 1e4, ((min(lat) + max(lat)) / 2 - lat0) * 1e4, 1.0))
        c = centroid(b[0]); tx.append(c[0]); tz.append(c[1])

    def lsq(y):
        N = [[sum(a[i] * a[j] for a in rows) for j in range(3)] + [sum(a[i] * v for a, v in zip(rows, y))] for i in range(3)]
        for i in range(3):
            p = N[i][i]; N[i] = [v / p for v in N[i]]
            for k in range(3):
                if k != i: f = N[k][i]; N[k] = [vk - f * vi for vk, vi in zip(N[k], N[i])]
        return [N[i][3] for i in range(3)]
    sx, sz = lsq(tx), lsq(tz)
    T = lambda g: (sx[0] * (g['lon'] - lon0) * 1e4 + sx[1] * (g['lat'] - lat0) * 1e4 + sx[2], sz[0] * (g['lon'] - lon0) * 1e4 + sz[1] * (g['lat'] - lat0) * 1e4 + sz[2])
    segs = []
    for e in roads:
        g = [T(p) for p in e['geometry']]; segs += [(g[k - 1], g[k]) for k in range(1, len(g))]
    seg_idx = collections.defaultdict(list)
    for s in segs:
        for i in range(int(min(s[0][0], s[1][0]) // 16) - 1, int(max(s[0][0], s[1][0]) // 16) + 2):
            for j in range(int(min(s[0][1], s[1][1]) // 16) - 1, int(max(s[0][1], s[1][1]) // 16) + 2):
                seg_idx[(i, j)].append(s)

    adds = []
    for k, (a, b_, c, d, apx, X0, Z0, X1, Z1) in enumerate(match['add']):
        x0, x1 = sorted((X0, X1)); z0, z1 = sorted((Z0, Z1))
        cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
        w, h = (x1 - x0) * .9, (z1 - z0) * .9
        if w < 3 or h < 3: continue
        if abs(cx) > 362 or cz < -466 or cz > 440: continue  # ngoài tường / sát tường thành (giữ ngõ quanh thành)
        if abs(cx) < 60: continue  # trục chính do module riêng dựng
        if in_story(cx, cz): continue
        poly = [[round(cx - w / 2, 2), round(cz - h / 2, 2)], [round(cx + w / 2, 2), round(cz - h / 2, 2)],
                [round(cx + w / 2, 2), round(cz + h / 2, 2)], [round(cx - w / 2, 2), round(cz + h / 2, 2)]]
        bad = False
        for i in range(7):
            for j in range(7):
                px_, pz_ = cx - w / 2 + w * i / 6, cz - h / 2 + h * j / 6
                if occ.covered(px_, pz_, 1.0): bad = True; break
                if any(seg_dist(px_, pz_, s[0], s[1]) < 1.6 for s in seg_idx.get((int(px_ // 16), int(pz_ // 16)), ())): bad = True; break
            if bad: break
        if bad: continue
        adds.append([poly, 0, 0, f'illus-{k}', [], 0, 'hipped'])
        occ.add(poly)

    # ---- kiểm tra liên thông: nhà thêm không được khép kín sân nào đang đi tới được ----
    W = int(2 * INNER_X / GRID); H = int(2 * INNER_Z / GRID)
    old_open = openings_data.load(os.path.join(ROOT, 'src', 'world', 'openingsData.js')) + [o[:5] for o in x.get('openings', [])]

    def raster(polys, g, val):
        for p in polys:
            xa, za, xb, zb = bounds(p)
            for j in range(max(0, int((za + INNER_Z) / GRID)), min(H - 1, int((zb + INNER_Z) / GRID)) + 1):
                z = (j + .5) * GRID - INNER_Z; xs = []
                for k in range(len(p)):
                    (ax, az), (bx, bz) = p[k - 1], p[k]
                    if (az > z) != (bz > z): xs.append(ax + (z - az) * (bx - ax) / (bz - az))
                xs.sort()
                for m in range(0, len(xs) - 1, 2):
                    for i in range(max(0, int(math.ceil((xs[m] + INNER_X) / GRID - .5))), min(W - 1, int(math.floor((xs[m + 1] + INNER_X) / GRID - .5))) + 1):
                        g[j * W + i] = val

    def carve(g):
        for xx, zz, dx, dz, ln in old_open:
            band = ln / 2 + .9; px_, pz_ = -dz, dx
            raster([[(xx + dx * sa * band + px_ * sp * 1.55, zz + dz * sa * band + pz_ * sp * 1.55) for sa, sp in ((-1, -1), (1, -1), (1, 1), (-1, 1))]], g, 0)

    base = [b[0] for b in buildings if b[3] not in remove] + walls + [o for o, *_ in data['gatewayBuildings']] + [o for o, _ in data['gatewayWalls']]

    def flood(extra):
        g = bytearray(W * H); raster(base, g, 1); raster(extra, g, 1); carve(g)
        seen = bytearray(W * H); s0 = int((200 + INNER_Z) / GRID) * W + int(INNER_X / GRID)
        dq = collections.deque([s0]); seen[s0] = 1
        while dq:
            c = dq.popleft(); j, i = divmod(c, W)
            for n_, ok in ((c - 1, i > 0), (c + 1, i < W - 1), (c - W, j > 0), (c + W, j < H - 1)):
                if ok and not seen[n_] and not g[n_]: seen[n_] = 1; dq.append(n_)
        return g, seen
    _, before = flood([])
    for it in range(20):
        g, reach = flood([a[0] for a in adds])
        lost = [c for c in range(W * H) if before[c] and not reach[c] and not g[c]]
        if len(lost) < 120: break  # < 30 m² (vụn quanh góc nhà)
        pts = [((c % W + .5) * GRID - INNER_X, (c // W + .5) * GRID - INNER_Z) for c in lost[::9]]
        culprits = [a for a in adds if any(min(seg_dist(px_, pz_, a[0][k - 1], a[0][k]) for k in range(4)) < 2.5 for px_, pz_ in pts)]
        if not culprits: break
        for a in culprits: adds.remove(a)
        print(f'  - bỏ {len(culprits)} nhà thêm vì khép kín {len(lost) * GRID * GRID:.0f} m² sân')

    # ---- lối đá trắng cho các sân còn lại: nối mỗi điện chính với nhà / cổng gần nhất phía nam cùng trục ----
    final = [b for b in buildings if b[3] not in remove] + adds
    blk = Index()
    for b in final: blk.add(b[0])
    for w in walls: blk.add(w)
    for o_, *_ in data['gatewayBuildings']: blk.add(o_)
    for o_, _ in data['gatewayWalls']: blk.add(o_)
    for s_ in sites: blk.add(s_)
    paths = [list(p) for p in PATHS]

    def is_hall(b):
        x0, z0, x1, z1 = bounds(b[0]); w, d = x1 - x0, z1 - z0
        name = tags.get(b[3], {}).get('name', '')
        main = name.endswith(('宫', '殿', '堂', '斋', '轩', '所', '馆', '阁', '楼')) and area(b[0]) >= 100
        return (main or area(b[0]) >= 300) and w >= d * 1.1
    for h in final:
        if not is_hall(h): continue
        hx0, hz0, hx1, hz1 = bounds(h[0]); cx = (hx0 + hx1) / 2
        if abs(cx) < 60 or in_story(cx, hz1) or abs(cx) > 362: continue
        if any(abs(p[1] - cx) < 8 and min(p[2], p[3]) - 2 < hz1 + 30 and max(p[2], p[3]) + 2 > hz1 for p in paths): continue
        # nhà / cổng gần nhất phía nam mà trục điện đi qua
        best = None
        for b in final:
            if b is h: continue
            x0, z0, x1, z1 = bounds(b[0])
            if x0 < cx < x1 and z0 > hz1 - .5 and (best is None or z0 < best[1]): best = (b, z0)
        if not best: continue
        za, zb = hz1, best[1]; gap = zb - za
        if gap < 4 or gap > 70: continue
        w = max(3.0, min(6.0, (hx1 - hx0) * .16))
        # lối không được cắt qua nhà, tường hay khu nền đá khác
        ok = True
        for i in range(9):
            for j in range(int(gap / 1.5) + 1):
                x_ = cx - w / 2 + w * i / 8; z_ = za + .8 + (gap - 1.6) * j / max(1, int(gap / 1.5))
                if blk.covered(x_, z_, 0): ok = False; break
            if not ok: break
        if not ok: continue
        zh = tags.get(h[3], {}).get('name', '')
        if not zh or zh.startswith(('房子', '小房')): continue  # chỉ điện / cổng có tên mới vẽ lối trên bản đồ
        if abs(cx) < 120 and 100 < za < 380: continue  # quảng trường Thái Hòa: bản đồ không vẽ lối phụ
        name = tags.get(h[3], {}).get('name:vi') or zh
        paths.append([name, round(cx, 2), round(za, 2), round(zb, 2), round(w, 1)])
    print(f'Lối đá trắng: {len(paths)} đoạn ({len(paths) - len(PATHS)} tự sinh)')

    data['illustration'] = {
        'note': 'Sinh bởi tools/illustration_sync.py: khớp số nhà theo bản đồ minh họa 故宫博物院开放区域.',
        'remove': remove, 'buildings': adds,
        'paths': paths,
    }
    json.dump(data, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'Bớt {len(remove)} nhà, thêm {len(adds)} nhà theo bản đồ minh họa')


if __name__ == '__main__':
    main()
