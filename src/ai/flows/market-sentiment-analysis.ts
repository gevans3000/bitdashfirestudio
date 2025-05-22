'use server';

/**
 * @fileOverview Generates market sentiment analysis for cryptocurrencies using data from stock APIs.
 * Implements caching and throttling to minimize API usage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Cache for storing the last analysis result
let lastAnalysis: {
  timestamp: number;
  input: Record<string, number>;
  output: any;
} | null = null;

// Threshold for considering price changes significant (1% change)
const PRICE_CHANGE_THRESHOLD = 0.01;
// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION_MS = 30 * 60 * 1000;

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
  stockMarketSentiment: z.string().describe('Sentiment analysis of the stock market based on SPY and SPX data.'),
  cached: z.boolean().optional().describe('Whether this result was served from cache'),
});

export type MarketSentimentAnalysisOutput = z.infer<typeof MarketSentimentAnalysisOutputSchema>;

/**
 * Checks if the price change is significant enough to warrant a new analysis
 */
function isSignificantChange(newInput: MarketSentimentAnalysisInput, oldInput: MarketSentimentAnalysisInput): boolean {
  const keys = Object.keys(newInput) as Array<keyof MarketSentimentAnalysisInput>;
  
  return keys.some(key => {
    const oldValue = oldInput[key];
    const newValue = newInput[key];
    if (oldValue === 0) return true; // Avoid division by zero
    const change = Math.abs((newValue - oldValue) / oldValue);
    return change > PRICE_CHANGE_THRESHOLD;
  });
}

/**
 * Main function to get market sentiment analysis with caching
 */
export async function marketSentimentAnalysis(
  input: MarketSentimentAnalysisInput
): Promise<MarketSentimentAnalysisOutput> {
  const now = Date.now();
  
  // Check if we have a cached result that's still valid and the input hasn't changed significantly
  if (lastAnalysis) {
    const cacheAge = now - lastAnalysis.timestamp;
    const isCacheValid = cacheAge < CACHE_DURATION_MS;
    
    if (isCacheValid && !isSignificantChange(input, lastAnalysis.input as MarketSentimentAnalysisInput)) {
      console.log('Serving market sentiment analysis from cache');
      return { ...lastAnalysis.output, cached: true };
    }
  }

  try {
    console.log('Generating new market sentiment analysis');
    const result = await marketSentimentAnalysisFlow(input);
    
    // Cache the result
    lastAnalysis = {
      timestamp: now,
      input: { ...input },
      output: result
    };
    
    return result;
  } catch (error) {
    console.error('Error in market sentiment analysis:', error);
    
    // If we have a cached result, return it even if it's stale
    if (lastAnalysis) {
      console.log('Falling back to cached analysis due to error');
      return { ...lastAnalysis.output, cached: true };
    }
    
    // If no cache is available, return a neutral analysis
    return {
      overallSentiment: 'Neutral - Unable to generate fresh analysis',
      btcSentiment: 'Neutral - Using fallback analysis',
      ethSentiment: 'Neutral - Using fallback analysis',
      stockMarketSentiment: 'Neutral - Using fallback analysis',
      cached: true
    };
  }
}

const prompt = ai.definePrompt({
  name: 'marketSentimentAnalysisPrompt',
  input: { schema: MarketSentimentAnalysisInputSchema },
  output: { schema: MarketSentimentAnalysisOutputSchema },
  prompt: `You are an expert financial analyst specializing in cryptocurrency and stock market sentiment analysis.

  Based on the provided data, generate a comprehensive but concise market sentiment analysis.
  Focus on the most significant trends and relationships between these assets.

  Bitcoin Price: {{btcPrice}}
  Ethereum Price: {{ethPrice}}
  SPY Price: {{spyPrice}}
  S&P 500 Price: {{spxPrice}}
  US Dollar Index (DXY) Price: {{dxyPrice}}
  US 10-Year Treasury Yield: {{us10yPrice}}%

  Key relationships to consider:
  - Stock market (SPY/SPX) and crypto correlation
  - USD strength (DXY) impact on risk assets
  - Treasury yields (US10Y) as a risk indicator
  
  Keep the analysis focused and actionable. Limit to 2-3 key insights.

  Output the response as a JSON object with the following structure:
  {
    "overallSentiment": "Brief overall market sentiment (1-2 sentences)",
    "btcSentiment": "Bitcoin-specific analysis (1 sentence)",
    "ethSentiment": "Ethereum-specific analysis (1 sentence)",
    "stockMarketSentiment": "Stock market analysis (1-2 sentences)"
  }
  `,
});

// Throttle the AI analysis to prevent too many requests
const marketSentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'marketSentimentAnalysisFlow',
    inputSchema: MarketSentimentAnalysisInputSchema,
    outputSchema: MarketSentimentAnalysisOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);
      return { ...output, cached: false };
    } catch (error) {
      console.error('Error in AI analysis flow:', error);
      throw error;
    }
  }
);
