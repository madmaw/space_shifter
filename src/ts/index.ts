///<reference path="math.ts"/>

const FLAG_MOTION_BLUR = true;

const DIMENSION = 999;
const DIMENSION_DIV_2 = 499;
const KEY_LEFT = 65; // A
const KEY_RIGHT = 68; // D
const KEY_UP = 87; // W
const KEY_DOWN = 83; // S
const BOUNDS: [Vector2, Vector2] = [[299, 299], [699, 699]];

type Polygon = Vector2[];
type Entity = {
  shape: Polygon,
  radius: number,
  position: Vector2,
  hue: number,
  saturation?: number,
  lightnessMultiplier: number,
  visibleShape?: Polygon,
  cycleTime?: number,
  age?: number,
  updater: (entity: Entity) => EntityUpdate,
}

type EntityUpdate = {
  transformationMatrix: Matrix2D,
  velocity: Vector2,
}
const keys: {[_: number]: number} = {};
onkeydown = (k: KeyboardEvent) => keys[k.keyCode] = 1;
onkeyup = (k: KeyboardEvent) => keys[k.keyCode] = 0;

let mousePosition: Vector2 = [DIMENSION, DIMENSION_DIV_2];
onmousemove = (m: MouseEvent) => mousePosition = [m.clientX, m.clientY];

let mouseDown: number | undefined;
onmousedown = () => mouseDown = 1;
onmouseup = () => mouseDown = 0;

let entities: Entity[] = [{
  shape: [[-7, -7], [-3, 0], [-7, 7], [9, 0]],
  radius: 9,
  position: [DIMENSION_DIV_2, DIMENSION_DIV_2],
  hue: 60,
  saturation: 99,
  lightnessMultiplier: 1,
  updater: (entity: Entity) => {
    const [dx, dy] = entity.position.map((p, i) => mousePosition[i]/globalMatrix[0] + cameraPosition[i] - p);
    const rotation = Math.atan2(dy, dx);
    const sin = Math.sin(rotation);
    const cos = Math.cos(rotation);
    const rotationMatrix: Matrix2D = [
      cos, sin,
      -sin, cos,
      0, 0,
    ];
    const vx = ((keys[KEY_RIGHT] || 0) - (keys[KEY_LEFT] || 0))/5;
    const vy = ((keys[KEY_DOWN] || 0) - (keys[KEY_UP] || 0))/5;
    return {
      transformationMatrix: rotationMatrix,
      velocity: [vx, vy],
    }
  }
}, {
  shape: [[-30, -30], [-30, 30], [30, 30], [30, -30]],
  radius: 30,
  position: [DIMENSION_DIV_2/2, DIMENSION_DIV_2],
  hue: 0,
  saturation: 99,
  cycleTime: 999,
  lightnessMultiplier: 1,
  updater: (entity: Entity) => {
    const rotation = entity.age / entity.cycleTime;
    const sin = Math.sin(rotation);
    const cos = Math.cos(rotation);
    const rotationMatrix: Matrix2D = [
      cos, sin,
      -sin, cos,
      0, 0,
    ];
    return {
      transformationMatrix: rotationMatrix,
      velocity: [0, 0],
    }
  }
}];

let cameraPosition: Vector2 = [0, 0];

let context: CanvasRenderingContext2D;
let globalMatrix: Matrix2D;
onresize = () => {
  const d = Math.max(innerWidth, innerHeight);
  c.width = innerWidth;
  c.height = innerHeight;
  context = c.getContext('2d');
  context.lineCap = context.lineJoin = 'round';
  const globalScale = d / (DIMENSION_DIV_2);
  globalMatrix = [
    globalScale, 0,
    0, globalScale,
    0, 0,
  ];
};
// @ts-ignore
onresize();
let then = 0;
const f = (now: number) => {
  const diff = now - then;
  then = now;
  //context.fillStyle = '#000';
  //context.fillRect(0, 0, c.width, c.height);
  context.clearRect(0, 0, c.width, c.height);

  const screenMatrix: Matrix2D = matrix2DMultiplyArray([globalMatrix, [
    1, 0,
    0, 1,
    -cameraPosition[0], -cameraPosition[1]
  ]]);
  const [[ux, uy], [lx, ly]] = BOUNDS.map(b => vector2TransformMatrix2D(b, screenMatrix));
  const lineWidth = (globalMatrix[0] | 0) + 2;

  context.lineWidth = lineWidth + 2;
  context.shadowColor = context.strokeStyle = `hsl(60,99%,${(now%999)/9 + 49}%)`;
  context.strokeRect(ux, uy, lx-ux, ly-uy);
  context.lineWidth = lineWidth;
  context.shadowBlur = (now % 999)/9 * globalMatrix[0];

  requestAnimationFrame(f);
  entities.map((entity, i) => {
    const {
      shape,
      radius,
      position,
      hue,
      saturation,
      lightnessMultiplier,
      cycleTime,
      age,
    } = entity;
    entity.age = (age || 0) + diff;
    const { transformationMatrix, velocity } = entity.updater(entity);
    velocity.map((v, i) => position[i] += v * diff);
    if (!i) {
      cameraPosition = position.map((p, i) => {
        position[i] = Math.min(Math.max(p, BOUNDS[0][i] + radius), BOUNDS[1][i] - radius);
        return (DIMENSION - (i ? c.height : c.width) / globalMatrix[0]) * position[i] / DIMENSION;
      }) as Vector2;
    }
    const positionMatrix = [
      1, 0,
      0, 1,
      position[0], position[1]
    ] as Matrix2D;
    const m = matrix2DMultiplyArray([screenMatrix, positionMatrix, transformationMatrix]);
    entity.visibleShape = shape.map(v => vector2TransformMatrix2D(v, m));
    context.beginPath();
    entity.visibleShape.map(([x, y]) => context.lineTo(x, y));
    context.closePath();
    if (FLAG_MOTION_BLUR) {
      context.shadowOffsetX = (velocity[0] > 0 ? -1 : 1) * Math.sqrt(Math.abs(velocity[0]) * 9 * radius);
      context.shadowOffsetY = (velocity[1] > 0 ? -1 : 1) * Math.sqrt(Math.abs(velocity[1]) * 9 * radius);
    }
    let cycle = cycleTime ? (entity.age % cycleTime)/cycleTime : .4;
    context.shadowBlur = (9 + radius * radius * cycle * cycle) * globalMatrix[0];
    context.shadowColor = `hsl(${hue},${saturation}%,${lightnessMultiplier * 99}%)`;
    context.strokeStyle = `hsl(${hue},${saturation}%,${lightnessMultiplier * 99 * (1 - Math.abs(.5 - cycle)/2)}%)`;
    context.fillStyle = `hsl(${hue},${saturation / 9}%,${lightnessMultiplier * 33 * (1 - cycle * cycle)}%)`;
    context.fill();
    context.stroke();
  });
};
f(0);
