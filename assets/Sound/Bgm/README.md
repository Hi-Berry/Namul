# BGM 정리 (조선 나물전기)

게임에서 어떤 곡이 **언제** 재생되는지 정리한 문서입니다.
재생 로직은 `js/audio.js`의 `Sound.BGM`(폴더/그룹 매핑)과 `Sound.forScene()`(상황 판정)에 있습니다.
새 곡을 추가하려면 아래 폴더에 mp3를 넣고 `Sound.BGM`의 해당 그룹 배열에 경로만 추가하면 됩니다.

## 폴더 구조
```
assets/Sound/Bgm/
├─ Leaving_the_Bitter_Hearth.mp3   # 오프닝 컷씬 전용
├─ Town/                           # 마을(랜덤 재생)
│   ├─ The_Gate_at_Dawn.mp3
│   └─ The_Morning_Harvest.mp3
└─ Field/                          # 야외(필드/전투/깊은 숲)
    ├─ Between_Pine_and_Mist.mp3   # 필드 기본
    ├─ Copper_Gong_Strikes.mp3     # 전투
    └─ The_Final_Gong_Strike.mp3   # 깊은 숲(3구역)
```

## 재생 조건
| 상황 | 그룹 | 곡 |
|---|---|---|
| 오프닝 컷씬 | `cutscene` | Leaving_the_Bitter_Hearth |
| 내 집 / 마을 / 건물 실내 / 주막 장사 | `town` | Town 폴더에서 **랜덤** (진입 시 1곡 선택, 유지) |
| 필드 — 산 입구(mtn1)·중턱(mtn2)·정상(mtn4) | `field` | Between_Pine_and_Mist |

> 내 집과 마을은 같은 생활권으로 묶여 있어, 둘 사이를 오가도 BGM이 다시 무작위로 바뀌지 않고 유지됩니다.
| 전투 | `combat` | Copper_Gong_Strikes |
| 깊은 숲 — 3구역(mtn3) | `deepforest` | The_Final_Gong_Strike |
| 타이틀 화면 | `field` | Between_Pine_and_Mist |

## 메모
- BGM은 브라우저 자동재생 정책상 **첫 클릭/키 입력 이후** 시작됩니다.
- 모든 곡은 루프 재생되며, 음소거(설정 메뉴 / `M` 키)와 연동됩니다.
- 마을 곡은 마을에 들어설 때 무작위로 1곡이 정해지고, 마을에 머무는 동안 그대로 유지됩니다.
- 파일명·폴더명에는 **공백과 `#`를 쓰지 마세요** (URL 인코딩 문제로 로드 실패함).
