import axios, { AxiosInstance } from "axios";
import qs from "qs";

let instance: AxiosInstance | null = null;
let baseURL =
	process.env.NODE_ENV === "production" && !process.env.IN_TESTING
		? "https://api-m.paypal.com"
		: "https://api-m.sandbox.paypal.com";

export async function createPayPal(reset = false) {
	if (instance && !reset) {
		return instance;
	}

	try {
		let { data } = await axios({
			method: "POST",
			url: `${baseURL}/v1/oauth2/token`,
			data: qs.stringify({
				grant_type: "client_credentials",
			}),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
				password: process.env.PAYPAL_CLIENT_SECRET!,
			},
		});

		regenerateAccessToken(data.expires_in);

		return axios.create({
			baseURL: baseURL,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${data.access_token}`,
			},
		});
	} catch (e: any) {
		console.error(e);
		throw new Error(`Failed to create PayPal REST Client: ${e.message.replace(/"/g, "")}`);
	}
}

const regenerateAccessToken = (expiresIn: number) => {
	setTimeout(() => {
		createPayPal(true);
	}, expiresIn);
};
