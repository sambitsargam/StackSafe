import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";

const WEBAUTHN_RP_ID = "stacksafe.local";
const WEBAUTHN_RP_NAME = "StackSafe";

export async function generateRegistrationChallenge() {
  const options = await generateRegistrationOptions({
    rpID: WEBAUTHN_RP_ID,
    rpName: WEBAUTHN_RP_NAME,
    userID: Buffer.from(new Uint8Array(16)).toString('hex'),
    userName: "user",
    userDisplayName: "StackSafe User",
    attestationType: "none",
  });
  return options;
}

export async function startWebAuthnRegistration(options: any) {
  const attResp = await startRegistration(options);
  return attResp;
}

export async function generateAuthenticationChallenge() {
  const options = await generateAuthenticationOptions({
    rpID: WEBAUTHN_RP_ID,
  });
  return options;
}

export async function startWebAuthnAuthentication(options: any) {
  const authResp = await startAuthentication(options);
  return authResp;
}

export async function generateRandomChallenge(length: number = 32): Promise<Buffer> {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(length)));
}

export function challengeToHex(challenge: Uint8Array | Buffer): string {
  return "0x" + Array.from(challenge).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function derivePublicKeyFromCredential(credential: any): Promise<Uint8Array> {
  const publicKeyObj = credential.response.getPublicKey();
  if (!publicKeyObj) throw new Error("Failed to extract public key");
  return new Uint8Array(publicKeyObj);
}
