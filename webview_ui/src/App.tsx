import { useEffect, useState } from 'react'
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react'

import LocalizationPage from './localization/localization.page'
import FlutterAssetsPage from './flutter_assets/flutter_assets.page'

import TestData from './test/test_data.json';

import "./App.css"

function App() {
  const [localizationJSON, setLocalizationJSON] = useState<any>(null)
  const [assetsJSON, setAssetsJSON] = useState<any>(null)

  useEffect(() => {
    window.addEventListener('message', event => {
      console.log('app on message: ', event)
      onReceiveMsg(event.data)
    })

    if (import.meta.env.MODE === 'development') {
      setTimeout(() => {
        document.body.style.color = "#ffffff"
        document.body.style.backgroundColor = "#24262f"
        try {
          const localizationStr = TestData["localization"]
          const localizationJSON = JSON.parse(localizationStr)
          setLocalizationJSON(localizationJSON.files.arbs)
        } catch (error) {
          //
        }
      }, 1000)
    } else {
    }
  }, [])

  const onReceiveMsg = async (data: any) => {
    const event = data.event
    const files = data.files
    if (event.eventType === 300102 && localizationJSON === null) {
      const arbs = files.arbs
      setLocalizationJSON(arbs)
    } else if (event.eventType === 300101) {
      const assets = files.assets
      setAssetsJSON(assets)
    }
  }

  return (
    <main>
      <h1>Flutter XGen</h1>
      <VSCodePanels>
        {/* <VSCodePanelTab id="view-Localization">
          Localization
        </VSCodePanelTab> */}
        <VSCodePanelTab id="view-Assets">
          Assets
        </VSCodePanelTab>

        {/* <VSCodePanelView id="view-Localization">
          <LocalizationPage dataJSON={localizationJSON} />
        </VSCodePanelView> */}
        <VSCodePanelView id="view-Assets">
          <FlutterAssetsPage dataJSON={assetsJSON} />
        </VSCodePanelView>
      </VSCodePanels>
    </main>
  )
}

export default App
