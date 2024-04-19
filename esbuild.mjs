import esbuild from 'esbuild';

const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.ts"],
  outfile: "./dist/extension.js",
  external: ["vscode"],
};

const l10nWebviewConfig = {
  ...baseConfig,
  target: "es2022",
  format: "esm",
  entryPoints: ["./src/webview/l10n/main.ts"],
  outfile: "./dist/webview/l10n/webview.js",
};

// 构建函数
async function build(config) {
  try {
    const result = await esbuild.build(config);
    console.log("Build completed successfully:", result);
  } catch (error) {
    console.error("Build failed:", error);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--watch")) {
    // 监视文件变化并重新构建
    console.log("Watching for file changes...");

    // 启动监视
    const extensionWatcher = esbuild.build({
      ...extensionConfig,
      watch: true,
    });

    const l10nWebviewWatcher = esbuild.build({
      ...l10nWebviewConfig,
      watch: true,
    });

    // 监视结束时，输出日志并退出
    await Promise.all([extensionWatcher, l10nWebviewWatcher]).then(() => {
      console.log("Watcher closed.");
      process.exit(0);
    });
  } else {
    // 单次构建
    await build(extensionConfig);
    await build(l10nWebviewConfig);
  }
}

// 运行主函数
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
