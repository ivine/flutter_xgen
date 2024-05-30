import { useEffect, useState } from "react"
import { VSCodeButton, VSCodeCheckbox, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'
import { AssetsMsgInterface } from "../enum/vscode_extension.type"

enum FlutterAssetsConfigType {
  Cr1992,
  FlutterGen,
}

function FlutterAssetsConfigView(props: AssetsMsgInterface) {
  const [currentConfigType, setCurrentConfigType] = useState<FlutterAssetsConfigType>(FlutterAssetsConfigType.Cr1992)

  const renderCr1992ConfigView = () => {
    return (
      <></>
    )
  }

  const renderFlutterGenConfigView = () => {
    return (
      <></>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: '#32c48c',
        width: '100%',
        height: '100%',
      }}
    >
      {currentConfigType === FlutterAssetsConfigType.Cr1992 ? renderCr1992ConfigView() : <></>}
      {currentConfigType === FlutterAssetsConfigType.FlutterGen ? renderFlutterGenConfigView() : <></>}
    </div>
  )
}

export default FlutterAssetsConfigView