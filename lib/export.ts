import type { Dataset } from './csv'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function serialize(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const { width, height } = svg.viewBox.baseVal
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  return { xml: new XMLSerializer().serializeToString(clone), width, height }
}

export function exportSvg(svg: SVGSVGElement, name: string) {
  download(new Blob([serialize(svg).xml], { type: 'image/svg+xml' }), `${name}.svg`)
}

// The SVG's viewBox is in CSS pixels (96 per inch), so dpi / 96 is the pixel scale for that resolution.
export const outputSize = (svg: SVGSVGElement, dpi: number) => {
  const { width, height } = svg.viewBox.baseVal
  return { width: Math.round((width * dpi) / 96), height: Math.round((height * dpi) / 96) }
}

async function renderCanvas(svg: SVGSVGElement, dpi: number) {
  const scale = dpi / 96
  const { xml, width, height } = serialize(svg)
  const img = new Image()
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }))
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('이미지를 만들지 못했어요.'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('이미지를 만들지 못했어요.')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return { canvas, ctx }
  } finally {
    URL.revokeObjectURL(url)
  }
}

let crcTable: Uint32Array | null = null
function crc32(bytes: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

// Writes the DPI into the PNG (a pHYs chunk right after IHDR) so print tools read the right size.
function withPngDpi(png: Uint8Array, dpi: number) {
  const perMeter = Math.round(dpi / 0.0254)
  const chunk = new Uint8Array(21)
  const v = new DataView(chunk.buffer)
  v.setUint32(0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4)
  v.setUint32(8, perMeter)
  v.setUint32(12, perMeter)
  chunk[16] = 1
  v.setUint32(17, crc32(chunk.subarray(4, 17)))
  const at = 33 // 8-byte signature + 25-byte IHDR chunk
  const out = new Uint8Array(png.length + chunk.length)
  out.set(png.subarray(0, at), 0)
  out.set(chunk, at)
  out.set(png.subarray(at), at + chunk.length)
  return out
}

export async function exportPng(svg: SVGSVGElement, name: string, dpi: number) {
  const { canvas } = await renderCanvas(svg, dpi)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('이미지를 만들지 못했어요.')
  const bytes = withPngDpi(new Uint8Array(await blob.arrayBuffer()), dpi)
  download(new Blob([bytes as BlobPart], { type: 'image/png' }), `${name}.png`)
}

// Writes the DPI into the JPEG's JFIF header (units byte at 13, then X / Y density).
function withJpegDpi(jpg: Uint8Array, dpi: number) {
  const out = jpg.slice()
  const isJfif = out[2] === 0xff && out[3] === 0xe0 && out[6] === 0x4a && out[7] === 0x46
  if (!isJfif) return out
  out[13] = 1 // dots per inch
  out[14] = dpi >> 8
  out[15] = dpi & 255
  out[16] = dpi >> 8
  out[17] = dpi & 255
  return out
}

export async function exportJpg(svg: SVGSVGElement, name: string, dpi: number) {
  const { canvas } = await renderCanvas(svg, dpi)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95))
  if (!blob) throw new Error('이미지를 만들지 못했어요.')
  const bytes = withJpegDpi(new Uint8Array(await blob.arrayBuffer()), dpi)
  download(new Blob([bytes as BlobPart], { type: 'image/jpeg' }), `${name}.jpg`)
}

// Uncompressed little-endian RGB TIFF (no extra dependency needed).
function encodeTiff(rgba: Uint8ClampedArray, w: number, h: number, dpi: number): Blob {
  const entries = 12
  const ifdSize = 2 + entries * 12 + 4
  const bpsOff = 8 + ifdSize
  const xresOff = bpsOff + 6
  const yresOff = xresOff + 8
  const dataOff = yresOff + 8
  const dataLen = w * h * 3
  const buf = new ArrayBuffer(dataOff + dataLen)
  const v = new DataView(buf)

  v.setUint16(0, 0x4949, true)
  v.setUint16(2, 42, true)
  v.setUint32(4, 8, true)
  v.setUint16(8, entries, true)

  let at = 10
  const entry = (tag: number, type: number, count: number, value: number) => {
    v.setUint16(at, tag, true)
    v.setUint16(at + 2, type, true)
    v.setUint32(at + 4, count, true)
    if (type === 3 && count === 1) v.setUint16(at + 8, value, true)
    else v.setUint32(at + 8, value, true)
    at += 12
  }
  const SHORT = 3
  const LONG = 4
  const RATIONAL = 5
  entry(256, LONG, 1, w)
  entry(257, LONG, 1, h)
  entry(258, SHORT, 3, bpsOff)
  entry(259, SHORT, 1, 1)
  entry(262, SHORT, 1, 2)
  entry(273, LONG, 1, dataOff)
  entry(277, SHORT, 1, 3)
  entry(278, LONG, 1, h)
  entry(279, LONG, 1, dataLen)
  entry(282, RATIONAL, 1, xresOff)
  entry(283, RATIONAL, 1, yresOff)
  entry(296, SHORT, 1, 2)
  v.setUint32(at, 0, true)

  for (let i = 0; i < 3; i++) v.setUint16(bpsOff + i * 2, 8, true)
  v.setUint32(xresOff, dpi, true)
  v.setUint32(xresOff + 4, 1, true)
  v.setUint32(yresOff, dpi, true)
  v.setUint32(yresOff + 4, 1, true)

  const out = new Uint8Array(buf, dataOff)
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    out[j++] = rgba[i]
    out[j++] = rgba[i + 1]
    out[j++] = rgba[i + 2]
  }
  return new Blob([buf], { type: 'image/tiff' })
}

export async function exportTiff(svg: SVGSVGElement, name: string, dpi: number) {
  const { canvas, ctx } = await renderCanvas(svg, dpi)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  download(encodeTiff(data, canvas.width, canvas.height, dpi), `${name}.tiff`)
}

export function exportCsv(ds: Dataset, name: string) {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const text = [ds.headers, ...ds.rows].map((r) => r.map(esc).join(',')).join('\r\n')
  // BOM so Excel opens Korean text correctly
  download(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)
}
