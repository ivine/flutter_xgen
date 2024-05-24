import FXGProject from '../model/project'
import { PreviewItem } from '../model/preview'

export default class WorkspaceManager {
  public dir: string
  private static instance: WorkspaceManager | null = null
  private constructor() { }
  static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager()
    }
    return WorkspaceManager.instance
  }

  mainProject: FXGProject | null = null
  subProjectList: FXGProject[] = []

  previewItem: PreviewItem | null = null

  public setup(dir: string) {
    this.dir = dir

    this.mainProject = new FXGProject(dir, true)
  }

  public dispose() {
    this.mainProject = null
    this.subProjectList = null

    this.previewItem = null
  }

  public addSubProject(subProjectDir: string) {
    let filterResults = this.subProjectList.filter((e) => e.dir === subProjectDir)
    if (filterResults.length > 0) {
      // 已存在
      return;
    }

    this.subProjectList.push(new FXGProject(subProjectDir, false))
  }
}
