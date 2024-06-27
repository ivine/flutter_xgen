import { useEffect, useState } from "react";

import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';

import FXGSpacer from "../component/spacer";
import FXGContainer from "../component/container";


export interface LocalizationSearchBarInterface {
  data: string[][]
}

function LocalizationSearchBar(props: LocalizationSearchBarInterface) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    document.addEventListener('keydown', listenKeydownEvent)
    return () => {
      document.removeEventListener('keydown', listenKeydownEvent)
    }
  }, [])

  function listenKeydownEvent(event) {
    if (event.key === 'f' || event.key === 'F') {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        setVisible(true)
      }
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
          boxShadow: '0px 0px 20px #5B86E5',
          borderRadius: 8,
          padding: 10,
          top: 30,
          right: 30,
          width: 300,
          height: 50,
          backgroundColor: '#fff',
        }}
      >
        <FXGSpacer />
        <SearchIcon style={{ color: '#222' }} />
        <ArrowDropDownIcon style={{ color: '#222' }} />
        <CloseIcon style={{ color: '#222' }} onClick={() => { setVisible(false) }} />
      </FXGContainer>
    )
  }

  return (
    <>{renderBody()}</>
  )
}

export default LocalizationSearchBar