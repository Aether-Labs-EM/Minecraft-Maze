// ===== 1. סצנה, מצלמה ורנדר =====
const SKY = 0x9ec1ff;
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.FogExp2(SKY, 0.022);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(20, 60, 20);
scene.add(dirLight);

// ===== 2. כלי עזר לטקסטורות פיקסלים =====
function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const clamp255 = v => Math.max(0, Math.min(255, v | 0));

function noiseRect(ctx, x, y, w, h, rgb, v, rand) {
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
        const d = (rand() - 0.5) * 2 * v;
        ctx.fillStyle = `rgb(${clamp255(rgb[0] + d)},${clamp255(rgb[1] + d)},${clamp255(rgb[2] + d)})`;
        ctx.fillRect(x + i, y + j, 1, 1);
    }
}

function toTexture(canvas, rx = 1, ry = 1) {
    const t = new THREE.CanvasTexture(canvas);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    return t;
}




function gateCanvas() { // שער הכניסה
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    ctx.fillStyle = '#333'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#888';
    ctx.fillRect(2, 0, 3, 16); ctx.fillRect(11, 0, 3, 16);
    ctx.fillRect(0, 4, 16, 3); ctx.fillRect(0, 11, 16, 3);
    return c;
}

function barsCanvas() { // סורגי ברזל שקופים לשער היציאה
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    ctx.fillStyle = '#9a9a9a';
    [1, 7, 13].forEach(x => ctx.fillRect(x, 0, 2, 16));
    ctx.fillRect(0, 3, 16, 2); ctx.fillRect(0, 11, 16, 2);
    ctx.fillStyle = '#d0d0d0';
    [1, 7, 13].forEach(x => ctx.fillRect(x, 0, 1, 16));
    return c;
}



// ===== אייטמים, עץ, תיבה, שמש (פיקסל ארט) =====
function fillRects(ctx, list) { list.forEach(([col, x, y, w, h]) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }); }
function rectsCanvas(list) { const c = makeCanvas(16, 16); fillRects(c.getContext('2d'), list); return c; }
const compassCanvas = () => rectsCanvas([['#555',3,1,10,14],['#555',1,3,14,10],['#d8d8d8',3,3,10,10],['#d02020',7,4,2,4],['#ffffff',7,8,2,4],['#222',7,7,2,2]]);
const potionCanvas = col => rectsCanvas([['#dfe9f0',7,1,2,2],['#dfe9f0',6,3,4,1],['#9fb4c0',4,4,8,10],[col,5,7,6,6],['#ffffff',5,5,1,2]]);

function chestFrontCanvas() {
    const c = plankCanvas();
    fillRects(c.getContext('2d'), [['#cfcfcf', 7, 0, 2, 5], ['#555', 7, 4, 2, 1], ['#3a2a12', 0, 0, 16, 1]]);
    return c;
}
function sunCanvas() { return rectsCanvas([['#ffe46b', 0, 0, 16, 16], ['#fff3a0', 2, 2, 12, 12], ['#ffffff', 4, 4, 8, 8]]); }



// ===== טקסטורות בסגנון מיינקראפט =====
function cobbleCanvas() { // אבן מסותתת עם הצללת קצוות
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(7);
    noiseRect(ctx, 0, 0, 16, 16, [52, 52, 52], 8, rand);
    [[0,0,5,5],[6,0,5,4],[12,0,4,5],[0,6,4,4],[5,5,6,5],[12,6,4,4],[0,11,6,5],[7,11,4,5],[12,11,4,5]].forEach(([x, y, w, h]) => {
        const g = 112 + ((rand() * 26) | 0);
        noiseRect(ctx, x, y, w, h, [g, g, g], 10, rand);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h);
    });
    return c;
}
function stoneCanvas() { // אבן חלקה: אפור עם כתמים כהים ובהירים
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(41);
    noiseRect(ctx, 0, 0, 16, 16, [128, 128, 128], 7, rand);
    for (let i = 0; i < 26; i++) {
        ctx.fillStyle = rand() < 0.6 ? 'rgba(80,80,80,0.5)' : 'rgba(175,175,175,0.45)';
        ctx.fillRect((rand() * 16) | 0, (rand() * 16) | 0, rand() < 0.3 ? 2 : 1, 1);
    }
    return c;
}
function oreCanvas(rgb, seed) { // אבן עם כתמי עפרה
    const c = stoneCanvas(), ctx = c.getContext('2d'), rand = mulberry32(seed);
    for (let k = 0; k < 6; k++) {
        const bx = 1 + ((rand() * 12) | 0), by = 1 + ((rand() * 12) | 0);
        [[0, 0], [1, 0], [0, 1], [1, 1], [rand() < 0.5 ? 2 : -1, 0], [0, rand() < 0.5 ? 2 : -1]].forEach(([dx, dy]) => noiseRect(ctx, bx + dx, by + dy, 1, 1, rgb, 18, rand));
    }
    return c;
}
function lavaCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(17);
    noiseRect(ctx, 0, 0, 16, 16, [225, 95, 15], 35, rand);
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = rand() < 0.6 ? 'rgba(255,220,60,0.8)' : 'rgba(150,40,0,0.6)';
        ctx.fillRect((rand() * 16) | 0, (rand() * 16) | 0, 1 + ((rand() * 2) | 0), 1);
    }
    return c;
}
function grassCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(3);
    noiseRect(ctx, 0, 0, 16, 16, [104, 168, 62], 12, rand);
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = rand() < 0.55 ? 'rgba(60,120,40,0.55)' : 'rgba(150,210,100,0.45)';
        ctx.fillRect((rand() * 16) | 0, (rand() * 16) | 0, 1, 1);
    }
    return c;
}
function stoneBrickCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(11);
    noiseRect(ctx, 0, 0, 16, 16, [128, 128, 128], 7, rand);
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 7, 16, 1); ctx.fillRect(0, 15, 16, 1); ctx.fillRect(7, 0, 1, 7); ctx.fillRect(3, 8, 1, 7); ctx.fillRect(11, 8, 1, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1);
    return c;
}
function plankCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(5);
    noiseRect(ctx, 0, 0, 16, 16, [158, 126, 76], 9, rand);
    ctx.fillStyle = '#6e5230';
    [3, 7, 11, 15].forEach(y => ctx.fillRect(0, y, 16, 1));
    [[5, 0], [12, 4], [3, 8], [10, 12]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 3));
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    [0, 4, 8, 12].forEach(y => ctx.fillRect(0, y, 16, 1));
    return c;
}
function logCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(8);
    noiseRect(ctx, 0, 0, 16, 16, [104, 82, 50], 10, rand);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(50,34,16,0.6)'; ctx.fillRect((rand() * 16) | 0, (rand() * 10) | 0, 1, 4 + ((rand() * 6) | 0)); }
    return c;
}
function logTopCanvas() { // טבעות גזע
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i === 0 ? '#665032' : i % 2 ? '#b9945a' : '#9c7a45'; ctx.fillRect(i, i, 16 - 2 * i, 16 - 2 * i); }
    return c;
}
function leavesCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(13);
    for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
        if (rand() < 0.2) continue;
        const g = 95 + rand() * 55;
        ctx.fillStyle = `rgb(${g * 0.4 | 0},${g | 0},${g * 0.28 | 0})`;
        ctx.fillRect(x, y, 1, 1);
    }
    return c;
}

// ===== אייטמים בפיקסל ארט עם קו מתאר כהה (כמו במיינקראפט) =====
function outlineCanvas(c) {
    const ctx = c.getContext('2d'), w = c.width, h = c.height, d = ctx.getImageData(0, 0, w, h).data;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    ctx.fillStyle = '#1c1c1c';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (solid(x, y)) continue;
        let near = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (solid(x + dx, y + dy)) near = true;
        if (near) ctx.fillRect(x, y, 1, 1);
    }
    return c;
}
function pixelsCanvas(list) {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    list.forEach(([col, x, y]) => { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); });
    return c;
}
function swordCanvas() { // חרב ברזל: להב אלכסוני, מגן יד חום-זהב וידית חומה
    const px = [];
    for (let i = 0; i < 9; i++) {
        px.push(['#f4f4f4', 14 - i, 1 + i], ['#c9c9c9', 13 - i, 1 + i]);
        if (i > 0 && i < 8) px.push(['#9a9a9a', 12 - i, 1 + i]);
    }
    [[2, 9], [3, 10], [4, 11], [5, 12], [6, 13]].forEach(([x, y]) => px.push(['#c8a040', x, y], ['#8a6a20', x + 1, y]));
    [[3, 12], [2, 13], [1, 14]].forEach(([x, y]) => px.push(['#7a4a1e', x, y], ['#a0652d', x + 1, y]));
    px.push(['#c8a040', 1, 14]);
    return outlineCanvas(pixelsCanvas(px));
}
function shieldCanvas() { // מגן עץ עם מסגרת ברזל ופטמה במרכז
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    const hw = y => y <= 9 ? 5 : y <= 11 ? 4 : y === 12 ? 3 : y === 13 ? 2 : 1;
    const inS = (x, y) => y >= 1 && y <= 14 && Math.abs(x - 7.5) < hw(y);
    for (let y = 1; y <= 14; y++) for (let x = 0; x < 16; x++) {
        if (!inS(x, y)) continue;
        const edge = !inS(x - 1, y) || !inS(x + 1, y) || !inS(x, y - 1) || !inS(x, y + 1);
        ctx.fillStyle = edge ? (y < 4 ? '#e0e0e0' : '#a8a8a8') : (x % 3 === 0 ? '#8a5a2b' : '#a9733a');
        ctx.fillRect(x, y, 1, 1);
    }
    fillRects(ctx, [['#d6d6d6', 6, 5, 4, 4], ['#8a8a8a', 7, 6, 2, 2], ['#ffffff', 6, 5, 1, 1]]);
    return outlineCanvas(c);
}
function fruitCanvas(base, light, dark) {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    for (let y = 3; y < 15; y++) for (let x = 2; x < 14; x++) {
        const dx = x - 7.5, dy = y - 9;
        if (dx * dx + dy * dy > 27 || (Math.abs(dx) < 1 && y === 3)) continue;
        let col = base;
        if ((dx + 3) ** 2 + (dy + 2.5) ** 2 < 5) col = light; else if (dx + dy > 3.5) col = dark;
        ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
    }
    fillRects(ctx, [['#5a3a1a', 7, 1, 1, 3], ['#3f9a2e', 8, 1, 3, 1], ['#2e7a20', 9, 2, 2, 1]]);
    return outlineCanvas(c);
}
function appleCanvas() { return fruitCanvas('#d62020', '#ff7a70', '#8e1010'); }
function gappleCanvas() { return fruitCanvas('#f2c200', '#fff08a', '#b78400'); }
function steakCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    for (let y = 2; y < 15; y++) for (let x = 1; x < 15; x++) {
        const dx = (x - 7.5) / 6.3, dy = (y - 8) / 5.2, q = dx * dx + dy * dy;
        if (q > 1) continue;
        ctx.fillStyle = q > 0.7 ? '#5e2f12' : (x + y) % 4 === 0 ? '#4a230d' : dx + dy < -0.3 ? '#b5703a' : '#8a4a22';
        ctx.fillRect(x, y, 1, 1);
    }
    fillRects(ctx, [['#f0e6d0', 11, 10, 3, 3], ['#c9bfa8', 12, 11, 1, 1]]);
    return outlineCanvas(c);
}
function breadCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d');
    for (let y = 4; y < 13; y++) for (let x = 1; x < 15; x++) {
        const dx = Math.abs(x - 7.5) / 6.5, dy = Math.abs(y - 8) / 4.3;
        if (dx ** 4 + dy ** 4 > 1) continue;
        ctx.fillStyle = y < 7 ? '#e6b566' : y > 10 ? '#8f5f26' : '#c58a3a';
        ctx.fillRect(x, y, 1, 1);
    }
    fillRects(ctx, [['#a8702d', 5, 6, 1, 3], ['#a8702d', 8, 6, 1, 3], ['#a8702d', 11, 6, 1, 3]]);
    return outlineCanvas(c);
}

// לבבות ואוכל בסגנון מיינקראפט
const HEART = ['.BBB.BBB.', 'BRWRBRRRB', 'BRRRRRRRB', 'BRRRRRRRB', '.BRRRRRB.', '..BRRRB..', '...BRB...', '....B....', '.........'];
const DRUMSTICK = ['.....BBB.', '....BOOOB', '...BOOWOB', '..BOOOOOB', '.BOOOOOB.', 'BTBOOOB..', 'BTTBOB...', '.BTTB....', '..BB.....'];
function iconURL(pattern, pal, mode) { // mode: full | half | empty
    const c = makeCanvas(9, 9), ctx = c.getContext('2d');
    pattern.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        let col = pal[ch];
        if ('RWOTG'.includes(ch) && (mode === 'empty' || (mode === 'half' && x > 4))) col = pal.E;
        ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
    }));
    return c.toDataURL();
}
const HEART_PAL = { B: '#000', R: '#ff1313', W: '#ff9d9d', E: '#3b1010' };
const FOOD_PAL = { B: '#000', O: '#c97a2a', W: '#f0b060', T: '#eee', E: '#3b2a18' };
const heartIcons = ['full', 'half', 'empty'].map(m => iconURL(HEART, HEART_PAL, m));
const foodIcons = ['full', 'half', 'empty'].map(m => iconURL(DRUMSTICK, FOOD_PAL, m));

// עור הזומבי 64x32 (פריסה זהה לסקין של מיינקראפט)
function createZombieSkin() {
    const c = makeCanvas(64, 32), ctx = c.getContext('2d'), rand = mulberry32(21);
    const SKIN = [92, 140, 62], SHIRT = [34, 150, 168], PANTS = [52, 46, 128];
    function box(u, v, w, h, d, rgb) {
        const f = { top: [u + d, v, w, d], bottom: [u + d + w, v, w, d], right: [u, v + d, d, h],
                    front: [u + d, v + d, w, h], left: [u + d + w, v + d, d, h], back: [u + d + w + d, v + d, w, h] };
        for (const k in f) noiseRect(ctx, ...f[k], rgb, 10, rand);
        return f;
    }
    const head = box(0, 0, 8, 8, 8, SKIN);
    box(16, 16, 8, 12, 4, SHIRT);
    const arm = box(40, 16, 4, 12, 4, SKIN);
    ['top', 'right', 'front', 'left', 'back'].forEach(k => { const [x, y, w] = arm[k]; noiseRect(ctx, x, y, w, k === 'top' ? 4 : 4, SHIRT, 10, rand); });
    const leg = box(0, 16, 4, 12, 4, PANTS);
    ['right', 'front', 'left', 'back'].forEach(k => { const [x, y, w, h] = leg[k]; noiseRect(ctx, x, y + h - 2, w, 2, [34, 30, 90], 6, rand); });
    const [fx, fy] = head.front;
    ctx.fillStyle = '#14143c'; ctx.fillRect(fx + 1, fy + 4, 2, 1); ctx.fillRect(fx + 5, fy + 4, 2, 1);
    ctx.fillStyle = '#3c5f2a'; ctx.fillRect(fx + 3, fy + 5, 2, 1);
    ctx.fillStyle = '#2d4623'; ctx.fillRect(fx + 2, fy + 6, 4, 1);
    return toTexture(c);
}

// ===== 3. חומרים =====
const wallMaterial = new THREE.MeshLambertMaterial({ map: toTexture(cobbleCanvas(), 2, 5) });
const brickMaterial = new THREE.MeshLambertMaterial({ map: toTexture(stoneBrickCanvas(), 2, 5) });
const lintelMaterial = new THREE.MeshLambertMaterial({ map: toTexture(stoneBrickCanvas(), 2, 2.3) });
const floorMaterial = new THREE.MeshLambertMaterial({ map: toTexture(grassCanvas(), 2, 2) });
const gateMaterial = new THREE.MeshLambertMaterial({ map: toTexture(gateCanvas(), 2, 4) });
const barsMaterial = new THREE.MeshLambertMaterial({ map: toTexture(barsCanvas(), 3, 3), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
const appleTexture = toTexture(appleCanvas());
const appleMaterial = new THREE.SpriteMaterial({ map: appleTexture });
const zombieSkin = createZombieSkin();

const appleURL = appleCanvas().toDataURL();
const swordURL = swordCanvas().toDataURL();
const iconCanvases = { sword: swordCanvas(), apple: appleCanvas(), bread: breadCanvas(), steak: steakCanvas(), gapple: gappleCanvas(),
    shield: shieldCanvas(), compass: outlineCanvas(compassCanvas()), speed: outlineCanvas(potionCanvas('#7fd1ff')), strength: outlineCanvas(potionCanvas('#c0302a')) };
const iconURLs = {};
Object.keys(iconCanvases).forEach(k => iconURLs[k] = iconCanvases[k].toDataURL());
const iconTex = {};
const plankMat = new THREE.MeshLambertMaterial({ map: toTexture(plankCanvas()) });
const chestFrontMat = new THREE.MeshLambertMaterial({ map: toTexture(chestFrontCanvas()) });
const logSide = new THREE.MeshLambertMaterial({ map: toTexture(logCanvas(), 1, 5) }), logTop = new THREE.MeshLambertMaterial({ map: toTexture(logTopCanvas()) });
const logMat = [logSide, logSide, logTop, logTop, logSide, logSide];
const leafMat = new THREE.MeshLambertMaterial({ map: toTexture(leavesCanvas(), 3, 1), transparent: true, alphaTest: 0.5 });


// ===== 4. מחולל מבוך 25x25 =====
const mazeSize = 25;
const map = Array(mazeSize).fill(0).map(() => Array(mazeSize).fill(1));

function generateMaze(r, c) {
    map[r][c] = 0;
    const dirs = [{ dr: -2, dc: 0 }, { dr: 2, dc: 0 }, { dr: 0, dc: -2 }, { dr: 0, dc: 2 }].sort(() => Math.random() - 0.5);
    for (const d of dirs) {
        const nr = r + d.dr, nc = c + d.dc;
        if (nr > 0 && nr < mazeSize - 1 && nc > 0 && nc < mazeSize - 1 && map[nr][nc] === 1) {
            map[r + d.dr / 2][c + d.dc / 2] = 0;
            generateMaze(nr, nc);
        }
    }
}
generateMaze(1, 1);
map[1][1] = 0;
map[0][1] = 0;
const EXIT_ROW = mazeSize - 1, EXIT_COL = mazeSize - 2;
map[EXIT_ROW][EXIT_COL] = 2;

const BLOCK_SIZE = 2;
const WALL_HEIGHT = 5;
const FLOOR_Y = -0.9;
const wallGeometry = new THREE.BoxGeometry(BLOCK_SIZE, WALL_HEIGHT, BLOCK_SIZE);
const floorGeometry = new THREE.BoxGeometry(BLOCK_SIZE, 0.2, BLOCK_SIZE);

const foodItems = [];
const emptyPathSpots = [];

const OUT_MIN_C = -8, OUT_MAX_C = mazeSize + 8, OUT_MAX_R = mazeSize + 12; // גבולות אזור החוץ
for (let r = -3; r < OUT_MAX_R; r++) {
    for (let c = OUT_MIN_C; c < OUT_MAX_C; c++) {
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(c * BLOCK_SIZE, -1, r * BLOCK_SIZE);
        scene.add(floor);

        if (r < 0) {
            if (c !== 1 && c >= -2 && c < mazeSize + 2) addWall(c, r, wallMaterial);
        } else if (r < mazeSize && c >= 0 && c < mazeSize) {
            if (map[r][c] === 1) {
                const pillar = (r === EXIT_ROW && Math.abs(c - EXIT_COL) === 1) || (r === 0 && Math.abs(c - 1) === 1);
                addWall(c, r, pillar ? brickMaterial : wallMaterial);
            } else if (map[r][c] === 0 && !(r === 0 && c === 1) && !(r === 1 && c === 1)) {
                emptyPathSpots.push({ r, c });
                if (Math.random() < 0.04) {
                    const apple = new THREE.Sprite(appleMaterial);
                    apple.scale.set(0.8, 0.8, 1);
                    apple.position.set(c * BLOCK_SIZE, -0.4, r * BLOCK_SIZE);
                    scene.add(apple);
                    foodItems.push(apple);
                }
            }
        }
    }
}
function addWall(c, r, mat) {
    const w = new THREE.Mesh(wallGeometry, mat);
    w.position.set(c * BLOCK_SIZE, WALL_HEIGHT / 2 - 1, r * BLOCK_SIZE);
    scene.add(w);
}

// שער כניסה (יורד ונסגר אחרי שנכנסים)
let isGateClosing = false, isGateClosed = false;

// ===== 5. שער יציאה: קשת אבן + סורגים שעולים כשמתקרבים + לפידים =====
const GX = EXIT_COL * BLOCK_SIZE, GZ = EXIT_ROW * BLOCK_SIZE;
const lintel = new THREE.Mesh(new THREE.BoxGeometry(2, 2.3, 2), lintelMaterial);
lintel.position.set(GX, 2.85, GZ);
scene.add(lintel);
const DOOR_CLOSED_Y = FLOOR_Y + 1.3, DOOR_OPEN_Y = DOOR_CLOSED_Y + 2.2;
const exitDoor = new THREE.Mesh(new THREE.BoxGeometry(2, 2.6, 0.2), barsMaterial);
exitDoor.position.set(GX, DOOR_CLOSED_Y, GZ);
scene.add(exitDoor);
let exitOpen = false;

function addTorches(cx, cz) {
    [-0.85, 0.85].forEach(dx => {
        const stick = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), new THREE.MeshLambertMaterial({ color: 0x6b4423 }));
        stick.position.set(cx + dx, 0.6, cz - 0.85);
        const flame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), new THREE.MeshBasicMaterial({ color: 0xffaa33 }));
        flame.position.set(cx + dx, 0.98, cz - 0.85);
        const light = new THREE.PointLight(0xffaa55, 1.1, 10);
        light.position.set(cx + dx, 1.2, cz - 1.2);
        scene.add(stick, flame, light);
    });
}
addTorches(GX, GZ);

// שער כניסה: אותו עיצוב כמו שער היציאה, נסגר מאחוריך ואי אפשר לחזור
const ENTRY_X = 1 * BLOCK_SIZE;
const entryLintel = new THREE.Mesh(new THREE.BoxGeometry(2, 2.3, 2), lintelMaterial);
entryLintel.position.set(ENTRY_X, 2.85, 0);
scene.add(entryLintel);
const entryDoor = new THREE.Mesh(new THREE.BoxGeometry(2, 2.6, 0.2), barsMaterial);
entryDoor.position.set(ENTRY_X, DOOR_OPEN_Y, 0);
scene.add(entryDoor);
addTorches(ENTRY_X, 0);

// ===== 5b. עולם בסגנון בטא: עצים, שמש, עננים, תיבות =====
const rng = mulberry32(99);
const treeSpots = [];
const solidBoxes = [];
const CAVE = { x: GX, z0: 62, depth: 6 };
function addTree(x, z) {
    treeSpots.push({ x, z });
    const parts = [
        [new THREE.BoxGeometry(0.9, 5, 0.9), logMat, 2.5], [new THREE.BoxGeometry(3.6, 1.2, 3.6), leafMat, 4.4],
        [new THREE.BoxGeometry(2.4, 1.2, 2.4), leafMat, 5.5], [new THREE.BoxGeometry(1.2, 0.9, 1.2), leafMat, 6.4]];
    parts.forEach(([g, m, y]) => { const mesh = new THREE.Mesh(g, m); mesh.position.set(x, FLOOR_Y + y, z); scene.add(mesh); });
}
for (let r = -3; r < OUT_MAX_R; r++) for (let c = OUT_MIN_C; c < OUT_MAX_C; c++) {
    const outside = r > mazeSize || (r >= 0 && r < mazeSize && (c < 0 || c >= mazeSize));
    const lane = r >= mazeSize && c >= EXIT_COL - 1 && c <= EXIT_COL + 1;
    if (outside && !lane && rng() < 0.2 && !(r >= 29 && r <= 34 && c >= 19 && c <= 27)) addTree(c * BLOCK_SIZE + (rng() - 0.5), r * BLOCK_SIZE + (rng() - 0.5));
}

const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTexture(sunCanvas()), fog: false }));
sun.scale.set(90, 90, 1);
scene.add(sun);
const sunOffset = new THREE.Vector3(250, 300, -450);

const clouds = [];
const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false });
for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(10 + rng() * 14, 1.4, 6 + rng() * 8), cloudMat);
    m.position.set(rng() * 260 - 70, 22 + rng() * 3, rng() * 260 - 70);
    scene.add(m);
    clouds.push(m);
}

// פתח מערה (שלב 2): תל אבן עם מנהרה חשוכה
(function buildCaveMouth() {
    const mat = new THREE.MeshLambertMaterial({ map: toTexture(cobbleCanvas(), 5, 5) });
    const add = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); scene.add(m); };
    const zc = CAVE.z0 + CAVE.depth / 2;
    add(5, 5.5, CAVE.depth, CAVE.x - 3.7, FLOOR_Y + 2.75, zc);
    add(5, 5.5, CAVE.depth, CAVE.x + 3.7, FLOOR_Y + 2.75, zc);
    add(12.4, 2.5, CAVE.depth, CAVE.x, FLOOR_Y + 4.25, zc);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3, 0.2), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    back.position.set(CAVE.x, FLOOR_Y + 1.5, CAVE.z0 + CAVE.depth - 0.1);
    scene.add(back);
    [[CAVE.x - 6.2, CAVE.x - 1.2], [CAVE.x + 1.2, CAVE.x + 6.2]].forEach(([a, b]) => solidBoxes.push({ minX: a, maxX: b, minZ: CAVE.z0, maxZ: CAVE.z0 + CAVE.depth }));
    addTorches(CAVE.x, CAVE.z0 + 0.85);
})();

// תיבות בנקודות מבוי סתום
const chests = [];
function createChest(r, c, forceDir) {
    let dir = forceDir || [0, 1];
    if (!forceDir) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { if (map[r + dr] && map[r + dr][c + dc] === 0) dir = [dr, dc]; });
    const mats = [plankMat, plankMat, plankMat, plankMat, chestFrontMat, plankMat];
    const root = new THREE.Group();
    root.position.set(c * BLOCK_SIZE - dir[1] * 0.55, FLOOR_Y, r * BLOCK_SIZE - dir[0] * 0.55);
    root.rotation.y = Math.atan2(dir[1], dir[0]);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.7), mats);
    base.position.y = 0.225;
    const hinge = new THREE.Group();
    hinge.position.set(0, 0.45, -0.35);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.7), plankMat);
    lid.position.set(0, 0.125, 0.35);
    hinge.add(lid);
    root.add(base, hinge);
    scene.add(root);
    chests.push({ root, hinge, open: false, t: 0 });
}
emptyPathSpots
    .filter(s => s.r + s.c > 6 && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dr, dc]) => map[s.r + dr] && map[s.r + dr][s.c + dc] === 0).length === 1)
    .sort(() => Math.random() - 0.5).slice(0, 8)
    .forEach(s => createChest(s.r, s.c));

// ===== 6. זומבים תלת־ממדיים =====
const PX = 0.06; // פיקסל סקין -> יחידות עולם (גובה זומבי ≈ 1.9)
const ZOMBIE_HP = 20, ZOMBIE_SPEED = 1.8, ZOMBIE_COUNT = 7;
const zombies = [];

function uvBox(w, h, d, u, v) {
    const g = new THREE.BoxGeometry(w * PX, h * PX, d * PX);
    // סדר פאות: +x, -x, +y, -y, +z, -z  (+x = צד שמאל של הדמות כשהיא פונה ל־+z)
    const rects = [[u + d + w, v + d, d, h], [u, v + d, d, h], [u + d, v, w, d], [u + d + w, v, w, d], [u + d, v + d, w, h], [u + d + w + d, v + d, w, h]];
    const uv = g.attributes.uv;
    rects.forEach((r, i) => {
        const u0 = r[0] / 64, u1 = (r[0] + r[2]) / 64, vt = 1 - r[1] / 32, vb = 1 - (r[1] + r[3]) / 32;
        uv.setXY(i * 4, u0, vt); uv.setXY(i * 4 + 1, u1, vt); uv.setXY(i * 4 + 2, u0, vb); uv.setXY(i * 4 + 3, u1, vb);
    });
    uv.needsUpdate = true;
    return g;
}

function createZombie(x, z) {
    const mat = new THREE.MeshLambertMaterial({ map: zombieSkin });
    const root = new THREE.Group();
    root.position.set(x, FLOOR_Y, z);
    const model = new THREE.Group();
    root.add(model);
    const head = new THREE.Group();
    head.position.y = 24 * PX;
    const headMesh = new THREE.Mesh(uvBox(8, 8, 8, 0, 0), mat);
    headMesh.position.y = 4 * PX;
    head.add(headMesh);
    const body = new THREE.Mesh(uvBox(8, 12, 4, 16, 16), mat);
    body.position.y = 18 * PX;
    model.add(head, body);
    const limb = (px, py, u, v, cy) => {
        const piv = new THREE.Group();
        piv.position.set(px, py, 0);
        const m = new THREE.Mesh(uvBox(4, 12, 4, u, v), mat);
        m.position.y = cy;
        piv.add(m);
        model.add(piv);
        return piv;
    };
    const armL = limb(6 * PX, 22 * PX, 40, 16, -4 * PX), armR = limb(-6 * PX, 22 * PX, 40, 16, -4 * PX);
    const legL = limb(2 * PX, 12 * PX, 0, 16, -6 * PX), legR = limb(-2 * PX, 12 * PX, 0, 16, -6 * PX);
    scene.add(root);
    const z0 = { root, model, head, armL, armR, legL, legR, mat, x, z, vx: 0, vz: 0, y: 0, vy: 0,
        hp: ZOMBIE_HP, hurt: 0, stun: 0, dying: false, deathT: 0, phase: Math.random() * 6, attackCd: 0.6, moving: false };
    return z0;
}

emptyPathSpots.sort(() => Math.random() - 0.5);
emptyPathSpots
    .filter(s => Math.abs(s.r - 1) + Math.abs(s.c - 1) > 6)
    .slice(0, ZOMBIE_COUNT)
    .forEach(s => zombies.push(createZombie(s.c * BLOCK_SIZE, s.r * BLOCK_SIZE)));

camera.rotation.order = 'YXZ';
const EYE_Y = 0.8; // גובה העיניים (השחקן ≈ 1.7 מעל הרצפה)
camera.position.set(1 * BLOCK_SIZE, EYE_Y, -2.5 * BLOCK_SIZE);

// מציאת דרך: מרחק (בתאים) מהשחקן לכל תא במבוך
let distField = null, lastCell = '';
function computeField(pr, pc) {
    const f = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(Infinity));
    if (pr < 0 || pc < 0 || pr >= mazeSize || pc >= mazeSize) return f;
    f[pr][pc] = 0;
    const q = [[pr, pc]];
    while (q.length) {
        const [r, c] = q.shift();
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nc >= 0 && nr < mazeSize && nc < mazeSize && map[nr][nc] === 0 && f[nr][nc] === Infinity) {
                f[nr][nc] = f[r][c] + 1;
                q.push([nr, nc]);
            }
        }
    }
    return f;
}

// ===== 7. ממשק בסגנון בטא: הוטבר, לבבות, אוכל, שריון, כוונת, מיני־מפה =====
const css = document.createElement('style');
css.textContent = `
body{font-family:'Courier New',monospace}
#hud{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;direction:ltr;user-select:none;pointer-events:none}
#itemName{color:#fff;font-weight:bold;font-size:18px;text-shadow:2px 2px #000;height:22px;opacity:0;transition:opacity .4s}
#armor{align-self:flex-start}
#stats{display:flex;justify-content:space-between;width:100%}
.irow{display:flex}.irow.rev{flex-direction:row-reverse}
.irow img{width:var(--ico);height:var(--ico);image-rendering:pixelated}
#hotbar{display:flex;background:rgba(0,0,0,.55);border:4px solid #1b1b1b}
.slot{width:var(--slot);height:var(--slot);box-sizing:border-box;border:3px solid;border-color:#373737 #dcdcdc #dcdcdc #373737;background:rgba(110,110,110,.55);position:relative;display:flex;align-items:center;justify-content:center}
.slot.sel{outline:5px solid #fff;outline-offset:-3px;z-index:2;background:rgba(160,160,160,.6)}
.slot img{width:72%;height:72%;image-rendering:pixelated}
.slot .n{position:absolute;top:1px;left:4px;color:#ddd;font-size:calc(var(--slot)*.2);text-shadow:1px 1px #000}
.slot .cnt{position:absolute;bottom:0;right:4px;color:#fff;font-weight:bold;font-size:calc(var(--slot)*.3);text-shadow:2px 2px #000}
#cross{position:absolute;top:50%;left:50%;width:22px;height:22px;transform:translate(-50%,-50%);pointer-events:none;mix-blend-mode:difference}
#cross:before,#cross:after{content:'';position:absolute;background:#fff}
#cross:before{left:10px;top:0;width:2px;height:22px}#cross:after{top:10px;left:0;height:2px;width:22px}
#flash{position:absolute;inset:0;background:#f00;opacity:0;pointer-events:none}
#prompt,#loot{position:absolute;left:50%;transform:translateX(-50%);color:#fff;font-weight:bold;text-shadow:2px 2px #000;text-align:center;pointer-events:none}
#prompt{top:58%;font-size:20px;display:none}
#loot{top:30%;font-size:24px;color:#ffd24a;opacity:0;transition:opacity .4s;line-height:1.5}
#lockHint{position:absolute;top:45%;left:50%;transform:translateX(-50%);color:#fff;font-size:22px;font-weight:bold;text-shadow:2px 2px #000;background:rgba(0,0,0,.5);padding:8px 14px;pointer-events:none}
#fx{position:absolute;top:165px;left:15px;color:#fff;font-weight:bold;font-size:15px;text-shadow:2px 2px #000;pointer-events:none}
`;
document.head.appendChild(css);

const hud = document.createElement('div');
hud.id = 'hud';
hud.innerHTML = `<div id="itemName"></div><div class="irow" id="armor"></div><div id="stats"><div class="irow" id="hearts"></div><div class="irow rev" id="food"></div></div><div id="hotbar"></div>`;
document.body.appendChild(hud);
document.body.insertAdjacentHTML('beforeend', '<div id="cross"></div><div id="flash"></div><div id="prompt">E / קליק ימני: לפתוח תיבה</div><div id="loot"></div><div id="fx"></div><div id="lockHint">לחץ על המסך כדי לשלוט בעכבר</div>');

const ARMOR_PAT = ['.BBB.BBB.', 'BGGGBGGGB', 'BGGGGGGGB', '.BGGGGGB.', '.BGGGGGB.', '.BGGGGGB.', '.BGGGGGB.', '..BBBBB..', '.........'];
const ARMOR_PAL = { B: '#000', G: '#d8d8d8', E: '#3a3a3a' };
const armorIcons = ['full', 'half', 'empty'].map(m => iconURL(ARMOR_PAT, ARMOR_PAL, m));

const heartsEl = document.getElementById('hearts'), foodEl = document.getElementById('food'), armorEl = document.getElementById('armor');
for (let i = 0; i < 10; i++) { heartsEl.appendChild(new Image()); foodEl.appendChild(new Image()); armorEl.appendChild(new Image()); }

// ===== אייטמים =====
const ITEMS = {
    sword: { name: 'חרב ברזל (ימני: חסימה, שמאלי על עפרה: כרייה)' },
    apple: { name: 'תפוח', use: 'eat', food: 30, heal: 25, crumb: '#cc0000' },
    bread: { name: 'לחם', use: 'eat', food: 35, heal: 5, crumb: '#c68a3b' },
    steak: { name: 'סטייק', use: 'eat', food: 55, heal: 10, crumb: '#8a4a22' },
    gapple: { name: 'תפוח זהב', use: 'eat', food: 20, heal: 60, crumb: '#ffd700' },
    shield: { name: 'מגן (החזק קליק ימני)' },
    compass: { name: 'מצפן (חץ ליציאה במפה)' },
    speed: { name: 'שיקוי מהירות', use: 'drink', crumb: '#7fd1ff' },
    strength: { name: 'שיקוי כוח', use: 'drink', crumb: '#c0302a' }
};
const ARMOR = { helmet: { name: 'קסדת ברזל', pts: 2 }, chest: { name: 'שריון חזה מברזל', pts: 6 },
    legs: { name: 'מכנסי ברזל', pts: 5 }, boots: { name: 'מגפי ברזל', pts: 2 } };
const armorOwned = {};
const armorPts = () => Object.keys(armorOwned).reduce((a, k) => a + ARMOR[k].pts, 0);

const hotbar = [{ id: 'sword', n: 1 }, null, null, null, null, null, null, null, null];
const hotbarEl = document.getElementById('hotbar');
const slotEls = hotbar.map((item, i) => {
    const el = document.createElement('div');
    el.className = 'slot';
    el.innerHTML = `<span class="n">${i + 1}</span><img style="display:none"><span class="cnt"></span>`;
    hotbarEl.appendChild(el);
    return el;
});

function layoutHud() {
    const slotSize = Math.max(36, Math.min(72, Math.floor((window.innerWidth - 30) / 9.5)));
    document.documentElement.style.setProperty('--slot', slotSize + 'px');
    document.documentElement.style.setProperty('--ico', Math.round(slotSize * 0.42) + 'px');
}
layoutHud();

// חפץ מוחזק
const heldItem = document.createElement('div');
Object.assign(heldItem.style, { position: 'absolute', bottom: '10px', right: '30px', width: 'min(30vmin,260px)', height: 'min(30vmin,260px)',
    backgroundSize: 'contain', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated', transformOrigin: 'bottom right', pointerEvents: 'none',
    filter: 'drop-shadow(5px 5px 0 rgba(0,0,0,.45))' });
document.body.appendChild(heldItem);

// מיני מפה (למעלה משמאל)
const minimapCanvas = makeCanvas(130, 130);
Object.assign(minimapCanvas.style, { position: 'absolute', top: '15px', left: '15px', border: '3px solid #fff', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,.7)' });
document.body.appendChild(minimapCanvas);
const minimapCtx = minimapCanvas.getContext('2d');

const statusMsg = document.createElement('div');
Object.assign(statusMsg.style, { position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '40px', color: '#ff0',
    fontWeight: 'bold', textShadow: '3px 3px #000', display: 'none', textAlign: 'center' });
document.body.appendChild(statusMsg);

function showAlert(text, color = '#ff3333') {
    const a = document.createElement('div');
    Object.assign(a.style, { position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '30px', color,
        fontWeight: 'bold', textShadow: '2px 2px #000', pointerEvents: 'none' });
    a.textContent = text;
    document.body.appendChild(a);
    setTimeout(() => a.remove(), 3000);
}

// ===== 8. מצב משחק =====
const keys = {};
let health = 100, food = 100, gameOver = false;
let selSlot = 0, attackCd = 0, swingT = 0, flashA = 0, hurtTilt = 0, bobPhase = 0, equipT = 0, blockT = 0;
let py = 0, pvy = 0, speedT = 0, strengthT = 0, rmbDown = false, use = null, crumbT = 0, hudKey = '', fxKey = '';
let escaped = false;
const pops = [];
const U = () => Math.min(window.innerWidth, window.innerHeight) / 100;
const hasItem = id => hotbar.some(h => h && h.id === id);
const blockingNow = () => rmbDown && hotbar[selSlot] && (hotbar[selSlot].id === 'shield' || hotbar[selSlot].id === 'sword');

function refreshHotbar() {
    slotEls.forEach((el, i) => {
        el.classList.toggle('sel', i === selSlot);
        const item = hotbar[i], img = el.querySelector('img');
        img.style.display = item ? 'block' : 'none';
        if (item) img.src = iconURLs[item.id];
        el.querySelector('.cnt').textContent = item && item.n > 1 ? item.n : '';
    });
    const cur = hotbar[selSlot];
    heldItem.style.backgroundImage = cur ? `url(${iconURLs[cur.id]})` : 'none';
}
refreshHotbar();

function selectSlot(i) {
    if (i === selSlot) return;
    use = null;
    selSlot = i;
    equipT = 1;
    refreshHotbar();
    const nameEl = document.getElementById('itemName');
    nameEl.textContent = hotbar[i] ? ITEMS[hotbar[i].id].name : '';
    nameEl.style.opacity = hotbar[i] ? 1 : 0;
    clearTimeout(selectSlot.t);
    selectSlot.t = setTimeout(() => nameEl.style.opacity = 0, 1500);
}

function addItem(id, n = 1) {
    let slot = hotbar.findIndex(h => h && h.id === id);
    if (slot >= 0 && ITEMS[id].use) { hotbar[slot].n += n; refreshHotbar(); return true; }
    if (slot >= 0) return true;
    slot = hotbar.findIndex(h => !h);
    if (slot < 0) return false;
    hotbar[slot] = { id, n };
    refreshHotbar();
    return true;
}

function updateStatsUI() {
    const hh = Math.ceil(health / 5), ff = Math.ceil(food / 5), ap = armorPts();
    const key = hh + ',' + ff + ',' + ap;
    if (key === hudKey) return;
    hudKey = key;
    const pick = (v, i) => v >= 2 * i + 2 ? 0 : v === 2 * i + 1 ? 1 : 2;
    [...heartsEl.children].forEach((img, i) => { img.src = heartIcons[pick(hh, i)]; });
    [...foodEl.children].forEach((img, i) => { img.src = foodIcons[pick(ff, i)]; });
    [...armorEl.children].forEach((img, i) => { img.src = armorIcons[pick(ap, i)]; });
    armorEl.style.visibility = ap > 0 ? 'visible' : 'hidden';
}

function endGame(msg) {
    gameOver = true;
    use = null;
    statusMsg.innerHTML = msg + '<div style="font-size:20px;margin-top:10px">R - להתחיל מחדש</div>';
    statusMsg.style.display = 'block';
}

// ===== שימוש באוכל / שיקויים (עם אנימציית אכילה) =====
function startUse(any) {
    if (use || gameOver) return;
    let i = selSlot;
    if (!hotbar[i] || !ITEMS[hotbar[i].id].use) {
        if (!any) return;
        i = hotbar.findIndex(h => h && ITEMS[h.id].use === 'eat');
        if (i < 0) return;
        selectSlot(i);
    }
    const it = ITEMS[hotbar[i].id];
    if (it.use === 'eat' && health >= 100 && food >= 100) return;
    use = { slot: i, id: hotbar[i].id, t: 0, dur: it.use === 'eat' ? 1.3 : 1.0 };
    crumbT = 0;
}

function crumb(color) {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'absolute', left: (window.innerWidth / 2 + Math.random() * 50 - 25) + 'px', top: (window.innerHeight * 0.6) + 'px',
        width: '8px', height: '8px', background: color, pointerEvents: 'none' });
    document.body.appendChild(d);
    d.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.random() * 90 - 45}px,${70 + Math.random() * 70}px)`, opacity: 0 }], { duration: 550 }).onfinish = () => d.remove();
}

function finishUse() {
    const it = ITEMS[use.id], item = hotbar[use.slot];
    if (it.use === 'eat') { food = Math.min(100, food + it.food); health = Math.min(100, health + it.heal); }
    else if (use.id === 'speed') speedT = 40;
    else if (use.id === 'strength') strengthT = 40;
    if (item && --item.n <= 0) hotbar[use.slot] = null;
    use = null;
    refreshHotbar();
}

// ===== תיבות =====
const nearChest = () => chests.find(c => !c.open && Math.hypot(c.root.position.x - camera.position.x, c.root.position.z - camera.position.z) < 2.2);

function rollLoot() {
    const pool = [];
    Object.keys(ARMOR).forEach(k => { if (!armorOwned[k]) pool.push({ k, w: 3, armor: true }); });
    [['apple', 4, 2], ['bread', 4, 2], ['steak', 3, 1], ['gapple', 1.5, 1], ['speed', 2, 1], ['strength', 2, 1]].forEach(([k, w, q]) => pool.push({ k, w, q }));
    if (!hasItem('shield')) pool.push({ k: 'shield', w: 2.5, q: 1 });
    if (!hasItem('compass')) pool.push({ k: 'compass', w: 2, q: 1 });
    const picks = [], n = 2 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < n && pool.length; i++) {
        let r = Math.random() * pool.reduce((a, p) => a + p.w, 0), idx = 0;
        for (; idx < pool.length - 1; idx++) { r -= pool[idx].w; if (r <= 0) break; }
        picks.push(pool.splice(idx, 1)[0]);
    }
    return picks;
}

function openChest(c) {
    c.open = true;
    const lines = [];
    rollLoot().forEach(p => {
        if (p.armor) { armorOwned[p.k] = true; lines.push(ARMOR[p.k].name); return; }
        if (!addItem(p.k, p.q)) { lines.push(ITEMS[p.k].name + ' (ההוטבר מלא)'); return; }
        lines.push(ITEMS[p.k].name + (p.q > 1 ? ' x' + p.q : ''));
        iconTex[p.k] = iconTex[p.k] || toTexture(iconCanvases[p.k]);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex[p.k], transparent: true }));
        s.scale.set(0.6, 0.6, 1);
        s.position.set(c.root.position.x + (Math.random() - 0.5) * 0.4, FLOOR_Y + 0.7, c.root.position.z + (Math.random() - 0.5) * 0.4);
        scene.add(s);
        pops.push({ s, t: 0 });
    });
    const el = document.getElementById('loot');
    el.innerHTML = 'מצאת בתיבה:<br>' + lines.join('<br>');
    el.style.opacity = 1;
    clearTimeout(openChest.t);
    openChest.t = setTimeout(() => el.style.opacity = 0, 3500);
}

function interact() {
    const c = nearChest();
    if (c) openChest(c); else startUse(true);
}

function damagePlayer(amount, zx, zz) {
    const fx = -Math.sin(camera.rotation.y), fz = -Math.cos(camera.rotation.y);
    const dx = zx - camera.position.x, dz = zz - camera.position.z, d = Math.hypot(dx, dz) || 1;
    const blocked = blockingNow() && (dx * fx + dz * fz) / d > 0.2;
    if (blocked) amount *= hotbar[selSlot].id === 'shield' ? 0.1 : 0.5;
    amount *= 1 - Math.min(0.8, armorPts() * 0.04);
    health -= amount;
    flashA = blocked ? 0.15 : 0.55;
    hurtTilt = (Math.random() < 0.5 ? -1 : 1) * (blocked ? 0.04 : 0.12);
    use = null;
    if (health <= 0) { health = 0; endGame('הזומבי תפס אותך! המשחק הסתיים 🧟‍♂️'); }
    return blocked;
}

function hitZombie(z, dmg) {
    z.hp -= dmg;
    z.hurt = 0.35;
    z.stun = 0.45;
    const dx = z.x - camera.position.x, dz = z.z - camera.position.z, d = Math.hypot(dx, dz) || 1;
    z.vx = (dx / d) * 10;
    z.vz = (dz / d) * 10;
    z.vy = 3.2;
    if (z.hp <= 0) { z.dying = true; z.deathT = 0; }
}

function swingSwordAndAttack() {
    if (gameOver || attackCd > 0 || blockingNow()) return;
    use = null;
    attackCd = 0.4;
    swingT = 1;
    const sword = hotbar[selSlot] && hotbar[selSlot].id === 'sword';
    let dmg = sword ? 6 : 1;
    if (strengthT > 0) dmg *= 1.5;
    if (py > 0.15 && pvy < 0) dmg *= 1.5; // מכה קריטית בנפילה
    const fx = -Math.sin(camera.rotation.y), fz = -Math.cos(camera.rotation.y);
    let best = null, bestD = 3.0;
    zombies.forEach(z => {
        if (z.dying) return;
        const dx = z.x - camera.position.x, dz = z.z - camera.position.z, d = Math.hypot(dx, dz);
        if (d < bestD && (dx * fx + dz * fz) / (d || 1) > 0.6) { best = z; bestD = d; }
    });
    if (best) hitZombie(best, dmg); else mineAhead();
}

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyE') interact();
    if (e.code === 'KeyR' && gameOver) location.reload();
    if (/^Digit[1-9]$/.test(e.code)) selectSlot(+e.code.slice(5) - 1);
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousedown', e => {
    if (!locked()) return;
    if (e.button === 0) swingSwordAndAttack();
    if (e.button === 2) {
        rmbDown = true;
        const c = nearChest();
        if (c) openChest(c); else if (!blockingNow()) startUse(false);
    }
});
window.addEventListener('mouseup', e => { if (e.button === 2) rmbDown = false; });
window.addEventListener('contextmenu', e => e.preventDefault());
const canvasEl = renderer.domElement;
const locked = () => document.pointerLockElement === canvasEl;
canvasEl.addEventListener('click', () => { if (!locked() && !gameOver) canvasEl.requestPointerLock(); });
window.addEventListener('mousemove', e => {
    if (!locked() || gameOver) return;
    camera.rotation.y -= e.movementX * 0.0022;
    camera.rotation.x = Math.max(-1.2, Math.min(1.2, camera.rotation.x - e.movementY * 0.0022));
});
window.addEventListener('wheel', e => selectSlot((selSlot + (e.deltaY > 0 ? 1 : 8)) % 9));

// ===== 9. התנגשויות =====
function checkPosition(x, z, forZombie = false) {
    const radius = 0.4;
    for (const t of treeSpots) if (Math.hypot(x - t.x, z - t.z) < 0.85) return 'wall';
    for (const b of solidBoxes) if (x + 0.4 > b.minX && x - 0.4 < b.maxX && z + 0.4 > b.minZ && z - 0.4 < b.maxZ) return 'wall';
    const pts = [[x + radius, z + radius], [x - radius, z + radius], [x + radius, z - radius], [x - radius, z - radius]];
    for (const [px, pz] of pts) {
        const col = Math.round(px / BLOCK_SIZE), row = Math.round(pz / BLOCK_SIZE);
        if (stage === 1 && (row >= OUT_MAX_R - 1 || col <= OUT_MIN_C || col >= OUT_MAX_C - 1)) return 'wall';
        if (row < 0) { if (col !== 1) return 'wall'; continue; }
        if (isGateClosed && pz < -0.2) return 'wall';
        if (row < map.length && col >= 0 && col < map[0].length) {
            const v = map[row][col];
            if (v === 1) return 'wall';
            if (v === 2 && (forZombie || !exitOpen)) return 'wall';
        } else if (stage === 2) {
            const v = cellAt(row, col);
            if (v === -1 || v === 1) return 'wall';
        }
    }
    return 'free';
}

function moveEntity(e, dx, dz, forZombie) {
    if (checkPosition(e.x + dx, e.z, forZombie) === 'free') e.x += dx;
    if (checkPosition(e.x, e.z + dz, forZombie) === 'free') e.z += dz;
}

// ===== 10. עדכון זומבים =====
function updateZombie(z, dt, t, playerInside) {
    if (z.dying) {
        z.deathT += dt;
        z.model.rotation.x = -Math.min(1, z.deathT / 0.4) * Math.PI / 2;
        z.mat.emissive.setRGB(Math.max(0, 0.6 - z.deathT), 0, 0);
        return;
    }
    z.hurt = Math.max(0, z.hurt - dt);
    z.stun = Math.max(0, z.stun - dt);
    z.attackCd -= dt;
    z.mat.emissive.setRGB(z.hurt / 0.35 * 0.7, 0, 0);
    z.model.rotation.x = -z.hurt / 0.35 * 0.35;

    if (Math.abs(z.vx) + Math.abs(z.vz) > 0.1) {
        moveEntity(z, z.vx * dt, z.vz * dt, true);
        const f = Math.exp(-6 * dt);
        z.vx *= f; z.vz *= f;
    }
    if (z.y > 0 || z.vy > 0) {
        z.y += z.vy * dt; z.vy -= 18 * dt;
        if (z.y <= 0) { z.y = 0; z.vy = 0; }
    }

    if (z.kind === 'skeleton') return updateSkeleton(z, dt);
    if (z.kind === 'spider') return updateSpider(z, dt);
    const dxp = camera.position.x - z.x, dzp = camera.position.z - z.z, dist = Math.hypot(dxp, dzp);
    const zr = Math.round(z.z / BLOCK_SIZE), zc = Math.round(z.x / BLOCK_SIZE);
    const fv = distField && zr >= 0 && zc >= 0 && zr < mazeSize && zc < mazeSize ? distField[zr][zc] : Infinity;
    z.moving = false;

    if (playerInside && z.stun <= 0 && (fv <= 10 || dist < 3)) {
        let tx = camera.position.x, tz = camera.position.z;
        if (dist >= 2.2 && fv > 0) {
            let best = fv, bc = null;
            for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nr = zr + dr, nc = zc + dc;
                if (nr >= 0 && nc >= 0 && nr < mazeSize && nc < mazeSize && distField[nr][nc] < best) { best = distField[nr][nc]; bc = [nr, nc]; }
            }
            if (bc) { tx = bc[1] * BLOCK_SIZE; tz = bc[0] * BLOCK_SIZE; }
        }
        const dx = tx - z.x, dz = tz - z.z, d = Math.hypot(dx, dz) || 1;
        z.root.rotation.y = Math.atan2(dxp, dzp);
        if (dist > 0.9) {
            moveEntity(z, (dx / d) * ZOMBIE_SPEED * dt, (dz / d) * ZOMBIE_SPEED * dt, true);
            z.moving = true;
        }
        if (dist < 1.3 && z.attackCd <= 0 && py < 0.9) {
            z.attackCd = 0.9;
            if (damagePlayer(10, z.x, z.z)) { z.vx = -(dxp / dist) * 7; z.vz = -(dzp / dist) * 7; z.stun = 0.4; }
        }
    }

    zombies.forEach(o => {
        if (o === z || o.dying) return;
        const dx = z.x - o.x, dz = z.z - o.z, d = Math.hypot(dx, dz);
        if (d < 0.8 && d > 0.001) moveEntity(z, (dx / d) * (0.8 - d) * 0.5, (dz / d) * (0.8 - d) * 0.5, true);
    });

    z.phase += z.moving ? dt * 7 : dt * 1.5;
    const sw = z.moving ? 0.7 : 0.05;
    z.legL.rotation.x = Math.sin(z.phase) * sw;
    z.legR.rotation.x = -Math.sin(z.phase) * sw;
    z.armL.rotation.x = -Math.PI / 2 + Math.sin(z.phase * 0.7) * 0.1;
    z.armR.rotation.x = -Math.PI / 2 - Math.sin(z.phase * 0.7) * 0.1;
    z.root.position.set(z.x, FLOOR_Y + z.y, z.z);
}

// ===== 11. מיני מפה =====
function drawMinimap() {
    minimapCtx.clearRect(0, 0, 130, 130);
    const pc = camera.position.x / BLOCK_SIZE, pr = camera.position.z / BLOCK_SIZE;
    const range = stage === 2 ? 5 : 4, tile = 130 / (range * 2 + 1);
    for (let r = -range; r <= range; r++) for (let c = -range; c <= range; c++) {
        const mr = Math.round(pr + r), mc = Math.round(pc + c);
        let col = null;
        if (stage === 2) { // מפת מערה: אבן, עפרות, לבה ושער
            const v = cellAt(mr, mc);
            if (v === 1) { const o = ores.get(mr + ',' + mc); col = o ? o.type.color : '#6e6e6e'; }
            else if (v === 0) col = '#262626'; else if (v === 2) col = '#a07840'; else if (v === 3) col = '#e25822';
        } else if (mr >= 0 && mr < map.length && mc >= 0 && mc < map[0].length) {
            col = map[mr][mc] === 1 ? '#616161' : map[mr][mc] === 2 ? '#ffaa00' : '#488528';
        }
        if (col) { minimapCtx.fillStyle = col; minimapCtx.fillRect((c + range) * tile, (r + range) * tile, tile, tile); }
    }
    const dot = (wx, wz, col, sz = 3) => {
        const x = (wx / BLOCK_SIZE - pc + range + 0.5) * tile, y = (wz / BLOCK_SIZE - pr + range + 0.5) * tile;
        if (x > 0 && x < 130 && y > 0 && y < 130) { minimapCtx.fillStyle = col; minimapCtx.fillRect(x - sz, y - sz, sz * 2, sz * 2); }
    };
    if (stage === 2) torches.forEach(t => dot(t.x, t.z, '#ffb030', 1.5));
    chests.forEach(c => { if (!c.open) dot(c.root.position.x, c.root.position.z, '#ffd24a'); });
    zombies.forEach(z => { if (!z.dying) dot(z.x, z.z, z.kind === 'skeleton' ? '#e0e0e0' : z.kind === 'spider' ? '#c04030' : '#4caf50'); });
    minimapCtx.fillStyle = '#f00';
    minimapCtx.beginPath(); minimapCtx.arc(65, 65, 5, 0, Math.PI * 2); minimapCtx.fill();
    minimapCtx.strokeStyle = '#ff0'; minimapCtx.lineWidth = 2;
    minimapCtx.beginPath(); minimapCtx.moveTo(65, 65);
    minimapCtx.lineTo(65 - Math.sin(camera.rotation.y) * 12, 65 - Math.cos(camera.rotation.y) * 12);
    minimapCtx.stroke();
    if (hasItem('compass')) { // מצפן: חץ ליעד (שער, ואז משואה במערה הגדולה)
        const goal = stage === 2 && camera.position.z > GZ + 1 ? BEACON : { x: GX, z: GZ };
        const dx = goal.x - camera.position.x, dz = goal.z - camera.position.z, d = Math.hypot(dx, dz) || 1;
        minimapCtx.fillStyle = '#00e5ff';
        minimapCtx.beginPath(); minimapCtx.arc(65 + dx / d * 52, 65 + dz / d * 52, 6, 0, Math.PI * 2); minimapCtx.fill();
    }
}

// ===== 13. שלב 2: המערה =====
let stage = 1;
const torches = [], torchLights = [], arrows = [];
const arrowMat = new THREE.MeshLambertMaterial({ color: 0x8b6b3a });

function caveStoneCanvas() {
    const c = makeCanvas(16, 16), ctx = c.getContext('2d'), rand = mulberry32(31);
    noiseRect(ctx, 0, 0, 16, 16, [112, 112, 112], 9, rand);
    ctx.fillStyle = 'rgba(55,55,55,0.55)';
    for (let i = 0; i < 14; i++) ctx.fillRect((rand() * 16) | 0, (rand() * 16) | 0, 1, 1);
    return c;
}
function flameCanvas() {
    const c = makeCanvas(8, 8);
    fillRects(c.getContext('2d'), [['#ff4a00', 3, 0, 2, 1], ['#ff7a00', 2, 1, 4, 2], ['#ffb000', 2, 3, 4, 3], ['#ffe36a', 3, 4, 2, 3]]);
    return c;
}
const flameTex = toTexture(flameCanvas());

const ORE_TYPES = [
    { id: 'coal', name: 'פחם', color: '#2b2b2b', blob: [40, 40, 40], hits: 2, w: 45 },
    { id: 'iron', name: 'ברזל', color: '#d8af93', blob: [216, 175, 147], hits: 3, w: 25 },
    { id: 'gold', name: 'זהב', color: '#fcee4b', blob: [252, 238, 75], hits: 3, w: 12 },
    { id: 'redstone', name: 'רדסטון', color: '#c81414', blob: [200, 20, 20], hits: 3, w: 10 },
    { id: 'diamond', name: 'יהלום', color: '#5decf5', blob: [93, 236, 245], hits: 4, w: 8 }];
const oreCount = {};
ORE_TYPES.forEach(o => oreCount[o.id] = 0);
const ores = new Map();
let cavGrid = [], caveDoor = null;
const CAV_ROWS = 20;
const BEACON = { x: 12 * BLOCK_SIZE, z: (mazeSize + 17) * BLOCK_SIZE };

const oreEl = document.createElement('div');
Object.assign(oreEl.style, { position: 'absolute', left: '15px', bottom: '15px', color: '#fff', fontWeight: 'bold', fontSize: '15px',
    textShadow: '2px 2px #000', pointerEvents: 'none', display: 'none', direction: 'ltr' });
document.body.appendChild(oreEl);
function updateOreHud() {
    oreEl.innerHTML = ORE_TYPES.map(o => `<div><span style="display:inline-block;width:14px;height:14px;background:${o.color};border:2px solid #000;vertical-align:middle"></span> ${o.name}: ${oreCount[o.id]}</div>`).join('');
}
function cellAt(r, c) { // -1 = מחוץ לעולם
    if (c < 0 || c >= mazeSize || r < 0) return -1;
    if (r < mazeSize) return map[r][c];
    const row = cavGrid[r - mazeSize];
    return row ? row[c] : -1;
}
function pickOre() {
    let x = Math.random() * ORE_TYPES.reduce((a, o) => a + o.w, 0);
    for (const o of ORE_TYPES) { x -= o.w; if (x <= 0) return o; }
    return ORE_TYPES[0];
}
function makeMats(ry) {
    const mk = cv => new THREE.MeshLambertMaterial({ map: toTexture(cv, 2, ry) });
    return { stone: mk(stoneCanvas()), cobble: mk(cobbleCanvas()), ore: ORE_TYPES.map((o, i) => mk(oreCanvas(o.blob, 100 + i * 7))) };
}

// כרייה: מכה בעפרה שמולך (קליק שמאלי)
function mineAhead() {
    if (stage !== 2) return;
    const fx = -Math.sin(camera.rotation.y), fz = -Math.cos(camera.rotation.y);
    for (let d = 0.5; d <= 3.0; d += 0.25) {
        const r = Math.round((camera.position.z + fz * d) / BLOCK_SIZE), c = Math.round((camera.position.x + fx * d) / BLOCK_SIZE);
        const key = r + ',' + c, ore = ores.get(key);
        if (ore) {
            ore.hp--;
            for (let k = 0; k < 3; k++) crumb(ore.type.color);
            if (ore.hp <= 0) breakOre(key, ore);
            return;
        }
        const v = cellAt(r, c);
        if (v !== 0 && v !== 3) return;
    }
}
function breakOre(key, ore) {
    scene.remove(ore.mesh);
    ores.delete(key);
    const [r, c] = key.split(',').map(Number);
    if (r < mazeSize) map[r][c] = 0; else cavGrid[r - mazeSize][c] = 0;
    lastCell = '';
    const id = ore.type.id;
    oreCount[id]++;
    updateOreHud();
    if (id === 'coal') food = Math.min(100, food + 8);
    else if (id === 'iron') health = Math.min(100, health + 10);
    else if (id === 'gold') { health = Math.min(100, health + 20); food = Math.min(100, food + 10); }
    else if (id === 'redstone') speedT += 15;
    else { strengthT += 25; health = Math.min(100, health + 15); }
    showAlert('קיבלת ' + ore.type.name + '!', id === 'coal' ? '#bbbbbb' : ore.type.color);
}

function startCave() {
    stage = 2; escaped = false; exitOpen = false; use = null;
    [...scene.children].forEach(o => scene.remove(o));
    zombies.length = 0; chests.length = 0; foodItems.length = 0; pops.length = 0; clouds.length = 0; treeSpots.length = 0; solidBoxes.length = 0;
    ores.clear(); ORE_TYPES.forEach(o => oreCount[o.id] = 0);
    scene.background = new THREE.Color(0x030303);
    scene.fog = new THREE.FogExp2(0x030303, 0.055);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    // מבוך מנהרות חדש
    for (let r = 0; r < mazeSize; r++) map[r].fill(1);
    generateMaze(1, 1);
    map[EXIT_ROW][EXIT_COL] = 2;
    const M5 = makeMats(5), M8 = makeMats(8), tallGeo = new THREE.BoxGeometry(BLOCK_SIZE, 7.9, BLOCK_SIZE);
    const solid = (r, c, tall, oreType) => {
        const M = tall ? M8 : M5;
        let mat = M.stone;
        if (oreType) mat = M.ore[ORE_TYPES.indexOf(oreType)]; else if (Math.random() < 0.15) mat = M.cobble;
        const m = new THREE.Mesh(tall ? tallGeo : wallGeometry, mat);
        m.position.set(c * BLOCK_SIZE, tall ? FLOOR_Y + 3.95 : WALL_HEIGHT / 2 - 1, r * BLOCK_SIZE);
        scene.add(m);
        if (oreType) ores.set(r + ',' + c, { mesh: m, type: oreType, hp: oreType.hits });
    };
    for (let r = 0; r < mazeSize; r++) for (let c = 0; c < mazeSize; c++) if (map[r][c] === 1) {
        const border = r === 0 || r === mazeSize - 1 || c === 0 || c === mazeSize - 1;
        solid(r, c, false, !border && Math.random() < 0.07 ? pickOre() : null);
    }
    for (let c = 0; c < mazeSize; c++) { // השלמת קיר הצפון של המערה הגדולה עד התקרה
        if (map[EXIT_ROW][c] === 1 || c === EXIT_COL) {
            const f = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_SIZE, 3, BLOCK_SIZE), M5.stone);
            f.position.set(c * BLOCK_SIZE, 5.5, EXIT_ROW * BLOCK_SIZE);
            scene.add(f);
        }
    }

    // רצפות ותקרות: מבוך (נמוכה) ומערה גדולה (גבוהה)
    const slab = (w, h, cx, cz, y, rx) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: toTexture(stoneCanvas(), w, h), color: 0xc8c8c8 }));
        m.rotation.x = rx; m.position.set(cx, y, cz); scene.add(m);
    };
    slab(54, 54, 24, 24, FLOOR_Y, -Math.PI / 2); slab(54, 54, 24, 24, WALL_HEIGHT - 1, Math.PI / 2);
    slab(54, 44, 24, 69, FLOOR_Y, -Math.PI / 2); slab(54, 44, 24, 69, 7, Math.PI / 2);

    // שער ברזל ביציאה מהמבוך
    const lintelC = new THREE.Mesh(new THREE.BoxGeometry(2, 2.3, 2), lintelMaterial);
    lintelC.position.set(GX, 2.85, GZ);
    caveDoor = new THREE.Mesh(new THREE.BoxGeometry(2, 2.6, 0.2), barsMaterial);
    caveDoor.position.set(GX, DOOR_CLOSED_Y, GZ);
    scene.add(lintelC, caveDoor);

    // לפידים
    torches.length = 0;
    const stickMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 }), flameMat = new THREE.SpriteMaterial({ map: flameTex });
    const placeTorch = (x, z) => {
        const stick = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), stickMat);
        stick.position.set(x, 0.5, z);
        const flame = new THREE.Sprite(flameMat);
        flame.scale.set(0.38, 0.38, 1); flame.position.set(x, 0.95, z);
        scene.add(stick, flame);
        torches.push({ x, y: 1.1, z });
    };
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
        const r = 2 * i + 1, c = 2 * j + 1;
        if (map[r][c] !== 0 || (i * 2 + j * 3) % 5 !== 0) continue;
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dr, dc]) => map[r + dr][c + dc] === 1);
        if (d) placeTorch(c * BLOCK_SIZE + d[1] * 0.9, r * BLOCK_SIZE + d[0] * 0.9);
    }
    placeTorch(GX - 0.85, GZ - 0.85); placeTorch(GX + 0.85, GZ - 0.85);

    // המערה הגדולה: מרחב פתוח עם עמודי אבן, אשכולות עפרה ובריכות לבה
    cavGrid = Array.from({ length: CAV_ROWS }, (_, i) => Array.from({ length: mazeSize }, (_, c) => (c === 0 || c === mazeSize - 1 || i === CAV_ROWS - 1) ? 1 : 0));
    const free = (i, c) => i >= 1 && i <= 17 && c >= 2 && c <= 22 && !(i <= 3 && c >= 19) && !(i >= 15 && Math.abs(c - 12) <= 3);
    const oreAt = {};
    for (let k = 0; k < 16; k++) { const i = 1 + ((Math.random() * 17) | 0), c = 2 + ((Math.random() * 21) | 0); if (free(i, c)) cavGrid[i][c] = 1; }
    for (let k = 0; k < 9; k++) {
        const o = pickOre(), i0 = 2 + ((Math.random() * 15) | 0), c0 = 2 + ((Math.random() * 21) | 0);
        for (let n = 0; n < 3; n++) {
            const i = i0 + ((Math.random() * 3) | 0) - 1, c = c0 + ((Math.random() * 3) | 0) - 1;
            if (free(i, c)) { cavGrid[i][c] = 1; oreAt[i + ',' + c] = o; }
        }
    }
    const lavaMat = new THREE.MeshBasicMaterial({ map: toTexture(lavaCanvas(), 2, 2) });
    for (let k = 0; k < 5; k++) {
        const i0 = 3 + ((Math.random() * 13) | 0), c0 = 3 + ((Math.random() * 19) | 0);
        for (let i = i0; i < i0 + 2; i++) for (let c = c0; c < c0 + 2; c++) if (free(i, c) && cavGrid[i][c] === 0) {
            cavGrid[i][c] = 3;
            const m = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK_SIZE, BLOCK_SIZE), lavaMat);
            m.rotation.x = -Math.PI / 2; m.position.set(c * BLOCK_SIZE, FLOOR_Y + 0.02, (mazeSize + i) * BLOCK_SIZE);
            scene.add(m);
        }
    }
    for (let i = 0; i < CAV_ROWS; i++) for (let c = 0; c < mazeSize; c++) if (cavGrid[i][c] === 1) solid(mazeSize + i, c, true, oreAt[i + ',' + c] || null);
    [2, 6, 10, 14, 17].forEach(i => { placeTorch(1 * BLOCK_SIZE - 0.9, (mazeSize + i) * BLOCK_SIZE); placeTorch(23 * BLOCK_SIZE + 0.9, (mazeSize + i) * BLOCK_SIZE); });

    // משואה בקצה המערה הגדולה: הגעה אליה מנצחת
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8, 0.6), new THREE.MeshBasicMaterial({ color: 0x5df0f5, transparent: true, opacity: 0.45 }));
    beam.position.set(BEACON.x, 3, BEACON.z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), new THREE.MeshBasicMaterial({ color: 0x5df0f5 }));
    base.position.set(BEACON.x, FLOOR_Y + 0.4, BEACON.z);
    const beaconLight = new THREE.PointLight(0x5df0f5, 1.4, 14);
    beaconLight.position.set(BEACON.x, 1.5, BEACON.z);
    scene.add(beam, base, beaconLight);

    if (!torchLights.length) for (let k = 0; k < 8; k++) torchLights.push(new THREE.PointLight(0xffa24a, 1.6, 13));
    torchLights.forEach(l => scene.add(l));

    // תיבות ומפלצות: במבוך ובמערה הגדולה
    const paths = [];
    for (let r = 1; r < mazeSize; r += 2) for (let c = 1; c < mazeSize; c += 2) if (map[r][c] === 0) paths.push({ r, c });
    const far = paths.filter(s => Math.abs(s.r - 1) + Math.abs(s.c - 1) > 6).sort(() => Math.random() - 0.5);
    const openN = (r, c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dr, dc]) => map[r + dr] && map[r + dr][c + dc] === 0).length;
    far.filter(s => openN(s.r, s.c) === 1).slice(0, 5).forEach(s => createChest(s.r, s.c));
    far.slice(0, 4).forEach(s => zombies.push(createSkeleton(s.c * BLOCK_SIZE, s.r * BLOCK_SIZE)));
    far.slice(4, 9).forEach(s => zombies.push(createSpider(s.c * BLOCK_SIZE, s.r * BLOCK_SIZE)));
    for (let k = 0; k < 3; k++) {
        const i = 3 + ((Math.random() * 12) | 0), west = Math.random() < 0.5, c = west ? 1 : 23;
        if (cavGrid[i][c] === 0) createChest(mazeSize + i, c, [0, west ? 1 : -1]);
    }
    const open = [];
    for (let i = 4; i <= 17; i++) for (let c = 2; c <= 22; c++) if (cavGrid[i][c] === 0) open.push({ i, c });
    open.sort(() => Math.random() - 0.5);
    open.slice(0, 3).forEach(o => zombies.push(createSkeleton(o.c * BLOCK_SIZE, (mazeSize + o.i) * BLOCK_SIZE)));
    open.slice(3, 6).forEach(o => zombies.push(createSpider(o.c * BLOCK_SIZE, (mazeSize + o.i) * BLOCK_SIZE)));

    minimapCanvas.style.borderColor = '#8a8a8a';
    minimapCanvas.style.backgroundColor = 'rgba(0,0,0,.85)';
    oreEl.style.display = 'block';
    updateOreHud();
    camera.position.set(BLOCK_SIZE, EYE_Y, BLOCK_SIZE);
    camera.rotation.set(0, Math.PI, 0);
    py = 0; pvy = 0; lastCell = ''; distField = null;
    health = Math.min(100, health + 25);
    showAlert('שלב 2: המערה - כרה עפרות ומצא את המשואה', '#cccccc');
}

function updateCave(dt, t) {
    updateArrows(dt);
    const d2 = a => (a.x - camera.position.x) ** 2 + (a.z - camera.position.z) ** 2;
    const near = torches.slice().sort((a, b) => d2(a) - d2(b));
    torchLights.forEach((l, k) => {
        const tt = near[k];
        if (tt) { l.position.set(tt.x, tt.y, tt.z); l.intensity = 1.5 + Math.sin(t * 9 + k * 3) * 0.2; } else l.intensity = 0;
    });
    if (!exitOpen && Math.hypot(camera.position.x - GX, camera.position.z - GZ) < 5) {
        exitOpen = true;
        showAlert('השער נפתח! לפניך מערה גדולה', '#66ff66');
    }
    const ty = exitOpen ? DOOR_OPEN_Y : DOOR_CLOSED_Y;
    caveDoor.position.y += Math.sign(ty - caveDoor.position.y) * Math.min(Math.abs(ty - caveDoor.position.y), 1.6 * dt);
    if (cellAt(Math.round(camera.position.z / BLOCK_SIZE), Math.round(camera.position.x / BLOCK_SIZE)) === 3 && py < 0.4) { // לבה
        health -= 15 * dt; flashA = Math.max(flashA, 0.3);
        if (health <= 0) { health = 0; endGame('נשרפת בלבה! 🔥'); }
    }
}

function hasLOS(x1, z1, x2, z2) {
    const n = Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 0.4);
    for (let i = 1; i < n; i++) {
        const k = i / n, c = Math.round((x1 + (x2 - x1) * k) / BLOCK_SIZE), r = Math.round((z1 + (z2 - z1) * k) / BLOCK_SIZE);
        if (map[r] && map[r][c] !== 0) return false;
    }
    return true;
}

// צעד לעבר השחקן לפי שדה המרחקים (כמו הזומבים)
function chaseStep(z, dt, speed, dist, stopDist) {
    const farS = (mazeSize - 1) * BLOCK_SIZE + 1;
    if (stage === 2 && z.z > farS && camera.position.z > farS) { // במערה הגדולה הפתוחה רודפים ישר
        if (dist <= stopDist) return false;
        const dx = camera.position.x - z.x, dz = camera.position.z - z.z, d = Math.hypot(dx, dz) || 1;
        moveEntity(z, dx / d * speed * dt, dz / d * speed * dt, true);
        return true;
    }
    const zr = Math.round(z.z / BLOCK_SIZE), zc = Math.round(z.x / BLOCK_SIZE);
    const fv = distField && zr >= 0 && zc >= 0 && zr < mazeSize && zc < mazeSize ? distField[zr][zc] : Infinity;
    if (fv > 14 && dist > 3) return false;
    let tx = camera.position.x, tz = camera.position.z;
    if (dist >= 2.2 && fv > 0 && fv < Infinity) {
        let best = fv, bc = null;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = zr + dr, nc = zc + dc;
            if (nr >= 0 && nc >= 0 && nr < mazeSize && nc < mazeSize && distField[nr][nc] < best) { best = distField[nr][nc]; bc = [nr, nc]; }
        }
        if (bc) { tx = bc[1] * BLOCK_SIZE; tz = bc[0] * BLOCK_SIZE; }
    }
    const dx = tx - z.x, dz = tz - z.z, d = Math.hypot(dx, dz) || 1;
    if (dist <= stopDist) return false;
    moveEntity(z, (dx / d) * speed * dt, (dz / d) * speed * dt, true);
    return true;
}

const boxMesh = (w, h, d, m, x, y, z, parent) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
const baseMonster = (root, model, mat, hp, kind) => ({ root, model, mat, kind, x: root.position.x, z: root.position.z, vx: 0, vz: 0, y: 0, vy: 0,
    hp, hurt: 0, stun: 0, dying: false, deathT: 0, phase: Math.random() * 6, attackCd: 0.6, moving: false });

// שלד: גוף דק מעצמות, עיניים וקשת
function createSkeleton(x, z) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xdedbd0 }), dark = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const root = new THREE.Group(); root.position.set(x, FLOOR_Y, z);
    const model = new THREE.Group(); root.add(model);
    const P = PX;
    const head = new THREE.Group(); head.position.y = 24 * P; model.add(head);
    boxMesh(8 * P, 8 * P, 8 * P, mat, 0, 4 * P, 0, head);
    boxMesh(1.8 * P, 1.8 * P, 0.4 * P, dark, -2 * P, 4.5 * P, 4.1 * P, head);
    boxMesh(1.8 * P, 1.8 * P, 0.4 * P, dark, 2 * P, 4.5 * P, 4.1 * P, head);
    boxMesh(3 * P, 1 * P, 0.4 * P, dark, 0, 1.5 * P, 4.1 * P, head);
    boxMesh(6 * P, 12 * P, 3 * P, mat, 0, 18 * P, 0, model);
    [21, 18.5, 16].forEach(y => boxMesh(6.1 * P, 0.9 * P, 3.1 * P, dark, 0, y * P, 0, model));
    const limb = (px, py, cy) => { const g = new THREE.Group(); g.position.set(px * P, py * P, 0); boxMesh(2 * P, 12 * P, 2 * P, mat, 0, cy * P, 0, g); model.add(g); return g; };
    const armL = limb(4, 22, -4), armR = limb(-4, 22, -4), legL = limb(1.5, 12, -6), legR = limb(-1.5, 12, -6);
    armL.rotation.x = armR.rotation.x = -Math.PI / 2;
    const bowMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
    const bow = new THREE.Group(); bow.position.set(-4 * P, 22 * P, 11 * P); model.add(bow);
    boxMesh(0.6 * P, 10 * P, 0.6 * P, bowMat, 0, 0, 0, bow);
    [1, -1].forEach(sg => { const l = boxMesh(0.6 * P, 5 * P, 0.6 * P, bowMat, 0, sg * 7 * P, -1 * P, bow); l.rotation.x = sg * 0.5; });
    boxMesh(0.2 * P, 12 * P, 0.2 * P, new THREE.MeshBasicMaterial({ color: 0xcccccc }), 0, 0, -3 * P, bow);
    scene.add(root);
    return Object.assign(baseMonster(root, model, mat, 14, 'skeleton'), { legL, legR, armL, armR, shootCd: 1 + Math.random() * 2, strafe: 1, strafeT: 0 });
}

// עכביש: נמוך, רחב, עיניים אדומות זוהרות ו־8 רגליים
function createSpider(x, z) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x2b1d15 }), eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
    const root = new THREE.Group(); root.position.set(x, FLOOR_Y, z);
    const model = new THREE.Group(); root.add(model);
    boxMesh(0.7, 0.32, 0.55, mat, 0, 0.32, 0.1, model);
    boxMesh(0.85, 0.42, 0.9, mat, 0, 0.36, -0.6, model);
    boxMesh(0.4, 0.3, 0.4, mat, 0, 0.3, 0.5, model);
    [[-0.1, 0.36], [0.1, 0.36], [-0.14, 0.25], [0.14, 0.25]].forEach(([ex, ey]) => boxMesh(0.07, 0.07, 0.04, eyeMat, ex, ey, 0.71, model));
    const legs = [];
    [1, -1].forEach(sg => [0.3, 0.1, -0.1, -0.3].forEach((zo, k) => {
        const piv = new THREE.Group(); piv.position.set(sg * 0.3, 0.3, zo);
        piv.rotation.z = -sg * 0.6; piv.base = sg * (0.35 - k * 0.2); piv.rotation.y = piv.base;
        boxMesh(0.75, 0.06, 0.06, mat, sg * 0.37, 0, 0, piv);
        model.add(piv); legs.push(piv);
    }));
    scene.add(root);
    return Object.assign(baseMonster(root, model, mat, 12, 'spider'), { legs });
}

function updateSkeleton(z, dt) {
    const dxp = camera.position.x - z.x, dzp = camera.position.z - z.z, dist = Math.hypot(dxp, dzp) || 1;
    z.moving = false;
    z.shootCd -= dt;
    const los = dist < 16 && hasLOS(z.x, z.z, camera.position.x, camera.position.z);
    if (z.stun <= 0 && dist < 22) {
        z.root.rotation.y = Math.atan2(dxp, dzp);
        if (los) {
            if (dist < 4) { moveEntity(z, -dxp / dist * 2.2 * dt, -dzp / dist * 2.2 * dt, true); z.moving = true; } // שומר מרחק
            else if (dist > 8) z.moving = chaseStep(z, dt, 1.6, dist, 8);
            else {
                z.strafeT -= dt;
                if (z.strafeT <= 0) { z.strafeT = 1 + Math.random() * 1.5; z.strafe = Math.random() < 0.5 ? -1 : 1; }
                moveEntity(z, -dzp / dist * z.strafe * 1.2 * dt, dxp / dist * z.strafe * 1.2 * dt, true); z.moving = true;
            }
            if (z.shootCd <= 0) { z.shootCd = 1.8 + Math.random(); shootArrow(z); }
        } else z.moving = chaseStep(z, dt, 1.6, dist, 0.5);
    }
    z.phase += z.moving ? dt * 7 : dt;
    const sw = z.moving ? 0.6 : 0.03;
    z.legL.rotation.x = Math.sin(z.phase) * sw; z.legR.rotation.x = -Math.sin(z.phase) * sw;
    z.root.position.set(z.x, FLOOR_Y + z.y, z.z);
}

function updateSpider(z, dt) {
    const dxp = camera.position.x - z.x, dzp = camera.position.z - z.z, dist = Math.hypot(dxp, dzp) || 1;
    z.moving = false;
    z.attackCd -= dt;
    if (z.stun <= 0 && dist < 18) {
        z.root.rotation.y = Math.atan2(dxp, dzp);
        z.moving = chaseStep(z, dt, 3.4, dist, 0.9);
        if (dist < 1.4 && z.attackCd <= 0 && py < 0.5) {
            z.attackCd = 0.8;
            if (damagePlayer(5, z.x, z.z)) { z.vx = -dxp / dist * 7; z.vz = -dzp / dist * 7; z.stun = 0.4; }
        }
    }
    z.phase += z.moving ? dt * 16 : dt * 2;
    z.legs.forEach((l, k) => { l.rotation.y = l.base + Math.sin(z.phase + k * 1.3) * 0.3; });
    z.root.position.set(z.x, FLOOR_Y + z.y, z.z);
}

function shootArrow(z) {
    const sx = z.x, sz = z.z, sy = FLOOR_Y + 1.5;
    const tx = camera.position.x + (Math.random() - 0.5) * 0.8, tz = camera.position.z + (Math.random() - 0.5) * 0.8, ty = camera.position.y - 0.2;
    const dx = tx - sx, dy = ty - sy, dz = tz - sz, d = Math.hypot(dx, dy, dz) || 1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.55), arrowMat);
    mesh.position.set(sx, sy, sz);
    mesh.lookAt(tx, ty, tz);
    scene.add(mesh);
    arrows.push({ mesh, vx: dx / d * 11, vy: dy / d * 11, vz: dz / d * 11, life: 3 });
}

function updateArrows(dt) {
    for (let i = arrows.length - 1; i >= 0; i--) {
        const a = arrows[i], p = a.mesh.position;
        p.x += a.vx * dt; p.y += a.vy * dt; p.z += a.vz * dt;
        a.vy -= 1.5 * dt; a.life -= dt;
        const c = Math.round(p.x / BLOCK_SIZE), r = Math.round(p.z / BLOCK_SIZE);
        let dead = a.life <= 0 || p.y < FLOOR_Y || p.y > WALL_HEIGHT - 1 || !map[r] || map[r][c] !== 0;
        if (!dead && !gameOver && Math.hypot(p.x - camera.position.x, p.z - camera.position.z) < 0.5 &&
            p.y > camera.position.y - 1.6 && p.y < camera.position.y + 0.2) {
            damagePlayer(6, p.x - a.vx, p.z - a.vz);
            dead = true;
        }
        if (dead) { scene.remove(a.mesh); arrows.splice(i, 1); }
    }
}

// ===== 12. לולאת המשחק =====
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    let moving = false;

    if (!gameOver) {
        const speed = 4.8 * dt * (speedT > 0 ? 1.5 : 1), turnSpeed = 1.8 * dt;
        speedT = Math.max(0, speedT - dt);
        strengthT = Math.max(0, strengthT - dt);

        if (!isGateClosed && camera.position.z >= 0.5) isGateClosing = true;
        if (isGateClosing && entryDoor.position.y > DOOR_CLOSED_Y) {
            entryDoor.position.y -= 6 * dt;
            if (entryDoor.position.y <= DOOR_CLOSED_Y) {
                entryDoor.position.y = DOOR_CLOSED_Y;
                isGateClosing = false; isGateClosed = true; map[0][1] = 1;
                showAlert('השער נסגר וננעל! אין דרך חזרה!');
            }
        }

        if (stage === 1 && !exitOpen && Math.hypot(camera.position.x - GX, camera.position.z - GZ) < 5) {
            exitOpen = true;
            showAlert('השער נפתח! רוץ החוצה!', '#66ff66');
        }
        const targetY = exitOpen ? DOOR_OPEN_Y : DOOR_CLOSED_Y;
        exitDoor.position.y += Math.sign(targetY - exitDoor.position.y) * Math.min(Math.abs(targetY - exitDoor.position.y), 1.6 * dt);

        foodItems.forEach((a, i) => { if (a.visible) a.position.y = -0.4 + Math.sin(t * 3 + i) * 0.08; });

        const pr = Math.round(camera.position.z / BLOCK_SIZE), pc = Math.round(camera.position.x / BLOCK_SIZE);
        if (pr + ',' + pc !== lastCell) { lastCell = pr + ',' + pc; distField = computeField(pr, pc); }
        const inside = camera.position.z > 0 && !escaped;
        zombies.forEach(z => updateZombie(z, dt, t, inside));
        if (stage === 2) updateCave(dt, t);

        // קפיצה
        if (keys['Space'] && py === 0) pvy = 7.2;
        pvy -= 22 * dt;
        py += pvy * dt;
        if (py <= 0) { py = 0; pvy = 0; }
        camera.position.y = EYE_Y + py;

        if (keys['ArrowLeft'] || keys['KeyA']) camera.rotation.y += turnSpeed;
        if (keys['ArrowRight'] || keys['KeyD']) camera.rotation.y -= turnSpeed;
        let mf = 0;
        if (keys['ArrowUp'] || keys['KeyW']) mf = -1;
        if (keys['ArrowDown'] || keys['KeyS']) mf = 1;

        if (mf !== 0) {
            moving = true;
            const dir = { x: Math.sin(camera.rotation.y) * mf, z: Math.cos(camera.rotation.y) * mf };
            const nx = camera.position.x + dir.x * speed, nz = camera.position.z + dir.z * speed;
            if (checkPosition(nx, camera.position.z) === 'free') camera.position.x = nx;
            if (checkPosition(camera.position.x, nz) === 'free') camera.position.z = nz;

            if (stage === 1 && escaped && camera.position.z > CAVE.z0 + CAVE.depth - 1.6 && Math.abs(camera.position.x - CAVE.x) < 1.3) startCave();
            if (stage === 2 && Math.hypot(camera.position.x - BEACON.x, camera.position.z - BEACON.z) < 1.8) endGame('ניצחת! הגעת ללב המערה הגדולה ⛏️💎');
            if (stage === 1 && !escaped && camera.position.z > GZ + 1.0) { escaped = true; showAlert('ברחת מהמבוך! 🎉 בדרום יש פתח מערה - היכנס לשלב 2', '#66ff66'); }

            if (camera.position.z > 0 && !escaped) {
                food -= 0.0375 * speed;
                if (food <= 0) {
                    food = 0; health -= 0.6 * dt;
                    if (health <= 0) { health = 0; endGame('נגמר לך האוכל! המשחק הסתיים 💀'); }
                }
            }
        }
        foodItems.forEach(a => {
            if (a.visible && Math.hypot(camera.position.x - a.position.x, camera.position.z - a.position.z) < 0.9 && py < 1.2 && addItem('apple', 1)) a.visible = false;
        });

        // אכילה / שתייה
        if (use) {
            use.t += dt;
            crumbT -= dt;
            if (crumbT <= 0 && use.t > 0.2) { crumbT = 0.04; crumb(ITEMS[use.id].crumb); crumb(ITEMS[use.id].crumb); }
            if (use.t >= use.dur) finishUse();
        }
    }
    const blocking = blockingNow();
    bobPhase += moving ? dt * 9 : 0;

    // טיימרים ואפקטים
    attackCd = Math.max(0, attackCd - dt);
    swingT = Math.max(0, swingT - dt / 0.28);
    equipT = Math.max(0, equipT - dt / 0.25);
    blockT += ((blocking ? 1 : 0) - blockT) * Math.min(1, dt * 14);

    // אנימציית חרב כמו במיינקראפט: הרמה אחורה ואז חיתוך אלכסוני
    const u = U();
    let tx = Math.sin(bobPhase) * 5, ty = Math.abs(Math.cos(bobPhase)) * 6, rot = -8, sc = 1, rx = 0, ry = 0;
    if (swingT > 0) { // הנפה מהירה וחלקה: פתיחה חדה אלכסונית ואז חזרה רכה
        const p = 1 - swingT, ease = k => 1 - Math.pow(1 - k, 3);
        const e = p < 0.4 ? ease(p / 0.4) : 1 - ease((p - 0.4) / 0.6);
        tx += -e * 30 * u;
        ty += -Math.sin(e * Math.PI) * 9 * u + e * 12 * u;
        rot += -e * 85; rx += -e * 35; ry += -e * 20;
        sc += e * 0.22;
    }
    if (use) { // אכילה: רעידה חזקה
        const e = Math.min(1, use.t / 0.2);
        tx += -e * (window.innerWidth / 2 - 30 - 15 * u) + Math.sin(use.t * 47) * 1.5 * u * e;
        ty += -e * 20 * u + Math.sin(use.t * 60) * 2.4 * u * e;
        rot += -e * 20 + Math.sin(use.t * 50) * 8 * e;
    }
    // חסימה: מרכז־ימין של המסך, בהטיה קדימה
    tx -= blockT * (0.32 * window.innerWidth - 30 - 15 * u);
    ty -= blockT * 14 * u;
    rx += -blockT * 35; ry += -blockT * 28; rot += blockT * 6;
    sc += blockT * 0.3;
    ty += equipT * 40 * u;
    heldItem.style.transform = `perspective(800px) translate(${tx}px,${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rot}deg) scale(${sc})`;

    flashA = Math.max(0, flashA - dt * 1.5);
    document.getElementById('flash').style.opacity = flashA;
    hurtTilt *= Math.exp(-8 * dt);
    camera.rotation.z = hurtTilt;

    // סביבה: שמש, עננים, תיבות, פריטים קופצים
    sun.position.copy(camera.position).add(sunOffset);
    clouds.forEach(c => { c.position.x += 1.2 * dt; if (c.position.x > 200) c.position.x = -80; });
    chests.forEach(c => { if (c.open && c.t < 1) { c.t = Math.min(1, c.t + dt * 2.5); c.hinge.rotation.x = -1.35 * c.t; } });
    for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.t += dt;
        p.s.position.y = FLOOR_Y + 0.7 + p.t * 1.2;
        p.s.material.opacity = Math.max(0, 1 - p.t / 0.9);
        if (p.t > 0.9) { scene.remove(p.s); pops.splice(i, 1); }
    }
    document.getElementById('prompt').style.display = !gameOver && nearChest() ? 'block' : 'none';
    document.getElementById('lockHint').style.display = locked() || gameOver ? 'none' : 'block';

    // אפקטים פעילים
    const fxText = (speedT > 0 ? '⚡ מהירות ' + Math.ceil(speedT) + '<br>' : '') + (strengthT > 0 ? '💪 כוח ' + Math.ceil(strengthT) : '');
    if (fxText !== fxKey) { fxKey = fxText; document.getElementById('fx').innerHTML = fxText; }

    for (let i = zombies.length - 1; i >= 0; i--) {
        if (zombies[i].dying && zombies[i].deathT > 1.4) { scene.remove(zombies[i].root); zombies.splice(i, 1); }
    }
    if (gameOver) zombies.forEach(z => z.dying && updateZombie(z, dt, t, false));

    updateStatsUI();
    drawMinimap();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    layoutHud();
});