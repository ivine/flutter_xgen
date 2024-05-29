import { useEffect, useRef, useState } from 'react'

import LocalizationPage from './localization/localization.page'
import FlutterAssetsPage from './flutter_assets/flutter_assets.page'

import { AssetsMsgInterface, InteractionEventType, L10nMsgInterface, MsgInterface } from './enum/extension.type'
import { ScreenType } from './enum/screent.type'

import L10nTestData from './test/l10_data.json'

import "./App.css"

function App() {
  const [assetsMsg, setAssetsMsg] = useState<AssetsMsgInterface | null>(null)
  const [l10nMsg, setL10nMsg] = useState<L10nMsgInterface | null>(null)
  const [interactionEventType, setInteractionEventType] = useState<InteractionEventType | null>(null)
  const [screenType, setScreenType] = useState<ScreenType>(ScreenType.none)

  useEffect(() => {
    window.addEventListener('message', onMsg)

    if (import.meta.env.MODE === 'development') {
      setTimeout(() => {
        document.body.style.color = "#ffffff"
        document.body.style.backgroundColor = "#24262f"
        try {
          onReceiveMsg(L10nTestData as MsgInterface)
        } catch (error) {
          console.log("debug, parse JSON error: ", error)
        }
      }, 1000)
    } else {
    }

    return () => {
      window.removeEventListener('message', onMsg)
    }
  }, [])

  const onMsg = (msg: any) => {
    console.log('app on message: ', msg)
    let data = msg.data
    try {
      const test_string = JSON.stringify(data)
      console.log('dw test, onMsg ----- start -----')
      console.log(test_string)
      console.log('dw test, onMsg ----- end -----')
    } catch (error) {
      //
    }
    onReceiveMsg(data)
  }

  const onReceiveMsg = async (msg: MsgInterface) => {
    if (
      msg.type === InteractionEventType.extToWeb_preview_assets ||
      msg.type === InteractionEventType.extToWeb_configs_assets
    ) {
      const assets = msg.data.assets
      setAssetsMsg(assets)
      setScreenType(ScreenType.assets)
    } else if (
      msg.type === InteractionEventType.extToWeb_preview_localization ||
      msg.type === InteractionEventType.extToWeb_configs_localization
    ) {
      const l10n = msg.data.l10n
      setL10nMsg(l10n)
      setScreenType(ScreenType.localizations)
    } else {

    }

    setInteractionEventType(msg.type)
  }

  return (
    <main>
      {/* <h1>Flutter XGen</h1> */}
      {screenType === ScreenType.none ? <div>正在加载中</div> : <></>}
      {
        screenType === ScreenType.assets ?
          <FlutterAssetsPage {...assetsMsg} /> :
          <></>
      }
      {
        screenType === ScreenType.localizations ?
          <LocalizationPage {...l10nMsg} /> :
          <></>
      }
    </main>
  )
}

export default App
