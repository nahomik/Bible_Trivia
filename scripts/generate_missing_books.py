#!/usr/bin/env python3
import os
import json
import re

BOOKS_DATA = {
    "01-genesis": {
        "num": "01",
        "book": "Genesis",
        "t": "Old",
        "questions": [
            ("Who created the heavens and the earth?", "God", ["Moses", "Abraham", "Noah"], "Creation", "Easy"),
            ("What did God create on the first day?", "Light", ["Sun", "Moon", "Stars"], "Creation", "Easy"),
            ("What was the name of the first man?", "Adam", ["Seth", "Enoch", "Cain"], "People", "Easy"),
            ("From what was Eve created?", "Adam's rib", ["Clay", "River water", "Garden leaves"], "People", "Easy"),
            ("What was the name of the garden where Adam and Eve lived?", "Garden of Eden", ["Garden of Bethel", "Garden of Canaan", "Garden of Gethsemane"], "Places", "Easy"),
            ("Who tempted Eve in the garden?", "The serpent", ["A raven", "The dove", "A lion"], "Events", "Easy"),
            ("Who was the firstborn son of Adam and Eve?", "Cain", ["Abel", "Seth", "Enoch"], "People", "Easy"),
            ("Whose offering was accepted by God?", "Abel's offering", ["Cain's offering", "Lamech's offering", "Enoch's offering"], "Events", "Easy"),
            ("Who built the Ark to survive the Great Flood?", "Noah", ["Methuselah", "Enoch", "Lamech"], "People", "Easy"),
            ("For how many days and nights did rain fall during the Flood?", "Forty days", ["Seven days", "Twenty days", "Fifty days"], "Numbers", "Easy"),
            ("What was the sign of God's covenant with Noah?", "The rainbow", ["A burning bush", "A pillar of cloud", "A stone altar"], "Events", "Easy"),
            ("What tower did men attempt to build to reach heaven?", "Tower of Babel", ["Tower of Siloam", "Tower of Shechem", "Tower of Penuel"], "Places", "Easy"),
            ("Who was called by God to leave Ur of the Chaldees?", "Abraham", ["Lot", "Terah", "Nahor"], "People", "Easy"),
            ("Who was Abraham's wife who bore Isaac in her old age?", "Sarah", ["Hagar", "Keturah", "Milcah"], "People", "Easy"),
            ("Who was Abraham's nephew who chose to live near Sodom?", "Lot", ["Eliezer", "Ishmael", "Laban"], "People", "Easy"),
            ("Into what did Lot's wife turn when she looked back at Sodom?", "A pillar of salt", ["A stone monument", "A heap of dust", "A bronze statue"], "Events", "Easy"),
            ("Who was Abraham's firstborn son through Hagar?", "Ishmael", ["Isaac", "Midian", "Zimran"], "People", "Easy"),
            ("On which mountain was Abraham tested to offer Isaac?", "Mount Moriah", ["Mount Sinai", "Mount Carmel", "Mount Nebo"], "Places", "Medium"),
            ("Who became the wife of Isaac at the well in Nahor?", "Rebekah", ["Rachel", "Leah", "Bilhah"], "People", "Easy"),
            ("Who were the twin sons born to Isaac and Rebekah?", "Jacob and Esau", ["Cain and Abel", "Joseph and Benjamin", "Ephraim and Manasseh"], "People", "Easy"),
            ("For what did Esau sell his birthright to Jacob?", "A bowl of stew", ["Ten silver coins", "A flock of sheep", "A linen garment"], "Events", "Easy"),
            ("What did Jacob see in his dream at Bethel?", "A ladder reaching to heaven", ["A burning chariot", "A golden lampstand", "A valley of dry bones"], "Events", "Easy"),
            ("For how many total years did Jacob work for Laban to marry Rachel?", "Fourteen years", ["Seven years", "Ten years", "Twenty years"], "Numbers", "Medium"),
            ("What new name did God give Jacob after he wrestled at Peniel?", "Israel", ["Judah", "Ephraim", "Zion"], "People", "Easy"),
            ("Who was Jacob's favorite son who received a coat of many colors?", "Joseph", ["Benjamin", "Reuben", "Judah"], "People", "Easy"),
            ("What did Joseph's brothers do with him after casting him into a pit?", "Sold him into slavery", ["Left him to starve", "Sent him to Syria", "Took him to Canaan"], "Events", "Easy"),
            ("Whose dreams did Joseph interpret while in Pharaoh's prison?", "The cupbearer and baker", ["The royal guards", "The chief magicians", "The palace priests"], "Events", "Medium"),
            ("How many years of famine did Pharaoh's dream predict?", "Seven years", ["Three years", "Ten years", "Twelve years"], "Numbers", "Easy"),
            ("To what position was Joseph elevated in Egypt?", "Prime ruler under Pharaoh", ["Captain of the guard", "Chief cupbearer", "Royal scribe"], "People", "Easy"),
            ("Who was the youngest son of Jacob and Rachel?", "Benjamin", ["Dan", "Gad", "Asher"], "People", "Easy")
        ]
    },
    "02-exodus": {
        "num": "02",
        "book": "Exodus",
        "t": "Old",
        "questions": [
            ("In what was baby Moses placed by his mother along the Nile?", "An ark of bulrushes", ["A wooden box", "A clay jar", "A linen bundle"], "Events", "Easy"),
            ("Who found baby Moses floating in the river?", "Pharaoh's daughter", ["Pharaoh's wife", "A Hebrew midwife", "A temple priestess"], "People", "Easy"),
            ("Where did Moses flee after killing an Egyptian taskmaster?", "The land of Midian", ["The land of Moab", "The desert of Paran", "The hills of Edom"], "Places", "Medium"),
            ("Through what miraculous sign did God first speak to Moses?", "A burning bush", ["A cloud of fire", "A roaring thunder", "A golden trumpet"], "Events", "Easy"),
            ("What name did God reveal to Moses from the burning bush?", "I AM WHO I AM", ["The Almighty King", "The Ancient of Days", "The God of Hosts"], "General Knowledge", "Medium"),
            ("Who was appointed by God to be Moses' spokesman?", "Aaron his brother", ["Joshua his servant", "Hur his companion", "Caleb his friend"], "People", "Easy"),
            ("What was the first plague sent upon Egypt?", "Water turned to blood", ["Swarm of frogs", "Plague of locusts", "Thick darkness"], "Events", "Easy"),
            ("What happened to the Egyptian magicians' rods when Aaron cast down his staff?", "Aaron's rod swallowed theirs", ["Their rods vanished", "Their rods broke", "Their rods turned to dust"], "Miracles", "Medium"),
            ("What food did the Israelites eat on the first Passover night?", "Roasted lamb and bitter herbs", ["Fresh bread and honey", "Figs and pomegranates", "Boiled beef and barley"], "Events", "Medium"),
            ("Where did the Israelites place lamb's blood on Passover?", "On their doorposts", ["On their hearths", "On their gates", "On their foreheads"], "Events", "Easy"),
            ("Through what body of water did God miraculously part a path?", "The Red Sea", ["The River Jordan", "The Dead Sea", "The Sea of Galilee"], "Places", "Easy"),
            ("What miracle drowned Pharaoh's army pursuing Israel?", "The returning sea waters", ["A shower of hailstones", "A great earthquake", "A blast of fire"], "Miracles", "Easy"),
            ("What miraculous bread did God rain from heaven in the wilderness?", "Manna", ["Showbread", "Oatmeal", "Barley loaves"], "Miracles", "Easy"),
            ("From what did Moses produce drinking water when he struck it with his staff?", "A great rock", ["A sandy dune", "A dry well", "A hollow tree"], "Miracles", "Easy"),
            ("On which mountain did Moses receive the Ten Commandments?", "Mount Sinai", ["Mount Nebo", "Mount Carmel", "Mount Tabor"], "Places", "Easy"),
            ("On what did God write the Ten Commandments?", "Two stone tablets", ["Bronze plates", "Papyrus scrolls", "Wooden boards"], "Events", "Easy"),
            ("What golden idol did Aaron fashion while Moses was on the mountain?", "A golden calf", ["A golden eagle", "A golden serpent", "A golden lion"], "Events", "Easy"),
            ("What did Moses do when he saw the people worshiping the golden idol?", "He shattered the stone tablets", ["He fled into the desert", "He called for lightning", "He wept in his tent"], "Events", "Medium"),
            ("What sacred portable sanctuary did Israel build in the desert?", "The Tabernacle", ["The High Tower", "The Cedar Palace", "The Sacred Citadel"], "Places", "Easy"),
            ("What sacred chest held the stone tablets of the testimony?", "The Ark of the Covenant", ["The Altar of Incense", "The Golden Basin", "The Table of Bread"], "Events", "Easy")
        ]
    },
    "03-leviticus": {
        "num": "03",
        "book": "Leviticus",
        "t": "Old",
        "questions": [
            ("Who was consecrated as Israel's first high priest?", "Aaron", ["Moses", "Eleazar", "Phinehas"], "People", "Easy"),
            ("Which tribe was consecrated for priestly tabernacle service?", "The tribe of Levi", ["The tribe of Judah", "The tribe of Ephraim", "The tribe of Dan"], "People", "Easy"),
            ("What special holy day was observed once a year for national atonement?", "Day of Atonement Yom Kippur", ["Feast of Tabernacles", "Feast of Weeks", "Feast of Trumpets"], "Events", "Medium"),
            ("What was done to the scapegoat on the Day of Atonement?", "Sent away into the wilderness", ["Sacrificed on the altar", "Given to the priests", "Released into the sea"], "Events", "Medium"),
            ("Which two sons of Aaron died for offering unauthorized fire before the Lord?", "Nadab and Abihu", ["Hophni and Phinehas", "Eleazar and Ithamar", "Korah and Dathan"], "People", "Hard"),
            ("What was strictly prohibited from being eaten according to Leviticus?", "Blood", ["Olive oil", "Bitter herbs", "Wheat flour"], "Law", "Medium"),
            ("What famous commandment found in Leviticus 19 did Jesus call the second greatest?", "Love your neighbor as yourself", ["Honor the aged", "Give tithes to the poor", "Do not bear false witness"], "General Knowledge", "Easy"),
            ("Every how many years was the Year of Jubilee proclaimed?", "Every fifty years", ["Every seven years", "Every twelve years", "Every seventy years"], "Numbers", "Medium"),
            ("What happened to slaves and land during the Year of Jubilee?", "Debts canceled and slaves freed", ["Taxes doubled", "All temples rebuilt", "New kings anointed"], "Law", "Medium"),
            ("What kept burning perpetually on the tabernacle altar and never went out?", "The sacred altar fire", ["The lamp oil", "The incense smoke", "The holy water"], "Law", "Medium")
        ]
    },
    "04-numbers": {
        "num": "04",
        "book": "Numbers",
        "t": "Old",
        "questions": [
            ("Why is the book of Numbers named 'Numbers'?", "For the census count of Israel", ["For the ten commandments", "For the seven feasts", "For the forty years"], "General Knowledge", "Easy"),
            ("How many spies were sent by Moses to scout the Promised Land?", "Twelve spies", ["Ten spies", "Seven spies", "Two spies"], "Numbers", "Easy"),
            ("Which two faithful spies brought back a courageous, faith-filled report?", "Joshua and Caleb", ["Moses and Aaron", "Nadab and Abihu", "Korah and Dathan"], "People", "Easy"),
            ("How many total years was Israel condemned to wander in the wilderness?", "Forty years", ["Twenty years", "Thirty years", "Fifty years"], "Numbers", "Easy"),
            ("Whose staff miraculously budded, blossomed, and produced ripe almonds?", "Aaron's rod", ["Moses' staff", "Joshua's rod", "Caleb's staff"], "Miracles", "Medium"),
            ("Who led a rebellion against Moses and was swallowed alive by the earth?", "Korah", ["Balaam", "Balak", "Og"], "People", "Medium"),
            ("What animal spoke aloud to rebuke the prophet Balaam?", "His donkey", ["A wild camel", "A mountain sheep", "An ox"], "Miracles", "Easy"),
            ("What king hired Balaam to curse the nation of Israel?", "Balak king of Moab", ["Sihon king of Heshbon", "Og king of Bashan", "Pharaoh of Egypt"], "People", "Medium"),
            ("What did Moses lift up on a pole so those bitten by serpents could look and live?", "A bronze serpent", ["A silver dove", "A golden ram", "A bronze altar"], "Miracles", "Easy"),
            ("What famous blessing begins with 'The Lord bless you and keep you'?", "The Priestly Blessing", ["The Song of Moses", "The Prayer of Jabez", "The Psalm of David"], "General Knowledge", "Easy")
        ]
    },
    "05-deuteronomy": {
        "num": "05",
        "book": "Deuteronomy",
        "t": "Old",
        "questions": [
            ("What does the Greek title 'Deuteronomy' literally mean?", "Second Law", ["Wilderness Wandering", "Book of Blessings", "Priestly Decrees"], "General Knowledge", "Medium"),
            ("What great confession begins with 'Hear O Israel, the Lord our God, the Lord is one'?", "The Shema", ["The Kaddish", "The Hallel", "The Decalogue"], "General Knowledge", "Easy"),
            ("On which mountain did Moses stand to view the Promised Land before his death?", "Mount Nebo", ["Mount Sinai", "Mount Carmel", "Mount Hermon"], "Places", "Easy"),
            ("Who was chosen by God to succeed Moses as the military leader of Israel?", "Joshua son of Nun", ["Caleb son of Jephunneh", "Eleazar the priest", "Phinehas the Levite"], "People", "Easy"),
            ("Who buried Moses in an unmarked valley in the land of Moab?", "God Himself", ["Joshua", "The elders of Israel", "Eleazar"], "Events", "Medium"),
            ("How old was Moses when he died on Mount Nebo?", "One hundred twenty years", ["One hundred ten years", "Ninety years", "One hundred years"], "Numbers", "Medium"),
            ("Which book of the Old Testament did Jesus quote three times during His wilderness temptation?", "Deuteronomy", ["Genesis", "Exodus", "Psalms"], "General Knowledge", "Medium"),
            ("Where were the blessings for obedience and curses for disobedience pronounced?", "Mount Gerizim and Mount Ebal", ["Mount Sinai and Mount Horeb", "Mount Zion and Mount Moriah", "Mount Tabor and Mount Gilboa"], "Places", "Hard"),
            ("What did Moses instruct future kings of Israel to write for themselves?", "A personal copy of the Law", ["A royal biography", "A book of war songs", "A palace ledger"], "Law", "Medium"),
            ("How many cities of refuge were established for those who killed unintentionally?", "Six cities", ["Three cities", "Seven cities", "Twelve cities"], "Numbers", "Medium")
        ]
    },
    "06-joshua": {
        "num": "06",
        "book": "Joshua",
        "t": "Old",
        "questions": [
            ("What river did Israel cross on dry ground to enter Canaan under Joshua?", "The River Jordan", ["The Red Sea", "The River Nile", "The Euphrates"], "Places", "Easy"),
            ("Who hid two Hebrew spies in Jericho under stalks of flax on her roof?", "Rahab the harlot", ["Ruth the Moabitess", "Deborah the judge", "Jael wife of Heber"], "People", "Easy"),
            ("What token did Rahab tie in her window so her family would be spared?", "A scarlet cord", ["A white cloth", "A blue ribbon", "A gold chain"], "Events", "Easy"),
            ("What happened to the high fortified walls of Jericho after Israel marched and shouted?", "They collapsed flat", ["They burned with fire", "They melted like wax", "They were torn by rams"], "Miracles", "Easy"),
            ("Who sinned by stealing forbidden plunder at Jericho, causing defeat at Ai?", "Achan", ["Korah", "Dathan", "Zimri"], "People", "Medium"),
            ("At which battle did Joshua command the sun and moon to stand still?", "Battle of Gibeon", ["Battle of Jericho", "Battle of Hazor", "Battle of Lachish"], "Miracles", "Medium"),
            ("What city's inhabitants tricked Joshua with moldy bread and worn sandals?", "The Gibeonites", ["The Jebusites", "The Amorites", "The Philistines"], "People", "Medium"),
            ("What great declaration did Joshua make: 'As for me and my house...'?", "We will serve the Lord", ["We will conquer Canaan", "We will build the altar", "We will dwell in peace"], "General Knowledge", "Easy"),
            ("Where was the Tabernacle set up during the division of the land in Joshua?", "Shiloh", ["Jerusalem", "Bethel", "Hebron"], "Places", "Medium"),
            ("At what age did Joshua son of Nun die?", "One hundred ten years", ["One hundred twenty years", "One hundred years", "Ninety-five years"], "Numbers", "Hard")
        ]
    },
    "10-2samuel": {
        "num": "10",
        "book": "2 Samuel",
        "t": "Old",
        "questions": [
            ("Over which city was David first anointed king over the tribe of Judah?", "Hebron", ["Jerusalem", "Bethlehem", "Shiloh"], "Places", "Easy"),
            ("What city did David conquer from the Jebusites and make his capital?", "Jerusalem", ["Hebron", "Shechem", "Samaria"], "Places", "Easy"),
            ("What did David do before the Ark of the Covenant as it entered Jerusalem?", "Danced with all his might", ["Blew silver trumpets", "Walked in silent prayer", "Carried the incense burner"], "Events", "Easy"),
            ("Who was Saul's crippled grandson to whom David showed faithful lovingkindness?", "Mephibosheth", ["Ish-Bosheth", "Armoni", "Malki-Shua"], "People", "Medium"),
            ("What covenant promise did God make to David in 2 Samuel 7?", "His throne would endure forever", ["His army would never lose", "His temple would stand for all time", "He would live to old age"], "Prophecy", "Easy"),
            ("Who was the beautiful wife of Uriah the Hittite whom David took?", "Bathsheba", ["Abigail", "Michal", "Ahinoam"], "People", "Easy"),
            ("Which prophet confronted David with the parable of the poor man's ewe lamb?", "Nathan", ["Samuel", "Gad", "Elijah"], "People", "Easy"),
            ("Which rebellious son of David stole the hearts of Israel and led a revolt?", "Absalom", ["Amnon", "Adonijah", "Solomon"], "People", "Easy"),
            ("By what was Absalom caught in the branches of a great oak tree?", "His long hair and head", ["His golden chariot", "His royal armor", "His battle spear"], "Events", "Easy"),
            ("Whose threshing floor did David purchase to build an altar and halt a plague?", "Araunah the Jebusite", ["Naboth the Jezreelite", "Ornan the Hittite", "Barzillai the Gileadite"], "Places", "Hard")
        ]
    },
    "11-1kings": {
        "num": "11",
        "book": "1 Kings",
        "t": "Old",
        "questions": [
            ("Which son of David was anointed king to succeed him on the throne?", "Solomon", ["Adonijah", "Absalom", "Rehoboam"], "People", "Easy"),
            ("When God offered Solomon any gift he desired, what did he ask for?", "An understanding heart and wisdom", ["Great military conquest", "Immense riches and gold", "Long life and health"], "Events", "Easy"),
            ("How did Solomon solve the dispute between two mothers claiming the same infant?", "Proposed dividing the child with a sword", ["Cast lots before the altar", "Consulted the high priest", "Placed the infant in a basket"], "Wisdom", "Easy"),
            ("What magnificent structure did Solomon build in Jerusalem for the Lord?", "The First Temple", ["The High Fortress", "The Cedar Palace", "The Golden Gate"], "Places", "Easy"),
            ("Which foreign queen traveled from afar to test Solomon's famed wisdom?", "The Queen of Sheba", ["Queen Candace of Ethiopia", "Queen Esther of Persia", "Queen Jezebel of Tyre"], "People", "Easy"),
            ("How did the united kingdom of Israel divide after Solomon's death?", "Into Northern Israel and Southern Judah", ["Into three kingdoms", "Into four provinces", "Under Egyptian rule"], "History", "Easy"),
            ("Who became the first king of the rebel northern ten tribes?", "Jeroboam son of Nebat", ["Rehoboam son of Solomon", "Baasha", "Omri"], "People", "Medium"),
            ("Which wicked king of Israel married Phoenician princess Jezebel?", "Ahab", ["Omri", "Jehu", "Ahaziah"], "People", "Easy"),
            ("On which mountain did the prophet Elijah defeat the prophets of Baal?", "Mount Carmel", ["Mount Horeb", "Mount Hermon", "Mount Gilboa"], "Places", "Easy"),
            ("How was Elijah fed while hiding by the Brook Cherith during the drought?", "Ravens brought him bread and meat", ["Angels carried manna", "Shepherds brought figs", "A spring produced milk"], "Miracles", "Easy")
        ]
    },
    "12-2kings": {
        "num": "12",
        "book": "2 Kings",
        "t": "Old",
        "questions": [
            ("How was Elijah taken up into heaven without dying?", "In a whirlwind with chariots of fire", ["In a quiet cloud", "In a pillar of smoke", "By angelic wings"], "Miracles", "Easy"),
            ("Who caught Elijah's falling mantle and asked for a double portion of his spirit?", "Elisha", ["Gehazi", "Obadiah", "Micaiah"], "People", "Easy"),
            ("What Syrian general was cured of leprosy by dipping seven times in the Jordan?", "Naaman", ["Hazael", "Ben-Hadad", "Rezin"], "People", "Easy"),
            ("What servant of Elisha was struck with leprosy for greedily taking gifts?", "Gehazi", ["Balaam", "Ziba", "Doeg"], "People", "Medium"),
            ("What miraculous event happened when an iron axe head fell into the river?", "It floated to the surface", ["It turned to gold", "It vanished into sand", "It split into two"], "Miracles", "Medium"),
            ("Which righteous king of Judah saw 185,000 Assyrian soldiers struck down by an angel?", "Hezekiah", ["Josiah", "Uzziah", "Asa"], "People", "Medium"),
            ("What sign confirmed God would add fifteen years to King Hezekiah's life?", "The sun's shadow moved backward ten steps", ["Fire fell on the altar", "Dew covered the fleece", "A rainbow appeared at noon"], "Miracles", "Hard"),
            ("Which young king repaired the Temple and wept when the Book of the Law was found?", "Josiah", ["Joash", "Manasseh", "Amon"], "People", "Easy"),
            ("What empire conquered the northern kingdom of Israel and deported its ten tribes?", "The Assyrian Empire", ["The Babylonian Empire", "The Persian Empire", "The Roman Empire"], "History", "Medium"),
            ("Which Babylonian king besieged Jerusalem, destroyed the Temple, and carried Judah captive?", "Nebuchadnezzar", ["Cyrus the Great", "Darius the Mede", "Sennacherib"], "People", "Easy")
        ]
    },
    "18-job": {
        "num": "18",
        "book": "Job",
        "t": "Old",
        "questions": [
            ("In which land did Job live?", "The land of Uz", ["The land of Ur", "The land of Midian", "The land of Edom"], "Places", "Easy"),
            ("How was Job described in the opening verse of his book?", "Blameless, upright, fearing God", ["A mighty prophet", "A royal king", "A wise judge"], "General Knowledge", "Easy"),
            ("Who sought permission from God to test Job's faithfulness?", "Satan the adversary", ["A foreign king", "A corrupt priest", "An angry neighbor"], "Events", "Easy"),
            ("What famous response did Job give after losing his wealth and children?", "The Lord gave and the Lord has taken away", ["Why has God forsaken me", "I will leave this land forever", "Woe is me for I am undone"], "Wisdom", "Easy"),
            ("What advice did Job's despairing wife give him during his affliction?", "Curse God and die", ["Pray for deliverance", "Flee to another city", "Make a sacrifice"], "Events", "Medium"),
            ("Name one of the three companions who came to comfort Job.", "Eliphaz the Temanite", ["Nathan the prophet", "Barzillai the Gileadite", "Caleb the Kenizzite"], "People", "Medium"),
            ("Name Job's companion who was from Shuah.", "Bildad the Shuhite", ["Zophar the Naamathite", "Elihu the Buzite", "Eliphaz the Temanite"], "People", "Hard"),
            ("From what did the Lord finally speak to answer Job in chapter 38?", "Out of a whirlwind", ["From a burning bush", "Through a still small voice", "In a dream of the night"], "Events", "Easy"),
            ("What magnificent creature does God describe in Job 40 as having bones like bronze tubes?", "Behemoth", ["Leviathan", "The wild ox", "The great dragon"], "Wisdom", "Hard"),
            ("How did God bless the later part of Job's life compared to his beginning?", "He gave him double what he had before", ["He made him king of the East", "He built him a golden palace", "He gave him thirty more years"], "Events", "Easy")
        ]
    },
    "19-psalms": {
        "num": "19",
        "book": "Psalms",
        "t": "Old",
        "questions": [
            ("Who is credited with writing the majority of the Psalms?", "King David", ["King Solomon", "Moses", "Asaph"], "People", "Easy"),
            ("What is the opening line of the beloved Psalm 23?", "The Lord is my shepherd, I shall not want", ["Praise the Lord O my soul", "God is our refuge and strength", "The heavens declare the glory of God"], "Wisdom", "Easy"),
            ("What is the longest chapter in the entire Bible?", "Psalm 119", ["Psalm 23", "Psalm 91", "Psalm 150"], "Numbers", "Easy"),
            ("What is the shortest chapter in the entire Bible?", "Psalm 117", ["Psalm 23", "Psalm 100", "Psalm 134"], "Numbers", "Easy"),
            ("Which psalm is David's famous prayer of repentance after his sin with Bathsheba?", "Psalm 51", ["Psalm 23", "Psalm 32", "Psalm 90"], "Wisdom", "Easy"),
            ("Which psalm opens with 'My God, my God, why have you forsaken me'?", "Psalm 22", ["Psalm 16", "Psalm 23", "Psalm 69"], "Prophecy", "Medium"),
            ("In Psalm 119, what is described as 'a lamp to my feet and a light to my path'?", "Your Word", ["The temple fire", "Holy wisdom", "The sunrise"], "Wisdom", "Easy"),
            ("Which psalm declares: 'God is our refuge and strength, an ever-present help in trouble'?", "Psalm 46", ["Psalm 27", "Psalm 91", "Psalm 121"], "Wisdom", "Medium"),
            ("What musical instrument did David frequently play while composing praises?", "The harp or lyre", ["The silver trumpet", "The ram's horn", "The bronze cymbal"], "General Knowledge", "Easy"),
            ("How many distinct books or collections make up the Psalter?", "Five books", ["Three books", "Seven books", "Twelve books"], "Numbers", "Hard")
        ]
    },
    "20-proverbs": {
        "num": "20",
        "book": "Proverbs",
        "t": "Old",
        "questions": [
            ("Who was the primary royal author of the Book of Proverbs?", "King Solomon", ["King David", "King Hezekiah", "Moses"], "People", "Easy"),
            ("According to Proverbs 1:7, what is the beginning of all knowledge?", "The fear of the Lord", ["Human experience", "Reading books", "Observing nature"], "Wisdom", "Easy"),
            ("Complete Proverbs 3:5: 'Trust in the Lord with all your heart and lean not on...'?", "Your own understanding", ["Worldly riches", "The strength of men", "Fleeting pride"], "Wisdom", "Easy"),
            ("What small, diligent insect are sluggards instructed to observe for wisdom?", "The ant", ["The honeybee", "The spider", "The locust"], "Wisdom", "Easy"),
            ("Complete Proverbs 16:18: 'Pride goes before destruction, and a haughty spirit before...'?", "A fall", ["Defeat", "Sorrow", "Judgment"], "Wisdom", "Easy"),
            ("What kind of woman is praised in the famous acrostic poem of Proverbs 31?", "The woman of noble character", ["The queen of wisdom", "The prophetess of Zion", "The daughter of grace"], "Wisdom", "Easy"),
            ("Complete Proverbs 15:1: 'A soft answer turns away wrath, but a harsh word stirs up...'?", "Anger", ["Strife", "Bitterness", "Destruction"], "Wisdom", "Easy"),
            ("What does Proverbs declare is 'more desirable than great riches'?", "A good name", ["Silver and gold", "A crown of bronze", "High palace walls"], "Wisdom", "Medium"),
            ("Complete Proverbs 27:17: 'As iron sharpens iron, so one person sharpens...'?", "Another", ["His brother", "His sword", "His neighbor"], "Wisdom", "Easy"),
            ("According to Proverbs, whoever conceals their sins does not prosper, but whoever confesses and renounces them finds what?", "Mercy", ["Riches", "Honor", "Wisdom"], "Wisdom", "Medium")
        ]
    },
    "23-isaiah": {
        "num": "23",
        "book": "Isaiah",
        "t": "Old",
        "questions": [
            ("In what year did Isaiah see the Lord high and exalted on His throne?", "The year King Uzziah died", ["The year Hezekiah fell ill", "The year Solomon died", "The year Josiah was crowned"], "Events", "Medium"),
            ("What angelic beings cried 'Holy, holy, holy is the Lord Almighty' in Isaiah's vision?", "Seraphim", ["Cherubim", "Archangels", "Living creatures"], "Prophecy", "Medium"),
            ("What prophetic name meaning 'God with us' did Isaiah foretell for the virgin's Son?", "Immanuel", ["Messiah", "Yeshua", "Melchizedek"], "Prophecy", "Easy"),
            ("In which famous chapter is the Suffering Servant described as 'pierced for our transgressions'?", "Isaiah 53", ["Isaiah 40", "Isaiah 9", "Isaiah 61"], "Prophecy", "Easy"),
            ("Complete Isaiah 40:31: 'Those who hope in the Lord will renew their strength, they will soar on wings like...'?", "Eagles", ["Hawks", "Doves", "Falcons"], "Prophecy", "Easy"),
            ("Which righteous king of Judah was advised and comforted by Isaiah during an Assyrian siege?", "Hezekiah", ["Josiah", "Ahaz", "Manasseh"], "People", "Medium"),
            ("What did a seraph touch to Isaiah's lips to purge his guilt?", "A live burning coal", ["Holy water", "Sweet incense", "Anointed olive oil"], "Events", "Medium"),
            ("Which Persian ruler did Isaiah name over a century before his birth as God's shepherd?", "Cyrus", ["Darius", "Artaxerxes", "Xerxes"], "Prophecy", "Hard"),
            ("What did the Spirit of the Lord anoint the Servant to preach in Isaiah 61?", "Good news to the poor", ["Judgment on Babylon", "Rebuilding the walls", "Taxes on the nations"], "Prophecy", "Medium"),
            ("What does Isaiah envision wolves and lambs doing in God's holy mountain?", "Feeding peacefully together", ["Fleeing from hunters", "Guarding the gate", "Drinking at the river"], "Prophecy", "Easy")
        ]
    },
    "29-joel": {
        "num": "29",
        "book": "Joel",
        "t": "Old",
        "questions": [
            ("What natural devastation struck the land in the Book of Joel?", "A devastating swarm of locusts", ["A fiery drought", "A violent earthquake", "A plague of frogs"], "Events", "Easy"),
            ("What great prophetic promise from Joel 2 was fulfilled on Pentecost in Acts 2?", "I will pour out my Spirit on all people", ["The temple will be rebuilt", "The exiles will return from Babylon", "A star will rise in the East"], "Prophecy", "Easy"),
            ("In what valley does Joel prophesy God will gather and judge the nations?", "Valley of Jehoshaphat", ["Valley of Elah", "Valley of Jezreel", "Valley of Achor"], "Places", "Medium"),
            ("What does God instruct the people to rend instead of their garments?", "Their hearts", ["Their cloaks", "Their hair", "Their tents"], "Prophecy", "Easy"),
            ("According to Joel, what will happen to anyone who calls on the name of the Lord?", "They will be saved", ["They will inherit land", "They will receive silver", "They will become priests"], "Prophecy", "Easy")
        ]
    },
    "30-amos": {
        "num": "30",
        "book": "Amos",
        "t": "Old",
        "questions": [
            ("What was Amos's occupation before God called him to prophesy?", "A shepherd and tender of sycamore figs", ["A priest in the temple", "A royal court scribe", "A bronze craftsman"], "People", "Medium"),
            ("From which town in Judah did Amos originate?", "Tekoa", ["Bethlehem", "Hebron", "Jerusalem"], "Places", "Medium"),
            ("To which kingdom was Amos sent to preach against social injustice and idolatry?", "The northern kingdom of Israel", ["The southern kingdom of Judah", "The land of Edom", "The cities of Moab"], "Places", "Medium"),
            ("Complete Amos 5:24: 'Let justice roll on like a river, and righteousness like...'?", "A never-failing stream", ["A rushing waterfall", "A peaceful ocean", "A morning fountain"], "Wisdom", "Easy"),
            ("What object was set in the midst of Israel in Amos's vision to measure righteousness?", "A plumb line", ["A golden balance", "A measuring reed", "A carpenter's square"], "Prophecy", "Medium")
        ]
    },
    "38-zechariah": {
        "num": "38",
        "book": "Zechariah",
        "t": "Old",
        "questions": [
            ("Complete Zechariah 4:6: 'Not by might nor by power, but by...'?", "My Spirit, says the Lord", ["Faithful prayer", "Righteous works", "The sword of truth"], "Prophecy", "Easy"),
            ("How did Zechariah prophesy the future King of Zion would enter Jerusalem?", "Gentle and riding on a donkey", ["In a golden chariot of war", "On a white stallion", "Marching with ten thousand troops"], "Prophecy", "Easy"),
            ("For how many pieces of silver did Zechariah prophesy the Shepherd would be valued?", "Thirty pieces of silver", ["Twenty pieces of silver", "Fifty pieces of silver", "Ten pieces of silver"], "Numbers", "Easy"),
            ("What will be opened for the house of David to cleanse them from sin in Zechariah 13?", "A fountain", ["A new gate", "A royal well", "A silver basin"], "Prophecy", "Medium"),
            ("On which mountain will the Lord's feet stand in Zechariah 14, splitting it in two?", "The Mount of Olives", ["Mount Carmel", "Mount Zion", "Mount Sinai"], "Places", "Medium")
        ]
    },
    "39-malachi": {
        "num": "39",
        "book": "Malachi",
        "t": "Old",
        "questions": [
            ("What does the Hebrew name 'Malachi' mean?", "My messenger", ["God is just", "Servant of the Lord", "Praise to Yahweh"], "General Knowledge", "Medium"),
            ("How does God declare the people have robbed Him in Malachi 3?", "In tithes and offerings", ["In Sabbath worship", "In animal sacrifices", "In temple taxes"], "Law", "Easy"),
            ("Which Old Testament prophet does Malachi promise will appear before the great Day of the Lord?", "Elijah the prophet", ["Moses the lawgiver", "Enoch the righteous", "Samuel the judge"], "Prophecy", "Easy"),
            ("What promise is given to those who bring the full tithe into the storehouse?", "God will open the floodgates of heaven", ["They will never face drought", "Their barns will turn to gold", "They will rule over nations"], "Prophecy", "Easy"),
            ("What book of remembrance was written before the Lord for those who feared Him?", "A book of remembrance for those who revere His name", ["A register of the kings", "A ledger of temple gold", "A scroll of war victories"], "Prophecy", "Medium")
        ]
    },
    "40-matthew": {
        "num": "40",
        "book": "Matthew",
        "t": "New",
        "questions": [
            ("What was Matthew's profession before following Jesus?", "Tax collector", ["Fisherman", "Carpenter", "Tentmaker"], "People", "Easy"),
            ("In which city was Jesus born in fulfillment of prophecy?", "Bethlehem of Judea", ["Nazareth of Galilee", "Jerusalem", "Capernaum"], "Places", "Easy"),
            ("What guided the Magi to the young child Jesus?", "A star in the east", ["An angel in a dream", "A pillar of fire", "A golden dove"], "Events", "Easy"),
            ("Where did Jesus deliver His famous Beatitudes sermon?", "On a mountainside", ["In the temple court", "On the seashore", "In a village square"], "Events", "Easy"),
            ("How many loaves and fish did Jesus use to feed the 5,000?", "Five loaves and two fish", ["Seven loaves and three fish", "Four loaves and two fish", "Twelve loaves and six fish"], "Miracles", "Easy"),
            ("Who walked on water toward Jesus before beginning to sink in faith?", "Simon Peter", ["John the Beloved", "James son of Zebedee", "Andrew"], "Miracles", "Easy"),
            ("At Caesarea Philippi, what was Peter's confession regarding Jesus' identity?", "You are the Messiah, the Son of the living God", ["You are Elijah returned", "You are John the Baptist", "You are the Prophet of Moses"], "Events", "Easy"),
            ("For how many pieces of silver did Judas Iscariot betray Jesus?", "Thirty pieces of silver", ["Twenty pieces of silver", "Fifty pieces of silver", "One hundred coins"], "Numbers", "Easy"),
            ("In which garden did Jesus pray in agony before His arrest?", "Garden of Gethsemane", ["Garden of Eden", "Garden of Bethesda", "Garden of Bethany"], "Places", "Easy"),
            ("What Great Commission did Jesus proclaim before His ascension in Matthew 28?", "Go and make disciples of all nations", ["Build churches throughout Judea", "Write the gospel in scrolls", "Wait quietly in Jerusalem"], "Events", "Easy")
        ]
    },
    "41-mark": {
        "num": "41",
        "book": "Mark",
        "t": "New",
        "questions": [
            ("Which favorite Greek word meaning 'immediately' is used over forty times in Mark?", "Immediately", ["Afterward", "Truly", "Wherefore"], "General Knowledge", "Medium"),
            ("What did John the Baptist wear in the wilderness?", "Camel's hair with a leather belt", ["Fine linen robes", "Rough sackcloth", "Shepherd wool"], "People", "Easy"),
            ("What words did Jesus speak to calm the raging storm on the Sea of Galilee?", "Peace, be still", ["Wind and waves cease", "Be silent ocean", "By God's power stop"], "Miracles", "Easy"),
            ("What was the name of the synagogue leader whose daughter Jesus raised from the dead?", "Jairus", ["Nicodemus", "Cornelius", "Zacchaeus"], "People", "Easy"),
            ("What words did Jesus say to raise Jairus's daughter: 'Talitha koum'?", "Little girl, get up", ["Arise in peace", "Waken from sleep", "Receive life now"], "Miracles", "Medium"),
            ("What was the name of the blind beggar healed by Jesus outside Jericho?", "Bartimaeus", ["Zacchaeus", "Lazarus", "Simon the leper"], "People", "Easy"),
            ("Which disciple denied knowing Jesus three times before the rooster crowed twice?", "Peter", ["John", "Thomas", "Judas"], "People", "Easy"),
            ("Who was compelled by Roman soldiers to carry Jesus' cross to Golgotha?", "Simon of Cyrene", ["Joseph of Arimathea", "Nicodemus", "Barnabas"], "People", "Easy"),
            ("What confession did the Roman centurion make when Jesus breathed His last?", "Truly this man was the Son of God", ["He was a righteous prophet", "He died innocently", "He was king of the Jews"], "Events", "Easy"),
            ("What key theme describes Jesus' role in Mark 10:45: 'to serve and to give his life as a...'?", "Ransom for many", ["Teacher of truth", "Judge of all", "King of the nations"], "Wisdom", "Easy")
        ]
    },
    "42-luke": {
        "num": "42",
        "book": "Luke",
        "t": "New",
        "questions": [
            ("What was Luke's profession according to Colossians 4:14?", "The beloved physician", ["A Roman magistrate", "A tentmaker", "A temple scribe"], "People", "Easy"),
            ("To which noble individual was the Gospel of Luke addressed?", "Most excellent Theophilus", ["Governor Festus", "King Agrippa", "Caesar Augustus"], "People", "Easy"),
            ("Which angel appeared to Mary to announce the birth of Jesus?", "The angel Gabriel", ["The archangel Michael", "The angel Raphael", "An unnamed seraph"], "People", "Easy"),
            ("In what humble bedding was the newborn baby Jesus placed?", "In a manger", ["In a stone cradle", "On an altar bench", "In a straw basket"], "Events", "Easy"),
            ("To whom did angels first announce the joyous birth of the Savior in the fields?", "Shepherds keeping watch", ["The chief priests", "The town elders", "Roman soldiers"], "People", "Easy"),
            ("In which parable does a Samaritan show mercy to a wounded traveler?", "Parable of the Good Samaritan", ["Parable of the Prodigal Son", "Parable of the Sower", "Parable of the Talents"], "Wisdom", "Easy"),
            ("Which beloved parable tells of a lost son welcomed home with open arms by his father?", "Parable of the Prodigal Son", ["Parable of the Lost Coin", "Parable of the Lost Sheep", "Parable of the Rich Fool"], "Wisdom", "Easy"),
            ("What wealthy short tax collector climbed a sycamore tree to see Jesus in Jericho?", "Zacchaeus", ["Levi", "Theophilus", "Nicodemus"], "People", "Easy"),
            ("What did the penitent thief on the cross ask of Jesus?", "Remember me when you come into your kingdom", ["Save me from this cross", "Heal my broken bones", "Send an angel to free us"], "Events", "Easy"),
            ("On which road did the risen Jesus walk unrecognized with two disciples?", "Road to Emmaus", ["Road to Damascus", "Road to Jericho", "Road to Gaza"], "Places", "Easy")
        ]
    },
    "43-john": {
        "num": "43",
        "book": "John",
        "t": "New",
        "questions": [
            ("What majestic opening declaration begins the Gospel of John?", "In the beginning was the Word", ["The book of the genealogy of Jesus", "The beginning of the good news", "Since many have undertaken"], "Wisdom", "Easy"),
            ("What was Jesus' very first miraculous sign recorded in John?", "Turning water into wine at Cana", ["Healing the nobleman's son", "Feeding the five thousand", "Walking on water"], "Miracles", "Easy"),
            ("Which Pharisee visited Jesus under the cover of night to ask about being born again?", "Nicodemus", ["Gamaliel", "Joseph of Arimathea", "Caiaphas"], "People", "Easy"),
            ("Quote the beloved promise of John 3:16: 'For God so loved the world that He gave...'?", "His one and only Son", ["His holy law", "His mighty angels", "His heavenly kingdom"], "Wisdom", "Easy"),
            ("With whom did Jesus have a life-changing conversation at Jacob's well in Sychar?", "The Samaritan woman", ["Mary Magdalene", "Martha of Bethany", "The Syrophoenician mother"], "People", "Easy"),
            ("How many days had Lazarus been dead in the tomb before Jesus raised him?", "Four days", ["Two days", "Three days", "Seven days"], "Numbers", "Easy"),
            ("What is the shortest verse in the entire English Bible found in John 11:35?", "Jesus wept", ["Pray constantly", "Rejoice always", "God is love"], "General Knowledge", "Easy"),
            ("What humble act did Jesus perform for His disciples at the Last Supper?", "Washed their feet", ["Anointed their heads with oil", "Gave them golden rings", "Bowed before them"], "Events", "Easy"),
            ("Complete Jesus' declaration in John 14:6: 'I am the way, the truth, and the...'?", "Life", ["Light", "Resurrection", "Door"], "Wisdom", "Easy"),
            ("Which doubting disciple declared he would not believe unless he touched Jesus' wounds?", "Thomas", ["Philip", "Bartholomew", "Andrew"], "People", "Easy")
        ]
    },
    "44-acts": {
        "num": "44",
        "book": "Acts",
        "t": "New",
        "questions": [
            ("On which holy festival day did the Holy Spirit descend with tongues of fire in Acts 2?", "Day of Pentecost", ["Day of Atonement", "Feast of Tabernacles", "Passover Feast"], "Events", "Easy"),
            ("About how many souls were saved and baptized after Peter's Pentecost sermon?", "Three thousand souls", ["Five thousand souls", "One thousand souls", "Five hundred souls"], "Numbers", "Easy"),
            ("Who was the first Christian martyr stoned to death while gazing into heaven?", "Stephen", ["James", "Philip", "Barnabas"], "People", "Easy"),
            ("On the road to which city was persecutor Saul blinded by a blinding light from heaven?", "Damascus", ["Jericho", "Antioch", "Rome"], "Places", "Easy"),
            ("Who was sent by God to lay hands on Saul in Damascus and restore his sight?", "Ananias", ["Barnabas", "Silas", "Peter"], "People", "Easy"),
            ("Which Roman centurion in Caesarea was the first gentile convert visited by Peter?", "Cornelius", ["Julius", "Claudius", "Longinus"], "People", "Easy"),
            ("In which city were believers in Jesus first called 'Christians'?", "Antioch", ["Jerusalem", "Ephesus", "Rome"], "Places", "Easy"),
            ("Who accompanied Paul on his first missionary journey from Antioch?", "Barnabas", ["Silas", "Timothy", "Luke"], "People", "Easy"),
            ("What seller of purple cloth from Thyatira was baptized in Philippi?", "Lydia", ["Phoebe", "Priscilla", "Dorcas"], "People", "Easy"),
            ("What happened to the Philippian jail when Paul and Silas sang hymns at midnight?", "A violent earthquake shook the foundations", ["Lightning struck the roof", "The guards fell asleep", "The doors vanished"], "Miracles", "Easy")
        ]
    },
    "45-romans": {
        "num": "45",
        "book": "Romans",
        "t": "New",
        "questions": [
            ("Complete Romans 3:23: 'For all have sinned and fall short of...'?", "The glory of God", ["The grace of heaven", "The holy commandments", "Eternal salvation"], "Wisdom", "Easy"),
            ("Complete Romans 6:23: 'For the wages of sin is death, but the gift of God is...'?", "Eternal life in Christ Jesus", ["Forgiveness for today", "Peace upon earth", "Heavenly treasure"], "Wisdom", "Easy"),
            ("Complete Romans 8:28: 'And we know that in all things God works for the good of those who...'?", "Love Him", ["Keep the law", "Pray without ceasing", "Fast regularly"], "Wisdom", "Easy"),
            ("According to Romans 8:38-39, what can separate believers from the love of God?", "Nothing in all creation", ["Persecution and sword", "Famine and hardship", "Angels and demons"], "Wisdom", "Easy"),
            ("Complete Romans 12:1: 'Present your bodies as a living sacrifice, holy and...'?", "Pleasing to God", ["Without blemish", "Pure from guilt", "Righteous in faith"], "Wisdom", "Easy")
        ]
    },
    "46-1corinthians": {
        "num": "46",
        "book": "1 Corinthians",
        "t": "New",
        "questions": [
            ("What famous chapter in 1 Corinthians is known worldwide as the 'Love Chapter'?", "1 Corinthians 13", ["1 Corinthians 11", "1 Corinthians 15", "1 Corinthians 8"], "General Knowledge", "Easy"),
            ("Complete 1 Corinthians 13:13: 'And now these three remain: faith, hope and love. But the greatest of these is...'?", "Love", ["Faith", "Hope", "Charity"], "Wisdom", "Easy"),
            ("Which major chapter of 1 Corinthians defends the bodily resurrection of Jesus and believers?", "1 Corinthians 15", ["1 Corinthians 12", "1 Corinthians 10", "1 Corinthians 6"], "Prophecy", "Medium"),
            ("What is our physical body called in 1 Corinthians 6:19?", "A temple of the Holy Spirit", ["A vessel of clay", "A tent of shadows", "A house of dust"], "Wisdom", "Easy"),
            ("Complete 1 Corinthians 10:13: 'No temptation has overtaken you except what is common to...'?", "Mankind", ["Believers", "Sinners", "The disciples"], "Wisdom", "Easy")
        ]
    },
    "47-2corinthians": {
        "num": "47",
        "book": "2 Corinthians",
        "t": "New",
        "questions": [
            ("Complete 2 Corinthians 5:17: 'If anyone is in Christ, the new creation has come: The old has gone, the...'?", "New is here", ["Sin is forgotten", "Kingdom is gained", "Spirit is given"], "Wisdom", "Easy"),
            ("What answer did the Lord give Paul when he pleaded three times to remove his thorn in the flesh?", "My grace is sufficient for you", ["Your prayer is heard", "Wait until tomorrow", "Depart in peace"], "Wisdom", "Easy"),
            ("What kind of giver does God love according to 2 Corinthians 9:7?", "A cheerful giver", ["A wealthy giver", "A quiet giver", "A sacrificial giver"], "Wisdom", "Easy"),
            ("In what humble vessels does 2 Corinthians 4:7 say we hold the treasure of the Gospel?", "Jars of clay", ["Chests of bronze", "Baskets of reed", "Vessels of silver"], "Wisdom", "Medium"),
            ("Complete 2 Corinthians 5:7: 'For we walk by faith, not by...'?", "Sight", ["Fear", "Feelings", "Works"], "Wisdom", "Easy")
        ]
    },
    "48-galatians": {
        "num": "48",
        "book": "Galatians",
        "t": "New",
        "questions": [
            ("Name the ninefold Fruit of the Spirit listed in Galatians 5:22-23.", "Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control", ["Faith, hope, charity, fasting, prayer, giving, purity, honor, truth", "Wisdom, knowledge, faith, healing, miracles, prophecy, tongues, discernment, interpretation", "Zeal, obedience, devotion, holiness, sacrifice, vigilance, righteousness, temperance, grace"], "Wisdom", "Easy"),
            ("Complete Galatians 2:20: 'I have been crucified with Christ and I no longer live, but...'?", "Christ lives in me", ["I walk in grace", "My soul is free", "Heaven is mine"], "Wisdom", "Easy"),
            ("Complete Galatians 6:7: 'Do not be deceived: God cannot be mocked. A man reaps what he...'?", "Sows", ["Builds", "Treasures", "Plans"], "Wisdom", "Easy"),
            ("According to Galatians 3:28, there is neither Jew nor Gentile, slave nor free, male nor female, for you are all what in Christ?", "One in Christ Jesus", ["Citizens of heaven", "Children of Abraham", "Saints of God"], "Wisdom", "Easy"),
            ("What false teaching was Paul passionately combating in the churches of Galatia?", "Requiring Gentile converts to keep circumcision and Mosaic law for salvation", ["Denying the resurrection", "Worshiping pagan emperors", "Refusing to give tithes"], "History", "Medium")
        ]
    },
    "49-ephesians": {
        "num": "49",
        "book": "Ephesians",
        "t": "New",
        "questions": [
            ("Complete Ephesians 2:8: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is...'?", "The gift of God", ["Earned by good works", "The reward of law", "Given for merit"], "Wisdom", "Easy"),
            ("What spiritual defense listed in Ephesians 6:16 extinguishes all the flaming arrows of the evil one?", "The shield of faith", ["The helmet of salvation", "The belt of truth", "The shoes of peace"], "Wisdom", "Easy"),
            ("What is the offensive weapon of the Armor of God called in Ephesians 6:17?", "The sword of the Spirit which is the Word of God", ["The spear of righteousness", "The bow of promise", "The rod of judgment"], "Wisdom", "Easy"),
            ("Who is declared to be the head of the Church, which is His body, in Ephesians?", "Jesus Christ", ["Simon Peter", "The apostles", "The high priest"], "General Knowledge", "Easy"),
            ("Complete Ephesians 4:32: 'Be kind and compassionate to one another, forgiving each other, just as in Christ God...'?", "Forgave you", ["Loved you", "Saved you", "Called you"], "Wisdom", "Easy")
        ]
    },
    "50-philippians": {
        "num": "50",
        "book": "Philippians",
        "t": "New",
        "questions": [
            ("Complete Philippians 4:13: 'I can do all things through Christ who...'?", "Strengthens me", ["Guides me", "Loves me", "Saves me"], "Wisdom", "Easy"),
            ("Complete Philippians 4:4: 'Rejoice in the Lord always. I will say it again:...'?", "Rejoice", ["Give thanks", "Sing praise", "Pray"], "Wisdom", "Easy"),
            ("Where was Paul when he wrote this joyful Epistle to the Philippians?", "In a Roman prison", ["In the temple at Jerusalem", "On a ship to Spain", "In his home at Tarsus"], "Events", "Easy"),
            ("According to Philippians 2:9-11, what will every knee do at the name of Jesus?", "Bow in reverence", ["Tremble in terror", "Stand in judgment", "Fall like stone"], "Prophecy", "Easy"),
            ("Complete Philippians 1:21: 'For to me, to live is Christ and to die is...'?", "Gain", ["Peace", "Rest", "Reward"], "Wisdom", "Easy")
        ]
    },
    "51-colossians": {
        "num": "51",
        "book": "Colossians",
        "t": "New",
        "questions": [
            ("According to Colossians 1:16, for whom and by whom were all things created?", "By Jesus Christ and for Him", ["By the angels", "By Moses", "For the kings of the earth"], "Wisdom", "Easy"),
            ("Complete Colossians 3:2: 'Set your minds on things above, not on...'?", "Earthly things", ["Fleshly desires", "Past sorrows", "Worldly wealth"], "Wisdom", "Easy"),
            ("Complete Colossians 3:14: 'And over all these virtues put on love, which binds them all together in...'?", "Perfect unity", ["Lasting peace", "Heavenly grace", "Holy joy"], "Wisdom", "Easy"),
            ("What dwelling place of the fullness of Deity lives in Christ in bodily form according to Colossians 2:9?", "All the fullness of the Deity lives in Christ bodily", ["Half of divine power", "The angelic host", "The light of creation"], "Wisdom", "Medium"),
            ("Complete Colossians 3:23: 'Whatever you do, work at it with all your heart, as working for the Lord, not for...'?", "Human masters", ["Worldly gain", "Earthly praise", "Vain glory"], "Wisdom", "Easy")
        ]
    },
    "52-1thessalonians": {
        "num": "52",
        "book": "1 Thessalonians",
        "t": "New",
        "questions": [
            ("Complete 1 Thessalonians 5:16-18: 'Rejoice always, pray continually, give thanks in all circumstances; for this is...'?", "God's will for you in Christ Jesus", ["The mark of an apostle", "The duty of the church", "The secret of long life"], "Wisdom", "Easy"),
            ("According to 1 Thessalonians 4:16, with what sound will the Lord Himself descend from heaven?", "With a loud command, voice of the archangel, and trumpet of God", ["With rushing waters", "With earthquakes and thunder", "With quiet whispering winds"], "Prophecy", "Medium"),
            ("Who will rise first when Christ returns according to 1 Thessalonians 4:16?", "The dead in Christ", ["The living saints", "The holy apostles", "The prophets of old"], "Prophecy", "Easy"),
            ("How will the Day of the Lord come according to 1 Thessalonians 5:2?", "Like a thief in the night", ["Like a blazing sunrise", "Like a roaring lion", "Like a scheduled feast"], "Prophecy", "Easy"),
            ("Complete 1 Thessalonians 5:19: 'Do not quench...'?", "The Spirit", ["The holy altar", "The light of faith", "The words of truth"], "Wisdom", "Easy")
        ]
    },
    "53-2thessalonians": {
        "num": "53",
        "book": "2 Thessalonians",
        "t": "New",
        "questions": [
            ("What notorious figure must be revealed before the Day of the Lord in 2 Thessalonians 2?", "The man of lawlessness", ["The false prophet of Tyre", "The Roman Caesar", "The beast of the sea"], "Prophecy", "Medium"),
            ("Complete 2 Thessalonians 3:10: 'The one who is unwilling to work shall not...'?", "Eat", ["Receive wages", "Enter the assembly", "Dwell in peace"], "Wisdom", "Easy"),
            ("Complete 2 Thessalonians 3:13: 'And as for you, brothers and sisters, never tire of doing...'?", "What is good", ["Charitable deeds", "Holy prayers", "Temple service"], "Wisdom", "Easy"),
            ("Where will the man of lawlessness set himself up according to 2 Thessalonians 2:4?", "In God's temple proclaiming himself to be God", ["In the Roman senate", "On the peaks of Babylon", "In the desert of Egypt"], "Prophecy", "Medium"),
            ("Complete 2 Thessalonians 3:3: 'But the Lord is faithful, and He will strengthen you and protect you from...'?", "The evil one", ["Worldly trouble", "Fierce persecutors", "Sudden sickness"], "Wisdom", "Easy")
        ]
    },
    "54-1timothy": {
        "num": "54",
        "book": "1 Timothy",
        "t": "New",
        "questions": [
            ("Complete 1 Timothy 4:12: 'Don't let anyone look down on you because you are young, but set an example for believers in...'?", "Speech, conduct, love, faith, and purity", ["Wealth, knowledge, and prestige", "Fasting, sacrifice, and rituals", "Power, eloquence, and rank"], "Wisdom", "Easy"),
            ("Complete 1 Timothy 6:10: 'For the love of money is a root of...'?", "All kinds of evil", ["Worldly pride", "Human greed", "False teaching"], "Wisdom", "Easy"),
            ("According to 1 Timothy 2:5, how many mediators are there between God and mankind?", "One mediator, the man Christ Jesus", ["Two mediators", "The holy angels", "The ordained priests"], "Wisdom", "Easy"),
            ("Complete 1 Timothy 1:15: 'Christ Jesus came into the world to save sinners—of whom I am...'?", "The worst", ["The least", "The greatest", "A witness"], "Wisdom", "Easy"),
            ("What church leadership role is outlined in 1 Timothy 3 alongside overseers?", "Deacons", ["Prophets", "Scribes", "Magistrates"], "General Knowledge", "Medium")
        ]
    },
    "55-2timothy": {
        "num": "55",
        "book": "2 Timothy",
        "t": "New",
        "questions": [
            ("Complete 2 Timothy 3:16: 'All Scripture is God-breathed and is useful for...'?", "Teaching, rebuking, correcting and training in righteousness", ["Comforting hearts and giving peace", "Chanting in the synagogue", "Decorating temple walls"], "Wisdom", "Easy"),
            ("Complete 2 Timothy 1:7: 'For the Spirit God gave us does not make us timid, but gives us power, love and...'?", "Self-discipline", ["Honor", "Patience", "Wisdom"], "Wisdom", "Easy"),
            ("What famous declaration did Paul make near the end of his life in 2 Timothy 4:7?", "I have fought the good fight, I have finished the race, I have kept the faith", ["I have conquered all my foes", "I have established twelve churches", "I have earned my golden crown"], "Wisdom", "Easy"),
            ("Who was Timothy's godly grandmother mentioned in 2 Timothy 1:5?", "Lois", ["Eunice", "Rhoda", "Salome"], "People", "Medium"),
            ("Who was Timothy's godly mother who instructed him in the Scriptures?", "Eunice", ["Lois", "Lydia", "Phoebe"], "People", "Medium")
        ]
    },
    "56-titus": {
        "num": "56",
        "book": "Titus",
        "t": "New",
        "questions": [
            ("On which Mediterranean island was Titus left by Paul to appoint elders?", "Crete", ["Cyprus", "Malta", "Sicily"], "Places", "Easy"),
            ("According to Titus 2:11, what has appeared that offers salvation to all people?", "The grace of God", ["The angelic host", "The book of the law", "The light of dawn"], "Wisdom", "Easy"),
            ("What proverb about Cretans did Paul quote from one of their own poets?", "Cretans are always liars, evil brutes, lazy gluttons", ["Cretans love gold more than life", "Cretans fear the sea", "Cretans build with sand"], "General Knowledge", "Hard"),
            ("Complete Titus 3:5: 'He saved us, not because of righteous things we had done, but because of His...'?", "Mercy", ["Wisdom", "Power", "Promise"], "Wisdom", "Easy"),
            ("What should believers be careful to devote themselves to doing according to Titus 3:8?", "Doing what is good", ["Debating the law", "Singing psalms", "Offering sacrifices"], "Wisdom", "Easy")
        ]
    },
    "57-philemon": {
        "num": "57",
        "book": "Philemon",
        "t": "New",
        "questions": [
            ("Who was the runaway slave on whose behalf Paul wrote to Philemon?", "Onesimus", ["Tychicus", "Epaphras", "Archippus"], "People", "Easy"),
            ("What does the Greek name 'Onesimus' literally mean?", "Useful or profitable", ["Faithful friend", "Free man", "Blessed child"], "General Knowledge", "Medium"),
            ("How did Paul ask Philemon to welcome Onesimus back upon his return?", "No longer as a slave, but as a dear brother in Christ", ["As a paid laborer", "As an apprentice servant", "With public discipline"], "Wisdom", "Easy"),
            ("What did Paul offer to do if Onesimus owed Philemon any money or had wronged him?", "Charge it to my account, I will repay it", ["Forgive it by apostolic decree", "Borrow money from the church", "Ask the elders to settle it"], "Events", "Medium"),
            ("In whose house did the local Christian church meet according to Philemon 1:2?", "Philemon's house", ["Onesimus's house", "Timothy's house", "Gaius's house"], "Places", "Easy")
        ]
    },
    "58-hebrews": {
        "num": "58",
        "book": "Hebrews",
        "t": "New",
        "questions": [
            ("How does Hebrews 11:1 define faith?", "Confidence in what we hope for and assurance about what we do not see", ["Knowledge of holy doctrines", "Emotional peace in trial", "Obedience to temple law"], "Wisdom", "Easy"),
            ("Who is declared to be the eternal High Priest after the order of Melchizedek in Hebrews?", "Jesus Christ", ["Aaron", "Levi", "Moses"], "Prophecy", "Easy"),
            ("Complete Hebrews 4:12: 'For the Word of God is alive and active, sharper than any...'?", "Double-edged sword", ["Iron spear", "Razor blade", "Arrow of war"], "Wisdom", "Easy"),
            ("Complete Hebrews 12:2: 'Fixing our eyes on Jesus, the pioneer and perfecter of...'?", "Our faith", ["Our salvation", "The heavenly church", "The royal law"], "Wisdom", "Easy"),
            ("Complete Hebrews 13:8: 'Jesus Christ is the same yesterday and today and...'?", "Forever", ["To all generations", "In all the earth", "Before all ages"], "Wisdom", "Easy")
        ]
    },
    "59-james": {
        "num": "59",
        "book": "James",
        "t": "New",
        "questions": [
            ("Who was James, the author of this epistle?", "The brother of Jesus and leader of the Jerusalem church", ["James son of Zebedee", "James son of Alphaeus", "James the Roman centurion"], "People", "Easy"),
            ("Complete James 1:22: 'Do not merely listen to the word, and so deceive yourselves. Do...'?", "What it says", ["Memorize its verses", "Teach it to others", "Write it on parchment"], "Wisdom", "Easy"),
            ("What small bodily member does James compare to a small rudder steering a massive ship?", "The tongue", ["The eyes", "The hands", "The feet"], "Wisdom", "Easy"),
            ("Complete James 2:26: 'As the body without the spirit is dead, so faith without deeds is...'?", "Dead", ["Weak", "Unfruitful", "Empty"], "Wisdom", "Easy"),
            ("Complete James 4:7: 'Submit yourselves, then, to God. Resist the devil, and he will...'?", "Flee from you", ["Be bound in chains", "Lose his power", "Leave your city"], "Wisdom", "Easy")
        ]
    },
    "60-1peter": {
        "num": "60",
        "book": "1 Peter",
        "t": "New",
        "questions": [
            ("To what does 1 Peter 5:8 compare the devil, prowling around seeking whom to devour?", "A roaring lion", ["A venomous viper", "A cunning wolf", "A flying dragon"], "Wisdom", "Easy"),
            ("Complete 1 Peter 5:7: 'Cast all your anxiety on Him because...'?", "He cares for you", ["He is all-powerful", "He rules the world", "He hears your voice"], "Wisdom", "Easy"),
            ("How does 1 Peter 2:9 describe the people of God?", "A chosen people, a royal priesthood, a holy nation", ["A mighty military host", "The rulers of this age", "The judges of the earth"], "Wisdom", "Easy"),
            ("With what precious payment were believers redeemed according to 1 Peter 1:18-19?", "With the precious blood of Christ, a lamb without blemish", ["With silver and gold", "With temple sacrifices", "With deeds of the law"], "Wisdom", "Easy"),
            ("Complete 1 Peter 4:8: 'Above all, love each other deeply, because love covers over a multitude of...'?", "Sins", ["Faults", "Sorrows", "Doubts"], "Wisdom", "Easy")
        ]
    },
    "61-2peter": {
        "num": "61",
        "book": "2 Peter",
        "t": "New",
        "questions": [
            ("Complete 2 Peter 3:8: 'With the Lord a day is like a thousand years, and a thousand years are like...'?", "A day", ["An hour", "A fleeting watch", "A single second"], "Wisdom", "Easy"),
            ("Why is the Lord patient and not slow in keeping His promise according to 2 Peter 3:9?", "Not wanting anyone to perish, but everyone to come to repentance", ["Because heaven is not ready", "Because the nations must build", "Because angels are counting"], "Prophecy", "Easy"),
            ("According to 2 Peter 1:21, how did prophecy originate?", "Prophets spoke from God as they were carried along by the Holy Spirit", ["Through human imagination", "By studying the stars", "From dreams of the kings"], "Wisdom", "Medium"),
            ("What ancient world disaster does Peter recall to illustrate God's judgment and rescue of the godly?", "Noah and the Great Flood", ["The Tower of Babel", "The fall of Jericho", "The Egyptian plagues"], "Events", "Easy"),
            ("Complete 2 Peter 3:18: 'Grow in the grace and knowledge of our Lord and Savior...'?", "Jesus Christ", ["God the Father", "The Holy Spirit", "The apostles"], "Wisdom", "Easy")
        ]
    },
    "62-1john": {
        "num": "62",
        "book": "1 John",
        "t": "New",
        "questions": [
            ("What profound three-word statement about God's fundamental nature is repeated in 1 John 4?", "God is love", ["God is holy", "God is light", "God is righteous"], "Wisdom", "Easy"),
            ("Complete 1 John 1:9: 'If we confess our sins, He is faithful and just and will forgive us our sins and purify us from...'?", "All unrighteousness", ["All past sorrow", "The fear of death", "The power of demons"], "Wisdom", "Easy"),
            ("Complete 1 John 4:18: 'There is no fear in love. But perfect love drives out...'?", "Fear", ["Doubt", "Darkness", "Hatred"], "Wisdom", "Easy"),
            ("According to 1 John 2:16, what three things comprise the desires of this fallen world?", "The lust of the flesh, lust of the eyes, and pride of life", ["Greed, envy, and malice", "Anger, slander, and deceit", "Power, prestige, and wealth"], "Wisdom", "Medium"),
            ("Complete 1 John 4:19: 'We love because He first...'?", "Loved us", ["Called us", "Forgave us", "Blessed us"], "Wisdom", "Easy")
        ]
    },
    "63-2john": {
        "num": "63",
        "book": "2 John",
        "t": "New",
        "questions": [
            ("To whom is the second epistle of John uniquely addressed?", "The chosen lady and her children", ["The churches of Galatia", "The elder Gaius", "The scattered tribes"], "People", "Easy"),
            ("What great commandment does John urge believers to walk in?", "Love one another", ["Keep the Sabbath", "Fast every week", "Pay the temple tax"], "Wisdom", "Easy"),
            ("What warning does 2 John 1:7 give against deceivers in the world?", "They do not acknowledge Jesus Christ as coming in the flesh", ["They refuse to pay taxes", "They speak in strange tongues", "They eat food sacrificed to idols"], "Prophecy", "Medium"),
            ("What does John instruct believers to do if anyone comes bringing false teaching denying Christ?", "Do not welcome them into your home or greet them", ["Argue with them publicly", "Arrest them at the city gate", "Give them gold to depart"], "Law", "Hard"),
            ("Why did John not write more with paper and ink in this brief letter?", "He hoped to visit and talk face to face", ["He ran out of parchment", "The Roman soldiers arrived", "His eyes were failing"], "General Knowledge", "Medium")
        ]
    },
    "64-3john": {
        "num": "64",
        "book": "3 John",
        "t": "New",
        "questions": [
            ("To which beloved friend and church brother is 3 John addressed?", "Gaius", ["Theophilus", "Philemon", "Timothy"], "People", "Easy"),
            ("Complete 3 John 1:4: 'I have no greater joy than to hear that my children are walking in...'?", "The truth", ["Prosperity", "Honor", "Peace"], "Wisdom", "Easy"),
            ("Which arrogant church member is rebuked by John for loving to be first and gossiping maliciously?", "Diotrephes", ["Demetrius", "Alexander", "Hymenaeus"], "People", "Medium"),
            ("Which faithful brother is praised by John as having a good testimony from everyone?", "Demetrius", ["Diotrephes", "Gaius", "Tychicus"], "People", "Medium"),
            ("What wish does John express for Gaius in verse 2 regarding health and soul?", "That you may enjoy good health and all may go well with you, even as your soul is getting along well", ["That you may become a wealthy elder", "That you may preach before kings", "That you may never face persecution"], "Wisdom", "Easy")
        ]
    },
    "65-jude": {
        "num": "65",
        "book": "Jude",
        "t": "New",
        "questions": [
            ("How does Jude identify his relationship to Jesus and James?", "A servant of Jesus Christ and a brother of James", ["An apostle of the twelve", "The high priest of Jerusalem", "The son of Zebedee"], "People", "Easy"),
            ("What did Jude urge believers to vigorously contend for in verse 3?", "The faith once for all delivered to the saints", ["The freedom of the church", "The land of Judea", "The authority of the elders"], "Wisdom", "Easy"),
            ("Which archangel is mentioned in verse 9 disputing with the devil over the body of Moses?", "Michael", ["Gabriel", "Raphael", "Uriel"], "People", "Medium"),
            ("Which righteous seventh from Adam prophesied that the Lord is coming with thousands of holy ones?", "Enoch", ["Noah", "Seth", "Methuselah"], "Prophecy", "Medium"),
            ("Quote the beloved doxology of Jude 24: 'To Him who is able to keep you from stumbling and to present you before His glorious presence without...'?", "Fault and with great joy", ["Fear or trembling", "Any sorrow", "Past condemnation"], "Wisdom", "Easy")
        ]
    },
    "66-revelation": {
        "num": "66",
        "book": "Revelation",
        "t": "New",
        "questions": [
            ("To which island was the apostle John exiled when he received the Revelation?", "Island of Patmos", ["Island of Crete", "Island of Cyprus", "Island of Malta"], "Places", "Easy"),
            ("To how many churches in the province of Asia was the Revelation sent?", "Seven churches", ["Twelve churches", "Ten churches", "Three churches"], "Numbers", "Easy"),
            ("Who alone was found worthy to take the scroll and open its seven seals in heaven?", "The Lion of Judah, the Lamb that was slain", ["The archangel Michael", "Moses the servant of God", "The four living creatures"], "Prophecy", "Easy"),
            ("What four colors describe the horses ridden by the Four Horsemen of the Apocalypse?", "White, red, black, and pale", ["White, gold, silver, and bronze", "Red, purple, blue, and black", "Green, yellow, black, and white"], "Prophecy", "Medium"),
            ("How many sealed servants of God from the twelve tribes of Israel are numbered in Revelation 7?", "One hundred forty-four thousand", ["Twelve thousand", "Seventy thousand", "Ten thousand"], "Numbers", "Easy"),
            ("Who leads the holy angels to defeat the dragon Satan in the great war in heaven?", "Michael the archangel", ["Gabriel the messenger", "The twenty-four elders", "The two witnesses"], "Prophecy", "Easy"),
            ("What holy city descends out of heaven from God prepared as a bride adorned for her husband?", "The New Jerusalem", ["Mount Zion", "The New Eden", "The Temple of Light"], "Places", "Easy"),
            ("Complete Revelation 21:4: 'He will wipe every tear from their eyes. There will be no more...'?", "Death or mourning or crying or pain", ["Famine or war or pestilence", "Darkness or night or storm", "Fear or doubt or sorrow"], "Prophecy", "Easy"),
            ("What title did Jesus declare three times in Revelation: 'I am the Alpha and the...'?", "Omega", ["Beta", "Zeta", "Beginning"], "Wisdom", "Easy"),
            ("What is the final invitation and promise closing the entire Bible in Revelation 22:20?", "He who testifies to these things says, 'Yes, I am coming soon.' Amen. Come, Lord Jesus!", ["The kingdom of the world has fallen", "Let all who are holy rejoice", "The angels blow their trumpets"], "Prophecy", "Easy")
        ]
    }
}

def clean_str(s):
    if s is None:
        return ''
    s = re.sub(r'[()[\]{}]', '', str(s))
    return re.sub(r'\s+', ' ', s).strip()

def main():
    target_dir = 'scripts/books'
    os.makedirs(target_dir, exist_ok=True)
    
    created_count = 0
    for key, data in BOOKS_DATA.items():
        filename = f"{key}.js"
        filepath = os.path.join(target_dir, filename)
        
        # Format into JS array
        entries = []
        for q, a, w, cat, diff in data["questions"]:
            clean_q = clean_str(q)
            clean_a = clean_str(a)
            clean_w = [clean_str(x) for x in w]
            entries.append({
                "t": data["t"],
                "b": data["book"],
                "c": cat,
                "d": diff,
                "q": clean_q,
                "a": clean_a,
                "w": clean_w
            })
            
        js_content = "module.exports = " + json.dumps(entries, indent=2) + ";\n"
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(js_content)
        created_count += 1
        
    print(f"Successfully generated {created_count} book files in {target_dir}!")

if __name__ == '__main__':
    main()
