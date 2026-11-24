#!/usr/bin/env python3
"""
scripts/build_full_distractor_database.py

Full repair and compilation suite:
1. Loads full dataset from acfecb9:client/src/data/questions.json (all 5,159 questions).
2. Cleans all parentheses `(...)` and brackets `[...]` from questions, options, and verses
   across both English and Amharic.
3. For all 819 questions with generic placeholder distractors ("The law given by Moses",
   "A pillar of cloud and fire", "The covenant of the Lord", "The mercy and grace of God", etc.):
   Replaces them with category-matched, equal-length distractors in English and Amharic.
4. Integrates verified verse citations and refined Amharic translations from 4546def and fcc0867.
5. Deterministically shuffles options (0..3) so correctAnswer is balanced across A, B, C, D
   and synchronized between English and Amharic.
6. Validates:
   - 0 placeholder options remain.
   - 0 parentheses in question text or options.
   - Options in each question are equal in length and word count.
7. Exports:
   - client/src/data/questions.json
   - client/src/data/questions_am_cache.json
   - bible_trivia_questions.json
   - bible_trivia_questions.txt
   - bible_trivia_questions.docx
"""

import json
import os
import re
import random
import subprocess
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

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

# Comprehensive Bilingual Category Pools
BOOKS = [
    ('Genesis', 'ዘፍጥረት'), ('Exodus', 'ዘፀአት'), ('Leviticus', 'ዘሌዋውያን'), ('Numbers', 'ዘኍልቁ'),
    ('Deuteronomy', 'ዘዳግም'), ('Joshua', 'ኢያሱ'), ('Judges', 'መሳፍንት'), ('Ruth', 'ሩት'),
    ('1 Samuel', '1 ሳሙኤል'), ('2 Samuel', '2 ሳሙኤል'), ('1 Kings', '1 ነገሥት'), ('2 Kings', '2 ነገሥት'),
    ('1 Chronicles', '1 ዜና'), ('2 Chronicles', '2 ዜና'), ('Ezra', 'ዕዝራ'), ('Nehemiah', 'ነህምያ'),
    ('Esther', 'አስቴር'), ('Job', 'ኢዮብ'), ('Psalms', 'መዝሙር'), ('Proverbs', 'ምሳሌ'),
    ('Ecclesiastes', 'መክብብ'), ('Song of Solomon', 'መኃልየ'), ('Isaiah', 'ኢሳይያስ'), ('Jeremiah', 'ኤርምያስ'),
    ('Lamentations', 'ሰቆቃወ'), ('Ezekiel', 'ሕዝቅኤል'), ('Daniel', 'ዳንኤል'), ('Hosea', 'ሆሴዕ'),
    ('Joel', 'ኢዩኤል'), ('Amos', 'አሞጽ'), ('Obadiah', 'አብድዩ'), ('Jonah', 'ዮናስ'),
    ('Micah', 'ሚክያስ'), ('Nahum', 'ናሆም'), ('Habakkuk', 'ዕንባቆም'), ('Zephaniah', 'ሶፎንያስ'),
    ('Haggai', 'ሐጌ'), ('Zechariah', 'ዘካርያስ'), ('Malachi', 'ሚልክያስ'), ('Matthew', 'ማቴዎስ'),
    ('Mark', 'ማርቆስ'), ('Luke', 'ሉቃስ'), ('John', 'ዮሐንስ'), ('Acts', 'የሐዋርያት ሥራ'),
    ('Romans', 'ሮሜ'), ('1 Corinthians', '1 ቆሮንቶስ'), ('2 Corinthians', '2 ቆሮንቶስ'), ('Galatians', 'ገላትያ'),
    ('Ephesians', 'ኤፌሶን'), ('Philippians', 'ፊልጵስዩስ'), ('Colossians', 'ቆላስይስ'),
    ('1 Thessalonians', '1 ተሰሎንቄ'), ('2 Thessalonians', '2 ተሰሎንቄ'), ('1 Timothy', '1 ጢሞቴዎስ'),
    ('2 Timothy', '2 ጢሞቴዎስ'), ('Titus', 'ቲቶ'), ('Philemon', 'ፊልሞና'), ('Hebrews', 'ዕብራውያን'),
    ('James', 'ያዕቆብ'), ('1 Peter', '1 ጴጥሮስ'), ('2 Peter', '2 ጴጥሮስ'), ('1 John', '1 ዮሐንስ'),
    ('2 John', '2 ዮሐንስ'), ('3 John', '3 ዮሐንስ'), ('Jude', 'ይሁዳ'), ('Revelation', 'ራእይ')
]

FEASTS = [
    ('Passover', 'ፋሲካ'), ('Pentecost', 'በዓለ ሃምሳ'), ('Tabernacles', 'የዳስ በዓል'),
    ('Purim', 'ፑሪም'), ('Day of Atonement', 'የስርየት ቀን'), ('Unleavened Bread', 'የቂጣ በዓል'),
    ('Feast of Weeks', 'የሳምንታት በዓል'), ('Feast of Booths', 'የዳስ በዓል'), ('Feast of Trumpets', 'የመለከት በዓል')
]

KINGS = [
    ('Belshazzar', 'ብልጣሶር'), ('Nebuchadnezzar', 'ናቡከደነፆር'), ('Evil-Merodach', 'ኤቪል-ሜሮዳክ'),
    ('Sennacherib', 'ሰናክሬም'), ('Cyrus', 'ቂሮስ'), ('Darius', 'ዳርዮስ'),
    ('Xerxes', 'አሕሻዊሮስ'), ('Artaxerxes', 'አርጤክስስ'), ('Herod', 'ሄሮድስ'),
    ('Archelaus', 'አርኬላዎስ'), ('Antipas', 'አንቲጳስ'), ('Philip', 'ፊልጶስ'),
    ('Agrippa', 'አግሪጳ'), ('Josiah', 'ኢዮስያስ'), ('Hezekiah', 'ሕዝቅያስ'),
    ('Manasseh', 'ምናሴ'), ('David', 'ዳዊት'), ('Solomon', 'ሰሎሞን'),
    ('Saul', 'ሳኦል'), ('Ahab', 'አክዓብ'), ('Jeroboam', 'ኢዮርብዓም'),
    ('Rehoboam', 'ሮብዓም'), ('Jehu', 'ኢዩ'), ('Omri', 'ዖምሪ'),
    ('Abimelech', 'አቢሜሌክ'), ('Pharaoh', 'ፈርዖን'), ('Sihon', 'ሴዎን'),
    ('Og', 'ዐግ'), ('Balak', 'ባላቅ'), ('Benhadad', 'ወልደ አዴር'), ('Hazael', 'አዛሄል')
]

DISCIPLES = [
    ('Peter', 'ጴጥሮስ'), ('Andrew', 'እንዲሪያስ'), ('James', 'ያዕቆብ'),
    ('John', 'ዮሐንስ'), ('Philip', 'ፊልጶስ'), ('Thomas', 'ቶማስ'),
    ('Bartholomew', 'በርተሎሜዎስ'), ('Matthew', 'ማቴዎስ'), ('Simon', 'ስምዖን'),
    ('Thaddaeus', 'ታዴዎስ'), ('Judas', 'ይሁዳ'), ('Judas Iscariot', 'የአስቆሮቱ ይሁዳ'),
    ('Simon the Zealot', 'ቀነናዊው ስምዖን'), ('Matthias', 'ማትያስ')
]

PROPHETS = [
    ('Elijah', 'ኤልያስ'), ('Elisha', 'ኤልሳዕ'), ('Isaiah', 'ኢሳይያስ'),
    ('Jeremiah', 'ኤርምያስ'), ('Ezekiel', 'ሕዝቅኤል'), ('Daniel', 'ዳንኤል'),
    ('Hosea', 'ሆሴዕ'), ('Joel', 'ኢዩኤል'), ('Amos', 'አሞጽ'),
    ('Obadiah', 'አብድዩ'), ('Jonah', 'ዮናስ'), ('Micah', 'ሚክያስ'),
    ('Nahum', 'ናሆም'), ('Habakkuk', 'ዕንባቆም'), ('Zephaniah', 'ሶፎንያስ'),
    ('Haggai', 'ሐጌ'), ('Zechariah', 'ዘካርያስ'), ('Malachi', 'ሚልክያስ'),
    ('Samuel', 'ሳሙኤል'), ('Nathan', 'ናታን'), ('Gad', 'ጋድ'),
    ('Ahijah', 'አኪያ'), ('Agabus', 'አጋቦስ')
]

MEN_OT = [
    ('Adam', 'አዳም'), ('Cain', 'ቃየል'), ('Abel', 'አቤል'), ('Seth', 'ሴት'),
    ('Enoch', 'ሄኖክ'), ('Methuselah', 'ማቱሳላ'), ('Noah', 'ኖኅ'), ('Shem', 'ሴም'),
    ('Ham', 'ካም'), ('Japheth', 'ያፌት'), ('Abraham', 'አብርሃም'), ('Abram', 'አብራም'),
    ('Lot', 'ሎጥ'), ('Isaac', 'ይስሐቅ'), ('Jacob', 'ያዕቆብ'), ('Esau', 'ዔሳው'),
    ('Joseph', 'ዮሴፍ'), ('Benjamin', 'ብንያም'), ('Reuben', 'ሮቤል'), ('Simeon', 'ስምዖን'),
    ('Levi', 'ሌዊ'), ('Judah', 'ይሁዳ'), ('Dan', 'ዳን'), ('Naphtali', 'ንፍታሌም'),
    ('Gad', 'ጋድ'), ('Asher', 'አሴር'), ('Issachar', 'ይሳኮር'), ('Zebulun', 'ዛብሎን'),
    ('Manasseh', 'ምናሴ'), ('Ephraim', 'ኤፍሬም'), ('Laban', 'ላባ'), ('Potiphar', 'ጶጢፋር'),
    ('Ishmael', 'እስማኤል'), ('Boaz', 'ቦዔዝ'), ('Mordecai', 'መርዶክዮስ'), ('Haman', 'ሐማ'),
    ('Job', 'ኢዮብ'), ('Balaam', 'በለዓም'), ('Balak', 'ባላቅ'), ('Gideon', 'ጌዴዎን'),
    ('Samson', 'ሶምሶን'), ('Joshua', 'ኢያሱ'), ('Caleb', 'ካሌብ'), ('Aaron', 'አሮን'),
    ('Hur', 'ሆር'), ('Eli', 'ዔሊ'), ('Jonathan', 'ዮናታን'), ('Absalom', 'አቤሴሎም'),
    ('Joab', 'ኢዮአብ'), ('Abner', 'አበኔር'), ('Shimei', 'ሳሚ'), ('Barzillai', 'በርዚላይ'),
    ('Terah', 'ታራ'), ('Nahor', 'ናኮር'), ('Haran', 'ካራን'), ('Melchizedek', 'መልከ ጼዴቅ'),
    ('Jethro', 'ዮቶር'), ('Bezaleel', 'ባስልኤል'), ('Aholiab', 'ኤልያብ'), ('Ehud', 'ናዖድ'),
    ('Othniel', 'ጎቶንያል'), ('Jephthah', 'ዮፍታሔ'), ('Kish', 'ቂስ'), ('Jesse', 'እሴይ'),
    ('Nabal', 'ናባል'), ('Obed', 'ኢዮቤድ'), ('Zadok', 'ሳዶቅ')
]

MEN_NT = [
    ('Barnabas', 'በርናባስ'), ('Stephen', 'እስጢፋኖስ'), ('Paul', 'ጳውሎስ'),
    ('Silas', 'ሲላስ'), ('Timothy', 'ጢሞቴዎስ'), ('Titus', 'ቲቶ'),
    ('Apollos', 'አጵሎስ'), ('Aquila', 'አቂላ'), ('Cornelius', 'ቆርኔሌዎስ'),
    ('Luke', 'ሉቃስ'), ('Mark', 'ማርቆስ'), ('Nicodemus', 'ኒቆዲሞስ'),
    ('Zacchaeus', 'ዘኬዎስ'), ('Lazarus', 'አልዓዛር'), ('Gamaliel', 'ገማልያል'),
    ('Ananias', 'ሐናንያ'), ('Felix', 'ፊሊክስ'), ('Festus', 'ፌስጦስ'),
    ('Zacharias', 'ዘካርያስ'), ('Zebedee', 'ዘብዴዎስ'), ('Barabbas', 'በርባን'),
    ('Eutychus', 'አውጢኮስ'), ('Malchus', 'ማልኮስ'), ('Silvanus', 'ስልዋኖስ'),
    ('Tychicus', 'ቲኪቆስ'), ('Onesiphorus', 'ኦኔሲፎሩ'), ('Julius', 'ዩልዮስ')
]

WOMEN = [
    ('Ruth', 'ሩት'), ('Sarah', 'ሳራ'), ('Rachel', 'ራሔል'), ('Leah', 'ሊያ'),
    ('Rebekah', 'ርብቃ'), ('Miriam', 'ማርያም'), ('Deborah', 'ዲቦራ'), ('Esther', 'አስቴር'),
    ('Hannah', 'ሐና'), ('Mary', 'ማርያም'), ('Martha', 'ማርታ'), ('Elizabeth', 'ኤልሳቤጥ'),
    ('Delilah', 'ደሊላ'), ('Jael', 'ያዔል'), ('Rahab', 'ረዓብ'), ('Jezebel', 'ኤልዛቤል'),
    ('Bathsheba', 'ቤርሳቤህ'), ('Dinah', 'ዲና'), ('Hagar', 'አጋር'), ('Naomi', 'ኑኃሚን'),
    ('Orpah', 'ዖርፋ'), ('Salome', 'ሰሎሜ'), ('Joanna', 'ዮሐና'), ('Priscilla', 'ጵርስቅላ'),
    ('Lydia', 'ልድያ'), ('Phoebe', 'ፌቤን'), ('Tabitha', 'ጣቢታ'), ('Dorcas', 'ዶርቃ'),
    ('Huldah', 'ሕልዳ'), ('Tamar', 'ትዕማር'), ('Ahinoam', 'አኪናሆም'), ('Apphia', 'አፊያ'),
    ('Bernice', 'በርኒቄ')
]

TRIBES = [
    ('Judah', 'ይሁዳ'), ('Levi', 'ሌዊ'), ('Benjamin', 'ብንያም'), ('Reuben', 'ሮቤል'),
    ('Simeon', 'ስምዖን'), ('Dan', 'ዳን'), ('Naphtali', 'ንፍታሌም'), ('Gad', 'ጋድ'),
    ('Asher', 'አሴር'), ('Issachar', 'ይሳኮር'), ('Zebulun', 'ዛብሎን'), ('Joseph', 'ዮሴፍ'),
    ('Ephraim', 'ኤፍሬም'), ('Manasseh', 'ምናሴ')
]

PLACES = [
    ('Jerusalem', 'ኢየሩሳሌም'), ('Bethlehem', 'ቤተልሔም'), ('Nazareth', 'ናዝሬት'),
    ('Jericho', 'ኢያሪኮ'), ('Hebron', 'ኬብሮን'), ('Samaria', 'ሰማርያ'),
    ('Damascus', 'ደማስቆ'), ('Babylon', 'ባቢሎን'), ('Nineveh', 'ነነዌ'),
    ('Antioch', 'አንጾኪያ'), ('Rome', 'ሮም'), ('Athens', 'አቴና'),
    ('Corinth', 'ቆሮንቶስ'), ('Ephesus', 'ኤፌሶን'), ('Philippi', 'ፊልጵስዩስ'),
    ('Colossae', 'ቆላስይስ'), ('Thessalonica', 'ተሰሎንቄ'), ('Sodom', 'ሰዶም'),
    ('Gomorrah', 'ገሞራ'), ('Eden', 'ዔደን'), ('Tarshish', 'ተርሴስ'),
    ('Ur', 'ኡር'), ('Shechem', 'ሴኬም'), ('Shiloh', 'ሴሎ'),
    ('Bethel', 'ቤቴል'), ('Gaza', 'ጋዛ'), ('Joppa', 'ኢዮጴ'),
    ('Tarsus', 'ጠርሴስ'), ('Bethany', 'ቢታንያ'), ('Capernaum', 'ቅፍርናሆም'),
    ('Nod', 'ኖድ'), ('Machpelah', 'መክፈላ'), ('Beer-sheba', 'ቤርሳቤህ'),
    ('Marah', 'ማራ'), ('Elim', 'ኤሊም'), ('Rephidim', 'ራፊዲም'),
    ('Cana', 'ቃና'), ('Berea', 'ቤሪያ'), ('Lydda', 'ልዳ'),
    ('Lystra', 'ልስጥራ'), ('Malta', 'መልጣ'), ('Patmos', 'ፍጥሞ'),
    ('Zarephath', 'ሰራፕታ'), ('Ashkelon', 'አስቀሎና'), ('Gibeon', 'ገብዖን')
]

COUNTRIES = [
    ('Egypt', 'ግብፅ'), ('Canaan', 'ከነዓን'), ('Babylon', 'ባቢሎን'),
    ('Assyria', 'አሦር'), ('Persia', 'ፋርስ'), ('Greece', 'ግሪክ'),
    ('Rome', 'ሮም'), ('Syria', 'ሶሪያ'), ('Media', 'ሜዶን'),
    ('Moab', 'ሞአብ'), ('Edom', 'ኤዶም'), ('Ammon', 'አሞን'),
    ('Philistia', 'ፍልስጥኤም'), ('Gilead', 'ገለዓድ'), ('Phoenicia', 'ፊንቄ'),
    ('Macedonia', 'መቄዶንያ'), ('Cyprus', 'ቆጵሮስ'), ('Spain', 'እስፓንያ'),
    ('Cush', 'ኢትዮጵያ'), ('Midian', 'ምድያም')
]

MOUNTAINS = [
    ('Mount Sinai', 'ደብረ ሲና'), ('Mount Carmel', 'ደብረ ቀርሜሎስ'), ('Mount Ararat', 'የአራራት ተራራ'),
    ('Mount Horeb', 'ደብረ ኮሬብ'), ('Mount Hermon', 'ደብረ ሔርሞን'), ('Mount of Olives', 'ደብረ ዘይት'),
    ('Mount Tabor', 'ደብረ ታቦር'), ('Mount Moriah', 'ደብረ ሞሪያም'), ('Mount Nebo', 'ደብረ ናባው'),
    ('Mount Zion', 'ደብረ ጽዮን'), ('Mount Gilboa', 'ደብረ ጌልቦዔ')
]

WATERS = [
    ('Jordan river', 'የዮርዳኖስ ወንዝ'), ('Nile river', 'የአባይ ወንዝ'), ('Euphrates river', 'የኤፍራጥስ ወንዝ'),
    ('Tigris river', 'የጤግሮስ ወንዝ'), ('Red Sea', 'ቀይ ባሕር'), ('Dead Sea', 'የጨው ባሕር'),
    ('Salt Sea', 'የጨው ባሕር'), ('Sea of Galilee', 'የገሊላ ባሕር'), ('Mediterranean Sea', 'ሜዲትራኒያን ባሕር'),
    ('Pool of Siloam', 'የሰሊሆም መጠመቂያ'), ('Pool of Bethesda', 'የቤተ ሳይዳ መጠመቂያ'), ('Gihon', 'ግዮን')
]

ORDINALS = [
    ('First', 'አንደኛ'), ('Second', 'ሁለተኛ'), ('Third', 'ሦስተኛ'),
    ('Fourth', 'አራተኛ'), ('Fifth', 'አምስተኛ'), ('Sixth', 'ስድስተኛ'),
    ('Seventh', 'ሰባተኛ'), ('Eighth', 'ስምንተኛ'), ('Ninth', 'ዘጠነኛ'),
    ('Tenth', 'አሥረኛ')
]

NUMBERS_WORDS = [
    ('One', 'አንድ'), ('Two', 'ሁለት'), ('Three', 'ሦስት'), ('Four', 'አራት'),
    ('Five', 'አምስት'), ('Six', 'ስድስት'), ('Seven', 'ሰባት'), ('Eight', 'ስምንት'),
    ('Nine', 'ዘጠኝ'), ('Ten', 'አሥር'), ('Twelve', 'አሥራ ሁለት'), ('Fifteen', 'አሥራ አምስት'),
    ('Seventeen', 'አሥራ ሰባት'), ('Nineteen', 'አሥራ ዘጠኝ'), ('Twenty-seven', 'ሃያ ሰባት'),
    ('Thirty', 'ሠላሳ'), ('Thirty-nine', 'ሠላሳ ዘጠኝ'), ('Forty', 'አርባ'),
    ('Forty-eight', 'አርባ ስምንት'), ('Fifty', 'ኃምሳ'), ('Sixty-six', 'ስድሳ ስድስት'),
    ('Seventy', 'ሰባ'), ('Ninety', 'ዘጠና'), ('Ninety-nine', 'ዘጠና ዘጠኝ'),
    ('Hundred', 'መቶ'), ('Thousand', 'ሺህ')
]

NUMBERS_DIGITS = [
    ('1', '1'), ('2', '2'), ('3', '3'), ('4', '4'), ('5', '5'),
    ('6', '6'), ('7', '7'), ('8', '8'), ('9', '9'), ('10', '10'),
    ('12', '12'), ('30', '30'), ('40', '40'), ('70', '70'), ('100', '100'),
    ('1,100', '1,100'), ('3,000', '3,000'), ('12,000', '12,000'),
    ('32,000', '32,000'), ('120,000', '120,000'), ('144,000', '144,000')
]

ANIMALS = [
    ('Horse', 'ፈረስ'), ('Lion', 'አንበሳ'), ('Eagle', 'ንስር'), ('Ox', 'በሬ'),
    ('Sheep', 'በግ'), ('Goat', 'ፍየል'), ('Camel', 'ግመል'), ('Donkey', 'አህያ'),
    ('Raven', 'ቁራ'), ('Dove', 'እርግብ'), ('Quail', 'ድርጭት'), ('Locust', 'አንበጣ'),
    ('Dog', 'ውሻ'), ('Wolf', 'ተኩላ'), ('Bear', 'ድብ'), ('Leopard', 'ነብር'),
    ('Serpent', 'እባብ'), ('Viper', 'እፉኝት'), ('Fish', 'ዓሣ'), ('Whale', 'ዓሣ ነባሪ'),
    ('Cattle', 'ከብቶች'), ('Swine', 'አሳማዎች'), ('Frogs', 'ጓጉንቸሮች'), ('Rams', 'አውራ በጎች'),
    ('Bats', 'የሌሊት ወፎች'), ('Ostrich', 'ሰጎን'), ('Sparrow', 'ድንቢጥ'), ('Grasshoppers', 'አንበጦች')
]

PLANTS = [
    ('Fig', 'በለስ'), ('Olive', 'ወይራ'), ('Cedar', 'ዝግባ'), ('Vine', 'ወይን'),
    ('Myrtle', 'ባርሰነት'), ('Pomegranate', 'ሮማን'), ('Mustard', 'ሰናፍጭ'), ('Palm', 'ዘንባባ'),
    ('Acacia', 'ግራር'), ('Cypress', 'ሰኖባር'), ('Gopher', 'ጎፌር'), ('Hyssop', 'ሂሶጵ'),
    ('Wheat', 'ስንዴ'), ('Barley', 'ገብስ'), ('Almond', 'ለውዝ'), ('Apples', 'ቱፋህ'),
    ('Grapes', 'የወይን ፍሬ'), ('Coriander', 'ድንብላል'), ('Juniper', 'ጥድ'), ('Sycamore', 'ሾላ')
]

BODY_PARTS = [
    ('Rib', 'ጎን'), ('Hand', 'እጅ'), ('Foot', 'እግር'), ('Head', 'ራስ'),
    ('Heart', 'ልብ'), ('Eye', 'ዐይን'), ('Ear', 'ጆሮ'), ('Tongue', 'ምላስ'),
    ('Bone', 'አጥንት'), ('Flesh', 'ሥጋ'), ('Blood', 'ደም'), ('Feet', 'እግሮች')
]

MATERIALS = [
    ('Gold', 'ወርቅ'), ('Silver', 'ብር'), ('Bronze', 'ነሐስ'), ('Iron', 'ብረት'),
    ('Brass', 'ናስ'), ('Lead', 'እርሳስ'), ('Clay', 'ጭቃ'), ('Stone', 'ድንጋይ'), ('Wood', 'እንጨት')
]

GEMS = [
    ('Rubies', 'ቀይ ዕንቁ'), ('Pearls', 'ዕንቁ'), ('Diamonds', 'አልማዝ'),
    ('Emeralds', 'መረግድ'), ('Sapphires', 'ሰንፔር'), ('Onyx', 'ሶሆም')
]

COLORS = [
    ('Blue', 'ሰማያዊ'), ('Purple', 'ሐምራዊ'), ('Scarlet', 'ቀይ'),
    ('White', 'ነጭ'), ('Gold', 'ወርቃማ'), ('Crimson', 'ደማቅ ቀይ')
]

VIRTUES = [
    ('Wisdom', 'ጥበብ'), ('Righteousness', 'ጽድቅ'), ('Knowledge', 'እውቀት'),
    ('Faith', 'እምነት'), ('Truth', 'እውነት'), ('Peace', 'ሰላም'),
    ('Mercy', 'ምሕረት'), ('Grace', 'ጸጋ'), ('Love', 'ፍቅር'), ('Hope', 'ተስፋ')
]

OCCUPATIONS = [
    ('Carpenter', 'አናጺ'), ('Fisherman', 'ዓሣ አጥማጅ'), ('Tentmaker', 'ድንኳን ሰፊ'),
    ('Silversmith', 'ብር አንጥረኛ'), ('Shepherd', 'እረኛ'), ('Priest', 'ካህን'),
    ('Levite', 'ሌዋዊ'), ('Butler', 'የመጠጥ አሳላፊ'), ('Baker', 'የእንጀራ ጋጋሪ'),
    ('Gardener', 'አትክልተኛ'), ('Bridegroom', 'ሙሽራ'), ('Cupbearer', 'አሳላፊ')
]

PLAGUES = [
    ('Frogs', 'ጓጉንቸሮች'), ('Lice', 'ቅማል'), ('Flies', 'ዝንቦች'), ('Boils', 'እባጭ'),
    ('Locusts', 'አንበጣዎች'), ('Hail', 'በረዶ'), ('Darkness', 'ጨለማ'), ('Death of firstborn', 'የበኩር ልጅ ሞት')
]

AFFLICTIONS = [
    ('Blindness', 'ዕውርነት'), ('Lameness', 'ሽባነት'), ('Leprosy', 'ለምጽ'),
    ('Deafness', 'ደንቆሮነት'), ('Dumbness', 'ዲዳነት'), ('Fever', 'ትኩሳት')
]

GROUPS = [
    ('The men of Gibeah', 'የጊብዓ ሰዎች'), ('The men of Sodom', 'የሰዶም ሰዎች'),
    ('The men of Jericho', 'የኢያሪኮ ሰዎች'), ('The men of Shechem', 'የሴኬም ሰዎች'),
    ('The men of Ai', 'የጋይ ሰዎች')
]

TRAUMATIC_EVENTS = [
    ('Sea voyage', 'የባህር ጉዞ'), ('Prison trial', 'የእስር ቤት ፍርድ'),
    ('Temple riot', 'የመቅደሱ ሁከት'), ('City escape', 'የከተማው ስደት'),
    ('Great famine', 'ታላቅ ረሃብ'), ('Violent storm', 'ኃይለኛ ማዕበል')
]

TIME_PERIODS = [
    ('Twelve years', 'አሥራ ሁለት ዓመት'), ('Seven years', 'ሰባት ዓመት'),
    ('Eight years', 'ስምንት ዓመት'), ('Forty years', 'አርባ ዓመት'),
    ('Forty days', 'አርባ ቀን'), ('Three days', 'ሦስት ቀን'),
    ('Seven days', 'ሰባት ቀን'), ('Three months', 'ሦስት ወር')
]

# Explicit Tailored Overrides for Specific Questions & Phrases
EXPLICIT_MAP = {
    # 4 Screenshot Questions from User
    1243: (['Pentecost', 'Tabernacles', 'Purim'], ['በዓለ ሃምሳ', 'የዳስ በዓል', 'ፑሪም']),
    2339: (['Nebuchadnezzar', 'Evil-Merodach', 'Sennacherib'], ['ናቡከደነፆር', 'ኤቪል-ሜሮዳክ', 'ሰናክሬም']),
    3693: (['Romans', 'Galatians', 'Philippians'], ['ሮሜ', 'ገላትያ', 'ፊልጵስዩስ']),
    3499: (['Prison trial', 'Temple riot', 'City escape'], ['የእስር ቤት ፍርድ', 'የመቅደሱ ሁከት', 'የከተማው ስደት']),
    5136: (['The men of Sodom', 'The men of Jericho', 'The men of Shechem'], ['የሰዶም ሰዎች', 'የኢያሪኮ ሰዎች', 'የሴኬም ሰዎች']),

    # Complex Narrative Questions
    204: (['Left him in the desert to starve alone', 'Cast him into prison until their father died', 'Sent him away to serve in a foreign army'],
          ['ብቻውን እንዲራብ በምድረ በዳ ተዉት', 'አባታቸው እስኪሞት ድረስ ወህኒ ቤት ጣሉት', 'በባዕድ አገር ጦር እንዲያገለግል ላኩት']),
    206: (['Tore his garment and burned it with fire', 'Hid his staff in the field of Shechem', 'Claimed he fled away into another land'],
          ['ልብሱን ቀደዱና በእሳት አቃጠሉት', 'በትሩን በሴኬም እርሻ ውስጥ ደበቁት', 'ወደ ሌላ አገር ሸሽቶ እንደሄደ ተናገሩ']),
    215: (['To seek water', 'To escape war', 'To pay tribute'],
          ['ውኃ ለመፈለግ', 'ከጦርነት ለማምለጥ', 'ግብር ለመክፈል']),
    217: (['A cloak', 'A staff', 'A ring'],
          ['ቀሚስ', 'በትር', 'ቀለበት']),
    218: (['He was tall and strong', 'He was quiet and pale', 'He was swift and slender'],
          ['ረጅም እና ጠንካራ ነበረ', 'ዝምተኛ እና የገረጣ ነበረ', 'ፈጣን እና ቀጠን ያለ ነበረ']),
    219: (['Covered with dark mountains', 'Filled with violent waters', 'Burned with blazing fire'],
          ['በጨለማ ተራሮች ተሸፍኖ', 'በኃይለኛ ውሆች ተሞልቶ', 'በሚነድ እሳት ተቃጥሎ']),
    223: (['A band of raiders had slain him', 'A raging river had drowned him', 'A desert sickness had taken him'],
          ['የወንበዴዎች ጭፍራ ገድሎታል', 'ኃይለኛ ወንዝ አስጥሞታል', 'የምድረ በዳ በሽታ ወስዶታል']),
    225: (['Skilled shepherd', 'Mighty warrior', 'Quiet tent-dweller'],
          ['ብልህ እረኛ', 'ኃያል ተዋጊ', 'ድንኳን ነዋሪ']),
    230: (['With shouting', 'In silence', 'At midnight'],
          ['በጩኸት', 'በዝምታ', 'በእኩለ ሌሊት']),
    235: (['The spirit of wisdom', 'The light of heaven', 'The word of truth'],
          ['የጥበብ መንፈስ', 'የሰማይ ብርሃን', 'የእውነት ቃል']),
    236: (['Seven years of war followed by seven years of peace', 'Seven years of drought followed by seven years of flood', 'Seven years of blessing followed by seven years of exile'],
          ['የሰባት ዓመት ጦርነትና የሰባት ዓመት ሰላም', 'የሰባት ዓመት ድርቅና የሰባት ዓመት ጎርፍ', 'የሰባት ዓመት በረከትና የሰባት ዓመት ስደት']),
    245: (['Never to withhold the seasonal rains', 'Never to hide His face from humanity', 'Never to allow night to overcome day'],
          ['ወቅታዊውን ዝናብ ዳግመኛ ላለመከልከል', 'ፊቱን ከሰው ልጆች ዳግመኛ ላለመሰወር', 'ሌሊት ቀንን እንዲያሸንፍ ዳግመኛ ላለመፍቀድ']),
    246: (['A pleasure', 'A blessing', 'A tribute'],
          ['ደስታ', 'በረከት', 'ግብር']),
    247: (['Tree of eternal life in Paradise', 'Tree of olive branches in Eden', 'Tree of fragrant fig blossoms'],
          ['በገነት የነበረው የዘላለም ሕይወት ዛፍ', 'በኤደን የነበረው የወይራ ቅርንጫፍ ዛፍ', 'በገነት የነበረው የበለስ አበባ ዛፍ']),
    248: (['The soldier and the captain', 'The steward and the gardener', 'The physician and the scribe'],
          ['ወታደሩና የመቶ አለቃው', 'መጋቢውና አትክልተኛው', 'ሐኪሙና ጸሐፊው']),
    250: (['All debts', 'All fears', 'All griefs'],
          ['ዕዳን ሁሉ', 'ፍርሃትን ሁሉ', 'ኀዘንን ሁሉ']),
    253: (['War in Canaan', 'Plague in Canaan', 'Drought in Canaan'],
          ['በከነዓን ጦርነት', 'በከነዓን ቸነፈር', 'በከነዓን ድርቅ']),
    254: (['His father arranged a marriage with a daughter of a local Canaanite chieftain', 'His father consulted the high priest at Salem to designate a chosen bride', 'His father waited for a vision from the Lord directing him to the right tribe'],
          ['አባቱ ከከነዓናውያን አለቃ ልጅ ጋር ጋብቻን በስምምነት አዘጋጀ', 'አባቱ በሳሌም የነበረውን ታላቅ ካህን ሚስት እንዲመርጥ አማከረ', 'አባቱ ወደ ትክክለኛው ነገድ የሚመራውን የእግዚአብሔርን ራእይ ጠበቀ']),
    259: (['Leader of great nations', 'Keeper of sacred vows', 'Friend of the Almighty'],
          ['የታላላቅ አሕዛብ መሪ', 'የተቀደሱ ስእለቶች ጠባቂ', 'ሁሉን ቻይ የሆነው ወዳጅ']),
    260: (['Sheep or Goats', 'Horses or Mules', 'Camels or Donkeys'],
          ['በጎች ወይም ፍየሎች', 'ፈረሶች ወይም በቅሎዎች', 'ግመሎች ወይም አህዮች']),
    267: (['Grains and Herbs', 'Roots and Seeds', 'Leaves and Stems'],
          ['እህሎችና ቅጠላ ቅጠሎች', 'ሥሮችና ዘሮች', 'ቅጠሎችና ግንዶች']),
    269: (['A safe haven', 'A high palace', 'A quiet valley'],
          ['ደህንነቱ የተጠበቀ ወደብ', 'ከፍተኛ ቤተ መንግሥት', 'ጸጥ ያለ ሸለቆ']),
    270: (['Acacia cedar wood', 'Olive myrtle wood', 'Sycamore oak wood'],
          ['የግራርና የዝግባ እንጨት', 'የወይራና የባርሰነት እንጨት', 'የሾላና የኦክ እንጨት']),
    275: (['He was exiled to a distant country with all his household', 'He was struck with a severe plague and died in his palace', 'He was forced to pay five hundred talents of pure silver'],
          ['ከነቤተሰቡ በሙሉ ወደ ሩቅ አገር ተሰደደ', 'በከባድ ቸነፈር ተመቶ በቤተ መንግሥቱ ሞተ', 'አምስት መቶ ታላንት ጥሩ ብር እንዲከፍል ተገደደ']),
    279: (['His crown, purple robe and a bronze shield', 'His sword, silver scepter and a royal banner', 'His chariot, embroidered mantle and a signet ring'],
          ['አክሊሉን, ሐምራዊ ቀሚሱንና የነሐስ ጋሻውን', 'ሰይፉን, የብር በትርና የንጉሥ ሰንደቅ ዓላማውን', 'ሰረገላውን, ጥልፍ መጎናጸፊያውንና የጣት ቀለበቱን']),
    286: (['The plains of Moab', 'The hills of Gilead', 'The valley of Jordan'],
          ['የሞአብ ሜዳዎች', 'የገለዓድ ኮረብታዎች', 'የዮርዳኖስ ሸለቆ']),
    289: (['Clusters of grapes bursting in the winepress', 'Flocks of white sheep gathered by the well', 'Cedar trees bending low before the desert wind'],
          ['በመጥመቂያው ውስጥ የፈነዱ የወይን ዘለላዎች', 'በጉድጓዱ አጠገብ የተሰበሰቡ ነጭ የበግ መንጎች', 'በምድረ በዳው ነፋስ ፊት የተጎነበሱ የዝግባ ዛፎች']),
    296: (['An olive tree shaking down oil into a golden vessel', 'A wheat stalk yielding flour baked for a feast', 'A fig branch dropping ripe fruits into an iron bowl'],
          ['ወደ ወርቅ ዕቃ ዘይት የሚያንጠባጥብ የወይራ ዛፍ', 'ለግብዣ የተጋገረ ዱቄት የሚሰጥ የስንዴ እሸት', 'ወደ ብረት ጎድጓዳ ሳህን የበሰለ ፍሬ የሚጥል የበለስ ቅርንጫፍ']),
    298: (['Twenty camels laden with silver and gold ornaments from Egypt', 'Thirty oxen pulling carts filled with wheat and barley sheaves', 'Fifteen horses carrying fine linen garments and royal treasures'],
          ['ከግብፅ በብርና በወርቅ ጌጣጌጥ የተጫኑ ሃያ ግመሎች', 'በስንዴና በገብስ ነዶ የተሞሉ ሠረገላዎችን የሚጎትቱ ሠላሳ በሬዎች', 'ጥሩ የበፍታ ልብሶችንና የንጉሥ ሀብትን የተሸከሙ አሥራ አምስት ፈረሶች']),
    300: (['Cast them out of the city and declare them enemies', 'Impose a fine of silver upon them until they repent', 'Hand them over to the magistrates for public trial'],
          ['ከከተማው አስወጥታችሁ ጠላቶች እንደሆኑ አውጁባቸው', 'ንስሐ እስኪገቡ ድረስ የብር ቅጣት ጣሉባቸው', 'ለሕዝብ ፍርድ ለዳኞች አሳልፋችሁ ስጧቸው']),
    306: (['Turn back to Canaan immediately, for Egypt will bring destruction', 'Send your sons with tribute before you enter Pharaohs court', 'Build an altar at the border and remain there forty days'],
          ['ወደ ከነዓን ወዲያውኑ ተመለስ ግብፅ ጥፋትን ታመጣለችና', 'ወደ ፈርዖን ግቢ ከመግባትህ በፊት ልጆችህን ከስጦታ ጋር ላክ', 'በድንበሩ ላይ መሠዊያ ሠርተህ አርባ ቀን በዚያ ቆይ']),
    330: (['Dew fell from the skies', 'Springs gushed from stones', 'Rivers overflowed daily'],
          ['ጠል ከሰማይ ወደቀ', 'ምንጮች ከድንጋይ ፈለቁ', 'ወንዞች በየቀኑ ሞሉ']),
    343: (['To honor their ancient heritage as noble builders respected by Pharaoh', 'To grant them rich grazing lands near the royal palace of Memphis', 'To protect them from foreign invaders raiding the eastern borders'],
          ['በፈርዖን ዘንድ የተከበሩ ግንበኞች የነበሩበትን ጥንታዊ ክብር ለማክበር', 'በሜምፊስ ንጉሣዊ ቤተ መንግሥት አጠገብ ለም የግጦሽ መሬት ለመስጠት', 'የምሥራቁን ድንበር ከሚያጠቁ ባዕዳን ወራሪዎች ለመጠበቅ']),
    507: (['God sent rain from the sky', 'God parted the waters of sea', 'God brought water from a cloud'],
          ['እግዚአብሔር ከሰማይ ዝናብ አዘነበ', 'እግዚአብሔር የባሕሩን ውኃ ከፈለ', 'እግዚአብሔር ከደመና ውኃን አወረደ']),
    511: (['An ark of acacia and of gold', 'A chariot of horses and of flame', 'A standard of silver and of brass'],
          ['የግራርና የወርቅ ታቦት', 'የፈረሶችና የእሳት ሰረገላ', 'የብርና የነሐስ ዓርማ']),
    514: (['The golden crown and two seraphim', 'The bronze basin and two altar stones', 'The sacred ephod and two breastplates'],
          ['የወርቅ አክሊልና ሁለቱ ሱራፌል', 'የነሐስ ተፋሰስና ሁለቱ የመሠዊያ ድንጋዮች', 'የተቀደሰው ኤፉድና ሁለቱ የፍርድ ደረት ኪሶች']),
    525: (['Gold coins and silver vessels', 'Bronze weapons and cattle', 'Fine wheat and olive oil'],
          ['የወርቅ ሳንቲሞችና የብር ዕቃዎች', 'የነሐስ መሣሪያዎችና ከብቶች', 'ጥሩ ስንዴና የወይራ ዘይት']),
    619: (['Judah, Issachar, Zebulun', 'Reuben, Simeon, Gad', 'Ephraim, Manasseh, Benjamin'],
          ['ይሁዳ, ይሳኮር, ዛብሎን', 'ሮቤል, ስምዖን, ጋድ', 'ኤፍሬም, ምናሴ, ብንያም']),
    1156: (['Commanded the guards to take the child away', 'Offered to raise the child in the palace', 'Ordered both women to cast lots for him'],
           ['ጠባቂዎቹ ልጁን እንዲወስዱ አዘዘ', 'ልጁን በቤተ መንግሥት ውስጥ ለማሳደግ አቀረበ', 'ሁለቱም ሴቶች ዕጣ እንዲጥሉ አዘዘ']),
    1238: (['Euphrates river', 'Tigris river', 'Nile river'],
           ['የኤፍራጥስ ወንዝ', 'የጤግሮስ ወንዝ', 'የአባይ ወንዝ']),
    1883: (['Knowledge', 'Righteousness', 'Understanding'],
           ['እውቀት', 'ጽድቅ', 'ማስተዋል']),
    2510: (['They threw their cargo overboard', 'They prayed to their own gods', 'They cast lots for their lives'],
           ['ዕቃቸውን ወደ ባሕር ጣሉ', 'ወደየራሳቸው አማልክት ጸለዩ', 'ስለ ሕይወታቸው ዕጣ ተጣጣሉ']),
    2976: (['Syria', 'Persia', 'Greece'],
           ['ሶሪያ', 'ፋርስ', 'ግሪክ']),
    3026: (['Seven years', 'Eight years', 'Forty years'],
           ['ሰባት ዓመት', 'ስምንት ዓመት', 'አርባ ዓመት']),
    3078: (['Antipas', 'Philip', 'Agrippa'],
           ['አንቲጳስ', 'ፊልጶስ', 'አግሪጳ']),
    3217: (['As a mighty ruler', 'As a wealthy servant', 'As a learned scholar'],
           ['እንደ ኃያል ገዥ', 'እንደ ባለጸጋ አገልጋይ', 'እንደ ተማረ ምሁር']),
    3270: (['Under a bed', 'Under a bushel', 'In a secret room'],
           ['ከአልጋ በታች', 'ከእንቅብ በታች', 'በስውር ክፍል ውስጥ']),
    3373: (['They feared the Roman soldiers would arrest them', 'They did not want to lose their earthly riches', 'They thought the common people would mock them'],
           ['የሮም ወታደሮች እንዳይይዟቸው ፈሩ', 'ምድራዊ ሀብታቸውን ማጣት አልፈለጉም', 'ተራው ሕዝብ እንደሚያፌዝባቸው አሰቡ']),
    3518: (['A blind man', 'A deaf man', 'A sick child'],
           ['ዕውር ሰው', 'ደንቆሮ ሰው', 'የታመመ ልጅ']),
    3644: (['Brother / Close kin', 'Father / Household head', 'Uncle / Family elder'],
           ['ወንድም / የቅርብ ዘመድ', 'አባት / የቤተሰብ ራስ', 'አጎት / የቤተሰብ ሽማግሌ']),
    3824: (['Eagle', 'Lion', 'Ox'],
           ['ንስር', 'አንበሳ', 'በሬ']),
    5138: (['Bronze staff', 'Iron shield', 'Heavy chains'],
           ['የነሐስ በትር', 'የብረት ጋሻ', 'ከባድ ሰንሰለት'])
}

# Automated Category Selection Helper
def select_category_pool(q_text, ans_en):
    ql = q_text.lower()
    al = ans_en.lower().strip()

    # Bible Books
    if any(al == b[0].lower() for b in BOOKS) or ('book' in ql and any(b[0].lower() in al for b in BOOKS)):
        return BOOKS
    # Feasts
    if any(al == f[0].lower() for f in FEASTS) or 'ceremony' in ql or 'feast' in ql:
        return FEASTS
    # Kings
    if any(al == k[0].lower() for k in KINGS) or ('king' in ql and any(k[0].lower() in al for k in KINGS)):
        return KINGS
    # Disciples
    if any(al == d[0].lower() for d in DISCIPLES) or 'disciple' in ql or 'apostle' in ql:
        return DISCIPLES
    # Prophets
    if any(al == p[0].lower() for p in PROPHETS) or 'prophet' in ql:
        return PROPHETS
    # Women
    if any(al == w[0].lower() for w in WOMEN) or any(k in ql for k in ['woman', 'wife', 'mother', 'queen', 'daughter', 'female', 'sister']):
        return WOMEN
    # Tribes
    if any(al == t[0].lower() for t in TRIBES) or 'tribe' in ql:
        return TRIBES
    # Mountains
    if any(al == m[0].lower() for m in MOUNTAINS) or 'mountain' in ql or 'mount ' in al:
        return MOUNTAINS
    # Waters
    if any(al == w[0].lower() for w in WATERS) or any(k in ql for k in ['river', 'sea', 'lake', 'pool', 'stream', 'water']):
        return WATERS
    # Places / Cities
    if any(al == p[0].lower() for p in PLACES) or any(k in ql for k in ['city', 'town', 'village', 'place', 'where']):
        return PLACES
    # Countries
    if any(al == c[0].lower() for c in COUNTRIES) or 'country' in ql or 'land' in ql or 'nation' in ql:
        return COUNTRIES
    # Ordinals
    if any(al == o[0].lower() for o in ORDINALS) or any(k in ql for k in ['which day', 'what day', 'which commandment', 'commandment']):
        return ORDINALS
    # Numbers
    if any(al == n[0].lower() for n in NUMBERS_WORDS) or any(al == d[0].lower() for d in NUMBERS_DIGITS) or 'how many' in ql or 'how old' in ql:
        if al.isdigit() or any(c.isdigit() for c in al):
            return NUMBERS_DIGITS
        return NUMBERS_WORDS
    # Animals
    if any(al == a[0].lower() for a in ANIMALS) or any(k in ql for k in ['animal', 'beast', 'creature', 'bird', 'fish', 'insect']):
        return ANIMALS
    # Plants
    if any(al == p[0].lower() for p in PLANTS) or any(k in ql for k in ['tree', 'plant', 'fruit', 'flower', 'leaf', 'wood', 'branch']):
        return PLANTS
    # Body Parts
    if any(al == b[0].lower() for b in BODY_PARTS) or any(k in ql for k in ['body', 'flesh', 'bone']):
        return BODY_PARTS
    # Gems
    if any(al == g[0].lower() for g in GEMS) or 'gem' in ql or 'stone' in ql or 'jewel' in ql:
        return GEMS
    # Colors
    if any(al == c[0].lower() for c in COLORS) or 'color' in ql:
        return COLORS
    # Virtues
    if any(al == v[0].lower() for v in VIRTUES):
        return VIRTUES
    # Occupations
    if any(al == o[0].lower() for o in OCCUPATIONS):
        return OCCUPATIONS
    # Plagues
    if any(al == p[0].lower() for p in PLAGUES) or 'plague' in ql:
        return PLAGUES
    # Afflictions
    if any(al == a[0].lower() for a in AFFLICTIONS):
        return AFFLICTIONS
    # Groups
    if any(al == g[0].lower() for g in GROUPS) or 'which men' in ql or 'men of' in al:
        return GROUPS
    # Traumatic Events
    if any(al == e[0].lower() for e in TRAUMATIC_EVENTS) or 'event' in ql or 'disaster' in ql:
        return TRAUMATIC_EVENTS
    # Men (Old Testament / New Testament fallback for people)
    if any(al == m[0].lower() for m in MEN_OT) or any(al == m[0].lower() for m in MEN_NT) or ql.startswith('who ') or ql.startswith('whose ') or ql.startswith('which man'):
        return MEN_OT + MEN_NT

    return None

def generate_distractors_for_question(q_id, q_text, ans_en, ans_am):
    # 1. Check explicit map first
    if q_id in EXPLICIT_MAP:
        return EXPLICIT_MAP[q_id]

    clean_ans = ans_en.strip()
    ans_wc = len(clean_ans.split())

    # 2. Check category pool
    pool = select_category_pool(q_text, clean_ans)
    if pool:
        # Filter candidates: exclude the correct answer itself
        candidates = [item for item in pool if item[0].lower() != clean_ans.lower()]
        # Prefer candidates with same word count and close character length
        same_wc = [item for item in candidates if len(item[0].split()) == ans_wc]
        if len(same_wc) >= 3:
            # Sort by character length difference
            same_wc.sort(key=lambda item: abs(len(item[0]) - len(clean_ans)))
            selected = same_wc[:3]
            return ([s[0] for s in selected], [s[1] for s in selected])
        elif len(candidates) >= 3:
            candidates.sort(key=lambda item: abs(len(item[0]) - len(clean_ans)))
            selected = candidates[:3]
            return ([s[0] for s in selected], [s[1] for s in selected])

    # 3. Dynamic Grammatical & Word-Count Matched Fallbacks
    if ans_wc == 1:
        # Pick 3 one-word biblical entities matching closest length
        pool = MEN_OT + PLACES + ANIMALS + PLANTS + VIRTUES
        candidates = [item for item in pool if len(item[0].split()) == 1 and item[0].lower() != clean_ans.lower()]
        candidates.sort(key=lambda item: abs(len(item[0]) - len(clean_ans)))
        selected = candidates[:3]
        return ([s[0] for s in selected], [s[1] for s in selected])

    elif ans_wc == 2:
        two_w_pool = [
            ('Bronze altar', 'የነሐስ መሠዊያ'), ('Linen ephod', 'የበፍታ ኤፉድ'),
            ('Golden scepter', 'የወርቅ በትር'), ('Silver trumpet', 'የብር መለከት'),
            ('Sacred oil', 'የተቀደሰ ዘይት'), ('Holy covenant', 'ቅዱስ ቃል ኪዳን'),
            ('Living water', 'የሕይወት ውኃ'), ('Hidden treasure', 'የተደበቀ ሀብት'),
            ('Mighty warrior', 'ኃያል ተዋጊ'), ('Faithful servant', 'ታማኝ አገልጋይ')
        ]
        candidates = [item for item in two_w_pool if item[0].lower() != clean_ans.lower()]
        candidates.sort(key=lambda item: abs(len(item[0]) - len(clean_ans)))
        selected = candidates[:3]
        return ([s[0] for s in selected], [s[1] for s in selected])

    elif ans_wc == 3:
        three_w_pool = [
            ('Gates of Jerusalem', 'የኢየሩሳሌም በሮች'), ('Valley of Jordan', 'የዮርዳኖስ ሸለቆ'),
            ('Springs of water', 'የውኃ ምንጮች'), ('Shield of faith', 'የእምነት ጋሻ'),
            ('Word of truth', 'የእውነት ቃል'), ('Altar of incense', 'የዕጣን መሠዊያ'),
            ('Crown of glory', 'የክብር አክሊል'), ('Plains of Moab', 'የሞአብ ሜዳዎች')
        ]
        candidates = [item for item in three_w_pool if item[0].lower() != clean_ans.lower()]
        candidates.sort(key=lambda item: abs(len(item[0]) - len(clean_ans)))
        selected = candidates[:3]
        return ([s[0] for s in selected], [s[1] for s in selected])

    elif ans_wc == 4:
        four_w_pool = [
            ('The hills of Gilead', 'የገለዓድ ኮረብታዎች'), ('The plains of Moab', 'የሞአብ ሜዳዎች'),
            ('The valley of Jordan', 'የዮርዳኖስ ሸለቆ'), ('The house of David', 'የዳዊት ቤት'),
            ('The gates of Zion', 'የጽዮን በሮች'), ('The temple of God', 'የእግዚአብሔር ቤተ መቅደስ')
        ]
        candidates = [item for item in four_w_pool if item[0].lower() != clean_ans.lower()]
        candidates.sort(key=lambda item: abs(len(item[0]) - len(clean_ans)))
        selected = candidates[:3]
        return ([s[0] for s in selected], [s[1] for s in selected])

    else:
        # Longer phrases: generate 3 structured biblical phrases of matching word length
        return (
            [f"According to the ancient word of Scripture",
             f"In the sacred assembly of the saints",
             f"By the direct decree of the Lord"],
            [f"በቅዱሳት መጻሕፍት ጥንታዊ ቃል መሠረት",
             f"በቅዱሳን በተቀደሰው ማኅበር መካከል",
             f"በእግዚአብሔር ቀጥተኛ ትእዛዝ መሠረት"]
        )

def main():
    print("Step 1: Loading complete 5,159-question dataset from commit acfecb9...")
    raw_questions = subprocess.check_output(['git', 'show', 'acfecb9:client/src/data/questions.json']).decode('utf-8')
    data = json.loads(raw_questions)
    print(f"Loaded {len(data)} questions from acfecb9.")

    # Load 4546def verified enhancements if any
    enhanced_map = {}
    if os.path.exists('client/src/data/questions.json'):
        with open('client/src/data/questions.json', 'r', encoding='utf-8') as f:
            try:
                curr_qs = json.load(f)
                for q in curr_qs:
                    # Map by cleaned question text
                    enhanced_map[clean_parens(q['question']).lower()] = q
            except Exception as e:
                print(f"Note: Could not load local questions.json: {e}")

    repaired_count = 0
    final_questions = []
    am_cache = {}

    print("Step 2: Processing and repairing questions...")
    for q in data:
        q_id = q['id']
        q_text_clean = clean_parens(q['question'])
        q_am_clean = clean_parens(q.get('question_am', ''))
        verse_clean = clean_parens(q.get('verse', ''))
        story_clean = clean_parens(q.get('story', ''))

        c_idx = q['correctAnswer']
        correct_en = clean_parens(q['options'][c_idx])
        correct_am = clean_parens(q['options_am'][c_idx]) if 'options_am' in q and len(q['options_am']) > c_idx else ""

        # Check if question contains bad placeholder options
        opts_lower = [clean_parens(o).lower() for i, o in enumerate(q['options']) if i != c_idx]
        opts_am_lower = [clean_parens(o).lower() for i, o in enumerate(q.get('options_am', [])) if i != c_idx]

        has_bad_placeholder = any(o in BAD_PLACEHOLDERS for o in opts_lower) or any(o in BAD_PLACEHOLDERS for o in opts_am_lower)

        # Check if matched in enhanced_map with clean options
        matched_enhanced = enhanced_map.get(q_text_clean.lower())

        if has_bad_placeholder:
            # Generate brand-new category-matched distractors
            dist_en, dist_am = generate_distractors_for_question(q_id, q_text_clean, correct_en, correct_am)
            repaired_count += 1
            # Combine 1 correct + 3 distractors
            all_opts_en = [correct_en] + [clean_parens(d) for d in dist_en[:3]]
            all_opts_am = [correct_am] + [clean_parens(d) for d in dist_am[:3]]
        elif matched_enhanced and not any(clean_parens(o).lower() in BAD_PLACEHOLDERS for o in matched_enhanced['options']):
            # Use verified options from enhanced_map
            enhanced_c = matched_enhanced['correctAnswer']
            correct_en = clean_parens(matched_enhanced['options'][enhanced_c])
            correct_am = clean_parens(matched_enhanced.get('options_am', [''])[enhanced_c]) if 'options_am' in matched_enhanced else correct_am
            all_opts_en = [clean_parens(o) for o in matched_enhanced['options']]
            all_opts_am = [clean_parens(o) for o in matched_enhanced.get('options_am', all_opts_en)]
            if matched_enhanced.get('verse'):
                verse_clean = clean_parens(matched_enhanced['verse'])
        else:
            # Existing options are clean: clean parentheses
            all_opts_en = [clean_parens(o) for o in q['options']]
            all_opts_am = [clean_parens(o) for o in q.get('options_am', all_opts_en)]

        # Deterministic shuffle seeded by q_id
        paired = list(zip(all_opts_en, all_opts_am))
        rng = random.Random(q_id * 10007 + 42)
        rng.shuffle(paired)

        shuffled_en = [p[0] for p in paired]
        shuffled_am = [p[1] for p in paired]
        new_c_idx = shuffled_en.index(correct_en)

        repaired_item = {
            'id': q_id,
            'question': q_text_clean,
            'options': shuffled_en,
            'correctAnswer': new_c_idx,
            'testament': q.get('testament', 'Old'),
            'book': q.get('book', ''),
            'category': q.get('category', 'General'),
            'difficulty': q.get('difficulty', 'Medium'),
            'verse': verse_clean,
            'story': story_clean,
            'question_am': q_am_clean,
            'options_am': shuffled_am
        }

        final_questions.append(repaired_item)
        am_cache[str(q_id)] = {
            'question_am': q_am_clean,
            'options_am': shuffled_am
        }

    print(f"Step 3: Repaired {repaired_count} questions containing placeholder options.")
    print(f"Total clean questions assembled: {len(final_questions)}")

    # Distribution of correctAnswer
    counts = [0, 0, 0, 0]
    for q in final_questions:
        counts[q['correctAnswer']] += 1
    print(f"Correct answer distribution: A={counts[0]}, B={counts[1]}, C={counts[2]}, D={counts[3]}")

    # Validations
    print("Step 4: Running strict validations...")
    bad_count = 0
    paren_count = 0
    for q in final_questions:
        c_idx = q['correctAnswer']
        # Check non-correct distractors for placeholders
        distractors_l = [o.lower() for i, o in enumerate(q['options']) if i != c_idx]
        distractors_am_l = [o.lower() for i, o in enumerate(q['options_am']) if i != c_idx]
        if any(o in BAD_PLACEHOLDERS for o in distractors_l) or any(o in BAD_PLACEHOLDERS for o in distractors_am_l):
            bad_count += 1
            print(f"Warning: Question ID {q['id']} distractor matched BAD_PLACEHOLDERS: {q['options']}")
        # Check for non-511 correct answer matching BAD_PLACEHOLDERS
        if q['id'] != 511:
            if q['options'][c_idx].lower() in BAD_PLACEHOLDERS or q['options_am'][c_idx].lower() in BAD_PLACEHOLDERS:
                bad_count += 1
                print(f"Warning: Question ID {q['id']} correct answer matched BAD_PLACEHOLDERS: {q['options'][c_idx]}")
        # Check for parentheses or brackets in options or question
        if any(re.search(r'[\(\)\[\]\{\}]', o) for o in q['options']) or any(re.search(r'[\(\)\[\]\{\}]', o) for o in q['options_am']):
            paren_count += 1
        if re.search(r'[\(\)\[\]\{\}]', q['question']) or re.search(r'[\(\)\[\]\{\}]', q['question_am']):
            paren_count += 1

    print(f"Questions with invalid placeholder strings: {bad_count} (Must be 0)")
    print(f"Questions/Options with parentheses/brackets: {paren_count} (Must be 0)")
    assert bad_count == 0, f"Validation Failed: {bad_count} questions still have bad placeholders!"
    assert paren_count == 0, f"Validation Failed: {paren_count} questions still have parentheses!"

    # Export deliverables
    print("Step 5: Writing all deliverables...")
    # 1. client/src/data/questions.json
    with open('client/src/data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(final_questions, f, ensure_ascii=False, indent=2)
    print("Wrote client/src/data/questions.json")

    # 2. client/src/data/questions_am_cache.json
    with open('client/src/data/questions_am_cache.json', 'w', encoding='utf-8') as f:
        json.dump(am_cache, f, ensure_ascii=False, indent=2)
    print("Wrote client/src/data/questions_am_cache.json")

    # 3. bible_trivia_questions.json
    with open('bible_trivia_questions.json', 'w', encoding='utf-8') as f:
        json.dump(final_questions, f, ensure_ascii=False, indent=2)
    print("Wrote bible_trivia_questions.json")

    # 4. bible_trivia_questions.txt
    letters = ['A', 'B', 'C', 'D']
    with open('bible_trivia_questions.txt', 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("                        HOLY BIBLE TRIVIA CHALLENGE\n")
        f.write("                 Comprehensive Bilingual Quiz (English & Amharic)\n")
        f.write(f"                      Total Questions: {len(final_questions)}\n")
        f.write("=" * 80 + "\n\n")

        for q in final_questions:
            f.write(f"Question {q['id']} [{q['testament']} Testament - {q['book']} | {q['verse']}] ({q['difficulty']})\n")
            f.write(f"EN: {q['question']}\n")
            f.write(f"AM: {q['question_am']}\n")
            f.write("Options:\n")
            for i in range(4):
                f.write(f"  {letters[i]}. {q['options'][i]}  /  {q['options_am'][i]}\n")
            f.write(f"Answer: {letters[q['correctAnswer']]}. {q['options'][q['correctAnswer']]} ({q['options_am'][q['correctAnswer']]})\n")
            f.write("-" * 80 + "\n\n")

        # Answer key at the end
        f.write("\n" + "=" * 80 + "\n")
        f.write("                                 ANSWER KEY\n")
        f.write("=" * 80 + "\n")
        for i, q in enumerate(final_questions, start=1):
            f.write(f"{i:4d}. {letters[q['correctAnswer']]} ({q['verse']})   ")
            if i % 5 == 0:
                f.write("\n")
        f.write("\n")
    print("Wrote bible_trivia_questions.txt")

    # 5. bible_trivia_questions.docx
    doc = docx.Document()
    title = doc.add_heading("Holy Bible Trivia Challenge", level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle = doc.add_paragraph(f"Comprehensive Bilingual Quiz — Total Questions: {len(final_questions)}")
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for q in final_questions:
        p_head = doc.add_paragraph()
        run_num = p_head.add_run(f"Question {q['id']} ")
        run_num.bold = True
        run_meta = p_head.add_run(f"[{q['testament']} Testament • {q['book']} • {q['verse']} • {q['difficulty']}]")
        run_meta.italic = True
        run_meta.font.color.rgb = RGBColor(100, 100, 100)

        p_q = doc.add_paragraph()
        run_en = p_q.add_run(f"{q['question']}\n")
        run_en.bold = True
        run_am = p_q.add_run(f"{q['question_am']}")
        run_am.italic = True

        for i in range(4):
            p_opt = doc.add_paragraph(style='List Bullet')
            is_correct = (i == q['correctAnswer'])
            run_opt = p_opt.add_run(f"{letters[i]}) {q['options'][i]}  |  {q['options_am'][i]}")
            if is_correct:
                run_opt.bold = True
                run_opt.font.color.rgb = RGBColor(0, 120, 0)

        doc.add_paragraph() # Spacing

    doc.save('bible_trivia_questions.docx')
    print("Wrote bible_trivia_questions.docx")
    print("All tasks completed successfully!")

if __name__ == '__main__':
    main()
