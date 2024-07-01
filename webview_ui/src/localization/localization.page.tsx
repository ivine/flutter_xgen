import { useEffect, useMemo, useRef, useState } from 'react'

import Handsontable from 'handsontable'
import { ContextMenu } from 'handsontable/plugins'
import { registerAllModules } from 'handsontable/registry'
import { HotTable, HotTableClass } from '@handsontable/react'
import 'handsontable/dist/handsontable.full.min.css'
import CircularProgress from '@mui/material/CircularProgress'

import './localization.page.css'

import { MsgInterface } from '../enum/vscode_extension.type'
import { isEmptyString } from '../util/string.util'
import LocalizationConfigView, { LocalizationConfigViewCollapsedHeight, LocalizationGridData } from './localization.config.view'
import LocalizationSearchBar from './localization.search_bar'
import FXGProjectInfoPanel from '../component/project_info_panel'

export const l10n_local_key_name = 'key'
const replaceSourceKey = 'FXG_Search_And_Replace'

registerAllModules()

function LocalizationPage(props: MsgInterface) {
  const l10n = props.data.l10n
  const flutterIntlConfig = l10n.flutterIntlConfig
  const arbs = l10n.arbs

  const [height, setHeight] = useState(0)
  const [configsBarHeight, setConfigsBarHeight] = useState(LocalizationConfigViewCollapsedHeight)
  const [searchBarRefreshFlag, setSearchBarRefreshFlag] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  // ref
  const containerRef = useRef(null)
  const hotTableRef = useRef<HotTableClass | null>(null)
  const searchBarVisibleRef = useRef<boolean>(false)
  const searchBarKeywordsRef = useRef<string>('')
  const searchResultsRef = useRef<any[]>([])
  const searchResIndexRef = useRef<number>(-1)
  const searchCaseSensitiveMatchEnableRef = useRef<boolean>(false)
  const searchWholeWordMatchEnableRef = useRef<boolean>(false)
  const searchBarRefreshFlagRef = useRef<number>(0)

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
    const res = searchResultsRef.current[searchResIndexRef.current]
    try {
      const cell = getHotInstance().getCell(res.row, res.col)
      cell.style.background = 'rgba(50, 196, 124, 0.5)'
    } catch (error) { }
  }, [searchResultsRef.current, searchResIndexRef.current])

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

  function disableShiftAndEnterKeyWhenSearching() {
    const gridContext = getHotInstance().getShortcutManager().getContext('grid')
    const groupId = 'group_id_grid_search_bar'
    gridContext.removeShortcutsByGroup(groupId)
    if (searchResultsRef.current.length > 0) {
      gridContext.addShortcut({
        group: groupId,
        position: 'before',
        relativeToGroup: 'editorManager.handlingEditor',
        runOnlyIf: () => {
          return searchBarVisibleRef.current && searchResultsRef.current.length > 0
        },
        keys: [['enter']],
        callback: () => {
          if (searchResultsRef.current.length > 0) {
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
          return searchBarVisibleRef.current && searchResultsRef.current.length > 0
        },
        keys: [['shift', 'enter']],
        callback: () => {
          if (searchResultsRef.current.length > 0) {
            return false
          }
          return true
        }
      })
    }
  }

  function handleRefreshSearchBar() {
    searchBarRefreshFlagRef.current += 1
    setSearchBarRefreshFlag(searchBarRefreshFlagRef.current)
  }

  const handleSearchGrid = (keyword: string) => {
    searchBarKeywordsRef.current = keyword
    const search = getHotInstance().getPlugin('search')
    const queryResult = search.query(keyword)
    searchResultsRef.current = queryResult
    searchResIndexRef.current = queryResult.length > 0 ? 0 : -1

    if (queryResult.length > 0) {
      disableShiftAndEnterKeyWhenSearching()
      getHotInstance().deselectCell()
    }

    if (searchResultsRef.current.length > 0) {
      const res = searchResultsRef.current[searchResIndexRef.current]
      getHotInstance().scrollViewportTo({
        row: res.row,
        col: res.col,
        verticalSnap: 'top',
        horizontalSnap: 'end'
      })
    }
    console.log('searchResultsRef.current.length: ', searchResultsRef.current.length)
    getHotInstance().render()
    handleRefreshSearchBar()
  }

  function handleMoveToCell(next: boolean) {
    const totalCount = searchResultsRef.current.length
    const searchResList = searchResultsRef.current
    let index = searchResIndexRef.current
    if (next) {
      index += 1
      if (index >= totalCount) {
        index = 0
      }
    } else {
      index -= 1
      if (index < 0) {
        index = totalCount - 1
      }
    }
    const res = searchResList[index]
    getHotInstance().scrollViewportTo({
      row: res.row,
      col: res.col,
      verticalSnap: 'top',
      horizontalSnap: 'end'
    })
    getHotInstance().render()

    searchResIndexRef.current = index
    handleRefreshSearchBar()
  }

  function handleReplaceText(keyword: string, targetText: string, replaceAll: boolean) {
    if (targetText.length === 0) {
      return
    }

    if (replaceAll) {
      const shouldLoading: boolean = searchResultsRef.current.length > 100
      setLoading(shouldLoading)
      if (shouldLoading) {
        setTimeout(() => {
          for (let sr of searchResultsRef.current) {
            const data = getHotInstance().getDataAtCell(sr.row, sr.col) as string
            const replaceResult = data.replace(new RegExp(keyword, 'gi'), targetText)
            getHotInstance().setDataAtCell(sr.row, sr.col, replaceResult, replaceSourceKey)
          }
          handleSearchGrid(keyword)
          setLoading(false)
        }, 200)
      } else {
        for (let sr of searchResultsRef.current) {
          const data = getHotInstance().getDataAtCell(sr.row, sr.col) as string
          const replaceResult = data.replace(new RegExp(keyword, 'gi'), targetText)
          getHotInstance().setDataAtCell(sr.row, sr.col, replaceResult, replaceSourceKey)
        }
        handleSearchGrid(keyword)
      }
    } else {
      const currentIndex = searchResIndexRef.current
      const currentSearchCellRes = searchResultsRef.current[currentIndex]
      const data = getHotInstance().getDataAtCell(currentSearchCellRes.row, currentSearchCellRes.col) as string
      const replaceResult = data.replace(new RegExp(keyword, 'gi'), targetText)
      getHotInstance().setDataAtCell(currentSearchCellRes.row, currentSearchCellRes.col, replaceResult, replaceSourceKey)
      handleMoveToCell(true)
      handleSearchGrid(keyword)
    }
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
              if (searchWholeWordMatchEnableRef.current) {
                // 整个单词匹配
                if (searchCaseSensitiveMatchEnableRef.current) {
                  // 大小写敏感
                  matched = queryStr === value
                } else {
                  matched = queryStr_lowercase === value_lowercase
                }
              } else {
                // 包含匹配
                if (searchCaseSensitiveMatchEnableRef.current) {
                  matched = value.includes(queryStr)
                } else {
                  // 大小写不需要匹配
                  matched = value_lowercase.includes(queryStr_lowercase)
                }
              }
              return matched
            }
          }}
          cells={(row, col, prop) => {
            var cellProperties: any = {}
            cellProperties.className = 'htMiddle'
            // if (selectSearchResult && selectSearchResult.row === row && selectSearchResult.col === col) {
            //   cellProperties.backgroundColor = 'rgba(50, 196, 124, 0.5)'
            // }
            return cellProperties
          }}
          afterChange={(changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource | any) => {
            console.log('afterChange, source: ', source)
            if (searchBarVisibleRef.current && searchBarKeywordsRef.current && source !== replaceSourceKey) {
              handleSearchGrid(searchBarKeywordsRef.current)
            }
          }}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    )
  }, [arbs, height, data, colHeaders])

  const renderSearchBar = useMemo(() => {
    const currentIndex = searchResIndexRef.current
    const totalCount = searchResultsRef.current.length
    // console.log(`renderSearchBar, currentIndex: ${currentIndex}, totalCount: ${totalCount}`)
    return (
      <LocalizationSearchBar
        currentIndex={currentIndex}
        totalCount={totalCount}
        caseSensitiveMatchEnable={searchCaseSensitiveMatchEnableRef.current}
        wholeWordMatchEnable={searchWholeWordMatchEnableRef.current}
        onChangeCaseSensitiveMatch={(enable: boolean) => {
          searchCaseSensitiveMatchEnableRef.current = enable
          handleRefreshSearchBar()
        }}
        onChangeWholeWordMatch={(enable: boolean) => {
          searchWholeWordMatchEnableRef.current = enable
          handleRefreshSearchBar()
        }}
        onViewVisible={(visible) => {
          searchBarVisibleRef.current = visible
          if (visible) {
            // 搜索框第一次出现
            getHotInstance().deselectCell()
          } else {
            handleSearchGrid('')
          }
        }}
        onMovePrevious={() => {
          handleMoveToCell(false)
        }}
        onMoveNext={() => {
          handleMoveToCell(true)
        }}
        onSearching={(keyword) => {
          handleSearchGrid(keyword)
        }}
        onReplacingText={(keyword: string, targetText: string, replaceAll: boolean) => {
          handleReplaceText(keyword, targetText, replaceAll)
        }}
      />
    )
  }, [searchBarRefreshFlag])

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
      {renderSearchBar}

      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            backgroundColor: 'rgba(0,0,0,0.5)',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 10000 // TODO: 整理一下
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              backgroundColor: '#fff',
              borderRadius: 20,
            }}
          >
            <CircularProgress color="info" />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default LocalizationPage
