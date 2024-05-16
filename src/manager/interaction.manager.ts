// 用于 VSCode Extension <---> WebViewUI 的交互
export default class InteractionManager {
  private static instance: InteractionManager | null = null
  private constructor() { }
  static getInstance(): InteractionManager {
    if (!InteractionManager.instance) {
      InteractionManager.instance = new InteractionManager()
    }
    return InteractionManager.instance
  }
}

// 事件
export interface InteractionEvent {
  timestamp: number
  eventType: InteractionEventType
  projectInfo: InteractionProjectInfo
  data: any
}

export interface InteractionProjectInfo {
  name: string
  dir: string
}

// 事件类型
export enum InteractionEventType {

  // sync
  sync = 100000,
  sync_asset = 100001,
  sync_intl = 100002,
  sync_preview = 100003,

  // VSCode Extension --> Web
  extToWeb_preview = 300100,
  extToWeb_preview_assets = 300101,
  extToWeb_preview_localization = 300102,

  // Web --> VSCode Extension

  // assets
  webToExt_assets = 600100,
  webToExt_assets_updateItem = 600110,

  // intl
  webToExt_intl = 600200,
  webToExt_intl_updateItem = 600210,
  webToExt_intl_removeItem = 600211,

  // preview
  webToExt_preview = 600900,
  webToExt_preview_previousItem = 600910,
  webToExt_preview_nextItem = 600911,
}