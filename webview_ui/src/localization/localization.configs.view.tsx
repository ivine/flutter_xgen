import { useEffect, useState } from "react"
import { VSCodeButton, VSCodeCheckbox, VSCodeTextField } from '@vscode/webview-ui-toolkit/react'

import { L10nMsgInterface, FlutterIntlConfigs } from "../enum/extension.type";
import { isObjectEqual } from "../util/object.util";
import { getStringOrEmpty } from "../util/string.util";

export const LocalizationConfigsViewCollapsedHeight = 60
export const LocalizationConfigsViewExpandedHeight = 280

const defaultFlutterIntlConfigs: any = {
  enabled: true,
}

const checkedFlutterIntlConfigs: FlutterIntlConfigs = {
  enabled: true,
  class_name: "",
  main_locale: "",
  arb_dir: "",
  output_dir: "",
  use_deferred_loading: false,
  localizely: undefined
}

export interface LocalizationConfigsViewInterface {
  msg: L10nMsgInterface
  onUpdateHeight: (height: number) => void
}

function LocalizationConfigsView(props: LocalizationConfigsViewInterface) {
  const [expand, setExpand] = useState(false)
  const [watcherEnable, setWatcherEnable] = useState(false)
  const [flutterIntlConfigs, setFlutterIntlConfigs] = useState<FlutterIntlConfigs | null>(defaultFlutterIntlConfigs)
  const [modifiedSaveFlutterIntlConfigs, setModifiedSaveFlutterIntlConfigs] = useState<boolean>(false)

  useEffect(() => {
    setWatcherEnable(props.msg.watcherEnable)
    setFlutterIntlConfigs(Object.assign({}, defaultFlutterIntlConfigs, props.msg.flutterIntlConfigs))
  }, [props.msg.flutterIntlConfigs])

  const checkIfFlutterIntlConfigsModified = (configs: any) => {
    let result = false
    try {
      result = !isObjectEqual(props.msg.flutterIntlConfigs, configs)
    } catch (error) {
      // console.log('checkIfFlutterIntlConfigsModified, error: ', error)
    }
    return result
  }

  const updateWatcherEnable = (value: boolean) => {
    setWatcherEnable(value)
  }

  const updateFlutterIntlConfigs = (key: string, value: any) => {
    if (!Object.keys(checkedFlutterIntlConfigs).includes(key)) {
      return
    }
    const tmpConfig = Object.assign({}, flutterIntlConfigs)
    tmpConfig[key] = value
    const modified = checkIfFlutterIntlConfigsModified(tmpConfig)
    if (modified !== modifiedSaveFlutterIntlConfigs) {
      setModifiedSaveFlutterIntlConfigs(modified)
    }
    setFlutterIntlConfigs(tmpConfig)
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
          modifiedSaveFlutterIntlConfigs ? renderButton(
            "保存配置",
            () => {
              console.log('保存配置')
              setModifiedSaveFlutterIntlConfigs(false)
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
              props.onUpdateHeight(value ? LocalizationConfigsViewExpandedHeight : LocalizationConfigsViewCollapsedHeight)
              setExpand(value)
            },
            true,
            true,
          )
        }
      </div>
    )
  }

  const renderFlutterIntlConfigs = () => {
    if (!expand) {
      return <></>
    }
    const configs = flutterIntlConfigs
    const containerH = LocalizationConfigsViewExpandedHeight - LocalizationConfigsViewCollapsedHeight
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
            checked={configs.enabled}
            onChange={(e) => {
              updateFlutterIntlConfigs('enable', !configs.enabled)
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
              updateFlutterIntlConfigs('class_name', value)
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
              updateFlutterIntlConfigs('main_locale', value)
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
              updateFlutterIntlConfigs('use_deferred_loading', !configs.use_deferred_loading)
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
              updateFlutterIntlConfigs('arb_dir', value)
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
              updateFlutterIntlConfigs('output_dir', value)
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
      {renderFunctionButton()}
      {renderFlutterIntlConfigs()}
    </div>
  )
}

export default LocalizationConfigsView