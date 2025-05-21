'use server';

/**
 * @fileOverview Generates market sentiment analysis for cryptocurrencies using data from stock APIs.
 *
 * - marketSentimentAnalysis - A function that generates market sentiment analysis.
 * - MarketSentimentAnalysisInput - The input type for the marketSentimentAnalysis function.
 * - MarketSentimentAnalysisOutput - The return type for the marketSentimentAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketSentimentAnalysisInputSchema = z.object({
  btcPrice: z.number().describe('The current price of Bitcoin.'),
  ethPrice: z.number().describe('The current price of Ethereum.'),
  spyPrice: z.number().describe('The current price of SPY.'),
  spxPrice: z.number().describe('The current price of SPX.'),
  dxyPrice: z.number().describe('The current price of the US Dollar Index (DXY).'),
  us10yPrice: z.number().describe('The current US 10-Year Treasury Yield (as a percentage, e.g., 4.25 for 4.25%).'),
});
export type MarketSentimentAnalysisInput = z.infer<typeof MarketSentimentAnalysisInputSchema>;

const MarketSentimentAnalysisOutputSchema = z.object({
  overallSentiment: z.string().describe('Overall market sentiment analysis based on the provided data.'),
  btcSentiment: z.string().describe('Sentiment analysis specific to Bitcoin.'),
  ethSentiment: z.string().describe('Sentiment analysis specific to Ethereum.'),
  stockMarketSentiment: z
    .string()
    .describe('Sentiment analysis of the stock market based on SPY and SPX data.'),
});
export type MarketSentimentAnalysisOutput = z.infer<typeof MarketSentimentAnalysisOutputSchema>;

export async function marketSentimentAnalysis(
  input: MarketSentimentAnalysisInput
): Promise<MarketSentimentAnalysisOutput> {
  return marketSentimentAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketSentimentAnalysisPrompt',
  input: {schema: MarketSentimentAnalysisInputSchema},
  output: {schema: MarketSentimentAnalysisOutputSchema},
  prompt: `You are an expert financial analyst specializing in cryptocurrency and stock market sentiment analysis.

  Based on the provided data, generate a comprehensive market sentiment analysis.

  Bitcoin Price: {{btcPrice}}
  Ethereum Price: {{ethPrice}}
  SPY Price: {{spyPrice}}
  S&P 500 Price: {{spxPrice}}
  US Dollar Index (DXY) Price: {{dxyPrice}}
  US 10-Year Treasury Yield: {{us10yPrice}}%

  Consider the relationships between these assets to provide nuanced insights.
  For example, a rising stock market might indicate a positive sentiment that could affect crypto, or vice versa.
  A strong US Dollar (rising DXY) can sometimes put downward pressure on risk assets like Bitcoin.
  Rising treasury yields (US10Y) can indicate a risk-off sentiment in traditional markets, which might also impact crypto.
  Use the provided information to determine overall sentiment, as well as sentiment for individual cryptocurrencies and the stock market.
  Be concise and provide actionable insights.

  Output the response as a JSON object.
  `,
});

const marketSentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'marketSentimentAnalysisFlow',
    inputSchema: MarketSentimentAnalysisInputSchema,
    outputSchema: MarketSentimentAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
