import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';

import L10nPage from './l10n/l10n.page';

import "./App.css";
import { useEffect, useState } from 'react';

function App() {

  const [l10nJSONData, setL10nJSONData] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'fileContent') {
        const fileContent = message.content
        let map = new Map()
        Object.keys(fileContent).forEach(key => {
          const value = fileContent[key];
          map.set(key, value)
        });
        setL10nJSONData(map)
      }
    });
  }, []);

  return (
    <main>
      <h1>FXG UI</h1>
      <VSCodePanels>
        <VSCodePanelTab id="view-L10n">
          L10n
        </VSCodePanelTab>
        <VSCodePanelTab id="view-Assets">
          Assets
        </VSCodePanelTab>
        <VSCodePanelView id="view-L10n">
          <L10nPage l10nJson={l10nJSONData} />
        </VSCodePanelView>
        <VSCodePanelView id="view-Assets">
          <h2> Hello Assets </h2>
        </VSCodePanelView>
      </VSCodePanels>
    </main>
  )
}

export default App
