'use client'

import { useEffect, useRef } from 'react'

interface Props {
  url: string
  size?: number
}

export function QrCode({ url, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    import('qrcode').then((QRCode) => {
      if (cancelled || !canvasRef.current) return
      QRCode.toCanvas(canvasRef.current, url, { width: size, margin: 1 })
    })
    return () => {
      cancelled = true
    }
  }, [url, size])

  return <canvas ref={canvasRef} width={size} height={size} className="rounded" />
}
