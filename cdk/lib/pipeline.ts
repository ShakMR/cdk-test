import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
// No es necesario importar 'aws-cdk-lib' si solo se usa para SecretValue,
// pero si lo estás usando en otros lugares, mantenlo.

export function createArtilleryPipeline(
  scope: Construct,
  buildProject: codebuild.IProject,
  connectionArn: string
): codepipeline.Pipeline {
  const sourceOutput = new codepipeline.Artifact();
  const pipeline = new codepipeline.Pipeline(scope, 'ArtilleryPipeline', {
    pipelineName: 'ArtilleryFargatePipeline',
  });
  pipeline.addStage({
    stageName: 'Source',
    actions: [
      new codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: 'GitHub_Source',
        owner: 'ShakMR', // Tu propietario de GitHub
        repo: 'cdk-test', // Tu nombre de repositorio
        branch: 'primary', // Tu rama principal (ej. main, master)
        output: sourceOutput,
        // Usa el ARN de la conexión que se pasa como argumento
        connectionArn: connectionArn,
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
