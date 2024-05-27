import { AssetsMsgInterface } from "../enum/extension.type"
import ImageView from "./image.view"
import MediaView from "./media.view"
import SVGAView from "./svga.view"

function FlutterAssetsPage(props: AssetsMsgInterface) {
  const previewItem = props.previewItem
  const fileExt = props.fileExt.toLowerCase()

  function isMediaFile(url: string, fileExt: string): boolean {
    const mediaExtensions = [
      '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', // 音频格式
      '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'  // 视频格式
    ]
    return mediaExtensions.includes(fileExt)
  }

  function isImageFile(url: string, fileExt: string): boolean {
    const imageExtensions = [
      '.jpg', '.jpeg', '.png', '.bmp', '.webp', '.svg', '.tiff', '.ico', '.gif'
    ]
    return imageExtensions.includes(fileExt)
  }

  const renderBody = () => {
    if (typeof previewItem !== 'object') {
      return <div>无效数据</div>
    } else if (previewItem === null) {
      return <div>正在加载中...</div>
    }

    const src = `${previewItem.scheme}://${previewItem.authority}${previewItem.path}` // 不在 VSCode 的项目内，需要这样拼接的

    if (fileExt === '.svga') {
      return (
        <SVGAView uri={src} />
      )
    } else if (isImageFile(src, fileExt)) {
      return (
        <ImageView uri={src} />
      )
    } else if (isMediaFile(src, fileExt)) {
      return (
        <MediaView uri={src} />
      )
    }
    return (
      <>
        <div>{`path: ${src}`}</div>
        <div>资源无法显示</div>
      </>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {renderBody()}
    </div>
  )
}

export default FlutterAssetsPage