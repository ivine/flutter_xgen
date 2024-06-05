import { useEffect, useRef, useState } from 'react'

import LocalizationPage from './localization/localization.page'
import FlutterAssetsPage from './flutter_assets/flutter_assets.page'
import FlutterAssetsConfigView from './flutter_assets/flutter_assets.config.view'

import { AssetsMsgInterface, InteractionEventType, L10nMsgInterface, MsgInterface } from './enum/vscode_extension.type'
import { ScreenType } from './enum/screent.type'

import L10nTestMsg from './test/l10_msg.json'
import AssetsTestMsg from './test/assets_msg.json'

import "./App.css"

function App() {
  const [msg, setMsg] = useState<MsgInterface | null>(null)
  const [interactionEventType, setInteractionEventType] = useState<InteractionEventType | null>(null)
  const [screenType, setScreenType] = useState<ScreenType>(ScreenType.none)

  useEffect(() => {
    window.addEventListener('message', onMsg)

    if (import.meta.env.MODE === 'development') {
      setTimeout(() => {
        document.body.style.color = "#ffffff"
        document.body.style.backgroundColor = "#24262f"
        try {
          onReceiveMsg(L10nTestMsg as MsgInterface)
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
      console.log('onMsg ----- start -----')
      console.log(test_string)
      console.log('onMsg ----- end -----')
    } catch (error) {
      //
    }
    onReceiveMsg(data)
  }

  const onReceiveMsg = async (msg: MsgInterface) => {
    setMsg(msg)
    if (
      msg.type === InteractionEventType.extToWeb_preview_assets
    ) {
      setScreenType(ScreenType.assets)
    } else if (msg.type === InteractionEventType.extToWeb_configs_assets) {
      setScreenType(ScreenType.assetsConfigs)
    } else if (
      msg.type === InteractionEventType.extToWeb_preview_localization ||
      msg.type === InteractionEventType.extToWeb_configs_localization
    ) {
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
        screenType === ScreenType.localizations ?
          <LocalizationPage {...msg} /> :
          <></>
      }
      {
        screenType === ScreenType.assets ?
          <FlutterAssetsPage {...msg} /> :
          <></>
      }
      {
        screenType === ScreenType.assetsConfigs ?
          <FlutterAssetsConfigView {...msg} /> :
          <></>
      }
    </main>
  )
}

export default App
