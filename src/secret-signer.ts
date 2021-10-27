// Adapted from: https://github.com/fastify/fastify-cookie/blob/3a9c1576bcf3f6d343c1a5b1792ce70234cd7ac1/signer.js

import * as cookieSignature from "cookie-signature";
import type { NormalizedOptions } from "./types";

export function sign(value: string, options: NormalizedOptions): string {
    return cookieSignature.sign(value, options.secret[0]);
}

type UnsignResult =
    | {
          valid: true;
          rotated: boolean;
          value: string;
      }
    | {
          valid: false;
          rotated: boolean;
          value: null;
      };

export function unsign(value: string, options: NormalizedOptions): UnsignResult {
    for (let i = 0; i < options.secret.length; ++i) {
        const secret = options.secret[i];
        const result = cookieSignature.unsign(value, secret);
        if (result !== false) {
            return { valid: true, rotated: i !== 0, value: result };
        }
    }
    return { valid: false, rotated: false, value: null };
}
