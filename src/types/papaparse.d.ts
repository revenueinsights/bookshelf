// types/papaparse.d.ts
declare module 'papaparse' {
    export interface ParseConfig {
      delimiter?: string;
      newline?: string;
      quoteChar?: string;
      escapeChar?: string;
      header?: boolean;
      dynamicTyping?: boolean;
      preview?: number;
      encoding?: string;
      worker?: boolean;
      comments?: boolean | string;
      download?: boolean;
      skipEmptyLines?: boolean | 'greedy';
      fastMode?: boolean;
      withCredentials?: boolean;
      delimitersToGuess?: string[];
      chunk?: (results: ParseResult<any>, parser: Parser) => void;
      complete?: (results: ParseResult<any>, file: File) => void;
      error?: (error: ParseError, file: File) => void;
      transform?: (value: string, field: string | number) => any;
      transformHeader?: (header: string, index: number) => string;
    }
  
    export interface ParseError {
      type: string;
      code: string;
      message: string;
      row: number;
      index: number;
    }
  
    export interface ParseMeta {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      fields: string[];
      truncated: boolean;
    }
  
    export interface ParseResult<T> {
      data: T[];
      errors: ParseError[];
      meta: ParseMeta;
    }
  
    export interface Parser {
      abort: () => void;
    }
  
    export function parse<T = any>(file: File, config?: ParseConfig): ParseResult<T>;
    export function parse<T = any>(input: string, config?: ParseConfig): ParseResult<T>;
    export function unparse<T = any>(data: T[], config?: ParseConfig): string;
  }