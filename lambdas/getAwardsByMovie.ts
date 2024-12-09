import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { movieAwards } from "../seed/movies";  // Assuming the movieAwards data is imported from a shared module

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Extract awardBody and movieId from the path parameters
    const { awardBody, movieId } = event.pathParameters;

    // Ensure that movieId is a number and awardBody is a string (case insensitive)
    const movieIdInt = parseInt(movieId);
    if (isNaN(movieIdInt)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Invalid movieId. It should be a number.",
        }),
      };
    }

    // Filter the movieAwards array for the specific movieId and awardBody (case insensitive)
    const filteredAwards = movieAwards.filter(
      (award) =>
        award.movieId === movieIdInt && 
        award.awardBody.toLowerCase() === awardBody.toLowerCase()
    );

    // If no awards are found, return a 404
    if (filteredAwards.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `No awards found for movieId ${movieId} and awardBody ${awardBody}`,
        }),
      };
    }

    // Return the matching awards in the response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: filteredAwards }),
    };
  } catch (error: any) {
    // Log and handle unexpected errors
    console.error("Error fetching awards:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "An error occurred while fetching the awards.",
        error: error.message,
      }),
    };
  }
};