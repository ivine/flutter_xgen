import { useEffect } from 'react'
import { default as _ReactPlayer } from 'react-player/lazy'
import { ReactPlayerProps } from 'react-player/types/lib'
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>

function MediaView(props: any, deprecatedLegacyContext?: any) {
  const { uri } = props

  useEffect(() => {
    console.log('MediaView, uri: ', uri)
  }, [uri])

  return (
    <ReactPlayer
      url={uri}
      controls={true}
      width={500}
      volume={1}
      onError={(e) => {
        console.log('ReactPlayer - onError, error: ', e)
      }}
      onPlay={() => {
        console.log('ReactPlayer - onPlay')
      }}
      onProgress={(state) => {
        console.log('ReactPlayer - onProgress, state: ', state)
      }}
      onSeek={(seconds) => {
        console.log('ReactPlayer - onSeek, seconds: ', seconds)
      }}
    />
  )
}

export default MediaView
