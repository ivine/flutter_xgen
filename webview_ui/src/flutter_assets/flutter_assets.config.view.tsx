import { useEffect, useMemo, useRef, useState } from "react"
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react'
import {
  FXGWatcherType,
  FlutterPubspecYamlConfigType,
  FlutterAssetsGeneratorConfigByCr1992,
  FlutterGenConfig,
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
  named_with_parent: true,
  output_filename: "",
  class_name: "",
  filename_split_pattern: "",
  path_ignore: [],
  leading_with_package_name: false,
}

const FlutterPubspecYamlConfigTypeToString = (type: FlutterPubspecYamlConfigType): string => {
  let result: string = ''
  switch (type) {
    case FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992:
      result = 'Flutter Assets Generator'
      break;
    case FlutterPubspecYamlConfigType.flutter_gen:
      result = 'Flutter Gen'
      break;
    default:
      break;
  }
  return result
}

const flutterAssetsConfigStringToType = (type: string): FlutterPubspecYamlConfigType => {
  let result: FlutterPubspecYamlConfigType = FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992
  switch (type) {
    case 'Flutter Assets Generator':
      result = FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992
      break;
    case 'Flutter Gen':
      result = FlutterPubspecYamlConfigType.flutter_gen
      break;
    default:
      break;
  }
  return result
}

function FlutterAssetsConfigView(props: MsgInterface) {
  const assetsMsg = props.data.assets
  const watcherTypes = props.projectInfo.watcherTypes ?? []
  const [currentConfigType, setCurrentConfigType] = useState<FlutterPubspecYamlConfigType>(FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992)
  const flutterAssetsGeneratorConfigByCr1992 = useRef<FlutterAssetsGeneratorConfigByCr1992 | null>(null) // 配置引用
  const flutterGenConfig = useRef<FlutterGenConfig | null>(null) // 配置引用
  const configsModified = useRef<any>({}) // 已修改的配置列表 {Flutter Assets Generator: false, Flutter Gen: false}
  const [updateCounter, setUpdateCounter] = useState<number>(0)

  useEffect(() => {
    flutterAssetsGeneratorConfigByCr1992.current = Object.assign({}, defaultFlutterAssetsGeneratorConfigByCr1992, assetsMsg.flutterAssetsGeneratorConfigByCr1992 ?? {})
    const tmpConfigsModified = {}
    tmpConfigsModified[FlutterPubspecYamlConfigTypeToString(FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992)] = false
    tmpConfigsModified[FlutterPubspecYamlConfigTypeToString(FlutterPubspecYamlConfigType.flutter_gen)] = false
    configsModified.current = tmpConfigsModified
    updateUI()
  }, [assetsMsg])

  const watcherEnable: boolean = useMemo(() => {
    let result: boolean = false
    if (currentConfigType === FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992) {
      result = watcherTypes.includes(FXGWatcherType.assets_cr1992)
    } else if (currentConfigType === FlutterPubspecYamlConfigType.flutter_gen) {
      result = watcherTypes.includes(FXGWatcherType.assets_flutter_gen)
    }
    return result
  }, [currentConfigType, watcherTypes])

  const currentGeneratorConfig: any | null = useMemo(() => {
    if (currentConfigType === FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992) {
      return flutterAssetsGeneratorConfigByCr1992
    } else if (currentConfigType === FlutterPubspecYamlConfigType.flutter_gen) {
      return flutterGenConfig
    }
  }, [currentConfigType])

  const updateUI = () => {
    let value = updateCounter + 1
    // console.log('updateUI, value: ', value)
    setUpdateCounter(value)
  }

  const updateWatcherEnable = (value: boolean) => {
    if (currentConfigType === FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992) {
      InteractionManager.getInstance().postMsg(InteractionEventType.webToExt_assets_watcher_cr1992_enable, props.projectInfo, value)
    } else if (currentConfigType === FlutterPubspecYamlConfigType.flutter_gen) {
      InteractionManager.getInstance().postMsg(InteractionEventType.webToExt_assets_watcher_flutter_gen_enable, props.projectInfo, value)
    }
    InteractionManager.getInstance().postMsg(InteractionEventType.sync_project_info, props.projectInfo, null)
    updateUI()
  }

  const changeConfigType = (type: string) => {
    const t = flutterAssetsConfigStringToType(type)
    setCurrentConfigType(t)
    updateUI()
  }

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
    if (currentConfigType === FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992) {
      modified = checkIfConfigModified(assetsMsg.flutterAssetsGeneratorConfigByCr1992, flutterAssetsGeneratorConfigByCr1992.current)
      tmpConfigsModified[FlutterPubspecYamlConfigTypeToString(FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992)] = modified
    } else if (currentConfigType === FlutterPubspecYamlConfigType.flutter_gen) {

    }
    configsModified.current = tmpConfigsModified
    updateUI()
  }

  const renderTopBar = () => {
    const types: FlutterPubspecYamlConfigType[] = [
      FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992,
      FlutterPubspecYamlConfigType.flutter_gen,
    ]

    const saveConfigButtonDisabled = !configsModified.current[FlutterPubspecYamlConfigTypeToString(currentConfigType)]
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
                return <VSCodeOption key={`options_${index}`}>{FlutterPubspecYamlConfigTypeToString(e)}</VSCodeOption>
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
              checked={watcherEnable}
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
                  {
                    type: currentConfigType,
                    config: currentGeneratorConfig,
                  },
                );
              }}
            />
            <FXGButton
              title="读取配置"
              leftSpacing={10}
              rightSpacing={10}
              onClick={() => {
                InteractionManager.getInstance().postMsg(
                  InteractionEventType.webToExt_assets_read_config,
                  props.projectInfo,
                  {
                    type: currentConfigType,
                    config: currentGeneratorConfig,
                  },
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
                  InteractionEventType.webToExt_assets_save_config,
                  props.projectInfo,
                  {
                    type: currentConfigType,
                    config: currentGeneratorConfig,
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
        <FXGCheckBox
          title="leading_with_package_name"
          checked={flutterAssetsGeneratorConfigByCr1992.current.leading_with_package_name}
          topSpacing={10}
          bottomSpacing={6}
          onChange={(value) => {
            updateFlutterAssetsGeneratorByCr1992ConfigValue('leading_with_package_name', value)
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
      {currentConfigType === FlutterPubspecYamlConfigType.flutter_assets_generator_cr1992 ? renderCr1992ConfigView() : <></>}
      {currentConfigType === FlutterPubspecYamlConfigType.flutter_gen ? renderFlutterGenConfigView() : <></>}
    </div>
  )
}

export default FlutterAssetsConfigView