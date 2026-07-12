declare module "next/headers" {
  export function cookies(): Promise<any>;
}

declare module "next/server" {
  import { IncomingHttpHeaders } from "http";

  export class NextRequest {
    cookies: {
      getAll(): { name: string; value: string }[];
      get(name: string): { name: string; value: string } | undefined;
      set(name: string, value: string): void;
    };
    headers: any;
  }

  export class NextResponse {
    static next(options?: any): NextResponse;
    cookies: {
      set(name: string, value: string, options?: any): void;
    };
  }
}
