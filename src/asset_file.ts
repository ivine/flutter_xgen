class AssetsFile {
  projectDir: string;
  assetDir: string;
  filePath: string;

  constructor(projectDir: string, assetDir: string, filePath: string) {
    this.projectDir = projectDir;
    this.assetDir = assetDir;
    this.filePath = filePath;
  }
}