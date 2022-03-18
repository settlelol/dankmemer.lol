/**
 * Originally created by Aetheryx for the webhook-server:
 * https://github.com/DankMemer/webhook-server/blob/master/util/validatePayPalIdentity.js
 */

import axios from "axios";
import { unsigned } from "buffer-crc32";
import { createVerify } from "crypto";
import { NextApiRequest } from "next";
import { stripeConnect } from "src/util/stripe";
import Stripe from "stripe";
import { inspect } from "util";
import { createPayPal } from "../PayPalEndpoint";
import { PayPalCartItem } from "../types";
import { LinkDescription } from "./Products";
import { WebhookPaymentEvents } from "./Simulations";

let hostURL =
	process.env.NODE_ENV === "production"
		? "api.paypal.com"
		: "api.sandbox.paypal.com";

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

export interface PayPalEvent {
	type: WebhookPaymentEvents;
	data: PayPalEventData;
}

interface PayPalEventData {
	id: string;
	purchasedBy?: string;
	purchasedFor?: string;
	isGift?: Boolean;
	total?: string;
	items?: PayPalCartItem[];
}

export default class Webhooks {
	/**
	 * TODO:(InBlue) Implement discounts
	 */
	public constructEvent(req: NextApiRequest): Promise<PayPalEvent> {
		const stripe = stripeConnect();
		return new Promise(async (resolve, reject) => {
			const httpClient = await createPayPal();
			let result: PayPalEvent = {
				type: req.body.event_type,
				data: { id: req.body.resource.id },
			};
			const { valid, error } = await this.verifyRequest(req);
			if (!valid) {
				reject(Error(error));
			}

			const orderUrl: LinkDescription = req.body.resource.links.find(
				(link: LinkDescription) => link.rel === "up"
			);

			if (!orderUrl) {
				return reject(
					Error(`Event '${req.body.event_type}' is unsupported.`)
				);
			}

			const { data } = await httpClient(orderUrl.href);
			const cartItems: PayPalCartItem[] =
				data.purchase_units[0].items.filter(
					(item: PayPalCartItem) =>
						item.sku.split(":")[0] !== "SALESTAX"
				);

			for (let i = 0; i < cartItems.length; i++) {
				const id = cartItems[i].sku.split(":")[0];
				const interval = cartItems[i].sku.split(":")[1] as
					| "single"
					| "day"
					| "week"
					| "month"
					| "year";
				const stripeProduct = await stripe.products.retrieve(id);
				if (!stripeProduct) {
					reject(
						Error(
							`Received unknown product (name=${cartItems[i].name} id/sku=${cartItems[i].sku}) during paypal checkout.`
						)
					);
					break;
				}
				let query: Stripe.PriceListParams =
					interval !== "single"
						? {
								product: stripeProduct.id,
								recurring: { interval },
						  }
						: { product: stripeProduct.id };
				const { data: prices } = await stripe.prices.list(query);
				if (
					(prices[0].unit_amount! / 100).toFixed(2) !==
					cartItems[i].unit_amount.value
				) {
					return reject(
						Error(
							`Mismatched price of ${cartItems[i].name} (id: ${cartItems[i].sku}).`
						)
					);
				}
			}
			const purchasedBy = data.purchase_units[0].custom_id.split(":")[0];
			const purchasedFor = data.purchase_units[0].custom_id.split(":")[1];
			const isGift = JSON.parse(
				data.purchase_units[0].custom_id.split(":")[2]
			);
			result.data = {
				...result.data,
				purchasedBy,
				purchasedFor,
				isGift,
				total: data.purchase_units[0].amount.value,
				items: cartItems,
			};
			resolve(result);
		});
	}

	private async verifyRequest(
		req: NextApiRequest
	): Promise<ValidRequest | InvalidRequest> {
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
				valid: false,
				error: "Unsupported authentication algorithm",
			};
		}

		if (certificateUrl.host !== hostURL) {
			console.error(
				`Received Webhook from unexpected host: ${certificateUrl.host}`
			);
			return {
				valid: false,
				error: "Unexpected certificate host",
			};
		}

		const { data: certificate } = await axios(certificateUrl.href);
		if (!certificate) {
			console.error(
				`Unable to get certificate from ${certificateUrl.href}`
			);
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
