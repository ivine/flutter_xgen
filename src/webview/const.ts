import * as vscode from 'vscode'
import { InteractionEventType } from '../manager/interaction.manager'
import { FlutterAssetsGeneratorConfigByCr1992, FlutterGenConfig, FlutterIntlConfig } from '../model/project.enum'

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
  flutterGenConfig: FlutterGenConfig | null
  flutterAssetsGeneratorConfigByCr1992: FlutterAssetsGeneratorConfigByCr1992 | null
}

export interface L10nMsgInterface {
  watcherEnable: boolean
  flutterIntlConfig: FlutterIntlConfig | null
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