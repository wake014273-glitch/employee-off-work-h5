import { _decorator, Sprite, UITransform } from 'cc';
import { BODY_SPRING, bodySpringWeight } from './model/BodySpring';
import { PLAYER_SCALE } from './model/GameLayout';

const { ccclass } = _decorator;
const ROWS = BODY_SPRING.rows;
const VERTICES = (ROWS + 1) * 2;
const INDICES = new Uint16Array(ROWS * 6);
for (let row = 0; row < ROWS; row++) {
  const v = row * 2;
  INDICES.set([v, v + 1, v + 2, v + 1, v + 3, v + 2], row * 6);
}

// Cocos 3.8.8 UI assembler adapter. All engine-specific mesh access stays here.
// Shared row vertices avoid gaps/overlaps from rotating separate image strips.
const springAssembler: NonNullable<Sprite['_assembler']> = {
  createData(sprite: Sprite) {
    const data = sprite.requestRenderData();
    data.dataLength = VERTICES;
    data.resize(VERTICES, INDICES.length);
    data.chunk.setIndexBuffer(INDICES);
    return data;
  },

  updateRenderData(sprite: SpringSprite) {
    const data = sprite.renderData, frame = sprite.spriteFrame;
    if (!data || !frame) return;
    this.updateUVs!(sprite);
    const transform = sprite.node.getComponent(UITransform)!;
    for (let row = 0; row <= ROWS; row++) {
      const y = (row / ROWS - transform.anchorY) * transform.height;
      const weight = bodySpringWeight(y / PLAYER_SCALE);
      for (let side = 0; side < 2; side++) {
        const vertex = data.data[row * 2 + side];
        vertex.x = (side - transform.anchorX) * transform.width + sprite.bendX * weight;
        vertex.y = y + sprite.bendY * weight;
      }
    }
    data.updateRenderData(sprite, frame);
  },

  updateUVs(sprite: Sprite) {
    const data = sprite.renderData, frame = sprite.spriteFrame;
    if (!data || !frame) return;
    // SpriteFrame UV order: bottom-left, bottom-right, top-left, top-right.
    // Interpolation also supports rotated frames and atlas animation cells.
    const uv = frame.uv, vb = data.chunk.vb;
    for (let row = 0; row <= ROWS; row++) {
      const t = row / ROWS;
      for (let side = 0; side < 2; side++) {
        const offset = (row * 2 + side) * data.floatStride + 3;
        const bottom = side * 2, top = bottom + 4;
        vb[offset] = uv[bottom] + (uv[top] - uv[bottom]) * t;
        vb[offset + 1] = uv[bottom + 1] + (uv[top + 1] - uv[bottom + 1]) * t;
      }
    }
  },

  updateColor(sprite: Sprite) {
    const data = sprite.renderData;
    if (!data) return;
    const vb = data.chunk.vb, color = sprite.color;
    for (let i = 0; i < VERTICES; i++) {
      const offset = i * data.floatStride + 5;
      vb[offset] = color.r / 255; vb[offset + 1] = color.g / 255;
      vb[offset + 2] = color.b / 255; vb[offset + 3] = color.a / 255;
    }
  },

  fillBuffers(sprite: Sprite) {
    const data = sprite.renderData;
    if (!data) return;
    const { chunk } = data, vb = chunk.vb, matrix = sprite.node.worldMatrix;
    for (let i = 0; i < VERTICES; i++) {
      const { x, y } = data.data[i], offset = i * data.floatStride;
      const w = matrix.m03 * x + matrix.m07 * y + matrix.m15;
      const inverseW = w ? 1 / w : 1;
      vb[offset] = (matrix.m00 * x + matrix.m04 * y + matrix.m12) * inverseW;
      vb[offset + 1] = (matrix.m01 * x + matrix.m05 * y + matrix.m13) * inverseW;
      vb[offset + 2] = (matrix.m02 * x + matrix.m06 * y + matrix.m14) * inverseW;
    }
    data.vertDirty = false;
    const mesh = chunk.meshBuffer;
    for (let i = 0; i < INDICES.length; i++) mesh.iData[mesh.indexOffset++] = chunk.vertexOffset + INDICES[i];
  },
};

@ccclass('SpringSprite')
export class SpringSprite extends Sprite {
  bendX = 0;
  bendY = 0;

  setBend(x: number, y: number) {
    if (this.bendX === x && this.bendY === y) return;
    this.bendX = x; this.bendY = y;
    this.markForUpdateRenderData();
  }

  protected _flushAssembler() {
    if (this._assembler !== springAssembler) {
      this.destroyRenderData();
      this._assembler = springAssembler;
    }
    if (!this.renderData) {
      springAssembler.createData!(this);
      const data = this.renderData!;
      data.material = this.getRenderMaterial(0);
      this.markForUpdateRenderData();
      springAssembler.updateUVs!(this);
      this._updateColor();
    }
  }
}
