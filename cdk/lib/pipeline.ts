import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as cdk from 'aws-cdk-lib';

export function createArtilleryPipeline(scope: Construct, buildProject: codebuild.IProject): codepipeline.Pipeline {
  const sourceOutput = new codepipeline.Artifact();
  const pipeline = new codepipeline.Pipeline(scope, 'ArtilleryPipeline', {
    pipelineName: 'ArtilleryFargatePipeline',
  });
  pipeline.addStage({
    stageName: 'Source',
    actions: [
      new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: 'ShakMR',
        repo: 'cdk-test',
        branch: 'primary',
        oauthToken: cdk.SecretValue.secretsManager('GITHUB_TOKEN'),
        output: sourceOutput,
        trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
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
  return pipeline;
} 