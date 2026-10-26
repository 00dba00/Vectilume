# NBA — popis ikona za kolekciju "Općenito"

Izvor: https://github.com/00dba00/nba_react_frontend (`@mui/icons-material`, 273 ikone;
`lucide-react`, 49 ikona) i https://github.com/00dba00/nba_backend (bez biblioteke ikona; u
e-mail predlošcima samo emoji ❌ ✅ 📋).

Varijante istog pojma (Outlined, Rounded, Border, MUI + lucide) su spojene. Broj u zagradi =
u koliko datoteka se pojam koristi.

## Već postoji

- **Općenito (kolekcija 02):** check, close, x-circle, check-circle, check-double, plus, minus,
  trash, edit, save, copy, send, download, refresh, undo, history, filter, search-x, play,
  chevron-*, arrow-left, external-link, menu, more-vertical, info, help-circle, alert-circle,
  alert-triangle, lock, eye, eye-off, shield-check, bell-off, users, user-plus, user-circle,
  mail, inbox, message-square, thumbs-up/down, trophy, podium, target, star, flame, zap,
  swords, trending-up/down, activity, gauge, layers, database, receipt, ticket, dollar, coins,
  calculator, shopping-cart, clock, calendar-x, hourglass, sparkles, bot, flask, lightbulb,
  rocket, puzzle, bug, code, book-open, list-checks, palette, image, camera, folder-open,
  globe, smartphone, moon, sun, circle.
- **Početnih 12 Gloss ikona** (`src/distinctive-gloss`, nisu ni u jednoj kolekciji): home,
  settings, search, bell, shield, user, calendar, wallet, document, chart (+ heart, car).
  NBA ih koristi, pa ih treba premjestiti u kolekciju 02 da mogu na npm.
- **Hobiji (kolekcija 01):** basketball (SportsBasketball, 44), football (SportsSoccer),
  boxing (SportsMma), karate (SportsMartialArts), hiking, gym (FitnessCenter),
  video-games (SportsEsports, Games). Na npm idu samo ako se objavi kolekcija Hobiji.
- **Preskočeno:** GitHub (logo brenda — ne crtamo tuđe brendove).

## Za nacrtati (71)

| id | MUI / lucide | koristi se |
|---|---|---|
| **Navigacija** | | |
| arrow-up | ArrowUpward / ArrowUp | 12 |
| arrow-down | ArrowDownward / ArrowDown | 12 |
| arrow-right | ArrowForward, TrendingFlat / ArrowRight | 4 |
| arrow-up-right | — / ArrowUpRight | 3 |
| chevrons-up | KeyboardDoubleArrowUp | 2 |
| more-horizontal | MoreHoriz / Ellipsis | 2 |
| grip-vertical | DragIndicator | 1 |
| swap-horizontal | CompareArrows, SwapHoriz | 28 |
| swap-vertical | SwapVert | 4 |
| **Akcije** | | |
| plus-circle | AddCircle | 2 |
| minus-circle | RemoveCircle, RemoveCircleOutline | 3 |
| play-circle | PlayCircle, PlayCircleOutline | 2 |
| repeat | — / Repeat | 1 |
| upload | Publish | 2 |
| link | Link | 1 |
| paperclip | AttachFile | 3 |
| bookmark | Bookmark, BookmarkBorder, Bookmarks / Bookmark | 6 |
| flag | Flag | 3 |
| broom | CleaningServices | 3 |
| wand | AutoFixHigh | 1 |
| merge | MergeType | 1 |
| **Status i sustav** | | |
| ban | Block, DoNotDisturbAlt | 6 |
| circle-dot | — / CircleDot | 1 |
| circle-ellipsis | Pending | 18 |
| bell-ring | NotificationsActive | 2 |
| shield-alert | — / ShieldAlert | 3 |
| shield-user | AdminPanelSettings | 3 |
| badge-check | Verified, NewReleases | 5 |
| key | VpnKey, Key | 4 |
| cloud-check | CloudDone | 1 |
| cpu | Memory, ModelTraining / Cpu | 15 |
| monitor | Computer, Devices | 2 |
| sliders | Tune, TuneRounded / SlidersHorizontal | 11 |
| **Korisnici i komunikacija** | | |
| user-x | PersonOff / UserX | 12 |
| user-search | PersonSearch | 3 |
| id-card | Badge | 1 |
| handshake | Handshake | 5 |
| **Natjecanje i sport** | | |
| whistle | Sports | 5 |
| flag-checkered | SportsScore | 5 |
| scoreboard | Scoreboard | 1 |
| stadium | Stadium | 4 |
| dice | Casino | 12 |
| first-aid | LocalHospital, MedicalServices | 13 |
| bandage | Healing | 8 |
| snowflake | AcUnit | 5 |
| plane | FlightTakeoff, Flight | 12 |
| bed | Hotel | 2 |
| sofa | Weekend | 2 |
| **Analitika i novac** | | |
| chart-line | ShowChart, Timeline, LinearScale | 44 |
| insights | Insights, AutoGraph | 22 |
| percent | Percent | 6 |
| table | TableChart | 6 |
| scale | Balance / Scale | 2 |
| bank | AccountBalance | 3 |
| piggy-bank | Savings | 1 |
| shopping-bag | — / ShoppingBag | 1 |
| briefcase | BusinessCenter | 1 |
| function | Functions, FunctionsRounded | 4 |
| infinity | AllInclusive | 1 |
| **Vrijeme** | | |
| timer | Timer | 5 |
| **AI i razno** | | |
| brain | Psychology | 20 |
| dashboard | Dashboard, SpaceDashboard | 5 |
| grid | ViewModule, Widgets | 8 |
| columns | ViewWeek | 1 |
| list | List, ViewList, ListAlt, Notes | 11 |
| list-ordered | — / ListOrdered | 1 |
| clipboard | Assignment (+ 📋 u e-mailu) | 2 |
| file-pdf | PictureAsPdf | 4 |
| map-pin | LocationOn | 2 |
| hash | Tag | 1 |
| gavel | Gavel | 2 |

## Spojeno s postojećim (bez nove ikone)

Cancel, Clear, HighlightOff → x-circle · EmojiEvents → trophy · ExpandMore/Less,
KeyboardArrow*, ArrowDrop* → chevron-* · Warning, WarningAmber, ReportProblem → alert-triangle ·
Error, ErrorOutline, PriorityHigh → alert-circle · Speed → gauge · AccessTime, Schedule → clock ·
AutoAwesome → sparkles · Whatshot, LocalFireDepartment → flame · Leaderboard → podium ·
Science → flask · Sync, Autorenew, RestartAlt, Replay, AutoMode → refresh · Restore, Update →
history · BarChart, Assessment, Analytics, Equalizer, Poll → chart · CalendarToday,
CalendarMonth, Event, Today → calendar · AttachMoney → dollar · MonetizationOn, Toll, Payments →
coins · Storage → database · Groups, Group, Groups2, People* → users · GroupAdd, PersonAdd →
user-plus · AccountBalanceWallet → wallet · Security → shield · HealthAndSafety → shield-check ·
DataUsage → pie-chart · TrackChanges → target · Stars, StarBorder → star · SmartToy → bot ·
MenuBook → book-open · FactCheck → list-checks · Extension → puzzle · Brush → palette ·
Api → code · Language, Public → globe · SaveAlt, GetApp → download · Drafts, Email → mail ·
MarkunreadMailbox → inbox · Feedback, ChatBubbleOutline → message-square · MonitorHeart →
activity · ConfirmationNumber → ticket · Description, Article → document · EditNote,
HistoryEdu → edit · DeleteSweep, ClearAll → trash · AddShoppingCart → shopping-cart ·
HorizontalRule → minus · FiberManualRecord → circle · ViewAgenda, ViewDay → list ·
QueryStats → search
