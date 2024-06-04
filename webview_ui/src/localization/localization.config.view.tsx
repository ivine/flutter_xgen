import { useEffect, useState } from "react"
import { VSCodeButton, VSCodeCheckbox, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'

import { L10nMsgInterface, FlutterIntlConfig } from "../enum/vscode_extension.type";
import { isObjectEqual } from "../util/object.util";
import { getStringOrEmpty } from "../util/string.util";

export const LocalizationConfigViewCollapsedHeight = 40
export const LocalizationConfigViewExpandedHeight = 220

const defaultFlutterIntlConfig: any = {
  enabled: true,
}

const checkedFlutterIntlConfig: FlutterIntlConfig = {
  enabled: true,
  class_name: "",
  main_locale: "",
  arb_dir: "",
  output_dir: "",
  use_deferred_loading: false,
  localizely: undefined
}

export interface LocalizationConfigViewInterface {
  msg: L10nMsgInterface
  onUpdateHeight: (height: number) => void
}

function LocalizationConfigView(props: LocalizationConfigViewInterface) {
  const [expand, setExpand] = useState(false)
  const [watcherEnable, setWatcherEnable] = useState(false)
  const [flutterIntlConfig, setFlutterIntlConfig] = useState<FlutterIntlConfig | null>(defaultFlutterIntlConfig)
  const [modifiedSaveFlutterIntlConfig, setModifiedSaveFlutterIntlConfig] = useState<boolean>(false)

  useEffect(() => {
    setWatcherEnable(props.msg.watcherEnable)
    setFlutterIntlConfig(Object.assign({}, defaultFlutterIntlConfig, props.msg.flutterIntlConfig))
  }, [props.msg.flutterIntlConfig])

  const checkIfFlutterIntlConfigModified = (configs: any) => {
    let result = false
    try {
      result = !isObjectEqual(props.msg.flutterIntlConfig, configs)
    } catch (error) {
      // console.log('checkIfFlutterIntlConfigsModified, error: ', error)
    }
    return result
  }

  const updateWatcherEnable = (value: boolean) => {
    setWatcherEnable(value)
  }

  const updateFlutterIntlConfig = (key: string, value: any) => {
    if (!Object.keys(checkedFlutterIntlConfig).includes(key)) {
      return
    }
    const tmpConfig = Object.assign({}, flutterIntlConfig)
    tmpConfig[key] = value
    const modified = checkIfFlutterIntlConfigModified(tmpConfig)
    if (modified !== modifiedSaveFlutterIntlConfig) {
      setModifiedSaveFlutterIntlConfig(modified)
    }
    setFlutterIntlConfig(tmpConfig)
  }

  const renderButton = (title: string, onClick: () => void, leftPadding: boolean, rightPadding: boolean) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {leftPadding ? <div style={{ width: 20 }} /> : null}
        <VSCodeButton onClick={onClick}>{title}</VSCodeButton>
        {rightPadding ? <div style={{ width: 20 }} /> : null}
      </div>
    )
  }

  const renderFunctionButtons = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: 40,
        }}
      >
        <VSCodeCheckbox
          checked={watcherEnable}
          clickHandler={(e) => {
            updateWatcherEnable(!watcherEnable)
          }}
        >
          自动生成
        </VSCodeCheckbox>
        {
          renderButton(
            "立即生成",
            () => { },
            true,
            false,
          )
        }
        {
          renderButton(
            "arb 文件同步",
            () => { },
            true,
            false,
          )
        }
        {
          renderButton(
            "读取配置",
            () => { },
            true,
            false,
          )
        }
        {
          modifiedSaveFlutterIntlConfig ? renderButton(
            "保存配置",
            () => {
              console.log('保存配置')
              setModifiedSaveFlutterIntlConfig(false)
            },
            true,
            false,
          ) : null
        }
        {
          renderButton(
            expand ? '隐藏' : '查看配置',
            () => {
              let value = !expand
              props.onUpdateHeight(value ? LocalizationConfigViewExpandedHeight : LocalizationConfigViewCollapsedHeight)
              setExpand(value)
            },
            true,
            true,
          )
        }
      </div>
    )
  }

  const renderFlutterIntlConfig = () => {
    if (!expand) {
      return <></>
    }
    const configs = flutterIntlConfig
    const containerH = LocalizationConfigViewExpandedHeight - LocalizationConfigViewCollapsedHeight
    const checkBoxH = 40
    const textFieldH = 60
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: containerH,
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
          }}
        >
          <div style={{ height: 16 }} />
          <VSCodeCheckbox
            style={{ height: checkBoxH }}
            checked={configs.enabled}
            onChange={(e) => {
              updateFlutterIntlConfig('enable', !configs.enabled)
            }}
          >
            enable
          </VSCodeCheckbox>
          <div style={{ height: 16 }} />
          <VSCodeTextField
            type="text"
            placeholder="S"
            style={{ height: textFieldH }}
            value={getStringOrEmpty(configs.class_name)}
            onChange={(e) => {
              const value = e.target._value
              updateFlutterIntlConfig('class_name', value)
            }}
          >
            class_name
          </VSCodeTextField>
          <div style={{ height: 16 }} />
          <VSCodeTextField
            type="text"
            placeholder="en"
            style={{ height: textFieldH }}
            value={getStringOrEmpty(configs.main_locale)}
            onChange={(e) => {
              const value = e.target._value
              updateFlutterIntlConfig('main_locale', value)
            }}
          >
            main_locale
          </VSCodeTextField>
          <div style={{ height: 16 }} />
        </div>
        <div style={{ width: 20 }} />
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
          }}
        >
          <div style={{ height: 16 }} />
          <VSCodeCheckbox
            style={{ height: checkBoxH }}
            checked={configs.use_deferred_loading}
            onChange={(e) => {
              updateFlutterIntlConfig('use_deferred_loading', !configs.use_deferred_loading)
            }}
          >
            use_deferred_loading
          </VSCodeCheckbox>
          <div style={{ height: 16 }} />
          <VSCodeTextField
            type="text"
            placeholder="lib/l10n"
            style={{ height: textFieldH }}
            value={getStringOrEmpty(configs.arb_dir)}
            onChange={(e) => {
              const value = e.target._value
              updateFlutterIntlConfig('arb_dir', value)
            }}
          >
            arb_dir
          </VSCodeTextField>
          <div style={{ height: 16 }} />
          <VSCodeTextField
            type="text"
            placeholder="lib/generated"
            style={{ height: textFieldH }}
            value={getStringOrEmpty(configs.output_dir)}
            onChange={(e) => {
              const value = e.target._value
              updateFlutterIntlConfig('output_dir', value)
            }}
          >
            output_dir
          </VSCodeTextField>
          <div style={{ height: 16 }} />
        </div>
        <div style={{ width: 20 }} />
      </div>
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
      {renderFunctionButtons()}
      {renderFlutterIntlConfig()}
    </div>
  )
}

export default LocalizationConfigView