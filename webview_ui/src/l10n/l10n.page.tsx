import { VSCodeDataGrid, VSCodeDataGridRow, VSCodeDataGridCell } from "@vscode/webview-ui-toolkit/react";

interface L10nPageInterface {
  l10nJson: Map<string, string>;
}

function L10nPage(props: L10nPageInterface) {
  const renderVSCodeGrid = () => {
    if (typeof props.l10nJson !== 'object') {
      return <div>Invalid localization data.</div>
    }

    let mainLocaleKeys: string[] = [] // 国际化主键 keys

    let names: string[] = []
    let jsonParentMap: Map<string, Map<string, string>> = new Map()
    for (let name of props.l10nJson.keys()) {
      names.push(name)
      let jsonStr = props.l10nJson.get(name)
      let json: Map<string, string> = new Map()
      try {
        let tmpJson = JSON.parse(jsonStr)
        Object.keys(tmpJson).forEach(key => {
          const value = tmpJson[key];
          json.set(key, value)
        });
      } catch (error) {
        console.log('renderVSCodeGrid, JSON.parse - error: ', error)
      }
      if (name.includes('en')) {
        // TODO: 优化一下
        mainLocaleKeys = []
        for (let tmpKey of json.keys()) {
          mainLocaleKeys.push(tmpKey)
        }
      }
      jsonParentMap.set(name, json);
    }
    return (
      <VSCodeDataGrid generateHeader='sticky'>
        <VSCodeDataGridRow row-type="sticky-header">
          {names.map((name, index) => {
            console.log('dw test index: ', index)
            return (
              <VSCodeDataGridCell key={name} cell-type="columnheader" grid-column={`${index + 1}`}>
                {name}
              </VSCodeDataGridCell>
            )
          })}
        </VSCodeDataGridRow>
        {mainLocaleKeys.map(function (key: string, index: number) {
          return (
            <VSCodeDataGridRow>
              {names.map(function (name: string, index: number) {
                let json = jsonParentMap.get(name)
                let value = json.get(key)
                return <VSCodeDataGridCell grid-column={`${index + 1}`}>{value}</VSCodeDataGridCell>
              })}
            </VSCodeDataGridRow>
          )
        })}
      </VSCodeDataGrid>
    );
  }

  return (
    renderVSCodeGrid()
  );
}

export default L10nPage;