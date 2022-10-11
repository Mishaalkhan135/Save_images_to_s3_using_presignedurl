// Import Types
import {

	PlatformApiResponse,
} from "../utils/types";
import updateUserProfile from "./user/update_user_profile";

// ============================================================================
// Main Handler
// ============================================================================
export const handler: AppSyncResolverHandler<
	PlatformApiResponse
> = async (event) => {
	const headers = event.request.headers;
	console.log(event);

	console.log("Headers: ", headers);
	console.log("Environment Variables : ", environmentVariables);

	//============================================================================
	// Switch case on FieldNames
	//============================================================================

	switch (event.info.fieldName) {

		// User profile image
	
		case "update_user_profile":
			return await updateUserProfile(event.arguments.user_id);
		default:
			return {
				error: {
					status_code: 400,
					message: "Bad Request: Invalid Request.",
				},
			};
	}
};
