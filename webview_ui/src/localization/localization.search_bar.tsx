import { useEffect, useRef, useState } from 'react'

import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

import SouthOutlined from '@mui/icons-material/SouthOutlined'
import NorthOutlined from '@mui/icons-material/NorthOutlined'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowRightOutlinedIcon from '@mui/icons-material/KeyboardArrowRightOutlined'
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined'
import CaseSensitive from '../assets/case-sensitive.svg'
import WholeWord from '../assets/whole-word.svg'
import ReplaceIcon from '../assets/replace.svg'
import ReplaceAllIcon from '../assets/replace-all.svg'

import FXGSpacer from '../component/spacer'
import FXGContainer from '../component/container'

export interface LocalizationSearchBarInterface {
  currentIndex: number
  totalCount: number
  caseSensitiveMatchEnable: boolean
  wholeWordMatchEnable: boolean
  onChangeCaseSensitiveMatch: (enable: boolean) => void
  onChangeWholeWordMatch: (enable: boolean) => void
  onViewVisible: (visible: boolean) => void
  onMovePrevious: () => void
  onMoveNext: () => void
  onSearching: (keyword: string) => void
  onReplacingText: (keyword: string, targetText: string, replaceAll: boolean) => void
}

function LocalizationSearchBar(props: LocalizationSearchBarInterface) {
  const [visible, setVisible] = useState(false)
  const [replaceBarVisible, setReplaceBarVisible] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [replaceKeyword, setReplaceKeyword] = useState('')

  const keywordRef = useRef<string>('')
  const replaceKeywordRef = useRef<string>('')

  const inputRef = useRef(null)
  const replaceInputRef = useRef(null)

  useEffect(() => {
    if (visible && inputRef.current && keywordRef.current.length > 0) {
      inputRef.current.select()
      props.onSearching(keywordRef.current)
    }
  }, [visible])

  useEffect(() => {
    const listenKeydownEvent = (event) => {
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
    const ci = props.currentIndex
    const tc = props.totalCount
    if (previous) {
      return ci > 0 && tc > 0
    } else {
      return ci + 1 < tc
    }
  }

  function renderKeywordSearchBar() {
    return (
      <FXGContainer
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 50,
          backgroundColor: '#fff'
        }}
      >
        <FXGSpacer width={6} />
        <TextField
          inputRef={inputRef}
          autoFocus
          sx={{
            userSelect: 'none'
          }}
          value={keyword}
          placeholder="查找"
          variant="standard"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <FXGContainer
                  style={{
                    userSelect: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: '100%'
                  }}
                  onClick={() => {
                    props.onChangeCaseSensitiveMatch(!props.caseSensitiveMatchEnable)
                    props.onSearching(keywordRef.current)
                  }}
                >
                  <img
                    src={CaseSensitive}
                    style={{
                      backgroundColor: props.caseSensitiveMatchEnable ? '#f2f2f2' : 'transparent',
                      borderStyle: props.caseSensitiveMatchEnable ? 'solid' : 'none',
                      borderWidth: 2,
                      borderColor: '#d8d8d8',
                      borderRadius: 4,
                      color: '#707070',
                      width: 20,
                      height: 20
                    }}
                  />
                </FXGContainer>
                <FXGSpacer width={6} />
                <FXGContainer
                  style={{
                    userSelect: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: '100%'
                  }}
                  onClick={() => {
                    props.onChangeWholeWordMatch(!props.wholeWordMatchEnable)
                    props.onSearching(keywordRef.current)
                  }}
                >
                  <img
                    src={WholeWord}
                    style={{
                      backgroundColor: props.wholeWordMatchEnable ? '#f2f2f2' : 'transparent',
                      borderStyle: props.wholeWordMatchEnable ? 'solid' : 'none',
                      borderWidth: 2,
                      borderColor: '#d8d8d8',
                      borderRadius: 4,
                      color: '#707070',
                      width: 20,
                      height: 20
                    }}
                  />
                </FXGContainer>
              </InputAdornment>
            )
          }}
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
            userSelect: 'none',
            color: '#222',
            fontSize: 14,
            fontWeight: 500,
            minWidth: 40
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
            props.onViewVisible(false)
          }}
        />
      </FXGContainer>
    )
  }

  function renderKeywordReplaceBar() {
    return (
      <FXGContainer
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          // boxShadow: '0px 0px 10px #5B86E5',
          borderRadius: 8,
          width: '100%',
          height: 40,
          backgroundColor: '#fff'
        }}
      >
        <FXGContainer
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 50,
            backgroundColor: '#fff'
          }}
        >
          <FXGSpacer width={6} />
          <TextField
            inputRef={replaceInputRef}
            sx={{
              userSelect: 'none'
            }}
            value={replaceKeyword}
            placeholder="替换"
            variant="standard"
            onChange={(e) => {
              if (e.target && typeof e.target.value === 'string') {
                setReplaceKeyword(e.target.value)
                replaceKeywordRef.current = e.target.value
              }
            }}
          />
          <FXGSpacer width={20} />
          <FXGContainer
            style={{
              userSelect: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: '100%'
            }}
            onClick={() => {
              if (replaceKeywordRef.current.length === 0) {
                return
              }
              props.onReplacingText(keywordRef.current, replaceKeywordRef.current, false)
            }}
          >
            <img
              src={ReplaceIcon}
              style={{
                color: '#707070',
                width: 20,
                height: 20
              }}
            />
          </FXGContainer>
          <FXGSpacer width={10} />
          <FXGContainer
            style={{
              userSelect: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: '100%'
            }}
            onClick={() => {
              if (replaceKeywordRef.current.length === 0) {
                return
              }
              props.onReplacingText(keywordRef.current, replaceKeywordRef.current, true)
            }}
          >
            <img
              src={ReplaceAllIcon}
              style={{
                borderWidth: 2,
                borderColor: '#d8d8d8',
                borderRadius: 4,
                color: '#222222',
                width: 20,
                height: 20
              }}
            />
          </FXGContainer>
        </FXGContainer>
      </FXGContainer>
    )
  }

  function renderBody() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          position: 'absolute',
          boxShadow: '0px 0px 10px #5B86E5',
          borderRadius: 8,
          padding: 6,
          top: 30,
          right: 30,
          minHeight: 50,
          backgroundColor: '#fff'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            minHeight: 50
          }}
          onClick={() => {
            setReplaceBarVisible(!replaceBarVisible)
          }}
        >
          {replaceBarVisible ? (
            <KeyboardArrowDownOutlinedIcon style={{ color: '#222' }} />
          ) : (
            <KeyboardArrowRightOutlinedIcon style={{ color: '#222' }} />
          )}
        </div>
        <FXGContainer
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {renderKeywordSearchBar()}
          {replaceBarVisible ? renderKeywordReplaceBar() : null}
        </FXGContainer>
      </div>
    )
  }

  return visible ? <>{renderBody()}</> : null
}

export default LocalizationSearchBar
