import json, re

with open('bad_819_questions.json') as f:
    qs = json.load(f)

# Pool definitions
BOOKS = {
    'genesis': ('Genesis', 'ዘፍጥረት'), 'exodus': ('Exodus', 'ዘፀአት'), 'leviticus': ('Leviticus', 'ዘሌዋውያን'),
    'numbers': ('Numbers', 'ዘኍልቁ'), 'deuteronomy': ('Deuteronomy', 'ዘዳግም'), 'joshua': ('Joshua', 'ኢያሱ'),
    'judges': ('Judges', 'መሳፍንት'), 'ruth': ('Ruth', 'ሩት'), '1 samuel': ('1 Samuel', '1 ሳሙኤል'),
    '2 samuel': ('2 Samuel', '2 ሳሙኤል'), '1 kings': ('1 Kings', '1 ነገሥት'), '2 kings': ('2 Kings', '2 ነገሥት'),
    '1 chronicles': ('1 Chronicles', '1 ዜና'), '2 chronicles': ('2 Chronicles', '2 ዜና'),
    'ezra': ('Ezra', 'ዕዝራ'), 'nehemiah': ('Nehemiah', 'ነህምያ'), 'esther': ('Esther', 'አስቴር'),
    'job': ('Job', 'ኢዮብ'), 'psalms': ('Psalms', 'መዝሙር'), 'proverbs': ('Proverbs', 'ምሳሌ'),
    'ecclesiastes': ('Ecclesiastes', 'መክብብ'), 'song of solomon': ('Song of Solomon', 'መኃልየ'),
    'isaiah': ('Isaiah', 'ኢሳይያስ'), 'jeremiah': ('Jeremiah', 'ኤርምያስ'), 'lamentations': ('Lamentations', 'ሰቆቃወ'),
    'ezekiel': ('Ezekiel', 'ሕዝቅኤል'), 'daniel': ('Daniel', 'ዳንኤል'), 'hosea': ('Hosea', 'ሆሴዕ'),
    'joel': ('Joel', 'ኢዩኤል'), 'amos': ('Amos', 'አሞጽ'), 'obadiah': ('Obadiah', 'አብድዩ'),
    'jonah': ('Jonah', 'ዮናስ'), 'micah': ('Micah', 'ሚክያስ'), 'nahum': ('Nahum', 'ናሆም'),
    'habakkuk': ('Habakkuk', 'ዕንባቆም'), 'zephaniah': ('Zephaniah', 'ሶፎንያስ'), 'haggai': ('Haggai', 'ሐጌ'),
    'zechariah': ('Zechariah', 'ዘካርያስ'), 'malachi': ('Malachi', 'ሚልክያስ'), 'matthew': ('Matthew', 'ማቴዎስ'),
    'mark': ('Mark', 'ማርቆስ'), 'luke': ('Luke', 'ሉቃስ'), 'john': ('John', 'ዮሐንስ'),
    'acts': ('Acts', 'የሐዋርያት ሥራ'), 'romans': ('Romans', 'ሮሜ'), '1 corinthians': ('1 Corinthians', '1 ቆሮንቶስ'),
    '2 corinthians': ('2 Corinthians', '2 ቆሮንቶስ'), 'galatians': ('Galatians', 'ገላትያ'),
    'ephesians': ('Ephesians', 'ኤፌሶን'), 'philippians': ('Philippians', 'ፊልጵስዩስ'),
    'colossians': ('Colossians', 'ቆላስይስ'), '1 thessalonians': ('1 Thessalonians', '1 ተሰሎንቄ'),
    '2 thessalonians': ('2 Thessalonians', '2 ተሰሎንቄ'), '1 timothy': ('1 Timothy', '1 ጢሞቴዎስ'),
    '2 timothy': ('2 Timothy', '2 ጢሞቴዎስ'), 'titus': ('Titus', 'ቲቶ'), 'philemon': ('Philemon', 'ፊልሞና'),
    'hebrews': ('Hebrews', 'ዕብራውያን'), 'james': ('James', 'ያዕቆብ'), '1 peter': ('1 Peter', '1 ጴጥሮስ'),
    '2 peter': ('2 Peter', '2 ጴጥሮስ'), '1 john': ('1 John', '1 ዮሐንስ'), '2 john': ('2 John', '2 ዮሐንስ'),
    '3 john': ('3 John', '3 ዮሐንስ'), 'jude': ('Jude', 'ይሁዳ'), 'revelation': ('Revelation', 'ራእይ')
}

FEASTS = {
    'passover': ('Passover', 'ፋሲካ'), 'pentecost': ('Pentecost', 'በዓለ ሃምሳ'),
    'tabernacles': ('Tabernacles', 'የዳስ በዓል'), 'purim': ('Purim', 'ፑሪም'),
    'atonement': ('Day of Atonement', 'የስርየት ቀን'), 'unleavened bread': ('Unleavened Bread', 'የቂጣ በዓል'),
    'feast of booths': ('Feast of Booths', 'የዳስ በዓል')
}

KINGS = {
    'belshazzar': ('Belshazzar', 'ብልጣሶር'), 'nebuchadnezzar': ('Nebuchadnezzar', 'ናቡከደነፆር'),
    'cyrus': ('Cyrus', 'ቂሮስ'), 'darius': ('Darius', 'ዳርዮስ'), 'herod': ('Herod', 'ሄሮድስ'),
    'josiah': ('Josiah', 'ኢዮስያስ'), 'ahab': ('Ahab', 'አክዓብ'), 'jeroboam': ('Jeroboam', 'ኢዮርብዓም'),
    'rehoboam': ('Rehoboam', 'ሮብዓም'), 'hezekiah': ('Hezekiah', 'ሕዝቅያስ'), 'david': ('David', 'ዳዊት'),
    'solomon': ('Solomon', 'ሰሎሞን'), 'saul': ('Saul', 'ሳኦል'), 'abimelech': ('Abimelech', 'አቢሜሌክ'),
    'archelaus': ('Archelaus', 'አርኬላዎስ'), 'artaxerxes': ('Artaxerxes', 'አርጤክስስ'),
    'jehu': ('Jehu', 'ኢዩ'), 'og': ('Og', 'ዐግ'), 'sihon': ('Sihon', 'ሴዎን'),
    'darius the mede': ('Darius the Mede', 'ሜዶናዊው ዳርዮስ'), 'jeroboam ii': ('Jeroboam II', 'ዳግማዊ ኢዮርብዓም')
}

DISCIPLES = {
    'peter': ('Peter', 'ጴጥሮስ'), 'andrew': ('Andrew', 'እንዲሪያስ'), 'james': ('James', 'ያዕቆብ'),
    'john': ('John', 'ዮሐንስ'), 'philip': ('Philip', 'ፊልጶስ'), 'thomas': ('Thomas', 'ቶማስ'),
    'bartholomew': ('Bartholomew', 'በርተሎሜዎስ'), 'matthew': ('Matthew', 'ማቴዎስ'),
    'simon': ('Simon', 'ስምዖን'), 'thaddaeus': ('Thaddaeus', 'ታዴዎስ'),
    'judas': ('Judas', 'ይሁዳ'), 'judas iscariot': ('Judas Iscariot', 'የአስቆሮቱ ይሁዳ'),
    'simon the zealot': ('Simon the Zealot', 'ቀነናዊው ስምዖን')
}

PROPHETS = {
    'elijah': ('Elijah', 'ኤልያስ'), 'elisha': ('Elisha', 'ኤልሳዕ'), 'isaiah': ('Isaiah', 'ኢሳይያስ'),
    'jeremiah': ('Jeremiah', 'ኤርምያስ'), 'ezekiel': ('Ezekiel', 'ሕዝቅኤል'), 'daniel': ('Daniel', 'ዳንኤል'),
    'hosea': ('Hosea', 'ሆሴዕ'), 'joel': ('Joel', 'ኢዩኤል'), 'amos': ('Amos', 'አሞጽ'),
    'jonah': ('Jonah', 'ዮናስ'), 'micah': ('Micah', 'ሚክያስ'), 'samuel': ('Samuel', 'ሳሙኤል'),
    'nathan': ('Nathan', 'ናታን'), 'gad': ('Gad', 'ጋድ')
}

WOMEN = {
    'ruth': ('Ruth', 'ሩት'), 'sarah': ('Sarah', 'ሳራ'), 'rachel': ('Rachel', 'ራሔል'),
    'leah': ('Leah', 'ሊያ'), 'rebekah': ('Rebekah', 'ርብቃ'), 'miriam': ('Miriam', 'ማርያም'),
    'deborah': ('Deborah', 'ዲቦራ'), 'esther': ('Esther', 'አስቴር'), 'hannah': ('Hannah', 'ሐና'),
    'mary': ('Mary', 'ማርያም'), 'martha': ('Martha', 'ማርታ'), 'elizabeth': ('Elizabeth', 'ኤልሳቤጥ'),
    'delilah': ('Delilah', 'ደሊላ'), 'jael': ('Jael', 'ያዔል'), 'rahab': ('Rahab', 'ረዓብ'),
    'jezebel': ('Jezebel', 'ኤልዛቤል'), 'bathsheba': ('Bathsheba', 'ቤርሳቤህ'), 'dinah': ('Dinah', 'ዲና'),
    'hagar': ('Hagar', 'አጋር'), 'naomi': ('Naomi', 'ኑኃሚን'), 'orpha': ('Orpah', 'ዖርፋ')
}

MEN = {
    'adam': ('Adam', 'አዳም'), 'cain': ('Cain', 'ቃየል'), 'abel': ('Abel', 'አቤል'),
    'seth': ('Seth', 'ሴት'), 'enoch': ('Enoch', 'ሄኖክ'), 'methuselah': ('Methuselah', 'ማቱሳላ'),
    'noah': ('Noah', 'ኖኅ'), 'shem': ('Shem', 'ሴም'), 'ham': ('Ham', 'ካም'), 'japheth': ('Japheth', 'ያፌት'),
    'abraham': ('Abraham', 'አብርሃም'), 'abram': ('Abram', 'አብራም'), 'lot': ('Lot', 'ሎጥ'),
    'isaac': ('Isaac', 'ይስሐቅ'), 'jacob': ('Jacob', 'ያዕቆብ'), 'esau': ('Esau', 'ዔሳው'),
    'joseph': ('Joseph', 'ዮሴፍ'), 'benjamin': ('Benjamin', 'ብንያም'), 'reuben': ('Reuben', 'ሮቤል'),
    'simeon': ('Simeon', 'ስምዖን'), 'levi': ('Levi', 'ሌዊ'), 'judah': ('Judah', 'ይሁዳ'),
    'dan': ('Dan', 'ዳን'), 'naphtali': ('Naphtali', 'ንፍታሌም'), 'gad': ('Gad', 'ጋድ'),
    'asher': ('Asher', 'አሴር'), 'issachar': ('Issachar', 'ይሳኮር'), 'zebulun': ('Zebulun', 'ዛብሎን'),
    'manasseh': ('Manasseh', 'ምናሴ'), 'ephraim': ('Ephraim', 'ኤፍሬም'), 'laban': ('Laban', 'ላባ'),
    'potiphar': ('Potiphar', 'ጶጢፋር'), 'ishmael': ('Ishmael', 'እስማኤል'), 'boaz': ('Boaz', 'ቦዔዝ'),
    'mordecai': ('Mordecai', 'መርዶክዮስ'), 'haman': ('Haman', 'ሐማ'), 'job': ('Job', 'ኢዮብ'),
    'balaam': ('Balaam', 'በለዓም'), 'balak': ('Balak', 'ባላቅ'), 'gideon': ('Gideon', 'ጌዴዎን'),
    'samson': ('Samson', 'ሶምሶን'), 'joshua': ('Joshua', 'ኢያሱ'), 'caleb': ('Caleb', 'ካሌብ'),
    'aaron': ('Aaron', 'አሮን'), 'hur': ('Hur', 'ሆር'), 'eli': ('Eli', 'ዔሊ'),
    'jonathan': ('Jonathan', 'ዮናታን'), 'absalom': ('Absalom', 'አቤሴሎም'), 'joab': ('Joab', 'ኢዮአብ'),
    'abner': ('Abner', 'አበኔር'), 'shimei': ('Shimei', 'ሳሚ'), 'barzillai': ('Barzillai', 'በርዚላይ'),
    'terah': ('Terah', 'ታራ'), 'nahor': ('Nahor', 'ናኮር'), 'haran': ('Haran', 'ካራን'),
    'melchizedek': ('Melchizedek', 'መልከ ጼዴቅ'), 'jethro': ('Jethro', 'ዮቶር'),
    'barnabas': ('Barnabas', 'በርናባስ'), 'stephen': ('Stephen', 'እስጢፋኖስ'), 'paul': ('Paul', 'ጳውሎስ'),
    'saul of tarsus': ('Saul of Tarsus', 'የጠርሴሱ ሳኦል'), 'silas': ('Silas', 'ሲላስ'),
    'timothy': ('Timothy', 'ጢሞቴዎስ'), 'titus': ('Titus', 'ቲቶ'), 'apollos': ('Apollos', 'አጵሎስ'),
    'aquila': ('Aquila', 'አቂላ'), 'cornelius': ('Cornelius', 'ቆርኔሌዎስ'), 'luke': ('Luke', 'ሉቃስ'),
    'mark': ('Mark', 'ማርቆስ'), 'john mark': ('John Mark', 'ዮሐንስ ማርቆስ'), 'nicodemus': ('Nicodemus', 'ኒቆዲሞስ'),
    'zacchaeus': ('Zacchaeus', 'ዘኬዎስ'), 'lazarus': ('Lazarus', 'አልዓዛር'), 'simon of cyrene': ('Simon of Cyrene', 'የቀሬናው ስምዖን'),
    'joseph of arimathea': ('Joseph of Arimathea', 'የአርማትያው ዮሴፍ'), 'gamaliel': ('Gamaliel', 'ገማልያል')
}

PLACES = {
    'jerusalem': ('Jerusalem', 'ኢየሩሳሌም'), 'bethlehem': ('Bethlehem', 'ቤተልሔም'),
    'nazareth': ('Nazareth', 'ናዝሬት'), 'jericho': ('Jericho', 'ኢያሪኮ'),
    'hebron': ('Hebron', 'ኬብሮን'), 'samaria': ('Samaria', 'ሰማርያ'),
    'damascus': ('Damascus', 'ደማስቆ'), 'babylon': ('Babylon', 'ባቢሎን'),
    'nineveh': ('Nineveh', 'ነነዌ'), 'antioch': ('Antioch', 'አንጾኪያ'),
    'rome': ('Rome', 'ሮም'), 'egypt': ('Egypt', 'ግብፅ'), 'canaan': ('Canaan', 'ከነዓን'),
    'sodom': ('Sodom', 'ሰዶም'), 'gomorrah': ('Gomorrah', 'ገሞራ'), 'eden': ('Eden', 'ዔደን'),
    'tarshish': ('Tarshish', 'ተርሴስ'), 'ur': ('Ur', 'ኡር'), 'shechem': ('Shechem', 'ሴኬም'),
    'shiloh': ('Shiloh', 'ሴሎ'), 'bethel': ('Bethel', 'ቤቴል'), 'gaza': ('Gaza', 'ጋዛ'),
    'joppa': ('Joppa', 'ኢዮጴ'), 'tarsus': ('Tarsus', 'ጠርሴስ'), 'corinth': ('Corinth', 'ቆሮንቶስ'),
    'ephesus': ('Ephesus', 'ኤፌሶን'), 'philippi': ('Philippi', 'ፊልጵስዩስ'), 'athens': ('Athens', 'አቴና'),
    'bethany': ('Bethany', 'ቢታንያ'), 'capernaum': ('Capernaum', 'ቅፍርናሆም'), 'nod': ('Nod', 'ኖድ'),
    'machpelah': ('Machpelah', 'መክፈላ'), 'beer-sheba': ('Beer-sheba', 'ቤርሳቤህ')
}

WATERS = {
    'jordan river': ('Jordan river', 'የዮርዳኖስ ወንዝ'), 'jordan': ('Jordan', 'ዮርዳኖስ'),
    'nile river': ('Nile river', 'የአባይ ወንዝ'), 'nile': ('Nile', 'አባይ'),
    'red sea': ('Red Sea', 'ቀይ ባሕር'), 'dead sea': ('Dead Sea', 'የጨው ባሕር'),
    'sea of galilee': ('Sea of Galilee', 'የገሊላ ባሕር'), 'euphrates river': ('Euphrates river', 'የኤፍራጥስ ወንዝ'),
    'euphrates': ('Euphrates', 'ኤፍራጥስ'), 'tigris': ('Tigris', 'ጤግሮስ')
}

MOUNTAINS = {
    'mount sinai': ('Mount Sinai', 'ደብረ ሲና'), 'sinai': ('Sinai', 'ሲና'),
    'mount carmel': ('Mount Carmel', 'ደብረ ቀርሜሎስ'), 'carmel': ('Carmel', 'ቀርሜሎስ'),
    'mount ararat': ('Mount Ararat', 'የአራራት ተራራ'), 'ararat': ('Ararat', 'አራራት'),
    'mount horeb': ('Mount Horeb', 'ደብረ ኮሬብ'), 'horeb': ('Horeb', 'ኮሬብ'),
    'mount hermon': ('Mount Hermon', 'ደብረ ሔርሞን'), 'hermon': ('Hermon', 'ሔርሞን'),
    'mount of olives': ('Mount of Olives', 'ደብረ ዘይት'), 'olives': ('Olives', 'ደብረ ዘይት'),
    'mount tabor': ('Mount Tabor', 'ደብረ ታቦር'), 'tabor': ('Tabor', 'ታቦር'),
    'mount moriah': ('Mount Moriah', 'ደብረ ሞሪያም'), 'moriah': ('Moriah', 'ሞሪያም'),
    'mount nebo': ('Mount Nebo', 'ደብረ ናባው'), 'nebo': ('Nebo', 'ናባው'),
    'mount zion': ('Mount Zion', 'ደብረ ጽዮን'), 'zion': ('Zion', 'ጽዮን')
}

NUMBERS = {
    'one': ('One', 'አንድ'), 'two': ('Two', 'ሁለት'), 'three': ('Three', 'ሦስት'),
    'four': ('Four', 'አራት'), 'five': ('Five', 'አምስት'), 'six': ('Six', 'ስድስት'),
    'seven': ('Seven', 'ሰባት'), 'eight': ('Eight', 'ስምንት'), 'nine': ('Nine', 'ዘጠኝ'),
    'ten': ('Ten', 'አሥር'), 'twelve': ('Twelve', 'አሥራ ሁለት'), 'thirty': ('Thirty', 'ሠላሳ'),
    'forty': ('Forty', 'አርባ'), 'fifty': ('Fifty', 'ኃምሳ'), 'seventy': ('Seventy', 'ሰባ'),
    'hundred': ('Hundred', 'መቶ'), 'thousand': ('Thousand', 'ሺህ'), 'sixty-six': ('Sixty-six', 'ስድሳ ስድስት'),
    'thirty-nine': ('Thirty-nine', 'ሠላሳ ዘጠኝ'), 'ninety': ('Ninety', 'ዘጠና'),
    '1': ('1', '1'), '2': ('2', '2'), '3': ('3', '3'), '4': ('4', '4'), '5': ('5', '5'),
    '6': ('6', '6'), '7': ('7', '7'), '8': ('8', '8'), '9': ('9', '9'), '10': ('10', '10'),
    '12': ('12', '12'), '30': ('30', '30'), '40': ('40', '40'), '70': ('70', '70'),
    '100': ('100', '100'), '144,000': ('144,000', '144,000'), '1,000': ('1,000', '1,000')
}

ANIMALS = {
    'horse': ('Horse', 'ፈረስ'), 'lion': ('Lion', 'አንበሳ'), 'eagle': ('Eagle', 'ንስር'),
    'ox': ('Ox', 'በሬ'), 'sheep': ('Sheep', 'በግ'), 'goat': ('Goat', 'ፍየል'),
    'camel': ('Camel', 'ግመል'), 'donkey': ('Donkey', 'አህያ'), 'ass': ('Ass', 'አህያ'),
    'raven': ('Raven', 'ቁራ'), 'dove': ('Dove', 'እርግብ'), 'quail': ('Quail', 'ድርጭት'),
    'locust': ('Locust', 'አንበጣ'), 'dog': ('Dog', 'ውሻ'), 'wolf': ('Wolf', 'ተኩላ'),
    'bear': ('Bear', 'ድብ'), 'leopard': ('Leopard', 'ነብር'), 'serpent': ('Serpent', 'እባብ'),
    'fish': ('Fish', 'ዓሣ'), 'whale': ('Whale', 'ዓሣ ነባሪ'), 'cattle': ('Cattle', 'ከብቶች'),
    'swine': ('Swine', 'አሳማዎች'), 'pigs': ('Pigs', 'አሳማዎች')
}

PLANTS = {
    'fig': ('Fig', 'በለስ'), 'olive': ('Olive', 'ወይራ'), 'cedar': ('Cedar', 'ዝግባ'),
    'vine': ('Vine', 'ወይን'), 'myrtle': ('Myrtle', 'ባርሰነት'), 'pomegranate': ('Pomegranate', 'ሮማን'),
    'mustard': ('Mustard', 'ሰናፍጭ'), 'palm': ('Palm', 'ዘንባባ'), 'acacia': ('Acacia', 'ግራር'),
    'cypress': ('Cypress', 'ሰኖባር'), 'gopher': ('Gopher', 'ጎፌር'), 'hyssop': ('Hyssop', 'ሂሶጵ'),
    'wheat': ('Wheat', 'ስንዴ'), 'barley': ('Barley', 'ገብስ'), 'almond': ('Almond', 'ለውዝ'),
    'apples': ('Apples', 'ቱፋህ'), 'grapes': ('Grapes', 'የወይን ፍሬ')
}

BODY_PARTS = {
    'rib': ('Rib', 'ጎን'), 'hand': ('Hand', 'እጅ'), 'foot': ('Foot', 'እግር'),
    'head': ('Head', 'ራስ'), 'heart': ('Heart', 'ልብ'), 'eye': ('Eye', 'ዐይን'),
    'ear': ('Ear', 'ጆሮ'), 'tongue': ('Tongue', 'ምላስ'), 'bone': ('Bone', 'አጥንት'),
    'flesh': ('Flesh', 'ሥጋ'), 'blood': ('Blood', 'ደም')
}

VIRTUES = {
    'wisdom': ('Wisdom', 'ጥበብ'), 'righteousness': ('Righteousness', 'ጽድቅ'),
    'knowledge': ('Knowledge', 'እውቀት'), 'faith': ('Faith', 'እምነት'),
    'truth': ('Truth', 'እውነት'), 'peace': ('Peace', 'ሰላም'),
    'mercy': ('Mercy', 'ምሕረት'), 'grace': ('Grace', 'ጸጋ'),
    'love': ('Love', 'ፍቅር'), 'hope': ('Hope', 'ተስፋ')
}

print("Categories and pools initialized.")
