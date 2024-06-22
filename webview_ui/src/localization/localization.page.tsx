import { useEffect, useRef, useState } from 'react'

import Handsontable from 'handsontable'
import { ContextMenu } from 'handsontable/plugins'
import { registerAllModules } from 'handsontable/registry'
import { HotTable, HotTableClass } from '@handsontable/react'
import 'handsontable/dist/handsontable.full.min.css'

import './localization.page.css'

import { MsgInterface } from '../enum/vscode_extension.type'
import { isEmptyString } from '../util/string.util'
import LocalizationConfigView, { LocalizationConfigViewCollapsedHeight, LocalizationGridData } from './localization.config.view'

import FXGProjectInfoPanel from '../component/project_info_panel'

export const l10n_local_key_name = "key"

registerAllModules()

function LocalizationPage(props: MsgInterface) {
  const l10n = props.data.l10n
  const flutterIntlConfig = l10n.flutterIntlConfig
  const arbs = l10n.arbs

  const [height, setHeight] = useState(0)
  const [configsBarHeight, setConfigsBarHeight] = useState(LocalizationConfigViewCollapsedHeight)

  // ref
  const containerRef = useRef(null)
  const hotTableRef = useRef<HotTableClass | null>(null)


  /**
   * 数据结构
    colHeader: [
      [Key, intl_en.arb, intl_zh.arb, ...],
    ],
    data: [
      [back, back, 返回, ...]
      [ok, ok, 好的, ...]
    ],
  */
  const [colHeaders, setColHeaders] = useState<any[]>([])
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // 高度
    setHeight(containerRef.current.clientHeight - (120 + configsBarHeight + 20))

    // 默认的 resize 事件
    window.addEventListener('resize', () => {
      setHeight(containerRef.current.clientHeight - (120 + configsBarHeight + 20))
    })

    return () => {
      // hotTableRef.current?.hotInstance?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!flutterIntlConfig) {
      return
    }

    // 国际化主键 keys
    let mainLocaleKeyValueArray: string[] = []
    const fileNames: string[] = []
    const mainLocale = isEmptyString(flutterIntlConfig.main_locale) ? 'en' : flutterIntlConfig.main_locale
    for (const key of Object.keys(arbs)) {
      fileNames.push(key)
      if (!key.endsWith(`_${mainLocale}.arb`)) {
        continue
      }
      mainLocaleKeyValueArray = []
      const valueJson = arbs[key]
      mainLocaleKeyValueArray = Object.keys(valueJson)
    }

    // 初始化数据

    // column headers
    const tmpColHeaders: any[] = [l10n_local_key_name, ...Object.keys(arbs)];
    setColHeaders(tmpColHeaders)

    // rows
    const tmpData: string[][] = []
    for (const localeKey of mainLocaleKeyValueArray) {
      const tmpRow = []
      for (const c of tmpColHeaders) {
        let value = ''
        if (c === l10n_local_key_name) {
          value = localeKey
        } else {
          value = arbs[c][localeKey]
        }
        tmpRow.push(value)
      }
      tmpData.push(tmpRow)
    }
    setData(tmpData)
  }, [arbs])

  const getHotInstance = (): Handsontable | null => {
    return hotTableRef.current ? hotTableRef.current.hotInstance : null
  }

  const handleExportCSVFile = () => {
    function formatDate(): string {
      const date = new Date()

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}${month}${day}_${hours}_${minutes}_${seconds}`
    }
    const exportPlugin = getHotInstance().getPlugin('exportFile')
    exportPlugin.downloadFile('csv', {
      bom: false,
      columnDelimiter: ',',
      columnHeaders: true,
      exportHiddenColumns: false,
      exportHiddenRows: true,
      fileExtension: 'csv',
      filename: `FlutteXGen_l10n_${formatDate()}`,
      mimeType: 'text/csv',
      rowDelimiter: '\r\n',
      rowHeaders: false
    })
  }

  const updateDataFromGridData = () => {
    // const colHeader = getHotInstance().getColHeader()
    // const data = getHotInstance().getData()
    // setData(data)
    // setColHeaders(colHeader)
  }

  const renderL10nConfigsBar = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: configsBarHeight
        }}
      >
        <LocalizationConfigView
          msg={props}
          onUpdateHeight={(height: number) => {
            setConfigsBarHeight(height)
          }}
          onGetGridData={() => {
            const res_colHeader = getHotInstance().getColHeader() as string[]
            const res_data = getHotInstance().getData()
            const res: LocalizationGridData = {
              arbFileNames: res_colHeader,
              data: res_data,
            }
            return res
          }}
          onClickExportCsvButton={() => {
            handleExportCSVFile()
          }}
        />
      </div>
    )
  }

  const renderGrid = () => {
    if (typeof arbs !== 'object') {
      return <div>无效数据</div>
    } else if (arbs === null) {
      return <div>正在加载中...</div>
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'scroll',
          width: '100%',
          height: height
        }}
      >
        <HotTable
          id={'l10n_grid'}
          ref={hotTableRef}
          style={{
            width: '100%',
            height: '100%'
          }}
          colHeaders={colHeaders}
          data={data}
          filters={true}
          rowHeaders={true}
          allowEmpty={true}
          autoWrapRow={true}
          autoWrapCol={true}
          allowInsertRow={true}
          allowInsertColumn={true}
          manualColumnMove={true}
          manualRowMove={true}
          manualRowResize={true}
          manualColumnResize={true}
          colWidths={150}
          rowHeights={40}
          afterGetColHeader={(column: number, TH: HTMLTableHeaderCellElement, headerLevel: number) => {
            TH.style.paddingTop = '8px'
          }}
          selectionMode={'multiple'}
          dropdownMenu={[
            'filter_by_value',
            'filter_operators',
            'filter_action_bar',
            'filter_by_condition',
            'col_left',
            'col_right',
            'remove_col',
            'clear_column',
            // '---------',
            // 'undo',
            // 'redo'
          ]}
          contextMenu={{
            items: {
              // copy: {},
              undo: {},
              redo: {},
              separator: ContextMenu.SEPARATOR,
              row_above: {},
              row_below: {},
              remove_row: {}
            }
          }}
          cells={(row, col, prop) => {
            var cellProperties: any = {}
            cellProperties.className = 'htMiddle'
            return cellProperties
          }}
          // afterChange={(changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
          //   console.log(rowDatas[0])
          //   console.log(`afterChange, changes.length: ${changes}, source: ${source}`)
          //   if (source === 'edit') {
          //     if (Array.isArray(changes)) {
          //       // c = [row, column, prevValue, nextValue]
          //       let tmpRowDatas = [...rowDatas]
          //       for (let c of changes) {
          //         let row = c[0]
          //         let column = c[1]
          //         let preValue = c[2]
          //         let nextValue = c[3]
          //         if (preValue === undefined && nextValue.length === 0) {
          //           // TODO: 待优化。当前是为了解决双击 cell 后，数据被置空的问题。
          //         } else {
          //           if (typeof column === 'string') {
          //             tmpRowDatas[row][column] = nextValue
          //           }
          //         }
          //       }
          //       updateRowDatasFromPreviousState(tmpRowDatas)
          //     } else {
          //       updateRowDatasFromGrid()
          //     }
          //   } else if (source === 'ContextMenu.clearColumn') {
          //     //
          //     const arbFileName = changes[0][1]
          //     if (typeof arbFileName !== 'string') {
          //       return
          //     }
          //     const tmpRowDatas = [...rowDatas]
          //     for (let rowData of tmpRowDatas) {
          //       rowData[arbFileName] = ''
          //     }
          //     setRowDatas(tmpRowDatas)
          //   }
          // }}
          afterColumnMove={(movedColumns: number[], finalIndex: number, dropIndex: number | undefined, movePossible: boolean, orderChanged: boolean) => {
            console.log(`afterColumnMove, movedColumns: ${movedColumns}, finalIndex: ${finalIndex}, dropIndex: ${dropIndex}, movePossible: ${movePossible}, orderChanged: ${orderChanged}`)
            updateDataFromGridData()
          }}
          afterRowMove={(movedRows, finalIndex, dropIndex, movePossible, orderChanged) => {
            console.log(`afterRowMove, movedRows: ${movedRows}, finalIndex: ${finalIndex}, dropIndex: ${dropIndex}, movePossible: ${movePossible}, orderChanged: ${orderChanged}`)
            updateDataFromGridData()
          }}
          afterCreateCol={(index: number, amount: number, source?: Handsontable.ChangeSource) => {
            console.log(`afterRowMove, index: ${index}, amount: ${amount}, source: ${source}`)
            updateDataFromGridData()
          }}
          afterCreateRow={(index: number, amount: number, source?: Handsontable.ChangeSource) => {
            console.log(`afterCreateRow, index: ${index}, amount: ${amount}, source: ${source}`)
            updateDataFromGridData()
          }}
          // afterUpdateData={(sourceData, initialLoad, source) => {
          //   console.log(`afterUpdateData, sourceData.length: ${sourceData.length}, initialLoad: ${initialLoad}, source: ${source}`)
          //   if (source === 'updateSettings') {

          //   } else {
          //     updateDataFromGridData()
          //   }
          // }}
          // afterPaste={(data: Handsontable.CellValue[][], coords: RangeType[]) => {
          //   console.log(`afterPaste, data: ${data}, coords: ${coords}`)
          //   updateRowDatasFromGrid()
          // }}
          // afterUndo={(action: any) => {
          //   console.log(`afterUndo, action: ${action}`)
          //   updateRowDatasFromPreviousState([...rowDatas])
          // }}
          // afterRedo={(action: any) => {
          //   console.log(`afterRedo, action: ${action}`)
          //   updateRowDatasFromPreviousState([...rowDatas])
          // }}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 20
        }}
      >
        <FXGProjectInfoPanel {...props.projectInfo} />
        {renderL10nConfigsBar()}
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%'
        }}
      >
        {renderGrid()}
      </div>
    </div>
  )
}

export default LocalizationPage
