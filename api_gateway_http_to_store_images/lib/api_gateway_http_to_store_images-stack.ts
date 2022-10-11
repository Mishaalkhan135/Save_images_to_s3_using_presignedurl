import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ApiGatewayHttpToStoreImagesStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const inputBucket = new s3.Bucket(this, "bucket", {
			encryption: BucketEncryption.S3_MANAGED,
			publicReadAccess: false,
			cors: [
				{
					allowedMethods: [
						s3.HttpMethods.GET,
						s3.HttpMethods.POST,
						s3.HttpMethods.PUT,
						s3.HttpMethods.DELETE,
						s3.HttpMethods.HEAD,
					],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"],
					exposedHeaders: [],
				},
			],
		});

		const httpApi = new apigwv2.HttpApi(this, "api", {
			apiName: `user-http-api`,
			corsPreflight: {
				allowHeaders: [
					"Content-Type",
					"X-Amz-Date",
					"Authorization",
					"X-Api-Key",
				],
				allowMethods: [
					apigwv2.CorsHttpMethod.OPTIONS,
					apigwv2.CorsHttpMethod.GET,
					apigwv2.CorsHttpMethod.POST,
					apigwv2.CorsHttpMethod.PUT,
					apigwv2.CorsHttpMethod.PATCH,
					apigwv2.CorsHttpMethod.DELETE,
				],
				allowCredentials: false,
				allowOrigins: ["*"],
			},
		});

		//========================================================================
		// create lambda policy statement for operating over s3
		//========================================================================
		var lambdaS3PolicyStatement = new iam.PolicyStatement();
		lambdaS3PolicyStatement.addActions("s3:PutObject", "s3:GetObject");
		lambdaS3PolicyStatement.addResources(inputBucket.bucketArn + "/*");

		//========================================================================
		// create lambda function for s3
		//========================================================================
		const s3AuthLambda = new lambda.Function(this, "Lambda", {
			functionName: `user-profile`,
			runtime: lambda.Runtime.NODEJS_14_X,
			handler: "index.handler",
			code: lambda.Code.fromAsset("lambda/s3-authorizer"),
			environment: {
				S3_BUCKET: inputBucket.bucketName,
			},
			initialPolicy: [lambdaS3PolicyStatement],
		});

		inputBucket.grantPut(s3AuthLambda);
		inputBucket.grantPutAcl(s3AuthLambda);

		httpApi.addRoutes({
			path: "/s3-authorizer",
			methods: [apigwv2.HttpMethod.GET],
			integration: new apiGatewayIntegrations.HttpLambdaIntegration(
				"get-url-integration",
				s3AuthLambda
			),
		});

		new cdk.CfnOutput(this, "region", { value: cdk.Stack.of(this).region });
		new cdk.CfnOutput(this, "apiUrl", {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			value: httpApi.url!,
		});
		new cdk.CfnOutput(this, "bucketName", {
			value: inputBucket.bucketName,
		});
	}
}
