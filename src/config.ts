export const isDebugMode = true;

const FXGAssetsConstants = {
  KEY_PROJECT_NAME: "name",
  KEY_CONFIGURATION_MAP: "flutter_assets_generator",
  KEY_OUTPUT_DIR: "output_dir",
  KEY_CLASS_NAME: "class_name",
  KEY_AUTO_DETECTION: "auto_detection",
  KEY_NAMED_WITH_PARENT: "named_with_parent",
  KEY_LEADING_WITH_PACKAGE_NAME: "leading_with_package_name",
  KEY_OUTPUT_FILENAME: "output_filename",
  KEY_FILENAME_SPLIT_PATTERN: "filename_split_pattern",
  KEY_PATH_IGNORE: "path_ignore",
  VALUE_OUTPUT_DIR: "generated",
  VALUE_CLASS_NAME: "Assets",
  VALUE_FILENAME_SPLIT_PATTERN: "[-_]",
  VALUE_PATH_IGNORE: [],
  VALUE_OUTPUT_FILENAME: "assets"
} as const;

class AssetsGeneratorConfig {
  outputDir: string;
  className: string;
  packageName: string;

  autoDetection: boolean;
  namedWithParent: boolean;
  leadingWithPackageName: boolean;
  outputFilename: string;
  filenameSplitPattern: string; // Default: [-_]
  pathIgnore: string[];

  constructor(
    outputDir: string,
    className: string,
    packageName: string,

    autoDetection: boolean,
    namedWithParent: boolean,
    leadingWithPackageName: boolean,
    outputFilename: string,
    filenameSplitPattern: string,
    pathIgnore: string[]
  ) {
    this.outputDir = outputDir;
    this.className = className;
    this.packageName = packageName;

    this.autoDetection = autoDetection;
    this.namedWithParent = namedWithParent;
    this.leadingWithPackageName = leadingWithPackageName;
    this.outputFilename = outputFilename;
    this.filenameSplitPattern = filenameSplitPattern;
    this.pathIgnore = pathIgnore;
  }
}

export { FXGAssetsConstants, AssetsGeneratorConfig };