import { useEffect, useRef, useState } from 'react'
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react'

import LocalizationPage from './localization/localization.page'
import FlutterAssetsPage from './flutter_assets/flutter_assets.page'

import { AssetsMsgInterface, InteractionEventType, L10nMsgInterface, MsgInterface } from './enum/extension.type'
import { ScreenType } from './enum/screent.type'

import TestData from './test/test_data.json';

import "./App.css"

function App() {
  const [assetsMsg, setAssetsMsg] = useState<AssetsMsgInterface | null>(null)
  const [l10nMsg, setL10nMsg] = useState<L10nMsgInterface | null>(null)
  const [interactionEventType, setInteractionEventType] = useState<InteractionEventType | null>(null)
  const [screenType, setScreenType] = useState<ScreenType>(ScreenType.none)

  useEffect(() => {
    window.addEventListener('message', msg => {
      console.log('app on message: ', msg)
      onReceiveMsg(msg.data)
    })

    if (import.meta.env.MODE === 'development') {
      setTimeout(() => {
        document.body.style.color = "#ffffff"
        document.body.style.backgroundColor = "#24262f"
        try {
          // const localizationStr = TestData["localization"]
          // const localizationJSON = JSON.parse(localizationStr)
          // setLocalizationJSON(localizationJSON.files.arbs)
          const jsonStr = TestData["assets"]
          const json = JSON.parse(jsonStr)
          setAssetsMsg(json)
          setScreenType(ScreenType.assets)
        } catch (error) {
          console.log("debug, parse JSON error: ", error)
        }
      }, 1000)
    } else {
    }
  }, [])

  const onReceiveMsg = async (msg: MsgInterface) => {
    if (msg.type === InteractionEventType.extToWeb_preview_assets) {
      const assets = msg.data.assets
      setAssetsMsg(assets)
      setScreenType(ScreenType.assets)
    } else if (msg.type === InteractionEventType.extToWeb_configs_assets) {
      // TODO: 资源文件的配置
      setScreenType(ScreenType.assets)
    } else if (msg.type === InteractionEventType.extToWeb_preview_localization) {
      const l10n = msg.data.l10n
      setL10nMsg(l10n)
      setScreenType(ScreenType.localizations)
    } else if (msg.type === InteractionEventType.extToWeb_configs_localization) {
      // TODO: 国际化的配置
      setScreenType(ScreenType.localizations)
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
