import { getExtensionContext } from '../extension'
import { FXGWatcherType } from '../webview/const'

interface FXGStore {
  projectMap: any
}

interface FXGStoreProject {
  watcherTypes: number[]
}

export default class StoreManager {
  private static instance: StoreManager | null = null
  private rootPath: string = ''
  private storeKey: string = 'FXGLocalStoreKey'
  private store: FXGStore = {
    projectMap: {}
  }

  private constructor() {}

  static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager()
    }
    return StoreManager.instance
  }

  public setup(rootPath: string) {
    this.rootPath = rootPath
    this.store = {
      projectMap: {}
    }
    const jsonStr = getExtensionContext().workspaceState.get<string>(this.storeKey)
    if (jsonStr) {
      try {
        const tmpJson = JSON.parse(jsonStr)
        this.store = tmpJson
        console.log('StoreManager - setup, completed')
      } catch (error) {
        console.error(`Failed to parse store JSON: ${error}`)
      }
    }
  }

  public setWatcherEnable(enable: boolean, dir: string, watcherType: FXGWatcherType) {
    try {
      const projectInfo = this.getProjectInfo(dir)
      const watcherTypes = this.getProjectWatcherTypes(dir)
      const filteredList = watcherTypes.filter((e) => e !== watcherType)
      if (enable) {
        filteredList.push(watcherType)
      }
      projectInfo.watcherTypes = filteredList
      this.store.projectMap[dir] = projectInfo
      const jsonStr = JSON.stringify(this.store)
      getExtensionContext().workspaceState.update(this.storeKey, jsonStr)
    } catch (error) {
      console.error(`setWatcherEnable, error: ${error}`)
    }
  }

  public getWatcherEnable(dir: string, watcherType: FXGWatcherType): boolean {
    const watcherTypes = this.getProjectWatcherTypes(dir)
    const filteredList = watcherTypes.filter((e) => e === watcherType)
    const result: boolean = filteredList.length > 0
    return result
  }

  public getProjectInfo(dir: string): FXGStoreProject {
    const keys = Object.keys(this.store.projectMap)
    if (!keys.includes(dir)) {
      this.store.projectMap[dir] = {
        watcherTypes: []
      }
    }
    return this.store.projectMap[dir]
  }

  public getProjectWatcherTypes(dir: string): FXGWatcherType[] {
    const projectInfo = this.getProjectInfo(dir)
    const results: FXGWatcherType[] = projectInfo.watcherTypes
    return results
  }
}
