// levels.js - Level definitions for Tree Fall
const LEVELS = [
  // 1 - First Chop
  {
    name: "First Chop",
    objective: "Chop the tree! Just let it fall anywhere.",
    category: "Tutorial",
    tree: { x: 0.5, height: 250, trunk: 30, lean: 0 },
    wind: { base: 0, gust: 0 },
    earthquake: false,
    objects: [],
    targets: [],
    starCriteria: { any: true },
    groundLevel: 0.85
  },
  // 2 - Mind the Fence
  {
    name: "Mind the Fence",
    objective: "Don't hit the fence! Fall the tree to the LEFT.",
    category: "Tutorial",
    tree: { x: 0.55, height: 250, trunk: 30, lean: 0 },
    wind: { base: 0, gust: 0.5 },
    earthquake: false,
    objects: [
      { type: 'fence', x: 0.7, w: 0.15, h: 40, destructible: true, cost: 2000 }
    ],
    targets: [{ side: 'left', label: 'Fall left' }],
    starCriteria: { avoidAll: true },
    groundLevel: 0.85
  },
  // 3 - Suburban Nightmare
  {
    name: "Suburban Nightmare",
    objective: "Fall the tree into the narrow gap between houses!",
    category: "Save the Property",
    tree: { x: 0.5, height: 280, trunk: 35, lean: 0 },
    wind: { base: 0, gust: 1 },
    earthquake: false,
    objects: [
      { type: 'house', x: 0.25, w: 0.15, h: 80, destructible: true, cost: 85000 },
      { type: 'house', x: 0.75, w: 0.15, h: 80, destructible: true, cost: 85000 }
    ],
    targets: [{ zone: { x1: 0.33, x2: 0.42 }, label: 'Left gap' }, { zone: { x1: 0.58, x2: 0.67 }, label: 'Right gap' }],
    starCriteria: { avoidAll: true, hitTarget: true },
    groundLevel: 0.85
  },
  // 4 - Car Saver
  {
    name: "Car Saver",
    objective: "Don't crush the car! Fall the tree AWAY from it.",
    category: "Save the Property",
    tree: { x: 0.45, height: 260, trunk: 30, lean: 5 },
    wind: { base: 0.3, gust: 1 },
    earthquake: false,
    objects: [
      { type: 'car', x: 0.65, w: 0.12, h: 35, destructible: true, cost: 35000 }
    ],
    targets: [{ side: 'left', label: 'Fall away from car' }],
    starCriteria: { avoidAll: true },
    groundLevel: 0.85
  },
  // 5 - Playground Panic
  {
    name: "Playground Panic",
    objective: "Keep the kids safe! Don't hit the playground!",
    category: "Save the Property",
    tree: { x: 0.4, height: 270, trunk: 32, lean: 0 },
    wind: { base: 0, gust: 1.5 },
    earthquake: false,
    objects: [
      { type: 'playground', x: 0.65, w: 0.2, h: 50, destructible: true, cost: 15000 },
      { type: 'stickfigure', x: 0.6, w: 0.02, h: 25, destructible: false, flee: true },
      { type: 'stickfigure', x: 0.7, w: 0.02, h: 25, destructible: false, flee: true }
    ],
    targets: [{ side: 'left', label: 'Fall away from playground' }],
    starCriteria: { avoidAll: true },
    groundLevel: 0.85
  },
  // 6 - Power Lines
  {
    name: "Power Lines",
    objective: "Fall the tree UNDER the power lines! Tight angle!",
    category: "Save the Property",
    tree: { x: 0.4, height: 300, trunk: 30, lean: 0 },
    wind: { base: 0, gust: 0.8 },
    earthquake: false,
    objects: [
      { type: 'powerline', x: 0.6, w: 0.3, h: 5, yOff: -120, destructible: true, cost: 50000 }
    ],
    targets: [{ side: 'right', label: 'Under the wires' }],
    starCriteria: { avoidAll: true, shortTree: true },
    groundLevel: 0.85
  },
  // 7 - Pool Party
  {
    name: "Pool Party",
    objective: "Don't splash the pool! ...or DO for bonus! 🏊",
    category: "Save the Property",
    tree: { x: 0.4, height: 250, trunk: 28, lean: 0 },
    wind: { base: 0, gust: 1 },
    earthquake: false,
    objects: [
      { type: 'pool', x: 0.65, w: 0.18, h: 20, destructible: false, splash: true, bonus: true }
    ],
    targets: [{ side: 'left', label: 'Avoid pool' }],
    starCriteria: { avoidPool: true, bonusPool: true },
    groundLevel: 0.85
  },
  // 8 - Crush the Can
  {
    name: "Crush the Can",
    objective: "Land the tree EXACTLY on the soda can! 🥫",
    category: "Wacky",
    tree: { x: 0.35, height: 260, trunk: 30, lean: 0 },
    wind: { base: 0, gust: 0.5 },
    earthquake: false,
    objects: [
      { type: 'can', x: 0.65, w: 0.02, h: 12, destructible: true, target: true }
    ],
    targets: [{ hitObject: 'can', label: 'Crush the can!' }],
    starCriteria: { hitTarget: true, precision: 0.03 },
    groundLevel: 0.85
  },
  // 9 - Truck Bed
  {
    name: "Truck Bed",
    objective: "Land the tree perfectly flat in the truck bed! 🛻",
    category: "Wacky",
    tree: { x: 0.35, height: 240, trunk: 28, lean: 0 },
    wind: { base: 0, gust: 0.8 },
    earthquake: false,
    objects: [
      { type: 'truck', x: 0.68, w: 0.16, h: 40, destructible: false, bedZone: { x1: 0.62, x2: 0.72 }, target: true }
    ],
    targets: [{ hitObject: 'truck', label: 'Land in the bed!' }],
    starCriteria: { hitTarget: true, flatLanding: true },
    groundLevel: 0.85
  },
  // 10 - Bridge the Gap
  {
    name: "Bridge the Gap",
    objective: "Fell the tree to bridge the gap! 🌉",
    category: "Wacky",
    tree: { x: 0.35, height: 280, trunk: 32, lean: 0 },
    wind: { base: 0, gust: 0.5 },
    earthquake: false,
    objects: [
      { type: 'cliff', x: 0.55, w: 0.1, h: 200, isGap: true },
      { type: 'stickfigure', x: 0.32, w: 0.02, h: 25, destructible: false, walker: true }
    ],
    targets: [{ bridge: true, label: 'Bridge the gap!' }],
    starCriteria: { bridge: true },
    groundLevel: 0.85,
    customGround: 'cliffs'
  },
  // 11 - Bowling!
  {
    name: "Bowling!",
    objective: "STRIKE! Knock down all the pins! 🎳",
    category: "Wacky",
    tree: { x: 0.2, height: 270, trunk: 30, lean: 0 },
    wind: { base: 0, gust: 0.3 },
    earthquake: false,
    objects: [
      { type: 'pin', x: 0.7, w: 0.015, h: 20 },
      { type: 'pin', x: 0.73, w: 0.015, h: 20 },
      { type: 'pin', x: 0.76, w: 0.015, h: 20 },
      { type: 'pin', x: 0.79, w: 0.015, h: 20 },
      { type: 'pin', x: 0.715, w: 0.015, h: 20 },
      { type: 'pin', x: 0.745, w: 0.015, h: 20 },
      { type: 'pin', x: 0.775, w: 0.015, h: 20 },
      { type: 'pin', x: 0.73, w: 0.015, h: 20, row: 2 },
      { type: 'pin', x: 0.76, w: 0.015, h: 20, row: 2 },
      { type: 'pin', x: 0.745, w: 0.015, h: 20, row: 3 }
    ],
    targets: [{ hitAllPins: true, label: 'Strike!' }],
    starCriteria: { pinsKnocked: true },
    groundLevel: 0.85
  },
  // 12 - Dunk Tank
  {
    name: "Dunk Tank",
    objective: "Hit the target to dunk them! 💦",
    category: "Wacky",
    tree: { x: 0.3, height: 260, trunk: 30, lean: 0 },
    wind: { base: 0, gust: 1 },
    earthquake: false,
    objects: [
      { type: 'dunktank', x: 0.72, w: 0.1, h: 50, target: true }
    ],
    targets: [{ hitObject: 'dunktank', label: 'Dunk!' }],
    starCriteria: { hitTarget: true },
    groundLevel: 0.85
  },
  // 13 - Ramp It
  {
    name: "Ramp It",
    objective: "Hit the ramp to launch the ball into the hoop! 🏀",
    category: "Wacky",
    tree: { x: 0.3, height: 250, trunk: 28, lean: 0 },
    wind: { base: 0, gust: 0.5 },
    earthquake: false,
    objects: [
      { type: 'ramp', x: 0.55, w: 0.1, h: 30, target: true },
      { type: 'hoop', x: 0.8, w: 0.06, h: 60 }
    ],
    targets: [{ hitObject: 'ramp', label: 'Launch the ball!' }],
    starCriteria: { hitTarget: true, chainReaction: true },
    groundLevel: 0.85
  },
  // 14 - Hurricane
  {
    name: "Hurricane",
    objective: "Strong winds! Time your cut perfectly! 🌀",
    category: "Hard",
    tree: { x: 0.5, height: 280, trunk: 32, lean: 0 },
    wind: { base: 3, gust: 4, changing: true },
    earthquake: false,
    objects: [
      { type: 'house', x: 0.2, w: 0.12, h: 70, destructible: true, cost: 120000 },
      { type: 'house', x: 0.8, w: 0.12, h: 70, destructible: true, cost: 120000 }
    ],
    targets: [{ zone: { x1: 0.38, x2: 0.62 }, label: 'Between the houses' }],
    starCriteria: { avoidAll: true },
    groundLevel: 0.85
  },
  // 15 - Earthquake Zone
  {
    name: "Earthquake Zone",
    objective: "Ground is shaking! Steady your nerves! 🫨",
    category: "Hard",
    tree: { x: 0.5, height: 270, trunk: 30, lean: 0 },
    wind: { base: 0, gust: 1 },
    earthquake: true,
    objects: [
      { type: 'house', x: 0.25, w: 0.13, h: 75, destructible: true, cost: 95000 },
      { type: 'car', x: 0.75, w: 0.12, h: 35, destructible: true, cost: 40000 }
    ],
    targets: [],
    starCriteria: { avoidAll: true },
    groundLevel: 0.85
  },
  // 16 - The Gauntlet
  {
    name: "The Gauntlet",
    objective: "ONE safe direction. Find it. Maximum precision! 😰",
    category: "Hard",
    tree: { x: 0.5, height: 290, trunk: 34, lean: 0 },
    wind: { base: 1, gust: 2 },
    earthquake: false,
    objects: [
      { type: 'house', x: 0.22, w: 0.13, h: 80, destructible: true, cost: 150000 },
      { type: 'house', x: 0.78, w: 0.13, h: 80, destructible: true, cost: 150000 },
      { type: 'car', x: 0.5, w: 0.1, h: 35, yOff: 60, destructible: true, cost: 45000 },
      { type: 'powerline', x: 0.5, w: 0.4, h: 5, yOff: -100, destructible: true, cost: 50000 }
    ],
    targets: [{ zone: { x1: 0.36, x2: 0.44 }, label: 'The only safe spot' }],
    starCriteria: { avoidAll: true, hitTarget: true },
    groundLevel: 0.85
  },
  // 17 - Double Chop
  {
    name: "Double Chop",
    objective: "TWO trees! Fall them in opposite directions! 🌲🌲",
    category: "Hard",
    tree: { x: 0.35, height: 250, trunk: 28, lean: 0 },
    tree2: { x: 0.65, height: 250, trunk: 28, lean: 0 },
    wind: { base: 0, gust: 1.5 },
    earthquake: false,
    objects: [
      { type: 'house', x: 0.5, w: 0.12, h: 75, destructible: true, cost: 200000 }
    ],
    targets: [{ side: 'apart', label: 'Opposite directions!' }],
    starCriteria: { avoidAll: true, bothTrees: true },
    groundLevel: 0.85,
    doubleTree: true
  },
  // 18 - The Giant
  {
    name: "The Giant",
    objective: "The BIGGEST tree. Epic slow-mo destruction! 🌲💥",
    category: "Hard",
    tree: { x: 0.5, height: 450, trunk: 55, lean: 0 },
    wind: { base: 0.5, gust: 2 },
    earthquake: true,
    objects: [
      { type: 'house', x: 0.15, w: 0.12, h: 60, destructible: true, cost: 200000 },
      { type: 'house', x: 0.85, w: 0.12, h: 60, destructible: true, cost: 200000 },
      { type: 'car', x: 0.3, w: 0.1, h: 30, destructible: true, cost: 55000 },
      { type: 'car', x: 0.7, w: 0.1, h: 30, destructible: true, cost: 55000 }
    ],
    targets: [],
    starCriteria: { avoidAll: true },
    groundLevel: 0.85,
    slowMo: true
  }
];
