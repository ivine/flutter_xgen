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

export interface InteractionEvent {
  timestamp: number
  eventType: InteractionEventType
  projectInfo: ProjectInfoMsgInterface
  data: any
}

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

export interface AssetsMsgInterface {
  previewItem: any
  fileExt: string
  flutterGenConfig: FlutterGenConfig | null
  flutterAssetsGeneratorConfigByCr1992: FlutterAssetsGeneratorConfigByCr1992 | null
}

export interface L10nMsgInterface {
  localizelyFlutterIntlInstalled: boolean
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

// MAKR: - Project pubspec configs

// MARK: - FlutterAssetsGenerator - Cr1992
export interface FlutterAssetsGeneratorConfigByCr1992 {
  // https://github.com/cr1992/FlutterAssetsGenerator
  output_dir?: string // default: generated, e.g.: lib/generated
  auto_detection: boolean
  named_with_parent: boolean
  output_filename?: string
  class_name?: string
  filename_split_pattern?: string
  path_ignore?: string[]
  leading_with_package_name?: boolean
}

// MARK: - Flutter Gen
export interface FlutterGenConfig {
  // https://github.com/FlutterGen/flutter_gen/blob/main/packages/core/lib/settings/config_default.dart
  output: string
  line_length: number
  parse_metadata: boolean
  assets: FlutterGenAssetsConfig
}

export interface FlutterGenAssetsConfig {
  enabled: boolean
  exclude: string[]
  outputs: FlutterGenAssetsOutputConfig
}

export interface FlutterGenAssetsOutputConfig {
  package_parameter_enabled: boolean
  style: string
  class_name: string
}

export interface FlutterGenFontsConfig {
  enabled: boolean
  outputs: FlutterGenFontsOutputConfig
}

export interface FlutterGenFontsOutputConfig {
  class_name: string
}

export interface FlutterGenColorsConfig {
  enabled: boolean
  inputs: any[]
  outputs: FlutterGenFontsOutputConfig
}

export interface FlutterGenColorsOutputConfig {
  class_name: string
}

// MARK: - Intl

export interface FlutterIntlConfig {
  enabled: boolean
  class_name: string
  main_locale: string
  arb_dir: string
  output_dir: string
  use_deferred_loading: boolean | null
  localizely: any // TODO: 后续支持
}
