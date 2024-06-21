import { cloneDeep } from 'lodash'
import { useEffect, useRef, useState } from 'react'

import Handsontable from 'handsontable'
import { ContextMenu } from 'handsontable/plugins'
import { registerAllModules } from 'handsontable/registry'
import { HotTable, HotTableClass } from '@handsontable/react'
import 'handsontable/dist/handsontable.full.min.css'

import './localization.page.css'

import { MsgInterface } from '../enum/vscode_extension.type'
import { hashString, isEmptyString } from '../util/string.util'
import LocalizationConfigView, { LocalizationConfigViewCollapsedHeight } from './localization.config.view'

import FXGProjectInfoPanel from '../component/project_info_panel'

registerAllModules()

function LocalizationPage(props: MsgInterface) {
  const data = props.data
  const l10n = data.l10n
  const flutterIntlConfig = l10n.flutterIntlConfig
  const arbs = l10n.arbs

  const [height, setHeight] = useState(0)
  const [configsBarHeight, setConfigsBarHeight] = useState(LocalizationConfigViewCollapsedHeight)

  // ref
  const containerRef = useRef(null)
  const hotTableRef = useRef<HotTableClass | null>(null)

  const [colHeaders, setColHeaders] = useState<any[]>([])

  /**
   * 数据结构
   * [
       {A: 1, B: 2, C: 3, D: 4, E: 5, F: 6},
       {A: 1, B: 2, C: 3, D: 4, E: 5, F: 6},
   * ]
  */
  const [rowDatas, setRowDatas] = useState<any[]>([])

  const getHotInstance = (): Handsontable | null => {
    return hotTableRef.current ? hotTableRef.current.hotInstance : null
  }

  const handleExportCsv = () => {
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
    let mainLocaleKeys: string[] = []
    const fileNames: string[] = []
    const mainLocale = isEmptyString(flutterIntlConfig.main_locale) ? 'en' : flutterIntlConfig.main_locale
    for (const key of Object.keys(arbs)) {
      fileNames.push(key)
      if (!key.endsWith(`_${mainLocale}.arb`)) {
        continue
      }
      mainLocaleKeys = []
      const valueJson = arbs[key]
      mainLocaleKeys = Object.keys(valueJson)
    }

    // 初始化数据
    // column headers
    const const_KeyString = 'Key'
    const tmpColHeaders = [
      {
        title: const_KeyString,
        type: 'text',
        data: const_KeyString // 用于去对应 row 的 key，例如 data = intl_en.arb, row={"Key": "123", "intl_en.arb": "xzv", ...}
      }
    ]
    for (const key of Object.keys(arbs)) {
      const tmpData = {
        title: key,
        type: 'text',
        data: key
      }
      tmpColHeaders.push(tmpData)
    }
    setColHeaders(tmpColHeaders)

    // rows
    const tmpRowDatas: any[] = []
    for (const localeKey of mainLocaleKeys) {
      const rowData = {}
      for (const c of tmpColHeaders) {
        let value = ''
        if (c.title === const_KeyString) {
          value = localeKey
        } else {
          value = arbs[c.title][localeKey]
        }
        const colTitle = c.title
        rowData[colTitle] = value
      }
      tmpRowDatas.push(rowData)
    }
    setRowDatas(tmpRowDatas)
  }, [arbs])

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
            return rowDatas
          }}
          onClickExportCsvButton={() => {
            handleExportCsv()
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
          data={cloneDeep(rowDatas)}
          columns={colHeaders}
          style={{
            width: '100%',
            height: '100%'
          }}
          filters={true}
          autoWrapRow={true}
          autoWrapCol={true}
          rowHeaders={true}
          manualColumnMove={true}
          manualRowMove={true}
          colWidths={150}
          rowHeights={40}
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
            'make_read_only',
            '---------',
            'undo',
            'redo'
          ]}
          contextMenu={{
            items: {
              copy: {},
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
          afterChange={(changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
            if (Array.isArray(changes)) {
              // c = [row, column, prevValue, nextValue]
              for (let c of changes) {
                let row = c[0]
                let column = c[1]
                let preValue = c[2]
                let nextValue = c[3]
                if (typeof column === 'string') {
                  let tmpRowDatas = [...rowDatas]
                  if (preValue === undefined && nextValue.length === 0) {
                    // TODO: 待优化。当前是为了解决双击 cell 后，数据被置空的问题。
                    setRowDatas(tmpRowDatas)
                  } else {
                    tmpRowDatas[row][column] = nextValue
                    setRowDatas(tmpRowDatas)
                  }
                }
              }
            }
            // console.log(`afterChange, changes: ${changes}, source: ${source}`)
          }}
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
