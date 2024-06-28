import React, { useEffect, useRef } from 'react'

function ImageView(props: any) {
  const { uri } = props

  const wzoomRef = useRef(null)

  useEffect(() => {
    return () => {
      try {
        wzoomRef.current?.destroy()
      } catch (error) {
      }
    }
  }, [])

  return (
    <div
      id={'previewImageContainer'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: 500,
        backgroundColor: '#2c2c2c80'
      }}
    >
      <img
        id={'previewImage'}
        src={uri}
        style={{
          backgroundColor: 'transparent',
          minWidth: 200,
          minHeight: 200,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onLoad={() => {
          if (wzoomRef.current !== null) {
            wzoomRef.current.destroy()
          }
          wzoomRef.current = window.WZoom.create('#previewImage', {
            type: 'html',
            width: 600,
            height: 600,
            maxScale: 20,
            speed: 1.05,
            smoothTime: 0.15
          })
        }}
      />
    </div>
  )
}

export default ImageView
