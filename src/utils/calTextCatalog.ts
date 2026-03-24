import type { CALTextInfo } from '../types/cal-reader';

/** Top-level groupings from AvailSyr.html */
export const CAL_GROUPS = [
  'Bible > OT Peshitta',
  'Bible > Old Syriac Gospels',
  'Bible > NT Peshitta',
  'Bible > Apocrypha/Pseudepigrapha',
  'Bible > Commentaries',
  'Poetry > Metrical Homilies & Hymns',
  'Poetry > Dispute Poems',
  'Religion',
  'Letters > Archival',
  'Letters > Canonical',
  'Legal > Documents',
  'Legal > Syro-Roman Law',
  'Magic',
  'Science/Philosophy',
  'History',
  'Narratives > Novels/Histories',
  'Narratives > Martyrologies',
  'Various',
  'Inscriptions',
] as const;

export type CALGroup = (typeof CAL_GROUPS)[number];

/**
 * Complete catalog of all 164 Syriac texts available in CAL,
 * scraped from show_Syriac_categories.php?category=1..20.
 */
export const CAL_TEXTS: CALTextInfo[] = [
  // ── Bible > OT Peshitta (category 1) ──
  { fileCode: '62001', abbreviation: 'P Gn',   name: 'Genesis',       group: 'Bible > OT Peshitta' },
  { fileCode: '62002', abbreviation: 'P Ex',   name: 'Exodus',        group: 'Bible > OT Peshitta' },
  { fileCode: '62003', abbreviation: 'P Lv',   name: 'Leviticus',     group: 'Bible > OT Peshitta' },
  { fileCode: '62004', abbreviation: 'P Nm',   name: 'Numbers',       group: 'Bible > OT Peshitta' },
  { fileCode: '62005', abbreviation: 'P Dt',   name: 'Deuteronomy',   group: 'Bible > OT Peshitta' },
  { fileCode: '62006', abbreviation: 'P Jos',  name: 'Joshua',        group: 'Bible > OT Peshitta' },
  { fileCode: '62007', abbreviation: 'P Ju',   name: 'Judges',        group: 'Bible > OT Peshitta' },
  { fileCode: '62008', abbreviation: 'P 1S',   name: '1 Samuel',      group: 'Bible > OT Peshitta' },
  { fileCode: '62009', abbreviation: 'P 2S',   name: '2 Samuel',      group: 'Bible > OT Peshitta' },
  { fileCode: '62010', abbreviation: 'P 1K',   name: '1 Kings',       group: 'Bible > OT Peshitta' },
  { fileCode: '62011', abbreviation: 'P 2K',   name: '2 Kings',       group: 'Bible > OT Peshitta' },
  { fileCode: '62012', abbreviation: 'P Is',   name: 'Isaiah',        group: 'Bible > OT Peshitta' },
  { fileCode: '62013', abbreviation: 'P Je',   name: 'Jeremiah',      group: 'Bible > OT Peshitta' },
  { fileCode: '62014', abbreviation: 'P Ez',   name: 'Ezekiel',       group: 'Bible > OT Peshitta' },
  { fileCode: '62015', abbreviation: 'P Ho',   name: 'Hosea',         group: 'Bible > OT Peshitta' },
  { fileCode: '62016', abbreviation: 'P Joel', name: 'Joel',          group: 'Bible > OT Peshitta' },
  { fileCode: '62017', abbreviation: 'P Am',   name: 'Amos',          group: 'Bible > OT Peshitta' },
  { fileCode: '62018', abbreviation: 'P Ob',   name: 'Obadiah',       group: 'Bible > OT Peshitta' },
  { fileCode: '62019', abbreviation: 'P Jonah', name: 'Jonah',        group: 'Bible > OT Peshitta' },
  { fileCode: '62020', abbreviation: 'P Mi',   name: 'Micah',         group: 'Bible > OT Peshitta' },
  { fileCode: '62021', abbreviation: 'P Na',   name: 'Nahum',         group: 'Bible > OT Peshitta' },
  { fileCode: '62022', abbreviation: 'P Hab',  name: 'Habakkuk',      group: 'Bible > OT Peshitta' },
  { fileCode: '62023', abbreviation: 'P Zep',  name: 'Zephaniah',     group: 'Bible > OT Peshitta' },
  { fileCode: '62024', abbreviation: 'P Hag',  name: 'Haggai',        group: 'Bible > OT Peshitta' },
  { fileCode: '62025', abbreviation: 'P Ze',   name: 'Zechariah',     group: 'Bible > OT Peshitta' },
  { fileCode: '62026', abbreviation: 'P Ma',   name: 'Malachi',       group: 'Bible > OT Peshitta' },
  { fileCode: '62027', abbreviation: 'P Ps',   name: 'Psalms',        group: 'Bible > OT Peshitta' },
  { fileCode: '62028', abbreviation: 'P Job',  name: 'Job',           group: 'Bible > OT Peshitta' },
  { fileCode: '62029', abbreviation: 'P Prov', name: 'Proverbs',      group: 'Bible > OT Peshitta' },
  { fileCode: '62030', abbreviation: 'P Ruth', name: 'Ruth',          group: 'Bible > OT Peshitta' },
  { fileCode: '62031', abbreviation: 'P Song', name: 'Song of Songs', group: 'Bible > OT Peshitta' },
  { fileCode: '62032', abbreviation: 'P Eccl', name: 'Ecclesiastes',  group: 'Bible > OT Peshitta' },
  { fileCode: '62033', abbreviation: 'P Lam',  name: 'Lamentations',  group: 'Bible > OT Peshitta' },
  { fileCode: '62034', abbreviation: 'P Esth', name: 'Esther',        group: 'Bible > OT Peshitta' },
  { fileCode: '62035', abbreviation: 'P Dan',  name: 'Stories about Daniel', group: 'Bible > OT Peshitta' },
  { fileCode: '62036', abbreviation: 'P Ezra', name: 'Ezra',          group: 'Bible > OT Peshitta' },
  { fileCode: '62037', abbreviation: 'P Neh',  name: 'Nehemiah',      group: 'Bible > OT Peshitta' },
  { fileCode: '62038', abbreviation: 'P 1Ch',  name: '1 Chronicles',  group: 'Bible > OT Peshitta' },
  { fileCode: '62039', abbreviation: 'P 2Ch',  name: '2 Chronicles',  group: 'Bible > OT Peshitta' },

  // ── Bible > Old Syriac Gospels (category 2) ──
  { fileCode: '60040', abbreviation: 'OS Mt', name: 'Old Syriac Matthew',  group: 'Bible > Old Syriac Gospels' },
  { fileCode: '60041', abbreviation: 'OS Mk', name: 'Old Syriac Mark',     group: 'Bible > Old Syriac Gospels' },
  { fileCode: '60042', abbreviation: 'OS Lk', name: 'Old Syriac Luke',     group: 'Bible > Old Syriac Gospels' },
  { fileCode: '60043', abbreviation: 'OS Jn', name: 'Old Syriac John',     group: 'Bible > Old Syriac Gospels' },

  // ── Bible > NT Peshitta (category 3) ──
  { fileCode: '62040', abbreviation: 'P Mt',    name: 'Matthew',       group: 'Bible > NT Peshitta' },
  { fileCode: '62041', abbreviation: 'P Mk',    name: 'Mark',          group: 'Bible > NT Peshitta' },
  { fileCode: '62042', abbreviation: 'P Lk',    name: 'Luke',          group: 'Bible > NT Peshitta' },
  { fileCode: '62043', abbreviation: 'P Jn',    name: 'John',          group: 'Bible > NT Peshitta' },
  { fileCode: '62044', abbreviation: 'P Acts',  name: 'Acts',          group: 'Bible > NT Peshitta' },
  { fileCode: '62045', abbreviation: 'Rom',     name: 'Romans',        group: 'Bible > NT Peshitta' },
  { fileCode: '62046', abbreviation: '1Cor',    name: '1 Corinthians', group: 'Bible > NT Peshitta' },
  { fileCode: '62047', abbreviation: '2Cor',    name: '2 Corinthians', group: 'Bible > NT Peshitta' },
  { fileCode: '62048', abbreviation: 'Gal',     name: 'Galatians',     group: 'Bible > NT Peshitta' },
  { fileCode: '62049', abbreviation: 'Eph',     name: 'Ephesians',     group: 'Bible > NT Peshitta' },
  { fileCode: '62050', abbreviation: 'Phil',    name: 'Philippians',   group: 'Bible > NT Peshitta' },
  { fileCode: '62051', abbreviation: 'Col',     name: 'Colossians',    group: 'Bible > NT Peshitta' },
  { fileCode: '62052', abbreviation: '1Th',     name: '1 Thessalonians', group: 'Bible > NT Peshitta' },
  { fileCode: '62053', abbreviation: '2Th',     name: '2 Thessalonians', group: 'Bible > NT Peshitta' },
  { fileCode: '62054', abbreviation: '1Tim',    name: '1 Timothy',     group: 'Bible > NT Peshitta' },
  { fileCode: '62055', abbreviation: '2Tim',    name: '2 Timothy',     group: 'Bible > NT Peshitta' },
  { fileCode: '62056', abbreviation: 'Tit',     name: 'Titus',         group: 'Bible > NT Peshitta' },
  { fileCode: '62057', abbreviation: 'Phile',   name: 'Philemon',      group: 'Bible > NT Peshitta' },
  { fileCode: '62058', abbreviation: 'Heb',     name: 'Hebrews',       group: 'Bible > NT Peshitta' },
  { fileCode: '62059', abbreviation: 'Js',      name: 'James',         group: 'Bible > NT Peshitta' },
  { fileCode: '62060', abbreviation: '1Pet',    name: '1 Peter',       group: 'Bible > NT Peshitta' },
  { fileCode: '62062', abbreviation: '1Jn',     name: '1 John',        group: 'Bible > NT Peshitta' },
  { fileCode: '63061', abbreviation: '2Pet',    name: '2 Peter',       group: 'Bible > NT Peshitta' },
  { fileCode: '63063', abbreviation: '2Jn',     name: '2 John',        group: 'Bible > NT Peshitta' },
  { fileCode: '63064', abbreviation: '3Jn',     name: '3 John',        group: 'Bible > NT Peshitta' },
  { fileCode: '63065', abbreviation: 'Jude',    name: 'Jude',          group: 'Bible > NT Peshitta' },
  { fileCode: '63066', abbreviation: 'Rev',     name: 'Revelation',    group: 'Bible > NT Peshitta' },

  // ── Bible > Apocrypha/Pseudepigrapha (category 4) ──
  { fileCode: '60406', abbreviation: 'ApocDan',  name: 'Apocalypse of Daniel',        group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62065', abbreviation: 'Judith',   name: 'Judith',                       group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62066', abbreviation: 'Sirach',   name: 'Sirach',                       group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62067', abbreviation: 'Tobit',    name: 'Tobit',                        group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62068', abbreviation: 'Tobit A',  name: 'Tobit (recension A)',          group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62069', abbreviation: 'P Baruch', name: 'Baruch',                       group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62070', abbreviation: 'P Wisd',   name: 'Wisdom of Solomon',            group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62071', abbreviation: 'P ApocBar', name: 'Apocalypse of Baruch',        group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62072', abbreviation: 'P 4Ezra',  name: '4 Ezra',                       group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62073', abbreviation: 'ActsThom', name: 'Acts of Thomas',               group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62074', abbreviation: 'EpisJer',  name: 'Epistle of Jeremiah',          group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62078', abbreviation: 'P 1Mac',   name: '1 Maccabees',                  group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62079', abbreviation: 'P 2Mac',   name: '2 Maccabees',                  group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62080', abbreviation: 'P 3Mac',   name: '3 Maccabees',                  group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62081', abbreviation: 'P 4Mac',   name: '4 Maccabees',                  group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62082', abbreviation: '1Esdras',  name: '1 Esdras (3 Ezra)',            group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62084', abbreviation: 'P PrMan',  name: 'Prayer of Manasseh',           group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62085', abbreviation: 'ApocPs',   name: 'Syriac Apocryphal Psalms',     group: 'Bible > Apocrypha/Pseudepigrapha' },
  { fileCode: '62087', abbreviation: 'PsS',      name: 'Psalms of Solomon',            group: 'Bible > Apocrypha/Pseudepigrapha' },

  // ── Bible > Commentaries (category 5) ──
  { fileCode: '60100', abbreviation: 'AGnEx',       name: 'Ephrem on Genesis and Exodus',      group: 'Bible > Commentaries' },
  { fileCode: '60101', abbreviation: 'ADiatess1990', name: 'Ephrem on the Diatessaron (1990)',  group: 'Bible > Commentaries' },
  { fileCode: '60102', abbreviation: 'ADiatess1996', name: 'Ephrem on the Diatessaron (PPalau Rib.2)', group: 'Bible > Commentaries' },
  { fileCode: '60403', abbreviation: 'AQoh',        name: 'Ephrem on Qohelet',                 group: 'Bible > Commentaries' },
  { fileCode: '63100', abbreviation: 'IshPs',       name: 'Ishodad of Merv on Psalms',         group: 'Bible > Commentaries' },
  { fileCode: '63101', abbreviation: 'IshGen',      name: 'Ishodad of Merv on Genesis',        group: 'Bible > Commentaries' },
  { fileCode: '63102', abbreviation: 'IshEz',       name: 'Ishodad of Merv on Ezekiel',        group: 'Bible > Commentaries' },
  { fileCode: '63103', abbreviation: 'IshJer',      name: 'Ishodad of Merv on Jeremiah & Lamentations', group: 'Bible > Commentaries' },
  { fileCode: '63104', abbreviation: 'IshIsa',      name: 'Ishodad of Merv on Isaiah',         group: 'Bible > Commentaries' },
  { fileCode: '63105', abbreviation: 'IshDan',      name: 'Ishodad of Merv on Daniel',         group: 'Bible > Commentaries' },
  { fileCode: '63106', abbreviation: 'IshExod',     name: 'Ishodad of Merv on Exodus',         group: 'Bible > Commentaries' },
  { fileCode: '63107', abbreviation: 'IshLev',      name: 'Ishodad of Merv on Leviticus',      group: 'Bible > Commentaries' },
  { fileCode: '63108', abbreviation: 'IshNum',      name: 'Ishodad of Merv on Numbers',        group: 'Bible > Commentaries' },
  { fileCode: '63109', abbreviation: 'IshDeut',     name: 'Ishodad of Merv on Deuteronomy',    group: 'Bible > Commentaries' },
  { fileCode: '63110', abbreviation: 'IshSong',     name: 'Ishodad of Merv on Song of Songs',  group: 'Bible > Commentaries' },

  // ── Poetry > Metrical Homilies & Hymns (category 6) ──
  { fileCode: '60420', abbreviation: 'EphPar',  name: 'Ephrem: Hymns on Paradise',     group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '60421', abbreviation: 'EphFid',  name: 'Ephrem: Hymns on Faith',        group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '60422', abbreviation: 'Balai',   name: 'Balai',                          group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '60423', abbreviation: 'EphNis',  name: 'Ephrem: Hymns on Nisibis',      group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '60424', abbreviation: 'EphSerm', name: 'Ephrem: Sermons',               group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '63400', abbreviation: 'JS',      name: 'Jacob of Sarug',                group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '63401', abbreviation: 'AnonVerse', name: 'Anonymous Verse Homilies',    group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '63402', abbreviation: 'JS_Elisha', name: 'Jacob of Sarug on Elisha',    group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '63403', abbreviation: 'JS_Elijah', name: 'Jacob of Sarug on Elijah',    group: 'Poetry > Metrical Homilies & Hymns' },
  { fileCode: '63404', abbreviation: 'JSBhom',  name: 'Jacob of Sarug: Bedjan Homilies', group: 'Poetry > Metrical Homilies & Hymns' },

  // ── Poetry > Dispute Poems (category 7) ──
  { fileCode: '60402', abbreviation: 'SugMgab',   name: 'Dispute Poems',     group: 'Poetry > Dispute Poems' },
  { fileCode: '63420', abbreviation: 'SinSatan2', name: 'Sinai vs. Satan',   group: 'Poetry > Dispute Poems' },

  // ── Religion (category 8) ──
  { fileCode: '60375', abbreviation: 'StatNis',  name: 'Statutes of the School of Nisibis', group: 'Religion' },
  { fileCode: '60376', abbreviation: 'TDN',      name: 'Teaching of the Apostles',          group: 'Religion' },
  { fileCode: '60404', abbreviation: 'PagPhil',  name: 'Prophecies of Pagan Philosophers',  group: 'Religion' },
  { fileCode: '60450', abbreviation: 'AphDem',   name: 'Aphrahat: Demonstrations',          group: 'Religion' },
  { fileCode: '60451', abbreviation: 'JnPhil',   name: 'John Philoponus',                   group: 'Religion' },
  { fileCode: '60452', abbreviation: 'HS',       name: 'Hymn of the Soul',                  group: 'Religion' },
  { fileCode: '60453', abbreviation: 'GregOr',   name: 'Gregory of Nazianzen: Orationes',   group: 'Religion' },
  { fileCode: '60454', abbreviation: 'ThMAA',    name: 'Theodore of Mopsuestia: Against the Allegorists', group: 'Religion' },
  { fileCode: '60456', abbreviation: 'GregNysLR', name: 'Gregory of Nyssa: On Physical Life and Resurrection', group: 'Religion' },
  { fileCode: '60457', abbreviation: 'IsNin',    name: 'Isaac of Nineveh',                  group: 'Religion' },
  { fileCode: '60458', abbreviation: 'Philox',   name: 'Philoxenus: Discourses',            group: 'Religion' },
  { fileCode: '60500', abbreviation: 'LawsCoun', name: 'Laws of Countries',                 group: 'Religion' },
  { fileCode: '60512', abbreviation: 'LGIntro',  name: 'Liber Graduum (Book of Steps) Intro', group: 'Religion' },

  // ── Letters > Archival (category 9) ──
  { fileCode: '60551', abbreviation: 'letters',     name: 'Archival Letters',              group: 'Letters > Archival' },

  // ── Letters > Canonical (category 10) ──
  { fileCode: '60550', abbreviation: 'ALetPub',     name: 'Ephrem: Letter to Publius',     group: 'Letters > Canonical' },
  { fileCode: '60552', abbreviation: 'M.b.Serapion', name: 'Mara bar Serapion',            group: 'Letters > Canonical' },
  { fileCode: '63550', abbreviation: 'Philoxenus',  name: 'Philoxenus: Letters',           group: 'Letters > Canonical' },
  { fileCode: '63552', abbreviation: 'JewsMarcian', name: 'Letter of the Jews to Marcian', group: 'Letters > Canonical' },
  { fileCode: '64550', abbreviation: 'JElet',       name: 'Jacob of Edessa: Letter to John the Stylite', group: 'Letters > Canonical' },

  // ── Legal > Documents (category 11) ──
  { fileCode: '60300', abbreviation: 'SyrLegal', name: 'Early Syriac Legal Texts', group: 'Legal > Documents' },

  // ── Legal > Syro-Roman Law (category 12) ──
  { fileCode: '60301', abbreviation: 'Syr-RomLaw', name: 'Syro-Roman Law Book', group: 'Legal > Syro-Roman Law' },

  // ── Magic (category 14) ──
  { fileCode: '60701', abbreviation: 'SyrAm',       name: 'Syriac Amulets',              group: 'Magic' },
  { fileCode: '60702', abbreviation: 'SyrCharm',    name: 'Syriac Magical Charm Texts',  group: 'Magic' },
  { fileCode: '63700', abbreviation: 'SyrIncBowl',  name: 'Moriggi Incantation Bowls',   group: 'Magic' },
  { fileCode: '63701', abbreviation: 'SyrIncBowl2', name: 'Additional Syriac Incantation Bowls', group: 'Magic' },

  // ── Science/Philosophy (category 15) ──
  { fileCode: '60800', abbreviation: 'MetTheo',  name: 'Meteorology of Theophrastus',  group: 'Science/Philosophy' },
  { fileCode: '60801', abbreviation: 'HippAp',   name: 'Hippocrates: Aphorisms',       group: 'Science/Philosophy' },
  { fileCode: '60802', abbreviation: 'DeMundo',  name: 'De Mundo',                     group: 'Science/Philosophy' },
  { fileCode: '60803', abbreviation: 'JudSyrMed', name: 'Judeo-Syriac Medical Fragments', group: 'Science/Philosophy' },
  { fileCode: '60804', abbreviation: 'CausCaus', name: 'Causa Causarum',               group: 'Science/Philosophy' },
  { fileCode: '60805', abbreviation: 'ProbaPrAn', name: "Proba's Prior Analytics",     group: 'Science/Philosophy' },
  { fileCode: '60806', abbreviation: 'SevSebLog', name: 'Severus Sebokht on Logic',    group: 'Science/Philosophy' },
  { fileCode: '60807', abbreviation: 'SebAstro', name: 'Severus Sebokht on the Astrolabe', group: 'Science/Philosophy' },

  // ── History (category 16) ──
  { fileCode: '60501', abbreviation: 'Addai',      name: 'Teaching of Addai',         group: 'History' },
  { fileCode: '60502', abbreviation: 'CuretonDocs', name: 'Cureton Documents',        group: 'History' },
  { fileCode: '63500', abbreviation: 'JnNhel',     name: 'Life of John of Nhel',      group: 'History' },
  { fileCode: '64500', abbreviation: 'JoshStyl',   name: 'Joshua the Stylite',        group: 'History' },
  { fileCode: '64501', abbreviation: 'ChrEdess',   name: 'Chronicle of Edessa',       group: 'History' },

  // ── Narratives > Novels/Histories (category 17) ──
  { fileCode: '6050201', abbreviation: 'PeterRome', name: 'Peter in Rome',              group: 'Narratives > Novels/Histories' },
  { fileCode: '60504', abbreviation: 'PsClRec',    name: 'Pseudo-Clementine Recognitions', group: 'Narratives > Novels/Histories' },
  { fileCode: '60505', abbreviation: 'PsClHom',    name: 'Pseudo-Clementine Homilies', group: 'Narratives > Novels/Histories' },
  { fileCode: '60510', abbreviation: 'JulAth',     name: 'Julian in Athens',            group: 'Narratives > Novels/Histories' },
  { fileCode: '60601', abbreviation: 'SyrAhiq',    name: 'Syriac Ahiqar',              group: 'Narratives > Novels/Histories' },

  // ── Narratives > Martyrologies (category 18) ──
  { fileCode: '60511', abbreviation: 'VitaSec',  name: 'Vita Secundi',   group: 'Narratives > Martyrologies' },

  // ── Various (category 19) ──
  { fileCode: '60600', abbreviation: 'LSt', name: 'Laughable Stories', group: 'Various' },

  // ── Inscriptions (category 20) ──
  { fileCode: '61000', abbreviation: 'OldSyrInsc', name: 'Old Syriac Inscriptions (1st-3rd c.)', group: 'Inscriptions' },
  { fileCode: '61001', abbreviation: 'ClassSyrInsc', name: 'Classical Syriac Inscriptions (4th c. on)', group: 'Inscriptions' },
  { fileCode: '61200', abbreviation: 'SyrCoins',   name: 'Syriac Coins',                group: 'Inscriptions' },
];

/** Search/filter texts by query string. Matches name, abbreviation, group, or fileCode. */
export function searchTexts(query: string): CALTextInfo[] {
  if (!query.trim()) return CAL_TEXTS;
  const q = query.trim().toLowerCase();
  return CAL_TEXTS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q) ||
      t.fileCode.includes(q)
  );
}

/** Get texts grouped by their group field. */
export function getTextsByGroup(): Map<string, CALTextInfo[]> {
  const map = new Map<string, CALTextInfo[]>();
  for (const t of CAL_TEXTS) {
    const list = map.get(t.group) || [];
    list.push(t);
    map.set(t.group, list);
  }
  return map;
}

/** Find a text by its fileCode. */
export function findText(fileCode: string): CALTextInfo | undefined {
  return CAL_TEXTS.find((t) => t.fileCode === fileCode);
}
