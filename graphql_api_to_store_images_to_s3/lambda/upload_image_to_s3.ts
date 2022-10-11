import { S3 } from "aws-sdk";
const UploadBucket = process.env.S3_BUCKET;

// Importing Types
import { PlatformApiResponse } from "../../utils/types";

export default async (user_id: string): Promise<PlatformApiResponse> => {
	// user_id = user_id.trim();
	if (user_id === "") {
		return {
			error: {
				message: "Bad Request: Required data does not exist.",
				status_code: 400,
			}
		}
	}
	let imagePath: string = `user/profile/${user_id}`;

	try {
		const signedUrl = await createPresignedPost(imagePath);
		console.log(signedUrl);

		const stringifiedData = JSON.stringify(signedUrl);

		return {
			pre_signed_url_object: stringifiedData,
		};
	} catch (err) {
		return {
			error: {
				message: "Server Error: Sorry! Something went wrong in uploading profile.",
				status_code: 400,
			}
		}
	}
};

export function createPresignedPost(
	filePath: string
): Promise<S3.PresignedPost> {
	const params = {
		Bucket: UploadBucket,
		Fields: { key: filePath, acl: "public-read" },
		Conditions: [
			// content length restrictions: 0-1MB]
			["content-length-range", 0, 5000000],
			// specify content-type to be more generic- images only
			// ['starts-with', '$Content-Type', 'image/'],
			["starts-with", "$Content-Type", "image/"],
		],
		// number of seconds for which the presigned policy should be valid
		Expires: 600,
	};

	//const s3 = new S3();

	const s3 = new S3({
		endpoint: "s3-website-us-east-1.amazonaws.com",
		region: "us-east-1",
		credentials: {
			accessKeyId: "AKIA3UWGVZZJ5OIMZCBU",
			secretAccessKey: "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",
		},
	});

	return s3.createPresignedPost(
		params
	) as unknown as Promise<S3.PresignedPost>;
}
