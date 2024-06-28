import { useEffect, useRef, useState } from 'react'

import SouthOutlined from '@mui/icons-material/SouthOutlined'
import NorthOutlined from '@mui/icons-material/NorthOutlined'
import CloseIcon from '@mui/icons-material/Close'
import Input from '@mui/material/Input'

import FXGSpacer from '../component/spacer'
import FXGContainer from '../component/container'

export enum SearchMatchMode {
  ExactCaseInsensitive = 1, // 全等不区分大小写
  ExactCaseSensitive = 2, // 全等区分大小写
  ContainsCaseInsensitive = 3, // 包含不区分大小写
  ContainsCaseSensitive = 4 // 包含区分大小写
}

export interface LocalizationSearchBarInterface {
  matchMode: SearchMatchMode
  currentIndex: number
  totalCount: number
  onViewVisible: (visible: boolean) => void
  onMovePrevious: () => void
  onMoveNext: () => void
  onSearching: (keyword: string) => void
}

function LocalizationSearchBar(props: LocalizationSearchBarInterface) {
  const [visible, setVisible] = useState(false)
  const [keyword, setKeyword] = useState('')
  const keywordRef = useRef<string>('')

  useEffect(() => {
    const listenKeydownEvent = (event) => {
      // console.log('listenKeydownEvent, event.key: ', event.key)
      if (event.key === 'f' || event.key === 'F') {
        if (visible) {
          return
        }
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          setVisible(true)
          props.onViewVisible(true)
        }
      } else if (event.key === 'Escape') {
        if (!visible) {
          return
        }
        event.preventDefault()
        setVisible(false)
        props.onViewVisible(false)
      } else if (event.key === 'Backspace') {
        if (!visible) {
          return
        }
        if (event.altKey || event.metaKey) {
          event.preventDefault()
          keywordRef.current = ''
          setKeyword('')
        }
      } else if (event.key === 'Enter') {
        if (!visible) {
          return
        }
        if (event.shiftKey) {
          props.onMovePrevious()
        } else {
          props.onMoveNext()
        }
      }
    }
    document.addEventListener('keydown', listenKeydownEvent)
    return () => {
      document.removeEventListener('keydown', listenKeydownEvent)
    }
  }, [visible, props.onViewVisible, props.onMovePrevious, props.onMoveNext])

  useEffect(() => {
    const targetKeyword = keywordRef.current
    if (typeof props.onSearching === 'function') {
      props.onSearching(targetKeyword)
    }
  }, [keyword])

  function getSearchResultDisplayContent(): string {
    let result: string = '无结果'
    const ci = props.currentIndex
    const tc = props.totalCount
    if (ci >= 0 && ci < tc && tc > 0) {
      result = `${ci + 1}/${tc}`
    }
    return result
  }

  function checkCurrentIndexEnable(previous: boolean): boolean {
    // console.log('checkCurrentIndexEnable', ', previous: ', previous, ', currentIndex: ', currentIndex, ', searchResultsRef.current.length: ', searchResultsRef.current.length)
    const ci = props.currentIndex
    const tc = props.totalCount
    if (previous) {
      return ci > 0 && tc > 0
    } else {
      return ci + 1 < tc
    }
  }

  function renderBody() {
    if (!visible) {
      return <></>
    }
    return (
      <FXGContainer
        style={{
          flexDirection: 'row',
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 0px 10px #5B86E5',
          borderRadius: 8,
          padding: 10,
          top: 30,
          right: 30,
          height: 50,
          backgroundColor: '#fff'
        }}
      >
        <FXGSpacer width={10} />
        <Input
          sx={{
            maxWidth: 160,
            userSelect: 'none'
          }}
          value={keyword}
          autoFocus
          placeholder="查找"
          onChange={(e) => {
            if (e.target && typeof e.target.value === 'string') {
              setKeyword(e.target.value)
              keywordRef.current = e.target.value
            }
          }}
        />
        <FXGSpacer width={20} />
        <div
          style={{
            color: '#222',
            fontSize: 14,
            fontWeight: 500,
            minWidth: 40,
            userSelect: 'none'
          }}
        >
          {getSearchResultDisplayContent()}
        </div>
        <FXGSpacer width={10} />
        <FXGContainer
          style={{
            pointerEvents: checkCurrentIndexEnable(true) ? 'auto' : 'none',
            opacity: checkCurrentIndexEnable(true) ? 1 : 0.5,
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: '100%'
          }}
          onClick={() => {
            props.onMovePrevious()
          }}
        >
          <NorthOutlined style={{ color: '#707070', width: 20 }} />
        </FXGContainer>
        <FXGContainer
          style={{
            pointerEvents: checkCurrentIndexEnable(false) ? 'auto' : 'none',
            opacity: checkCurrentIndexEnable(false) ? 1 : 0.5,
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: '100%'
          }}
          onClick={() => {
            props.onMoveNext()
          }}
        >
          <SouthOutlined style={{ color: '#707070', width: 20 }} />
        </FXGContainer>
        <CloseIcon
          style={{ color: '#707070', width: 30 }}
          onClick={() => {
            setVisible(false)
          }}
        />
      </FXGContainer>
    )
  }

  return <>{renderBody()}</>
}

export default LocalizationSearchBar
