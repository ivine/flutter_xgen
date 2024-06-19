import { useEffect, useRef, useState } from 'react'

import LocalizationPage from './localization/localization.page'
import FlutterAssetsPage from './flutter_assets/flutter_assets.page'
import FlutterAssetsConfigView from './flutter_assets/flutter_assets.config.view'

import { InteractionEventType, MsgInterface } from './enum/vscode_extension.type'
import { ScreenType } from './enum/screent.type'

import L10nTestMsg from './test/l10_msg.json'
import AssetsTestMsg from './test/assets_msg.json'

import "./App.css"

function App() {
  const screenTypeRef = useRef<ScreenType>(ScreenType.none)
  const msgRef = useRef<MsgInterface | null>(null)
  const [msg, setMsg] = useState<MsgInterface | null>(null)

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

  const onMsg = (originalMsg: any) => {
    console.log('app on message: ', originalMsg)
    try {
      const data: MsgInterface = originalMsg.data

      // --- log --- //
      const test_string = JSON.stringify(data)
      console.log('onMsg ----- start -----')
      console.log(test_string)
      console.log('onMsg ----- end -----')
      // --- log --- //

      if (data.type === InteractionEventType.sync_project_info) {
        // 同步
        const tmpData = Object.assign({}, msgRef.current)
        tmpData.projectInfo = data.projectInfo
        setCurrentMsg(tmpData)
      } else {
        onReceiveMsg(data)
      }
    } catch (error) {
      //
    }
  }

  const onReceiveMsg = async (receiveMsg: MsgInterface) => {
    let tmpScreentType: ScreenType = ScreenType.none
    if (
      receiveMsg.type === InteractionEventType.extToWeb_preview_assets
    ) {
      tmpScreentType = ScreenType.assets
    } else if (receiveMsg.type === InteractionEventType.extToWeb_configs_assets) {
      tmpScreentType = ScreenType.assetsConfigs
    } else if (
      receiveMsg.type === InteractionEventType.extToWeb_preview_localization ||
      receiveMsg.type === InteractionEventType.extToWeb_configs_localization
    ) {
      tmpScreentType = ScreenType.localizations
    }

    screenTypeRef.current = tmpScreentType
    setCurrentMsg(receiveMsg)
  }

  const setCurrentMsg = (msg: MsgInterface) => {
    msgRef.current = msg
    setMsg(msg)
  }

  return (
    <main>
      {screenTypeRef.current === ScreenType.none ? <div>正在加载中</div> : <></>}
      {
        screenTypeRef.current === ScreenType.localizations ?
          <LocalizationPage {...msg} /> :
          <></>
      }
      {
        screenTypeRef.current === ScreenType.assets ?
          <FlutterAssetsPage {...msg} /> :
          <></>
      }
      {
        screenTypeRef.current === ScreenType.assetsConfigs ?
          <FlutterAssetsConfigView {...msg} /> :
          <></>
      }
    </main>
  )
}

export default App
