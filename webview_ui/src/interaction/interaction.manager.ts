import {
  InteractionEvent,
  InteractionEventType,
  ProjectInfoMsgInterface
} from "../enum/vscode_extension.type"

// 用于 VSCode Extension <---> WebViewUI 的交互
export default class InteractionManager {
  private static instance: InteractionManager | null = null
  private vscode: any | null = null
  private constructor() {
    this.vscode = acquireVsCodeApi()
  }
  static getInstance(): InteractionManager {
    if (!InteractionManager.instance) {
      InteractionManager.instance = new InteractionManager()
    }
    return InteractionManager.instance
  }

  public postMsg(type: InteractionEventType, projectInfo: ProjectInfoMsgInterface, data: any) {
    const msg: InteractionEvent = {
      timestamp: Date.now(),
      eventType: type,
      projectInfo: projectInfo,
      data: data
    }
    this.vscode?.postMessage(msg)
  }
}
