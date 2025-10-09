#ifndef SDC_PARSER_H
#define SDC_PARSER_H

#include <stdbool.h>

// ============================================================================
// PUBLIC DATA STRUCTURES
// ============================================================================

// State definition
typedef struct {
    char* name;
} State;

// Global variable types
typedef enum {
    SDC_VAR_TYPE_STRING,
    SDC_VAR_TYPE_INT,
    SDC_VAR_TYPE_BOOL,
    SDC_VAR_TYPE_FLOAT
} GlobalVarType;

typedef struct {
    char* name;
    GlobalVarType type;
    
    union {
        char* string_value;
        long int_value;
        bool bool_value;
        double float_value;
    } default_value;
} GlobalVariable;

// Tag system
typedef enum {
    SDC_TAG_TYPE_SINGLE,
    SDC_TAG_TYPE_KEYVALUE
} TagType;

typedef struct {
    char* name;
    TagType type;
    char* color;
    char** keys;      // NULL for single-type tags
    int key_count;
} TagDefinition;

// Story entities
typedef struct {
    int id;
    char* name;
} Chapter;

typedef struct {
    char** characters;  // Array of character names
    char** texts;       // Array of dialogue texts
    int line_count;     // Number of lines in this dialogue
} Dialogue;

typedef struct {
    char* code;  // User interprets this themselves
} CodeAction;

typedef struct {
    int target_node;
} GotoAction;

typedef struct {
    char* target;  // "group", etc.
} ExitAction;

typedef struct {
    int target_group;
} EnterAction;

// New event action data types
typedef struct {
    char _reserved;
} NextNodeEventData;

typedef struct {
    char _reserved;
} ExitCurrentNodeEventData;

typedef struct {
    char _reserved;
} ExitCurrentGroupEventData;

typedef struct {
    char* name;           // Variable name
    double increment;     // For numeric adjustments
    char* value;          // For string/bool assignments
    bool is_toggle;       // For boolean toggle
    bool has_increment;   // Whether increment is set
    bool has_value;       // Whether value is set
} AdjustVariableEventData;

typedef struct {
    char* name;           // State name
    char* character;      // Character to add state to
} AddStateEventData;

typedef struct {
    char* name;           // State name
    char* character;      // Character to remove state from
} RemoveStateEventData;

typedef struct {
    int chapter_id;       // Target chapter (-1 if not set)
    int group_id;         // Target group (-1 if not set)
    int node_id;          // Target node (-1 if not set)
} ProgressStoryEventData;

typedef enum {
    SDC_EVENT_TYPE_NEXT_NODE,
    SDC_EVENT_TYPE_EXIT_CURRENT_NODE,
    SDC_EVENT_TYPE_EXIT_CURRENT_GROUP,
    SDC_EVENT_TYPE_ADJUST_VARIABLE,
    SDC_EVENT_TYPE_ADD_STATE,
    SDC_EVENT_TYPE_REMOVE_STATE,
    SDC_EVENT_TYPE_PROGRESS_STORY,
    SDC_EVENT_TYPE_UNKNOWN
} EventType;

typedef struct {
    EventType event_type;
    union {
        NextNodeEventData next_node;
        ExitCurrentNodeEventData exit_current_node;
        ExitCurrentGroupEventData exit_current_group;
        AdjustVariableEventData adjust_variable;
        AddStateEventData add_state;
        RemoveStateEventData remove_state;
        ProgressStoryEventData progress_story;
    } data;
} EventActionData;

typedef enum {
    SDC_ACTION_TYPE_CODE,
    SDC_ACTION_TYPE_GOTO,
    SDC_ACTION_TYPE_EXIT,
    SDC_ACTION_TYPE_ENTER,
    SDC_ACTION_TYPE_CHOICE,
    SDC_ACTION_TYPE_EVENT
} ActionType;

// Forward declaration for recursive structure
typedef struct ChoiceOption ChoiceOption;
typedef struct Action Action;

typedef struct {
    ChoiceOption* options;
    int option_count;
} ChoiceAction;

struct Action {
    int number;
    ActionType type;
    union {
        CodeAction code;
        GotoAction goto_action;
        ExitAction exit_action;
        EnterAction enter_action;
        ChoiceAction choice;
        EventActionData event;
    } data;
};

struct ChoiceOption {
    char* text;
    Action* actions;      // Timeline of actions within this choice
    int action_count;
};

typedef enum {
    SDC_TIMELINE_ITEM_ACTION,
    SDC_TIMELINE_ITEM_DIALOGUE
} TimelineItemType;

typedef struct {
    TimelineItemType type;
    int number;  // The number (dialogue 1, action 2, etc.)
    union {
        Action action;
        Dialogue dialogue;
    } data;
} TimelineItem;

typedef struct {
    int start_node;
    int end_node;
    
    // Points mapping: node_id -> array of connected node_ids
    int* point_keys;           // Array of source node IDs
    int** point_values;        // Array of arrays (connected node IDs)
    int* point_value_counts;   // Count for each array in point_values
    int point_count;           // Number of point mappings
} NodeGraph;

typedef struct {
    char* tag_name;
    char* selected_key;  // NULL for single-type tags
    char* value;         // Optional coordinate string, etc.
} GroupTag;

typedef struct {
    int id;
    int chapter_id;
    char* name;
    char* content;
    
    GroupTag* tags;
    int tag_count;
    
    NodeGraph nodes;
} Group;

typedef struct {
    int id;
    char* title;
    char* content;
    
    TimelineItem* timeline;
    int timeline_count;
} Node;

typedef struct {
    State* states;
    int state_count;
    
    GlobalVariable* global_vars;
    int global_var_count;
    
    TagDefinition* tags;
    int tag_count;
    
    Chapter* chapters;
    int chapter_count;
    
    Group* groups;
    int group_count;
    
    Node* nodes;
    int node_count;
} StoryData;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Parse a .sdc file from disk
 * Returns NULL on error
 */
StoryData* sdc_parse_file(const char* filename);

/**
 * Parse a .sdc format string from memory
 * Returns NULL on error
 */
StoryData* sdc_parse_string(const char* source);

/**
 * Free all memory associated with a StoryData structure
 */
void sdc_free(StoryData* data);

/**
 * Get the last error message from parsing
 * Returns NULL if no error
 */
const char* sdc_get_error(void);

/**
 * Lookup functions
 */
Chapter* sdc_get_chapter(StoryData* data, int id);
Group* sdc_get_group(StoryData* data, int id);
Node* sdc_get_node(StoryData* data, int id);
TagDefinition* sdc_get_tag_definition(StoryData* data, const char* name);
GlobalVariable* sdc_get_global_variable(StoryData* data, const char* name);

/**
 * Get all tag definitions
 * Returns pointer to internal array (do not free)
 * Sets count to number of tags
 */
TagDefinition* sdc_get_tag_definitions(StoryData* data, int* count);

/**
 * Get all global variables
 * Returns pointer to internal array (do not free)
 * Sets count to number of variables
 */
GlobalVariable* sdc_get_global_variables(StoryData* data, int* count);

/**
 * Get all states
 * Returns pointer to internal array (do not free)
 * Sets count to number of states
 */
State* sdc_get_states(StoryData* data, int* count);

/**
 * Validate that all references (@node, @group) resolve correctly
 * Returns true if valid, false otherwise
 */
bool sdc_validate_references(StoryData* data);

#endif // SDC_PARSER_H