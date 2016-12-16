#!/bin/bash

# Extract version from package.json
# (https://git.io/v1HNc)
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "Building for WikiBrowser '$PACKAGE_VERSION'"

electron-packager . WikiBrowser --platform=all --out=builds/ --overwrite --icon=assets/img/app-icon.icns

echo "Zipping all releases."

cd builds

zip -r WikiBrowser-MacOS-$PACKAGE_VERSION.zip WikiBrowser-darwin-x64
zip -r WikiBrowser-Windows-x64-$PACKAGE_VERSION.zip WikiBrowser-win32-x64
zip -r WikiBrowser-Linux-x64-$PACKAGE_VERSION.zip WikiBrowser-linux-x64

cd ..

echo "Done!"
