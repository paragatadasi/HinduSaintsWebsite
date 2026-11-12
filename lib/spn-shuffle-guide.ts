// IDs identify checklist actions, not inventory records. Preserve them across copy edits.
export type ShuffleAction = {id:string;text:string;conditional:boolean};
export type ShuffleGroup = {id:string;title:string;notes:string[];actions:ShuffleAction[]};
export type ShuffleSection = {id:string;title:string;groups:ShuffleGroup[]};
export const shuffleGuideId = "spn-final-shuffle";
export const shuffleGuideIntro = "Work from top to bottom. Check each relic’s label and where it is now. Tick a line once everything on it is in place. Relics of living saints go on the bottom shelf.";
export const shuffleSections:ShuffleSection[] = [
  {
    "id": "stage-1",
    "title": "1. Make room for the missing saints from Andhra Pradesh",
    "groups": [
      {
        "id": "group-1",
        "title": "Vitrine 54 → 55",
        "notes": [
          "Check space for Rangacharya’s relic."
        ],
        "actions": [
          {
            "id": "move-together-vijayandeerar-and-prakasham-swamigal-kumbakonam",
            "text": "Move together: Vijayandeerar and Prakasham Swamigal (Kumbakonam)",
            "conditional": false
          },
          {
            "id": "move-together-ramalinga-swami-and-rangacharya-chidambaram",
            "text": "Move together: Ramalinga Swami and Rangacharya (Chidambaram)",
            "conditional": false
          },
          {
            "id": "poornananda-madurai",
            "text": "Poornananda (Madurai)",
            "conditional": false
          },
          {
            "id": "potty-amma-bottom-shelf",
            "text": "Potty Amma · bottom shelf",
            "conditional": false
          },
          {
            "id": "mayamma",
            "text": "Mayamma",
            "conditional": false
          }
        ]
      },
      {
        "id": "group-2",
        "title": "Vitrine 53 → 54",
        "notes": [
          "Check that Chandrashekar Swamigal’s large relic fits."
        ],
        "actions": [
          {
            "id": "chandrashekar-swamigal",
            "text": "Chandrashekar Swamigal",
            "conditional": false
          },
          {
            "id": "naagalinga-swami-sidhar",
            "text": "Naagalinga Swami Sidhar",
            "conditional": false
          },
          {
            "id": "move-together-mirra-alfassa-and-sri-chinmoy",
            "text": "Move together: Mirra Alfassa and Sri Chinmoy",
            "conditional": false
          },
          {
            "id": "shiva-mangaiyarkarsi",
            "text": "Shiva Mangaiyarkarsi",
            "conditional": false
          },
          {
            "id": "gopal-mylapore",
            "text": "Gopal (Mylapore)",
            "conditional": false
          },
          {
            "id": "egmore-nellore-swami",
            "text": "Egmore Nellore Swami",
            "conditional": false
          },
          {
            "id": "shivakalyani",
            "text": "Shivakalyani",
            "conditional": false
          },
          {
            "id": "vadapalani-paranjoti-baba",
            "text": "Vadapalani Paranjoti Baba",
            "conditional": false
          },
          {
            "id": "pithaji",
            "text": "Pithaji",
            "conditional": false
          },
          {
            "id": "otteri-swami",
            "text": "Otteri Swami",
            "conditional": false
          },
          {
            "id": "shaktivel-swami",
            "text": "Shaktivel Swami",
            "conditional": false
          }
        ]
      },
      {
        "id": "group-3",
        "title": "Vitrine 52 → 53",
        "notes": [],
        "actions": [
          {
            "id": "kasireddynayana-swami-ahobilam",
            "text": "Kasireddynayana Swami (Ahobilam)",
            "conditional": false
          },
          {
            "id": "swami-nagananda-bukkapatnam",
            "text": "Swami Nagananda (Bukkapatnam)",
            "conditional": false
          }
        ]
      }
    ]
  },
  {
    "id": "stage-2",
    "title": "2. Bring over the missing saints from Andhra Pradesh",
    "groups": [
      {
        "id": "group-4",
        "title": "Vitrine 61 → 53",
        "notes": [
          "Keep Veerabrahmendra and Siddhaiah together at the top. Keep Nampally Baba and Mallesh Baba together in Vitrine 53."
        ],
        "actions": [
          {
            "id": "pelluri-venkat-seetaramanjaneya-sharma-beside-veerabrahmendra-and-siddhaiah",
            "text": "Pelluri Venkat Seetaramanjaneya Sharma · beside Veerabrahmendra and Siddhaiah",
            "conditional": false
          },
          {
            "id": "move-together-ragam-rama-pitchaiah-garu-and-sriman-samardha-ragam-anjaneyulu-garu",
            "text": "Move together: Ragam Rama Pitchaiah Garu and Sriman Samardha Ragam Anjaneyulu Garu",
            "conditional": false
          },
          {
            "id": "move-together-siddheswarananda-bharati-swami-and-ramyananda-bharathi-swamini-siddheswarananda-on-the",
            "text": "Move together: Siddheswarananda Bharati Swami and Ramyananda Bharathi Swamini · Siddheswarananda on the bottom shelf",
            "conditional": false
          },
          {
            "id": "muddiappa-bottom-shelf",
            "text": "Muddiappa · bottom shelf",
            "conditional": false
          }
        ]
      },
      {
        "id": "group-5",
        "title": "Into Vitrine 52 from 61 and 51",
        "notes": [
          "Check space in both Vitrines 51 and 52 before starting these moves. Keep in mind that we will move Ramakrishnananda out from 52/B in the next step. Move the three saints listed together from Vitrine 51 before checking space for the two West Godavari saints."
        ],
        "actions": [
          {
            "id": "nirvikalpanandagiri-swami-from-61",
            "text": "Nirvikalpanandagiri Swami · from 61",
            "conditional": false
          },
          {
            "id": "kotta-ramakotaiah-from-61",
            "text": "Kotta Ramakotaiah · from 61",
            "conditional": false
          },
          {
            "id": "padhan-bhajaru-ramaswami-baba-from-61",
            "text": "Padhan Bhajaru Ramaswami Baba · from 61",
            "conditional": false
          },
          {
            "id": "move-together-kamesh-maharshi-prasad-raju-swamiji-unflagged-entry-and-premanandagiri-mataji-konaseem",
            "text": "Move together: Kamesh Maharshi, Prasad Raju Swamiji (unflagged entry) and Premanandagiri Mataji (Konaseema group) · from 51",
            "conditional": false
          },
          {
            "id": "rachakonda-venkata-narasimha-sharma-west-godavari-from-51",
            "text": "Rachakonda Venkata Narasimha Sharma (West Godavari) · from 51",
            "conditional": false
          },
          {
            "id": "jyanananda-west-godavari-from-51",
            "text": "Jyanananda (West Godavari) · from 51",
            "conditional": false
          }
        ]
      },
      {
        "id": "group-6",
        "title": "Vitrine 52, shelf B → 51",
        "notes": [
          "Keep Hathiram Baba and Sorakaya Swami at the top.",
          "If the last relic doesn’t fit in 51: First check whether the Kaikalur pair below can move to 52. Both must fit, with Pushpamata on the bottom shelf. If they can’t, leave them in 51 and pause the Ramakrishnananda move for the curator."
        ],
        "actions": [
          {
            "id": "avatar-digambar-bhagavan-ramakrishnananda-beside-the-nellore-and-golagamudi-relics",
            "text": "Avatar Digambar Bhagavan Ramakrishnananda · beside the Nellore and Golagamudi relics",
            "conditional": false
          },
          {
            "id": "only-if-needed-and-both-fit-in-52-move-pushpamata-and-shiva-satya-balayogi-together-from-51-to-52",
            "text": "Only if needed and both fit in 52: Move Pushpamata and Shiva Satya Balayogi together from 51 to 52",
            "conditional": true
          }
        ]
      },
      {
        "id": "group-7",
        "title": "Vitrine 61 → 62",
        "notes": [],
        "actions": [
          {
            "id": "balanjaneya-swami-check-the-receiving-shelf-first",
            "text": "Balanjaneya Swami · check the receiving shelf first",
            "conditional": false
          }
        ]
      }
    ]
  },
  {
    "id": "stage-3",
    "title": "3. Switch Vitrines 58 & 47",
    "groups": [
      {
        "id": "group-8",
        "title": "Before switching",
        "notes": [],
        "actions": [
          {
            "id": "47-61-move-sevagiri-and-sundargiri-together-after-the-andhra-pradesh-relics-have-left-61",
            "text": "47 → 61: Move Sevagiri and Sundargiri together after the Andhra Pradesh relics have left 61.",
            "conditional": false
          },
          {
            "id": "58-47-move-janardhana-giri-shanti-giri-and-paramananda-giri-together-check-that-all-three-fit-and-th",
            "text": "58 → 47: Move Janardhana Giri, Shanti Giri and Paramananda Giri together. Check that all three fit and that Paramananda Giri has bottom-shelf space. If they can’t fit together, ask the curator before moving them.",
            "conditional": false
          }
        ]
      },
      {
        "id": "group-9",
        "title": "Switch the vitrines",
        "notes": [
          "You can move the whole vitrines instead of individual relics."
        ],
        "actions": [
          {
            "id": "switch-the-positions-of-vitrines-58-and-47",
            "text": "Switch the positions of Vitrines 58 and 47.",
            "conditional": false
          }
        ]
      }
    ]
  }
];
export const shuffleActions = shuffleSections.flatMap(section=>section.groups.flatMap(group=>group.actions));
export function shuffleProgress(completed:ReadonlySet<string>){
 const required=shuffleActions.filter(action=>!action.conditional);
 return {total:required.length,completed:required.filter(action=>completed.has(action.id)).length};
}
