/**
 * Originally created by Aetheryx for the webhook-server:
 * https://github.com/DankMemer/webhook-server/blob/master/util/validatePayPalIdentity.js
 */

import axios from "axios";
import { unsigned } from "buffer-crc32";
import { createVerify } from "crypto";
import { NextApiRequest } from "next";
import { Payer } from "../types/Orders/Payer";
import { PurchaseUnit } from "../types/Orders/PurchaseUnit";
import { LinkDescription } from "./Products";

let hostURL =
	process.env.NODE_ENV === "production" && !process.env.IN_TESTING ? "api.paypal.com" : "api.sandbox.paypal.com";

interface ValidRequest {
	valid: Boolean;
	error?: never;
	message: string;
}

interface InvalidRequest {
	valid: Boolean;
	error: string;
	message?: never;
}

export enum WebhookEvents {
	CAPTURE_COMPLETED = "PAYMENT.CAPTURE.COMPLETED",
	CAPTURE_DENIED = "PAYMENT.CAPTURE.DENIED",
	CAPTURE_PENDING = "PAYMENT.CAPTURE.PENDING",
	CAPTURE_REFUNDED = "PAYMENT.CAPTURE.REFUNDED",
	CAPTURE_REVERSED = "PAYMENT.CAPTURE.REVERSED",
	PLAN_CREATED = "BILLING.PLAN.CREATED",
	SUBSCRIPTION_CANCELLED = "BILLING.SUBSCRIPTION.CANCELLED",
	PRODUCT_CREATED = "CATALOG.PRODUCT.CREATED",
	SALE_COMPLETED = "PAYMENT.SALE.COMPLETED",
}

export interface PayPalEvent {
	type: WebhookEvents;
	data: PayPalWebhookResource;
}

export interface PayPalWebhookResource {
	id: string;
	custom?: string; // Custom assigned id to the resource
	custom_id?: string; // Same as above
	update_time: string;
	create_time: string;
	purchase_units?: PurchaseUnit[];
	product_id?: string;
	name?: string;
	links: LinkDescription[];
	intent?: string;
	payer?: Payer;
	subscriber?: Payer; // Same as previous prop
	status?: string;
	plan_id?: string;
	billing_agreement_id?: string;
}

export default class Webhooks {
	public constructEvent(req: NextApiRequest): Promise<PayPalEvent> {
		return new Promise(async (resolve, reject) => {
			let result: PayPalEvent = {
				type: req.body.event_type,
				data: req.body.resource,
			};
			const { valid, error } = await this.verifyRequest(req);
			if (!valid) {
				reject(Error(error));
			}

			if (!Object.values(WebhookEvents).includes(req.body.event_type)) {
				return reject(Error(`Event '${req.body.event_type}' is unsupported.`));
			}

			resolve(result);
		});
	}

	private async verifyRequest(req: NextApiRequest): Promise<ValidRequest | InvalidRequest> {
		const signature: string = req.headers["paypal-transmission-sig"]?.toString()!;
		const authAlgorithm: string = req.headers["paypal-auth-algo"]?.toString()!;
		const certificateUrl: URL = new URL(req.headers["paypal-cert-url"]?.toString() ?? "");

		if (authAlgorithm !== "SHA256withRSA") {
			console.error(
				`Cannot verify signature with given algorithm, expected 'SHA256withRSA' and received '${authAlgorithm}'`
			);
			return {
				valid: false,
				error: "Unsupported authentication algorithm",
			};
		}

		if (certificateUrl.host !== hostURL) {
			console.error(`Received Webhook from unexpected host: ${certificateUrl.host}`);
			return {
				valid: false,
				error: "Unexpected certificate host",
			};
		}

		const { data: certificate } = await axios(certificateUrl.href);
		if (!certificate) {
			console.error(`Unable to get certificate from ${certificateUrl.href}`);
			return {
				valid: false,
				error: `Unable to get certificate from ${certificateUrl.href}`,
			};
		}

		const verificationInput: string = [
			req.headers["paypal-transmission-id"],
			req.headers["paypal-transmission-time"],
			process.env.PAYPAL_WEBHOOK_ID,
			unsigned(Buffer.from(JSON.stringify(req.body))),
		].join("|");

		const validation = createVerify("sha256WithRSAEncryption")
			.update(verificationInput)
			.verify(certificate, signature, "base64");

		if (!validation) {
			return {
				valid: false,
				error: "Signature verification failed.",
			};
		} else {
			return {
				valid: true,
				message: "Signature verified.",
			};
		}
	}
}
