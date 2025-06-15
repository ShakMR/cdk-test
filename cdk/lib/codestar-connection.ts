import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as codestarconnections from 'aws-cdk-lib/aws-codestarconnections';

interface CodeStarConnectionProps extends cdk.StackProps {
  /**
   * The name of the CodeStar Connection.
   */
  readonly connectionName: string;
  /**
   * The owner of the GitHub repository (e.g., your GitHub username or organization name).
   */
  readonly owner: string;
  /**
   * The name of the GitHub repository.
   */
  readonly repo: string;
}

export class GitHubCodeStarConnection extends Construct {
  public readonly connectionArn: string;

  constructor(scope: Construct, id: string, props: CodeStarConnectionProps) {
    super(scope, id);

    // Crea una nueva conexión de CodeStar para GitHub
    const connection = new codestarconnections.CfnConnection(this, 'GitHubConnection', {
      connectionName: props.connectionName,
      providerType: 'GitHub', // Especifica GitHub como proveedor
      // Tags opcionales para la conexión
      tags: [{
        key: 'Owner',
        value: props.owner,
      },
      {
        key: 'Repository',
        value: props.repo,
      }],
    });

    this.connectionArn = connection.attrConnectionArn;

    // Exporta el ARN de la conexión como una salida de CloudFormation
    new cdk.CfnOutput(this, 'CodeStarConnectionArn', {
      value: this.connectionArn,
      description: 'ARN de la conexión de AWS CodeStar para GitHub',
      exportName: `${cdk.Aws.STACK_NAME}-GitHubConnectionArn`,
    });
  }
}
