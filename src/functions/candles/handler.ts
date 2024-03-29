import { formatClientError, formatJsonResponse, formatServerError } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import axios from 'axios';
import { CandlesQueryParams } from './candles.interface';

export const supportedResolutions = ['1', '5', '10', '15', '30', '60', 'D', 'W', 'M'];

/**
 * Handler for Open High/Low Close Volume data for stocks
 *
 * @param event a {@link ValidatedEventApiGatewayProxyEvent}
 * @returns Lambda Proxy response. Status 200 for successes and 500 for errors
 */
const candles: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  const resolution = event.queryStringParameters.resolution;

  if (!supportedResolutions.includes(resolution)) {
    return formatClientError(`Invalid resolution ${resolution}. Valid values are [${supportedResolutions.join(',')}]`);
  }

  const params: CandlesQueryParams = {
    token: process.env.FINNHUB_TOKEN,
    symbol: event.queryStringParameters.symbol,
    resolution: resolution,
    from: event.queryStringParameters.from,
    to: event.queryStringParameters.to,
  };

  return axios
    .get('https://finnhub.io/api/v1/stock/candle', {
      params: params,
    })
    .then((res) => {
      return formatJsonResponse({
        data: res.data,
      });
    })
    .catch((error) => {
      console.error(error);
      return formatServerError(JSON.stringify({ message: 'Error', ...error }));
    });
};

export const main = middyfy(candles);
