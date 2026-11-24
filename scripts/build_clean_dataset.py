#!/usr/bin/env python3
"""
scripts/build_clean_dataset.py

Replaces all placeholder options with category-matched, equal-length distractors
across all questions in the Bible Trivia dataset, strips all parentheses and brackets,
and exports all 5 deliverables.
"""

import json
import os
import re
import random
import subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

# 1. Generic placeholder strings to eradicate completely
BAD_PLACEHOLDERS = {
    'a pillar of cloud and fire',
    'the covenant of the lord',
    'the law given by moses',
    'the kingdom of righteousness and peace in scripture',
    'the bread from heaven in the wilderness in scripture',
    'proclaiming the good news of salvation in scripture',
    'proclaiming the good news of salvation',
    'the kingdom of righteousness and peace',
    'city of sea of galilee',
    'city of garden of eden',
    'city of mount of olives',
    'the bread from heaven in the wilderness',
    'the mercy and grace of god',
    'walking humbly before the lord',
    'faith in the promises of god',
    'obedience to the divine commandment',
    'trusting in the word of god',
    'prayer and fasting before god',
    'following the call of the lord',
    'grace bestowed through faith',
    'offering sacrifices upon the altar',
    'repentance with sackcloth and ashes',
    'የደመናና የእሳት ዓምድ',
    'የደመና እና የእሳት ዓምድ',
    'የእግዚአብሔር ቃል ኪዳን',
    'የጌታ ቃል ኪዳን',
    'በሙሴ የተሰጠው ሕግ',
    'በሙሴ የተሰጠ ሕግ',
    'የእግዚአብሔር ምሕረትና ጸጋ',
    'የእግዚአብሔር ምሕረት እና ጸጋ'
}

def clean_parens(text):
    if not text:
        return ""
    t = str(text).strip()
    c = re.sub(r'\s*\([^)]*\)', '', t).strip()
    c = re.sub(r'\s*\[[^\]]*\]', '', c).strip()
    if not c:
        c = re.sub(r'[\(\)\[\]\{\}]', '', t).strip()
    c = re.sub(r'\s+', ' ', c).strip()
    return c

print("Loaded base helper.")
EOF
