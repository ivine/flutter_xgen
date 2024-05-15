import { AssetsFile } from '../model/assets'
import { FXGFileTree } from '../model/base'
import { IntlArbFile } from '../model/intl'
import { PreviewItem } from '../model/preview'
import { FileUtil } from '../util/file.util'

const yaml = require('js-yaml');

export default class FXGProject {
  dir: string
  constructor(dir: string) {
    this.dir = dir
    this.setup()
  }

  loading: boolean = false
  pubspecData: any = null

  assetsFiles: (FXGFileTree<AssetsFile> | AssetsFile)[] = []
  intlFiles: IntlArbFile[] = []

  previewItem: PreviewItem | null = null

  public async setup() {
    // 获取当前 pubspec data
    this.loading = true
    try {
      await this.getCurrentPubspecData()
      this.getCurrentAssetsFileTree()
      this.getCurrentIntlFileTree()
    } catch (error) {
      console.log("FXGProject - setup, error:", error)
    }
    this.loading = false
  }

  public dispose() {
    this.assetsFiles = []
    this.intlFiles = []

    this.previewItem = null
  }

  public refresh() { }


  // MARK: - Getter & Setter
  get projectName(): string {
    let result: string = ""
    try {
      result = this.pubspecData["name"]
    } catch (error) {

    }
    return result
  }

  // MARK: - Private
  private async getCurrentPubspecData() {
    let pubspecPath = `${this.dir}/pubspec.yaml`
    if (!FileUtil.pathExists(pubspecPath)) {
      console.log("pubspec no exist, TODO: add alert");
      return;
    }
    let result: string = await FileUtil.readFile(pubspecPath)
    this.pubspecData = yaml.load(result)
  }

  private async getCurrentAssetsFileTree() {
    let pathsSettings = this.pubspecData["flutter"]["assets"]
    if (!Array.isArray(pathsSettings)) {
      console.log('getCurrentAssetsFileTree, assetsSettings is not array')
      return;
    }

    let assetsFiles: (FXGFileTree<AssetsFile> | AssetsFile)[] = []

    for (let p of pathsSettings) {
      let fullPath = this.dir + "/" + p
      let isDir = await FileUtil.pathIsDir(fullPath)
      if (isDir) {
        let children = await this.assembleAssetsFiles(fullPath)
        let fileTree = new FXGFileTree<AssetsFile>(fullPath, children)
        assetsFiles.push(fileTree)
      } else {
        let fileName = FileUtil.getFileName(fullPath)
        let file = new AssetsFile(
          fullPath,
          true,
          [],
        )
        assetsFiles.push(file)
      }
    }
    this.assetsFiles = assetsFiles

    // FlutterAssetsGenerator generate ruler: https://github.com/cr1992/FlutterAssetsGenerator

    // FlutterGen generate ruler: https://github.com/FlutterGen/flutter_gen
  }

  private async assembleAssetsFiles(dir: string): Promise<AssetsFile[]> {
    let files: AssetsFile[] = []
    let isValid = true

    let allFiles: string[] = await FileUtil.getDirAllFiles(dir)
    allFiles = FileUtil.sortFiles(allFiles)
    for (let tmpFilePath of allFiles) {
      let fileName = FileUtil.getFileName(tmpFilePath)

      let children: AssetsFile[] = []
      let subIsDir = await FileUtil.pathIsDir(tmpFilePath)
      if (subIsDir) {
        children = await this.assembleAssetsFiles(tmpFilePath)
      }

      let file: AssetsFile = new AssetsFile(
        tmpFilePath,
        isValid,
        children,
      )
      files.push(file)
    }
    return Promise.resolve(files)
  }

  private async getCurrentIntlFileTree() {
    // flutter_intl

    let pathsSettings = this.pubspecData["flutter_intl"]
    if (!pathsSettings) {
      console.log('getCurrentAssetsFileTree, assetsSettings is not array')
      return;
    }

    let l10nFilesDir: string = `${this.dir}/lib/l10n`
    let configL10nFilesDir: any = pathsSettings["arb-dir"]
    if (typeof configL10nFilesDir === "string" && configL10nFilesDir.length > 0) {
      l10nFilesDir = `${this.dir}/${configL10nFilesDir}`
    }

    let allFiles: string[] = await FileUtil.getDirAllFiles(l10nFilesDir)
    let tmpFiles: IntlArbFile[] = []
    for (let p of allFiles) {
      let tmpFile = new IntlArbFile(p)
      tmpFiles.push(tmpFile)
    }
    this.intlFiles = tmpFiles
  }
}
