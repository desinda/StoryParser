#include "../src/sdc_parser.h"
#include <stdio.h>
#include <string.h>

void print_states(StoryData* data) {
    printf("=== STATES ===\n");
    int count;
    State* states = sdc_get_states(data, &count);
    
    for (int i = 0; i < count; i++) {
        printf("State: %s\n", states[i].name);
    }
    printf("\n");
}

void print_global_vars(StoryData* data) {
    printf("=== GLOBAL VARIABLES ===\n");
    int count;
    GlobalVariable* vars = sdc_get_global_variables(data, &count);
    
    for (int i = 0; i < count; i++) {
        printf("Variable: %s\n", vars[i].name);
        printf("  Type: ");
        
        switch (vars[i].type) {
            case SDC_VAR_TYPE_STRING:
                printf("string\n");
                printf("  Default: \"%s\"\n", vars[i].default_value.string_value);
                break;
            case SDC_VAR_TYPE_INT:
                printf("int\n");
                printf("  Default: %ld\n", vars[i].default_value.int_value);
                break;
            case SDC_VAR_TYPE_BOOL:
                printf("bool\n");
                printf("  Default: %s\n", vars[i].default_value.bool_value ? "true" : "false");
                break;
            case SDC_VAR_TYPE_FLOAT:
                printf("float\n");
                printf("  Default: %.2f\n", vars[i].default_value.float_value);
                break;
        }
        printf("\n");
    }
}

void print_tag_definitions(StoryData* data) {
    printf("=== TAG DEFINITIONS ===\n");
    int count;
    TagDefinition* tags = sdc_get_tag_definitions(data, &count);
    
    for (int i = 0; i < count; i++) {
        printf("Tag: %s\n", tags[i].name);
        printf("  Type: %s\n", tags[i].type == SDC_TAG_TYPE_SINGLE ? "single" : "key-value");
        printf("  Color: %s\n", tags[i].color ? tags[i].color : "none");
        
        if (tags[i].type == SDC_TAG_TYPE_KEYVALUE) {
            printf("  Keys: ");
            for (int j = 0; j < tags[i].key_count; j++) {
                printf("%s%s", tags[i].keys[j], j < tags[i].key_count - 1 ? ", " : "");
            }
            printf("\n");
        }
        printf("\n");
    }
}

void print_chapters(StoryData* data) {
    printf("=== CHAPTERS ===\n");
    for (int i = 0; i < data->chapter_count; i++) {
        printf("Chapter %d: %s\n", data->chapters[i].id, data->chapters[i].name);
    }
    printf("\n");
}

void print_groups(StoryData* data) {
    printf("=== GROUPS ===\n");
    for (int i = 0; i < data->group_count; i++) {
        Group* g = &data->groups[i];
        printf("Group %d: %s\n", g->id, g->name);
        printf("  Chapter: %d\n", g->chapter_id);
        printf("  Content: %s\n", g->content);
        printf("  Tags: ");
        for (int j = 0; j < g->tag_count; j++) {
            printf("%s", g->tags[j].tag_name);
            if (g->tags[j].selected_key) {
                printf("(%s: %s)", g->tags[j].selected_key, g->tags[j].value);
            }
            if (j < g->tag_count - 1) printf(", ");
        }
        printf("\n");
        printf("  Nodes: start=%d, end=%d, points=%d\n", 
               g->nodes.start_node, g->nodes.end_node, g->nodes.point_count);
        printf("\n");
    }
}

void print_nodes(StoryData* data) {
    printf("=== NODES ===\n");
    for (int i = 0; i < data->node_count; i++) {
        Node* n = &data->nodes[i];
        printf("Node %d: %s\n", n->id, n->title);
        printf("  Content: %s\n", n->content);
        printf("  Timeline items: %d\n", n->timeline_count);
        
        for (int j = 0; j < n->timeline_count; j++) {
            TimelineItem* item = &n->timeline[j];
            if (item->type == SDC_TIMELINE_ITEM_DIALOGUE) {
                printf("    Dialogue %d:\n", item->number);
                for (int k = 0; k < item->data.dialogue.line_count; k++) {
                    printf("      %s: \"%s\"\n", 
                           item->data.dialogue.characters[k],
                           item->data.dialogue.texts[k]);
                }
            } else if (item->type == SDC_TIMELINE_ITEM_ACTION) {
                printf("    Action %d: ", item->number);
                switch (item->data.action.type) {
                    case SDC_ACTION_TYPE_CODE:
                        printf("CODE (length=%zu)\n", 
                               item->data.action.data.code.code ? 
                               strlen(item->data.action.data.code.code) : 0);
                        break;
                    case SDC_ACTION_TYPE_GOTO:
                        printf("GOTO node %d\n", 
                               item->data.action.data.goto_action.target_node);
                        break;
                    case SDC_ACTION_TYPE_EXIT:
                        printf("EXIT %s\n", 
                               item->data.action.data.exit_action.target);
                        break;
                    case SDC_ACTION_TYPE_ENTER:
                        printf("ENTER group %d\n", 
                               item->data.action.data.enter_action.target_group);
                        break;
                    case SDC_ACTION_TYPE_CHOICE:
                        printf("CHOICE\n");
                        break;
                    case SDC_ACTION_TYPE_EVENT: {
                        EventActionData* e = &item->data.action.data.event;
                        printf("EVENT - ");
                        switch (e->event_type) {
                            case SDC_EVENT_TYPE_NEXT_NODE:
                                printf("next-node\n");
                                break;
                            case SDC_EVENT_TYPE_EXIT_CURRENT_NODE:
                                printf("exit-current-node\n");
                                break;
                            case SDC_EVENT_TYPE_EXIT_CURRENT_GROUP:
                                printf("exit-current-group\n");
                                break;
                            case SDC_EVENT_TYPE_ADJUST_VARIABLE:
                                printf("adjust-variable\n");
                                printf("        Variable: %s\n", e->data.adjust_variable.name);
                                if (e->data.adjust_variable.has_increment) {
                                    printf("        Increment: %.2f\n", e->data.adjust_variable.increment);
                                }
                                if (e->data.adjust_variable.has_value) {
                                    printf("        Value: %s\n", e->data.adjust_variable.value);
                                }
                                if (e->data.adjust_variable.is_toggle) {
                                    printf("        Toggle: true\n");
                                }
                                break;
                            case SDC_EVENT_TYPE_ADD_STATE:
                                printf("add-state\n");
                                printf("        State: %s\n", e->data.add_state.name);
                                printf("        Character: %s\n", e->data.add_state.character);
                                break;
                            case SDC_EVENT_TYPE_REMOVE_STATE:
                                printf("remove-state\n");
                                printf("        State: %s\n", e->data.remove_state.name);
                                printf("        Character: %s\n", e->data.remove_state.character);
                                break;
                            case SDC_EVENT_TYPE_PROGRESS_STORY:
                                printf("progress-story\n");
                                if (e->data.progress_story.chapter_id != -1) {
                                    printf("        Chapter: %d\n", e->data.progress_story.chapter_id);
                                }
                                if (e->data.progress_story.group_id != -1) {
                                    printf("        Group: %d\n", e->data.progress_story.group_id);
                                }
                                if (e->data.progress_story.node_id != -1) {
                                    printf("        Node: %d\n", e->data.progress_story.node_id);
                                }
                                break;
                            default:
                                printf("unknown\n");
                                break;
                        }
                        break;
                    }
                }
            }
        }
        printf("\n");
    }
}

int main(int argc, char** argv) {
    if (argc < 2) {
        printf("Usage: %s <story_file.sdc>\n", argv[0]);
        return 1;
    }
    
    printf("Parsing file: %s\n\n", argv[1]);
    
    StoryData* data = sdc_parse_file(argv[1]);
    
    if (!data) {
        printf("Error parsing file: %s\n", sdc_get_error());
        return 1;
    }
    
    printf("Parse successful!\n\n");
    
    print_states(data);
    print_global_vars(data);
    print_tag_definitions(data);
    print_chapters(data);
    print_groups(data);
    print_nodes(data);
    
    sdc_free(data);
    
    return 0;
}