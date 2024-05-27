import {
  VSCodeButton,
  VSCodeCheckbox,
  VSCodeDataGrid,
  VSCodeDataGridRow,
  VSCodeDataGridCell,
} from "@vscode/webview-ui-toolkit/react"
import { L10nMsgInterface, FlutterIntlConfigs } from "../enum/extension.type"

function LocalizationPage(props: L10nMsgInterface) {
  const watcherEnable = props.watcherEnable
  const flutterIntlConfigs = props.flutterIntlConfigs
  const arbs = props.arbs

  const renderVSCodeGrid = () => {
    if (typeof arbs !== 'object') {
      return <div>无效数据</div>
    } else if (arbs === null) {
      return <div>正在加载中...</div>
    }

    let mainLocaleKeys: string[] = [] // 国际化主键 keys

    const fileNames: string[] = []
    const mainLocale = flutterIntlConfigs.main_locale
    for (const key of Object.keys(arbs)) {
      fileNames.push(key)
      if (!key.endsWith(`_${mainLocale}.arb`)) {
        continue
      }
      mainLocaleKeys = []
      const valueJson = arbs[key]
      mainLocaleKeys = Object.keys(valueJson)
    }
    console.log("dw test, mainLocaleKeys: ", mainLocaleKeys)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: "clip",
          width: '100%',
          height: '100%',
        }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            position: 'sticky',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 30,
          }}
        >
          <div style={{ width: 16 }} />
          <VSCodeButton>
            立即更新
          </VSCodeButton>
          <div style={{ width: 16 }} />
          <VSCodeButton>
            从文件同步
          </VSCodeButton>
          <div style={{ width: 16 }} />
          <VSCodeCheckbox
            value="true"
          >
            自动更新
          </VSCodeCheckbox>
        </div>
        <div style={{ height: 16 }} />
        <VSCodeDataGrid generateHeader='sticky'>
          <VSCodeDataGridRow row-type="sticky-header">
            {fileNames.map((name, index) => {
              return (
                <VSCodeDataGridCell key={name} cell-type="columnheader" grid-column={`${index + 1}`}>
                  {name}
                </VSCodeDataGridCell>
              )
            })}
          </VSCodeDataGridRow>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: "scroll",
              width: '100%',
              height: 300,
            }}
          >
            {mainLocaleKeys.map(function (key: string, index: number) {
              return (
                <VSCodeDataGridRow key={`${key}_${index}`}>
                  {fileNames.map(function (fileName: string, index: number) {
                    const json = arbs[fileName]
                    const value = json[key]
                    return (
                      <VSCodeDataGridCell
                        key={`${fileName}_${index}`}
                        grid-column={`${index + 1}`}
                      // contentEditable="true"
                      >
                        {value}
                      </VSCodeDataGridCell>
                    )
                  })}
                </VSCodeDataGridRow>
              )
            })}
          </div>
        </VSCodeDataGrid>
      </div>
    )
  }

  return (
    renderVSCodeGrid()
  )
}

export default LocalizationPage