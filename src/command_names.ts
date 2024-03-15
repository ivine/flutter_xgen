enum FAGCommandNames {
  Generate = "FAG.FlutterAssetsGenerate",
  StartWatch = "FAG.FlutterAssetsStartWatch",
  StopWatch = "FAG.FlutterAssetsStopWatch",
}

const FAGCommandTitle: { [key in FAGCommandNames]: string } = {
  [FAGCommandNames.Generate]: "Flutter Assets Generator: Assets.dart 生成",
  [FAGCommandNames.StartWatch]: "Flutter Assets Generator: 开始监听 Assets 文件夹",
  [FAGCommandNames.StopWatch]: "Flutter Assets Generator: 停止监听 Assets 文件夹",
};

export { FAGCommandNames, FAGCommandTitle };
