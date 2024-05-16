import { useEffect, useState } from 'react'
import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react'

import LocalizationPage from './localization/localization.page'

import TestData from './test/test_data.json';

import "./App.css"

function App() {
  const [localizationJSON, setLocalizationJSON] = useState<any>(null)

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
    const arbs = files.arbs
    if (event.eventType === 300102 && localizationJSON === null) {
      setLocalizationJSON(arbs)
    }
  }

  return (
    <main>
      <h1>FXG UI</h1>
      <VSCodePanels>
        <VSCodePanelTab id="view-Localization">
          Localization
        </VSCodePanelTab>
        <VSCodePanelTab id="view-Assets">
          Assets
        </VSCodePanelTab>

        <VSCodePanelView id="view-Localization">
          <LocalizationPage localizationJSON={localizationJSON} />
        </VSCodePanelView>
        <VSCodePanelView id="view-Assets">
          <h2> Hello Assets </h2>
        </VSCodePanelView>
      </VSCodePanels>
    </main>
  )
}

export default App
