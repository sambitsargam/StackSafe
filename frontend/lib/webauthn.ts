import {
  startRegistration,
  startAuthentication,
  base64URLStringToBuffer,
  bufferToBase64URLString,
} from "@simplewebauthn/browser";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const WEBAUTHN_RP_ID = "stacksafe.local";
const WEBAUTHN_RP_NAME = "StackSafe";
const WEBAUTHN_ORIGIN = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export async function generateRegistrationChallenge() {
  const options = await generateRegistrationOptions({
    rpID: WEBAUTHN_RP_ID,
    rpName: WEBAUTHN_RP_NAME,
    userID: new Uint8Array(16),
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

export async function generateRandomChallenge(length: number = 32): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function challengeToHex(challenge: Uint8Array): string {
  return "0x" + Array.from(challenge).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function derivePublicKeyFromCredential(credential: any): Promise<Uint8Array> {
  const publicKeyObj = credential.response.getPublicKey();
  if (!publicKeyObj) throw new Error("Failed to extract public key");
  return new Uint8Array(publicKeyObj);
}
