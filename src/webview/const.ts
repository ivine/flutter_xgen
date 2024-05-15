import * as vscode from 'vscode'

export enum WebViewType {
  fxg
}

export interface WebViewTypeData {
  type: WebViewType
  viewType: string
  title: string
  viewColumn: vscode.ViewColumn
}

export function getWebViewTypeData(type: WebViewType): WebViewTypeData | null {
  let typeData: WebViewTypeData | null = null
  switch (type) {
    case WebViewType.fxg:
      typeData = { type: WebViewType.fxg, viewType: "FXGUIWebPanel", title: "Flutter XGen", viewColumn: vscode.ViewColumn.One };
      break;

    default:
      break;
  }
  return typeData
}