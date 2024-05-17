import {
  VSCodeButton,
  VSCodeCheckbox,
  VSCodeDataGrid,
  VSCodeDataGridRow,
  VSCodeDataGridCell,
} from "@vscode/webview-ui-toolkit/react"

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

  const renderBody = () => {
    const tmpDataJSON = props.dataJSON
    if (typeof tmpDataJSON !== 'object') {
      return <div>无效数据</div>
    } else if (tmpDataJSON === null) {
      return <div>正在加载中...</div>
    }

    const fileExt = props.dataJSON.item.fileExt.toLowerCase()
    const imgExts = ['.png', ".jpg", ".jpeg", ".webp", ".svg"]
    const srcData = props.dataJSON.item.path
    const src = `${srcData.scheme}://${srcData.authority}${srcData.path}` // 不在 VSCode 的项目内，需要这样拼接的

    if (fileExt === '.svga') {
      return (
        <>
          <div>{`src: ${src}`}</div>
          <div>加载svga</div>
        </>
      )
    } else if (fileExt === '.gif') {
      return (
        <>
          <div>{`src: ${src}`}</div>
          <div>加载gif</div>
        </>
      )
    } else if (imgExts.includes(fileExt)) {
      return <img src={src} style={{ maxWidth: '100%', maxHeight: '100%' }} />
    }
    return (
      <>
        <div>{`path: ${props.dataJSON.item.path.path}`}</div>
        <div>资源无法显示</div>
      </>
    )
  }

  return (
    <div>
      {renderBody()}
    </div>
  )
}

export default FlutterAssetsPage