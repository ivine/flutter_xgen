import { useEffect, useMemo, useRef, useState } from 'react'
import { VSCodeTextField } from '@vscode/webview-ui-toolkit/react'

import {
  FXGWatcherType,
  FlutterPubspecYamlConfigType,
  FlutterIntlConfig,
  InteractionEventType,
  MsgInterface
} from '../enum/vscode_extension.type'
import { isObjectEqual } from '../util/object.util'
import { getStringOrEmpty, isEmptyString } from '../util/string.util'
import InteractionManager from '../interaction/interaction.manager'
import FXGCheckBox from '../component/check_box'
import FXGButton from '../component/button'
import FXGContainer from '../component/container'
import { l10n_local_key_name } from './localization.page'

export const LocalizationConfigViewCollapsedHeight = 40
export const LocalizationConfigViewExpandedHeight = 220

const checkedFlutterIntlConfig: FlutterIntlConfig = {
  enabled: true,
  class_name: '',
  main_locale: '',
  arb_dir: '',
  output_dir: '',
  use_deferred_loading: false,
  localizely: undefined
}

export interface LocalizationGridData {
  arbFileNames: string[]
  data: string[][]
}

export interface LocalizationConfigViewInterface {
  msg: MsgInterface
  onUpdateHeight: (height: number) => void
  onGetGridData: () => LocalizationGridData
  onClickExportCsvButton: () => void
}

function LocalizationConfigView(props: LocalizationConfigViewInterface) {
  const l10n = props.msg.data.l10n
  const watcherTypes = props.msg.projectInfo.watcherTypes ?? []
  const [expand, setExpand] = useState(false)
  const flutterIntlConfigRef = useRef<FlutterIntlConfig | null>(null) // 配置引用
  const isModifiedConfigRef = useRef<boolean>() // 是否修改了配置

  const [updateCounter, setUpdateCounter] = useState<number>(0)

  useEffect(() => {
    flutterIntlConfigRef.current = l10n.flutterIntlConfig
    isModifiedConfigRef.current = false
  }, [l10n])

  const checkIfConfigModified = (originalConfig: any, targetConfig: any): boolean => {
    let tmpOriginalConfig = originalConfig
    if (typeof tmpOriginalConfig !== 'object') {
      tmpOriginalConfig = {}
    }
    let result = false
    try {
      result = !isObjectEqual(tmpOriginalConfig, targetConfig)
    } catch (error) {
      // console.log('checkIfConfigModified, error: ', error)
    }
    return result
  }

  // return: {intl_en.arb: { key1: value1, key2: value2, ...}, ...}
  const gridDataToJSON = (inputData: LocalizationGridData): Map<string, Map<string, string>> => {
    const arbFileNames: string[] = inputData.arbFileNames
    const gridData: string[][] = inputData.data
    const keyColumnIndex: number = arbFileNames.indexOf(l10n_local_key_name)

    const jsonMap: Map<string, Map<string, string>> = new Map()
    for (let i = 0; i < gridData.length; i++) {
      let row = gridData[i]
      let key = row[keyColumnIndex]
      for (let j = 0; j < row.length; j++) {
        if (j === keyColumnIndex) {
          continue
        }
        let arbFileName = arbFileNames[j]
        let value = row[j]
        let arbFileDataMap: Map<string, string> = new Map()
        if (jsonMap.has(arbFileName)) {
          arbFileDataMap = jsonMap.get(arbFileName)
        } else {
          jsonMap.set(arbFileName, arbFileDataMap)
        }
        arbFileDataMap.set(key, value)
      }
    }
    console.log(jsonMap)
    return jsonMap
  }

  const watcherEnable: boolean = useMemo(() => {
    let result: boolean = watcherTypes.includes(FXGWatcherType.l10n)
    return result
  }, [watcherTypes])

  const updateUI = () => {
    let value = updateCounter + 1
    // console.log('updateUI, value: ', value)
    setUpdateCounter(value)
  }

  const updateWatcherEnable = (value: boolean) => {
    InteractionManager.getInstance().postMsg(InteractionEventType.webToExt_intl_watcher_enable, props.msg.projectInfo, value)
    InteractionManager.getInstance().postMsg(InteractionEventType.sync_project_info, props.msg.projectInfo, null)
    updateUI()
  }

  const updateFlutterIntlConfig = (key: string, value: any, shouldRemoveKey: boolean = false) => {
    if (!Object.keys(checkedFlutterIntlConfig).includes(key)) {
      return
    }
    const tmpConfig = Object.assign({}, flutterIntlConfigRef.current)
    if (shouldRemoveKey) {
      delete tmpConfig[key]
    } else {
      tmpConfig[key] = value
    }
    checkIfConfigModified(flutterIntlConfigRef.current, tmpConfig)
    flutterIntlConfigRef.current = tmpConfig
    updateSaveConfigButtonState()
    // console.log(`updateFlutterIntlConfig, key: ${key}, value: ${value}, shouldRemoveKey: ${shouldRemoveKey}`)
  }

  const updateSaveConfigButtonState = () => {
    const modified = checkIfConfigModified(props.msg.data.l10n.flutterIntlConfig, flutterIntlConfigRef.current)
    isModifiedConfigRef.current = modified
    updateUI()
  }

  function mapToObject(map: Map<string, any>): any {
    const obj = Object.fromEntries(
      Array.from(map.entries()).map(([key, value]) => {
        if (value instanceof Map) {
          return [key, mapToObject(value)] // 递归转换内部 Map
        } else {
          return [key, value]
        }
      })
    )
    return obj
  }

  const renderFunctionButtons = () => {
    const tmpWatcherEnable = watcherEnable && !props.msg.data.l10n.localizelyFlutterIntlInstalled
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%'
        }}
      >
        <FXGContainer
          style={{
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}
        >
          <FXGCheckBox
            title="自动生成"
            checked={tmpWatcherEnable}
            enabled={!props.msg.data.l10n.localizelyFlutterIntlInstalled}
            onChange={(value) => {
              updateWatcherEnable(value)
            }}
          />
          {props.msg.data.l10n.localizelyFlutterIntlInstalled ? <div style={{ marginTop: 2 }}>localizely.flutter-intl 已安装</div> : null}
        </FXGContainer>
        <FXGButton
          title={'立即生成'}
          leftSpacing={16}
          onClick={() => {
            const newJSON = gridDataToJSON(props.onGetGridData())
            if (typeof newJSON === 'object') {
              try {
                const newJSONString = JSON.stringify(mapToObject(newJSON), null, 2)
                InteractionManager.getInstance().postMsg(InteractionEventType.webToExt_intl_run, props.msg.projectInfo, {
                  type: FlutterPubspecYamlConfigType.flutter_intl,
                  data: newJSONString
                })
              } catch (error) {
                //
              }
            }
          }}
        />
        <FXGButton
          title={'从 arb 文件同步'}
          leftSpacing={16}
          onClick={() => {
            InteractionManager.getInstance().postMsg(InteractionEventType.sync_intl, props.msg.projectInfo, {
              type: FlutterPubspecYamlConfigType.flutter_intl
            })
          }}
        />
        <FXGButton
          title="读取配置"
          leftSpacing={16}
          onClick={() => {
            InteractionManager.getInstance().postMsg(InteractionEventType.webToExt_intl_read_config, props.msg.projectInfo, {
              type: FlutterPubspecYamlConfigType.flutter_intl,
              config: flutterIntlConfigRef.current
            })
          }}
        />
        <FXGButton
          title="保存配置"
          disabled={!isModifiedConfigRef.current}
          leftSpacing={16}
          onClick={() => {
            InteractionManager.getInstance().postMsg(InteractionEventType.webToExt_intl_save_config, props.msg.projectInfo, {
              type: FlutterPubspecYamlConfigType.flutter_intl,
              config: flutterIntlConfigRef.current
            })
          }}
        />
        <FXGButton
          title={expand ? '隐藏' : '查看配置'}
          leftSpacing={16}
          onClick={() => {
            let value = !expand
            props.onUpdateHeight(value ? LocalizationConfigViewExpandedHeight : LocalizationConfigViewCollapsedHeight)
            setExpand(value)
          }}
        />
        <FXGButton
          title={'导出 csv'}
          leftSpacing={16}
          onClick={() => {
            props.onClickExportCsvButton()
          }}
        />
      </div>
    )
  }

  const renderFlutterIntlConfig = () => {
    if (!expand) {
      return <></>
    }
    const configs = flutterIntlConfigRef.current
    const containerH = LocalizationConfigViewExpandedHeight - LocalizationConfigViewCollapsedHeight
    const textFieldH = 60
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: containerH
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column'
          }}
        >
          <div style={{ height: 20 }} />
          <FXGCheckBox
            title="enabled"
            checked={configs.enabled}
            onChange={(value) => {
              updateFlutterIntlConfig('enabled', !configs.enabled)
            }}
          />
          <div style={{ height: 20 }} />
          <VSCodeTextField
            type="text"
            placeholder="S"
            style={{ height: textFieldH }}
            value={getStringOrEmpty(configs.class_name)}
            onChange={(e) => {
              const value = e.target._value
              updateFlutterIntlConfig('class_name', value, isEmptyString(value))
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
              updateFlutterIntlConfig('main_locale', value, false)
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
            flexDirection: 'column'
          }}
        >
          <div style={{ height: 20 }} />
          <FXGCheckBox
            title="use_deferred_loading"
            checked={configs.use_deferred_loading}
            onChange={(value) => {
              const tmpValue: boolean = !configs.use_deferred_loading
              updateFlutterIntlConfig('use_deferred_loading', tmpValue, !tmpValue)
            }}
          />
          <div style={{ height: 20 }} />
          <VSCodeTextField
            type="text"
            placeholder="lib/l10n"
            style={{ height: textFieldH }}
            value={getStringOrEmpty(configs.arb_dir)}
            onChange={(e) => {
              const value = e.target._value
              updateFlutterIntlConfig('arb_dir', value, isEmptyString(value))
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
              updateFlutterIntlConfig('output_dir', value, isEmptyString(value))
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
        height: '100%'
      }}
    >
      {renderFunctionButtons()}
      {renderFlutterIntlConfig()}
    </div>
  )
}

export default LocalizationConfigView
