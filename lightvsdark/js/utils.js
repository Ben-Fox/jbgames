// utils.js — Math, collision, pathfinding helpers
const TILE = 32;
const MAP_W = 80;
const MAP_H = 60;
const MAP_PX_W = MAP_W * TILE;
const MAP_PX_H = MAP_H * TILE;

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randFloat(a, b) { return Math.random() * (b - a) + a; }
function chance(p) { return Math.random() < p; }
function angleTo(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }

function rectOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleOverlap(x1, y1, r1, x2, y2, r2) {
  return dist({x:x1,y:y1},{x:x2,y:y2}) < r1 + r2;
}

function tileAt(px, py) {
  return { tx: Math.floor(px / TILE), ty: Math.floor(py / TILE) };
}

function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

// Simple A* pathfinding on tile grid
function findPath(startTx, startTy, endTx, endTy, isBlocked, maxSteps = 200) {
  if (startTx === endTx && startTy === endTy) return [];
  if (isBlocked(endTx, endTy)) return null;
  
  const open = [];
  const closed = new Set();
  const cameFrom = {};
  const gScore = {};
  const key = (x, y) => x + ',' + y;
  
  const sk = key(startTx, startTy);
  gScore[sk] = 0;
  open.push({ x: startTx, y: startTy, f: Math.abs(endTx - startTx) + Math.abs(endTy - startTy) });
  
  let steps = 0;
  while (open.length > 0 && steps < maxSteps) {
    steps++;
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    const ck = key(cur.x, cur.y);
    
    if (cur.x === endTx && cur.y === endTy) {
      // reconstruct
      const path = [];
      let k = ck;
      while (cameFrom[k]) {
        const [px, py] = k.split(',').map(Number);
        path.unshift({ tx: px, ty: py });
        k = cameFrom[k];
      }
      return path;
    }
    
    closed.add(ck);
    
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      const nk = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      if (closed.has(nk)) continue;
      if (isBlocked(nx, ny)) continue;
      
      const ng = (gScore[ck] || 0) + 1;
      if (gScore[nk] === undefined || ng < gScore[nk]) {
        gScore[nk] = ng;
        cameFrom[nk] = ck;
        const h = Math.abs(endTx - nx) + Math.abs(endTy - ny);
        open.push({ x: nx, y: ny, f: ng + h });
      }
    }
  }
  return null; // no path
}

// Seeded random for map gen
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
