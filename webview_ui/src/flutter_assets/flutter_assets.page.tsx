import {
  VSCodeButton,
  VSCodeCheckbox,
  VSCodeDataGrid,
  VSCodeDataGridRow,
  VSCodeDataGridCell,
} from "@vscode/webview-ui-toolkit/react"
import { useEffect, useRef } from "react";

import { default as _ReactPlayer } from 'react-player';
import { ReactPlayerProps } from "react-player/types/lib";
import ImageView from "./image.view";
const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

interface FlutterAssetItemJSON {
  fileExt: string
  path: any
}

interface FlutterAssetJSON {
  watcherEnable: boolean
  item: FlutterAssetItemJSON
}

interface FlutterAssetsPageInterface {
  dataJSON: FlutterAssetJSON // {watcherEnable: false, item: {path: xxx, fileExt: yyy}}
}

function FlutterAssetsPage(props: FlutterAssetsPageInterface) {

  function isMediaFile(url: string, fileExt: string): boolean {
    const mediaExtensions = [
      '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', // 音频格式
      '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'  // 视频格式
    ];
    return mediaExtensions.includes(fileExt);
  }

  function isImageFile(url: string, fileExt: string): boolean {
    const imageExtensions = [
      '.jpg', '.jpeg', '.png', '.bmp', '.webp', '.svg', '.tiff', '.ico', '.gif'
    ];
    return imageExtensions.includes(fileExt);
  }

  const renderBody = () => {
    const tmpDataJSON = props.dataJSON
    if (typeof tmpDataJSON !== 'object') {
      return <div>无效数据</div>
    } else if (tmpDataJSON === null) {
      return <div>正在加载中...</div>
    }

    const fileExt = props.dataJSON.item.fileExt.toLowerCase()
    const srcData = props.dataJSON.item.path
    const src = `${srcData.scheme}://${srcData.authority}${srcData.path}` // 不在 VSCode 的项目内，需要这样拼接的

    if (fileExt === '.svga') {
      return (
        <>
          <div>{`src: ${src}`}</div>
          <div>加载svga</div>
        </>
      )
    } else if (isImageFile(src, fileExt)) {
      return (
        // <div>
        //   {/* <div
        //     id={'previewImage'}
        //     style={{ backgroundColor: 'transparent', maxWidth: '100%', minHeight: '100%' }}
        //   /> */}
        //   {/* <img
        //     id={'previewImage'}
        //     src={src}
        //     style={{ backgroundColor: 'transparent', maxWidth: '100%', minHeight: '100%' }}
        //     data-high-res-src="hi-res-image.png"
        //   /> */}

        //   {/* <Zmage src={src} preset={"desktop"} /> */}
        // </div>
        // <img
        //   id={'previewImage'}
        //   src={src}
        //   style={{ backgroundColor: 'transparent', maxWidth: '100%', minHeight: '100%' }}
        //   data-high-res-src="null"
        // />
        // <div
        //   id={'previewImage'}
        //   style={{ backgroundColor: 'transparent', width: '100vw', height: '100vh' }}
        // />
        <ImageView uri={src} />
      )
    } else if (isMediaFile(src, fileExt)) {
      return (
        <div>
          <ReactPlayer url={src} />
        </div>
      )
    }
    return (
      <>
        <div>{`path: ${props.dataJSON.item.path.path}`}</div>
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