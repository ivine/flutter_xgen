class AssetsGenerator {
  private static instance: AssetsGenerator | null = null
  private constructor() { }
  static getInstance(): AssetsGenerator {
    if (!AssetsGenerator.instance) {
      AssetsGenerator.instance = new AssetsGenerator()
    }
    return AssetsGenerator.instance
  }
}