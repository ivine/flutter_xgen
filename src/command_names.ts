enum FXGCommandNames {
  AssetsGenerate = "FXG.FlutterXGenAssetsGenerate",
  AssetsStartWatch = "FXG.FlutterXGenAssetsStartWatch",
  AssetsStopWatch = "FXG.FlutterXGenAssetsStopWatch",
}

const FXGCommandTitle: { [key in FXGCommandNames]: string } = {
  [FXGCommandNames.AssetsGenerate]: "Flutter XGen: Assets.dart 生成",
  [FXGCommandNames.AssetsStartWatch]: "Flutter XGen: 开始监听 Assets 文件夹",
  [FXGCommandNames.AssetsStopWatch]: "Flutter XGen: 停止监听 Assets 文件夹",
};

export { FXGCommandNames, FXGCommandTitle };
