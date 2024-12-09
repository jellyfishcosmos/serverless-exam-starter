import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { MovieAward } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieAwardQueryParams"] || {} 
);

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const awardBody = parameters?.awardBody?.toLowerCase(); 
    const min =event.queryStringParameters?.min? parseInt(event.queryStringParameters.min) : undefined; //add query param for min 

    if (!movieId || !awardBody) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movieId" }),
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
          message: `needs to match schema`,
          schema: schema.definitions["MovieAwardQueryParams"],
        }),
      };
    }

    let commandInput: QueryCommandInput = {
      TableName: process.env.AWARDS_TABLE_NAME,
      KeyConditionExpression: "movieId = :m and awardBody = :a",
      ExpressionAttributeValues: {
        ":m": movieId,
        ":a": awardBody,
      },
    };

    if (queryParams) {
      if ("awardDescription" in queryParams) {
        commandInput = {
          ...commandInput,
          FilterExpression: "contains(awardDescription, :desc)",
          ExpressionAttributeValues: {
            ...commandInput.ExpressionAttributeValues,
            ":desc": queryParams.awardDescription,
          },
        };
      }
    }

    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    if (!commandOutput.Items || commandOutput.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No awards found for the given movieId and awardBody" }),
      };
    }
    const numAwards = commandOutput.Items.length; //check num of awards

    if (min !== undefined && numAwards < min) { //if less than min
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Request failed" }),
      };
    }

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
    console.log("Error: ", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

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
