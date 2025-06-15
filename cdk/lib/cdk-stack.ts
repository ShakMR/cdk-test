import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // CodeCommit repository for Artillery tests
    const repo = new codecommit.Repository(this, 'ArtilleryTestsRepo', {
      repositoryName: 'artillery-tests',
      description: 'Repository for Artillery load test configs and scripts',
    });

    // IAM Role for CodeBuild with Artillery Fargate permissions (replace ACCOUNT_ID)
    const artilleryFargateRole = new iam.Role(this, 'ArtilleryFargateRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Role for CodeBuild to run Artillery tests in Fargate',
    });
    artilleryFargateRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'iam:CreateRole', 'iam:GetRole', 'iam:AttachRolePolicy', 'iam:CreatePolicy', 'iam:CreateServiceLinkedRole', 'iam:PassRole',
        'sqs:*', 'ecs:ListClusters', 'ecs:CreateCluster', 'ecs:RegisterTaskDefinition', 'ecs:DeregisterTaskDefinition',
        'ecs:DescribeClusters', 'ecs:ListContainerInstances', 'ecs:SubmitTaskStateChange', 'ecs:DescribeTasks', 'ecs:ListTasks',
        'ecs:ListTaskDefinitions', 'ecs:DescribeTaskDefinition', 'ecs:StartTask', 'ecs:StopTask', 'ecs:RunTask',
        's3:CreateBucket', 's3:DeleteObject', 's3:GetObject', 's3:GetObjectAcl', 's3:GetObjectTagging', 's3:GetObjectVersion',
        's3:PutObject', 's3:PutObjectAcl', 's3:ListBucket', 's3:GetBucketLocation', 's3:GetBucketLogging', 's3:GetBucketPolicy',
        's3:GetBucketTagging', 's3:PutBucketPolicy', 's3:PutBucketTagging', 's3:PutMetricsConfiguration', 's3:GetLifecycleConfiguration',
        's3:PutLifecycleConfiguration', 'logs:PutRetentionPolicy', 'secretsmanager:GetSecretValue', 'ssm:PutParameter', 'ssm:GetParameter',
        'ssm:GetParameters', 'ssm:DeleteParameter', 'ssm:DescribeParameters', 'ssm:GetParametersByPath', 'ec2:DescribeRouteTables',
        'ec2:DescribeVpcs', 'ec2:DescribeSubnets', 'sqs:ListQueues'
      ],
      resources: ['*'], // For a real deployment, scope these down to your account/resources
    }));

    // CodeBuild project to run Artillery in Fargate
    const buildProject = new codebuild.PipelineProject(this, 'ArtilleryFargateBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // Node 18+
        privileged: false,
      },
      role: artilleryFargateRole,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: 18 },
            commands: [
              'npm install -g artillery',
            ],
          },
          build: {
            commands: [
              'artillery run-fargate src/artilley-config.yml',
            ],
          },
        },
      }),
    });

    // Pipeline with CodeCommit source
    const sourceOutput = new codepipeline.Artifact();
    const pipeline = new codepipeline.Pipeline(this, 'ArtilleryPipeline', {
      pipelineName: 'ArtilleryFargatePipeline',
    });
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: repo,
          output: sourceOutput,
          branch: 'main', // Change if your default branch is different
        }),
      ],
    });
    pipeline.addStage({
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'RunArtilleryFargate',
          project: buildProject,
          input: sourceOutput,
        }),
      ],
    });

    // To specify account/region, uncomment and set in bin/cdk.ts:
    // env: { account: '123456789012', region: 'us-east-1' },
  }
}
