import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  Column,
  DataSheetGrid,
  checkboxColumn,
  DynamicDataSheetGrid,
  textColumn,
  keyColumn,
} from 'react-datasheet-grid'

import 'react-datasheet-grid/dist/style.css'
import './localization.page.css'

import { MsgInterface } from "../enum/vscode_extension.type"
import { getRandomString, isEmptyString } from "../util/string.util"
import LocalizationConfigView, {
  LocalizationConfigViewCollapsedHeight,
} from "./localization.config.view"

import FXGProjectInfoPanel from '../component/project_info_panel'

function LocalizationPage(props: MsgInterface) {
  const msg = props.data.l10n
  const flutterIntlConfig = msg.flutterIntlConfig
  const arbs = msg.arbs

  const [height, setHeight] = useState(0)
  const [configsBarHeight, setConfigsBarHeight] = useState(LocalizationConfigViewCollapsedHeight)
  const containerRef = useRef(null)

  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<any[]>([])
  const createRow = useCallback(() => {
    return { id: getRandomString(20) }
  }, [])

  function vscodeRightClickEvent(e) {
    e.stopImmediatePropagation()
  }

  useEffect(() => {
    // 高度
    setHeight(containerRef.current.clientHeight - (configsBarHeight + 60))

    // 默认的右键事件
    window.addEventListener('contextmenu', vscodeRightClickEvent, true)

    return () => {
      window.removeEventListener('contextmenu', vscodeRightClickEvent)
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

    // columns
    const keysString = 'key'
    const arbNames: string[] = Object.keys(arbs)
    const tmpColumns: Column[] = [{ ...keyColumn('key', textColumn), title: "Key" }]
    for (const arbName of arbNames) {
      tmpColumns.push({ ...keyColumn(arbName, textColumn), title: arbName })
    }

    // rows
    const tmpRows: any[] = []
    for (const key of mainLocaleKeys) {
      const tmpItem = {}
      for (const c of tmpColumns) {
        let value = ""
        if (c.id === keysString) {
          value = key
        } else {
          value = arbs[c.id][key]
        }
        tmpItem[c.id] = value
      }
      tmpRows.push(tmpItem)
    }
    setColumns(tmpColumns)
    setRows(tmpRows)
  }, [arbs])

  const renderL10nConfigsBar = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: configsBarHeight,
        }}
      >
        <LocalizationConfigView
          msg={msg}
          onUpdateHeight={(height: number) => {
            setConfigsBarHeight(height)
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
      <DynamicDataSheetGrid
        style={{
          width: '100%',
          height: '100%',
        }}
        className='grid_root'
        rowClassName={'grid_row'}
        cellClassName={'grid_cell'}
        height={height}
        headerRowHeight={50}
        rowHeight={40}
        columns={columns}
        value={rows}
        createRow={createRow}
        onChange={(e) => {
          setRows(e)
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
        }}
      >
        <FXGProjectInfoPanel {...props.projectInfo} />
        {renderL10nConfigsBar()}
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%',
        }}
      >
        {renderGrid()}
      </div>
    </div>
  )
}

export default LocalizationPage