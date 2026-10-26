import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Each drawing has a primary silhouette and a small identifying detail.
// Coordinates are authored on Vectilume's 24 x 24 grid.
const groups = [
  ['team-sports', 'Ekipni sportovi', [
    ['football', 'Nogomet', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M9 10l3-2 3 2-1 4h-4Z', 'M12 8V5;M10 14l-2 3;M14 14l2 3'],
    ['futsal', 'Mali nogomet', 'M5 5h14v14H5Z;M12 5v14;M9 12a3 3 0 0 0 6 0 3 3 0 0 0-6 0Z', 'M7 8h2;M15 16h2'],
    ['basketball', 'Košarka', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M3 12h18;M12 3v18', 'M5 6c5 1 9 11 14 12;M19 6C14 7 10 17 5 18'],
    ['volleyball', 'Odbojka', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M4 8c5-3 11-1 15 2;M6 18c0-5 3-10 7-14', 'M20 14c-4-2-9-2-13 1'],
    ['handball', 'Rukomet', 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z;M8 10l4-2 4 2-1 5h-6Z', 'M4 12H2;M22 12h-2'],
    ['rugby', 'Ragbi', 'M5 19C2 14 6 6 19 5c1 11-6 17-14 14Z', 'M7 17 17 7;M9 12l3 3;M12 9l3 3'],
    ['american-football', 'Američki nogomet', 'M4 19C2 12 9 4 20 5c1 10-8 17-16 14Z', 'M7 17 17 7;M9 12l3 3;M12 9l3 3;M15 6l3 3'],
    ['baseball', 'Bejzbol', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M7 5c3 4 3 10 0 14;M17 5c-3 4-3 10 0 14;M6 9l3 2;M15 13l3 2'],
    ['cricket', 'Kriket', 'M7 3h7v15H7Z;M5 18h12;M19 5l2 2-7 8-2-2Z', 'M9 6h3;M9 9h3'],
    ['field-hockey', 'Hokej na travi', 'M4 4l3 14h10l3-3;M17 18h3', 'M18 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
  ]],
  ['precision-sports', 'Reketi i preciznost', [
    ['tennis', 'Tenis', 'M15 3c-4 0-7 4-7 8 0 3 2 5 5 5 4 0 7-4 7-8 0-3-2-5-5-5Z;M10 15l-6 6', 'M8 7c5 0 8 3 8 8;M5 5h2'],
    ['table-tennis', 'Stolni tenis', 'M14 3a6 6 0 0 0-6 6c0 2 1 4 3 5l5-5c-1-3-2-5-2-6Z;M11 14l-6 7', 'M19 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['badminton', 'Badminton', 'M5 3l8 8;M3 5l8 8;M8 2l7 8-5 5-8-7Z', 'M15 13l6 6-2 2-6-6'],
    ['squash', 'Squash', 'M16 3c-5 0-8 4-8 8 0 3 2 5 5 5 4 0 7-4 7-8 0-3-2-5-4-5Z;M10 15l-6 6', 'M5 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['padel', 'Padel', 'M12 3c-4 0-7 3-7 7v4c0 2 2 3 4 3h6c2 0 4-1 4-3v-4c0-4-3-7-7-7Z;M12 17v4', 'M8 7h8;M8 10h8;M9 13h6'],
    ['golf', 'Golf', 'M6 21h12;M12 20V4l7 2-7 3', 'M17 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['bowling', 'Kuglanje', 'M6 4c-2 6-3 10-2 14 1 2 5 3 7 0 1-4 0-8-2-14Z', 'M17 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z;M7 7h.01'],
    ['darts', 'Pikado', 'M11 3a9 9 0 1 0 9 9;M11 7a5 5 0 1 0 5 5;M11 11a1 1 0 1 0 1 1', 'M12 12 21 3;M17 3h4v4'],
    ['billiards', 'Biljar', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M9 13h6;M9 13V9h6v4', 'M4 20 20 4'],
    ['shooting', 'Streljaštvo', 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z;M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 2v4;M12 18v4;M2 12h4;M18 12h4'],
  ]],
  ['water', 'Voda', [
    ['swimming', 'Plivanje', 'M5 10l5-3 5 4 4-1;M3 15c2-2 4 2 6 0s4 2 6 0 4 2 6 0', 'M17 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M3 19c2-2 4 2 6 0s4 2 6 0 4 2 6 0'],
    ['water-polo', 'Vaterpolo', 'M4 16c2-2 4 2 6 0s4 2 6 0 4 2 6 0;M9 12l3-3 3 3', 'M18 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
    ['diving', 'Ronjenje', 'M4 9c3-3 6-3 9 0v5c-3 3-6 3-9 0Z;M13 11h4l3 3', 'M5 18c3 2 6 2 9 0;M17 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z'],
    ['snorkeling', 'Snorkeling', 'M4 8h11v7H4Z;M15 10h4V4h2', 'M6 17c4 3 8 3 12 0'],
    ['surfing', 'Surfanje', 'M4 19c5-1 10-5 16-14-1 10-6 15-16 14Z', 'M3 14c3-3 5 3 8 0;M14 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['sailing', 'Jedrenje', 'M12 3v15;M12 4 4 16h8;M14 8l6 8h-6;M3 19h18', 'M6 21c2-1 3 1 5 0s3 1 5 0 3 1 5 0'],
    ['kayaking', 'Kajak', 'M3 17c5 3 13 3 18 0l-2 3H5Z;M12 7v9;M5 6l14 4', 'M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['rowing', 'Veslanje', 'M3 17c5 3 13 3 18 0l-2 3H5Z;M7 6l10 10', 'M7 5 4 8;M17 15l3 3;M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['paddleboarding', 'SUP', 'M3 19c5 2 13 2 18 0;M12 7v11;M5 5l3 12', 'M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M16 11l3 4'],
    ['fishing', 'Ribolov', 'M5 20V8a6 6 0 0 1 12 0v7;M17 15c0 3-3 4-5 2', 'M15 8h4;M5 20l-2 2'],
  ]],
  ['martial-arts', 'Borilačke vještine', [
    ['boxing', 'Boks', 'M5 10V6c0-2 2-3 4-3h5c2 0 3 1 3 3v4l3 3v6H7l-3-4Z', 'M8 8h6;M8 13h8'],
    ['kickboxing', 'Kickboxing', 'M4 6l5 4 3-3 4 3-2 4-4 2-5-4Z;M15 15l6 3-2 3-7-1', 'M7 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['karate', 'Karate', 'M7 5 3 10l5 3-2 8h12l-2-8 5-3-4-5-5 4Z', 'M7 14h10;M12 14v7'],
    ['judo', 'Judo', 'M5 5 3 10l5 4-2 7h12l-2-7 5-4-2-5-7 4Z', 'M8 14l8 3;M16 14l-8 3'],
    ['taekwondo', 'Taekwondo', 'M5 5l4 4 3-2 3 2 4-4 2 5-5 4 2 7H6l2-7-5-4Z', 'M8 15h8;M12 7v8'],
    ['jiu-jitsu', 'Jiu-jitsu', 'M4 7l5-3 3 4 3-4 5 3-2 6-3-2v10H9V11l-3 2Z', 'M8 15c2 2 6 2 8 0;M12 8v5'],
    ['wrestling', 'Hrvanje', 'M6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M18 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M4 14l5-3 3 4 3-4 5 3', 'M7 18l5-3 5 3;M7 18l-2 3;M17 18l2 3'],
    ['muay-thai', 'Muay thai', 'M5 8l4-4 3 5 3-5 4 4-3 5 3 6H5l3-6Z', 'M9 13h6;M7 17h10'],
    ['fencing', 'Mačevanje', 'M4 20 19 5;M17 3l4 4;M8 16l-3-3;M3 18l3 3', 'M14 9l2 2'],
    ['aikido', 'Aikido', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z;M4 18c3-5 13-5 16 0;M5 20h14', 'M12 11v7;M8 16l4 3 4-3'],
  ]],
  ['fitness', 'Fitness i kretanje', [
    ['running', 'Trčanje', 'M14 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 9l-3 4 4 2 2-4;M13 15l-4 6;M15 12l5 2', 'M5 12h3;M3 17h4'],
    ['walking', 'Hodanje', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 8l-1 6 4 3 2 4;M11 14l-4 7', 'M8 10l4-2 4 3'],
    ['gym', 'Teretana', 'M3 9h3v6H3Z;M6 12h12;M18 9h3v6h-3Z', 'M8 7v10;M16 7v10'],
    ['weightlifting', 'Dizanje utega', 'M3 5v10;M6 3v14;M6 10h12;M18 3v14;M21 5v10', 'M9 18l3 3 3-3'],
    ['yoga', 'Joga', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 9v6;M5 12l7-3 7 3;M4 20l8-5 8 5', 'M8 18h8'],
    ['pilates', 'Pilates', 'M4 19h16;M12 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M6 16l6-5 6 5', 'M8 16l-3 3;M16 16l3 3'],
    ['calisthenics', 'Kalistenika', 'M4 4v17;M20 4v17;M4 6h16;M12 7v7;M7 14l5-1 5 1', 'M9 18l3-4 3 4'],
    ['aerobics', 'Aerobik', 'M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 9v5;M5 6l7 3 7-3;M6 20l6-6 6 6', 'M3 12h3;M18 12h3'],
    ['stretching', 'Istezanje', 'M17 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M16 9l-5 5-7 1;M11 14l8 6;M11 14l-3 7', 'M3 8l5 2 8-1'],
    ['jump-rope', 'Preskakanje užeta', 'M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 9v6;M8 20l4-5 4 5;M3 8c0 14 18 14 18 0', 'M7 11l5-2 5 2'],
  ]],
  ['outdoors', 'Priroda i planine', [
    ['hiking', 'Planinarenje', 'M3 20 10 6l4 8 2-4 5 10Z', 'M9 16h4;M10 4h3'],
    ['trekking', 'Trekking', 'M3 19 9 8l4 6 3-5 5 10Z;M6 21h13', 'M17 4v12;M16 4h2'],
    ['camping', 'Kampiranje', 'M3 20 12 5l9 15Z;M12 5v15;M8 20l4-7 4 7', 'M4 22h16'],
    ['climbing', 'Penjanje', 'M4 21 10 3l4 4 6-4v18Z', 'M8 16l3-2 2 3;M15 10l3-2'],
    ['bouldering', 'Bouldering', 'M3 20 7 6l6-3 8 8-2 9Z', 'M8 13l3-2;M15 15l3-2'],
    ['orienteering', 'Orijentacijsko trčanje', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M10 10l7-3-3 7-7 3Z', 'M12 2v3;M12 19v3'],
    ['birdwatching', 'Promatranje ptica', 'M3 14c6-1 7-8 14-8-2 3-2 5 4 6-5 1-6 7-12 7-3 0-5-2-6-5Z', 'M16 8h.01;M4 21l5-3'],
    ['mushroom-foraging', 'Skupljanje gljiva', 'M4 11c0-5 4-8 8-8s8 3 8 8Z;M9 11v8h6v-8', 'M7 8h.01;M16 8h.01;M6 21h12'],
    ['hunting', 'Lov', 'M12 4v16;M4 12h16;M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z', 'M12 2v2;M12 20v2;M2 12h2;M20 12h2'],
    ['geocaching', 'Geocaching', 'M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12Z;M9 10h6v5H9Z', 'M12 8v4;M10 10h4'],
  ]],
  ['wheels', 'Kotači', [
    ['cycling', 'Biciklizam', 'M6 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z;M18 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z;M6 18l4-9 4 9 4-8;M10 9h5', 'M8 7h4'],
    ['mountain-biking', 'Brdski biciklizam', 'M5 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z;M19 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z;M5 18l5-8 4 8 5-8', 'M3 8l5-5 4 4 4-3 5 5'],
    ['bmx', 'BMX', 'M5 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z;M19 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z;M5 18l5-8 4 8 5-8', 'M10 10h5;M14 8h4'],
    ['skateboarding', 'Skateboard', 'M3 13c0 3 2 4 5 4h8c3 0 5-1 5-4;M5 17v2;M19 17v2', 'M6 19a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z;M18 19a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z'],
    ['roller-skating', 'Rolanje', 'M5 5h10v8l4 3v2H4V9Z', 'M7 20h.01;M11 20h.01;M15 20h.01;M8 8h4'],
    ['scooter', 'Romobil', 'M3 18h14l4-12;M17 6h4;M7 18l3-6', 'M6 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M18 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['motorcycling', 'Motociklizam', 'M4 15l4-5h7l4 5;M8 10l3-4h4;M5 17h14', 'M5 17a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z;M19 17a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'],
    ['karting', 'Karting', 'M4 15h16l-2 4H6Z;M8 12l3-5h4l2 5', 'M7 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M17 19a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['motorsport', 'Automobilizam', 'M3 12l3-5h12l3 5v7H3Z;M3 13h18', 'M7 17h.01;M17 17h.01;M9 5l3-3 3 3'],
    ['quad-biking', 'Vožnja quadom', 'M4 14h16l-2 4H6Z;M8 14l2-5h4l2 5', 'M5 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M19 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M11 6h3'],
  ]],
  ['winter-adventure', 'Zima i adrenalin', [
    ['skiing', 'Skijanje', 'M14 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M14 8l-3 5 5 3;M7 12l4 1;M3 19c5 2 13 2 18 0', 'M5 5l2 13;M19 7l1 11'],
    ['snowboarding', 'Snowboard', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 8l-2 5 5 2;M5 13l5 0;M3 20c5-2 13-2 18 0', 'M6 18l13 3'],
    ['ice-skating', 'Klizanje', 'M5 4h10v9l4 3-1 3H4l1-6Z;M3 21h17', 'M7 8h6;M9 5v7'],
    ['ice-hockey', 'Hokej na ledu', 'M5 3l3 15h10l3-3;M3 21h18', 'M15 17h4;M13 20h4'],
    ['sledding', 'Sanjkanje', 'M5 6l2 10h11l2-3;M4 19h14c2 0 3-1 3-3', 'M8 10h8;M9 7h6'],
    ['cross-country-skiing', 'Skijaško trčanje', 'M13 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 9l-3 5 5 2;M4 20h16', 'M4 7l3 12;M19 6l1 13'],
    ['paragliding', 'Paragliding', 'M3 9c3-8 15-8 18 0Z;M3 9l9 8 9-8;M12 17v4', 'M9 18h6'],
    ['skydiving', 'Padobranstvo', 'M3 9c2-8 16-8 18 0l-9 4Z;M3 9l9 9 9-9', 'M12 18v3;M9 21h6'],
    ['zipline', 'Zipline', 'M2 5 22 10;M12 8v6;M9 14h6;M12 14l-4 6;M12 14l4 6', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['rafting', 'Rafting', 'M3 15c4 3 14 3 18 0l-2 5H5Z;M4 8l16 6;M12 6v8', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
  ]],
  ['performance', 'Ples i izvedba', [
    ['ballet', 'Balet', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 8v7;M5 8l7 2 7-2;M5 16l7-2 7 2;M9 20l3-6 3 6', 'M4 21h16'],
    ['salsa', 'Salsa', 'M8 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M16 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M8 9l-3 5 4 6;M16 9l3 5-4 6', 'M8 10l4 2 4-2'],
    ['tango', 'Tango', 'M7 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M17 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M7 9l5 3 5-3;M7 9l-2 9;M17 9l2 9', 'M5 18l6 3;M19 18l-6 3'],
    ['hip-hop-dance', 'Hip-hop ples', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 8l-4 4 4 3 5-4;M12 15l-5 5;M12 15l7 5', 'M4 9l4 3;M17 11l4-3'],
    ['contemporary-dance', 'Suvremeni ples', 'M15 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M14 8l-4 5 4 3;M10 13l-7-1;M14 16l6 5', 'M10 13l-3 8'],
    ['folk-dance', 'Folklor', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M8 9h8l3 10H5Z;M4 10l4-1;M16 9l4 1', 'M8 14h8;M9 18h6'],
    ['social-dance', 'Društveni ples', 'M7 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M17 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M7 9l5 4 5-4;M7 9l-3 10;M17 9l3 10', 'M9 20l3-7 3 7'],
    ['acting', 'Gluma', 'M3 5h18v14H3Z;M7 10h3;M14 10h3;M8 14c2 3 6 3 8 0', 'M7 3v2;M17 3v2'],
    ['stand-up', 'Stand-up komedija', 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z;M6 10a6 6 0 0 0 12 0;M12 16v5;M8 21h8', 'M19 5l2-2;M19 9h3'],
    ['magic', 'Mađioničarstvo', 'M6 11h12l-2 9H8Z;M4 11h16;M12 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z', 'M18 3v4;M16 5h4'],
  ]],
  ['music', 'Glazba', [
    ['singing', 'Pjevanje', 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z;M6 11a6 6 0 0 0 12 0;M12 17v4;M8 21h8', 'M17 4l2-2;M19 9h2'],
    ['guitar', 'Gitara', 'M15 3l6 6-4 4-2-2-3 3a5 5 0 1 1-3-3l3-3-1-2Z', 'M16 5l3 3;M7 17h.01'],
    ['piano', 'Klavir', 'M3 5h18v14H3Z;M8 5v14;M12 5v14;M16 5v14', 'M6 5v7;M10 5v7;M14 5v7;M18 5v7'],
    ['drums', 'Bubnjevi', 'M4 8h16v9c-5 3-11 3-16 0Z;M4 8c5-3 11-3 16 0;M5 4l5 6;M19 4l-5 6', 'M8 19v3;M16 19v3'],
    ['violin', 'Violina', 'M12 3v18;M8 5c-5 0-5 5-1 7-4 2-4 7 1 7 2 0 3-2 4-2 1 0 2 2 4 2 5 0 5-5 1-7 4-2 4-7-1-7-2 0-3 2-4 2-1 0-2-2-4-2Z', 'M9 10h6;M9 14h6'],
    ['bass-guitar', 'Bas-gitara', 'M15 2l5 5-4 4-2-2-3 3a5 5 0 1 1-3-3l3-3-1-2Z', 'M16 4l2 2;M7 17h.01'],
    ['saxophone', 'Saksofon', 'M16 3l4 2-2 4-3-1-2 7c-1 4-5 6-8 3l-2-3 3-2 2 2c1 1 2 0 3-2l2-8Z', 'M14 10h.01;M12 13h.01'],
    ['dj', 'DJ-ing', 'M3 7h18v13H3Z;M8 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z;M16 11h3', 'M8 13v2;M16 16h3;M15 4h4'],
    ['composing', 'Skladanje', 'M7 4v13a3 3 0 1 1-2-3;M7 4l12-2v13a3 3 0 1 1-2-3;M7 8l12-2', 'M11 11h3;M11 14h3'],
    ['choir', 'Zborsko pjevanje', 'M6 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M18 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M3 18c0-4 6-6 9-3 3-3 9-1 9 3', 'M5 21h14'],
  ]],
  ['visual-arts', 'Vizualno stvaralaštvo', [
    ['drawing', 'Crtanje', 'M4 20l4-1 12-12-3-3L5 16Z;M15 6l3 3', 'M3 21h18'],
    ['painting', 'Slikanje', 'M12 3a9 9 0 0 0 0 18c2 0 2-2 1-3s0-3 2-3h3c4 0 4-12-6-12Z', 'M7 9h.01;M12 7h.01;M17 9h.01;M6 15h.01'],
    ['photography', 'Fotografija', 'M3 7h5l2-3h4l2 3h5v13H3Z;M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M18 10h.01'],
    ['filming', 'Snimanje videa', 'M3 6h13v12H3Z;M16 10l5-3v10l-5-3Z', 'M7 10h5'],
    ['video-editing', 'Montaža videa', 'M3 5h18v14H3Z;M10 8l6 4-6 4Z', 'M3 9h3;M3 15h3;M18 9h3;M18 15h3'],
    ['digital-illustration', 'Digitalna ilustracija', 'M4 4h16v16H4Z;M7 16l9-9 2 2-9 9H7Z', 'M8 8h.01;M17 16h.01'],
    ['graphic-design', 'Grafički dizajn', 'M3 4h8v8H3Z;M14 4h7v7h-7Z;M4 15h16v5H4Z', 'M8 16v4;M16 4v7'],
    ['calligraphy', 'Kaligrafija', 'M18 3 6 15l-2 5 5-2L21 6Z', 'M4 21h16;M14 7l3 3'],
    ['pottery', 'Keramika', 'M6 4h12l-2 5c0 3 3 5 3 8s-3 4-7 4-7-1-7-4 3-5 3-8Z', 'M8 12h8;M9 16h6'],
    ['sculpting', 'Kiparstvo', 'M8 3h8l2 6-2 8H8L6 9Z;M4 20h16', 'M10 8h4;M12 8v5'],
  ]],
  ['crafts', 'Rukotvorine', [
    ['knitting', 'Pletenje', 'M5 3l5 18;M19 3l-5 18;M4 11c4-3 12-3 16 0v7c-4 3-12 3-16 0Z', 'M7 14l3 3 3-3 3 3'],
    ['crochet', 'Heklanje', 'M16 3v13c0 4-8 5-9 0-1-3 2-6 5-5;M5 20c4-2 9-2 14 0', 'M13 6h6'],
    ['sewing', 'Šivanje', 'M3 17 18 3l3 3L6 20Z;M17 4l3 3', 'M4 5c2 1 3 3 2 5;M4 5h.01'],
    ['embroidery', 'Vezenje', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M6 12h12;M12 6v12', 'M8 8l8 8;M16 8l-8 8'],
    ['jewelry-making', 'Izrada nakita', 'M4 5h16l-8 14Z;M8 5l4 14 4-14', 'M9 8h6'],
    ['woodworking', 'Obrada drva', 'M4 4h16v16H4Z;M8 8c4-3 8-1 8 3s-5 6-8 3', 'M6 18h12'],
    ['origami', 'Origami', 'M3 18 10 4l4 7 7-4-5 13Z;M10 4l6 16', 'M3 18l11-7'],
    ['model-making', 'Modelarstvo', 'M12 3 3 8v9l9 5 9-5V8Z;M3 8l9 5 9-5;M12 13v9', 'M8 5l9 5'],
    ['furniture-restoration', 'Restauracija namještaja', 'M5 4h14v9H5Z;M7 13v8;M17 13v8;M5 17h14', 'M10 8h4'],
    ['3d-printing', '3D printanje', 'M4 4h16v14H4Z;M8 9l4-2 4 2v5l-4 2-4-2Z', 'M4 20h16;M12 10v6'],
  ]],
  ['games-tech', 'Igre i tehnologija', [
    ['video-games', 'Videoigre', 'M6 8h12l3 9-2 3-5-3h-4l-5 3-2-3Z', 'M7 12h4;M9 10v4;M16 12h.01;M18 14h.01'],
    ['board-games', 'Društvene igre', 'M3 3h18v18H3Z;M12 3v18;M3 12h18', 'M7 7h.01;M17 17h.01'],
    ['chess', 'Šah', 'M9 3h6l-1 5 3 4-2 5H9l-2-5 3-4Z;M7 20h10', 'M12 3v5;M9 14h6'],
    ['puzzles', 'Slagalice', 'M4 4h7c-1 4 3 4 2 0h7v7c-4-1-4 3 0 2v7h-7c1-4-3-4-2 0H4v-7c4 1 4-3 0-2Z', 'M8 8h.01'],
    ['quizzes', 'Kvizovi', 'M5 4h14v16H5Z;M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3', 'M12 18h.01'],
    ['card-games', 'Kartaške igre', 'M4 5h12v15H4Z;M8 3h12v15h-3', 'M10 9l3 3-3 3-3-3Z'],
    ['coding', 'Programiranje', 'M3 5h18v14H3Z;M9 9l-3 3 3 3;M15 9l3 3-3 3', 'M10 17h4'],
    ['robotics', 'Robotika', 'M5 8h14v12H5Z;M12 3v5;M9 12h.01;M15 12h.01', 'M9 16h6;M12 2h.01'],
    ['astronomy', 'Astronomija', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M3 13c5-4 13-4 18 0', 'M16 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1Z'],
    ['reading', 'Čitanje', 'M3 5c3-2 6-2 9 0 3-2 6-2 9 0v15c-3-2-6-2-9 0-3-2-6-2-9 0Z;M12 5v15', 'M6 9h3;M15 9h3'],
  ]],
  ['everyday', 'Dom i svakodnevni hobiji', [
    ['cooking', 'Kuhanje', 'M4 9h16v9c0 2-2 3-4 3H8c-2 0-4-1-4-3Z;M3 9h18', 'M7 3v3;M12 3v3;M17 3v3'],
    ['baking', 'Pečenje kolača', 'M5 10h14l-2 10H7Z;M4 10h16;M8 7c0-2 2-3 4-2 2-1 4 0 4 2', 'M12 2v3;M8 15h8'],
    ['gardening', 'Vrtlarstvo', 'M12 21V9;M12 13c-5 0-7-4-7-8 5 0 7 3 7 8Z;M12 10c0-4 2-6 7-6 0 4-2 6-7 6Z', 'M6 21h12'],
    ['plant-growing', 'Uzgoj biljaka', 'M7 15h10l-1 6H8Z;M12 15V6;M12 10c-4 0-6-2-6-5 4 0 6 2 6 5Z', 'M12 12c4 0 6-2 6-5-4 0-6 2-6 5Z'],
    ['flower-arranging', 'Aranžiranje cvijeća', 'M9 15h6l2 6H7Z;M12 15V6;M6 9l6 5 6-5', 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M5 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z;M19 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['writing', 'Pisanje', 'M5 3h14v18H5Z;M9 8h6;M9 12h6;M9 16h4', 'M16 16l4-4 2 2-4 4-3 1Z'],
    ['language-learning', 'Učenje jezika', 'M3 5h12v11H8l-4 3v-3H3Z;M12 9h9v10h-4l-3 3v-3h-2', 'M7 10h4;M17 14h2'],
    ['travel', 'Putovanja', 'M3 8h18v12H3Z;M8 8V5c0-2 2-3 4-3s4 1 4 3v3', 'M3 14h18;M11 14v6'],
    ['volunteering', 'Volontiranje', 'M12 20S3 14 3 8a4 4 0 0 1 9-2 4 4 0 0 1 9 2c0 6-9 12-9 12Z', 'M9 12h6;M12 9v6'],
    ['collecting', 'Skupljanje predmeta', 'M4 4h16v16H4Z;M8 8h8v8H8Z', 'M12 8v8;M8 12h8'],
  ]],
];

if (groups.length !== 14 || groups.some((group) => group[2].length !== 10)) {
  throw new Error('The Hobbies set must contain 14 groups of 10 icons.');
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');
const pathElements = (source) => source.split(';').map((d) => '<path d="' + d + '"/>').join('');
const rootAttrs = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"';
const outlineAttrs = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
const duoAttrs = 'fill="none" stroke="var(--icon-primary, currentColor)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
const metadata = [];
const ids = new Set();

for (const [groupId, groupLabel, icons] of groups) {
  for (const [id, label, main, accent] of icons) {
    if (ids.has(id)) throw new Error('Duplicate hobby icon: ' + id);
    ids.add(id);
    metadata.push({ id, label, group: groupId, groupLabel });
    const shapes = pathElements(main);
    const details = pathElements(accent);
    const files = {
      outline: '<svg ' + rootAttrs + ' ' + outlineAttrs + '>' + shapes + details + '</svg>\n',
      duotone: '<svg ' + rootAttrs + ' ' + duoAttrs + '>' + shapes + '<g stroke="var(--icon-secondary, currentColor)">' + details + '</g></svg>\n',
      solid: '<svg ' + rootAttrs + ' fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g fill="none">' + shapes + details + '</g></svg>\n',
    };
    for (const [style, svg] of Object.entries(files)) {
      const dir = path.join(root, style);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, id + '.svg'), svg);
    }
  }
}

await writeFile(path.join(root, 'hobbies.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log('Generated ' + ids.size + ' Hobbies icons in 3 styles.');
