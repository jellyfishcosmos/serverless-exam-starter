import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

// Initialize AJV for query parameter validation
const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieCastMemberQueryParams"] || {}
);

// Create DynamoDB Document Client
const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const awardBody = parameters?.awardBody?.toLowerCase();
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    const queryParams = event.queryStringParameters;
    if (queryParams && !isValidQueryParams(queryParams)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect query parameters. Must match schema.`,
          schema: schema.definitions["MovieCastMemberQueryParams"],
        }),
      };
    }

    let commandInput: QueryCommandInput = {
      TableName: process.env.AWARDS_TABLE_NAME, // Ensure your table is properly set
    };

    // Query logic based on the query params
    if (queryParams) {
      if ("awardDescription" in queryParams) {
        commandInput = {
          ...commandInput,
          KeyConditionExpression: "movieId = :m and begins_with(awardDescription, :d)",
          ExpressionAttributeValues: {
            ":m": movieId,
            ":d": queryParams.awardDescription,
          },
        };
      }
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m and awardBody = :a",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":a": awardBody,
        },
      };
    }

    // Execute the query
    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    // Return response with the found awards
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: commandOutput.Items,
      }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Create DynamoDB Document Client
function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}