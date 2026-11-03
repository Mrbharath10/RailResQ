import React from 'react'

/**
 * Authentic SVG QR Code Renderer for Demo Railway Tickets
 * Generates an IRCTC-style 2D verification barcode matrix
 */
export default function DemoTicketQRCode({ value, size = 128, className = "" }) {
  // Deterministic 21x21 matrix generation based on hash of value string
  const hash = Array.from(value || "RAILRESQ").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 7)
  const matrixSize = 21
  const matrix = Array(matrixSize).fill(0).map(() => Array(matrixSize).fill(false))

  // 1. Draw 3 Position Finder Patterns (Top-Left, Top-Right, Bottom-Left 7x7)
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer 7x7 border
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner 3x3 solid block
        ) {
          matrix[startY + r][startX + c] = true
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(matrixSize - 7, 0)
  drawFinder(0, matrixSize - 7)

  // 2. Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // 3. Fill payload pseudo-randomly using hash for authentic visual look
  let seed = hash
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finders and timing lines
      const inTopLeft = r < 8 && c < 8
      const inTopRight = r < 8 && c >= matrixSize - 8
      const inBottomLeft = r >= matrixSize - 8 && c < 8
      const inTiming = r === 6 || c === 6

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        matrix[r][c] = (seed % 3 === 0) || ((r + c) % 2 === 0)
      }
    }
  }

  const cellSize = size / matrixSize

  return (
    <div className={`inline-block bg-white p-2 rounded-lg shadow-sm border border-slate-300 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  )
}
