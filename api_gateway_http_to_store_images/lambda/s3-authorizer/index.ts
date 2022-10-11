import * as AWS from "aws-sdk";
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();

const UploadBucket = process.env.S3_BUCKET;

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300;

// Main Lambda entry point
exports.handler = async (event: any) => {
	const randomID = Math.random() * 1000000;
	const Key = `${randomID}.jpg`;

	// Get signed URL from S3
	const s3Params = {
		Bucket: UploadBucket,
		Key,
		Expires: URL_EXPIRATION_SECONDS,
		ContentType: "image/jpeg",
	};

	console.log("Params: ", s3Params);
	const uploadURL = await s3.getSignedUrlPromise("putObject", s3Params);
	console.log(uploadURL);
	const reponse = {
		uploadURL,
		Key,
	};
	return {
		statusCode: 200,
		body: JSON.stringify(reponse),
	};
};
