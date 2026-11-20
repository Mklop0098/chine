#!/usr/bin/env python3
"""Bổ sung cấu trúc Tử Cấm Thành còn thiếu từ OpenStreetMap vào public/data/forbidden-city.json.

Bản trích cũ bỏ sót tường sân (barrier=wall dạng đường), một số điện/cổng và cây. Script này:
  1. Khớp phép biến đổi (kinh độ, vĩ độ) -> (x, z) của cảnh bằng chính các nhà đã có (id OSM trùng nhau).
  2. Thêm tường sân chưa có (dày 1 m), nhà còn thiếu, cây (natural=tree, tree_row).
  3. Trổ lối qua tường mới tại chỗ đường đi bộ OSM cắt qua, xuyên qua cổng (门) mới,
     rồi kiểm tra liên thông: sân nào trước đây đi tới được mà nay bị khép kín thì trổ thêm lối.
Kết quả ghi vào khóa "osmAdditions" (data.js gộp lúc nạp) nên chạy lại bao nhiêu lần cũng như nhau.

Chạy:  python tools/osm_sync.py            (dùng bản OSM đã tải trong tools/.cache, nếu không có thì tải)
Dữ liệu © OpenStreetMap contributors (ODbL).
"""
import json, math, os, sys, re, urllib.request, urllib.parse, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'public', 'data', 'forbidden-city.json')
CACHE = os.path.join(ROOT, 'tools', '.cache', 'osm-forbidden-city.json')
BBOX = (39.9110, 116.3870, 39.9250, 116.4040)
MIRRORS = ['https://overpass.private.coffee/api/interpreter', 'https://overpass-api.de/api/interpreter']

# Vùng trong tường thành (mặt trong tường thành ~ x 368, z 472).
INNER_X, INNER_Z = 366.0, 470.0
# Khu sân tuyển tú nữ dùng cho Chương I / Màn 1: giữ nguyên để không làm hỏng cảnh truyện.
STORY_BOX = (-372.0, 170.0, -262.0, 400.0)
WALL_THICK = 1.0
GRID = 0.5


def fetch():
    if os.path.exists(CACHE):
        return json.load(open(CACHE, encoding='utf-8'))
    s, w, n, e = BBOX
    q = f'[out:json][timeout:120];(way({s},{w},{n},{e});node[natural=tree]({s},{w},{n},{e}););out geom tags;'
    for url in MIRRORS:
        try:
            req = urllib.request.Request(url, urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'tucamthanh-osm-sync/1.0'})
            raw = urllib.request.urlopen(req, timeout=180).read()
            d = json.loads(raw)
            os.makedirs(os.path.dirname(CACHE), exist_ok=True)
            open(CACHE, 'wb').write(raw)
            return d
        except Exception as ex:  # thử máy chủ khác
            print('Overpass lỗi:', url, ex)
    sys.exit('Không tải được dữ liệu OSM')


# ---------- hình học ----------
def bounds(p):
    xs = [a for a, _ in p]; zs = [b for _, b in p]
    return min(xs), min(zs), max(xs), max(zs)


def area(p):
    return abs(sum(p[i][0] * p[i - 1][1] - p[i - 1][0] * p[i][1] for i in range(len(p)))) / 2


def centroid(p):
    x0, z0, x1, z1 = bounds(p); return (x0 + x1) / 2, (z0 + z1) / 2


def pip(x, z, p):
    inside = False; j = len(p) - 1
    for i in range(len(p)):
        a, b = p[i]; c, d = p[j]
        if (b > z) != (d > z) and x < (c - a) * (z - b) / (d - b) + a: inside = not inside
        j = i
    return inside


def seg_dist(x, z, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]; L = dx * dx + dz * dz
    t = 0 if L == 0 else max(0, min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L))
    return math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)


def seg_intersect(p1, p2, p3, p4):
    d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0])
    if abs(d) < 1e-9: return None
    t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d
    u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d
    if 0 <= t <= 1 and 0 <= u <= 1: return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1]))
    return None


class Index:
    """Lưới ô 16 m chứa đa giác để tra nhanh điểm nằm trong / gần đa giác."""
    def __init__(self, cell=16.0):
        self.cell = cell; self.g = collections.defaultdict(list)

    def add(self, p, tag=None):
        x0, z0, x1, z1 = bounds(p); c = self.cell
        for i in range(int(math.floor(x0 / c)), int(math.floor(x1 / c)) + 1):
            for j in range(int(math.floor(z0 / c)), int(math.floor(z1 / c)) + 1):
                self.g[(i, j)].append((p, tag))

    def near(self, x, z):
        c = self.cell; i, j = int(math.floor(x / c)), int(math.floor(z / c)); seen = set()
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                for p, t in self.g.get((i + di, j + dj), ()):
                    if id(p) not in seen: seen.add(id(p)); yield p, t

    def covered(self, x, z, margin):
        for p, _ in self.near(x, z):
            if pip(x, z, p): return True
            if margin > 0 and any(seg_dist(x, z, p[k - 1], p[k]) < margin for k in range(len(p))): return True
        return False


def inner(x, z):
    return abs(x) < INNER_X and abs(z) < INNER_Z


def in_story(x, z):
    a, b, c, d = STORY_BOX
    return a < x < c and b < z < d


def quad(a, b, half, ext):
    dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz); ux, uz = dx / L, dz / L; nx, nz = -uz, ux
    a2 = (a[0] - ux * ext, a[1] - uz * ext); b2 = (b[0] + ux * ext, b[1] + uz * ext)
    r = lambda v: round(v, 2)
    return [[r(a2[0] + nx * half), r(a2[1] + nz * half)], [r(b2[0] + nx * half), r(b2[1] + nz * half)],
            [r(b2[0] - nx * half), r(b2[1] - nz * half)], [r(a2[0] - nx * half), r(a2[1] - nz * half)]]


def gate_opening(p):
    """Lối xuyên cổng (门): qua tâm, vuông góc với cạnh dài nhất; độ dài = bề sâu cổng."""
    cx, cz = centroid(p)
    best = max(range(len(p)), key=lambda k: math.dist(p[k - 1], p[k]))
    a, b = p[best - 1], p[best]; L = math.dist(a, b); ux, uz = (b[0] - a[0]) / L, (b[1] - a[1]) / L
    depth = max(abs((q[0] - cx) * -uz + (q[1] - cz) * ux) for q in p) * 2
    return [round(cx, 2), round(cz, 2), round(-uz, 4), round(ux, 4), round(depth, 2)]


def roof_colour(c):
    if not c: return 0
    c = c.strip().lower()
    names = {'grey': 1, 'gray': 1, 'darkgray': 1, 'darkgrey': 1, 'green': 2, 'darkgreen': 2, 'seagreen': 2}
    if c in names: return names[c]
    m = re.match(r'#?([0-9a-f]{6})$', c)
    if not m: return 0
    r, g, b = (int(m.group(1)[i:i + 2], 16) for i in (0, 2, 4))
    if max(r, g, b) - min(r, g, b) < 30: return 1
    if g > r and g >= b: return 2
    return 0


LOST = []


def main():
    data = json.load(open(DATA, encoding='utf-8'))
    osm = fetch()
    ways = {str(e['id']): e for e in osm['elements'] if e['type'] == 'way'}

    # 1) Phép biến đổi affine (bình phương tối thiểu theo tâm khung bao của các nhà trùng id).
    lon0, lat0 = 116.397, 39.916
    rows, tx, tz = [], [], []
    for b in data['buildings']:
        w = ways.get(b[3])
        if not w: continue
        lon = [g['lon'] for g in w['geometry']]; lat = [g['lat'] for g in w['geometry']]
        cx, cz = centroid(b[0])
        rows.append(((min(lon) + max(lon)) / 2 - lon0) * 1e4); rows.append(((min(lat) + max(lat)) / 2 - lat0) * 1e4)
        tx.append(cx); tz.append(cz)
    A = [(rows[2 * i], rows[2 * i + 1], 1.0) for i in range(len(tx))]

    def lsq(y):
        N = [[sum(a[i] * a[j] for a in A) for j in range(3)] + [sum(a[i] * v for a, v in zip(A, y))] for i in range(3)]
        for i in range(3):
            p = N[i][i]; N[i] = [v / p for v in N[i]]
            for k in range(3):
                if k != i: f = N[k][i]; N[k] = [vk - f * vi for vk, vi in zip(N[k], N[i])]
        return [N[i][3] for i in range(3)]
    sx, sz = lsq(tx), lsq(tz)
    err = max(max(abs(sx[0] * a + sx[1] * b + sx[2] - x), abs(sz[0] * a + sz[1] * b + sz[2] - z)) for (a, b, _), x, z in zip(A, tx, tz))
    print(f'Khớp tọa độ: {len(A)} nhà, sai số lớn nhất {err:.2f} m')

    def T(g):
        a = (g['lon'] - lon0) * 1e4; b = (g['lat'] - lat0) * 1e4
        return (sx[0] * a + sx[1] * b + sx[2], sz[0] * a + sz[1] * b + sz[2])

    def geom(e): return [T(g) for g in e['geometry']]

    # Vật cản đã có.
    have = Index(); walls_idx = Index(); sites_idx = Index()
    for b in data['buildings']: have.add(b[0])
    for w in data['walls']: have.add(w); walls_idx.add(w)
    for o, parts, *_ in data['gatewayBuildings']: have.add(o)
    for o, parts in data['gatewayWalls']: have.add(o); walls_idx.add(o)
    for v in data['sites'].values():
        sites_idx.add(v[1])
    ids = {b[3] for b in data['buildings']} | set(data['sites'].keys())

    def overlap(p, idx):
        x0, z0, x1, z1 = bounds(p); n = hit = 0; step = 0.7
        z = z0 + step / 2
        while z < z1:
            x = x0 + step / 2
            while x < x1:
                if pip(x, z, p):
                    n += 1
                    if any(pip(x, z, q) for q, _ in idx.near(x, z)): hit += 1
                x += step
            z += step
        return hit / n if n else 1.0

    add_buildings, add_walls, gate_openings = [], [], []
    # 2) Nhà còn thiếu (và "nhà" thật ra là tường: 墙).
    for wid, e in ways.items():
        t = e.get('tags', {})
        if 'building' not in t or wid in ids: continue
        p = geom(e)
        if len(p) > 3 and p[0] == p[-1]: p = p[:-1]
        if len(p) < 3: continue
        cx, cz = centroid(p); name = t.get('name', '')
        if not inner(cx, cz) or in_story(cx, cz) or t['building'] in ('ruins', 'roof'): continue
        if '城墙' in name: continue
        if any(pip(cx, cz, q) for q, _ in sites_idx.near(cx, cz)): continue
        # Nền đá (Tam Đại Điện…) do module riêng dựng: bỏ mọi đa giác chồng lên khu di tích có sẵn.
        if overlap(p, sites_idx) > .05 or overlap(p, have) > .25: continue
        if t.get('building:material') in ('concrete', 'steel', 'glass'): continue  # nhà hiện đại
        if not name and abs(cx) < 120 and -330 < cz < 330: continue  # nền đá / hành lang trục giữa do taihe, landmarks dựng
        poly = [[round(x, 2), round(z, 2)] for x, z in p]
        if t['building'] == 'wall' or name.endswith('墙'):
            # Chỉ nhận tường mảnh; "院墙" rộng thực ra là dãy hành lang đã có dưới dạng nhà khác.
            perim = sum(math.dist(p[k - 1], p[k]) for k in range(len(p)))
            if area(p) / (perim / 2) < 2.2: add_walls.append(poly); have.add(poly)
            continue
        if area(p) < 8: continue
        try: h = float(re.findall(r'[\d.]+', t.get('height', '0'))[0])
        except (IndexError, ValueError): h = 0.0
        gate = 1 if name.endswith('门') else 0
        shape = t.get('roof:shape', 'gabled')
        add_buildings.append([poly, h, gate, wid, [], roof_colour(t.get('roof:colour')), shape])
        have.add(poly)
        if gate: gate_openings.append(gate_opening(p) + [wid])

    # 3) Tường sân dạng đường (barrier=wall): giữ phần chưa có, dựng thành dải dày 1 m.
    wall_lines = []
    for wid, e in ways.items():
        t = e.get('tags', {})
        if t.get('barrier') != 'wall': continue
        p = geom(e)
        for k in range(1, len(p)):
            a, b = p[k - 1], p[k]; L = math.dist(a, b)
            if L < .3: continue
            n = max(1, int(L / GRID)); run = []
            for s in range(n + 1):
                u = s / n; x, z = a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u
                ok = inner(x, z) and not in_story(x, z) and not have.covered(x, z, .9) \
                    and not any(pip(x, z, q) for q, _ in sites_idx.near(x, z))
                if ok: run.append((x, z))
                if (not ok or s == n) and run:
                    if math.dist(run[0], run[-1]) >= 2.0: wall_lines.append((run[0], run[-1]))
                    run = []
    for a, b in wall_lines:
        # Kéo dài đầu tường 0.95 m để khít với nhà / tường có sẵn (phần bị bỏ vì nằm sát vật cản).
        add_walls.append(quad(a, b, WALL_THICK / 2, .95))

    # Cổng (门) có sẵn nằm trên tường mới: trổ lối xuyên cổng nếu chưa có lối nào đi qua nó.
    wall_idx_new = Index()
    for w in add_walls: wall_idx_new.add(w)
    import openings_data as _od
    _old = _od.load(os.path.join(ROOT, 'src', 'world', 'openingsData.js'))
    for b in data['buildings']:
        name = ways.get(b[3], {}).get('tags', {}).get('name', '')
        if not (b[2] or name.endswith('门')): continue
        p = b[0]; x0, z0, x1, z1 = bounds(p)
        if any(x0 - 1 < o[0] < x1 + 1 and z0 - 1 < o[1] < z1 + 1 for o in _old): continue
        touch = any(min(seg_dist(q[0], q[1], p[k - 1], p[k]) for k in range(len(p))) < 1.6
                    for w, _ in wall_idx_new.near(*centroid(p)) for q in w)
        if touch: gate_openings.append(gate_opening(p) + [b[3]])

    # 4) Lối qua tường mới tại chỗ đường đi bộ / đường nội bộ OSM cắt ngang.
    roads = []
    for e in ways.values():
        t = e.get('tags', {})
        if t.get('highway') in ('footway', 'pedestrian', 'path', 'steps', 'service', 'track', 'living_street', 'residential'):
            g = geom(e); roads += [(g[k - 1], g[k]) for k in range(1, len(g))]
    openings = []

    def add_opening(x, z, nx, nz, ln):
        for o in openings + gate_openings:
            if math.hypot(o[0] - x, o[1] - z) < 4.5: return False
        # lối đi xuyên vào nhà có sẵn thì không cần (đường OSM đi vào cửa nhà)
        openings.append([round(x, 2), round(z, 2), round(nx, 4), round(nz, 4), ln])
        return True
    for a, b in wall_lines:
        L = math.dist(a, b); ux, uz = (b[0] - a[0]) / L, (b[1] - a[1]) / L
        for r in roads:
            hit = seg_intersect(a, b, r[0], r[1])
            if hit: add_opening(hit[0], hit[1], -uz, ux, WALL_THICK + .2)

    # 5) Kiểm tra liên thông trên lưới 0.5 m: so trước / sau khi thêm, trổ thêm lối nếu sân bị khép kín.
    import openings_data
    old_open = openings_data.load(os.path.join(ROOT, 'src', 'world', 'openingsData.js'))
    W = int(2 * INNER_X / GRID); H = int(2 * INNER_Z / GRID)

    def raster(polys, grid, val):
        for p in polys:
            x0, z0, x1, z1 = bounds(p)
            j0 = max(0, int((z0 + INNER_Z) / GRID)); j1 = min(H - 1, int((z1 + INNER_Z) / GRID))
            for j in range(j0, j1 + 1):
                z = (j + .5) * GRID - INNER_Z; xs = []
                for k in range(len(p)):
                    (ax, az), (bx, bz) = p[k - 1], p[k]
                    if (az > z) != (bz > z): xs.append(ax + (z - az) * (bx - ax) / (bz - az))
                xs.sort()
                for m in range(0, len(xs) - 1, 2):
                    i0 = max(0, int(math.ceil((xs[m] + INNER_X) / GRID - .5))); i1 = min(W - 1, int(math.floor((xs[m + 1] + INNER_X) / GRID - .5)))
                    for i in range(i0, i1 + 1): grid[j * W + i] = val

    def carve(grid, ops):
        for x, z, dx, dz, ln in ops:
            band = ln / 2 + .9; px, pz = -dz, dx
            corners = [(x + dx * sa * band + px * sp * 1.55, z + dz * sa * band + pz * sp * 1.55) for sa, sp in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            raster([corners], grid, 0)

    base_obst = [b[0] for b in data['buildings']] + data['walls'] + [o for o, *_ in data['gatewayBuildings']] + [o for o, _ in data['gatewayWalls']]

    def build_grid(extra_b, extra_w, ops):
        g = bytearray(W * H)
        raster(base_obst, g, 1); raster(extra_b, g, 1); raster(extra_w, g, 2)
        carve(g, old_open + [o[:5] for o in ops])
        return g

    def flood(g):
        seen = bytearray(W * H); i0 = int((0 + INNER_X) / GRID); j0 = int((200 + INNER_Z) / GRID)
        dq = collections.deque([j0 * W + i0]); seen[j0 * W + i0] = 1
        while dq:
            c = dq.popleft(); j, i = divmod(c, W)
            for n_, ok in ((c - 1, i > 0), (c + 1, i < W - 1), (c - W, j > 0), (c + W, j < H - 1)):
                if ok and not seen[n_] and g[n_] == 0: seen[n_] = 1; dq.append(n_)
        return seen
    before = flood(build_grid([], [], []))
    new_b = [b[0] for b in add_buildings]
    for it in range(60):
        g = build_grid(new_b, add_walls, openings + gate_openings); reach = flood(g)
        lost = [c for c in range(W * H) if before[c] and not reach[c] and g[c] == 0]
        if not lost: break
        # Gom thành vùng, lấy vùng lớn nhất, tìm ô tường mới nằm giữa vùng đó và vùng đi được.
        lost_set = set(lost); comp = []; start = lost[0]; dq = collections.deque([start]); lost_set.discard(start)
        while dq:
            c = dq.popleft(); comp.append(c)
            for n_ in (c - 1, c + 1, c - W, c + W):
                if n_ in lost_set: lost_set.discard(n_); dq.append(n_)
        cs = set(comp)
        if len(comp) < 40:
            for c in comp: before[c] = 0
            continue
        cand = None
        for c in comp:
            j, i = divmod(c, W)
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                for k in range(1, 6):
                    ii, jj = i + di * k, j + dj * k
                    if not (0 <= ii < W and 0 <= jj < H): break
                    v = g[jj * W + ii]
                    if v == 0:
                        if reach[jj * W + ii] and k > 1 and all(g[(j + dj * m) * W + i + di * m] == 2 for m in range(1, k)):
                            x = (i + di * k / 2 + .5) * GRID - INNER_X; z = (j + dj * k / 2 + .5) * GRID - INNER_Z
                            cand = (x, z, di, dj, round(k * GRID, 2))
                        break
                if cand: break
            if cand: break
        if not cand:
            # Vùng bị nhà mới khép kín: bỏ các nhà mới sát vùng đó rồi kiểm tra lại.
            pts_ = [((c % W + .5) * GRID - INNER_X, (c // W + .5) * GRID - INNER_Z) for c in comp[::5]]
            near_b = [b for b in add_buildings if any(min(seg_dist(x, z, b[0][k - 1], b[0][k]) for k in range(len(b[0]))) < 2 for x, z in pts_)]
            if near_b:
                for b in near_b:
                    add_buildings.remove(b); print('  - bỏ nhà mới', b[3], 'vì khép kín một sân')
                gate_openings[:] = [o for o in gate_openings if o[5] not in {b[3] for b in near_b}]
                new_b = [b[0] for b in add_buildings]
                continue
            j, i = divmod(comp[0], W)
            LOST.append([[(c % W) * GRID - INNER_X, (c // W) * GRID - INNER_Z] for c in comp[::7]])
            print(f'  ! vùng {len(comp) * GRID * GRID:.0f} m² quanh ({i * GRID - INNER_X:.0f}, {j * GRID - INNER_Z:.0f}) không trổ được lối')
            for c in comp: before[c] = 0
            continue
        x, z, di, dj, ln = cand
        openings.append([round(x, 2), round(z, 2), di, dj, max(ln, 1.2)])
        print(f'  + trổ lối liên thông tại ({x:.1f}, {z:.1f}) cho vùng {len(comp) * GRID * GRID:.0f} m²')

    # 6) Cây: natural=tree và hàng cây (tree_row, cách nhau ~6 m).
    trees = []
    old_trees = data['mappedTrees']
    occupied = Index()
    for p in base_obst + new_b + add_walls: occupied.add(p)

    def try_tree(x, z):
        if not inner(x, z) or in_story(x, z) or occupied.covered(x, z, 1.2): return
        if any(math.hypot(x - a, z - b) < 3 for a, b in old_trees + trees): return
        trees.append([round(x, 2), round(z, 2)])
    for e in osm['elements']:
        if e['type'] == 'node' and e.get('tags', {}).get('natural') == 'tree':
            try_tree(*T(e))
    for e in ways.values():
        if e.get('tags', {}).get('natural') == 'tree_row':
            p = geom(e)
            for k in range(1, len(p)):
                a, b = p[k - 1], p[k]; n = max(1, int(math.dist(a, b) / 6))
                for s in range(n + 1): try_tree(a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n)

    data['osmAdditions'] = {
        'note': 'Sinh bởi tools/osm_sync.py từ OpenStreetMap (ODbL); data.js gộp vào walls/buildings/mappedTrees.',
        'walls': add_walls, 'buildings': add_buildings, 'trees': trees, 'openings': [o[:5] for o in gate_openings] + openings,
    }
    json.dump(LOST, open(os.path.join(ROOT, 'tools', '.cache', 'lost.json'), 'w'))
    json.dump(data, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'Thêm: {len(add_walls)} đoạn tường, {len(add_buildings)} nhà ({sum(b[2] for b in add_buildings)} cổng), '
          f'{len(trees)} cây, {len(gate_openings) + len(openings)} lối mở')
    for b in sorted(add_buildings, key=lambda b: -area(b[0]))[:40]:
        t = ways[b[3]].get('tags', {})
        print('   ', b[3], t.get('name', ''), round(area(b[0])), 'm²')


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
