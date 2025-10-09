import { SDCParser } from "../sdc_parser.js";

const parser = new SDCParser();
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
    }
}
`);

console.log(parser.getChapter(data, 1));
console.log(parser.getGroup(data, 1));
console.log(parser.getNode(data, 1));