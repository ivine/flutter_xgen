import { useEffect, useRef, useState } from "react"
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react'
import {
  FlutterAssetsConfigType,
  FlutterAssetsGeneratorConfigByCr1992,
  InteractionEventType,
  MsgInterface
} from "../enum/vscode_extension.type"
import FXGTextField from "../component/text_field"
import FXGCheckBox from "../component/check_box"
import FXGButton from "../component/button"
import { isObjectEqual } from "../util/object.util"
import FXGProjectInfoPanel from "../component/project_info_panel"
import InteractionManager from "../interaction/interaction.manager"

const defaultFlutterAssetsGeneratorConfigByCr1992: any = {}

const checkedFlutterAssetsGeneratorConfigByCr1992: FlutterAssetsGeneratorConfigByCr1992 = {
  output_dir: "",
  auto_detection: false,
  named_with_parent: false,
  output_filename: "",
  class_name: "",
  filename_split_pattern: "",
  path_ignore: []
}

const flutterAssetsConfigTypeToString = (type: FlutterAssetsConfigType): string => {
  let result: string = ''
  switch (type) {
    case FlutterAssetsConfigType.Cr1992:
      result = 'Flutter Assets Generator'
      break;
    case FlutterAssetsConfigType.FlutterGen:
      result = 'Flutter Gen'
      break;
    default:
      break;
  }
  return result
}

const flutterAssetsConfigStringToType = (type: string): FlutterAssetsConfigType => {
  let result: FlutterAssetsConfigType = FlutterAssetsConfigType.Cr1992
  switch (type) {
    case 'Flutter Assets Generator':
      result = FlutterAssetsConfigType.Cr1992
      break;
    case 'Flutter Gen':
      result = FlutterAssetsConfigType.FlutterGen
      break;
    default:
      break;
  }
  return result
}

function FlutterAssetsConfigView(props: MsgInterface) {
  const assetsMsg = props.data.assets
  const [currentConfigType, setCurrentConfigType] = useState<FlutterAssetsConfigType>(FlutterAssetsConfigType.Cr1992)
  const watcherEnable = useRef<boolean>(false)
  const flutterAssetsGeneratorConfigByCr1992 = useRef<FlutterAssetsGeneratorConfigByCr1992 | null>(null)
  const configsModified = useRef<any>({})
  const [updateCounter, setUpdateCounter] = useState<number>(0)

  useEffect(() => {
    watcherEnable.current = assetsMsg.watcherEnable
    flutterAssetsGeneratorConfigByCr1992.current = Object.assign({}, defaultFlutterAssetsGeneratorConfigByCr1992, assetsMsg.flutterAssetsGeneratorConfigByCr1992 ?? {})
    const tmpConfigsModified = {}
    tmpConfigsModified[flutterAssetsConfigTypeToString(FlutterAssetsConfigType.Cr1992)] = false
    tmpConfigsModified[flutterAssetsConfigTypeToString(FlutterAssetsConfigType.FlutterGen)] = false
    configsModified.current = tmpConfigsModified
    updateUI()
  }, [])

  const updateUI = () => {
    let value = updateCounter + 1
    // console.log('updateUI, value: ', value)
    setUpdateCounter(value)
  }

  const changeConfigType = (type: string) => {
    const t = flutterAssetsConfigStringToType(type)
    setCurrentConfigType(t)
    updateUI()
  }

  const checkIfConfigModified = (originalConfig: any, targetConfig: any) => {
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

  const updateWatcherEnable = (value: boolean) => {
    watcherEnable.current = value
    updateUI()
  }

  const updateFlutterAssetsGeneratorByCr1992ConfigValue = (key: string, value) => {
    updateConfigValue(
      flutterAssetsGeneratorConfigByCr1992,
      checkedFlutterAssetsGeneratorConfigByCr1992,
      key,
      value,
    )
  }

  const updateConfigValue = (ref: any, checkedConfig: any, key: string, value: any): any => {
    if (!Object.keys(checkedConfig).includes(key)) {
      return
    }
    const tmpConfig = Object.assign({}, ref.current)
    tmpConfig[key] = value
    ref.current = tmpConfig
    updateSaveConfigButtonState()
  }

  const updateSaveConfigButtonState = () => {
    const tmpConfigsModified = Object.assign({}, configsModified)
    let modified = false
    if (currentConfigType === FlutterAssetsConfigType.Cr1992) {
      modified = checkIfConfigModified(assetsMsg.flutterAssetsGeneratorConfigByCr1992, flutterAssetsGeneratorConfigByCr1992.current)
      tmpConfigsModified[flutterAssetsConfigTypeToString(FlutterAssetsConfigType.Cr1992)] = modified
    } else if (currentConfigType === FlutterAssetsConfigType.FlutterGen) {

    }
    configsModified.current = tmpConfigsModified
    updateUI()
  }

  const renderTopBar = () => {
    const types: FlutterAssetsConfigType[] = [
      FlutterAssetsConfigType.Cr1992,
      FlutterAssetsConfigType.FlutterGen,
    ]

    const saveConfigButtonDisabled = !configsModified.current[flutterAssetsConfigTypeToString(currentConfigType)]
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div
            style={{
              width: 300,
            }}
          >
            <div
              style={{
                color: '#fff',
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              生成器类型
            </div>
            <div style={{ height: 10 }} />
            <VSCodeDropdown
              style={{ width: 200 }}
              onChange={(e) => {
                changeConfigType(e.target._currentValue)
              }}
            >
              {types.map((e, index) => {
                return <VSCodeOption key={`options_${index}`}>{flutterAssetsConfigTypeToString(e)}</VSCodeOption>
              })}
            </VSCodeDropdown>
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FXGCheckBox
              title="自动生成"
              checked={watcherEnable.current}
              onChange={(value) => {
                updateWatcherEnable(value)
              }}
            />
            <FXGButton
              title="立即执行"
              leftSpacing={40}
              rightSpacing={10}
              onClick={() => {
                InteractionManager.getInstance().postMsg(
                  InteractionEventType.webToExt_assets_run,
                  props.projectInfo,
                  null,
                );
              }}
            />
            <FXGButton
              title="读取配置"
              leftSpacing={10}
              rightSpacing={10}
              onClick={() => {
                InteractionManager.getInstance().postMsg(
                  InteractionEventType.webToExt_assets_read_configs,
                  props.projectInfo,
                  null,
                );
              }}
            />
            <FXGButton
              title="保存配置"
              disabled={saveConfigButtonDisabled}
              leftSpacing={10}
              rightSpacing={10}
              onClick={() => {
                InteractionManager.getInstance().postMsg(
                  InteractionEventType.webToExt_assets_save_configs,
                  props.projectInfo,
                  {
                    generatorType: currentConfigType,
                    flutterAssetsGeneratorConfigByCr1992: flutterAssetsGeneratorConfigByCr1992.current,
                  },
                );
              }}
            />
          </div>
        </div>
        <div style={{ height: 20 }} />
        <div style={{ display: 'flex', width: '100%', height: 1, backgroundColor: '#fff', opacity: 0.8 }} />
        <div style={{ height: 40 }} />
      </div>
    )
  }

  const renderCr1992ConfigView = () => {
    if (flutterAssetsGeneratorConfigByCr1992.current === null) {
      return (
        <div>暂无配置</div>
      )
    }
    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <div
            style={{ fontSize: 16, fontWeight: '500', }}
          >
            Flutter Assets Generator
          </div>
          <div style={{ width: 20 }} />
          <a
            style={{
              fontSize: 12, color: '#fff', opacity: 0.5
            }}
            href="https://github.com/cr1992/FlutterAssetsGenerator"
          >
            https://github.com/cr1992/FlutterAssetsGenerator
          </a>
        </div>
        <div style={{ height: 20 }} />
        <FXGCheckBox title="auto_detection 当前插件的自动监听, 与 FXG 无关"
          checked={flutterAssetsGeneratorConfigByCr1992.current.auto_detection}
          onChange={(value) => {
            updateFlutterAssetsGeneratorByCr1992ConfigValue('auto_detection', value)
          }}
        />
        <FXGCheckBox
          title="named_with_parent"
          checked={flutterAssetsGeneratorConfigByCr1992.current.named_with_parent}
          topSpacing={10}
          bottomSpacing={6}
          onChange={(value) => {
            updateFlutterAssetsGeneratorByCr1992ConfigValue('named_with_parent', value)
          }}
        />
        <FXGTextField title="output_dir"
          value={flutterAssetsGeneratorConfigByCr1992.current.output_dir}
          tfType={"text"}
          placeholder={"generated"}
          onChange={(value) => {
            updateFlutterAssetsGeneratorByCr1992ConfigValue('output_dir', value)
          }}
        />
        <FXGTextField title="output_filename"
          value={flutterAssetsGeneratorConfigByCr1992.current.output_filename}
          tfType={"text"}
          placeholder={"assets"}
          onChange={(value) => {
            updateFlutterAssetsGeneratorByCr1992ConfigValue('output_filename', value)
          }}
        />
        <FXGTextField title="class_name"
          value={flutterAssetsGeneratorConfigByCr1992.current.class_name}
          tfType={"text"}
          placeholder={"Assets"}
          onChange={(value) => {
            updateFlutterAssetsGeneratorByCr1992ConfigValue('class_name', value)
          }}
        />
        <FXGTextField title="filename_split_pattern"
          value={flutterAssetsGeneratorConfigByCr1992.current.filename_split_pattern}
          tfType={"text"}
          placeholder={"\"[-_]\""}
          onChange={(value) => {
            updateFlutterAssetsGeneratorByCr1992ConfigValue('filename_split_pattern', value)
          }}
        />
        <FXGTextField title={"path_ignore, 用 , 分割，例如: assets/fonts, assets/images/dark, ..."}
          value={Array.isArray(flutterAssetsGeneratorConfigByCr1992.current.path_ignore) && flutterAssetsGeneratorConfigByCr1992.current.path_ignore.length > 0 ? flutterAssetsGeneratorConfigByCr1992.current.path_ignore.join(',') : ''}
          tfType={"text"}
          placeholder={"\"[-_]\""}
          onChange={(value) => {
            let result: string[] = []
            try {
              result = value.split(',')
            } catch (error) {
              //
            }
            updateFlutterAssetsGeneratorByCr1992ConfigValue('filename_split_pattern', result)
          }}
        />
      </div>
    )
  }

  const renderFlutterGenConfigView = () => {
    return (
      <>
        <div>TODO: Flutter Gen</div>
      </>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: 20,
        width: '100%',
        height: '100%',
      }}
    >
      <FXGProjectInfoPanel {...props.projectInfo} />
      {renderTopBar()}
      {currentConfigType === FlutterAssetsConfigType.Cr1992 ? renderCr1992ConfigView() : <></>}
      {currentConfigType === FlutterAssetsConfigType.FlutterGen ? renderFlutterGenConfigView() : <></>}
    </div>
  )
}

export default FlutterAssetsConfigView