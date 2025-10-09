#include "../src/sdc_parser.h"
#include <stdio.h>

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
    
    printf("Parsing file: %s\n", argv[1]);
    fflush(stdout);
    
    StoryData* data = sdc_parse_file(argv[1]);
    
    printf("Returned from sdc_parse_file\n");
    fflush(stdout);
    
    if (!data) {
        const char* error = sdc_get_error();
        printf("Error parsing file: %s\n", error ? error : "Unknown error (NULL)");
        fflush(stdout);
        return 1;
    }
    
    printf("Parse successful!\n");
    printf("Tags: %d\n", data->tag_count);
    printf("Chapters: %d\n", data->chapter_count);
    printf("Groups: %d\n", data->group_count);
    printf("Nodes: %d\n", data->node_count);
    fflush(stdout);

    print_tag_definitions(data);
    print_chapters(data);
    print_groups(data);
    print_nodes(data);
    
    sdc_free(data);
    
    return 0;
}