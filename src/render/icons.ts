import type { Category } from '../categories'

// Minimal monochrome glyphs drawn as canvas paths. Abstract but distinct;
// color carries the primary category identity, the glyph reinforces it.
// Each glyph is drawn within a box of half-size `r` centered at (cx, cy).

export function drawCategoryGlyph(
  ctx: CanvasRenderingContext2D,
  cat: Category,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(1, r * 0.3)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const px = (dx: number) => cx + dx * r
  const py = (dy: number) => cy + dy * r

  switch (cat) {
    case 'war': {
      // crossed sabres
      line(ctx, px(-0.75), py(0.7), px(0.7), py(-0.75))
      line(ctx, px(0.75), py(0.7), px(-0.7), py(-0.75))
      break
    }
    case 'revolution': {
      // raised flag
      line(ctx, px(-0.55), py(-0.85), px(-0.55), py(0.85))
      ctx.beginPath()
      ctx.moveTo(px(-0.55), py(-0.85))
      ctx.lineTo(px(0.7), py(-0.5))
      ctx.lineTo(px(-0.55), py(-0.15))
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'politics': {
      // classical building (roof + columns + base)
      line(ctx, px(-0.8), py(-0.5), px(0.8), py(-0.5))
      line(ctx, px(-0.8), py(0.7), px(0.8), py(0.7))
      line(ctx, px(-0.5), py(-0.5), px(-0.5), py(0.7))
      line(ctx, px(0), py(-0.5), px(0), py(0.7))
      line(ctx, px(0.5), py(-0.5), px(0.5), py(0.7))
      break
    }
    case 'treaty': {
      // olive branch
      line(ctx, px(-0.7), py(0.7), px(0.6), py(-0.65))
      leaf(ctx, px(-0.05), py(0.0), r * 0.34, -0.7)
      leaf(ctx, px(0.3), py(-0.35), r * 0.34, -0.7)
      break
    }
    case 'disaster': {
      // warning triangle
      ctx.beginPath()
      ctx.moveTo(px(0), py(-0.8))
      ctx.lineTo(px(0.8), py(0.65))
      ctx.lineTo(px(-0.8), py(0.65))
      ctx.closePath()
      ctx.stroke()
      line(ctx, px(0), py(-0.2), px(0), py(0.2))
      dot(ctx, px(0), py(0.45), r * 0.14)
      break
    }
    case 'science': {
      // book
      ctx.strokeRect(px(-0.7), py(-0.55), r * 1.4, r * 1.1)
      line(ctx, px(0), py(-0.55), px(0), py(0.55))
      break
    }
    case 'religion': {
      // 4-point star (non-denominational)
      ctx.beginPath()
      ctx.moveTo(px(0), py(-0.85))
      ctx.lineTo(px(0.2), py(-0.2))
      ctx.lineTo(px(0.85), py(0))
      ctx.lineTo(px(0.2), py(0.2))
      ctx.lineTo(px(0), py(0.85))
      ctx.lineTo(px(-0.2), py(0.2))
      ctx.lineTo(px(-0.85), py(0))
      ctx.lineTo(px(-0.2), py(-0.2))
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'exploration': {
      // compass
      circle(ctx, cx, cy, r * 0.82, false)
      ctx.beginPath()
      ctx.moveTo(px(0.45), py(-0.45))
      ctx.lineTo(px(-0.1), py(0.1))
      ctx.lineTo(px(-0.45), py(0.45))
      ctx.lineTo(px(0.1), py(-0.1))
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'economy': {
      // coin
      circle(ctx, cx, cy, r * 0.82, false)
      circle(ctx, cx, cy, r * 0.32, false)
      break
    }
    default: {
      // general — a simple disc
      dot(ctx, cx, cy, r * 0.5)
    }
  }
  ctx.restore()
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: boolean) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  if (fill) ctx.fill()
  else ctx.stroke()
}

function dot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function leaf(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
