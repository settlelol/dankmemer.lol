import { AllowedMethods } from "..";
import { createPayPal } from "../PayPalEndpoint";

interface ProductRequestOptions {
	/**
	 * @description The number of items to return in the response object
	 * @range 1 <-> 20
	 */
	page_size?: number;

	/**
	 * @description A non-zero integer which is the start index list of items that are returned in the response.
	 * 				The combination of `page_size` and `page` will return the requested amount from that page,
	 * 				for example; `page=1` and `page_size=20` will return the first 20 items, `page=2` and `page_size=20`
	 * 				will return the next 20 items.
	 * @range 1 <-> 100000
	 */
	page?: number;

	/**
	 * @description Indicates whether to show the total items and total pages in the response.
	 */
	total_required?: Boolean;
}

interface ProductCreateHeaders {
	Prefer: "minimal" | "representation";
	"PayPal-Request-Id": string;
}

interface ProductCreateBody {
	id?: string;
	name: string;
	description?: string;
	type: "PHYSICAL" | "DIGITAL" | "SERVICE";
	image_url?: string;
	home_url?: string;
}

interface ProductListResponse {
	products?: ProductCollectionElement[];
	links?: LinkDescription[];
	total_items?: number;
	total_pages?: number;
}

interface ProductCreateResponse extends ProductCreateBody {
	create_time?: string;
	update_time?: string;
	links?: LinkDescription[];
}

interface ResponseError {
	error: string;
	error_description: string;
}

export type LinkDescription = {
	href: string;
	rel: string;
	method?: AllowedMethods;
};

export type ProductCollectionElement = {
	id: string;
	name: string;
	description: string;
	create_time: string;
	links: string;
};

export default class Products {
	public async list(options?: ProductRequestOptions) {
		const httpClient = await createPayPal();

		let queryParameters: string = "";
		if (options) {
			queryParameters =
				"?" +
				Object.keys(options)
					// @ts-ignore
					.map((key: any) => `${key}=${options[key]}`)
					.join("&");
		}

		const res = await httpClient({
			url: `/v1/catalogs/products${queryParameters}`,
			method: "GET",
		});
		const data: ProductListResponse | ResponseError = res.data;
		return data;
	}

	public async create(
		body: ProductCreateBody,
		headers?: ProductCreateHeaders | null
	) {
		const httpClient = await createPayPal();

		let queryParameters: string = "";
		const res = await httpClient({
			url: `/v1/catalogs/products${queryParameters}`,
			method: "POST",
			data: body,
			headers,
		});
		const data: ProductCreateResponse | ResponseError = res.data;
		return data;
	}

	public async delete(id: string) {
		const httpClient = await createPayPal();

		const res = await httpClient({
			url: `/v1/catalogs/products/${id}`,
			method: "PATCH",
			data: [
				{
					op: "remove",
					path: "/",
				},
			],
		});
	}
}
