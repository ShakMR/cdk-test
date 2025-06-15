import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export function createArtilleryFargateRole(scope: Construct, id = 'ArtilleryFargateRole'): iam.Role {
  const role = new iam.Role(scope, id, {
    assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    description: 'Role for CodeBuild to run Artillery tests in Fargate',
  });

  // CreateOrGetECSRole
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'CreateOrGetECSRole',
    effect: iam.Effect.ALLOW,
    actions: ['iam:CreateRole', 'iam:GetRole', 'iam:AttachRolePolicy'],
    resources: [`arn:aws:iam::${scope.node.tryGetContext('account')}:role/artilleryio-ecs-worker-role`]
  }));

  // CreateECSPolicy
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'CreateECSPolicy',
    effect: iam.Effect.ALLOW,
    actions: ['iam:CreatePolicy'],
    resources: [`arn:aws:iam::${scope.node.tryGetContext('account')}:policy/artilleryio-ecs-worker-policy`]
  }));

  // CreateServiceLinkedRole
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['iam:CreateServiceLinkedRole'],
    resources: ['arn:aws:iam::*:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS*'],
    conditions: {
      'StringLike': {
        'iam:AWSServiceName': 'ecs.amazonaws.com'
      }
    }
  }));

  // PassRole
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['iam:PassRole'],
    resources: [`arn:aws:iam::${scope.node.tryGetContext('account')}:role/artilleryio-ecs-worker-role`]
  }));

  // SQSPermissions
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'SQSPermissions',
    effect: iam.Effect.ALLOW,
    actions: ['sqs:*'],
    resources: [`arn:aws:sqs:*:${scope.node.tryGetContext('account')}:artilleryio*`]
  }));

  // SQSListQueues
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'SQSListQueues',
    effect: iam.Effect.ALLOW,
    actions: ['sqs:ListQueues'],
    resources: ['*']
  }));

  // ECSPermissionsGeneral
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'ECSPermissionsGeneral',
    effect: iam.Effect.ALLOW,
    actions: [
      'ecs:ListClusters',
      'ecs:CreateCluster',
      'ecs:RegisterTaskDefinition',
      'ecs:DeregisterTaskDefinition'
    ],
    resources: ['*']
  }));

  // ECSPermissionsScopedToCluster
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'ECSPermissionsScopedToCluster',
    effect: iam.Effect.ALLOW,
    actions: ['ecs:DescribeClusters', 'ecs:ListContainerInstances'],
    resources: [`arn:aws:ecs:*:${scope.node.tryGetContext('account')}:cluster/*`]
  }));

  // ECSPermissionsScopedWithCondition
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'ECSPermissionsScopedWithCondition',
    effect: iam.Effect.ALLOW,
    actions: [
      'ecs:SubmitTaskStateChange',
      'ecs:DescribeTasks',
      'ecs:ListTasks',
      'ecs:ListTaskDefinitions',
      'ecs:DescribeTaskDefinition',
      'ecs:StartTask',
      'ecs:StopTask',
      'ecs:RunTask'
    ],
    conditions: {
      'ArnEquals': {
        'ecs:cluster': `arn:aws:ecs:*:${scope.node.tryGetContext('account')}:cluster/*`
      }
    },
    resources: ['*']
  }));

  // S3Permissions
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'S3Permissions',
    effect: iam.Effect.ALLOW,
    actions: [
      's3:CreateBucket',
      's3:DeleteObject',
      's3:GetObject',
      's3:GetObjectAcl',
      's3:GetObjectTagging',
      's3:GetObjectVersion',
      's3:PutObject',
      's3:PutObjectAcl',
      's3:ListBucket',
      's3:GetBucketLocation',
      's3:GetBucketLogging',
      's3:GetBucketPolicy',
      's3:GetBucketTagging',
      's3:PutBucketPolicy',
      's3:PutBucketTagging',
      's3:PutMetricsConfiguration',
      's3:GetLifecycleConfiguration',
      's3:PutLifecycleConfiguration'
    ],
    resources: [
      'arn:aws:s3:::artilleryio-test-data-*',
      'arn:aws:s3:::artilleryio-test-data-*/*'
    ]
  }));

  // LogsPermissions
  role.addToPolicy(new iam.PolicyStatement({
    sid: 'LogsPermissions',
    effect: iam.Effect.ALLOW,
    actions: ['logs:PutRetentionPolicy'],
    resources: [`arn:aws:logs:*:${scope.node.tryGetContext('account')}:log-group:artilleryio-log-group/*`]
  }));

  // SecretsManagerPermissions
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue'],
    resources: [`arn:aws:secretsmanager:*:${scope.node.tryGetContext('account')}:secret:artilleryio/*`]
  }));

  // SSMPermissions
  const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'ca-central-1',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
    'ap-south-1', 'ap-east-1', 'ap-northeast-1', 'ap-northeast-2',
    'ap-southeast-1', 'ap-southeast-2', 'me-south-1', 'sa-east-1'
  ];
  
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'ssm:PutParameter',
      'ssm:GetParameter',
      'ssm:GetParameters',
      'ssm:DeleteParameter',
      'ssm:DescribeParameters',
      'ssm:GetParametersByPath'
    ],
    resources: regions.map(region => 
      `arn:aws:ssm:${region}:${scope.node.tryGetContext('account')}:parameter/artilleryio/*`
    )
  }));

  // EC2Permissions
  role.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'ec2:DescribeRouteTables',
      'ec2:DescribeVpcs',
      'ec2:DescribeSubnets'
    ],
    resources: ['*']
  }));

  return role;
} 