## node_module patch
1. yarn add -D patch-package postinstall-postinstall
2. node_module 里修改要打补丁的文件
3. npx patch-package some-package
4. yarn

### handsontable patch
npx patch-package handsontable

### Chrome 调试
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security --remote-debugging-port=9222