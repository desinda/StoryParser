/**
 * SDC Story Engine - JavaScript Implementation
 * Executes parsed .sdc story data with flexible parameter stack
 * Stateless execution - returns results without managing game state
 */

import { SDCParser, EventType, TimelineItemType, ActionType } from './sdc_parser.js';

// ============================================================================
// EXECUTION RESULT TYPES
// ============================================================================

class ExecutionResult {
  constructor(type) {
    this.type = type; // 'dialogue', 'action', 'event', 'choice', 'end', 'transition'
  }
}

class DialogueResult extends ExecutionResult {
  constructor(dialogueNumber, lines) {
    super('dialogue');
    this.dialogueNumber = dialogueNumber;
    this.lines = lines; // [{ character, text }, ...]
  }
}

class ActionResult extends ExecutionResult {
  constructor(actionNumber, actionType, data) {
    super('action');
    this.actionNumber = actionNumber;
    this.actionType = actionType; // 'code', 'goto', 'exit', 'enter', 'choice', 'event'
    this.data = data;
  }
}

class EventResult extends ExecutionResult {
  constructor(actionNumber, eventType, eventData) {
    super('event');
    this.actionNumber = actionNumber;
    this.eventType = eventType;
    this.eventData = eventData; // Specific to event type
  }
}

class ChoiceResult extends ExecutionResult {
  constructor(actionNumber, choices) {
    super('choice');
    this.actionNumber = actionNumber;
    this.choices = choices; // [{ text, index }, ...]
  }
}

class TransitionResult extends ExecutionResult {
  constructor(transitionType, target) {
    super('transition');
    this.transitionType = transitionType; // 'node', 'group', 'chapter'
    this.target = target; // { nodeId?, groupId?, chapterId? }
  }
}

class EndResult extends ExecutionResult {
  constructor(reason) {
    super('end');
    this.reason = reason; // 'timeline-complete', 'exit-node', 'exit-group', 'no-content'
  }
}

// ============================================================================
// STORY ENGINE
// ============================================================================

class StoryEngine {
  constructor(storyData) {
    this.story = storyData;
    
    // Current execution state
    this.currentChapterId = null;
    this.currentGroupId = null;
    this.currentNodeId = null;
    this.currentTimelineIndex = 0;
    
    // Parameter stack (cleared after each execution)
    this.parameterStack = {};
    
    // Choice handling
    this.awaitingChoice = false;
    this.currentChoiceAction = null;
    this.selectedChoiceIndex = null;
    
    // Parser reference
    this.parser = new SDCParser();
  }

  // ========================================================================
  // NAVIGATION & STATE
  // ========================================================================

  /**
   * Start story at a specific chapter/group/node
   */
  start(chapterId, groupId, nodeId) {
    this.currentChapterId = chapterId;
    this.currentGroupId = groupId;
    this.currentNodeId = nodeId;
    this.currentTimelineIndex = 0;
    this.awaitingChoice = false;
    this.currentChoiceAction = null;
    this.selectedChoiceIndex = null;
  }

  /**
   * Get current node
   */
  getCurrentNode() {
    if (!this.currentNodeId) return null;
    return this.parser.getNode(this.story, this.currentNodeId);
  }

  /**
   * Get current group
   */
  getCurrentGroup() {
    if (!this.currentGroupId) return null;
    return this.parser.getGroup(this.story, this.currentGroupId);
  }

  /**
   * Get current chapter
   */
  getCurrentChapter() {
    if (!this.currentChapterId) return null;
    return this.parser.getChapter(this.story, this.currentChapterId);
  }

  /**
   * Get current timeline item
   */
  getCurrentTimelineItem() {
    const node = this.getCurrentNode();
    if (!node || !node.timeline) return null;
    
    if (this.currentTimelineIndex >= node.timeline.length) {
      return null;
    }
    
    return node.timeline[this.currentTimelineIndex];
  }

  /**
   * Peek at next timeline item without advancing
   */
  peekNext() {
    return this.getCurrentTimelineItem();
  }

  /**
   * Advance to next timeline item
   */
  advance() {
    this.currentTimelineIndex++;
  }

  /**
   * Navigate to a specific node
   */
  gotoNode(nodeId) {
    this.currentNodeId = nodeId;
    this.currentTimelineIndex = 0;
    this.awaitingChoice = false;
    this.currentChoiceAction = null;
  }

  /**
   * Navigate to a specific group
   */
  enterGroup(groupId) {
    const group = this.parser.getGroup(this.story, groupId);
    if (!group) return false;
    
    this.currentGroupId = groupId;
    this.currentChapterId = group['chapter-id'];
    
    // Start at the group's start node
    if (group.nodes && group.nodes['start-node']) {
      this.gotoNode(group.nodes['start-node']);
    }
    
    return true;
  }

  /**
   * Exit current node
   */
  exitNode() {
    this.currentNodeId = null;
    this.currentTimelineIndex = 0;
  }

  /**
   * Exit current group
   */
  exitGroup() {
    this.currentGroupId = null;
    this.currentNodeId = null;
    this.currentTimelineIndex = 0;
  }

  // ========================================================================
  // PARAMETER STACK
  // ========================================================================

  /**
   * Add parameter for next execution
   * @param {string} context - Context name (e.g., 'Profession', 'Variable', 'State')
   * @param {string} key - Parameter key
   * @param {any} value - Parameter value
   */
  addParameterNext(context, key, value) {
    if (!this.parameterStack[context]) {
      this.parameterStack[context] = {};
    }
    this.parameterStack[context][key] = value;
  }

  /**
   * Get parameter from stack (returns undefined if not found)
   * @param {string} context - Context name
   * @param {string} key - Parameter key
   * @returns {any} Parameter value or undefined
   */
  getParameter(context, key) {
    return this.parameterStack[context]?.[key];
  }

  /**
   * Clear parameter stack
   */
  clearParameters() {
    this.parameterStack = {};
  }

  /**
   * Get all parameters (for debugging)
   */
  getParameterStack() {
    return { ...this.parameterStack };
  }

  // ========================================================================
  // CHOICE HANDLING
  // ========================================================================

  /**
   * Select a choice (call after receiving ChoiceResult)
   * @param {number} choiceIndex - Index of the choice to select
   */
  selectChoice(choiceIndex) {
    if (!this.awaitingChoice) {
      throw new Error('No choice is currently awaiting selection');
    }
    
    if (!this.currentChoiceAction) {
      throw new Error('No choice action available');
    }
    
    const choices = this.currentChoiceAction.data.choice.options;
    if (choiceIndex < 0 || choiceIndex >= choices.length) {
      throw new Error(`Invalid choice index: ${choiceIndex}`);
    }
    
    this.selectedChoiceIndex = choiceIndex;
    this.awaitingChoice = false;
  }

  /**
   * Check if engine is waiting for choice selection
   */
  isAwaitingChoice() {
    return this.awaitingChoice;
  }

  // ========================================================================
  // EXECUTION
  // ========================================================================

  /**
   * Execute next timeline item
   * @returns {ExecutionResult} Result of execution
   */
  execute() {
    // Handle choice continuation
    if (this.selectedChoiceIndex !== null) {
      const result = this.executeChoiceActions();
      this.selectedChoiceIndex = null;
      return result;
    }
    
    // Get current timeline item
    const item = this.getCurrentTimelineItem();
    
    if (!item) {
      return new EndResult('timeline-complete');
    }
    
    // Validate item structure
    if (!item.type) {
      console.error('Timeline item missing type:', item);
      return new EndResult('invalid-item');
    }
    
    // Execute based on item type
    let result;
    
    if (item.type === TimelineItemType.DIALOGUE) {
      result = this.executeDialogue(item);
    } else if (item.type === TimelineItemType.ACTION) {
      result = this.executeAction(item);
    } else {
      console.error('Unknown timeline item type:', item.type);
      result = new EndResult('no-content');
    }
    
    // Clear parameter stack after execution (unless awaiting choice)
    if (!this.awaitingChoice) {
      this.clearParameters();
      this.advance();
    }
    
    return result;
  }

  /**
   * Execute dialogue item
   */
  executeDialogue(item) {
    // Dialogue data is directly on the item, not nested under 'data'
    const lines = [];
    
    if (item.lines && item.lines.length > 0) {
      for (let i = 0; i < item.lines.length; i++) {
        lines.push({
          character: item.lines[i].character,
          text: item.lines[i].text
        });
      }
    }
    
    return new DialogueResult(item.number, lines);
  }

  /**
   * Execute action item
   */
  executeAction(item) {
    // Action type is directly on the item
    switch (item['action-type']) {
      case ActionType.CODE:
        return this.executeCodeAction(item.number, item);
      
      case ActionType.GOTO:
        return this.executeGotoAction(item.number, item);
      
      case ActionType.EXIT:
        return this.executeExitAction(item.number, item);
      
      case ActionType.ENTER:
        return this.executeEnterAction(item.number, item);
      
      case ActionType.CHOICE:
        return this.executeChoiceAction(item.number, item);
      
      case ActionType.EVENT:
        return this.executeEventAction(item.number, item);
      
      default:
        return new ActionResult(item.number, 'unknown', {});
    }
  }

  /**
   * Execute code action
   */
  executeCodeAction(actionNumber, action) {
    return new ActionResult(actionNumber, 'code', {
      code: action.data.code.code
    });
  }

  /**
   * Execute goto action
   */
  executeGotoAction(actionNumber, action) {
    const targetNode = action.data['target-node'];
    this.gotoNode(targetNode);
    
    return new TransitionResult('node', { nodeId: targetNode });
  }

  /**
   * Execute exit action
   */
  executeExitAction(actionNumber, action) {
    const target = action.data.target;
    
    if (target === 'node') {
      this.exitNode();
      return new EndResult('exit-node');
    } else if (target === 'group') {
      this.exitGroup();
      return new EndResult('exit-group');
    }
    
    return new ActionResult(actionNumber, 'exit', { target });
  }

  /**
   * Execute enter action
   */
  executeEnterAction(actionNumber, action) {
    const targetGroup = action.data['target-group'];
    this.enterGroup(targetGroup);
    
    return new TransitionResult('group', { groupId: targetGroup });
  }

  /**
   * Execute choice action
   */
  executeChoiceAction(actionNumber, action) {
    // Check if choice data exists
    if (!action.data || !action.data.choice || !action.data.choice.options) {
      return new ChoiceResult(actionNumber, []);
    }
    
    const choices = action.data.choice.options.map((option, index) => ({
      text: option.text,
      index: index
    }));
    
    // Store choice action for later execution
    this.currentChoiceAction = action;
    this.awaitingChoice = true;
    
    return new ChoiceResult(actionNumber, choices);
  }

  /**
   * Execute actions within selected choice
   */
  executeChoiceActions() {
    if (!this.currentChoiceAction || !this.currentChoiceAction.data || 
        !this.currentChoiceAction.data.choice || 
        !this.currentChoiceAction.data.choice.options) {
      return new ActionResult(0, 'choice-complete', {});
    }
    
    const choice = this.currentChoiceAction.data.choice.options[this.selectedChoiceIndex];
    
    // Execute all actions in the choice timeline
    if (choice.actions && choice.actions.length > 0) {
      const results = [];
      
      for (const action of choice.actions) {
        const result = this.executeChoiceSubAction(action);
        results.push(result);
        
        // If we hit a transition, stop executing and return it
        if (result.type === 'transition' || result.type === 'end') {
          return result;
        }
      }
      
      // Return the last result if no transition
      return results[results.length - 1] || new ActionResult(
        this.currentChoiceAction.number, 
        'choice-complete', 
        {}
      );
    }
    
    return new ActionResult(this.currentChoiceAction.number, 'choice-complete', {});
  }

  /**
   * Execute sub-action within a choice
   */
  executeChoiceSubAction(action) {
    switch (action.type) {
      case ActionType.GOTO:
        return this.executeGotoAction(action.number, action);
      case ActionType.EXIT:
        return this.executeExitAction(action.number, action);
      case ActionType.ENTER:
        return this.executeEnterAction(action.number, action);
      case ActionType.EVENT:
        return this.executeEventAction(action.number, action);
      default:
        return new ActionResult(action.number, 'unknown', {});
    }
  }

  /**
   * Execute event action
   */
  executeEventAction(actionNumber, action) {
    const event = action.data;
    const eventType = event['event-type'];
    
    switch (eventType) {
      case EventType.NEXT_NODE:
        return this.executeNextNodeEvent(actionNumber);
      
      case EventType.EXIT_CURRENT_NODE:
        return this.executeExitCurrentNodeEvent(actionNumber);
      
      case EventType.EXIT_CURRENT_GROUP:
        return this.executeExitCurrentGroupEvent(actionNumber);
      
      case EventType.ADJUST_VARIABLE:
        return this.executeAdjustVariableEvent(actionNumber, event);
      
      case EventType.ADD_STATE:
        return this.executeAddStateEvent(actionNumber, event);
      
      case EventType.REMOVE_STATE:
        return this.executeRemoveStateEvent(actionNumber, event);
      
      case EventType.PROGRESS_STORY:
        return this.executeProgressStoryEvent(actionNumber, event);
      
      case EventType.LINKED_LIST:
        return this.executeLinkedListEvent(actionNumber, event);
      
      default:
        return new EventResult(actionNumber, 'unknown', {});
    }
  }

  /**
   * Execute next-node event
   */
  executeNextNodeEvent(actionNumber) {
    // Get current group's node graph
    const group = this.getCurrentGroup();
    if (!group || !group.nodes || !group.nodes.points) {
      return new EndResult('no-next-node');
    }
    
    // Find next node from current node
    const currentNodeId = this.currentNodeId;
    const nextNodes = group.nodes.points[currentNodeId];
    
    if (!nextNodes || nextNodes.length === 0) {
      return new EndResult('no-next-node');
    }
    
    // Navigate to first next node
    const nextNodeId = nextNodes[0];
    this.gotoNode(nextNodeId);
    
    return new TransitionResult('node', { nodeId: nextNodeId });
  }

  /**
   * Execute exit-current-node event
   */
  executeExitCurrentNodeEvent(actionNumber) {
    this.exitNode();
    return new EndResult('exit-node');
  }

  /**
   * Execute exit-current-group event
   */
  executeExitCurrentGroupEvent(actionNumber) {
    this.exitGroup();
    return new EndResult('exit-group');
  }

  /**
   * Execute adjust-variable event
   */
  executeAdjustVariableEvent(actionNumber, event) {
    const variableName = event.name;
    const increment = event.increment;
    const value = event.value;
    const isToggle = event['is-toggle'];
    
    // Get variable definition to determine type
    const varDef = this.parser.getGlobalVariable(this.story, variableName);
    
    const eventData = {
      variableName,
      variableType: varDef ? varDef.type : 'unknown',
      operation: null,
      value: null
    };
    
    if (increment !== undefined && increment !== null) {
      eventData.operation = 'increment';
      eventData.value = increment;
    } else if (value !== undefined && value !== null) {
      eventData.operation = 'set';
      eventData.value = value;
    } else if (isToggle) {
      eventData.operation = 'toggle';
    }
    
    return new EventResult(actionNumber, 'adjust-variable', eventData);
  }

  /**
   * Execute add-state event
   */
  executeAddStateEvent(actionNumber, event) {
    return new EventResult(actionNumber, 'add-state', {
      stateName: event.name,
      characterName: event.character
    });
  }

  /**
   * Execute remove-state event
   */
  executeRemoveStateEvent(actionNumber, event) {
    return new EventResult(actionNumber, 'remove-state', {
      stateName: event.name,
      characterName: event.character
    });
  }

  /**
   * Execute progress-story event
   */
  executeProgressStoryEvent(actionNumber, event) {
    const chapterId = event['chapter-id'];
    const groupId = event['group-id'];
    const nodeId = event['node-id'];
    
    // Update current position
    if (chapterId !== null && chapterId !== -1) {
      this.currentChapterId = chapterId;
    }
    if (groupId !== null && groupId !== -1) {
      this.currentGroupId = groupId;
    }
    if (nodeId !== null && nodeId !== -1) {
      this.gotoNode(nodeId);
    }
    
    return new EventResult(actionNumber, 'progress-story', {
      chapterId: chapterId !== -1 ? chapterId : null,
      groupId: groupId !== -1 ? groupId : null,
      nodeId: nodeId !== -1 ? nodeId : null
    });
  }

  /**
   * Execute linked-list event
   */
  executeLinkedListEvent(actionNumber, event) {
    const linkedListName = event.reference;
    const modifications = event.values || [];
    
    // Get linked list definition
    const listDef = this.parser.getLinkedList(this.story, linkedListName);
    
    // Process modifications with parameters
    const processedMods = modifications.map(mod => {
      const fieldMod = {
        field: mod.field,
        operation: null,
        value: null
      };
      
      // Check for parameter override
      const paramValue = this.getParameter(linkedListName, mod.field);
      
      if (mod.amount !== undefined && mod.amount !== null) {
        fieldMod.operation = 'amount';
        fieldMod.value = paramValue !== undefined ? paramValue : mod.amount;
      } else if (mod.set !== undefined && mod.set !== null) {
        fieldMod.operation = 'set';
        fieldMod.value = paramValue !== undefined ? paramValue : mod.set;
      } else if (mod.append !== undefined && mod.append !== null) {
        fieldMod.operation = 'append';
        fieldMod.value = paramValue !== undefined ? paramValue : mod.append;
      } else if (mod.replace !== undefined && mod.replace !== null) {
        fieldMod.operation = 'replace';
        fieldMod.value = paramValue !== undefined ? paramValue : mod.replace;
      } else if (mod.toggle) {
        fieldMod.operation = 'toggle';
      }
      
      return fieldMod;
    });
    
    return new EventResult(actionNumber, 'linked-list', {
      linkedListName,
      scope: listDef ? listDef.scope : 'unknown',
      modifications: processedMods,
      affectedCharacters: this.getAffectedCharacters(linkedListName)
    });
  }

  /**
   * Get characters affected by linked list modification
   * (characters in current group that have this linked list)
   */
  getAffectedCharacters(linkedListName) {
    const group = this.getCurrentGroup();
    if (!group || !group['linked-lists']) {
      return [];
    }
    
    // Check if this linked list is in the current group
    if (!group['linked-lists'].includes(linkedListName)) {
      return [];
    }
    
    // Get all characters that have this linked list
    const affectedChars = [];
    for (const character of this.story.characters) {
      // Check if character has linked-list-data object with this list
      if (character['linked-list-data']) {
        const hasLinkedList = linkedListName in character['linked-list-data'];
        if (hasLinkedList) {
          affectedChars.push(character.name);
        }
      }
    }
    
    return affectedChars;
  }

  // ========================================================================
  // UTILITY
  // ========================================================================

  /**
   * Get current state summary (for debugging)
   */
  getState() {
    return {
      chapter: this.currentChapterId,
      group: this.currentGroupId,
      node: this.currentNodeId,
      timelineIndex: this.currentTimelineIndex,
      awaitingChoice: this.awaitingChoice,
      parameters: this.getParameterStack()
    };
  }

  /**
   * Reset engine to initial state
   */
  reset() {
    this.currentChapterId = null;
    this.currentGroupId = null;
    this.currentNodeId = null;
    this.currentTimelineIndex = 0;
    this.awaitingChoice = false;
    this.currentChoiceAction = null;
    this.selectedChoiceIndex = null;
    this.clearParameters();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  StoryEngine,
  ExecutionResult,
  DialogueResult,
  ActionResult,
  EventResult,
  ChoiceResult,
  TransitionResult,
  EndResult
};