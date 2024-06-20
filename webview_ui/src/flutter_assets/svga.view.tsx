import React, { useEffect, useRef } from 'react'

function SVGAView(props: any) {
  const { uri } = props
  const canvasRef = useRef(null)
  const wzoomRef = useRef(null)

  const parser = new window.SVGA.Parser({ isDisableWebWorker: true })
  let player: any = null

  useEffect(() => {
    setupData()
    return () => {
      dispose()
    }
  }, [uri])

  async function setupData() {
    dispose()
    const svga = await parser.load(uri)
    if (canvasRef.current !== null) {
      player = new window.SVGA.Player(canvasRef.current)
      await player.mount(svga)
      player.start()

      if (wzoomRef.current !== null) {
        wzoomRef.current.destroy()
      }
      wzoomRef.current = window.WZoom.create('#canvas', {
        type: 'html',
        width: 600,
        height: 600,
        maxScale: 20,
        speed: 1.05,
        smoothTime: 0.15
      })
    } else {
    }
  }

  async function dispose() {
    try {
      if (parser) {
        parser.destroy()
      }
      if (player) {
        player.destroy()
      }
    } catch (error) {
      console.log('SVGAView dispose, error: ', error)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: 500,
        backgroundColor: '#2c2c2c80'
      }}
    >
      <canvas id="canvas" ref={canvasRef}></canvas>
    </div>
  )
}

export default SVGAView
