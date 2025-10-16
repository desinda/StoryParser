/**
 * Story Engine Usage Example
 * Demonstrates how to use the StoryEngine with your game state
 */

import { SDCParser, ActionType, TimelineItemType } from '../sdc_parser.js';
import { StoryEngine } from '../sdc_engine.js';

// ============================================================================
// GAME STATE MANAGER (Your Implementation)
// ============================================================================

class GameState {
  constructor() {
    // Character states
    this.characterStates = {
      'Saniyah': {
        states: [], // ['Poisoned', 'SleepDeprived']
        linkedLists: {
          'Stats': {
            Strength: 8,
            Health: 125
          },
          'Profession': [
            { ID: 1, Value: 5 },
            { ID: 5, Value: 12 }
          ]
        }
      }
    };
    
    // Global variables
    this.variables = {
      'PlayerName': '',
      'Items': 0,
      'IsPlaying': false,
      'Money': 30.0
    };
    
    // Story progress
    this.currentChapter = null;
    this.currentGroup = null;
    this.currentNode = null;
  }
  
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  addState(characterName, stateName) {
    if (!this.characterStates[characterName]) {
      this.characterStates[characterName] = { states: [], linkedLists: {} };
    }
    
    if (!this.characterStates[characterName].states.includes(stateName)) {
      this.characterStates[characterName].states.push(stateName);
      console.log(`✓ Added state "${stateName}" to ${characterName}`);
    }
  }
  
  removeState(characterName, stateName) {
    if (!this.characterStates[characterName]) return;
    
    const index = this.characterStates[characterName].states.indexOf(stateName);
    if (index !== -1) {
      this.characterStates[characterName].states.splice(index, 1);
      console.log(`✓ Removed state "${stateName}" from ${characterName}`);
    }
  }
  
  // ========================================================================
  // VARIABLE MANAGEMENT
  // ========================================================================
  
  adjustVariable(variableName, operation, value) {
    if (!(variableName in this.variables)) {
      console.warn(`⚠ Variable "${variableName}" not found`);
      return;
    }
    
    const currentValue = this.variables[variableName];
    
    switch (operation) {
      case 'increment':
        this.variables[variableName] = currentValue + value;
        console.log(`✓ ${variableName}: ${currentValue} → ${this.variables[variableName]} (${value >= 0 ? '+' : ''}${value})`);
        break;
      
      case 'set':
        this.variables[variableName] = value;
        console.log(`✓ ${variableName}: ${currentValue} → ${value}`);
        break;
      
      case 'toggle':
        this.variables[variableName] = !currentValue;
        console.log(`✓ ${variableName}: ${currentValue} → ${this.variables[variableName]}`);
        break;
    }
  }
  
  // ========================================================================
  // LINKED LIST MANAGEMENT
  // ========================================================================
  
  modifyLinkedList(characterName, linkedListName, modifications) {
    if (!this.characterStates[characterName]) {
      console.warn(`⚠ Character "${characterName}" not found`);
      return;
    }
    
    const linkedListData = this.characterStates[characterName].linkedLists[linkedListName];
    if (!linkedListData) {
      console.warn(`⚠ Linked list "${linkedListName}" not found for ${characterName}`);
      return;
    }
    
    console.log(`\n✓ Modifying ${linkedListName} for ${characterName}:`);
    
    for (const mod of modifications) {
      const field = mod.field;
      const operation = mod.operation;
      const value = mod.value;
      
      // Handle array vs object
      if (Array.isArray(linkedListData)) {
        // Modify all items in array
        for (const item of linkedListData) {
          this.applyLinkedListModification(item, field, operation, value);
        }
      } else {
        // Modify single object
        this.applyLinkedListModification(linkedListData, field, operation, value);
      }
    }
  }
  
  applyLinkedListModification(item, field, operation, value) {
    if (!(field in item)) return;
    
    const currentValue = item[field];
    
    switch (operation) {
      case 'amount':
        item[field] = currentValue + value;
        console.log(`  - ${field}: ${currentValue} → ${item[field]} (${value >= 0 ? '+' : ''}${value})`);
        break;
      
      case 'set':
        item[field] = value;
        console.log(`  - ${field}: ${currentValue} → ${value}`);
        break;
      
      case 'append':
        item[field] = String(currentValue) + String(value);
        console.log(`  - ${field}: "${currentValue}" → "${item[field]}"`);
        break;
      
      case 'replace':
        item[field] = value;
        console.log(`  - ${field}: "${currentValue}" → "${value}"`);
        break;
      
      case 'toggle':
        item[field] = !currentValue;
        console.log(`  - ${field}: ${currentValue} → ${item[field]}`);
        break;
    }
  }
  
  // ========================================================================
  // DISPLAY
  // ========================================================================
  
  displayState() {
    console.log('\n═══════════════════════════════════════');
    console.log('CURRENT GAME STATE');
    console.log('═══════════════════════════════════════');
    
    console.log('\n📊 Variables:');
    for (const [name, value] of Object.entries(this.variables)) {
      console.log(`  ${name}: ${JSON.stringify(value)}`);
    }
    
    console.log('\n👥 Characters:');
    for (const [name, data] of Object.entries(this.characterStates)) {
      console.log(`  ${name}:`);
      if (data.states.length > 0) {
        console.log(`    States: ${data.states.join(', ')}`);
      }
      for (const [listName, listData] of Object.entries(data.linkedLists)) {
        console.log(`    ${listName}: ${JSON.stringify(listData)}`);
      }
    }
    
    console.log('═══════════════════════════════════════\n');
  }
}

// ============================================================================
// ENGINE HANDLER (Your Implementation)
// ============================================================================

class StoryRunner {
  constructor(storyData, gameState) {
    this.engine = new StoryEngine(storyData);
    this.gameState = gameState;
    this.running = false;
  }
  
  /**
   * Start story execution
   */
  start(chapterId, groupId, nodeId) {
    console.log(`\n🎬 Starting story at Chapter ${chapterId}, Group ${groupId}, Node ${nodeId}`);
    this.engine.start(chapterId, groupId, nodeId);
    this.running = true;
  }
  
  /**
   * Execute next item
   */
  async next() {
    if (!this.running) {
      console.log('Story not running');
      return null;
    }
    
    const result = this.engine.execute();
    await this.handleResult(result);
    
    return result;
  }
  
  /**
   * Handle execution result
   */
  async handleResult(result) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    switch (result.type) {
      case 'dialogue':
        this.handleDialogue(result);
        break;
      
      case 'action':
        this.handleAction(result);
        break;
      
      case 'event':
        this.handleEvent(result);
        break;
      
      case 'choice':
        this.handleChoice(result);
        break;
      
      case 'transition':
        this.handleTransition(result);
        break;
      
      case 'end':
        this.handleEnd(result);
        break;
    }
  }
  
  handleDialogue(result) {
    console.log(`💬 DIALOGUE ${result.dialogueNumber}`);
    for (const line of result.lines) {
      console.log(`   ${line.character}: "${line.text}"`);
    }
  }
  
  handleAction(result) {
    console.log(`⚡ ACTION ${result.actionNumber} (${result.actionType})`);
    
    if (result.actionType === 'code') {
      console.log(`   Code: ${result.data.code.substring(0, 50)}...`);
    }
  }
  
  handleEvent(result) {
    console.log(`🎯 EVENT ${result.actionNumber} (${result.eventType})`);
    
    switch (result.eventType) {
      case 'adjust-variable':
        this.gameState.adjustVariable(
          result.eventData.variableName,
          result.eventData.operation,
          result.eventData.value
        );
        break;
      
      case 'add-state':
        this.gameState.addState(
          result.eventData.characterName,
          result.eventData.stateName
        );
        break;
      
      case 'remove-state':
        this.gameState.removeState(
          result.eventData.characterName,
          result.eventData.stateName
        );
        break;
      
      case 'linked-list':
        console.log(`   List: ${result.eventData.linkedListName} (scope: ${result.eventData.scope})`);
        console.log(`   Affected: ${result.eventData.affectedCharacters.join(', ') || 'none'}`);
        
        // Apply to all affected characters
        for (const characterName of result.eventData.affectedCharacters) {
          this.gameState.modifyLinkedList(
            characterName,
            result.eventData.linkedListName,
            result.eventData.modifications
          );
        }
        break;
      
      case 'progress-story':
        console.log(`   Navigate to: Chapter ${result.eventData.chapterId}, Group ${result.eventData.groupId}, Node ${result.eventData.nodeId}`);
        break;
    }
  }
  
  handleChoice(result) {
    console.log(`🔀 CHOICE ${result.actionNumber}`);
    console.log('   Options:');
    for (const choice of result.choices) {
      console.log(`   ${choice.index}. ${choice.text}`);
    }
    console.log('\n   ⏳ Waiting for choice selection...');
  }
  
  handleTransition(result) {
    console.log(`↪️  TRANSITION (${result.transitionType})`);
    console.log(`   Target: ${JSON.stringify(result.target)}`);
  }
  
  handleEnd(result) {
    console.log(`🏁 END (${result.reason})`);
    this.running = false;
  }
  
  /**
   * Select a choice
   */
  selectChoice(index) {
    this.engine.selectChoice(index);
    console.log(`\n✓ Selected choice ${index}`);
  }
  
  /**
   * Add parameter for next execution
   */
  addParameter(context, key, value) {
    this.engine.addParameterNext(context, key, value);
    console.log(`\n📝 Parameter added: ${context}.${key} = ${value}`);
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

async function runExample() {
  // Parse story
  const parser = new SDCParser();
  const storySource = `
    # This is a comment
states [
    "Idle",
    "Poisoned",
    "SleepDeprived",
    "Ghastly"
]

global-vars [
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
  `;
  
  const storyData = parser.parse(storySource);
  
  if (!storyData) {
    console.error('Failed to parse story:', parser.getError());
    return;
  }
  
  console.log('\n[Debug] Parsed story data:');
  console.log('  Characters:', storyData.characters.length);
  if (storyData.characters.length > 0) {
    console.log('  Character 0:', storyData.characters[0].name);
    console.log('  Character 0 linked-list-data keys:', 
      Object.keys(storyData.characters[0]['linked-list-data'] || {}));
  }
  console.log('');
  
  // Create game state
  const gameState = new GameState();
  gameState.displayState();
  
  // Create story runner
  const runner = new StoryRunner(storyData, gameState);
  
  // Start story
  runner.start(1, 1, 1);
  
  // Execute story items
  await runner.next(); // Dialogue
  await runner.next(); // Money adjustment
  await runner.next(); // Add Poisoned state
  
  // Add parameter before linked list modification
  runner.addParameter('Profession', 'Value', 10); // Override amount from 4 to 10
  await runner.next(); // Linked list modification
  
  // Display final state
  gameState.displayState();
}

// ============================================================================
// ADVANCED EXAMPLE WITH CHOICES
// ============================================================================

// ============================================================================
// ADVANCED EXAMPLE WITH CHOICES
// ============================================================================

async function runChoiceExample() {
  console.log('\n\n═══════════════════════════════════════');
  console.log('CHOICE EXAMPLE');
  console.log('═══════════════════════════════════════\n');
  
  console.log('⚠️  Note: The inline choice parsing has a parser bug.');
  console.log('    To test choices, use the actual __StoryStructure.sdc file');
  console.log('    which has action 3 with properly parsed choice syntax.\n');
  
  // For now, let's demonstrate the choice API with a manually constructed story
  const parser = new SDCParser();
  
  // Create a minimal story structure manually
  const storyData = {
    'global-vars': [],
    'linked-lists': [],
    characters: [],
    states: [],
    tags: [],
    chapters: [
      { id: 1, name: 'Test' }
    ],
    groups: [
      {
        id: 1,
        'chapter-id': 1,
        name: 'Choice Test',
        content: 'Testing',
        tags: [],
        'linked-lists': [],
        'parent-group': -1,
        nodes: {
          'start-node': 1,
          'end-node': 2,
          points: { 1: [2] }
        }
      }
    ],
    nodes: [
      {
        id: 1,
        title: 'Choice Node',
        content: 'A choice appears',
        timeline: [
          {
            type: TimelineItemType.DIALOGUE,
            number: 1,
            lines: [
              { character: 'Narrator', text: 'What will you do?' }
            ]
          },
          {
            type: TimelineItemType.ACTION,
            number: 2,
            'action-type': ActionType.CHOICE,
            data: {
              choice: {
                options: [
                  {
                    text: 'Go left',
                    actions: [
                      {
                        type: ActionType.GOTO,
                        number: 3,
                        data: { 'target-node': 2 }
                      }
                    ]
                  },
                  {
                    text: 'Go right',
                    actions: [
                      {
                        type: ActionType.EXIT,
                        number: 4,
                        data: { target: 'group' }
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      },
      {
        id: 2,
        title: 'Left Path',
        content: 'You went left',
        timeline: [
          {
            type: TimelineItemType.DIALOGUE,
            number: 1,
            lines: [
              { character: 'Narrator', text: 'You chose wisely!' }
            ]
          }
        ]
      }
    ]
  };
  
  const gameState = new GameState();
  const runner = new StoryRunner(storyData, gameState);
  
  runner.start(1, 1, 1);
  
  await runner.next(); // Dialogue
  const choiceResult = await runner.next(); // Choice
  
  console.log('Choice result type:', choiceResult.type);
  console.log('Is awaiting choice:', runner.engine.isAwaitingChoice());
  
  if (choiceResult.type === 'choice') {
    console.log('\n🔀 Choices available:');
    for (const choice of choiceResult.choices) {
      console.log(`  ${choice.index}. ${choice.text}`);
    }
    
    // Simulate user selecting choice 0
    console.log('\n✓ Selecting choice 0 (Go left)\n');
    runner.selectChoice(0);
    
    await runner.next(); // Execute choice action (goto node 2)
    await runner.next(); // Dialogue in node 2
  } else {
    console.log('Expected choice but got:', choiceResult.type);
  }
}

// Run examples
console.log('═══════════════════════════════════════');
console.log('STORY ENGINE EXAMPLE');
console.log('═══════════════════════════════════════');

runExample().then(() => {
  runChoiceExample();
}).catch(console.error);