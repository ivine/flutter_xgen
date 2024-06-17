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
  integrations: FlutterGenIntegrationsConfig
  assets: FlutterGenAssetsConfig
  fonts: FlutterGenFontsConfig
  colors: FlutterGenColorsConfig
}

export interface FlutterGenIntegrationsConfig {
  flutter_svg: boolean
  flare_flutter: boolean
  rive: boolean
  lottie: boolean
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
