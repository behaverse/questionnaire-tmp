# Shared Scales Catalogue (dedup aid)

Auto-generated from `harvest/_corpus` by `harvest/build_catalogue.py`. Check here (or the
fingerprint in `scales-index.json`) before minting a new Option. Exact normalized
match → reuse the ref; difference → new scale (flag borderline for owner review).

**113 Options indexed · 5 fingerprint collisions (existing duplicates).**
Fingerprint = sha256 of (input_data_type, measurement_type, selection, values, normalized en anchors).

## Existing duplicates (same scale, multiple ids — reuse one)

- `09bf559b179ec6ce` → `opt_apps_average_scale`, `opt_email_average_scale`, `opt_games_average_scale`, `opt_im_average_scale`, `opt_music_average_scale`, `opt_nonmusic_audios_average_scale`, `opt_number`, `opt_phone_average_scale`, `opt_print_average_scale`, `opt_tv_average_scale`, `opt_videos_average_scale`, `opt_web_average_scale`
- `825bdf3834bad50b` → `opt_hours_minutes_duration`, `opt_minutes_duration`
- `875b931128f534d4` → `opt_arces_frequency_5`, `opt_mfs_frequency_5`
- `e90e3d7a7d56d02a` → `opt_text`, `opt_text_multiline`
- `eb7b2567ceb4ae3b` → `opt_xcit_demographics_12_scale`, `opt_xcit_demographics_2_scale`, `opt_xcit_demographics_3_scale`

## All scales

| Option id | Pts | Type/meas. | Sel. | Dimension | Anchors (en) | fp |
|-----------|-----|-----------|------|-----------|--------------|----|
| `opt_agreement_4` | 4 | choice/ordinal | single | agreement | disagree · somewhat disagree · somewhat agree · agree | `311b0e98c6c45feb` |
| `opt_upps_sf_agreement_4` | 4 | choice/ordinal | single | agreement | Agree strongly · Agree some · Disagree some · Disagree strongly | `59065c31ebdd82ca` |
| `opt_bfi_2_agreement_5` | 5 | choice/ordinal | single | agreement | disagree strongly · disagree a little · neutral; no opinion · agree a little · agree strongly | `24784a1bc0daded6` |
| `opt_cfs_scale` | 6 | choice/ordinal | single | agreement | strongly agree · agree · slightly agree · slightly disagree · disagree · strongly disagree | `760f9e686918afdd` |
| `opt_agreement_7` | 7 | choice/ordinal | single | agreement | strongly disagree · disagree · somewhat disagree · neither agree nor disagree · somewhat agree · agree · strongly agree | `dd9a65744af1d59f` |
| `opt_agreement_7n` | 7 | choice/ordinal | single | agreement | strongly agree · agree · somewhat agree · neither agree nor disagree · somewhat disagree · disagree · strongly disagree | `3a2f8d758d8c05ac` |
| `opt_sci_amount_5` | 5 | choice/ordinal | single | amount | Not at all · A little · Somewhat · Much · Very much | `b590d0fb0f3e1f78` |
| `opt_corrected_to_normal_3` | 3 | choice/nominal | single | corrected_to_normal | normal · corrected to normal · impaired | `7cb002f9d2e4b560` |
| `opt_month_year` | 0 | text/interval |  | date |  | `f9ad14bd06baa560` |
| `opt_difficulty_7` | 7 | choice/ordinal | single | difficulty | very easy · easy · somewhat easy · neither easy nor difficult · somewhat difficult · difficult · very difficult | `dfc2b8a51e64ede7` |
| `opt_hours_minutes_duration` | 0 | text/ratio |  | duration |  | `825bdf3834bad50b` |
| `opt_minutes_duration` | 0 | text/ratio |  | duration |  | `825bdf3834bad50b` |
| `opt_years` | 0 | number/ratio |  | duration |  | `78c404819ee91b28` |
| `opt_sci_minutes_5` | 5 | choice/ratio | single | duration | 0–15 minutes · 16–30 minutes · 31–45 minutes · 46–60 minutes · more than 60 minutes | `7213c71c585d3b78` |
| `opt_sci_minutes_5_o` | 5 | choice/ratio | single | duration | 0–15 min · 16–30 min · 31–45 min · 46–60 min · ≥61 min | `2b585c1863a316e1` |
| `opt_sci_month_5` | 5 | choice/ratio | single | duration | <1 month (or I don't have a problem) · 1–2 months · 3–6 months · 7–12 months · >1 year | `93f17febfe911453` |
| `opt_avg_hour_scale` | 6 | choice/ordinal | single | duration | never · less than 1 hour · between 1 and 3 hours · between 3 and 5 hours · between 5 and 10 hours · more than 10 hours | `9491e2911364ee1a` |
| `opt_adc_ease_4` | 4 | choice/ordinal | single | ease | Easy · Challenging · Difficult · Very difficult | `7d210aaf14f710ad` |
| `opt_xcit_edu_field_12` | 12 | choice/nominal | single | education_field | Generic programmes and qualifications (e.g., personal skills and development). · Education (e.g., teacher training). · Arts and Humanities (e.g., fine arts; music; history; literature). · Social Sciences, Journalism and Information (e.g., economics; psychology; library, information and archival studies). · Business, Administration and Law (e.g., accounting and taxation; marketing and advertising). · Natural Sciences, Mathematics and Statistics (e.g., biology; environmental sciences; physics). · Information and Communication Technologies (e.g., software and applications development and analysis). · Engineering, Manufacturing and Construction (e.g., electronics and automation; mining and extraction; architecture and town planning). … | `4ca31bf87885e35b` |
| `opt_xcit_edu_level_9` | 9 | choice/nominal | single | education_level | Less than primary (nothing or nursery school, prekindergarten, kindergarten). · Primary education (elementary school, grade school). · Lower secondary education (middle school, junior high school). · Upper secondary education (high school, senior high school). · Post-secondary non-tertiary education (for example, practical job-specific program). · Some Post-secondary tertiary education (community college, college, university). · Bachelor degree or equivalent. · Master degree or equivalent. … | `88205c29ac82d95c` |
| `opt_xcit_financial_7` | 7 | choice/ordinal | single | finance | running a lot into dept · running a little into dept · having to draw on savings · just managing to make ends meet · saving a small amount · saving a medium amount · saving a large amount | `4d4f8a2ff7aaab71` |
| `opt_adc_frequency_4` | 4 | choice/ordinal | single | frequency | Rarely · Occasionally · Often · Most of the time | `9b2b73b24f00b6b0` |
| `opt_bis11_frequency_4` | 4 | choice/ordinal | single | frequency | Rarely/Never · Occasionally · Often · Almost always / Always | `5120b8c62e304acf` |
| `opt_ess_frequency_4` | 4 | choice/ordinal | single | frequency | would never doze. · slight chance of dozing. · moderate chance of dozing. · high chance of dozing. | `80b159829f3d3806` |
| `opt_frequency_4` | 4 | choice/ordinal | single | frequency | never · sometimes · often · very often | `20eab00540fa6071` |
| `opt_mmi_frequency_4` | 4 | choice/ordinal | single | frequency | Never · A little of the time · Some of the time · Most of the time | `8c7658f4ea2d697b` |
| `opt_psqi_frequency_4` | 4 | choice/ordinal | single | frequency | not during the past month · less than once a week · once or twice a week · three or more times a week | `26f54a87a88d1c83` |
| `opt_sqs_frequency_4` | 4 | choice/ordinal | single | frequency | Rarely · Sometimes · Often · Almost always | `6dc4a8095c8010d6` |
| `opt_arces_frequency_5` | 5 | choice/ordinal | single | frequency | never · rarely · sometimes · often · very often | `875b931128f534d4` |
| `opt_cfq_scale` | 5 | choice/ordinal | single | frequency | Never · Very rarely · Occasionally · Quite often · Very often | `7c05a9b4908ca62f` |
| `opt_i_panas_sf_frequency_5b` | 5 | choice/interval | single | frequency | Never (1) · 2 · 3 · 4 · Always (5) | `c6dde3866a3d722c` |
| `opt_mfs_frequency_5` | 5 | choice/ordinal | single | frequency | Never · Rarely · Sometimes · Often · Very often | `875b931128f534d4` |
| `opt_mmi_sf_frequency_5b` | 5 | choice/interval | single | frequency | never · . · . · . · very often | `8ff287a92ed9fafe` |
| `opt_mmi_sf_frequency_5b_2` | 5 | choice/interval | single | frequency | None of the time · . · . · . · All of the time | `d740dbd3f42c657b` |
| `opt_maas_frequency_7` | 6 | choice/ordinal | single | frequency | Almost always · Very frequently · Somewhat frequently · Somewhat infrequently · Very infrequently · Almost never | `2a65d7a19036f486` |
| `opt_mwq_frequency_6` | 6 | choice/ordinal | single | frequency | Almost never · Very infrequently · Somewhat infrequently · Somewhat frequently · Very frequently · Almost always | `43d970262abe3f8f` |
| `opt_who5_frequency_6` | 6 | choice/interval | single | frequency | All of the time (5) · Most of the time (4) · More than half of the time (3) · Less than half of the time (2) · Some of the time (1) · At no time (0) | `5f5f8e273ba3ac42` |
| `opt_frequency_7` | 7 | choice/ordinal | single | frequency | never · infrequently · once in a while · sometimes · often · most of the time · always | `0705e4e1dd4538c8` |
| `opt_mw_frequency_7b` | 7 | choice/interval | single | frequency | Rarely (1) · 2 · 3 · 4 · 5 · 6 · A lot (7) | `a27523318fe50873` |
| `opt_mw_frequency_7b_2` | 7 | choice/interval | single | frequency | Almost never (1) · 2 · 3 · 4 · 5 · 6 · Almost always (7) | `4156ebe0105b3a2b` |
| `opt_hand_preference_7` | 7 | choice/ordinal | single | hand_preference | strong preference for the left hand · clear preference for the left hand · slight preference for the left hand · no preference · slight preference for the right hand · clear preference for the right hand · strong preference for the right hand | `72bc6c2735ee0bbf` |
| `opt_height_us` | 0 | text/ratio |  | height |  | `767072a54956c968` |
| `opt_nasa_tlx_height_7b` | 7 | choice/interval | single | height | Very low · . · . · Medium · . · . · Very high | `802694974e471f53` |
| `opt_input_device` | 7 | choice/nominal | single | input_device | keyboard (QWERTY) · keyboard (QWERTZ) · keyboard (AZERTY) · keyboard (QZERTY) · keyboard (other) · touch screen · other | `9ad14776b629a10c` |
| `opt_xcit_job_type_10` | 10 | choice/nominal | single | job_type | Managers (for example: administrative or commercial manager, production manager, hotel and restaurant manager) · Professionals (for example: engineer, architect, medical doctor, veterinarian, teacher, software developer, librarian, creative and performing artist) · Technicians and Associate Professionals (for example: ship and aircraft controller and technician, sports and fitness workers) · Clerical Support Workers (for example: secretaries, numerical clerk) · Services and Sales Workers (for example: cooks, waiters and bartenders, protective services worker, shop salesperson) · Skilled Agricultural, Forestry and Fishery Workers (for example: animal producer, crop farmers, fishery workers, hunters and trappers) · Craft and Related Trades Workers (for example: painter, machinery mechanics and repairers, handicraft worker, electronics and telecommunications installers and repairers) · Plant and Machine Operators and Assemblers (for example: machine operators, assemblers, driver) … | `9d48168716292f04` |
| `opt_ehi_sf_1_scale` | 5 | choice/ordinal | single | left_right_frequency | Always left · Usually left · Both equally · Usually right · Always right | `9e1efae1e7b308ee` |
| `opt_icar16_abc_8` | 8 | choice/nominal | single | letter | A · B · C · D · E · F · none of these · I don't know | `e13223f435fe2dc6` |
| `opt_icar16_letters_1_8` | 8 | choice/nominal | single | letter | S · T · U · V · W · X · none of these · I don't know | `6b385ed3c3836393` |
| `opt_icar16_letters_2_8` | 8 | choice/nominal | single | letter | J · H · I · N · M · L · none of these · I don't know | `eeedef13fd00bcc9` |
| `opt_icar16_letters_4_8` | 8 | choice/nominal | single | letter | T · U · V · X · Y · Z · none of these · I don't know | `6b508bb77cd86609` |
| `opt_icar16_letters_8_8` | 8 | choice/nominal | single | letter | E · F · G · H · I · J · none of these · I don't know | `163520c9e46bfa7f` |
| `opt_icar16_numbers_10_8` | 8 | choice/nominal | single | letter | 2 · 3 · 4 · 5 · 6 · 7 · none of these · I don't know | `2259eecd3f049ca4` |
| `opt_icar16_relation_14_8` | 8 | choice/nominal | single | letter | Richard is taller than Matt. · Richard is shorter than Matt. · Richard is as tall as Matt. · It's impossible to tell if Richard is taller than Matt. · Richard is taller than Zach. · Zach is shorter than Matt. · none of these. · I don't know. | `0ad6c357e180c120` |
| `opt_raven18_scale` | 8 | choice/nominal | single | letter | A · B · C · D · E · F · G · H | `99ff569a803d4cb3` |
| `opt_apps_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_days_per_week` | 0 | number/ratio |  | number |  | `8133363940d8aa25` |
| `opt_email_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_games_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_hhmm_per_day_text` | 0 | text/ratio |  | number |  | `2fc2a3b50c6a934b` |
| `opt_im_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_minutes_per_day` | 0 | number/ratio |  | number |  | `81ea354f21bfd834` |
| `opt_music_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_nonmusic_audios_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_number` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_phone_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_print_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_tv_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_videos_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_web_average_scale` | 0 | number/ratio |  | number |  | `09bf559b179ec6ce` |
| `opt_sci_nights_5` | 5 | choice/ratio | single | number | 0–1 · 2 · 3 · 4 · 5–7 | `4d297ae2b0028721` |
| `opt_icar16_numbers_6_8` | 8 | choice/nominal | single | number | 35 · 39 · 44 · 47 · 53 · 57 · none of these · I don't know | `ba96783f5e705379` |
| `opt_number_10` | 10 | choice/ratio | single | number | 1 · 2 · 3 · 4 · 5 · 6 · 7 · 8 … | `d8749ead768e975e` |
| `opt_xcit_occupation_11` | 11 | choice/nominal | single | occupation | in paid work (or away temporarily), employee. · in paid work (or away temporarily), self-employed. · in paid work (or away temporarily), working for your family business. · in education, (not paid for by employer) even if on vacation. · unemployed and actively looking for a job. · unemployed, wanting a job but not actively looking for a job. · permanently sick or disabled. · retired. … | `230da10d4d1f4a7c` |
| `opt_psqi_problem_4` | 4 | choice/ordinal | single | problem_magnitude | no problem at all · only a very slightly problem · somewhat a problem · a very big problem | `16e0a5227f918cbf` |
| `opt_webexec_problems_4` | 4 | choice/ordinal | single | problems | No problems experienced · A few problems experienced · More than a few problems experienced · A great many problems experienced | `b2197c2469b9a081` |
| `opt_psqi_quality_4` | 4 | choice/ordinal | single | quality | very good · fairly good · fairly bad · very bad | `35f7812a50001035` |
| `opt_sci_quality_5` | 5 | choice/ordinal | single | quality | Very good · Good · Average · Poor · Very poor | `24a020ce84fe352e` |
| `opt_relative_to_average_7` | 7 | choice/ordinal | single | relative_to_average | well below average · somewhat below average · slightly below average · average · slightly above average · somewhat above average · well above average | `370ecaf62002cf65` |
| `opt_sex_4` | 4 | choice/nominal | single | sex | female · male · other · prefer not to say | `199e037e6860878d` |
| `opt_aiss_scale` | 4 | choice/ordinal | single | similarity | describes me very well · describes me somewhat · does not describe me very well · does not describe me at all | `1718a1058983d2ea` |
| `opt_grit12_similarity_5` | 5 | choice/ordinal | single | similarity | Very much like me · Mostly like me · Somewhat like me · Not much like me · Not like me at all | `151f4e5342c93e3b` |
| `opt_ncs_18_similarity_5` | 5 | choice/ordinal | single | similarity | Extremely uncharacteristic of me · Somewhat uncharacteristic of me · Uncertain · Somewhat characteristic of me · Extremely characteristic of me | `1f73182f51e3506d` |
| `opt_ncs_6_similarity_5b` | 5 | choice/interval | single | similarity | Extremely uncharacteristic of me · . · . · . · Extremely characteristic of me | `dfa7954fd35d4bd8` |
| `opt_rei_similarity_5` | 5 | choice/ordinal | single | similarity | Definitely not true of myself · Somewhat not true of myself · Neither true nor untrue of myself · Somewhat true of myself · Definitely true of myself | `e7bfdd9c93d49c24` |
| `opt_similarity_7` | 7 | choice/ordinal | single | similarity | a little like me · slightly like me · somewhat like me · neither like me nor unlike me · moderately like me · very like me · to a large extent like me | `16e0391addef2392` |
| `opt_sss_sleepiness_7` | 7 | choice/ordinal | single | sleepiness | feeling active, vital, alert, or wide awake. · functioning at high levels, but not at peak; able to concentrate. · awake, but relaxed; responsive but not fully alert. · somewhat foggy, let down. · foggy; losing interest in remaining awake; slowed down. · sleepy, woozy, fighting sleep; prefer to lie down. · no longer fighting sleep, sleep onset soon; having dream-like thoughts. | `d82ceabe8a9094e0` |
| `opt_kss_sleepiness_10` | 10 | choice/ordinal | single | sleepiness | extremely alert · very alert · alert · rather alert · neither alert nor sleepy · some signs of sleepiness · sleepy, but no effort to keep awake · sleepy, but some effort to keep awake … | `d93375ce6cff1376` |
| `opt_text` | 0 | text/interval |  | text |  | `e90e3d7a7d56d02a` |
| `opt_text_multiline` | 0 | text/interval |  | text |  | `e90e3d7a7d56d02a` |
| `opt_hours_minutes_time` | 0 | text/ratio |  | time |  | `2a9d20173f8c0ded` |
| `opt_bisbas_scale` | 4 | choice/ordinal | single | truthfullness | Very true for me · Somewhat true for me · Somewhat false for me · Very false for me | `9b1a37d886808b8d` |
| `opt_mw_truth_7b` | 7 | choice/interval | single | truthfullness | Not at all true (1) · 2 · 3 · 4 · 5 · 6 · Very true (7) | `0ad89d8dfde8d364` |
| `opt_icar16_weekdays_16_8` | 8 | choice/nominal | single | weekdays | Friday · Monday · Wednesday · Saturday · Tuesday · Sunday · none of these · I don't know | `97c0746ca0fc611c` |
| `opt_weight_us` | 0 | text/ratio |  | weight |  | `fdc464bd85fc8100` |
| `opt_xcit_demographics_12_scale` | 0 | text/interval |  |  |  | `eb7b2567ceb4ae3b` |
| `opt_xcit_demographics_2_scale` | 0 | text/interval |  |  |  | `eb7b2567ceb4ae3b` |
| `opt_xcit_demographics_3_scale` | 0 | text/interval |  |  |  | `eb7b2567ceb4ae3b` |
| `opt_sci_5_scale` | 5 | choice/ratio | single |  | <1 mo (or I don't have a problem) · 1–2 mo · 3–6 mo · 7–12 mo · >1 yr | `a4cd075992e4ca8b` |
| `opt_whoqol_amount_scale` | 5 | choice/interval | single |  | Not at all · A little · A moderate amount · Very much · An extreme amount | `cd2ef515a4446c9b` |
| `opt_whoqol_amount_v2_scale` | 5 | choice/interval | single |  | Not at all · A little · A moderate amount · Very much · Extremely | `e453da1753e318c3` |
| `opt_whoqol_amount_v3_scale` | 5 | choice/interval | single |  | Not at all · A little · Moderately · Mostly · Completely | `423e9066a59611ee` |
| `opt_whoqol_frequency_scale` | 5 | choice/interval | single |  | Never · Seldom · Quite often · Very often · Always | `3f83926f7ac44b49` |
| `opt_whoqol_quality_scale` | 5 | choice/interval | single |  | Very poor · Poor · Neither poor nor good · Good · Very good | `aee7f1f7db153943` |
| `opt_whoqol_quality_v2_scale` | 5 | choice/interval | single |  | Very poor · Poor · Neither · Good · Very good | `d6fd948b9ad6243a` |
| `opt_whoqol_satisfaction_scale` | 5 | choice/interval | single |  | Very dissatisfied · Dissatisfied · Neither satisfied nor dissatisfied · Satisfied · Very satisfied | `1ed310379ce7e138` |
| `opt_amount_7b` | 7 | choice/interval | single |  | not at all · . · . · . · . · . · very much | `59e4f676b468832e` |
| `opt_arousal_7b` | 7 | choice/interval | single |  | very calm · . · . · . · . · . · very aroused | `412aad451a6e5fe2` |
| `opt_clarity_7b` | 7 | choice/interval | single |  | very unclear · . · . · . · . · . · very clear | `72458a62b6052b3c` |
| `opt_loudness_7b` | 7 | choice/interval | single |  | very quiet · . · . · . · . · . · very loud | `63b497ff1f99ab2f` |
| `opt_quality_adv_7b` | 7 | choice/interval | single |  | very poorly · . · . · . · . · . · very well | `3791e5cf3c8dcc1e` |
| `opt_relative_quality_7b` | 7 | choice/interval | single |  | much worse · . · . · . · . · . · much better | `7beef1d43f4d52af` |
| `opt_valence_7b` | 7 | choice/interval | single |  | very negative · . · . · . · . · . · very positive | `9e1d1b3d18046456` |
| `opt_xcit_debrief_number_7` | 7 | choice/interval | single |  | never · 1 time · 2 times · 3 times · 4 times · 5 times · more than 5 times | `f0cc4167a123e6cc` |
