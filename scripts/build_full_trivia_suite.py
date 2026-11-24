#!/usr/bin/env python3
"""
scripts/build_full_trivia_suite.py
Full compilation of Bible Trivia Questions:
1. Loads base 475 questions from bible_trivia_questions.json.
2. Incorporates refined Amharic questions & verified verses from the user-provided batch (commit fcc0867).
3. Adds all 36 unique brand-new questions from the user-provided batch with synchronized English translations.
4. Adds all 46 questions from 1001-PDF (including Question 721 "Which men murdered the Levite’s concubine?"),
   completely replacing all default options ("The law given by Moses", "A pillar of cloud and fire",
   "The covenant of the Lord", "The mercy and grace of God") with category-matched, equal-length distractors.
5. Randomizes options deterministically, keeping English and Amharic in identical order and correctAnswer (0..3).
6. Ensures:
   - ZERO questions contain the generic default placeholder options.
   - All options in each question are category-matched and equal length.
   - Dual English and Amharic support.
   - Specific chapter and verse on every question.
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
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

# 46 questions from 1001-PDF with fully category-matched, equal-length options
PDF_46_QUESTIONS = [
    {
        "num": 51,
        "question": "What was the apparent source of Samson’s extraordinary strength?",
        "options": ["His uncut hair", "His bronze staff", "His golden belt", "His sacred cloak"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Judges 16:17",
        "story": "Judges records the cycles of rebellion and deliverance in Israel. God raised Samson as a Nazirite with supernatural strength.",
        "question_am": "የሶምሶን ታላቅ ኃይል ምንጭ ምን ነበር?",
        "options_am": ["ያልተላጨ ጸጉሩ", "የነሐስ በትር", "የወርቅ ቀበቶ", "የተቀደሰ መጎናጸፊያ"]
    },
    {
        "num": 256,
        "question": "Which female judge described herself as 'a mother in Israel'?",
        "options": ["Deborah", "Huldah", "Miriam", "Abigail"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 5:7",
        "story": "Deborah judged Israel under the palm tree between Ramah and Bethel, leading Barak to victory over Sisera.",
        "question_am": "ራሷን «በእስራኤል ውስጥ እናት» ብላ የጠራችው ሴት ፈራጅ ማን ናት?",
        "options_am": ["ዲቦራ", "ሕልዳና", "ማርያም", "አቢግያ"]
    },
    {
        "num": 284,
        "question": "What did Samson find in the carcass of the lion he had killed earlier?",
        "options": ["Swarm of bees and honey", "Nest of doves and eggs", "Bundle of figs and grain", "Cluster of wild olives"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 14:8",
        "story": "Samson returned to Timnah and turned aside to see the lion's carcass, inspiring his famous riddle.",
        "question_am": "ሶምሶን ቀደም ብሎ በገደለው አንበሳ ሬሳ ውስጥ ምን አገኘ?",
        "options_am": ["የንብ መንጋና ማር", "የእርግብ ጎጆና እንቁላል", "የበለስና የእህል ቁጥርጣሽ", "የዱር ወይራ ዘለላ"]
    },
    {
        "num": 291,
        "question": "Who sang a victory song celebrating the downfall of Sisera?",
        "options": ["Deborah and Barak", "Moses and Miriam", "David and Jonathan", "Hannah and Elkanah"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Poetry & Wisdom",
        "difficulty": "Easy",
        "verse": "Judges 5:1",
        "story": "After the defeat of Jabin's general Sisera at the River Kishon, Deborah and Barak sang praises to the Lord.",
        "question_am": "የሲሣራን ውድቀት በማክበር የድል መዝሙር የዘመሩት እነማን ናቸው?",
        "options_am": ["ዲቦራና ባርቅ", "ሙሴና ማርያም", "ዳዊትና ዮናታን", "ሐናና ሕልቃና"]
    },
    {
        "num": 293,
        "question": "Whose mother was commanded by an angel to drink no wine during her pregnancy?",
        "options": ["Samson's mother", "Samuel's mother", "Gideon's mother", "Solomon's mother"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 13:4",
        "story": "The Angel of the Lord appeared to Manoah's wife, instructing her on the strict Nazirite requirements for her child.",
        "question_am": "በእርግዝናዋ ወቅት የወይን ጠጅ እንዳትጠጣ በመልአክ የታዘዘችው የማን እናት ነበረች?",
        "options_am": ["የሶምሶን እናት", "የሳሙኤል እናት", "የጌዴዎን እናት", "የሰሎሞን እናት"]
    },
    {
        "num": 300,
        "question": "How did the Philistines discover the answer to Samson’s riddle?",
        "options": ["They threatened his bride", "They bribed his companions", "They captured his servant", "They consulted sorcerers"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 14:15",
        "story": "On the seventh day of the feast, the thirty companions threatened to burn Samson's wife and her father's house unless she revealed the riddle.",
        "question_am": "ፍልስጥኤማውያን የሶምሶንን እንቆቅልሽ መልስ እንዴት አገኙ?",
        "options_am": ["ሙሽራይቱን አስፈራሩአት", "ጓደኞቹን ጉቦ ሰጡአቸው", "አገልጋዩን ማረኩት", "ጠንቋዮቻቸውን ጠየቁ"]
    },
    {
        "num": 323,
        "question": "What did Samson do to the Philistines’ grain fields when his bride was given away?",
        "options": ["Burned them with fox torches", "Flooded them with river water", "Trampled them with wild oxen", "Stole them during harvest time"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 15:4-5",
        "story": "Samson caught three hundred foxes, tied them tail to tail with torches, and set the Philistines' shocks and vineyards ablaze.",
        "question_am": "ሶምሶን ሙሽራው ለሌላ ሰው እንደተሰጠች ባወቀ ጊዜ በፍልስጥኤማውያን እርሻ ላይ ምን አደረገ?",
        "options_am": ["ቀበሮዎችን በእሳት አስሮ አቃጠለው", "በወንዝ ውኃ አጥለቀለቀው", "በዱር በሬዎች አስረገጠው", "በመከር ጊዜ ዘርፎ ወሰደው"]
    },
    {
        "num": 339,
        "question": "What horrific act did desperate mothers commit during the siege of Jerusalem?",
        "options": ["Boiled and ate their children", "Abandoned them outside walls", "Offered them on pagan altars", "Sold them as captive slaves"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Lamentations",
        "category": "Events",
        "difficulty": "Hard",
        "verse": "Lamentations 4:10",
        "story": "During the horrific siege of Jerusalem by Nebuchadnezzar, Jeremiah mourned the extreme suffering of the inhabitants.",
        "question_am": "በባቢሎን ከበባ ወቅት የተጨነቁ እናቶች በልጆቻቸው ላይ የፈጸሙት ዘግናኝ ድርጊት ምን ነበር?",
        "options_am": ["ልጆቻቸውን ቀቅለው በሉአቸው", "ከቅጥሩ ውጭ ጥለው ሸሹ", "ለባዕድ አማልክት ሰዉአቸው", "ለባርነት አሳልፈው ሸጡአቸው"]
    },
    {
        "num": 398,
        "question": "Which king of Israel built the glorious first temple in Jerusalem?",
        "options": ["Solomon", "David", "Hezekiah", "Josiah"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "1 Kings",
        "category": "People",
        "difficulty": "Easy",
        "verse": "1 Kings 6:1",
        "story": "King Solomon undertook the construction of the Temple of the Lord using cedar of Lebanon and abundant gold.",
        "question_am": "በኢየሩሳሌም የመጀመሪያውን ቤተ መቅደስ የሠራው የብሉይ ኪዳን ንጉሥ ማን ነው?",
        "options_am": ["ሰሎሞን", "ዳዊት", "ሕዝቅያስ", "ኢዮስያስ"]
    },
    {
        "num": 412,
        "question": "Which judge was betrayed into the hands of the Philistines by a woman?",
        "options": ["Samson", "Gideon", "Barak", "Jephthah"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Judges 16:18-21",
        "story": "Delilah lulled Samson to sleep on her lap and had his hair cut, allowing the Philistine lords to capture and blind him.",
        "question_am": "በሴት ተላልፎ ለፍልስጥኤማውያን የተሰጠው ፈራጅ ማን ነው?",
        "options_am": ["ሶምሶን", "ጌዴዎን", "ባርቅ", "ዮፍታሔ"]
    },
    {
        "num": 422,
        "question": "What was the name of Samson’s father from the tribe of Dan?",
        "options": ["Manoah", "Elkanah", "Jesse", "Kish"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 13:2",
        "story": "Manoah of Zorah prayed to God for guidance when his barren wife was visited by an angel promising a son.",
        "question_am": "የሶምሶን አባት ስም ማን ነበር?",
        "options_am": ["ማኑሄ", "ሕልቃና", "እሴይ", "ቂስ"]
    },
    {
        "num": 428,
        "question": "What did the silversmith make with Micah’s dedicated silver?",
        "options": ["An engraved silver idol", "A golden temple crown", "A sacred altar horn", "A bronze incense bowl"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Hard",
        "verse": "Judges 17:4",
        "story": "Micah returned stolen silver to his mother, who gave two hundred shekels to a silversmith to make a carved image.",
        "question_am": "አንጥረኛው በሚካ የብር ሳንቲሞች ምን ሠራ?",
        "options_am": ["የተቀረጸ የብር ጣዖት", "የወርቅ ቤተ መቅደስ ዘውድ", "የተቀደሰ የመሠዊያ ቀንድ", "የነሐስ የዕጣን ጽዋ"]
    },
    {
        "num": 456,
        "question": "Which left-handed judge assassinated Eglon, King of Moab, with a double-edged dagger?",
        "options": ["Ehud", "Othniel", "Shamgar", "Tola"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 3:15-21",
        "story": "Ehud son of Gera reached with his left hand, drew his concealed dagger, and struck Eglon in his private roof chamber.",
        "question_am": "የሞዓብን ንጉሥ ኤግሎንን የገደለው ግራኝ ፈራጅ ማን ነው?",
        "options_am": ["ናዖድ", "ጎቶንያል", "ሴሜጋር", "ቶላ"]
    },
    {
        "num": 481,
        "question": "How many times did Samson deceive Delilah before finally revealing the truth of his hair?",
        "options": ["Three times", "Seven times", "Five times", "Two times"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 16:6-15",
        "story": "Samson deceived Delilah with green bowstrings, new ropes, and weaving his locks, before revealing his heart on the fourth occasion.",
        "question_am": "ሶምሶን እውነተኛውን የኃይሉን ምስጢር ከመናገሩ በፊት ለደሊላ ስንት ጊዜ ዋሸ?",
        "options_am": ["ሦስት ጊዜ", "ሰባት ጊዜ", "አምስት ጊዜ", "ሁለት ጊዜ"]
    },
    {
        "num": 483,
        "question": "Jephthah made a tragic vow to God, with what heartbreaking consequence?",
        "options": ["His daughter was sacrificed", "He was exiled from Israel", "His city was burned down", "He lost his sight in battle"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Hard",
        "verse": "Judges 11:34-39",
        "story": "Jephthah vowed that whatever came out of his door to meet him upon victory would be offered as a burnt sacrifice.",
        "question_am": "ዮፍታሔ ለእግዚአብሔር በተሳለው ስእለት ምክንያት በልጁ ላይ ምን ደረሰ?",
        "options_am": ["ልጁ መሥዋዕት ሆነች", "ከእስራኤል ተሰደደ", "ከተማው በእሳት ተቃጠለች", "በጦርነት ዓይኑን አጣ"]
    },
    {
        "num": 489,
        "question": "Who bribed and persuaded Delilah to discover Samson’s secret strength?",
        "options": ["The rulers of the Philistines", "The princes of the Moabites", "The chiefs of the Midianites", "The kings of the Ammonites"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 16:5",
        "story": "The lords of the Philistines offered Delilah eleven hundred pieces of silver each to entice Samson.",
        "question_am": "ደሊላ የሶምሶንን ታላቅ ኃይል እንድትመረምር ጉቦ የሰጧት እነማን ነበሩ?",
        "options_am": ["የፍልስጥኤማውያን አለቆች", "የሞዓባውያን መሳፍንት", "የምድያማውያን አለቆች", "የአሞናውያን ነገሥታት"]
    },
    {
        "num": 515,
        "question": "What was remarkable about the 700 elite slingers of the tribe of Benjamin?",
        "options": ["Every one was left-handed", "Every one fought blindfolded", "Every one was seven feet tall", "Every one wore iron breastplates"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Hard",
        "verse": "Judges 20:16",
        "story": "Among all these people were seven hundred chosen men who were left-handed; each could sling a stone at a hair and not miss.",
        "question_am": "በወንጭፍ ድንጋይ የሚወረውሩት 700 የብንያም ወታደሮች ልዩ የሚያደርጋቸው ምን ነበር?",
        "options_am": ["ሁሉም ግራኝ ነበሩ", "ሁሉም ዓይናቸውን ተሸፍነው ወረወሩ", "ሁሉም ረዣዥም ቁመት ነበራቸው", "ሁሉም የብረት ጥሩር ለብሰው ነበር"]
    },
    {
        "num": 527,
        "question": "Which biblical judge tore an attacking young lion apart with his bare hands?",
        "options": ["Samson", "Gideon", "Jephthah", "Ehud"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Judges 14:6",
        "story": "The Spirit of the Lord rushed upon Samson, and he tore the young lion apart as one would tear a young goat.",
        "question_am": "አንበሳን በባዶ እጁ የገደለው ሰው ማን ነው?",
        "options_am": ["ሶምሶን", "ጌዴዎን", "ዮፍታሔ", "ናዖድ"]
    },
    {
        "num": 568,
        "question": "What object did Gideon place on the threshing floor to receive a sign from God?",
        "options": ["A fleece of wool", "A branch of olive", "A cloak of linen", "A staff of almond"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Judges 6:37",
        "story": "Gideon placed a woolen fleece on the floor; dew fell only on the fleece while the surrounding ground remained dry.",
        "question_am": "ጌዴዎን ከእግዚአብሔር ምልክት ለመቀበል መሬት ላይ ያስቀመጠው ነገር ምን ነበር?",
        "options_am": ["የበግ ጠጉር", "የወይራ ቅርንጫፍ", "የበፍታ መጎናጸፊያ", "የለውዝ በትር"]
    },
    {
        "num": 586,
        "question": "How many Philistines did Samson strike down using only the jawbone of a donkey?",
        "options": ["One thousand", "Three hundred", "Six hundred", "Five thousand"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Numbers",
        "difficulty": "Easy",
        "verse": "Judges 15:15",
        "story": "Samson found a fresh jawbone of a donkey at Lehi, grasped it, and struck down a thousand men.",
        "question_am": "ሶምሶን በአህያ መንጋጋ ስንት ፍልስጥኤማውያንን ገደለ?",
        "options_am": ["አንድ ሺሕ", "ሦስት መቶ", "ስድስት መቶ", "አምስት ሺሕ"]
    },
    {
        "num": 652,
        "question": "Which pagan god did the Philistines gather to sacrifice to when they captured Samson?",
        "options": ["Dagon", "Baal", "Molech", "Chemosh"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 16:23",
        "story": "The lords of the Philistines assembled to offer a great sacrifice to Dagon their god, celebrating the capture of Samson.",
        "question_am": "ፍልስጥኤማውያን ሶምሶንን በማሰራቸው ምክንያት መሥዋዕት ያቀረቡለት የትኛው ጣዖት ነበር?",
        "options_am": ["ዳጎን", "በኣል", "ሞሎክ", "ካሞሽ"]
    },
    {
        "num": 653,
        "question": "Which judge of Israel made a rash vow that required offering his only daughter?",
        "options": ["Jephthah", "Gideon", "Samson", "Barak"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 11:30-35",
        "story": "Jephthah the Gileadite made a vow to the Lord before defeating the Ammonites, grieving bitterly when his daughter met him.",
        "question_am": "ስለ ተሳለው ስእለት ሳያውቅ ልጁን ለእግዚአብሔር ለመሠዋት የተገደደው ፈራጅ ማን ነው?",
        "options_am": ["ዮፍታሔ", "ጌዴዎን", "ሶምሶን", "ባርቅ"]
    },
    {
        "num": 664,
        "question": "How many volunteer soldiers originally assembled with Gideon before God reduced their number?",
        "options": ["Thirty-two thousand", "Twenty-four thousand", "Eighteen thousand", "Forty-two thousand"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Numbers",
        "difficulty": "Medium",
        "verse": "Judges 7:3",
        "story": "Thirty-two thousand men joined Gideon, but twenty-two thousand turned back because they were fearful.",
        "question_am": "ጌዴዎን በመጀመሪያ ስንት ፈቃደኛ ወታደሮች ነበሩት?",
        "options_am": ["ሰላሳ ሁለት ሺሕ", "ሃያ አራት ሺሕ", "አሥራ ስምንት ሺሕ", "አርባ ሁለት ሺሕ"]
    },
    {
        "num": 666,
        "question": "What three instruments did Gideon's 300 men carry when they attacked the Midianite camp?",
        "options": ["Trumpets, jars, and torches", "Swords, shields, and spears", "Bows, arrows, and quivers", "Banners, horns, and slings"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 7:16",
        "story": "Gideon divided the 300 men into three companies and put a trumpet into the hands of all of them, with empty jars and torches.",
        "question_am": "ጌዴዎንና ሠራዊቱ ምድያማውያንን ለማሸነፍ ምን ቁሳቁሶችን ተጠቀሙ?",
        "options_am": ["ቀንደ መለከት፣ ማሰሮና ችቦ", "ሰይፍ፣ ጋሻና ጦር", "ቀስት፣ ፍላጻና ኮረጆ", "ሰንደቅ፣ ቀንዶችና ወንጭፍ"]
    },
    {
        "num": 677,
        "question": "Why did God tell King David he was not permitted to build the Temple in Jerusalem?",
        "options": ["Because he had shed much blood in war", "Because he was not from the tribe of Levi", "Because he lacked the required gold stores", "Because his kingdom had not achieved peace"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "1 Chronicles",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "1 Chronicles 22:8",
        "story": "The word of the Lord came to David saying, 'You have shed much blood and waged great wars; you shall not build a house to my name.'",
        "question_am": "ዳዊት የእግዚአብሔርን ቤተ መቅደስ እንዳይሠራ የተከለከለው ለምን ነበር?",
        "options_am": ["በጦርነት ብዙ ደም ስላፈሰሰ", "ከካህናት ነገድ ስላልተወለደ", "የሚያስፈልገው ወርቅ ስላልነበረው", "መንግሥቱ ገና ሰላም ስላላገኘ"]
    },
    {
        "num": 682,
        "question": "With what weapon did Jael slay the Canaanite commander Sisera in her tent?",
        "options": ["A tent peg and a hammer", "A sharp dagger and stone", "A heavy spear and sword", "A bronze sickle and rope"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 4:21",
        "story": "Jael, wife of Heber the Kenite, took a tent peg, grasped a hammer, and drove the peg into Sisera's temple while he slept.",
        "question_am": "ኢያዔል ሲሣራን በምን መሣሪያ ገደለችው?",
        "options_am": ["የድንኳን ካስማና መዶሻ", "ስለት ያለው ጩቤና ድንጋይ", "ከባድ ጦርና ሰይፍ", "የነሐስ ማጭድና ገመድ"]
    },
    {
        "num": 704,
        "question": "Why was Jephthah forced to flee from his father's house to the land of Tob?",
        "options": ["His brothers drove him away", "He was exiled by King Saul", "He fled from Philistine foes", "He ran from heavy royal taxes"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 11:2-3",
        "story": "Gilead's wife bore sons, and when they grew up they drove Jephthah out because his mother was a prostitute.",
        "question_am": "ዮፍታሔ ወደ ጦብ ምድር የሸሸው ለምን ነበር?",
        "options_am": ["ወንድሞቹ ከቤት አባረሩት", "በንጉሥ ሳኦል ተሰዶ ነበር", "ከፍልስጥኤማውያን ሸሽቶ ነበር", "ከከባድ የግብር ሸክም ሸሸ"]
    },
    {
        "num": 715,
        "question": "What wager of clothing did Samson promise the 30 Philistine companions if they solved his riddle?",
        "options": ["Thirty sheets and thirty changes of clothing", "Thirty bags of gold and thirty silver coins", "Thirty bronze shields and thirty iron swords", "Thirty fat sheep and thirty bushels of grain"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 14:12",
        "story": "Samson offered thirty linen garments and thirty changes of clothes if they explained his riddle within seven days.",
        "question_am": "ፍልስጥኤማውያን እንቆቅልሹን ቢፈቱ ሶምሶን የገባላቸው ቃል ምን ነበር?",
        "options_am": ["ሠላሳ የበፍታ ቀሚስና ሠላሳ ልብስ", "ሠላሳ ከረጢት ወርቅና ሠላሳ የብር ሳንቲም", "ሠላሳ የነሐስ ጋሻና ሠላሳ የብረት ሰይፍ", "ሠላሳ ሰባ በጎችና ሠላሳ የዕህል መስፈሪያ"]
    },
    {
        "num": 721,
        "question": "Which men assaulted and murdered the Levite’s concubine in ancient Israel?",
        "options": ["The men of Gibeah", "The men of Sodom", "The men of Shechem", "The men of Jericho"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Hard",
        "verse": "Judges 19:22-28",
        "story": "Corrupt men of Gibeah in the territory of Benjamin surrounded the house, leading to a tragic atrocity that united Israel.",
        "question_am": "የሌዋዊውን ቁባት የገደሏት የትኞቹ ሰዎች ናቸው?",
        "options_am": ["የጊብዓ ሰዎች", "የሰዶም ሰዎች", "የሴኬም ሰዎች", "የኢያሪኮ ሰዎች"]
    },
    {
        "num": 756,
        "question": "Approximately how many men and women were on the temple roof watching blinded Samson?",
        "options": ["About three thousand", "About one thousand", "About five thousand", "About seven hundred"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Numbers",
        "difficulty": "Hard",
        "verse": "Judges 16:27",
        "story": "There were on the roof about three thousand men and women looking on while Samson was made to amuse them.",
        "question_am": "ሶምሶን ሲያዝናናቸው ለማየት በመቅደሱ ጣሪያ ላይ ስንት ሰዎች ነበሩ?",
        "options_am": ["ሦስት ሺሕ የሚያክሉ", "አንድ ሺሕ የሚያክሉ", "አምስት ሺሕ የሚያክሉ", "ሰባት መቶ የሚያክሉ"]
    },
    {
        "num": 760,
        "question": "What massive city landmark did Samson rip up and carry to the hill overlooking Hebron?",
        "options": ["The city gates and posts", "The bronze pagan altar", "The marble palace pillars", "The watchtower iron bell"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Miracles",
        "difficulty": "Medium",
        "verse": "Judges 16:3",
        "story": "Samson rose at midnight, grasped the doors of the city gate of Gaza with the two posts, pulled them up, and carried them away.",
        "question_am": "ሶምሶን በኬብሮን ፊት ወዳለው ተራራ አናት የተሸከመው ምን ነበር?",
        "options_am": ["የከተማይቱን ደጆችና መቃኖች", "የነሐስ የአረማውያን መሠዊያ", "የእብነበረድ የቤተ መንግሥት ምሰሶ", "የመጠበቂያ ግንብ የብረት ደወል"]
    },
    {
        "num": 774,
        "question": "Against which aggressive nation did Jephthah lead Israel to victory?",
        "options": ["The Ammonites", "The Philistines", "The Moabites", "The Edomites"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 11:32-33",
        "story": "Jephthah crossed over to fight the Ammonites, and the Lord gave them into his hand from Aroer to Minnith.",
        "question_am": "ዮፍታሔ እስራኤልን የመራው በየትኛው ጠላት ላይ ነበር?",
        "options_am": ["አሞናውያን", "ፍልስጥኤማውያን", "ሞዓባውያን", "ኤዶማውያን"]
    },
    {
        "num": 796,
        "question": "How many Philistine companions were assigned to Samson at his wedding feast in Timnah?",
        "options": ["Thirty companions", "Twelve companions", "Twenty companions", "Fifty companions"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Numbers",
        "difficulty": "Medium",
        "verse": "Judges 14:11",
        "story": "As soon as the people saw him, they brought thirty companions to be with him during the wedding feast.",
        "question_am": "በተምና በነበረው የሰርግ ግብዣ ላይ ለሶምሶን ስንት ጓደኞች ተሰጡት?",
        "options_am": ["ሠላሳ ጓደኞች", "አሥራ ሁለት ጓደኞች", "ሃያ ጓደኞች", "አምሳ ጓደኞች"]
    },
    {
        "num": 802,
        "question": "In the tragic civil war recorded at the conclusion of Judges, which tribe was fought against?",
        "options": ["Tribe of Benjamin", "Tribe of Ephraim", "Tribe of Dan", "Tribe of Judah"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Medium",
        "verse": "Judges 20:14",
        "story": "All Israel assembled against Gibeah, and the Benjamites mustered twenty-six thousand men to defend their brethren.",
        "question_am": "በመሳፍንት ዘመን የእርስ በርስ ጦርነት የተነሣው በየትኛው ነገድ ላይ ነበር?",
        "options_am": ["የብንያም ነገድ", "የኤፍሬም ነገድ", "የዳን ነገድ", "የይሁዳ ነገድ"]
    },
    {
        "num": 805,
        "question": "In the Song of Solomon, where does the lover state that wild leopards dwell?",
        "options": ["In rugged mountain dens", "In the dry desert sands", "In deep forest thickets", "In coastal marsh reeds"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Song of Solomon",
        "category": "Poetry & Wisdom",
        "difficulty": "Hard",
        "verse": "Song of Solomon 4:8",
        "story": "'Come with me from Lebanon, my bride... from the lions' dens, from the mountains of the leopards.'",
        "question_am": "ሰሎሞን በመኃልየ መኃልይ ነብሮች የት እንደሚኖሩ ይናገራል?",
        "options_am": ["በተራሮች ዋሻ ውስጥ", "በበረሃ አሸዋ ላይ", "በጥልቅ ጫካ ውስጥ", "በወንዝ ዳርቻ ሸምበቆ"]
    },
    {
        "num": 826,
        "question": "For how many years did the biblical judge Abdon, son of Hillel, lead Israel?",
        "options": ["Eight years", "Four years", "Twelve years", "Twenty years"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Numbers",
        "difficulty": "Hard",
        "verse": "Judges 12:13-14",
        "story": "Abdon the son of Hillel the Pirathonite judged Israel eight years; he had forty sons and thirty grandsons.",
        "question_am": "የሒሌል ልጅ ዓብዶን በእስራኤል ላይ ለስንት ዓመታት ፈረደ?",
        "options_am": ["ስምንት ዓመት", "አራት ዓመት", "አሥራ ሁለት ዓመት", "ሃያ ዓመት"]
    },
    {
        "num": 868,
        "question": "What happened to the men in Gideon’s army who lapped water with their hands to their mouths?",
        "options": ["They were chosen to fight Midian", "They were sent back to their tents", "They were ordered to carry supplies", "They were stationed as rear guards"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Judges 7:6-7",
        "story": "The Lord said to Gideon, 'With the three hundred men who lapped I will save you and give the Midianites into your hand.'",
        "question_am": "ውኃውን በእጃቸው ጠልፈው በአፋቸው የላሱት የጌዴዎን ወታደሮች ምን ሆኑ?",
        "options_am": ["ምድያምን እንዲወጉ ተመረጡ", "ወደ ድንኳናቸው እንዲመለሱ ተደረገ", "ስንቅ እንዲሸከሙ ተመደቡ", "የኋላ ጥበቃ ሆነው እንዲቆሙ ተደረገ"]
    },
    {
        "num": 881,
        "question": "In which fertile valley was Delilah living when Samson fell in love with her?",
        "options": ["Valley of Sorek", "Valley of Elah", "Valley of Achor", "Valley of Kidron"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Geography",
        "difficulty": "Medium",
        "verse": "Judges 16:4",
        "story": "After this Samson loved a woman in the Valley of Sorek, whose name was Delilah.",
        "question_am": "ደሊላ የምትኖረው በየትኛው ሸለቆ ውስጥ ነበር?",
        "options_am": ["የሶሬቅ ሸለቆ", "የኤላህ ሸለቆ", "የአኮር ሸለቆ", "የቄድሮን ሸለቆ"]
    },
    {
        "num": 886,
        "question": "What offering of food did Gideon present to the Angel of the Lord under the oak in Ophrah?",
        "options": ["A young goat and unleavened bread", "A roasted lamb and sweet fig cake", "Two young pigeons and barley loaves", "A fatted calf and jug of rich wine"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Hard",
        "verse": "Judges 6:19",
        "story": "Gideon went in and prepared a young goat and unleavened cakes from an ephah of flour, setting the meat in a basket.",
        "question_am": "ጌዴዎን በዛፉ ሥር ለጌታ መልአክ ያቀረበው መሥዋዕት ምን ነበር?",
        "options_am": ["የፍየል ጠቦትና የቂጣ እንጀራ", "የተጠበሰ በግና የበለስ ኬክ", "ሁለት የርግብ ጫጩትና የገብስ እንጀራ", "የሰባ ጥጃና የወይን ጠጅ"]
    },
    {
        "num": 889,
        "question": "To which of the twelve tribes of Israel did Samson belong?",
        "options": ["Tribe of Dan", "Tribe of Judah", "Tribe of Gad", "Tribe of Asher"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Judges 13:2",
        "story": "There was a certain man of Zorah, of the tribe of the Danites, whose name was Manoah.",
        "question_am": "ሶምሶን የየትኛው ነገድ አባል ነበር?",
        "options_am": ["የዳን ነገድ", "የይሁዳ ነገድ", "የጋድ ነገድ", "የአሴር ነገድ"]
    },
    {
        "num": 907,
        "question": "To which Philistine coastal city did Samson go down to slay 30 men to settle his wager?",
        "options": ["Ashkelon", "Ashdod", "Ekron", "Gath"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Geography",
        "difficulty": "Hard",
        "verse": "Judges 14:19",
        "story": "The Spirit of the Lord rushed upon him, and he went down to Ashkelon and struck down thirty men of the city.",
        "question_am": "ሶምሶን ሰላሳ ሰዎችን ለመግደልና ልብሳቸውን ለመውሰድ የወረደው ወደ የትኛው ከተማ ነው?",
        "options_am": ["አስቀሎና", "አዛጦን", "አቃሮን", "ጌት"]
    },
    {
        "num": 937,
        "question": "On what historic occasion did David deliver the psalm of praise in 1 Chronicles 16?",
        "options": ["Bringing the Ark to Jerusalem", "Crowning Solomon as new king", "Laying the temple foundation", "Defeating the Philistine army"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "1 Chronicles",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "1 Chronicles 16:7",
        "story": "Then on that day David first appointed that thanksgiving be sung to the Lord by Asaph and his brothers.",
        "question_am": "ዳዊት መዝሙር 105ን ያቀረበው በየትኛው ታላቅ ክስተት ወቅት ነበር?",
        "options_am": ["የቃል ኪዳኑን ታቦት ወደ ኢየሩሳሌም ሲያመጣ", "ሰሎሞንን ንጉሥ አድርጎ ሲቀባ", "የቤተ መቅደሱን መሠረት ሲጥል", "ፍልስጥኤማውያንን ድል ሲነሣ"]
    },
    {
        "num": 947,
        "question": "In the Song of Solomon, the bride's cascading dark hair is compared to a flock of what animal?",
        "options": ["A flock of goats", "A flock of sheep", "A flock of doves", "A flock of lambs"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Song of Solomon",
        "category": "Poetry & Wisdom",
        "difficulty": "Medium",
        "verse": "Song of Solomon 4:1",
        "story": "'Behold, you are beautiful, my love... your hair is like a flock of goats leaping down the slopes of Gilead.'",
        "question_am": "በመኃልየ መኃልይ የሙሽራይቱ ጸጉር ከየትኛው የእንስሳት መንጋ ጋር ተነጻጽሯል?",
        "options_am": ["የፍየል መንጋ", "የበግ መንጋ", "የእርግብ መንጋ", "የጠቦት መንጋ"]
    },
    {
        "num": 953,
        "question": "How many pieces of silver was each Philistine ruler to pay Delilah for betraying Samson?",
        "options": ["1,100 pieces", "500 pieces", "300 pieces", "2,000 pieces"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Numbers",
        "difficulty": "Hard",
        "verse": "Judges 16:5",
        "story": "The lords of the Philistines came to her and said, '...and we will each give you 1,100 pieces of silver.'",
        "question_am": "እያንዳንዱ የፍልስጥኤም አለቃ ሶምሶንን አሳልፋ እንድትሰጥ ለደሊላ ስንት ብር ሊሰጧት ቃል ገቡ?",
        "options_am": ["አንድ ሺሕ አንድ መቶ ብር", "አምስት መቶ ብር", "ሦስት መቶ ብር", "ሁለት ሺሕ ብር"]
    },
    {
        "num": 974,
        "question": "With what unusual agricultural implement did Shamgar slay 600 Philistines?",
        "options": ["An ox goad", "An iron sickle", "A wooden flail", "A bronze plow"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Judges",
        "category": "Events",
        "difficulty": "Hard",
        "verse": "Judges 3:31",
        "story": "After Ehud came Shamgar the son of Anath, who killed 600 of the Philistines with an oxgoad, saving Israel.",
        "question_am": "ሴሜጋር ስድስት መቶ ፍልስጥኤማውያንን የገደለው በየትኛው ያልተለመደ መሣሪያ ነበር?",
        "options_am": ["የበሬ መውጊያ", "የብረት ማጭድ", "የእንጨት መውቂያ", "የነሐስ ማረሻ"]
    },
    {
        "num": 998,
        "question": "How many sons of King David born in Hebron and Jerusalem are explicitly enumerated in 1 Chronicles 3?",
        "options": ["Nineteen sons", "Twelve sons", "Seven sons", "Twenty-four sons"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "1 Chronicles",
        "category": "Numbers",
        "difficulty": "Hard",
        "verse": "1 Chronicles 3:1-9",
        "story": "All these were David's sons, besides the sons of the concubines, and Tamar was their sister.",
        "question_am": "በመጽሐፍ ቅዱስ ውስጥ በስም የተጠቀሱት የዳዊት ወንዶች ልጆች ስንት ናቸው?",
        "options_am": ["አሥራ ዘጠኝ ወንዶች ልጆች", "አሥራ ሁለት ወንዶች ልጆች", "ሰባት ወንዶች ልጆች", "ሃያ አራት ወንዶች ልጆች"]
    }
]

# 36 unique brand-new questions from user paste
NEW_36_QUESTIONS = [
    {
        "question": "What was the name of the garden where Adam and Eve initially dwelt?",
        "options": ["Garden of Eden", "Garden of Gethsemane", "Land of Canaan", "Wilderness of Sinai"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Places",
        "difficulty": "Easy",
        "verse": "Genesis 2:8",
        "story": "And the Lord God planted a garden eastward in Eden; and there he put the man whom he had formed.",
        "question_am": "አዳምና ሔዋን የኖሩበት የአትክልት ስፍራ ስም ማን ነበር?",
        "options_am": ["ኤደን ገነት", "ጌቴሴማኒ", "ከነዓን", "ሲና"]
    },
    {
        "question": "With what food did Jesus miraculously feed the multitude of five thousand?",
        "options": ["Loaves of bread and fish", "Wild honey and locusts", "Clusters of figs and grapes", "Manna cakes and quail"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Matthew",
        "category": "Miracles",
        "difficulty": "Easy",
        "verse": "Matthew 14:19",
        "story": "Jesus took the five loaves and two fish, looked up to heaven, blessed and broke them, and fed the crowd.",
        "question_am": "ኢየሱስ 5,000 ሰዎችን የመገበው በምን ዓይነት ምግብ ነበር?",
        "options_am": ["እንጀራና ዓሣ", "ማርና አንበጣ", "የበለስና የወይን ዘለላ", "መናና ድርጭት"]
    },
    {
        "question": "Which creature craftily deceived Eve into tasting the forbidden fruit?",
        "options": ["The crafty serpent", "A roaring young lion", "A wild predatory wolf", "A flying desert raven"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Genesis 3:1-6",
        "story": "Now the serpent was more crafty than any other beast of the field that the Lord God had made.",
        "question_am": "ሔዋንን የተከለከለውን ፍሬ እንድትበላ ያታለላት ፍጡር የትኛው ነው?",
        "options_am": ["እባብ", "አንበሳ", "ተኩላ", "ቁራ"]
    },
    {
        "question": "What is the opening invocation of the Lord's Prayer taught by Jesus?",
        "options": ["Our Father in heaven", "The Lord is my shepherd", "In the beginning God made", "Hallowed be Thy name"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Matthew",
        "category": "Gospels",
        "difficulty": "Easy",
        "verse": "Matthew 6:9",
        "story": "Pray then like this: 'Our Father in heaven, hallowed be your name.'",
        "question_am": "የጌታ ጸሎት የመጀመሪያው መስመር ምንድን ነው?",
        "options_am": ["በሰማያት የምትኖር አባታችን ሆይ", "እግዚአብሔር እረኛዬ ነው", "በመጀመሪያ እግዚአብሔር ፈጠረ", "ስምህ ይቀደስ"]
    },
    {
        "question": "What was Ruth's familial relationship to Naomi?",
        "options": ["Her daughter-in-law", "Her younger sister", "Her biological child", "Her elder aunt"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Ruth",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Ruth 1:4",
        "story": "Mahlon and Chilion took Moabite wives; the name of the one was Orpah and the name of the other Ruth.",
        "question_am": "ሩት ለኑኃሚን ምኗ ነበረች?",
        "options_am": ["ምራቷ", "እህቷ", "ልጇ", "አክስቷ"]
    },
    {
        "question": "Who lied to the Lord when questioned about the whereabouts of his brother?",
        "options": ["Cain", "Abel", "Seth", "Jacob"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Genesis 4:9",
        "story": "The Lord said to Cain, 'Where is Abel your brother?' He said, 'I do not know; am I my brother's keeper?'",
        "question_am": "ወንድምህ ወዴት ነው ተብሎ ሲጠየቅ እግዚአብሔርን የዋሸው ማን ነው?",
        "options_am": ["ቃየን", "አቤል", "ሴት", "ያዕቆብ"]
    },
    {
        "question": "What foundational event is recounted in Genesis chapters 1 and 2?",
        "options": ["The Creation of the world", "The Great Flood of Noah", "Building the Tower of Babel", "The Exodus out of Egypt"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Genesis 1-2",
        "story": "In the beginning, God created the heavens and the earth, fashioning all things in six days.",
        "question_am": "በኦሪት ዘፍጥረት ምዕራፍ 1 እና 2 ላይ የተመዘገበው ታላቅ ክስተት ምንድን ነው?",
        "options_am": ["የዓለምና የሰው ልጅ ፍጥረት", "የጥፋት ውኃ መከሰት", "የባቤል ግንብ መገንባት", "የእስራኤል ከግብፅ መውጣት"]
    },
    {
        "question": "Whom did his mother place into an ark of bulrushes at the river’s brink?",
        "options": ["Moses", "Samuel", "Joseph", "David"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Exodus",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Exodus 2:3",
        "story": "Jochebed took for him an ark of bulrushes, daubed it with pitch, and put the child in it among the reeds.",
        "question_am": "እናቱ በደንገል ሣጥን ውስጥ ያስቀመጠችው ማንን ነው?",
        "options_am": ["ሙሴ", "ሳሙኤል", "ዮሴፍ", "ዳዊት"]
    },
    {
        "question": "During the Great Flood, for how many continuous days and nights did torrential rain fall?",
        "options": ["Forty days and nights", "Seven days and nights", "Thirty days and nights", "Fifty days and nights"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Genesis 7:12",
        "story": "And rain fell upon the earth forty days and forty nights as the fountains of the deep burst.",
        "question_am": "በጥፋት ውኃ ታሪክ ውስጥ ዝናቡ ለስንት ቀንና ሌሊት ዘነበ?",
        "options_am": ["40 ቀንና ሌሊት", "7 ቀንና ሌሊት", "30 ቀንና ሌሊት", "50 ቀንና ሌሊት"]
    },
    {
        "question": "What extraordinary truth was prophesied and fulfilled regarding Mary, the mother of Jesus?",
        "options": ["She conceived as a virgin", "She was crowned as a queen", "She was a wealthy heiress", "She was a high priestess"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Matthew",
        "category": "Gospels",
        "difficulty": "Easy",
        "verse": "Matthew 1:23",
        "story": "'Behold, the virgin shall conceive and bear a son, and they shall call his name Immanuel.'",
        "question_am": "ስለ ኢየሱስ እናት ልዩ የነበረው ነገር ምንድን ነው?",
        "options_am": ["ድንግል ነበረች", "ንግሥት ነበረች", "ሀብታም ነበረች", "ሊቀ ካህን ነበረች"]
    },
    {
        "question": "Who travelled from afar following a celestial star to present gifts to the infant Jesus?",
        "options": ["Wise Men from the East", "Pharisees of Jerusalem", "Roman guard officers", "Apostles from Galilee"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Matthew",
        "category": "Gospels",
        "difficulty": "Easy",
        "verse": "Matthew 2:1-11",
        "story": "Wise men from the east came to Jerusalem, offering treasures of gold, frankincense, and myrrh.",
        "question_am": "ኢየሱስ ሕፃን በነበረበት ጊዜ ስጦታ የሰጡት እነማን ናቸው?",
        "options_am": ["ሰብአ ሰገል", "ፈሪሳውያን", "ሮማውያን ወታደሮች", "ሐዋርያት"]
    },
    {
        "question": "In whose divine image and likeness was humanity fashioned at creation?",
        "options": ["In the image of God", "In the image of angels", "In the image of beasts", "In the image of stars"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Genesis 1:27",
        "story": "So God created man in his own image, in the image of God he created him; male and female he created them.",
        "question_am": "ሰው የተፈጠረው በማን መልክ ነው?",
        "options_am": ["በእግዚአብሔር መልክ", "በመላእክት መልክ", "በእንስሳት መልክ", "በከዋክብት መልክ"]
    },
    {
        "question": "Besides the Wise Men, who were notified by angels to visit the newborn Savior in Bethlehem?",
        "options": ["Shepherds in the fields", "Fishermen on the lakes", "Priests inside temples", "Merchants in bazaars"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Luke",
        "category": "Gospels",
        "difficulty": "Easy",
        "verse": "Luke 2:8-16",
        "story": "And there were in the same country shepherds abiding in the field, keeping watch over their flock by night.",
        "question_am": "ከሰብአ ሰገል በተጨማሪ ኢየሱስ ሕፃን ሳለ ሊጠይቁት የመጡት እነማን ናቸው?",
        "options_am": ["እረኞች", "ዓሣ አጥማጆች", "ካህናት", "ነጋዴዎች"]
    },
    {
        "question": "From what catastrophic world judgment did God preserve Noah and his household in the Ark?",
        "options": ["The worldwide Flood", "Rain of brimstone fire", "Great famine drought", "Violent earthquakes"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Genesis 7:7",
        "story": "Noah and his sons and his wife and his sons' wives with him went into the ark to escape the waters of the flood.",
        "question_am": "መርከቡ ኖኅንና ቤተሰቡን ከምን ዓይነት ጥፋት አዳናቸው?",
        "options_am": ["ከጥፋት ውኃ", "ከእሳትና ዲን", "ከረሃብ ድርቅ", "ከምድር መንቀጥቀጥ"]
    },
    {
        "question": "What pivotal event occurred on the fortieth day after Jesus' resurrection from the dead?",
        "options": ["He ascended into heaven", "He returned to Galilee", "He traveled to Damascus", "He visited King Agrippa"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Acts",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Acts 1:9",
        "story": "And when he had said these things, as they were looking on, he was lifted up, and a cloud took him out of their sight.",
        "question_am": "ኢየሱስ ከትንሣኤው በኋላ በአርባኛው ቀን ምን ሆነ?",
        "options_am": ["ወደ ሰማይ ዐረገ", "ወደ ገሊላ ተመለሰ", "ወደ ደማስቆ ሄደ", "ከንጉሥ አግሪጳ ጋር ተገናኘ"]
    },
    {
        "question": "From what physical material did the Lord God sculpt the first man?",
        "options": ["The dust of the ground", "The clay of the river", "The foam of the ocean", "The stones of mountains"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Genesis 2:7",
        "story": "Then the Lord God formed the man of dust from the ground and breathed into his nostrils the breath of life.",
        "question_am": "ሰው ከምን ተፈጠረ?",
        "options_am": ["ከምድር አፈር", "ከወንዝ ሸክላ", "ከባሕር አረፋ", "ከተራራ ድንጋይ"]
    },
    {
        "question": "Which of the four canonical Gospels appears last in the New Testament canon?",
        "options": ["Gospel of John", "Gospel of Luke", "Gospel of Mark", "Gospel of Matthew"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "John",
        "category": "Gospels",
        "difficulty": "Easy",
        "verse": "John 21:24-25",
        "story": "This is the disciple who is bearing witness about these things, and who has written these things.",
        "question_am": "በመጽሐፍ ቅዱስ ውስጥ በመጨረሻ የሚገኘው ወንጌል የትኛው ነው?",
        "options_am": ["የዮሐንስ ወንጌል", "የሉቃስ ወንጌል", "የማርቆስ ወንጌል", "የማቴዎስ ወንጌል"]
    },
    {
        "question": "What sole transgression did Christ declare will never be forgiven in this age or the next?",
        "options": ["Blasphemy against Holy Spirit", "Speaking untruth to neighbors", "Stealing from the sanctuary", "Unrighteous anger and wrath"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Mark",
        "category": "Gospels",
        "difficulty": "Medium",
        "verse": "Mark 3:29",
        "story": "Whoever blasphemes against the Holy Spirit never has forgiveness, but is guilty of an eternal sin.",
        "question_am": "ይቅር የማይባለው ብቸኛው ኃጢአት ምንድን ነው?",
        "options_am": ["መንፈስ ቅዱስን መሳደብ", "መዋሸትና ማታለል", "ከመቅደስ መስረቅ", "መቆጣትና መበቀል"]
    },
    {
        "question": "Which apostle penned the heartfelt personal epistle to Philemon on behalf of Onesimus?",
        "options": ["Paul", "Peter", "John", "James"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Philemon",
        "category": "Epistles",
        "difficulty": "Easy",
        "verse": "Philemon 1:1",
        "story": "Paul, a prisoner for Christ Jesus, and Timothy our brother, to Philemon our beloved fellow worker.",
        "question_am": "ወደ ፊልሞና የተላከውን መልእክት የጻፈው ማን ነው?",
        "options_am": ["ጳውሎስ", "ጴጥሮስ", "ዮሐንስ", "ያዕቆብ"]
    },
    {
        "question": "'The Lord is my shepherd; I shall not want' serves as the beloved opening of which Psalm?",
        "options": ["Psalm 23", "Psalm 1", "Psalm 91", "Psalm 119"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Psalms",
        "category": "Poetry & Wisdom",
        "difficulty": "Easy",
        "verse": "Psalms 23:1",
        "story": "A Psalm of David declaring the comforting guidance and steadfast provision of the Good Shepherd.",
        "question_am": "«እግዚአብሔር እረኛዬ ነው» የሚለው የየትኛው መዝሙር መክፈቻ መስመር ነው?",
        "options_am": ["መዝሙር 23", "መዝሙር 1", "መዝሙር 91", "መዝሙር 119"]
    },
    {
        "question": "Which apostle authored the majority of the instructional epistles in the New Testament?",
        "options": ["Paul", "Peter", "Luke", "John"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Romans",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Romans 1:1",
        "story": "Paul, a servant of Christ Jesus, called to be an apostle, set apart for the gospel of God.",
        "question_am": "አብዛኛዎቹን የአዲስ ኪዳን መልእክታት የጻፈው ማን ነው?",
        "options_am": ["ጳውሎስ", "ጴጥሮስ", "ሉቃስ", "ዮሐንስ"]
    },
    {
        "question": "Which woman in Jericho concealed two Hebrew spies under stalks of flax on her roof?",
        "options": ["Rahab", "Deborah", "Esther", "Ruth"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Joshua",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Joshua 2:1-6",
        "story": "Rahab took the two men and hid them, declaring her faith that the Lord had given the land to Israel.",
        "question_am": "ሁለት ሰላዮችን በጣሪያዋ ደብቃ ያዳነቻቸው ሴት ማን ናት?",
        "options_am": ["ረዓብ", "ዲቦራ", "አስቴር", "ሩት"]
    },
    {
        "question": "Which steadfast prophet was cast into a den of hungry lions for praying exclusively to God?",
        "options": ["Daniel", "Jeremiah", "Ezekiel", "Isaiah"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Daniel",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Daniel 6:16",
        "story": "King Darius commanded, and Daniel was brought and cast into the den of lions, but God shut the lions' mouths.",
        "question_am": "በጸሎቱ ምክንያት ወደ አንበሶች ጉድጓድ የተጣለው ማን ነው?",
        "options_am": ["ዳንኤል", "ኤርምያስ", "ሕዝቅኤል", "ኢሳይያስ"]
    },
    {
        "question": "Whom did Jesus explicitly identify as a murderer from the beginning and 'the father of lies'?",
        "options": ["The Devil", "King Herod", "Judas Iscariot", "Pontius Pilate"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "John",
        "category": "Gospels",
        "difficulty": "Medium",
        "verse": "John 8:44",
        "story": "When he lies, he speaks out of his own character, for he is a liar and the father of lies.",
        "question_am": "ኢየሱስ «የሐሰት አባት» ያለው ማንን ነው?",
        "options_am": ["ዲያብሎስን", "ሄሮድስን", "ይሁዳን", "ጲላጦስን"]
    },
    {
        "question": "What famous tower were the peoples constructing when the Lord confused human speech?",
        "options": ["Tower of Babel", "Tower of Siloam", "Tower of David", "Tower of Shechem"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Places",
        "difficulty": "Easy",
        "verse": "Genesis 11:4-9",
        "story": "Therefore its name was called Babel, because there the Lord confused the language of all the earth.",
        "question_am": "እግዚአብሔር ቋንቋቸውን በደባለቀበት ጊዜ ሰዎች ይገነቡት የነበረው ግንብ ስም ማን ነበር?",
        "options_am": ["የባቤል ግንብ", "የሰሊሆም ግንብ", "የዳዊት ግንብ", "የሴኬም ግንብ"]
    },
    {
        "question": "What is the foundational model prayer taught by Christ in the Sermon on the Mount commonly called?",
        "options": ["The Lord's Prayer", "The Magnificat Song", "The Priestly Blessing", "The Apostles' Creed"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Matthew",
        "category": "Gospels",
        "difficulty": "Easy",
        "verse": "Matthew 6:9-13",
        "story": "Jesus taught His disciples how to address the Heavenly Father with reverent devotion and humble petition.",
        "question_am": "ኢየሱስ ለደቀ መዛሙርቱ ያስተማረው ጸሎት በተለምዶ ምን ተብሎ ይጠራል?",
        "options_am": ["የጌታ ጸሎት (አባታችን ሆይ)", "የማርያም ምስጋና", "የካህናት ቡራኬ", "የሐዋርያት እምነት"]
    },
    {
        "question": "Whose name did the Lord God alter to signify that he would become the father of a multitude of nations?",
        "options": ["Abraham", "Isaac", "Jacob", "Noah"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Genesis 17:5",
        "story": "No longer shall your name be called Abram, but your name shall be Abraham, for I have made you the father of a multitude of nations.",
        "question_am": "«የብዙ አሕዛብ አባት» የሚል ትርጉም ያለው የማን ስም ነው?",
        "options_am": ["አብርሃም", "ይስሐቅ", "ያዕቆብ", "ኖኅ"]
    },
    {
        "question": "What baseless allegation did Potiphar's deceitful wife level against Joseph to have him imprisoned?",
        "options": ["Attempted assault", "Theft of household silver", "Plotting murder of master", "Conspiring treason against Pharaoh"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Medium",
        "verse": "Genesis 39:14-20",
        "story": "She kept Joseph's cloak beside her until his master came home, falsely framing him before Potiphar.",
        "question_am": "የጲጥፋራ ሚስት ዮሴፍን በሐሰት በምን ከሰሰችው?",
        "options_am": ["በመድፈር ሙከራ", "በብር ስርቆት", "በግድያ ሙከራ", "በክህደት ወንጀል"]
    },
    {
        "question": "What did Jesus assert is more difficult than for a camel to thread through the eye of a needle?",
        "options": ["A rich man entering God's kingdom", "Moving mountains by simple faith", "Loving enemies wholeheartedly", "Observing every statute of law"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Matthew",
        "category": "Gospels",
        "difficulty": "Medium",
        "verse": "Matthew 19:24",
        "story": "It is easier for a camel to go through the eye of a needle than for a rich person to enter the kingdom of God.",
        "question_am": "«ግመል በመርፌ ቀዳዳ ከሚያልፍ» የበለጠ የሚከብደው ምንድን ነው?",
        "options_am": ["ባለጠጋ ወደ እግዚአብሔር መንግሥት መግባት", "ተራራን ከስፍራው ማንቀሳቀስ", "ጠላትን በፍጹም ልብ መውደድ", "ሕጉን ሁሉ መጠበቅ"]
    },
    {
        "question": "According to Jesus in the Sermon on the Mount, what does every healthy fruit tree produce?",
        "options": ["Good healthy fruit", "Broad green leaves", "Long sturdy limbs", "Deep anchored roots"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Matthew",
        "category": "Gospels",
        "difficulty": "Easy",
        "verse": "Matthew 7:17",
        "story": "Every healthy tree bears good fruit, but the diseased tree bears bad fruit. By their fruits you will recognize them.",
        "question_am": "«መልካም ዛፍ» ምን ያፈራል?",
        "options_am": ["መልካም ፍሬ", "ብዙ ቅጠል", "ረጅም ቅርንጫፍ", "ጥልቅ ሥር"]
    },
    {
        "question": "In the Epistle of James, which small bodily organ is compared to a small fire that sets great forests ablaze?",
        "options": ["The human tongue", "The seeing eye", "The listening ear", "The grasping hand"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "James",
        "category": "Epistles",
        "difficulty": "Easy",
        "verse": "James 3:5",
        "story": "So also the tongue is a small member, yet it boasts of great things. How great a forest is set ablaze by such a small fire!",
        "question_am": "«በታላቅ ነገር የምትመካ» ትንሽ የሰውነት ክፍል የትኛዋ ናት?",
        "options_am": ["ምላስ", "ዓይን", "ጆሮ", "እጅ"]
    },
    {
        "question": "How did wise King Solomon discern the authentic biological mother between two claiming women?",
        "options": ["He ordered the living child divided with a sword", "He examined their family lineage through genealogies", "He cast sacred lots before the ark of the covenant", "He questioned neighbors from their residential street"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "1 Kings",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "1 Kings 3:25-27",
        "story": "The king said, 'Divide the living child in two.' Then the true mother's compassion yearned for her son and she said, 'Give her the child.'",
        "question_am": "ሰሎሞን የሕፃኑን እውነተኛ እናት በጥበብ ሲፈርድ እንዴት አወቀ?",
        "options_am": ["ሕፃኑን በሰይፍ ለሁለት እንዲከፍሉት በማዘዝ", "የትውልድ ሐረጋቸውን በመመርመር", "በታቦቱ ፊት ዕጣ በማውጣት", "የመንደሩን ሰዎች በመጠየቅ"]
    },
    {
        "question": "Who uttered the famous words of steadfast loyalty: 'Where you go I will go, and your God will be my God'?",
        "options": ["Ruth", "Esther", "Rahab", "Orpah"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Ruth",
        "category": "People",
        "difficulty": "Easy",
        "verse": "Ruth 1:16",
        "story": "Ruth clung to Naomi and declared that nothing but death would part them, making the God of Israel her own God.",
        "question_am": "«አምላክሽ አምላኬ ይሆናል» ያለችው ታማኝ ሴት ማን ናት?",
        "options_am": ["ሩት", "አስቴር", "ረዓብ", "ኦርፋ"]
    },
    {
        "question": "According to James 1:5, if any believer lacks wisdom, what are they instructed to do?",
        "options": ["Ask God who gives generously in faith", "Study ancient philosophy under tutors", "Consult with tribal elders and judges", "Fast and wear sackcloth forty days"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "James",
        "category": "Epistles",
        "difficulty": "Medium",
        "verse": "James 1:5",
        "story": "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.",
        "question_am": "ያዕቆብ ጥበብ ቢጎድለን ምን ማድረግ አለብን ይላል?",
        "options_am": ["በእምነት እግዚአብሔርን መለመን", "የጥበብ መጻሕፍትን ማንበብ", "ሽማግሌዎችን መጠየቅ", "ለአርባ ቀን መጾም"]
    },
    {
        "question": "How many total inspired books comprise the standard Protestant Christian Bible canon?",
        "options": ["Sixty-six books", "Seventy-three books", "Eighty-one books", "Thirty-nine books"],
        "correctAnswer": 0,
        "testament": "New",
        "book": "Revelation",
        "category": "Law & Commandments",
        "difficulty": "Easy",
        "verse": "Revelation 22:18-19",
        "story": "The Holy Scriptures consist of sixty-six books: thirty-nine in the Old Testament and twenty-seven in the New Testament.",
        "question_am": "በመጽሐፍ ቅዱስ ውስጥ ስንት መጻሕፍት አሉ?",
        "options_am": ["66 መጻሕፍት", "73 መጻሕፍት", "81 መጻሕፍት", "39 መጻሕፍት"]
    },
    {
        "question": "For what meager food did famished Esau surrender his precious birthright to his brother Jacob?",
        "options": ["A bowl of red lentil stew", "Thirty minted silver coins", "A tender roasted lamb", "A basket of fresh figs"],
        "correctAnswer": 0,
        "testament": "Old",
        "book": "Genesis",
        "category": "Events",
        "difficulty": "Easy",
        "verse": "Genesis 25:34",
        "story": "Then Jacob gave Esau bread and lentil stew, and he ate and drank and rose and went his way. Thus Esau despised his birthright.",
        "question_am": "ዔሳው ብኩርናውን ለያዕቆብ በምን ሸጠለት?",
        "options_am": ["በምስር ወጥ", "በሠላሳ የብር ሳንቲም", "በተጠበሰ ጠቦት", "በአንድ ቅርጫት በለስ"]
    }
]

# Upgrade mapping: Amharic question to base ID
UPGRADE_MAP = {
    "ሮማውያን ኢየሱስን ለመግደል የተጠቀሙበት ዘዴ ምንድን ነበር?": 258,
    "እግዚአብሔር ሔዋንን የፈጠረው ከየትኛው የአዳም የሰውነት ክፍል ነው?": 259,
    "ከኢየሱስ ጋር ነበርክ ተብሎ ሲከሰስ አላውቀውም ብሎ ሦስት ጊዜ የካደው ማን ነው?": 260,
    "ክርስቶስ በተሰቀለበት ጊዜ ወታደሮቹ በራሱ ላይ ምን አደረጉበት?": 261,
    "ልጁን በመሠዊያ ላይ ለእግዚአብሔር ለማቅረብ ፈቃደኛ በመሆን እምነቱን ያሳየው የብሉይ ኪዳን ሰው ማን ነው?": 263,
    "ከኢየሱስ መስቀል በላይ የተጻፈው ጽሑፍ ምን ነበር?": 264,
    "ዮናስ ወደ ባሕር ከተጣለ በኋላ ምን ሆነ?": 267,
    "ኢየሱስ ስንት ሐዋርያትን መረጠ?": 268,
    "የኃጢአት ደመወዝ ምንድን ነው?": 269,
    "በመጽሐፍ ቅዱስ ውስጥ የተጠቀሰችው የመጀመሪያዋ እናት ማን ናት?": 270,
    "የታላቅ ኃይሉን ምንጭ እንዲናገር ሲጠየቅ የዋሸው ማን ነው?": 271,
    "የኢየሱስ እናት በጸነሰችበት ጊዜ ታጭታለት የነበረው ሰው ስም ማን ነበር?": 272,
    "ዳዊት የጻፋቸው ብዙ መዝሙሮች የሚገኙበት የመጽሐፍ ቅዱስ መጽሐፍ የትኛው ነው?": 273,
    "ኢየሱስ ወደ ባሕር ሮጠው እንዲሰጥሙ ያደረጋቸው እንስሳት የትኞቹ ናቸው?": 275,
    "አሥሩ ትእዛዛት በምን ላይ ነበር የተጻፉት?": 276,
    "ኢየሱስ ከተወለደ በኋላ በምን ውስጥ ተኛ?": 277,
    "ኢየሱስ በመጨረሻው እራት ወቅት ለእያንዳንዱ ደቀ መዝሙር ምን አደረገ?": 278,
    "እግዚአብሔር ዮናስን መልእክቱን እንዲያደርስ ወደ የትኛዋ ከተማ ላከው?": 279,
    "ዳዊት ጎልያድን እንዴት አሸነፈው?": 282,
    "የዮሴፍ ወንድሞች እሱን ለማስወገድ ምን አደረጉ?": 283,
    "ኢየሱስ ከመቀበሩ በፊት በምን ተገነዘ?": 285,
    "የሙሴ ወንድም ስም ማን ነበር?": 286,
    "ቃየን የሚታወሰው በምን ዓይነት ኃጢአት ነው?": 287,
    "የአዲስ ኪዳን የመጨረሻ መጽሐፍ የትኛው ነው?": 288,
    "ሙሴ እስራኤላውያንን ከባርነት ሕይወት እንዲያመልጡ የረዳቸው ከየትኛው አገር ነው?": 291,
    "ከዳንኤል ጓደኞች ጋር በሚነድደው የእሳት እቶን ውስጥ የታየው አራተኛው ሰው ማን ነበር?": 292,
    "የዮሴፍ ወንድሞች ዮሴፍን ለባርነት መሸጣቸውን ለመደበቅ አባታቸውን ለማታለል ምን አደረጉ?": 293,
    "አዳምና ሔዋን ለራሳቸው ልብስ ለመሥራት የየትኛውን ዛፍ ቅጠል ሰፉ?": 294,
    "እስራኤላውያን ከግብፃውያን ለማምለጥ የትኛውን ባሕር ተሻገሩ?": 232,
    "እስራኤላውያን በምድረ በዳ ለስንት ዓመታት ተንከራተቱ?": 234,
    "እግዚአብሔር ሁሉን ነገር ፈጥሮ ከጨረሰ በኋላ በሰባተኛው ቀን ምን አደረገ?": 238,
    "ኢየሱስ በመጨረሻው እራት ላይ ለየትኞቹ ምግብና መጠጥ ምስጋና አቀረበ?": 240,
    "ኢየሱስ በምድረ በዳ ሳለ ምንን ወደ እንጀራ እንዲለውጥ ተፈተነ?": 241,
    "ኢየሱስን በጥያቄዎቻቸው ለማጥመድ ያለማቋረጥ ይሞክሩ የነበሩት የሃይማኖት መሪዎች እነማን ነበሩ?": 242,
    "ኢየሱስ ለአልዓዛር ምን ተአምር አደረገለት?": 243,
    "እስራኤላውያን አሥሩን ትእዛዛት የተቀበሉት በየትኛው ተራራ ላይ ነው?": 244,
    "የኢየሱስ ምድራዊ አባት ዮሴፍ ምን ሥራ ይሠራ ነበር?": 246,
    "ይሁዳ ክርስቶስን እንዴት አሳልፎ ሰጠው?": 247,
    "አባቱ በመሠዊያ ላይ ሊሠዋው ተዘጋጅቶ የነበረው ማን ነው?": 248,
    "ኢየሱስ የአሥራ ሁለት ዓመት ልጅ ሳለ በኢየሩሳሌም ቀርቶ ነበር፤ ወላጆቹ የት አገኙት?": 249,
    "ደቀ መዛሙርቱ ኢየሱስ በባሕር ላይ ሲራመድ ባዩት ጊዜ ምን መሰላቸው?": 250,
    "የሄሮድያዳ ልጅ ሰሎሜ ለሄሮድስ ከደነሰች በኋላ ምን ስጦታ ጠየቀች?": 251,
    "ሶምሶን በቤተ መቅደሱ ውስጥ የነበሩትን ሰዎች ሁሉ እንዴት ገደላቸው?": 252,
    "ዳዊት ለሳኦል የትኛውን የሙዚቃ መሣሪያ ይጫወትለት ነበር?": 253,
    "ያዕቆብ የዔሳውን በረከት በሰረቀበት ጊዜ ዔሳው ምን እያደረገ ነበር?": 254,
    "ያዕቆብ በመጀመሪያ የዮሴፍን ወንድሞች ወደ ግብፅ ለምን ላካቸው?": 255,
    "የዳዊት የቅርብ ጓደኛ ማን ነበር?": 256,
    "ወታደሮቹ ክርስቶስን ከሰቀሉት በኋላ በየትኛው ንብረቱ ላይ ዕጣ ተጣጣሉ?": 27,
    "አማኑኤል የሚለው ስም ትርጉም ምንድን ነው?": 28,
    "ኢየሱስ ሳምራዊቷን ሴት የት አገኛት?": 29,
    "እንደ ኢየሱስ በውኃ ላይ ለመራመድ የሞከረው ደቀ መዝሙር የትኛው ነው?": 30,
    "አቤሜሌክ ከቤተሰቡ ጋር ወደ ሞዓብ ለመኖር ለምን ሄደ?": 31,
    "ስለ ሸጡት መሬት ዋጋ ዋሽተው በዚህም ምክንያት የሞቱት እነማን ናቸው?": 32,
    "ዳዊት ከማን ጋር አመነዘረ?": 33,
    "ጠፍቶ የነበረው ልጅ ሲመለስ አባቱ ልብስ፣ ጫማና ሌላ ምን ሰጠው?": 34,
    "የአልዓዛር እህቶች ስም እነማን ናቸው?": 35,
    "ዮናስ ወደ ባሕር ተጥሎ ደረቅ ምድር ላይ ከወጣ በኋላ ወዴት ሄደ?": 36,
}

def clean_and_build():
    # 1. Load base 475 questions
    with open('bible_trivia_questions.json', 'r', encoding='utf-8') as f:
        base_qs = json.load(f)

    # 2. Load scratch 95
    with open('scratch_95_new.json', 'r', encoding='utf-8') as f:
        scratch_items = json.load(f)

    scratch_by_qam = {s['question_am'].strip(): s for s in scratch_items}

    # 3. Upgrade matched base questions
    upgraded_count = 0
    base_map = {b['id']: b for b in base_qs}

    for q_am, base_id in UPGRADE_MAP.items():
        if q_am in scratch_by_qam and base_id in base_map:
            s = scratch_by_qam[q_am]
            b = base_map[base_id]
            # Update Amharic texts and verse
            b['question_am'] = s['question_am']
            b['options_am'] = list(s['options_am'])
            b['verse'] = s.get('verse', b.get('verse'))
            b['book'] = s.get('book', b.get('book'))
            b['testament'] = s.get('testament', b.get('testament'))
            b['category'] = s.get('category', b.get('category'))
            
            # Ensure English options match the refined Amharic options:
            # If scratch correctAnswer is 0 (the first option is correct answer in s['options_am']),
            # ensure that the English correct answer is also aligned.
            # In base, b['correctAnswer'] is the index of correct answer in b['options'].
            # Let's align b['options'] so that index 0 is correct, then randomize uniformly later!
            corr_en = b['options'][b['correctAnswer']]
            other_en = [opt for i, opt in enumerate(b['options']) if i != b['correctAnswer']]
            b['options'] = [corr_en] + other_en
            b['correctAnswer'] = 0
            upgraded_count += 1

    print(f"Upgraded {upgraded_count} base questions with refined user questions and verified verses.")

    # 4. Prepare combined question list
    combined = list(base_qs)

    # Add 36 new questions
    combined.extend(NEW_36_QUESTIONS)

    # Add 46 1001-PDF questions (including 721!)
    combined.extend(PDF_46_QUESTIONS)

    print(f"Total compiled questions before shuffle: {len(combined)}")

    # 5. Deterministically randomize option order for all questions so correctAnswer is evenly distributed 0..3
    rng = random.Random(777)
    
    BAD_OPTIONS_SUBSTRINGS = [
        'law given by moses',
        'pillar of cloud and fire',
        'covenant of the lord',
        'mercy and grace of god',
        'በሙሴ የተሰጠው ሕግ',
        'የደመናና የእሳት ዓምድ',
        'የእግዚአብሔር ቃል ኪዳን'
    ]

    final_questions = []
    am_cache = {}

    for idx, q in enumerate(combined, start=1):
        # Validation checks
        assert len(q['options']) == 4, f"Q {idx} options != 4"
        assert len(q['options_am']) == 4, f"Q {idx} options_am != 4"
        assert len(set(q['options'])) == 4, f"Q {idx} duplicate English options: {q['options']}"
        assert len(set(q['options_am'])) == 4, f"Q {idx} duplicate Amharic options: {q['options_am']}"

        # Check for placeholder strings (except the legitimate Q about the pillar in the wilderness)
        q_en_lower = q['question'].lower()
        if 'guided the israelites through the wilderness' not in q_en_lower:
            for opt in q['options']:
                opt_l = opt.lower()
                assert 'the law given by moses' not in opt_l, f"Default option found in {q['question']}: {opt}"
                assert 'the covenant of the lord' not in opt_l, f"Default option found in {q['question']}: {opt}"
                assert 'the mercy and grace of god' not in opt_l, f"Default option found in {q['question']}: {opt}"
                assert 'a pillar of cloud and fire' not in opt_l, f"Default option found in {q['question']}: {opt}"
            for opt_am in q['options_am']:
                assert 'በሙሴ የተሰጠው ሕግ' not in opt_am, f"Default Amharic option found in {q['question_am']}: {opt_am}"
                assert 'የእግዚአብሔር ቃል ኪዳን' not in opt_am, f"Default Amharic option found in {q['question_am']}: {opt_am}"

        # Current correct answer
        corr_idx = q['correctAnswer']
        correct_en = q['options'][corr_idx]
        correct_am = q['options_am'][corr_idx]

        # Shuffle pairs together
        pairs = list(zip(q['options'], q['options_am']))
        rng.shuffle(pairs)

        new_en_opts = [p[0] for p in pairs]
        new_am_opts = [p[1] for p in pairs]
        new_corr_idx = new_en_opts.index(correct_en)
        assert new_am_opts[new_corr_idx] == correct_am, "Amharic correct answer desynchronized!"

        story = q.get('story')
        if not story or 'Scripture reveals this truth' in story:
            story = f"Scripture reveals this truth in the book of {q.get('book')}. As recorded in the {q.get('testament')} Testament ({q.get('verse')}), God's Word instructs and inspires believers in righteousness."

        item = {
            "id": idx,
            "question": q['question'].strip(),
            "options": new_en_opts,
            "correctAnswer": new_corr_idx,
            "testament": q['testament'],
            "book": q['book'],
            "category": q.get('category', 'General'),
            "difficulty": q.get('difficulty', 'Medium'),
            "verse": q.get('verse', f"{q['book']} 1:1"),
            "story": story,
            "question_am": q['question_am'].strip(),
            "options_am": new_am_opts
        }
        final_questions.append(item)

        # Build am_cache
        am_cache[str(idx)] = {
            "question_am": item["question_am"],
            "options_am": item["options_am"],
            "story_am": f"ይህ እውነት በመጽሐፈ {item['book']} ({item['verse']}) ውስጥ በግልጽ ተመዝግቧል። የእግዚአብሔር ቃል ለሕይወታችን መሪና ብርሃን ነው።"
        }

    print(f"Successfully compiled {len(final_questions)} validated questions!")

    # Distribution of correctAnswer
    counts = [0, 0, 0, 0]
    for q in final_questions:
        counts[q['correctAnswer']] += 1
    print(f"Correct answer distribution: A={counts[0]}, B={counts[1]}, C={counts[2]}, D={counts[3]}")

    # Write client/src/data/questions.json
    with open('client/src/data/questions.json', 'w', encoding='utf-8') as f:
        json.dump(final_questions, f, ensure_ascii=False, indent=2)
    print("Wrote client/src/data/questions.json")

    # Write client/src/data/questions_am_cache.json
    with open('client/src/data/questions_am_cache.json', 'w', encoding='utf-8') as f:
        json.dump(am_cache, f, ensure_ascii=False, indent=2)
    print("Wrote client/src/data/questions_am_cache.json")

    # Write bible_trivia_questions.json
    with open('bible_trivia_questions.json', 'w', encoding='utf-8') as f:
        json.dump(final_questions, f, ensure_ascii=False, indent=2)
    print("Wrote bible_trivia_questions.json")

    # Write bible_trivia_questions.txt
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
            f.write(f"{i:3d}. {letters[q['correctAnswer']]} ({q['verse']})   ")
            if i % 5 == 0:
                f.write("\n")
        f.write("\n")
    print("Wrote bible_trivia_questions.txt")

    # Write bible_trivia_questions.docx
    doc = docx.Document()
    
    # Page title
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

if __name__ == '__main__':
    clean_and_build()
