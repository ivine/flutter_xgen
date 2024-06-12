import * as vscode from 'vscode'
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

export enum FXGWatcherType {
  l10n = 100,
  assets_cr1992 = 200,
  assets_flutter_gen = 201,
}

export enum FlutterPubspecYamlConfigType {
  flutter_gen = 1,
  flutter_assets_generator_cr1992 = 2,
  flutter_intl = 3,
}

export const FlutterAssetsConfigCr1992Constants = {
  output_dir: "generated",
  auto_detection: false,
  named_with_parent: true,
  output_filename: "assets",
  class_name: "Assets",
  filename_split_pattern: "[-_]",
  path_ignore: [],
  leading_with_package_name: false
}

// MARK: - Msg
export interface AssetsMsgInterface {
  previewItem: any
  fileExt: string
  flutterGenConfig: FlutterGenConfig | null
  flutterAssetsGeneratorConfigByCr1992: FlutterAssetsGeneratorConfigByCr1992 | null
}

export interface L10nMsgInterface {
  flutterIntlConfig: FlutterIntlConfig | null
  arbs: any | null
}

export interface ProjectInfoMsgInterface {
  name: string
  dir: string
  watcherTypes: number[]
}
export interface MsgInterface {
  type: InteractionEventType
  projectInfo: ProjectInfoMsgInterface
  data: {
    assets: AssetsMsgInterface | null
    l10n: L10nMsgInterface | null
  }
}

// MARK: - Interaction
export interface InteractionEvent {
  timestamp: number
  eventType: InteractionEventType
  projectInfo: ProjectInfoMsgInterface
  data: any
}

// 事件类型
export enum InteractionEventType {

  // sync
  sync = 100000,
  sync_asset = 100001,
  sync_intl = 100002,
  sync_preview = 100003,
  sync_project_info = 100004,

  // VSCode Extension --> Web
  extToWeb_preview = 300100,
  extToWeb_preview_assets = 300101,
  extToWeb_preview_localization = 300102,
  extToWeb_configs = 300200,
  extToWeb_configs_assets = 300201,
  extToWeb_configs_localization = 300202,

  // Web --> VSCode Extension

  // assets
  webToExt_assets = 600100,
  webToExt_assets_run = 600101,
  webToExt_assets_read_config = 600102,
  webToExt_assets_save_config = 600103,
  webToExt_assets_watcher_cr1992_enable = 600104,
  webToExt_assets_watcher_flutter_gen_enable = 600105,

  // intl
  webToExt_intl = 600200,
  webToExt_intl_run = 600201,
  webToExt_intl_read_config = 600202,
  webToExt_intl_save_config = 600203,
  webToExt_intl_watcher_enable = 600204,

  // preview
  webToExt_preview = 600900,
  webToExt_preview_previousItem = 600910,
  webToExt_preview_nextItem = 600911,
}