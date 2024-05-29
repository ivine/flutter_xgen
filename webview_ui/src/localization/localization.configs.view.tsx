import { useEffect } from "react"
import { VSCodeButton, VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'

import { L10nMsgInterface, FlutterIntlConfigs } from "../enum/extension.type";

function LocalizationConfigsView(props: L10nMsgInterface) {
  const renderFunctionButton = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: 60,
        }}
      >
        <VSCodeCheckbox>自动监听</VSCodeCheckbox>
      </div>
    )
  }

  const renderSettings = () => {
    return (
      <></>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      {renderFunctionButton()}
      {renderSettings()}
    </div>
  )
}

export default LocalizationConfigsView