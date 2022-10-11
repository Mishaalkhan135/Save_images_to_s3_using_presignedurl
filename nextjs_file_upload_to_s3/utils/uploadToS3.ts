import axios from "axios";

export type fields = {
	key: string;
	acl: string;
	bucket: string;
	policy: string;
	"X-Amz-Algorithm": string;
	"X-Amz-Credential": string;
	"X-Amz-Date": string;
	"X-Amz-Signature": string;
};

export async function uploadToS3(fileContents: any, urlFields: fields) {
	const fields = {
		...urlFields,
	};
	console.log("line 18");

	const formData = new FormData();
	Object.entries(fields).forEach(([k, v]) => {
		formData.append(k, v);
	});
	formData.append("Content-Type", fileContents.type);
	formData.append("file", fileContents); // The file has be the last element

	const response = await axios.post(
		`https://s3.amazonaws.com/ecom-platform-api-test-images`,
		formData,
		{
			headers: { "Content-Type": "multipart/form-data" },
		}
	);

	console.log(response);
}
