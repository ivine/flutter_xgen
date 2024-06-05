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
