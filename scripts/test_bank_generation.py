import json

# Test category matching function
def match_category(q_text, ans_en):
    ql = q_text.lower()
    al = ans_en.lower().strip()
    
    if al in ['hebrews', 'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges',
              'ruth', 'ecclesiastes', 'psalms', 'proverbs', 'jonah', 'obadiah', 'haggai', 'galatians', 'revelation']:
        return 'BOOK'
    if al in ['passover', 'pentecost', 'tabernacles', 'purim', 'day of atonement']:
        return 'FEAST'
    if al in ['belshazzar', 'nebuchadnezzar', 'cyrus', 'darius', 'herod', 'josiah', 'ahab', 'jeroboam',
              'rehoboam', 'hezekiah', 'jehu', 'archelaus', 'abimelech', 'og', 'sihon']:
        return 'KING'
    if al in ['peter', 'andrew', 'james', 'john', 'philip', 'thomas', 'bartholomew', 'matthew', 'simon',
              'judas', 'judas iscariot', 'simon the zealot']:
        return 'DISCIPLE'
    if al in ['elijah', 'elisha', 'isaiah', 'jeremiah', 'ezekiel', 'daniel', 'amos', 'hosea', 'joel', 'micah']:
        return 'PROPHET'
    if al in ['ruth', 'sarah', 'rachel', 'leah', 'rebekah', 'miriam', 'deborah', 'esther', 'hannah', 'mary', 'martha', 'dinah', 'rahab', 'delilah']:
        return 'WOMAN'
    if al in ['cain', 'abel', 'seth', 'noah', 'abraham', 'isaac', 'jacob', 'esau', 'joseph', 'benjamin',
              'reuben', 'simeon', 'levi', 'judah', 'manasseh', 'potiphar', 'laban', 'ishmael', 'boaz', 'terah']:
        return 'MEN'
    if al in ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']:
        return 'ORDINAL'
    if al in ['sea voyage', 'shipwreck']:
        return 'TRAUMATIC_EVENT'
    if al in ['the men of gibeah']:
        return 'GROUP_OF_MEN'
    return 'OTHER'

print("Test matching categories:")
print("Passover ->", match_category("What ceremony...", "Passover"))
print("Belshazzar ->", match_category("Which king...", "Belshazzar"))
print("Hebrews ->", match_category("What book...", "Hebrews"))
print("Sea voyage ->", match_category("During what traumatic event...", "Sea voyage"))
print("The men of Gibeah ->", match_category("Which men murdered...", "The men of Gibeah"))
