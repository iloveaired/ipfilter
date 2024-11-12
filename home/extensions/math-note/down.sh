#!/bin/bash
# 이 스크립트를 저장하고 실행하여 KaTeX 폰트를 다운로드

# lib/fonts 디렉토리 생성
mkdir -p lib/fonts

# KaTeX 폰트 다운로드
FONTS=(
    "KaTeX_AMS-Regular.woff2"
    "KaTeX_Caligraphic-Bold.woff2"
    "KaTeX_Caligraphic-Regular.woff2"
    "KaTeX_Fraktur-Bold.woff2"
    "KaTeX_Fraktur-Regular.woff2"
    "KaTeX_Main-Bold.woff2"
    "KaTeX_Main-BoldItalic.woff2"
    "KaTeX_Main-Italic.woff2"
    "KaTeX_Main-Regular.woff2"
    "KaTeX_Math-BoldItalic.woff2"
    "KaTeX_Math-Italic.woff2"
    "KaTeX_SansSerif-Bold.woff2"
    "KaTeX_SansSerif-Italic.woff2"
    "KaTeX_SansSerif-Regular.woff2"
    "KaTeX_Script-Regular.woff2"
    "KaTeX_Size1-Regular.woff2"
    "KaTeX_Size2-Regular.woff2"
    "KaTeX_Size3-Regular.woff2"
    "KaTeX_Size4-Regular.woff2"
    "KaTeX_Typewriter-Regular.woff2"
)

for font in "${FONTS[@]}"; do
    wget "https://cdn.jsdelivr.net/npm/katex@0.16.7/dist/fonts/$font" -O "lib/fonts/$font"
done