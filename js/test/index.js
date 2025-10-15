import { SDCParser } from "../sdc_parser.js";

const parser = new SDCParser();

// Parse the full __StoryStructure.sdc content
const data = parser.parse(`
# This is a comment
states [
    "Idle",
    "Poisoned",
    "SleepDeprived",
    "Ghastly"
]

global_vars [
    "PlayerName": {
        type: "string"
        default: ""
    },
    "Items": {
        type: "int"
        default: 0
    },
    "IsPlaying": {
        type: "bool"
        default: false
    },
    "Money": {
        type: "float"
        default: 30.0
    }
]

linked-lists [
	"Profession": {
		scope: "both"
		structure: {
			ID: {
				type: "integer"
			}
			Value: {
				type: "integer"
			}
		}
	}
	"Stats": {
		scope: "character"
		structure: {
			Strength: {
				type: "integer"
			}
			Health: {
				type: "integer"
			}
		}
	}
]

characters [
	"Saniyah": {
		biography: ""
		description: ""
		linked-list-data: {
			Stats: {
				Strength: 8
				Health: 125
			}
			Profession: [
				"1": {
					ID: 1
					Value: 5
				},
				"2": {
					ID: 5
					Value: 12
				}
			]
		}
	}
]

tags [
    "Location": {
        type: "key-value"
        color: "#0f6319ff"
        keys: [
            "Village",
            "Village Outskirts",
            "The Lake",
            "Endless Waterfall",
            "Cave of Mysteries",
        ]
    },
    "Quest": {
        type: "key-value"
        color: "#e6f334ff"
        keys: [
            "Main Story",
            "Side"
        ]
    },
    "Discovery": {
        type: "single"
        color: "#713"
    }
]

chapter 1 {
    name: "Introduction"
}

chapter 2 {
    name: "Into the Past"
}

group 1 {
    chapter: 1
    name: "My Story"
    content: "Introduce the main character, present a challenging disruption in the bedroom."
    tags: [
        "Location": {
            "Village": "Bedroom, 32, 55"
        },
        "Discovery"
    ]
    nodes: {
        start: 1,
        end: 3,
        points: {
            1: [ 2 ]
            2: [ 3 ]
        }
    }
	linked-lists: [
		"Profession"
	]
}

node 1 {
    title: "Start"
    content: "The start point"
    timeline: {
        action 1 {
            type: "code"
            <!
                function message(info : string) {
                    if (info == "OK") {
                        return;
                    }

                    process(info);
                }

                message("CODE: 32");
            !>
        }
        dialogue 1 {
            Caroline : "What's happening?"
        }
        dialogue 2 {
            Saniyah : "I don't know."
        }
        dialogue 3 {
            Caroline : "Ahh!!"
            Saniyah : "Ahh!!"
        }
        action 2 {
            type: "code"
            <!
                enterCharacter("Johiah", [ 12, 6 ], [ 9, 6 ]);
            !>
        }
        dialogue 4 {
            Johiah : "What's going on?"
        }
        dialogue 5 {
            Saniyah : "There's a sound coming from outside."
        }
        action 3 {
            type: "choice"
            choices: [
                {
                    text: "Calm down"
                    choice: {
                        action 3 {
                            type: "event"
                            goto: @node(2)
                        }
                    }
                },
                {
                    text: "Let's leave"
                    choice: {
                        action 4 {
                            type: "event"
                            exit: "group"
                        }
                        action 5 {
                            type: "event"
                            enter: @group(2)
                        }
                    }
                }
            ]
        }
        action 4 {
            type: "event"
            data: {
                type: "next-node"
            }
        }
        action 5 {
            type: "event"
            data: {
                type: "exit-current-node"
            }
        }
        action 6 {
            type: "event"
            data: {
                type: "exit-current-group"
            }
        }
        action 7 {
            type: "event"
            data: {
                type: "adjust-variable"
                name: "Money"
                increment: 5.6
            }
        }
        action 8 {
            type: "event"
            data: {
                type: "adjust-variable"
                name: "Money"
                increment: -5.6
            }
        }
        action 9 {
            type: "event"
            data: {
                type: "adjust-variable"
                name: "PlayerName"
                value: "New Player"
            }
        }
        action 10 {
            type: "event"
            data: {
                type: "adjust-variable"
                name: "IsPlaying"
                toggle: "toggle"
            }
        }
        action 11 {
            type: "event"
            data: {
                type: "add-state"
                name: "Poisoned",
                character: "Saniyah"
            }
        }
        action 12 {
            type: "event"
            data: {
                type: "remove-state"
                name: "Poisoned",
                character: "Saniyah"
            }
        }
        action 13 {
            type: "event"
            data: {
                type: "progress-story"
                chapter: @chapter(2)
                group: @group(2)
                node: @node(6)
            }
        }
		action 14 {
			type: "event"
			data: {
				type: "linked-list"
				reference: "Profession"
				values: [
					"Value": {
						amount: 4
					}
				]
			}
		}
		action 15 {
			type: "event"
			data: {
				type: "linked-list"
				reference: "Profession"
				values: [
					"Value": {
						amount: -1
					}
				]
			}
		}
    }
}
`);

if (!data) {
  console.error("Parse failed:", parser.getError());
} else {
  console.log("=== PARSE SUCCESSFUL ===\n");
  
  // Test basic lookups
  console.log("=== CHAPTER 1 ===");
  console.log(parser.getChapter(data, 1));
  console.log();
  
  console.log("=== GROUP 1 ===");
  console.log(parser.getGroup(data, 1));
  console.log();
  
  console.log("=== NODE 1 ===");
  console.log(parser.getNode(data, 1));
  console.log();
  
  // Test new features
  console.log("=== LINKED LISTS ===");
  console.log("All linked lists:", data['linked-lists']);
  console.log();
  
  console.log("Profession linked list:");
  const profession = parser.getLinkedList(data, "Profession");
  console.log(JSON.stringify(profession, null, 2));
  console.log();
  
  console.log("Stats linked list:");
  const stats = parser.getLinkedList(data, "Stats");
  console.log(JSON.stringify(stats, null, 2));
  console.log();
  
  console.log("=== CHARACTERS ===");
  console.log("All characters:", data.characters);
  console.log();
  
  console.log("Saniyah character:");
  const saniyah = parser.getCharacter(data, "Saniyah");
  console.log(JSON.stringify(saniyah, null, 2));
  console.log();
  
  console.log("=== STATES ===");
  console.log(data.states);
  console.log();
  
  console.log("=== GLOBAL VARS ===");
  console.log(data['global-vars']);
  console.log();
  
  console.log("=== TAGS ===");
  console.log(data.tags);
  console.log();
  
  // Test linked-list event actions
  console.log("=== LINKED-LIST EVENT ACTIONS ===");
  const node1 = parser.getNode(data, 1);
  const action14 = node1.timeline.find(item => item.number === 14);
  const action15 = node1.timeline.find(item => item.number === 15);
  
  console.log("Action 14 (increment Value by 4):");
  console.log(JSON.stringify(action14, null, 2));
  console.log();
  
  console.log("Action 15 (decrement Value by 1):");
  console.log(JSON.stringify(action15, null, 2));
  console.log();
  
  // Test other event actions
  console.log("=== OTHER EVENT ACTIONS ===");
  const action7 = node1.timeline.find(item => item.number === 7);
  console.log("Action 7 (adjust Money variable):");
  console.log(JSON.stringify(action7, null, 2));
  console.log();
  
  const action13 = node1.timeline.find(item => item.number === 13);
  console.log("Action 13 (progress story):");
  console.log(JSON.stringify(action13, null, 2));
  console.log();
  
  // Show group's linked-lists
  console.log("=== GROUP LINKED LISTS ===");
  const group1 = parser.getGroup(data, 1);
  console.log("Group 1 uses these linked lists:", group1['linked-lists']);
  console.log();
}