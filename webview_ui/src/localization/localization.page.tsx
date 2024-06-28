import { useEffect, useMemo, useRef, useState } from 'react'

import Handsontable from 'handsontable'
import { ContextMenu } from 'handsontable/plugins'
import { registerAllModules } from 'handsontable/registry'
import { HotTable, HotTableClass } from '@handsontable/react'
import 'handsontable/dist/handsontable.full.min.css'

import './localization.page.css'

import { MsgInterface } from '../enum/vscode_extension.type'
import { isEmptyString } from '../util/string.util'
import LocalizationConfigView, { LocalizationConfigViewCollapsedHeight, LocalizationGridData } from './localization.config.view'
import LocalizationSearchBar, { SearchMatchMode } from './localization.search_bar'
import FXGProjectInfoPanel from '../component/project_info_panel'

export const l10n_local_key_name = 'key'

registerAllModules()

function LocalizationPage(props: MsgInterface) {
  const l10n = props.data.l10n
  const flutterIntlConfig = l10n.flutterIntlConfig
  const arbs = l10n.arbs

  const [height, setHeight] = useState(0)
  const [configsBarHeight, setConfigsBarHeight] = useState(LocalizationConfigViewCollapsedHeight)
  const [currentSelSearchResIndex, setCurrentSelSearchResIndex] = useState<number>(-1)
  const [searchMatchMode, setSearchMatchMode] = useState<SearchMatchMode>(SearchMatchMode.ContainsCaseInsensitive)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // ref
  const containerRef = useRef(null)
  const hotTableRef = useRef<HotTableClass | null>(null)
  const searchBarVisibleRef = useRef<boolean>(false)

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
    const tmpColHeaders: any[] = [l10n_local_key_name, ...Object.keys(arbs)]
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

  useEffect(() => {
    const gridContext = getHotInstance().getShortcutManager().getContext('grid')
    const groupId = 'group_id_grid_search_bar'
    gridContext.removeShortcutsByGroup(groupId)
    if (searchResults.length > 0) {
      gridContext.addShortcut({
        group: groupId,
        position: 'before',
        relativeToGroup: 'editorManager.handlingEditor',
        runOnlyIf: () => {
          return searchBarVisibleRef.current && searchResults.length > 0
        },
        keys: [['enter']],
        callback: () => {
          console.log('enter, shortcut')
          if (searchResults.length > 0) {
            return false
          }
          return true
        }
      })

      gridContext.addShortcut({
        group: groupId,
        position: 'before',
        relativeToGroup: 'editorManager.handlingEditor',
        runOnlyIf: () => {
          return searchBarVisibleRef.current && searchResults.length > 0
        },
        keys: [['shift', 'enter']],
        callback: () => {
          console.log('shift + enter, shortcut')
          if (searchResults.length > 0) {
            return false
          }
          return true
        }
      })
    }
  }, [searchResults])

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
              data: res_data
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

  const renderGridWithMemo = useMemo(() => {
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
            'clear_column'
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
          search={{
            queryMethod(queryStr: string, value: Handsontable.CellValue, cellProperties: Handsontable.CellProperties) {
              if (typeof value !== 'string') {
                return false
              }
              if (queryStr.length === 0) {
                return false
              }
              const queryStr_lowercase = queryStr.toLowerCase()
              const value_lowercase = value.toLowerCase()
              let matched = false

              switch (searchMatchMode) {
                case SearchMatchMode.ContainsCaseInsensitive:
                  matched = value_lowercase.includes(queryStr_lowercase)
                  break

                case SearchMatchMode.ContainsCaseSensitive:
                  matched = value.includes(queryStr)
                  break

                case SearchMatchMode.ExactCaseInsensitive:
                  matched = queryStr_lowercase === value_lowercase
                  break

                case SearchMatchMode.ExactCaseSensitive:
                  matched = value === queryStr
                  break

                default:
                  break
              }
              return matched
            }
          }}
          cells={(row, col, prop) => {
            var cellProperties: any = {}
            cellProperties.className = 'htMiddle'
            return cellProperties
          }}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    )
  }, [arbs, height, data, colHeaders])

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
        {renderGridWithMemo}
      </div>
      <LocalizationSearchBar
        matchMode={SearchMatchMode.ContainsCaseInsensitive}
        currentIndex={currentSelSearchResIndex}
        totalCount={searchResults.length}
        onViewVisible={(visible) => {
          if (visible) {
            // 搜索框第一次出现
            getHotInstance().deselectCell()
          }
          searchBarVisibleRef.current = visible
        }}
        onMovePrevious={() => {
          const searchResList = searchResults
          const index = Math.max(0, currentSelSearchResIndex - 1)
          console.log('onMovePrevious, index: ', index)
          if (index >= searchResList.length || index < 0) {
            return
          }
          const searchRes = searchResList[index]
          getHotInstance().scrollViewportTo({
            row: searchRes.row,
            col: searchRes.col,
            verticalSnap: 'top',
            horizontalSnap: 'end'
          })
          getHotInstance().selectCell(searchRes.row, searchRes.col)
          setCurrentSelSearchResIndex(index)
        }}
        onMoveNext={() => {
          const searchResList = searchResults
          const index = Math.min(searchResList.length - 1, currentSelSearchResIndex + 1)
          if (index >= searchResList.length || index < 0) {
            return
          }
          const searchRes = searchResList[index]
          getHotInstance().scrollViewportTo({
            row: searchRes.row,
            col: searchRes.col,
            verticalSnap: 'top',
            horizontalSnap: 'end'
          })
          getHotInstance().selectCell(searchRes.row, searchRes.col)
          setCurrentSelSearchResIndex(index)
        }}
        onSearching={(keyword) => {
          const search = getHotInstance().getPlugin('search')
          const queryResult = search.query(keyword)
          setSearchResults(queryResult)
          setCurrentSelSearchResIndex(queryResult.length > 0 ? 0 : -1)
          getHotInstance().deselectCell()
          getHotInstance().render()
        }}
      />
    </div>
  )
}

export default LocalizationPage
