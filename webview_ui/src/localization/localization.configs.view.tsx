import { useEffect, useState } from "react"
import { VSCodeButton, VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react'

import { L10nMsgInterface, FlutterIntlConfigs } from "../enum/extension.type";

export const LocalizationConfigsViewCollapsedHeight = 60
export const LocalizationConfigsViewExpandedHeight = 260

export interface LocalizationConfigsViewInterface {
  msg: L10nMsgInterface
  onUpdateHeight: (height: number) => void
}

function LocalizationConfigsView(props: LocalizationConfigsViewInterface) {
  const [expand, setExpand] = useState(false)

  const renderFunctionButton = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          paddingTop: 10,
          paddingBottom: 10,
          width: '100%',
          height: 40,
        }}
      >
        <div style={{ width: 20 }} />
        <VSCodeCheckbox>自动生成</VSCodeCheckbox>
        <div style={{ width: 20 }} />
        <VSCodeButton>立即生成</VSCodeButton>
        <div style={{ width: 20 }} />
        <VSCodeButton>arb 文件同步</VSCodeButton>
        <div style={{ width: 20 }} />
        <VSCodeButton>读取配置</VSCodeButton>
        <div style={{ width: 20 }} />
        <VSCodeButton>保存配置</VSCodeButton>
        <div style={{ width: 20 }} />
        <VSCodeButton
          onClick={() => {
            let value = !expand
            props.onUpdateHeight(value ? LocalizationConfigsViewExpandedHeight : LocalizationConfigsViewCollapsedHeight)
            setExpand(value)
          }}
        >
          {expand ? '隐藏' : '查看配置'}
        </VSCodeButton>
        <div style={{ width: 20 }} />
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