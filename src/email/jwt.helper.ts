import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class JwtHelper {
  private readonly JWT_SECRET = '163f721bd2e3a61264244ae0bfd3a37e';

  // URL Safe Base64 Encode
  urlsafeB64Encode(input: string): string {
    return Buffer.from(input)
      .toString('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  // URL Safe Base64 Decode
  urlsafeB64Decode(input: string): Buffer {
    const paddedInput = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice(0, (4 - input.length % 4) % 4);
    return Buffer.from(paddedInput, 'base64');
  }

  // JSON Encode
  jsonEncode(input: object): string {
    const json = JSON.stringify(input);
    if (json === 'null' && input !== null) {
      throw new Error('Null result with non-null input');
    }
    return json;
  }

  // JSON Decode
  jsonDecode(input: string): object {
    try {
      return JSON.parse(input);
    } catch (error) {
      throw new Error('Invalid JSON input');
    }
  }

  // Sign the message and return a URL-safe Base64 string
  sign(msg: string, key: string, method = 'HS256'): string {
    const methods: { [key: string]: string } = {
      HS256: 'sha256',
      HS384: 'sha384',
      HS512: 'sha512',
    };

    if (!methods[method]) {
      throw new Error('Algorithm not supported');
    }

    // Generate the HMAC and convert to URL-safe Base64
    const signatureBuffer = crypto.createHmac(methods[method], key).update(msg).digest();
    return this.urlsafeB64Encode(signatureBuffer.toString('base64')); // Convert Buffer to Base64 string
  }

  // Encode JWT
  encodeJwt(payload: object, algo = 'HS256'): string {
    const header = { typ: 'JWT', alg: algo };

    const segments = [];
    segments.push(this.urlsafeB64Encode(this.jsonEncode(header)));
    segments.push(this.urlsafeB64Encode(this.jsonEncode(payload)));

    const signingInput = segments.join('.');
    const signature = this.sign(signingInput, this.JWT_SECRET, algo);

    segments.push(signature);
    return segments.join('.');
  }

  // Decode JWT
  decodeJwt(jwt: string, verify = true): object {
    const segments = jwt.split('.');
    if (segments.length !== 3) {
      throw new Error('Wrong number of segments');
    }

    const [headb64, bodyb64, cryptob64] = segments;
    const header = this.jsonDecode(this.urlsafeB64Decode(headb64).toString());
    
    const payload = this.jsonDecode(this.urlsafeB64Decode(bodyb64).toString());
    const sig = this.urlsafeB64Decode(cryptob64);

    if (verify) {
      if (!header['alg']) {
        throw new Error('Empty algorithm');
      }
      // Compare Buffer directly
      const expectedSignature = this.sign(`${headb64}.${bodyb64}`, this.JWT_SECRET, header['alg']);
      if (sig.compare(Buffer.from(expectedSignature, 'base64'))) {
        throw new Error('Signature verification failed');
      }
    }

    return payload;
  }
}