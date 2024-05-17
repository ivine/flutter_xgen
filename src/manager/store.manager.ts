import { getExtensionContext } from "../extension"

interface FXGStoreJSON {
  [key: string]: boolean;
}

export default class StoreManager {
  private static instance: StoreManager | null = null;
  private rootPath: string = "";
  private storeKey: string = "FXGLocalStore";
  private storeJSON: FXGStoreJSON = {};

  private constructor() { }

  static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  public setup(rootPath: string) {
    this.rootPath = rootPath;
    const jsonStr = getExtensionContext().workspaceState.get<string>(this.storeKey);

    if (jsonStr) {
      try {
        this.storeJSON = JSON.parse(jsonStr) as FXGStoreJSON;
      } catch (error) {
        console.error(`Failed to parse store JSON: ${error}`);
        this.storeJSON = {};
      }
    }
  }

  public setWatcherEnable(enable: boolean, projectDir: string) {
    this.storeJSON[projectDir] = enable;

    try {
      const jsonStr = JSON.stringify(this.storeJSON);
      getExtensionContext().workspaceState.update(this.storeKey, jsonStr);
    } catch (error) {
      console.error(`Failed to stringify store JSON: ${error}`);
    }
  }

  public getWatcherEnable(projectDir: string): boolean {
    return this.storeJSON[projectDir] || false;
  }
}
