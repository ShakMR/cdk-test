import { Construct } from 'constructs';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';

export function createArtilleryBuildProject(scope: Construct, role: iam.IRole): codebuild.PipelineProject {
  return new codebuild.PipelineProject(scope, 'ArtilleryFargateBuild', {
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // Node 18+
      privileged: false,
    },
    role,
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
} 