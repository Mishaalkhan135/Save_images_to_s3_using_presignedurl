import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
	Stack,
	StackProps,
	CfnOutput,
	Duration,
	Expiration,
} from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export class GraphqlApiToStoreImagesToS3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //========================================================================
		// create content s3 bucket to store user profile images
		//========================================================================
		const inputBucket = new s3.Bucket(this, "images_bucket", {
			bucketName: "images_bucket",
			cors: [
				{
					allowedMethods: [
						s3.HttpMethods.GET,
						s3.HttpMethods.POST,
						s3.HttpMethods.PUT,
					],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"],
				},
			],
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			publicReadAccess: false,
		});

		//================================================================================
		//	Appsync : Platfrom API
		//================================================================================
		const platformApi = new appsync.GraphqlApi(
			this,
			"platform-api",
			{
				name: "platform-api",
				schema: appsync.Schema.fromAsset("graphql/schema.gql"),
				authorizationConfig: {
					defaultAuthorization: {
						authorizationType: appsync.AuthorizationType.API_KEY,
						apiKeyConfig: {
							expires: Expiration.after(Duration.days(365)),
						},
					},
				},
			}
		);

		//========================================================================
		// create lambda policy statement for operating over s3
		//========================================================================
		var lambdaS3PolicyStatement = new iam.PolicyStatement();
		lambdaS3PolicyStatement.addActions("s3:PutObject", "s3:GetObject");
		lambdaS3PolicyStatement.addResources(inputBucket.bucketArn + "/*");

		//================================================================================
		// Lambda : Lambda Function for Platform API
		//================================================================================
		const platformApiLambda = new lambda.Function(
			this,
		"platform-api-lambda",
			{
				functionName:"platform-api-lambda",
				runtime: lambda.Runtime.NODEJS_16_X,
				code: lambda.Code.fromAsset("lambda"),
				handler: "PlatformApiLambda.handler",
				// This may need to be increased later
				timeout: Duration.minutes(15),
				environment: {
					S3_BUCKET: inputBucket.bucketName,
			  	initialPolicy: [lambdaS3PolicyStatement],
			}
		);

		inputBucket.grantPut(platformApiLambda);
		inputBucket.grantPutAcl(platformApiLambda);



		//================================================================================
		// Set 'platformApiLambda' Lambda as a Datasource for Platform API
		//================================================================================
		const platformApiDatasource = platformApi.addLambdaDataSource(
			"platform-api-datasource",
			platformApiLambda
		);

		//================================================================================
		// Defining Resolver for 'platformApiDatasource' for images
		//================================================================================
		platformApiDatasource.createResolver({
			typeName: "Mutation",
			fieldName: "update_user_profile",
		});

		//================================================================================
		// Outputs
		//================================================================================
		new CfnOutput(this, `${service}-${stage}-platform-api-url`, {
			value: platformApi.graphqlUrl,
		});
		new cdk.CfnOutput(this, "GraphQLAPIKey", {
			value: platformApi.apiKey || "",
		});

  
  }
}
