/**
 * Originally created by Aetheryx for the webhook-server:
 * https://github.com/DankMemer/webhook-server/blob/master/util/validatePayPalIdentity.js
 */

import axios from "axios";
import { unsigned } from "buffer-crc32";
import { createVerify } from "crypto";
import { NextApiRequest } from "next";

let hostURL =
	process.env.NODE_ENV === "production"
		? "https://api-m.paypal.com"
		: "https://api-m.sandbox.paypal.com";

export default class Webhooks {
	public async constructEvent(req: NextApiRequest) {
		const signature: string =
			req.headers["paypal-transmission-sig"]?.toString()!;
		const authAlgorithm: string =
			req.headers["paypal-auth-algo"]?.toString()!;
		const certificateUrl: URL = new URL(
			req.headers["paypal-cert-url"]?.toString() ?? ""
		);

		if (authAlgorithm !== "SHA256withRSA") {
			console.error(
				`Cannot verify signature with given algorithm, expected 'SHA256withRSA' and received '${authAlgorithm}'`
			);
			return {
				status: 406,
				error: "Unsupported authentication algorithm",
			};
		}

		if (certificateUrl.host !== hostURL) {
			console.error(
				`Received Webhook from unexpected host: ${certificateUrl.host}`
			);
			return {
				status: 406,
				error: "Unexpected certificate host",
			};
		}

		const { data: certificate } = await axios(certificateUrl.href);
		if (!certificate) {
			console.error(
				`Unable to get certificate from ${certificateUrl.href}`
			);
			return {
				status: 406,
				error: `Unable to get certificate from ${certificateUrl.href}`,
			};
		}

		const verificationInput: string = [
			req.headers["paypal-transmission-id"],
			req.headers["paypal-transmission-time"],
			process.env.PAYPAL_WEBHOOK_ID,
			unsigned(JSON.stringify(req.body)),
		].join("|");

		const validation = createVerify("sha256WithRSAEncryption")
			.update(verificationInput)
			.end()
			.verify(certificate, signature, "base64");

		if (!validation) {
			console.error("Unable to validate signature.");
			console.error(validation);
			return {
				status: 500,
				message: "Signature verification failed.",
			};
		} else {
			console.log("Validated signature");
			console.log(validation);
		}
	}
}
