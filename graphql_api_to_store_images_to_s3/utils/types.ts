// Platform API Response Type for images

export type PlatformApiResponse = {
	id?: string;
	pre_signed_url_object?: string;
	success?: {
		message: string;
		status_code: number;
	};
	error?: {
		message: string;
		status_code: number;
	};
};

// Lambda Required Types

export interface PlatformApiArguments {
	// user id
	user_id: string;
}

