// Adapted from: https://github.com/fastify/fastify-cookie/blob/3a9c1576bcf3f6d343c1a5b1792ce70234cd7ac1/signer.js

import { sign, unsign } from "cookie-signature";
import type { NormalizedOptions } from "./types";

type UnsignResult =
    | {
          isValid: true;
          isRotated: boolean;
          value: string;
      }
    | {
          isValid: false;
          isRotated: boolean;
          value: null;
      };

export function createSecretSigner(options: NormalizedOptions) {
    return {
        sign(value: string): string {
            return sign(value, options.secret[0]);
        },

        unsign(value: string): UnsignResult {
            for (let i = 0; i < options.secret.length; ++i) {
                const secret = options.secret[i];
                const result = unsign(value, secret);
                if (result !== false) {
                    return { isValid: true, isRotated: i !== 0, value: result };
                }
            }
            return { isValid: false, isRotated: false, value: null };
        },
    };
}
