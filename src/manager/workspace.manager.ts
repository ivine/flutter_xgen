import * as vscode from 'vscode'

import FXGProject from '../model/project'
import { PreviewItem } from '../model/preview'

export default class WorkspaceManager {
  public dir: string
  private static instance: WorkspaceManager | null = null
  private constructor() {}
  static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager()
    }
    return WorkspaceManager.instance
  }

  get dartPath(): string {
    let dart = vscode.workspace.getConfiguration('dart')
    let sdkPaths = dart.get<string[]>('sdkPaths')
    if (sdkPaths.length > 0) {
      return sdkPaths[0]
    }
    return ''
  }

  mainProject: FXGProject | null = null
  subProjectList: FXGProject[] = []

  previewItem: PreviewItem | null = null

  public setup(dir: string) {
    this.setupEnvPaths()
    this.dir = dir

    this.mainProject = new FXGProject(dir, true)
  }

  public setupEnvPaths() {}

  public dispose() {
    this.mainProject = null
    this.subProjectList = null

    this.previewItem = null
  }

  public addSubProject(subProjectDir: string) {
    let filterResults = this.subProjectList.filter((e) => e.dir === subProjectDir)
    if (filterResults.length > 0) {
      // 已存在
      return
    }

    this.subProjectList.push(new FXGProject(subProjectDir, false))
  }

  public getProjectByDir(dir: string | null): FXGProject | null {
    let project: FXGProject | null = null
    if (dir === this.mainProject.dir) {
      project = this.mainProject
    } else {
      const list = this.subProjectList.filter((p) => p.dir === dir)
      if (list.length > 0) {
        project = list[0]
      }
    }
    return project
  }
}
