import { useEffect } from 'react'
import { default as _ReactPlayer } from 'react-player/lazy'
import { ReactPlayerProps } from 'react-player/types/lib'
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>

function MediaView(props: any, deprecatedLegacyContext?: any) {
  const { uri } = props

  return (
    <ReactPlayer
      url={uri}
      controls={true}
      width={500}
      volume={1}
    />
  )
}

export default MediaView
