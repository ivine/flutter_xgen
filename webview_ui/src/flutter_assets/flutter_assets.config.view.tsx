import { useEffect, useState } from "react"
import { VSCodeButton, VSCodeCheckbox, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react'
import { AssetsMsgInterface } from "../enum/vscode_extension.type"
import FXGTextField from "../component/text_field"
import FXGCheckBox from "../component/check_box"
import FXGButton from "../component/button"

enum FlutterAssetsConfigType {
  Cr1992,
  FlutterGen,
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

function FlutterAssetsConfigView(props: AssetsMsgInterface) {
  const [currentConfigType, setCurrentConfigType] = useState<FlutterAssetsConfigType>(FlutterAssetsConfigType.Cr1992)

  const renderTopBar = () => {
    const types: FlutterAssetsConfigType[] = [
      FlutterAssetsConfigType.Cr1992,
      FlutterAssetsConfigType.FlutterGen,
    ]
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
                const t = flutterAssetsConfigStringToType(e.target._currentValue)
                setCurrentConfigType(t)
              }}
            >
              {types.map((e) => {
                return <VSCodeOption>{flutterAssetsConfigTypeToString(e)}</VSCodeOption>
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
            <FXGCheckBox title="自动生成" checked={false} onChange={(value) => { }} />
            <FXGButton title="立即执行" leftSpacing={40} rightSpacing={10} onClick={() => { }} />
          </div>
        </div>
        <div style={{ height: 20 }} />
        <div style={{ display: 'flex', width: '100%', height: 1, backgroundColor: '#fff', opacity: 0.8 }} />
        <div style={{ height: 40 }} />
      </div>
    )
  }

  const renderCr1992ConfigView = () => {
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
        <FXGCheckBox title="auto_detection" checked={false} onChange={(value) => { }} />
        <FXGCheckBox title="named_with_parent" checked={false} onChange={(value) => { }} />
        <FXGTextField title="output_dir" value={""} tfType={"text"} placeholder={"generated"} onChange={(value) => { }} />
        <FXGTextField title="output_filename" value={""} tfType={"text"} placeholder={"assets"} onChange={(value) => { }} />
        <FXGTextField title="class_name" value={""} tfType={"text"} placeholder={"Assets"} onChange={(value) => { }} />
        <FXGTextField title="filename_split_pattern" value={""} tfType={"text"} placeholder={"\"[-_]\""} onChange={(value) => { }} />
        <FXGTextField title={"path_ignore, 用 , 分割，例如: \"assets/fonts\", \"assets/images/dark\", ..."} value={""} tfType={"text"} placeholder={"\"[-_]\""} onChange={(value) => { }} />
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
      {renderTopBar()}
      {currentConfigType === FlutterAssetsConfigType.Cr1992 ? renderCr1992ConfigView() : <></>}
      {currentConfigType === FlutterAssetsConfigType.FlutterGen ? renderFlutterGenConfigView() : <></>}
    </div>
  )
}

export default FlutterAssetsConfigView