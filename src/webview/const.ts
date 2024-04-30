import * as vscode from 'vscode'

export enum WebViewType {
  fxg,
  binaryPreview
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

    case WebViewType.binaryPreview:
      typeData = { type: WebViewType.binaryPreview, viewType: "BinaryPreviewWebPanel", title: "FXG Preview", viewColumn: vscode.ViewColumn.Active };
      break;

    default:
      break;
  }
  return typeData
}