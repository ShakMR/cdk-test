import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { createArtilleryFargateRole } from './artillery-role';
import { createArtilleryBuildProject } from './build-project';
import { createArtilleryPipeline } from './pipeline';
import { createMockApiGateway } from './apigateway';
// import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
// import * as codebuild from 'aws-cdk-lib/aws-codebuild';
// import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
// import * as iam from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the IAM role for Artillery/CodeBuild
    const artilleryFargateRole = createArtilleryFargateRole(this);

    // Create the CodeBuild project
    const buildProject = createArtilleryBuildProject(this, artilleryFargateRole);

    // Create the CodePipeline
    createArtilleryPipeline(this, buildProject);

    // Create the API Gateway with a /point mock endpoint
    const api = createMockApiGateway(this);

    // Output the API Gateway endpoint URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'The endpoint URL of the API Gateway',
    });

    // To specify account/region, uncomment and set in bin/cdk.ts:
    // env: { account: '123456789012', region: 'us-east-1' },
  }
}
