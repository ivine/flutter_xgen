import * as vscode from 'vscode'
import { InteractionEventType } from '../manager/interaction.manager'

export enum WebViewType {
  fxg
}

export interface WebViewTypeData {
  type: WebViewType
  viewType: string
  title: string
  viewColumn: vscode.ViewColumn
}

export interface AssetsMsgInterface {
  watcherEnable: boolean
  previewItem: any
  fileExt: string
}

export interface L10nMsgInterface {
  watcherEnable: boolean
  flutterIntlConfigs: any | null
  arbs: any | null
}

export interface MsgInterface {
  type: InteractionEventType
  data: {
    assets: AssetsMsgInterface | null
    l10n: L10nMsgInterface | null
  }
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