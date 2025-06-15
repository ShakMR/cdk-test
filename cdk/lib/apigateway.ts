import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export function createMockApiGateway(scope: Construct): apigateway.RestApi {
  const api = new apigateway.RestApi(scope, 'MockApi', {
    restApiName: 'Mock Example API',
    description: 'API Gateway with a /point mock endpoint',
    deployOptions: {
      stageName: 'prod',
    },
  });

  const point = api.root.addResource('point');
  point.addMethod('GET', new apigateway.MockIntegration({
    integrationResponses: [
      {
        statusCode: '200',
        responseTemplates: {
          'application/json': '{ "message": "This is a mock response from /point" }',
        },
      },
    ],
    passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      'application/json': '{ "statusCode": 200 }',
    },
  }), {
    methodResponses: [
      {
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      },
    ],
  });

  return api;
} 