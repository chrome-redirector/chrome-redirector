#!/bin/sh

INCLUDES='icons images libs _locales manifest.json pages scripts styles'
TMP_D=$(mktemp -d --tmpdir="$PWD")

for i in $INCLUDES; do
    cp -r "$(dirname $0)/../$i" "$TMP_D"
done

cd "$TMP_D"
# Compress JavaScript files
for i in `ls scripts/`; do
    uglifyjs --overwrite "scripts/$i"
done
# Compress CSS files
for i in `ls styles/`; do
    lessc -x "styles/$i" "styles/$i"
done

zip -rq ../upload-to-chrome_web_store-$(date +%s).zip *
rm -r "$TMP_D"
