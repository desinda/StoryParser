/**
 * SDC Parser - JavaScript Implementation
 * Browser-compatible parser for .sdc (Story Document) format
 * Based on the C implementation by Claude AI - 2025-10-09
 * Extended with linked-lists, characters, and parent-group support
 */

// ============================================================================
// TOKEN TYPES
// ============================================================================

const TokenType = {
  // Literals
  IDENTIFIER: 'IDENTIFIER',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  FLOAT: 'FLOAT',
  CODE_BLOCK: 'CODE_BLOCK',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  
  // Keywords
  STATES: 'STATES',
  GLOBAL_VARS: 'GLOBAL_VARS',
  LINKED_LISTS: 'LINKED_LISTS',
  CHARACTERS: 'CHARACTERS',
  DEFAULT: 'DEFAULT',
  TITLE: 'TITLE',
  TAGS: 'TAGS',
  CHAPTER: 'CHAPTER',
  GROUP: 'GROUP',
  NODE: 'NODE',
  NAME: 'NAME',
  CONTENT: 'CONTENT',
  TYPE: 'TYPE',
  COLOR: 'COLOR',
  KEYS: 'KEYS',
  SCOPE: 'SCOPE',
  STRUCTURE: 'STRUCTURE',
  BIOGRAPHY: 'BIOGRAPHY',
  DESCRIPTION: 'DESCRIPTION',
  LINKED_LIST_DATA: 'LINKED_LIST_DATA',
  TIMELINE: 'TIMELINE',
  ACTION: 'ACTION',
  DIALOGUE: 'DIALOGUE',
  CHOICE: 'CHOICE',
  CHOICES: 'CHOICES',
  TEXT: 'TEXT',
  GOTO: 'GOTO',
  EXIT: 'EXIT',
  ENTER: 'ENTER',
  NODES: 'NODES',
  START: 'START',
  END: 'END',
  POINTS: 'POINTS',
  DATA: 'DATA',
  INCREMENT: 'INCREMENT',
  VALUE: 'VALUE',
  TOGGLE: 'TOGGLE',
  CHARACTER: 'CHARACTER',
  EVENT: 'EVENT',
  REFERENCE: 'REFERENCE',
  VALUES: 'VALUES',
  AMOUNT: 'AMOUNT',
  SET: 'SET',
  APPEND: 'APPEND',
  REPLACE: 'REPLACE',
  PARENT_GROUP: 'PARENT_GROUP',
  
  // Symbols
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  COLON: 'COLON',
  COMMA: 'COMMA',
  AT: 'AT',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  
  // Special
  EOF: 'EOF',
  ERROR: 'ERROR'
};

// ============================================================================
// ENUMS
// ============================================================================

const GlobalVarType = {
  STRING: 'STRING',
  INT: 'INT',
  BOOL: 'BOOL',
  FLOAT: 'FLOAT'
};

const TagType = {
  SINGLE: 'SINGLE',
  KEYVALUE: 'KEYVALUE'
};

const ActionType = {
  CODE: 'CODE',
  GOTO: 'GOTO',
  EXIT: 'EXIT',
  ENTER: 'ENTER',
  CHOICE: 'CHOICE',
  EVENT: 'EVENT'
};

const EventType = {
  NEXT_NODE: 'NEXT_NODE',
  EXIT_CURRENT_NODE: 'EXIT_CURRENT_NODE',
  EXIT_CURRENT_GROUP: 'EXIT_CURRENT_GROUP',
  ADJUST_VARIABLE: 'ADJUST_VARIABLE',
  ADD_STATE: 'ADD_STATE',
  REMOVE_STATE: 'REMOVE_STATE',
  PROGRESS_STORY: 'PROGRESS_STORY',
  LINKED_LIST: 'LINKED_LIST',
  UNKNOWN: 'UNKNOWN'
};

const TimelineItemType = {
  ACTION: 'ACTION',
  DIALOGUE: 'DIALOGUE'
};

// ============================================================================
// LEXER
// ============================================================================

class Token {
  constructor(type, lexeme, line, column, value = null) {
    this.type = type;
    this.lexeme = lexeme;
    this.line = line;
    this.column = column;
    this.value = value;
  }
}

class Lexer {
  constructor(source) {
    this.source = source;
    this.current = 0;
    this.start = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    
    this.keywords = {
      'states': TokenType.STATES,
      'global-vars': TokenType.GLOBAL_VARS,
      'linked-lists': TokenType.LINKED_LISTS,
      'characters': TokenType.CHARACTERS,
      'default': TokenType.DEFAULT,
      'title': TokenType.TITLE,
      'tags': TokenType.TAGS,
      'chapter': TokenType.CHAPTER,
      'group': TokenType.GROUP,
      'node': TokenType.NODE,
      'name': TokenType.NAME,
      'content': TokenType.CONTENT,
      'type': TokenType.TYPE,
      'color': TokenType.COLOR,
      'keys': TokenType.KEYS,
      'scope': TokenType.SCOPE,
      'structure': TokenType.STRUCTURE,
      'biography': TokenType.BIOGRAPHY,
      'description': TokenType.DESCRIPTION,
      'linked-list-data': TokenType.LINKED_LIST_DATA,
      'timeline': TokenType.TIMELINE,
      'action': TokenType.ACTION,
      'dialogue': TokenType.DIALOGUE,
      'choice': TokenType.CHOICE,
      'choices': TokenType.CHOICES,
      'text': TokenType.TEXT,
      'goto': TokenType.GOTO,
      'exit': TokenType.EXIT,
      'enter': TokenType.ENTER,
      'nodes': TokenType.NODES,
      'start': TokenType.START,
      'end': TokenType.END,
      'points': TokenType.POINTS,
      'data': TokenType.DATA,
      'increment': TokenType.INCREMENT,
      'value': TokenType.VALUE,
      'toggle': TokenType.TOGGLE,
      'character': TokenType.CHARACTER,
      'event': TokenType.EVENT,
      'reference': TokenType.REFERENCE,
      'values': TokenType.VALUES,
      'amount': TokenType.AMOUNT,
      'set': TokenType.SET,
      'append': TokenType.APPEND,
      'replace': TokenType.REPLACE,
      'parent-group': TokenType.PARENT_GROUP,
      'true': TokenType.TRUE,
      'false': TokenType.FALSE
    };
  }
  
  isAtEnd() {
    return this.current >= this.source.length;
  }
  
  advance() {
    const c = this.source[this.current++];
    this.column++;
    return c;
  }
  
  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }
  
  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }
  
  isDigit(c) {
    return c >= '0' && c <= '9';
  }
  
  isAlpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }
  
  skipWhitespace() {
    while (true) {
      const c = this.peek();
      switch (c) {
        case ' ':
        case '\r':
        case '\t':
          this.advance();
          break;
        case '\n':
          this.line++;
          this.column = 0;
          this.advance();
          break;
        case '#':
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
          break;
        default:
          return;
      }
    }
  }
  
  addToken(type, value = null) {
    const lexeme = this.source.substring(this.start, this.current);
    const token = new Token(type, lexeme, this.line, 
                           this.column - (this.current - this.start), value);
    this.tokens.push(token);
  }
  
  scanString() {
    this.advance(); // Opening quote
    const stringStart = this.current;
    
    while (this.peek() !== '"' && !this.isAtEnd()) {
      const currentChar = this.peek();
      
      // Handle all line ending types
      if (currentChar === '\r' && this.peekNext() === '\n') {
        this.line++;
        this.column = 0;
        this.advance(); // \r
        this.advance(); // \n
        continue;
      }
      
      if (currentChar === '\r' || currentChar === '\n') {
        this.line++;
        this.column = 0;
      }
      
      this.advance();
    }
    
    if (this.isAtEnd()) {
      this.addToken(TokenType.ERROR);
      return;
    }
    
    const value = this.source.substring(stringStart, this.current);
    this.advance(); // Closing quote
    this.addToken(TokenType.STRING, value);
  }
  
  scanNumber() {
    let isFloat = false;
    
    // Handle negative sign
    if (this.peek() === '-') {
      this.advance();
    }
    
    while (this.isDigit(this.peek())) {
      this.advance();
    }
    
    // Check for decimal point
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      isFloat = true;
      this.advance(); // Consume '.'
      
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }
    
    const lexeme = this.source.substring(this.start, this.current);
    const value = isFloat ? parseFloat(lexeme) : parseInt(lexeme, 10);
    this.addToken(isFloat ? TokenType.FLOAT : TokenType.NUMBER, value);
  }
  
  scanIdentifier() {
    while (this.isAlpha(this.peek()) || this.isDigit(this.peek()) || this.peek() === '-') {
      this.advance();
    }
    
    const text = this.source.substring(this.start, this.current);
    const type = this.keywords[text] || TokenType.IDENTIFIER;
    
    if (type === TokenType.TRUE || type === TokenType.FALSE) {
      this.addToken(type, type === TokenType.TRUE);
    } else {
      this.addToken(type);
    }
  }
  
  scanCodeBlock() {
    this.advance(); // <
    this.advance(); // !
    
    const codeStart = this.current;
    
    while (!this.isAtEnd()) {
      // Check for closing !>
      if (this.peek() === '!' && this.peekNext() === '>') {
        break;
      }
      
      // Handle line endings properly for all platforms
      const currentChar = this.peek();
      
      // Windows: \r\n (check for \r followed by \n)
      if (currentChar === '\r' && this.peekNext() === '\n') {
        this.line++;
        this.column = 0;
        this.advance(); // Skip \r
        this.advance(); // Skip \n
        continue;
      }
      
      // Old Mac: \r alone
      if (currentChar === '\r') {
        this.line++;
        this.column = 0;
        this.advance();
        continue;
      }
      
      // Unix: \n alone
      if (currentChar === '\n') {
        this.line++;
        this.column = 0;
        this.advance();
        continue;
      }
      
      // Regular character
      this.advance();
    }
    
    if (this.isAtEnd()) {
      console.error('ERROR: Reached end without finding !>');
      this.addToken(TokenType.ERROR);
      return;
    }
    
    const code = this.source.substring(codeStart, this.current);
    
    this.advance(); // !
    this.advance(); // >
    
    this.addToken(TokenType.CODE_BLOCK, code);
  }
  
  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.skipWhitespace();
      
      if (this.isAtEnd()) break;
      
      this.start = this.current;
      const c = this.advance();
      
      switch (c) {
        case '{': this.addToken(TokenType.LBRACE); break;
        case '}': this.addToken(TokenType.RBRACE); break;
        case '[': this.addToken(TokenType.LBRACKET); break;
        case ']': this.addToken(TokenType.RBRACKET); break;
        case ':': this.addToken(TokenType.COLON); break;
        case ',': this.addToken(TokenType.COMMA); break;
        case '@': this.addToken(TokenType.AT); break;
        case '(': this.addToken(TokenType.LPAREN); break;
        case ')': this.addToken(TokenType.RPAREN); break;
        
        case '<':
          if (this.peek() === '!') {
            this.scanCodeBlock();
          } else {
            this.addToken(TokenType.ERROR);
          }
          break;
        
        case '"':
          this.current--;
          this.column--;
          this.scanString();
          break;
        
        case '-':
          if (this.isDigit(this.peek())) {
            this.current--;
            this.column--;
            this.scanNumber();
          } else {
            this.current--;
            this.column--;
            this.scanIdentifier();
          }
          break;
        
        default:
          if (this.isDigit(c)) {
            this.current--;
            this.column--;
            this.scanNumber();
          } else if (this.isAlpha(c)) {
            this.current--;
            this.column--;
            this.scanIdentifier();
          } else {
            this.addToken(TokenType.ERROR);
          }
          break;
      }
    }
    
    this.start = this.current;
    this.addToken(TokenType.EOF);
    
    return this.tokens;
  }
}

// ============================================================================
// PARSER
// ============================================================================

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
    this.errorMessage = null;
  }
  
  peek() {
    return this.tokens[this.current];
  }
  
  previous() {
    return this.tokens[this.current - 1];
  }
  
  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }
  
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  match(type) {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }
  
  setError(message) {
    if (this.errorMessage) return; // Keep first error
    
    const token = this.peek();
    this.errorMessage = `Error at line ${token.line}, column ${token.column}: ${message} (got '${token.lexeme}')`;
  }
  
  expect(type, message) {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    this.setError(message);
    return false;
  }
  
  parseStates() {
    if (!this.expect(TokenType.STATES, "Expected 'states'")) return null;
    if (!this.expect(TokenType.LBRACKET, "Expected '[' after 'states'")) return null;
    
    const states = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      if (this.check(TokenType.STRING)) {
        const token = this.advance();
        states.push({ name: token.value });
      } else {
        this.advance();
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACKET, "Expected ']' after states")) return null;
    return states;
  }
  
  parseGlobalVars() {
    if (!this.expect(TokenType.GLOBAL_VARS, "Expected 'global_vars'")) return null;
    if (!this.expect(TokenType.LBRACKET, "Expected '[' after 'global_vars'")) return null;
    
    const variables = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      if (this.check(TokenType.STRING)) {
        const nameToken = this.advance();
        const variable = {
          name: nameToken.value,
          type: GlobalVarType.STRING,
          default: null
        };
        
        if (!this.expect(TokenType.COLON, "Expected ':' after variable name")) return null;
        if (!this.expect(TokenType.LBRACE, "Expected '{' after ':'")) return null;
        
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          if (this.match(TokenType.TYPE)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'type'")) return null;
            const typeToken = this.advance();
            
            switch (typeToken.value) {
              case 'string': variable.type = GlobalVarType.STRING; break;
              case 'int': variable.type = GlobalVarType.INT; break;
              case 'bool': variable.type = GlobalVarType.BOOL; break;
              case 'float': variable.type = GlobalVarType.FLOAT; break;
            }
          } else if (this.match(TokenType.DEFAULT)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'default'")) return null;
            const defaultToken = this.peek();
            
            if (defaultToken.type === TokenType.STRING || 
                defaultToken.type === TokenType.NUMBER ||
                defaultToken.type === TokenType.FLOAT ||
                defaultToken.type === TokenType.TRUE ||
                defaultToken.type === TokenType.FALSE) {
              this.advance();
              variable.default = defaultToken.value;
            } else {
              this.setError("Expected default value");
              return null;
            }
          } else {
            this.advance();
          }
          
          if (this.check(TokenType.COMMA)) this.advance();
        }
        
        if (!this.expect(TokenType.RBRACE, "Expected '}' after variable definition")) return null;
        variables.push(variable);
      } else {
        this.advance();
      }
      
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACKET, "Expected ']' after global_vars")) return null;
    return variables;
  }
  
  parseLinkedLists() {
    if (!this.expect(TokenType.LINKED_LISTS, "Expected 'linked-lists'")) return null;
    if (!this.expect(TokenType.LBRACKET, "Expected '[' after 'linked-lists'")) return null;
    
    const linkedLists = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      if (this.check(TokenType.STRING)) {
        const nameToken = this.advance();
        const linkedList = {
          name: nameToken.value,
          scope: null,
          structure: {}
        };
        
        if (!this.expect(TokenType.COLON, "Expected ':' after linked-list name")) return null;
        if (!this.expect(TokenType.LBRACE, "Expected '{' after ':'")) return null;
        
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          if (this.match(TokenType.SCOPE)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'scope'")) return null;
            const scopeToken = this.advance();
            linkedList.scope = scopeToken.value;
          } else if (this.match(TokenType.STRUCTURE)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'structure'")) return null;
            if (!this.expect(TokenType.LBRACE, "Expected '{' after 'structure:'")) return null;
            
            while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
              if (this.check(TokenType.IDENTIFIER)) {
                const fieldName = this.advance().lexeme;
                if (!this.expect(TokenType.COLON, "Expected ':' after field name")) return null;
                if (!this.expect(TokenType.LBRACE, "Expected '{' after field name")) return null;
                
                const field = { type: null };
                
                while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
                  if (this.match(TokenType.TYPE)) {
                    if (!this.expect(TokenType.COLON, "Expected ':' after 'type'")) return null;
                    const typeToken = this.advance();
                    field.type = typeToken.value;
                  } else {
                    this.advance();
                  }
                  if (this.check(TokenType.COMMA)) this.advance();
                }
                
                if (!this.expect(TokenType.RBRACE, "Expected '}' after field definition")) return null;
                linkedList.structure[fieldName] = field;
              } else {
                this.advance();
              }
              if (this.check(TokenType.COMMA)) this.advance();
            }
            
            if (!this.expect(TokenType.RBRACE, "Expected '}' after structure")) return null;
          } else {
            this.advance();
          }
          if (this.check(TokenType.COMMA)) this.advance();
        }
        
        if (!this.expect(TokenType.RBRACE, "Expected '}' after linked-list definition")) return null;
        linkedLists.push(linkedList);
      } else {
        this.advance();
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACKET, "Expected ']' after linked-lists")) return null;
    return linkedLists;
  }
  
  parseCharacters() {
    if (!this.expect(TokenType.CHARACTERS, "Expected 'characters'")) return null;
    if (!this.expect(TokenType.LBRACKET, "Expected '[' after 'characters'")) return null;
    
    const characters = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      if (this.check(TokenType.STRING)) {
        const nameToken = this.advance();
        const character = {
          name: nameToken.value,
          biography: '',
          description: '',
          'linked-list-data': {}
        };
        
        if (!this.expect(TokenType.COLON, "Expected ':' after character name")) return null;
        if (!this.expect(TokenType.LBRACE, "Expected '{' after ':'")) return null;
        
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          if (this.match(TokenType.BIOGRAPHY)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'biography'")) return null;
            const bioToken = this.advance();
            character.biography = bioToken.value;
          } else if (this.match(TokenType.DESCRIPTION)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'description'")) return null;
            const descToken = this.advance();
            character.description = descToken.value;
          } else if (this.match(TokenType.LINKED_LIST_DATA)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'linked-list-data'")) return null;
            if (!this.expect(TokenType.LBRACE, "Expected '{' after 'linked-list-data:'")) return null;
            
            while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
              if (this.check(TokenType.IDENTIFIER)) {
                const listName = this.advance().lexeme;
                if (!this.expect(TokenType.COLON, "Expected ':' after list name")) return null;
                
                if (this.check(TokenType.LBRACE)) {
                  this.advance();
                  const data = this.parseLinkedListData();
                  if (!this.expect(TokenType.RBRACE, "Expected '}' after list data")) return null;
                  character['linked-list-data'][listName] = data;
                } else if (this.check(TokenType.LBRACKET)) {
                  this.advance();
                  const dataArray = [];
                  
                  while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
                    if (this.check(TokenType.STRING)) {
                      this.advance();
                      if (this.expect(TokenType.COLON, "Expected ':'")) {
                        if (this.check(TokenType.LBRACE)) {
                          this.advance();
                          const itemData = this.parseLinkedListData();
                          if (!this.expect(TokenType.RBRACE, "Expected '}'")) return null;
                          dataArray.push(itemData);
                        }
                      }
                    }
                    if (this.check(TokenType.COMMA)) this.advance();
                  }
                  
                  if (!this.expect(TokenType.RBRACKET, "Expected ']'")) return null;
                  character['linked-list-data'][listName] = dataArray;
                }
              } else {
                this.advance();
              }
              if (this.check(TokenType.COMMA)) this.advance();
            }
            
            if (!this.expect(TokenType.RBRACE, "Expected '}' after linked-list-data")) return null;
          } else {
            this.advance();
          }
          if (this.check(TokenType.COMMA)) this.advance();
        }
        
        if (!this.expect(TokenType.RBRACE, "Expected '}' after character")) return null;
        characters.push(character);
      } else {
        this.advance();
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACKET, "Expected ']' after characters")) return null;
    return characters;
  }
  
  parseLinkedListData() {
    const data = {};
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER)) {
        const key = this.advance().lexeme;
        if (this.expect(TokenType.COLON, "Expected ':'")) {
          if (this.check(TokenType.NUMBER) || this.check(TokenType.FLOAT)) {
            data[key] = this.advance().value;
          } else if (this.check(TokenType.STRING)) {
            data[key] = this.advance().value;
          } else if (this.check(TokenType.TRUE) || this.check(TokenType.FALSE)) {
            data[key] = this.advance().value;
          }
        }
      } else {
        this.advance();
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    return data;
  }
  
  parseTagDefinition() {
    const nameToken = this.advance();
    const tag = {
      name: nameToken.value,
      type: TagType.SINGLE,
      color: null,
      keys: []
    };
    
    if (!this.expect(TokenType.COLON, "Expected ':' after tag name")) return null;
    if (!this.expect(TokenType.LBRACE, "Expected '{' after ':'")) return null;
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.TYPE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'type'")) return null;
        const typeToken = this.advance();
        tag.type = typeToken.value === 'key-value' ? TagType.KEYVALUE : TagType.SINGLE;
      } else if (this.match(TokenType.COLOR)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'color'")) return null;
        const colorToken = this.advance();
        tag.color = colorToken.value;
      } else if (this.match(TokenType.KEYS)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'keys'")) return null;
        if (!this.expect(TokenType.LBRACKET, "Expected '[' after 'keys:'")) return null;
        
        while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
          if (this.check(TokenType.STRING)) {
            const keyToken = this.advance();
            tag.keys.push(keyToken.value);
          }
          if (this.check(TokenType.COMMA)) this.advance();
        }
        
        if (!this.expect(TokenType.RBRACKET, "Expected ']' after keys")) return null;
      } else {
        this.advance();
      }
      
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACE, "Expected '}' after tag definition")) return null;
    return tag;
  }
  
  parseTags() {
    if (!this.expect(TokenType.TAGS, "Expected 'tags'")) return null;
    if (!this.expect(TokenType.LBRACKET, "Expected '[' after 'tags'")) return null;
    
    const tags = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      if (this.check(TokenType.STRING)) {
        const tag = this.parseTagDefinition();
        if (!tag) return null;
        tags.push(tag);
      } else {
        this.advance();
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACKET, "Expected ']' after tags")) return null;
    return tags;
  }
  
  parseChapter() {
    if (!this.expect(TokenType.CHAPTER, "Expected 'chapter'")) return null;
    
    const idToken = this.advance();
    if (idToken.type !== TokenType.NUMBER) {
      this.setError("Expected chapter number");
      return null;
    }
    
    const chapter = {
      id: idToken.value,
      name: null
    };
    
    if (!this.expect(TokenType.LBRACE, "Expected '{' after chapter number")) return null;
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.NAME)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'name'")) return null;
        const nameToken = this.advance();
        chapter.name = nameToken.value;
      } else {
        this.advance();
      }
    }
    
    if (!this.expect(TokenType.RBRACE, "Expected '}' after chapter")) return null;
    return chapter;
  }
  
  parseGroupTags() {
    if (!this.expect(TokenType.LBRACKET, "Expected '[' for tags")) return null;
    
    const tags = [];
    
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      if (this.check(TokenType.STRING)) {
        const tagName = this.advance();
        const tag = {
          'tag-name': tagName.value,
          'selected-key': null,
          value: null
        };
        
        if (this.match(TokenType.COLON)) {
          if (this.check(TokenType.LBRACE)) {
            this.advance();
            
            while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
              if (this.check(TokenType.STRING)) {
                const key = this.advance();
                tag['selected-key'] = key.value;
                
                if (this.match(TokenType.COLON)) {
                  const value = this.advance();
                  tag.value = value.value;
                }
              } else {
                this.advance();
              }
              if (this.check(TokenType.COMMA)) this.advance();
            }
            
            if (!this.expect(TokenType.RBRACE, "Expected '}' after tag object")) return null;
          }
        }
        
        tags.push(tag);
      } else {
        this.advance();
      }
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACKET, "Expected ']' after tags")) return null;
    return tags;
  }
  
  parseNodeGraph() {
    if (!this.expect(TokenType.LBRACE, "Expected '{' for nodes")) return null;
    
    const graph = {
      'start-node': 0,
      'end-node': 0,
      points: {}
    };
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.START)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'start'")) return null;
        const num = this.advance();
        graph['start-node'] = num.value;
      } else if (this.match(TokenType.END)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'end'")) return null;
        const num = this.advance();
        graph['end-node'] = num.value;
      } else if (this.match(TokenType.POINTS)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'points'")) return null;
        if (!this.expect(TokenType.LBRACE, "Expected '{' after 'points:'")) return null;
        
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          if (this.check(TokenType.NUMBER)) {
            const key = this.advance();
            
            if (this.expect(TokenType.COLON, "Expected ':' after point key")) {
              if (this.expect(TokenType.LBRACKET, "Expected '[' for point values")) {
                const values = [];
                
                while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
                  if (this.check(TokenType.NUMBER)) {
                    const val = this.advance();
                    values.push(val.value);
                  }
                  if (this.check(TokenType.COMMA)) this.advance();
                }
                
                graph.points[key.value] = values;
                this.expect(TokenType.RBRACKET, "Expected ']' after point values");
              }
            }
          } else {
            this.advance();
          }
          if (this.check(TokenType.COMMA)) this.advance();
        }
        
        if (!this.expect(TokenType.RBRACE, "Expected '}' after points")) return null;
      } else {
        this.advance();
      }
      
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACE, "Expected '}' after nodes")) return null;
    return graph;
  }
  
  parseGroup() {
    if (!this.expect(TokenType.GROUP, "Expected 'group'")) return null;
    
    const idToken = this.advance();
    const group = {
      id: idToken.value,
      'chapter-id': 0,
      name: null,
      content: null,
      tags: [],
      nodes: null,
      'linked-lists': [],
      'parent-group': null
    };
    
    if (!this.expect(TokenType.LBRACE, "Expected '{' after group number")) return null;
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.CHAPTER)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'chapter'")) return null;
        const chapterToken = this.advance();
        group['chapter-id'] = chapterToken.value;
      } else if (this.match(TokenType.NAME)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'name'")) return null;
        const nameToken = this.advance();
        group.name = nameToken.value;
      } else if (this.match(TokenType.CONTENT)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'content'")) return null;
        const contentToken = this.advance();
        group.content = contentToken.value;
      } else if (this.match(TokenType.PARENT_GROUP)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'parentGroup'")) return null;
        const parentToken = this.advance();
        group['parent-group'] = parentToken.value;
      } else if (this.match(TokenType.TAGS)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'tags'")) return null;
        const tags = this.parseGroupTags();
        if (!tags) return null;
        group.tags = tags;
      } else if (this.match(TokenType.NODES)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'nodes'")) return null;
        const nodes = this.parseNodeGraph();
        if (!nodes) return null;
        group.nodes = nodes;
      } else if (this.match(TokenType.LINKED_LISTS)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'linked-lists'")) return null;
        if (!this.expect(TokenType.LBRACKET, "Expected '['")) return null;
        
        while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
          if (this.check(TokenType.STRING)) {
            const listName = this.advance();
            group['linked-lists'].push(listName.value);
          }
          if (this.check(TokenType.COMMA)) this.advance();
        }
        
        if (!this.expect(TokenType.RBRACKET, "Expected ']'")) return null;
      } else {
        this.advance();
      }
      
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    if (!this.expect(TokenType.RBRACE, "Expected '}' after group")) return null;
    return group;
  }
  
  parseTimeline() {
    if (!this.expect(TokenType.LBRACE, "Expected '{' for timeline")) return null;
    
    const timeline = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.DIALOGUE)) {
        const num = this.advance();
        if (!this.expect(TokenType.LBRACE, "Expected '{' after dialogue")) return null;
        
        const dialogue = {
          type: TimelineItemType.DIALOGUE,
          number: num.value,
          lines: []
        };
        
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          const character = this.peek();
          if (character.type === TokenType.IDENTIFIER) {
            this.advance();
            if (!this.expect(TokenType.COLON, "Expected ':' after character")) return null;
            
            const text = this.peek();
            if (text.type === TokenType.STRING) {
              this.advance();
              dialogue.lines.push({
                character: character.lexeme,
                text: text.value
              });
            } else {
              this.setError("Expected dialogue text");
              return null;
            }
          } else {
            this.advance();
          }
        }
        
        if (!this.expect(TokenType.RBRACE, "Expected '}' after dialogue")) return null;
        timeline.push(dialogue);
        
      } else if (this.match(TokenType.ACTION)) {
        const num = this.advance();
        if (!this.expect(TokenType.LBRACE, "Expected '{' after action")) return null;
        
        const action = {
          type: TimelineItemType.ACTION,
          number: num.value,
          'action-type': ActionType.CODE,
          data: {}
        };
        
        let braceDepth = 1;
        while (braceDepth > 0 && !this.isAtEnd()) {
          if (this.match(TokenType.TYPE)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'type'")) return null;
            const typeToken = this.peek();
            
            if (typeToken.type === TokenType.STRING) {
              const next = this.advance();

              if (typeToken.value === 'code') {
                action['action-type'] = ActionType.CODE;
                
                while (braceDepth > 0 && !this.isAtEnd()) {
                  let tokenConsumed = false;
                  
                  const currentToken = this.peek();
                  
                  if (this.check(TokenType.CODE_BLOCK)) {
                    const codeToken = this.advance();
                    action.data.code = codeToken.value;
                    tokenConsumed = true;
                  }
                  
                  if (this.check(TokenType.LBRACE)) {
                    braceDepth++;
                    if (!tokenConsumed) {
                      this.advance();
                      tokenConsumed = true;
                    }
                  } else if (this.check(TokenType.RBRACE)) {
                    braceDepth--;
                    if (braceDepth === 0) {
                      break;
                    }
                    if (!tokenConsumed) {
                      this.advance();
                      tokenConsumed = true;
                    }
                  }
                  
                  // Only advance if we haven't consumed a token yet
                  if (!tokenConsumed) {
                    this.advance();
                  }
                }
                
                break;
              } else if (typeToken.value === 'event') {
                action['action-type'] = ActionType.EVENT;
                action.data['event-type'] = EventType.UNKNOWN;
              } else if (typeToken.value === 'choice') {
                action['action-type'] = ActionType.CHOICE;
              }
            } else {
              this.advance();
            }
          } else if (this.match(TokenType.DATA)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'data'")) return null;
            if (!this.expect(TokenType.LBRACE, "Expected '{' after 'data:'")) return null;
            
            const eventData = this.parseEventData();
            if (!eventData) return null;
            action.data = eventData;
            
            if (!this.expect(TokenType.RBRACE, "Expected '}' after data")) return null;
          } else if (this.match(TokenType.GOTO)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'goto'")) return null;
            if (!this.expect(TokenType.AT, "Expected '@' for reference")) return null;
            
            this.advance(); // ref type
            if (!this.expect(TokenType.LPAREN, "Expected '(' after reference type")) return null;
            const refId = this.advance();
            if (!this.expect(TokenType.RPAREN, "Expected ')' after reference id")) return null;
            
            action['action-type'] = ActionType.GOTO;
            action.data['target-node'] = refId.value;
          } else if (this.match(TokenType.EXIT)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'exit'")) return null;
            const target = this.advance();
            action['action-type'] = ActionType.EXIT;
            action.data.target = target.value;
          } else if (this.match(TokenType.ENTER)) {
            if (!this.expect(TokenType.COLON, "Expected ':' after 'enter'")) return null;
            if (!this.expect(TokenType.AT, "Expected '@' for reference")) return null;
            
            this.advance(); // ref type
            if (!this.expect(TokenType.LPAREN, "Expected '(' after reference type")) return null;
            const refId = this.advance();
            if (!this.expect(TokenType.RPAREN, "Expected ')' after reference id")) return null;
            
            action['action-type'] = ActionType.ENTER;
            action.data['target-group'] = refId.value;
          } else {
            if (this.check(TokenType.LBRACE)) braceDepth++;
            if (this.check(TokenType.RBRACE)) {
              braceDepth--;
              if (braceDepth === 0) break;
            }
            this.advance();
          }
        }
        
        if (!this.expect(TokenType.RBRACE, "Expected '}' after action")) return null;
        timeline.push(action);
      } else {
        this.advance();
      }
    }
    
    if (!this.expect(TokenType.RBRACE, "Expected '}' after timeline")) return null;
    return timeline;
  }
  
  parseEventData() {
    const data = { 'event-type': EventType.UNKNOWN };
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.TYPE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'type'")) return null;
        const eventType = this.advance();
        
        if (eventType.type === TokenType.STRING) {
          switch (eventType.value) {
            case 'next-node':
              data['event-type'] = EventType.NEXT_NODE;
              break;
            case 'exit-current-node':
              data['event-type'] = EventType.EXIT_CURRENT_NODE;
              break;
            case 'exit-current-group':
              data['event-type'] = EventType.EXIT_CURRENT_GROUP;
              break;
            case 'adjust-variable':
              data['event-type'] = EventType.ADJUST_VARIABLE;
              data.name = null;
              data.value = null;
              data.increment = null;
              data['is-toggle'] = false;
              break;
            case 'add-state':
              data['event-type'] = EventType.ADD_STATE;
              data.name = null;
              data.character = null;
              break;
            case 'remove-state':
              data['event-type'] = EventType.REMOVE_STATE;
              data.name = null;
              data.character = null;
              break;
            case 'progress-story':
              data['event-type'] = EventType.PROGRESS_STORY;
              data['chapter-id'] = null;
              data['group-id'] = null;
              data['node-id'] = null;
              break;
            case 'linked-list':
              data['event-type'] = EventType.LINKED_LIST;
              data.reference = null;
              data.values = [];
              break;
          }
        }
      } else if (this.match(TokenType.NAME)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'name'")) return null;
        const name = this.advance();
        data.name = name.value;
      } else if (this.match(TokenType.INCREMENT)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'increment'")) return null;
        const inc = this.advance();
        data.increment = inc.value;
      } else if (this.match(TokenType.VALUE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'value'")) return null;
        const val = this.advance();
        data.value = val.value;
      } else if (this.match(TokenType.TOGGLE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'toggle'")) return null;
        const tog = this.advance();
        data['is-toggle'] = (tog.value === 'toggle');
      } else if (this.match(TokenType.CHARACTER)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'character'")) return null;
        const chr = this.advance();
        data.character = chr.value;
      } else if (this.match(TokenType.REFERENCE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'reference'")) return null;
        const ref = this.advance();
        data.reference = ref.value;
      } else if (this.match(TokenType.VALUES)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'values'")) return null;
        if (!this.expect(TokenType.LBRACKET, "Expected '['")) return null;
        
        data.values = [];
        
        while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
          if (this.check(TokenType.STRING)) {
            const fieldName = this.advance();
            if (!this.expect(TokenType.COLON, "Expected ':'")) return null;
            if (!this.expect(TokenType.LBRACE, "Expected '{'")) return null;
            
            const modification = { field: fieldName.value };
            
            while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
              if (this.match(TokenType.AMOUNT)) {
                if (!this.expect(TokenType.COLON, "Expected ':'")) return null;
                modification.amount = this.advance().value;
              } else if (this.match(TokenType.SET)) {
                if (!this.expect(TokenType.COLON, "Expected ':'")) return null;
                modification.set = this.advance().value;
              } else if (this.match(TokenType.APPEND)) {
                if (!this.expect(TokenType.COLON, "Expected ':'")) return null;
                modification.append = this.advance().value;
              } else if (this.match(TokenType.REPLACE)) {
                if (!this.expect(TokenType.COLON, "Expected ':'")) return null;
                modification.replace = this.advance().value;
              } else if (this.match(TokenType.TOGGLE)) {
                if (!this.expect(TokenType.COLON, "Expected ':'")) return null;
                modification.toggle = this.advance().value;
              } else {
                this.advance();
              }
              if (this.check(TokenType.COMMA)) this.advance();
            }
            
            if (!this.expect(TokenType.RBRACE, "Expected '}'")) return null;
            data.values.push(modification);
          } else {
            this.advance();
          }
          if (this.check(TokenType.COMMA)) this.advance();
        }
        
        if (!this.expect(TokenType.RBRACKET, "Expected ']'")) return null;
      } else if (this.match(TokenType.CHAPTER)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'chapter'")) return null;
        if (!this.expect(TokenType.AT, "Expected '@' for chapter reference")) return null;
        this.advance(); // reference type
        if (!this.expect(TokenType.LPAREN, "Expected '(' after reference type")) return null;
        const refId = this.advance();
        if (!this.expect(TokenType.RPAREN, "Expected ')' after reference id")) return null;
        data['chapter-id'] = refId.value;
      } else if (this.match(TokenType.GROUP)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'group'")) return null;
        if (!this.expect(TokenType.AT, "Expected '@' for group reference")) return null;
        this.advance(); // reference type
        if (!this.expect(TokenType.LPAREN, "Expected '(' after reference type")) return null;
        const refId = this.advance();
        if (!this.expect(TokenType.RPAREN, "Expected ')' after reference id")) return null;
        data['group-id'] = refId.value;
      } else if (this.match(TokenType.NODE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'node'")) return null;
        if (!this.expect(TokenType.AT, "Expected '@' for node reference")) return null;
        this.advance(); // reference type
        if (!this.expect(TokenType.LPAREN, "Expected '(' after reference type")) return null;
        const refId = this.advance();
        if (!this.expect(TokenType.RPAREN, "Expected ')' after reference id")) return null;
        data['node-id'] = refId.value;
      } else {
        this.advance();
      }
      
      if (this.check(TokenType.COMMA)) this.advance();
    }
    
    return data;
  }
  
  parseNode() {
    if (!this.expect(TokenType.NODE, "Expected 'node'")) return null;
    
    const idToken = this.advance();
    const node = {
      id: idToken.value,
      title: null,
      content: null,
      timeline: []
    };
    
    if (!this.expect(TokenType.LBRACE, "Expected '{' after node number")) return null;
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.match(TokenType.TITLE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'title'")) return null;
        const titleToken = this.advance();
        node.title = titleToken.value;
      } else if (this.match(TokenType.CONTENT)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'content'")) return null;
        const contentToken = this.advance();
        node.content = contentToken.value;
      } else if (this.match(TokenType.TIMELINE)) {
        if (!this.expect(TokenType.COLON, "Expected ':' after 'timeline'")) return null;
        const timeline = this.parseTimeline();
        if (!timeline) return null;
        node.timeline = timeline;
      } else {
        this.advance();
      }
    }
    
    if (!this.expect(TokenType.RBRACE, "Expected '}' after node")) return null;
    return node;
  }
  
  parse() {
    const storyData = {
      states: [],
      'global-vars': [],
      'linked-lists': [],
      characters: [],
      tags: [],
      chapters: [],
      groups: [],
      nodes: []
    };
    
    while (!this.isAtEnd()) {
      if (this.check(TokenType.STATES)) {
        const states = this.parseStates();
        if (!states) return null;
        storyData.states = states;
      } else if (this.check(TokenType.GLOBAL_VARS)) {
        const vars = this.parseGlobalVars();
        if (!vars) return null;
        storyData['global-vars'] = vars;
      } else if (this.check(TokenType.LINKED_LISTS)) {
        const linkedLists = this.parseLinkedLists();
        if (!linkedLists) return null;
        storyData['linked-lists'] = linkedLists;
      } else if (this.check(TokenType.CHARACTERS)) {
        const characters = this.parseCharacters();
        if (!characters) return null;
        storyData.characters = characters;
      } else if (this.check(TokenType.TAGS)) {
        const tags = this.parseTags();
        if (!tags) return null;
        storyData.tags = tags;
      } else if (this.check(TokenType.CHAPTER)) {
        const chapter = this.parseChapter();
        if (!chapter) return null;
        storyData.chapters.push(chapter);
      } else if (this.check(TokenType.GROUP)) {
        const group = this.parseGroup();
        if (!group) return null;
        storyData.groups.push(group);
      } else if (this.check(TokenType.NODE)) {
        const node = this.parseNode();
        if (!node) return null;
        storyData.nodes.push(node);
      } else {
        this.advance();
      }
    }
    
    return storyData;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

class SDCParser {
  constructor() {
    this.lastError = null;
  }
  
  /**
   * Parse a .sdc format string
   * @param {string} source - The source code to parse
   * @returns {object|null} StoryData object or null on error
   */
  parse(source) {
    this.lastError = null;
    
    try {
      const lexer = new Lexer(source);
      const tokens = lexer.scanTokens();
      
      // Check for lexer errors
      for (const token of tokens) {
        if (token.type === TokenType.ERROR) {
          const errorMsg = `Tokenization error at line ${token.line}, column ${token.column}`;
          console.error(errorMsg);
          this.lastError = errorMsg;
          return null;  // Return null on lexer error
        }
      }
      
      const parser = new Parser(tokens);
      const storyData = parser.parse();
      
      if (parser.errorMessage) {
        console.error('Parse error:', parser.errorMessage);
        this.lastError = parser.errorMessage;
        return null;  // Return null on parser error
      }
      
      return storyData;
    } catch (error) {
      console.error('Unexpected error during parsing:', error);
      this.lastError = error.message;
      return null;
    }
  }
  
  getLastError() {
    return this.lastError;
  }
  
  /**
   * Get the last error message
   * @returns {string|null}
   */
  getError() {
    return this.lastError;
  }
  
  /**
   * Get a chapter by ID
   * @param {object} storyData
   * @param {number} id
   * @returns {object|null}
   */
  getChapter(storyData, id) {
    return storyData.chapters.find(c => c.id === id) || null;
  }
  
  /**
   * Get a group by ID
   * @param {object} storyData
   * @param {number} id
   * @returns {object|null}
   */
  getGroup(storyData, id) {
    return storyData.groups.find(g => g.id === id) || null;
  }
  
  /**
   * Get a node by ID
   * @param {object} storyData
   * @param {number} id
   * @returns {object|null}
   */
  getNode(storyData, id) {
    return storyData.nodes.find(n => n.id === id) || null;
  }
  
  /**
   * Get a tag definition by name
   * @param {object} storyData
   * @param {string} name
   * @returns {object|null}
   */
  getTagDefinition(storyData, name) {
    return storyData.tags.find(t => t.name === name) || null;
  }
  
  /**
   * Get a global variable by name
   * @param {object} storyData
   * @param {string} name
   * @returns {object|null}
   */
  getGlobalVariable(storyData, name) {
    return storyData['global-vars'].find(v => v.name === name) || null;
  }
  
  /**
   * Get a linked list definition by name
   * @param {object} storyData
   * @param {string} name
   * @returns {object|null}
   */
  getLinkedList(storyData, name) {
    return storyData['linked-lists'].find(l => l.name === name) || null;
  }
  
  /**
   * Get a character by name
   * @param {object} storyData
   * @param {string} name
   * @returns {object|null}
   */
  getCharacter(storyData, name) {
    return storyData.characters.find(c => c.name === name) || null;
  }
}

// Export for use as module or global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SDCParser, GlobalVarType, TagType, ActionType, EventType, TimelineItemType };
} else {
  window.SDCParser = SDCParser;
  window.SDCParserEnums = { GlobalVarType, TagType, ActionType, EventType, TimelineItemType };
}