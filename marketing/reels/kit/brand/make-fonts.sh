#!/bin/sh
# Regenerates kit/brand/fonts.css from the pamphlet's vendored fonts.css.
cd "$(dirname "$0")" || exit 1
{ sed -n '1,7p' fonts.css; sed -n '/@font-face/,$p' ../../../pamphlet/fonts.css | sed 's#url(./fonts/#url(../../../pamphlet/fonts/#'; } > fonts.css.new && mv fonts.css.new fonts.css
